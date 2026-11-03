import { db } from "@aeoncrm/db";

export type TenantContext = { tenantId: string; userId?: string };

function requireTenant(context?: TenantContext): TenantContext {
  if (!context?.tenantId) throw new Error("tenant context is required");
  return context;
}

export const agentConversationService = {
  create: async (context: TenantContext, title = "New conversation") => {
    const { tenantId } = requireTenant(context);
    return db.agentConversation.create({ data: { tenantId, title } });
  },
  get: async (context: TenantContext, id: string) => {
    const { tenantId } = requireTenant(context);
    return db.agentConversation.findFirst({ where: { id, tenantId }, include: { messages: { orderBy: { createdAt: "asc" }, take: 100 }, approvals: { orderBy: { createdAt: "desc" } } } });
  },
  list: async (context: TenantContext, limit = 30) => {
    const { tenantId } = requireTenant(context);
    return db.agentConversation.findMany({ where: { tenantId, status: "ACTIVE" }, orderBy: { updatedAt: "desc" }, take: Math.min(Math.max(limit, 1), 100), include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } } });
  },
  touch: async (context: TenantContext, id: string) => {
    const { tenantId } = requireTenant(context);
    return db.agentConversation.updateMany({ where: { id, tenantId }, data: { updatedAt: new Date() } });
  },
  archive: async (context: TenantContext, id: string) => {
    const { tenantId } = requireTenant(context);
    return db.agentConversation.updateMany({ where: { id, tenantId }, data: { status: "ARCHIVED" } });
  },
};

export const agentMessageService = {
  append: async (context: TenantContext, input: { conversationId: string; role: "USER" | "ASSISTANT" | "TOOL" | "SYSTEM"; content: string; intent?: string; tool?: string; requiresApproval?: boolean; approved?: boolean; metadata?: unknown }) => {
    const { tenantId, userId } = requireTenant(context);
    const conversation = await db.agentConversation.findFirst({ where: { id: input.conversationId, tenantId }, select: { id: true } });
    if (!conversation) throw new Error("conversation not found");
    const message = await db.agentMessage.create({ data: { conversationId: input.conversationId, userId, role: input.role, content: input.content, intent: input.intent, tool: input.tool, requiresApproval: input.requiresApproval ?? false, approved: input.approved ?? false, metadata: input.metadata as object | undefined } });
    await agentConversationService.touch(context, input.conversationId);
    return message;
  },
  list: async (context: TenantContext, conversationId: string, limit = 100) => {
    const { tenantId } = requireTenant(context);
    const conversation = await db.agentConversation.findFirst({ where: { id: conversationId, tenantId }, select: { id: true } });
    if (!conversation) return [];
    return db.agentMessage.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" }, take: Math.min(Math.max(limit, 1), 200) });
  },
};

export const agentApprovalService = {
  create: async (context: TenantContext, input: { conversationId: string; messageId: string; tool: string; arguments: Record<string, unknown> }) => {
    const { tenantId } = requireTenant(context);
    return db.agentApproval.create({ data: { tenantId, ...input, arguments: input.arguments } });
  },
  get: async (context: TenantContext, id: string) => {
    const { tenantId } = requireTenant(context);
    return db.agentApproval.findFirst({ where: { id, tenantId }, include: { message: true, conversation: true } });
  },
  listPending: async (context: TenantContext, conversationId?: string) => {
    const { tenantId } = requireTenant(context);
    return db.agentApproval.findMany({ where: { tenantId, status: "PENDING", ...(conversationId ? { conversationId } : {}) }, orderBy: { createdAt: "asc" } });
  },
  markApproved: async (context: TenantContext, id: string) => { const { tenantId } = requireTenant(context); return db.agentApproval.updateMany({ where: { id, tenantId, status: "PENDING" }, data: { status: "APPROVED" } }); },
  markRejected: async (context: TenantContext, id: string) => { const { tenantId } = requireTenant(context); return db.agentApproval.updateMany({ where: { id, tenantId, status: "PENDING" }, data: { status: "REJECTED" } }); },
  markExecuted: async (context: TenantContext, id: string) => { const { tenantId } = requireTenant(context); return db.agentApproval.updateMany({ where: { id, tenantId, status: "APPROVED" }, data: { status: "EXECUTED" } }); },
};
