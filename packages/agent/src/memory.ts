export type AgentRole = "user" | "agent" | "tool";

export type AgentMessage = {
  id: string;
  role: AgentRole;
  content: string;
  createdAt: string;
  intent?: string;
  tool?: string;
  approved?: boolean;
};

export type AgentSession = {
  id: string;
  messages: AgentMessage[];
  pendingApproval?: {
    message: string;
    createdAt: string;
  };
};

const sessions = new Map<string, AgentSession>();

export function getSession(sessionId = "default"): AgentSession {
  const existing = sessions.get(sessionId);
  if (existing) return existing;

  const session: AgentSession = { id: sessionId, messages: [] };
  sessions.set(sessionId, session);
  return session;
}

export function remember(sessionId: string, message: Omit<AgentMessage, "id" | "createdAt">) {
  const session = getSession(sessionId);
  const entry: AgentMessage = {
    ...message,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  session.messages.push(entry);
  if (session.messages.length > 100) session.messages.splice(0, session.messages.length - 100);
  return entry;
}

export function setPendingApproval(sessionId: string, message: string) {
  const session = getSession(sessionId);
  session.pendingApproval = { message, createdAt: new Date().toISOString() };
}

export function clearPendingApproval(sessionId: string) {
  const session = getSession(sessionId);
  delete session.pendingApproval;
}

export function getRecentMessages(sessionId: string, limit = 20) {
  return getSession(sessionId).messages.slice(-Math.max(1, Math.min(limit, 100)));
}
