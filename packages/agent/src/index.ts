import {
  agentApprovalService, agentConversationService, agentMessageService, assertIdentity, companyService, contactService,
  createDefaultToolRegistry, dashboardService, dealService, taskService, type AeonIdentity, type DealStage, type TenantContext,
} from "@aeoncrm/core";
import { clearPendingApproval, getConversation, remember, setPendingApproval } from "./memory";

export type AgentIntent = "SHOW_SALES" | "ATTENTION_DEALS" | "LIST_COMPANIES" | "LIST_CONTACTS" | "LIST_DEALS" | "CREATE_COMPANY" | "CREATE_CONTACT" | "CREATE_DEAL" | "CREATE_TASK" | "MOVE_DEAL" | "UNKNOWN";
export type AgentRequest = { message: string; approved?: boolean; sessionId?: string; conversationId?: string; identity: AeonIdentity };
export type AgentPlan = { intent: AgentIntent; tool: string; arguments: Record<string, unknown>; requiresApproval: boolean; explanation: string };
const stages: DealStage[] = ["LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
const context = (identity: AeonIdentity): TenantContext => ({ tenantId: identity.tenantId, userId: identity.userId });

const toolRegistry = createDefaultToolRegistry({
  "dashboard.summary": async (c) => dashboardService.summary(c),
  "companies.list": async (c) => companyService.list(c),
  "contacts.list": async (c) => contactService.list(c),
  "deals.list": async (c) => dealService.list(c),
  "deals.findAttention": async (c) => {
    const deals = await dealService.list(c);
    return deals.filter((d) => d.status === "OPEN" && (d.probability < 50 || d.stage === "PROPOSAL" || d.stage === "NEGOTIATION")).slice(0, 10);
  },
  "companies.create": async (c, args) => companyService.create(c, { name: String(args.name) }),
  "tasks.create": async (c, args) => taskService.create(c, { title: String(args.title) }),
  "deals.updateStage": async (c, args) => {
    const stage = String(args.stage) as DealStage;
    if (!stages.includes(stage)) return { rejected: true, message: "Invalid deal stage." };
    const deals = await dealService.list(c);
    const query = String(args.dealQuery).trim().toLowerCase();
    const matches = deals.filter((d) => d.name.toLowerCase().includes(query));
    if (matches.length !== 1) return { needsClarification: true, matches: matches.slice(0, 10), message: matches.length ? "More than one deal matches." : "No matching deal found." };
    return dealService.updateStage(c, matches[0].id, stage);
  },
});

function plan(message: string): AgentPlan {
  const text = message.trim(); const lower = text.toLowerCase();
  if (/show.*sales|sales.*pipeline|my sales/.test(lower)) return { intent: "SHOW_SALES", tool: "dashboard.summary", arguments: {}, requiresApproval: false, explanation: "Read the live sales summary." };
  if (/opportunit|deal.*attention|deal.*risk|need attention/.test(lower)) return { intent: "ATTENTION_DEALS", tool: "deals.findAttention", arguments: {}, requiresApproval: false, explanation: "Find open opportunities that need attention." };
  if (/^(list|show|find).*companies|companies/.test(lower)) return { intent: "LIST_COMPANIES", tool: "companies.list", arguments: {}, requiresApproval: false, explanation: "List CRM companies." };
  if (/^(list|show|find).*contacts|contacts/.test(lower)) return { intent: "LIST_CONTACTS", tool: "contacts.list", arguments: {}, requiresApproval: false, explanation: "List CRM contacts." };
  if (/^(list|show|find).*deals|deals/.test(lower)) return { intent: "LIST_DEALS", tool: "deals.list", arguments: {}, requiresApproval: false, explanation: "List CRM deals." };
  const companyMatch = text.match(/create\s+(.+?)(?:\s+as\s+(?:a\s+)?(?:prospect|company|customer))?$/i);
  if (/create .*company|create .*prospect|add .*company|add .*prospect/.test(lower) && companyMatch) { const name = companyMatch[1].replace(/\s+as\s+(?:a\s+)?(?:prospect|company|customer)$/i, "").trim(); return { intent: "CREATE_COMPANY", tool: "companies.create", arguments: { name }, requiresApproval: true, explanation: `Create company “${name}”.` }; }
  const moveMatch = text.match(/(?:move|change|set)\s+(?:deal\s+)?(.+?)\s+(?:to|into)\s+(lead|qualified|proposal|negotiation|won|lost)/i);
  if (moveMatch) return { intent: "MOVE_DEAL", tool: "deals.updateStage", arguments: { dealQuery: moveMatch[1].trim(), stage: moveMatch[2].toUpperCase() }, requiresApproval: true, explanation: `Move deal “${moveMatch[1].trim()}” to ${moveMatch[2].toUpperCase()}.` };
  const taskMatch = text.match(/create\s+(?:a\s+)?task\s+(.+)/i);
  if (taskMatch) return { intent: "CREATE_TASK", tool: "tasks.create", arguments: { title: taskMatch[1].trim() }, requiresApproval: true, explanation: `Create task “${taskMatch[1].trim()}”.` };
  return { intent: "UNKNOWN", tool: "none", arguments: {}, requiresApproval: false, explanation: "I could not map that request to an approved CRM capability." };
}

async function ensureConversation(c: TenantContext, conversationId?: string) {
  if (conversationId) { const existing = await agentConversationService.get(c, conversationId); if (existing) return existing; }
  return agentConversationService.create(c, "AEON Agent");
}
async function persistMessage(c: TenantContext, conversationId: string, input: Omit<Parameters<typeof agentMessageService.append>[1], "conversationId">) { return agentMessageService.append(c, { ...input, conversationId }); }

async function executeTool(identity: AeonIdentity, toolName: string, args: Record<string, unknown>) {
  const c = context(identity);
  const tool = toolRegistry.authorize(identity, toolName);
  const data = await tool.execute(c, args);
  if (typeof data === "object" && data !== null && "needsClarification" in data && (data as { needsClarification?: boolean }).needsClarification) return { ok: false, status: "needs_clarification", ...(data as Record<string, unknown>) };
  if (typeof data === "object" && data !== null && "rejected" in data && (data as { rejected?: boolean }).rejected) return { ok: false, status: "rejected", ...(data as Record<string, unknown>) };
  return { ok: true, status: "completed", data };
}

async function executePlan(identity: AeonIdentity, p: AgentPlan) {
  const tool = toolRegistry.get(p.tool);
  if (!tool) return { ok: false, status: "rejected", plan: p, message: `Tool “${p.tool}” is not in the governed execution registry.` };
  const result = await executeTool(identity, p.tool, p.arguments);
  return { ...result, plan: p };
}

export async function runAgent(request: AgentRequest) {
  const identity = assertIdentity(request.identity);
  const c = context(identity); const sessionId = request.sessionId ?? request.conversationId ?? "default"; const conversation = await ensureConversation(c, request.conversationId); const p = plan(request.message);
  await persistMessage(c, conversation.id, { role: "USER", content: request.message, intent: p.intent, tool: p.tool }); remember(sessionId, { role: "user", content: request.message });
  if (p.intent === "UNKNOWN") { await persistMessage(c, conversation.id, { role: "ASSISTANT", content: p.explanation, intent: p.intent, tool: p.tool }); return { ok: false, ...p, message: p.explanation, conversationId: conversation.id, history: getConversation(sessionId) }; }
  const governedTool = toolRegistry.get(p.tool);
  if (!governedTool) return { ok: false, status: "rejected", message: `Tool “${p.tool}” is not in the governed execution registry.`, conversationId: conversation.id, history: getConversation(sessionId) };
  const requiresApproval = governedTool.access === "WRITE" && governedTool.requiresApproval;
  if (requiresApproval) {
    const message = await persistMessage(c, conversation.id, { role: "ASSISTANT", content: p.explanation, intent: p.intent, tool: p.tool, requiresApproval: true, approved: false, metadata: { plan: { ...p, requiresApproval } } });
    const approval = await agentApprovalService.create(c, { conversationId: conversation.id, messageId: message.id, tool: p.tool, arguments: p.arguments }); setPendingApproval(sessionId, request.message); remember(sessionId, { role: "agent", content: p.explanation, intent: p.intent, tool: p.tool, approved: false });
    return { ok: true, status: "approval_required", plan: { ...p, requiresApproval }, approvalId: approval.id, message: `Approval required: ${p.explanation}`, conversationId: conversation.id, history: getConversation(sessionId) };
  }
  const result = await executePlan(identity, { ...p, requiresApproval });
  await persistMessage(c, conversation.id, { role: "ASSISTANT", content: String(result.message ?? p.explanation), intent: p.intent, tool: p.tool, approved: false, metadata: { status: result.status, data: result.data ?? null } });
  remember(sessionId, { role: "agent", content: String(result.message ?? p.explanation), intent: p.intent, tool: p.tool, approved: false }); return { ...result, conversationId: conversation.id, history: getConversation(sessionId) };
}

export async function executeApproval(identityInput: AeonIdentity, approvalId: string) {
  const identity = assertIdentity(identityInput);
  const c = context(identity); const approval = await agentApprovalService.get(c, approvalId); if (!approval) throw new Error("approval not found");
  const claimed = await agentApprovalService.claimExecution(c, approvalId);
  if (!claimed) throw new Error("approval execution could not be claimed");
  try {
    const result = await executeTool(identity, approval.tool, approval.arguments as Record<string, unknown>);
    if (!result.ok) { await agentApprovalService.releaseExecution(c, approvalId); return { ...result, approvalId, conversationId: approval.conversationId }; }
    await agentApprovalService.markExecuted(c, approvalId);
    await persistMessage(c, approval.conversationId, { role: "TOOL", content: String(result.message ?? `Executed ${approval.tool}.`), tool: approval.tool, approved: true, metadata: { approvalId, status: result.status, data: result.data ?? null } });
    return { ...result, approvalId, conversationId: approval.conversationId };
  } catch (error) {
    await agentApprovalService.releaseExecution(c, approvalId);
    throw error;
  }
}

export { plan as createAgentPlan, getConversation };
