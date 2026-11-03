import { and, asc, desc, eq } from "drizzle-orm";
import { agentApproval, agentConversation, agentMessage, db } from "@aeoncrm/db";
import { randomUUID } from "node:crypto";
import type { AeonIdentity } from "./identity";
import { canApprove } from "./identity";
import { agentAuditService } from "./agent-audit";

export type TenantContext = { tenantId: string; userId?: string };
function requireTenant(context?: TenantContext): TenantContext { if (!context?.tenantId) throw new Error("tenant context is required"); return context; }
function boundedLimit(value: number, max: number) { return Math.min(Math.max(value, 1), max); }

export const agentConversationService = {
  create: async (context: TenantContext, title = "New conversation") => { const { tenantId } = requireTenant(context); const rows = await db.insert(agentConversation).values({ id: randomUUID(), tenantId, title }).returning(); return rows[0]; },
  get: async (context: TenantContext, id: string) => {
    const { tenantId } = requireTenant(context); const conversation = (await db.select().from(agentConversation).where(and(eq(agentConversation.id, id), eq(agentConversation.tenantId, tenantId))).limit(1))[0]; if (!conversation) return undefined;
    const [messages, approvals] = await Promise.all([db.select().from(agentMessage).where(eq(agentMessage.conversationId, id)).orderBy(asc(agentMessage.createdAt)).limit(100), db.select().from(agentApproval).where(and(eq(agentApproval.conversationId, id), eq(agentApproval.tenantId, tenantId))).orderBy(desc(agentApproval.createdAt))]);
    return { ...conversation, messages, approvals };
  },
  list: async (context: TenantContext, limit = 30) => {
    const { tenantId } = requireTenant(context); const conversations = await db.select().from(agentConversation).where(and(eq(agentConversation.tenantId, tenantId), eq(agentConversation.status, "ACTIVE"))).orderBy(desc(agentConversation.updatedAt)).limit(boundedLimit(limit, 100));
    return Promise.all(conversations.map(async (conversation) => ({ ...conversation, messages: await db.select().from(agentMessage).where(eq(agentMessage.conversationId, conversation.id)).orderBy(desc(agentMessage.createdAt)).limit(1) })));
  },
  touch: async (context: TenantContext, id: string) => { const { tenantId } = requireTenant(context); return db.update(agentConversation).set({ updatedAt: new Date() }).where(and(eq(agentConversation.id, id), eq(agentConversation.tenantId, tenantId))).returning({ id: agentConversation.id }); },
  archive: async (context: TenantContext, id: string) => { const { tenantId } = requireTenant(context); return db.update(agentConversation).set({ status: "ARCHIVED", updatedAt: new Date() }).where(and(eq(agentConversation.id, id), eq(agentConversation.tenantId, tenantId))).returning({ id: agentConversation.id }); },
};

export const agentMessageService = {
  append: async (context: TenantContext, input: { conversationId: string; role: "USER" | "ASSISTANT" | "TOOL" | "SYSTEM"; content: string; intent?: string; tool?: string; requiresApproval?: boolean; approved?: boolean; metadata?: unknown }) => {
    const { tenantId, userId } = requireTenant(context); const conversation = (await db.select({ id: agentConversation.id }).from(agentConversation).where(and(eq(agentConversation.id, input.conversationId), eq(agentConversation.tenantId, tenantId))).limit(1))[0]; if (!conversation) throw new Error("conversation not found");
    const rows = await db.insert(agentMessage).values({ id: randomUUID(), conversationId: input.conversationId, userId, role: input.role, content: input.content, intent: input.intent, tool: input.tool, requiresApproval: input.requiresApproval ?? false, approved: input.approved ?? false, metadata: input.metadata }).returning(); await agentConversationService.touch(context, input.conversationId); return rows[0];
  },
  list: async (context: TenantContext, conversationId: string, limit = 100) => { const { tenantId } = requireTenant(context); const conversation = (await db.select({ id: agentConversation.id }).from(agentConversation).where(and(eq(agentConversation.id, conversationId), eq(agentConversation.tenantId, tenantId))).limit(1))[0]; if (!conversation) return []; return db.select().from(agentMessage).where(eq(agentMessage.conversationId, conversationId)).orderBy(asc(agentMessage.createdAt)).limit(boundedLimit(limit, 200)); },
};

async function assertApprovalLinks(tenantId: string, conversationId: string, messageId: string) {
  const conversation = (await db.select({ id: agentConversation.id }).from(agentConversation).where(and(eq(agentConversation.id, conversationId), eq(agentConversation.tenantId, tenantId))).limit(1))[0];
  const message = (await db.select({ id: agentMessage.id }).from(agentMessage).where(and(eq(agentMessage.id, messageId), eq(agentMessage.conversationId, conversationId))).limit(1))[0];
  if (!conversation) throw new Error("approval conversation not found"); if (!message) throw new Error("approval message not found");
}

