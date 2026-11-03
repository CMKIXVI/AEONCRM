import { getRecentMessages, getSession, remember } from "./memory";

export function recordUserMessage(sessionId: string, content: string) {
  return remember(sessionId, { role: "user", content });
}

export function recordAgentMessage(sessionId: string, content: string, intent?: string, tool?: string, approved?: boolean) {
  return remember(sessionId, { role: "agent", content, intent, tool, approved });
}

export function recordToolMessage(sessionId: string, content: string, tool: string) {
  return remember(sessionId, { role: "tool", content, tool });
}

export function getConversation(sessionId = "default", limit = 20) {
  const session = getSession(sessionId);
  return {
    sessionId: session.id,
    messages: getRecentMessages(sessionId, limit),
    pendingApproval: session.pendingApproval ?? null,
  };
}
