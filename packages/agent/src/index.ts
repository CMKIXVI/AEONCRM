import {
  agentApprovalService,
  agentConversationService,
  agentMessageService,
  companyService,
  contactService,
  dashboardService,
  dealService,
  taskService,
  type DealStage,
} from "@aeoncrm/core";
import { clearPendingApproval, getConversation, remember, setPendingApproval } from "./memory";

export type AgentIntent =
  | "SHOW_SALES" | "ATTENTION_DEALS" | "LIST_COMPANIES" | "LIST_CONTACTS" | "LIST_DEALS"
  | "CREATE_COMPANY" | "CREATE_CONTACT" | "CREATE_DEAL" | "CREATE_TASK" | "MOVE_DEAL" | "UNKNOWN";

export type AgentRequest = {
  message: string;
  approved?: boolean;
  sessionId?: string;
  conversationId?: string;
};

export type AgentPlan = {
  intent: AgentIntent;
  tool: string;
  arguments: Record<string, unknown>;
  requiresApproval: boolean;
  explanation: string;
};

const stages: DealStage[] = ["LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];

function plan(message: string): AgentPlan {
  const text = message.trim();
  const lower = text.toLowerCase();
  if (/show.*sales|sales.*pipeline|my sales/.test(lower)) return { intent: "SHOW_SALES", tool: "dashboard.summary", arguments: {}, requiresApproval: false, explanation: "Read the live sales summary." };
  if (/opportunit|deal.*attention|deal.*risk|need attention/.test(lower)) return { intent: "ATTENTION_DEALS", tool: "deals.findAttention", arguments: {}, requiresApproval: false, explanation: "Find open opportunities that need attention." };
  if (/^(list|show|find).*companies|companies/.test(lower)) return { intent: "LIST_COMPANIES", tool: "companies.list", arguments: {}, requiresApproval: false, explanation: "List CRM companies." };
  if (/^(list|show|find).*contacts|contacts/.test(lower)) return { intent: "LIST_CONTACTS", tool: "contacts.list", arguments: {}, requiresApproval: false, explanation: "List CRM contacts." };
  if (/^(list|show|find).*deals|deals/.test(lower)) return { intent: "LIST_DEALS", tool: "deals.list", arguments: {}, requiresApproval: false, explanation: "List CRM deals." };
  const companyMatch = text.match(/create\s+(.+?)(?:\s+as\s+(?:a\s+)?(?:prospect|company|customer))?$/i);
  if (/create .*company|create .*prospect|add .*company|add .*prospect/.test(lower) && companyMatch) {
    const name = companyMatch[1].replace(/\s+as\s+(?:a\s+)?(?:prospect|company|customer)$/i, "").trim();
    return { intent: "CREATE_COMPANY", tool: "companies.create", arguments: { name }, requiresApproval: true, explanation: `Create company “${name}”.` };
  }
  const moveMatch = text.match(/(?:move|change|set)\s+(?:deal\s+)?(.+?)\s+(?:to|into)\s+(lead|qualified|proposal|negotiation|won|lost)/i);
  if (moveMatch) return { intent: "MOVE_DEAL", tool: "deals.updateStage", arguments: { dealQuery: moveMatch[1].trim(), stage: moveMatch[2].toUpperCase() }, requiresApproval: true, explanation: `Move deal “${moveMatch[1].trim()}” to ${moveMatch[2].toUpperCase()}.` };
  const taskMatch = text.match(/create\s+(?:a\s+)?task\s+(.+)/i);
  if (taskMatch) return { intent: "CREATE_TASK", tool: "tasks.create", arguments: { title: taskMatch[1].trim() }, requiresApproval: true, explanation: `Create task “${taskMatch[1].trim()}”.` };
  return { intent: "UNKNOWN", tool: "none", arguments: {}, requiresApproval: false, explanation: "I could not map that request to an approved CRM capability." };
}

async function ensureConversation(conversationId?: string) {
  if (conversationId) {
    const existing = await agentConversationService.get(conversationId);
    if (existing) return existing;
  }
  return agentConversationService.create("AEON Agent");
}

async function persistMessage(conversationId: string, input: Parameters<typeof agentMessageService.append>[0]) {
  return agentMessageService.append({ ...input, conversationId });
}

export async function runAgent(request: AgentRequest) {
  const sessionId = request.sessionId ?? request.conversationId ?? "default";
  const conversation = await ensureConversation(request.conversationId);
  const p = plan(request.message);
  await persistMessage(conversation.id, { role: "USER", content: request.message, intent: p.intent, tool: p.tool });
  remember(sessionId, { role: "user", content: request.message });

  if (p.intent === "UNKNOWN") {
    await persistMessage(conversation.id, { role: "ASSISTANT", content: p.explanation, intent: p.intent, tool: p.tool });
    return { ok: false, ...p, message: p.explanation, conversationId: conversation.id, history: getConversation(sessionId) };
  }

  if (p.requiresApproval && !request.approved) {
    const message = await persistMessage(conversation.id, {
      role: "ASSISTANT", content: p.explanation, intent: p.intent, tool: p.tool,
      requiresApproval: true, approved: false, metadata: { plan: p },
    });
    const approval = await agentApprovalService.create({ conversationId: conversation.id, messageId: message.id, tool: p.tool, arguments: p.arguments });
    setPendingApproval(sessionId, request.message);
    remember(sessionId, { role: "agent", content: p.explanation, intent: p.intent, tool: p.tool, approved: false });
    return { ok: true, status: "approval_required", plan: p, approvalId: approval.id, message: `Approval required: ${p.explanation}`, conversationId: conversation.id, history: getConversation(sessionId) };
  }

  if (p.requiresApproval) clearPendingApproval(sessionId);
  const result = await executePlan(p);
  await persistMessage(conversation.id, {
    role: "ASSISTANT",
    content: String(result.message ?? p.explanation),
    intent: p.intent,
    tool: p.tool,
    approved: Boolean(request.approved),
    metadata: { status: result.status, data: result.data ?? null },
  });
  remember(sessionId, { role: "agent", content: String(result.message ?? p.explanation), intent: p.intent, tool: p.tool, approved: request.approved });
  return { ...result, conversationId: conversation.id, history: getConversation(sessionId) };
}

export async function executeApproval(approvalId: string) {
  const approval = await agentApprovalService.get(approvalId);
  if (!approval) throw new Error("approval not found");
  if (approval.status !== "APPROVED") throw new Error(`approval is ${approval.status.toLowerCase()}`);
  const p = { intent: "UNKNOWN" as AgentIntent, tool: approval.tool, arguments: approval.arguments as Record<string, unknown>, requiresApproval: true, explanation: `Execute approved action ${approval.tool}.` };
  const result = await executePlan(p);
  await agentApprovalService.markExecuted(approvalId);
  await persistMessage(approval.conversationId, {
    role: "TOOL",
    content: String(result.message ?? `Executed ${approval.tool}.`),
    tool: approval.tool,
    approved: true,
    metadata: { approvalId, status: result.status, data: result.data ?? null },
  });
  return { ...result, approvalId, conversationId: approval.conversationId };
}

async function executePlan(p: AgentPlan) {
  switch (p.intent) {
    case "SHOW_SALES": return { ok: true, status: "completed", plan: p, data: await dashboardService.summary() };
    case "LIST_COMPANIES": return { ok: true, status: "completed", plan: p, data: await companyService.list() };
    case "LIST_CONTACTS": return { ok: true, status: "completed", plan: p, data: await contactService.list() };
    case "LIST_DEALS": return { ok: true, status: "completed", plan: p, data: await dealService.list() };
    case "ATTENTION_DEALS": {
      const deals = await dealService.list();
      return { ok: true, status: "completed", plan: p, data: deals.filter((d) => d.stage !== "WON" && d.stage !== "LOST" && (d.probability < 50 || d.stage === "PROPOSAL" || d.stage === "NEGOTIATION")).slice(0, 10) };
    }
    case "CREATE_COMPANY": return { ok: true, status: "completed", plan: p, data: await companyService.create({ name: String(p.arguments.name) }) };
    case "CREATE_TASK": return { ok: true, status: "completed", plan: p, data: await taskService.create({ title: String(p.arguments.title) }) };
    case "MOVE_DEAL": {
      const stage = String(p.arguments.stage) as DealStage;
      if (!stages.includes(stage)) return { ok: false, status: "rejected", plan: p, message: "Invalid deal stage." };
      const deals = await dealService.list();
      const query = String(p.arguments.dealQuery).toLowerCase();
      const matches = deals.filter((d) => d.name.toLowerCase().includes(query));
      if (matches.length !== 1) return { ok: false, status: "needs_clarification", plan: p, matches: matches.slice(0, 10), message: matches.length ? "More than one deal matches." : "No matching deal found." };
      return { ok: true, status: "completed", plan: p, data: await dealService.updateStage(matches[0].id, stage) };
    }
    default: return { ok: false, status: "not_implemented", plan: p, message: "This capability is planned but not yet enabled." };
  }
}

export { plan as createAgentPlan, getConversation };
