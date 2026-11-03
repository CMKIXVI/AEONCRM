import { companyService, contactService, dashboardService, dealService, taskService, type DealStage } from "@aeoncrm/core";
import { clearPendingApproval, getConversation, remember, setPendingApproval } from "./memory";

export type AgentIntent =
  | "SHOW_SALES" | "ATTENTION_DEALS" | "LIST_COMPANIES" | "LIST_CONTACTS" | "LIST_DEALS"
  | "CREATE_COMPANY" | "CREATE_CONTACT" | "CREATE_DEAL" | "CREATE_TASK" | "MOVE_DEAL" | "UNKNOWN";

export type AgentRequest = { message: string; approved?: boolean; sessionId?: string };
export type AgentPlan = { intent: AgentIntent; tool: string; arguments: Record<string, unknown>; requiresApproval: boolean; explanation: string };

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

export async function runAgent(request: AgentRequest) {
  const sessionId = request.sessionId ?? "default";
  remember(sessionId, { role: "user", content: request.message });
  const p = plan(request.message);
  if (p.intent === "UNKNOWN") return { ok: false, ...p, message: p.explanation, history: getConversation(sessionId) };
  if (p.requiresApproval && !request.approved) {
    setPendingApproval(sessionId, request.message);
    remember(sessionId, { role: "agent", content: p.explanation, intent: p.intent, tool: p.tool, approved: false });
    return { ok: true, status: "approval_required", plan: p, message: `Approval required: ${p.explanation}`, history: getConversation(sessionId) };
  }
  if (p.requiresApproval) clearPendingApproval(sessionId);
  let result: Record<string, unknown>;
  switch (p.intent) {
    case "SHOW_SALES": result = { ok: true, status: "completed", plan: p, data: await dashboardService.summary() }; break;
    case "LIST_COMPANIES": result = { ok: true, status: "completed", plan: p, data: await companyService.list() }; break;
    case "LIST_CONTACTS": result = { ok: true, status: "completed", plan: p, data: await contactService.list() }; break;
    case "LIST_DEALS": result = { ok: true, status: "completed", plan: p, data: await dealService.list() }; break;
    case "ATTENTION_DEALS": { const deals = await dealService.list(); result = { ok: true, status: "completed", plan: p, data: deals.filter((d) => d.stage !== "WON" && d.stage !== "LOST" && (d.probability < 50 || d.stage === "PROPOSAL" || d.stage === "NEGOTIATION")).slice(0, 10) }; break; }
    case "CREATE_COMPANY": result = { ok: true, status: "completed", plan: p, data: await companyService.create({ name: String(p.arguments.name) }) }; break;
    case "CREATE_TASK": result = { ok: true, status: "completed", plan: p, data: await taskService.create({ title: String(p.arguments.title) }) }; break;
    case "MOVE_DEAL": { const stage = String(p.arguments.stage) as DealStage; if (!stages.includes(stage)) return { ok: false, status: "rejected", plan: p, message: "Invalid deal stage." }; const deals = await dealService.list(); const query = String(p.arguments.dealQuery).toLowerCase(); const matches = deals.filter((d) => d.title.toLowerCase().includes(query)); if (matches.length !== 1) return { ok: false, status: "needs_clarification", plan: p, matches: matches.slice(0, 10), message: matches.length ? "More than one deal matches." : "No matching deal found." }; result = { ok: true, status: "completed", plan: p, data: await dealService.updateStage(matches[0].id, stage) }; break; }
    default: result = { ok: false, status: "not_implemented", plan: p, message: "This capability is planned but not yet enabled." };
  }
  remember(sessionId, { role: "agent", content: String((result as { message?: unknown }).message ?? p.explanation), intent: p.intent, tool: p.tool, approved: request.approved });
  return { ...result, history: getConversation(sessionId) };
}

export { plan as createAgentPlan, getConversation };
