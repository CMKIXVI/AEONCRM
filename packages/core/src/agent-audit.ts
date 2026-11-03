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

const MAX_TEXT = 1024;
const MAX_METADATA_BYTES = 16_384;

function tenant(context: TenantContext) {
  if (!context?.tenantId) throw new Error("tenant context is required");
  return context.tenantId;
}

function boundedText(value: string | undefined, field: string) {
  if (value === undefined) return undefined;
  if (!value.trim()) throw new Error(`${field} is required`);
  if (value.length > MAX_TEXT) throw new Error(`${field} is too long`);
  return value;
}

function safeMetadata(metadata: unknown) {
  if (metadata === undefined) return undefined;
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) throw new Error("audit metadata must be an object");
  const serialized = JSON.stringify(metadata);
  if (serialized.length > MAX_METADATA_BYTES) throw new Error("audit metadata is too large");
  return metadata as Record<string, unknown>;
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

export function computeAuditHash(input: Parameters<typeof canonical>[0]) {
  return createHash("sha256").update(canonical(input)).digest("hex");
}

export const agentAuditService = {
  append: async (context: TenantContext, input: AgentAuditInput) => {
    const tenantId = tenant(context);
    const correlationId = boundedText(input.correlationId, "correlationId")!;
    const tool = boundedText(input.tool, "tool");
    const outcome = boundedText(input.outcome, "outcome");
    const metadata = safeMetadata(input.metadata);
    const previous = await db.agentAuditEventRecord.findFirst({ where: { tenantId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { eventHash: true } });
    const createdAt = new Date();
    const eventHash = computeAuditHash({ tenantId, userId: context.userId, correlationId, event: input.event, tool, outcome, metadata, previousHash: previous?.eventHash, createdAt });
    return db.agentAuditEventRecord.create({ data: { id: randomUUID(), tenantId, userId: context.userId, correlationId, event: input.event, tool, outcome, metadata, previousHash: previous?.eventHash, eventHash, createdAt } });
  },
  list: async (context: TenantContext, correlationId?: string, limit = 100) => {
    const tenantId = tenant(context);
    return db.agentAuditEventRecord.findMany({ where: { tenantId, ...(correlationId ? { correlationId } : {}) }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: Math.min(Math.max(limit, 1), 500) });
  },
  verify: async (context: TenantContext) => {
    const tenantId = tenant(context);
    const events = await db.agentAuditEventRecord.findMany({ where: { tenantId }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
    let previousHash: string | undefined;
    for (const event of events) {
      const expected = computeAuditHash({ tenantId, userId: event.userId ?? undefined, correlationId: event.correlationId, event: event.event, tool: event.tool ?? undefined, outcome: event.outcome ?? undefined, metadata: event.metadata ?? undefined, previousHash, createdAt: event.createdAt });
      if (event.previousHash !== previousHash || event.eventHash !== expected) return { valid: false, checked: events.indexOf(event) + 1, reason: "audit chain integrity failure", eventId: event.id };
      previousHash = event.eventHash;
    }
    return { valid: true, checked: events.length };
  },
};
