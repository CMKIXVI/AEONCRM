import { db } from "@aeoncrm/db";
import type { AeonIdentity } from "./identity";
import { canApprove } from "./identity";

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

async function assertApprovalLinks(tenantId: string, conversationId: string, messageId: string) {
  const [conversation, message] = await Promise.all([
    db.agentConversation.findFirst({ where: { id: conversationId, tenantId }, select: { id: true } }),
    db.agentMessage.findFirst({ where: { id: messageId, conversation: { tenantId } }, select: { id: true, conversationId: true } }),
  ]);
  if (!conversation) throw new Error("approval conversation not found");
  if (!message || message.conversationId !== conversationId) throw new Error("approval message not found");
}

export const agentApprovalService = {
  create: async (context: TenantContext, input: { conversationId: string; messageId: string; tool: string; arguments: Record<string, unknown> }) => {
    const { tenantId } = requireTenant(context);
    await assertApprovalLinks(tenantId, input.conversationId, input.messageId);
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
  markApproved: async (identity: AeonIdentity, id: string) => {
    const { tenantId } = requireTenant(identity);
    if (!canApprove(identity)) throw new Error("approval authority required");
    const result = await db.agentApproval.updateMany({ where: { id, tenantId, status: "PENDING" }, data: { status: "APPROVED" } });
    if (result.count !== 1) throw new Error("approval is no longer pending");
    return db.agentApproval.findFirst({ where: { id, tenantId } });
  },
  markRejected: async (identity: AeonIdentity, id: string) => {
    const { tenantId } = requireTenant(identity);
    if (!canApprove(identity)) throw new Error("approval authority required");
    const result = await db.agentApproval.updateMany({ where: { id, tenantId, status: "PENDING" }, data: { status: "REJECTED" } });
    if (result.count !== 1) throw new Error("approval is no longer pending");
    return db.agentApproval.findFirst({ where: { id, tenantId } });
  },
  claimExecution: async (context: TenantContext, id: string) => {
    const { tenantId } = requireTenant(context);
    const result = await db.agentApproval.updateMany({ where: { id, tenantId, status: "APPROVED" }, data: { status: "EXECUTING" } });
    if (result.count !== 1) throw new Error("approval is not available for execution");
    return db.agentApproval.findFirst({ where: { id, tenantId } });
  },
  markExecuted: async (context: TenantContext, id: string) => {
    const { tenantId } = requireTenant(context);
    const result = await db.agentApproval.updateMany({ where: { id, tenantId, status: "EXECUTING" }, data: { status: "EXECUTED" } });
    if (result.count !== 1) throw new Error("approval execution claim is invalid");
    return db.agentApproval.findFirst({ where: { id, tenantId } });
  },
  releaseExecution: async (context: TenantContext, id: string) => {
    const { tenantId } = requireTenant(context);
    return db.agentApproval.updateMany({ where: { id, tenantId, status: "EXECUTING" }, data: { status: "APPROVED" } });
  },
};