export const agentApprovalService = {
  create: async (context: TenantContext, input: { conversationId: string; messageId: string; correlationId: string; tool: string; arguments: Record<string, unknown> }) => { const { tenantId } = requireTenant(context); await assertApprovalLinks(tenantId, input.conversationId, input.messageId); const rows = await db.insert(agentApproval).values({ id: randomUUID(), tenantId, ...input, arguments: input.arguments }).returning(); return rows[0]; },
  get: async (context: TenantContext, id: string) => { const { tenantId } = requireTenant(context); return (await db.select().from(agentApproval).where(and(eq(agentApproval.id, id), eq(agentApproval.tenantId, tenantId))).limit(1))[0]; },
  listPending: async (context: TenantContext, conversationId?: string) => { const { tenantId } = requireTenant(context); const condition = conversationId ? and(eq(agentApproval.tenantId, tenantId), eq(agentApproval.status, "PENDING"), eq(agentApproval.conversationId, conversationId)) : and(eq(agentApproval.tenantId, tenantId), eq(agentApproval.status, "PENDING")); return db.select().from(agentApproval).where(condition).orderBy(asc(agentApproval.createdAt)); },
  markApproved: async (identity: AeonIdentity, id: string) => {
    const { tenantId } = requireTenant(identity); if (!canApprove(identity)) throw new Error("approval authority required"); const approval = (await db.select({ tool: agentApproval.tool, correlationId: agentApproval.correlationId }).from(agentApproval).where(and(eq(agentApproval.id, id), eq(agentApproval.tenantId, tenantId), eq(agentApproval.status, "PENDING"))).limit(1))[0]; if (!approval) throw new Error("approval is no longer pending");
    const result = await db.update(agentApproval).set({ status: "APPROVED", updatedAt: new Date() }).where(and(eq(agentApproval.id, id), eq(agentApproval.tenantId, tenantId), eq(agentApproval.status, "PENDING"))).returning(); if (!result[0]) throw new Error("approval is no longer pending"); await agentAuditService.append(identity, { correlationId: approval.correlationId, event: "APPROVED", tool: approval.tool, outcome: "approved" }); return result[0];
  },
  markRejected: async (identity: AeonIdentity, id: string) => {
    const { tenantId } = requireTenant(identity); if (!canApprove(identity)) throw new Error("approval authority required"); const approval = (await db.select({ tool: agentApproval.tool, correlationId: agentApproval.correlationId }).from(agentApproval).where(and(eq(agentApproval.id, id), eq(agentApproval.tenantId, tenantId), eq(agentApproval.status, "PENDING"))).limit(1))[0]; if (!approval) throw new Error("approval is no longer pending");
    const result = await db.update(agentApproval).set({ status: "REJECTED", updatedAt: new Date() }).where(and(eq(agentApproval.id, id), eq(agentApproval.tenantId, tenantId), eq(agentApproval.status, "PENDING"))).returning(); if (!result[0]) throw new Error("approval is no longer pending"); await agentAuditService.append(identity, { correlationId: approval.correlationId, event: "REJECTED", tool: approval.tool, outcome: "rejected" }); return result[0];
  },
  claimExecution: async (context: TenantContext, id: string) => { const { tenantId } = requireTenant(context); const result = await db.update(agentApproval).set({ status: "EXECUTING", updatedAt: new Date() }).where(and(eq(agentApproval.id, id), eq(agentApproval.tenantId, tenantId), eq(agentApproval.status, "APPROVED"))).returning(); if (!result[0]) throw new Error("approval is not available for execution"); return result[0]; },
  markExecuted: async (context: TenantContext, id: string) => { const { tenantId } = requireTenant(context); const result = await db.update(agentApproval).set({ status: "EXECUTED", updatedAt: new Date() }).where(and(eq(agentApproval.id, id), eq(agentApproval.tenantId, tenantId), eq(agentApproval.status, "EXECUTING"))).returning(); if (!result[0]) throw new Error("approval execution claim is invalid"); return result[0]; },
  releaseExecution: async (context: TenantContext, id: string) => { const { tenantId } = requireTenant(context); return db.update(agentApproval).set({ status: "APPROVED", updatedAt: new Date() }).where(and(eq(agentApproval.id, id), eq(agentApproval.tenantId, tenantId), eq(agentApproval.status, "EXECUTING"))).returning({ id: agentApproval.id }); },
};
