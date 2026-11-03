import { db } from "@aeoncrm/db";

export const agentConversationService = {
  create: async (title = "New conversation") => db.agentConversation.create({ data: { title } }),
  get: async (id: string) => db.agentConversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 100 }, approvals: { orderBy: { createdAt: "desc" } } },
  }),
  list: async (limit = 30) => db.agentConversation.findMany({
    where: { status: "ACTIVE" }, orderBy: { updatedAt: "desc" }, take: Math.min(Math.max(limit, 1), 100),
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  }),
  touch: async (id: string) => db.agentConversation.update({ where: { id }, data: { updatedAt: new Date() } }),
  archive: async (id: string) => db.agentConversation.update({ where: { id }, data: { status: "ARCHIVED" } }),
};

export const agentMessageService = {
  append: async (input: {
    conversationId: string;
    role: "USER" | "ASSISTANT" | "TOOL" | "SYSTEM";
    content: string;
    intent?: string;
    tool?: string;
    requiresApproval?: boolean;
    approved?: boolean;
    metadata?: unknown;
  }) => {
    const message = await db.agentMessage.create({
      data: {
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
        intent: input.intent,
        tool: input.tool,
        requiresApproval: input.requiresApproval ?? false,
        approved: input.approved ?? false,
        metadata: input.metadata as object | undefined,
      },
    });
    await agentConversationService.touch(input.conversationId);
    return message;
  },
  list: async (conversationId: string, limit = 100) => db.agentMessage.findMany({
    where: { conversationId }, orderBy: { createdAt: "asc" }, take: Math.min(Math.max(limit, 1), 200),
  }),
};

export const agentApprovalService = {
  create: (input: { conversationId: string; messageId: string; tool: string; arguments: Record<string, unknown> }) =>
    db.agentApproval.create({ data: { ...input, arguments: input.arguments } }),
  get: (id: string) => db.agentApproval.findUnique({ where: { id }, include: { message: true, conversation: true } }),
  listPending: (conversationId?: string) => db.agentApproval.findMany({
    where: { status: "PENDING", ...(conversationId ? { conversationId } : {}) }, orderBy: { createdAt: "asc" },
  }),
  markApproved: (id: string) => db.agentApproval.update({ where: { id }, data: { status: "APPROVED" } }),
  markRejected: (id: string) => db.agentApproval.update({ where: { id }, data: { status: "REJECTED" } }),
  markExecuted: (id: string) => db.agentApproval.update({ where: { id }, data: { status: "EXECUTED" } }),
};
