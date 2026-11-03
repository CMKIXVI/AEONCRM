import { createHash, randomUUID } from "node:crypto";
import { db } from "@aeoncrm/db";
import type { AgentAuditEvent } from "@aeoncrm/db";
import type { TenantContext } from "./agent-memory";

export type AgentAuditInput = {
  correlationId: string;
  event: AgentAuditEvent;
  tool?: string;
  outcome?: string;
  metadata?: unknown;
};

function tenant(context: TenantContext) {
  if (!context?.tenantId) throw new Error("tenant context is required");
  return context.tenantId;
}

function canonical(input: { tenantId: string; userId?: string; correlationId: string; event: AgentAuditEvent; tool?: string; outcome?: string; metadata?: unknown; previousHash?: string; createdAt: Date }) {
  return JSON.stringify({
    tenantId: input.tenantId,
    userId: input.userId ?? null,
    correlationId: input.correlationId,
    event: input.event,
    tool: input.tool ?? null,
    outcome: input.outcome ?? null,
    metadata: input.metadata ?? null,
    previousHash: input.previousHash ?? null,
    createdAt: input.createdAt.toISOString(),
  });
}

export const agentAuditService = {
  append: async (context: TenantContext, input: AgentAuditInput) => {
    const tenantId = tenant(context);
    const previous = await db.agentAuditEventRecord.findFirst({ where: { tenantId }, orderBy: { createdAt: "desc" }, select: { eventHash: true } });
    const createdAt = new Date();
    const eventHash = createHash("sha256").update(canonical({ ...input, tenantId, userId: context.userId, previousHash: previous?.eventHash, createdAt })).digest("hex");
    return db.agentAuditEventRecord.create({ data: { id: randomUUID(), tenantId, userId: context.userId, correlationId: input.correlationId, event: input.event, tool: input.tool, outcome: input.outcome, metadata: input.metadata as object | undefined, previousHash: previous?.eventHash, eventHash, createdAt } });
  },
  list: async (context: TenantContext, correlationId?: string, limit = 100) => {
    const tenantId = tenant(context);
    return db.agentAuditEventRecord.findMany({ where: { tenantId, ...(correlationId ? { correlationId } : {}) }, orderBy: { createdAt: "asc" }, take: Math.min(Math.max(limit, 1), 500) });
  },
};
