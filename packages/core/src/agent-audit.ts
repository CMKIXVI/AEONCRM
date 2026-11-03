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

const MAX_METADATA_BYTES = 16_384;
const MAX_TEXT_LENGTH = 512;

function tenant(context: TenantContext) {
  if (!context?.tenantId) throw new Error("tenant context is required");
  return context.tenantId;
}

function bounded(value: string | undefined, field: string) {
  if (value === undefined) return undefined;
  if (value.length > MAX_TEXT_LENGTH) throw new Error(`${field} is too long`);
  return value;
}

function safeMetadata(metadata: unknown) {
  if (metadata === undefined) return undefined;
  const encoded = JSON.stringify(metadata);
  if (encoded.length > MAX_METADATA_BYTES) throw new Error("audit metadata is too large");
  return metadata as object;
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
    const correlationId = bounded(input.correlationId, "correlationId");
    if (!correlationId) throw new Error("correlationId is required");
    const tool = bounded(input.tool, "tool");
    const outcome = bounded(input.outcome, "outcome");
    const metadata = safeMetadata(input.metadata);

    return db.$transaction(async (tx) => {
      // PostgreSQL transaction-scoped advisory lock serializes the chain per tenant.
      // pg_advisory_xact_lock accepts a bigint; hashing the tenant ID gives a stable
      // lock key without requiring an additional mutable row in the schema.
      const lockKey = createHash("sha256").update(tenantId).digest("hex").slice(0, 15);
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(('x' || '${lockKey}')::bit(60)::bigint)`);

      const previous = await tx.agentAuditEventRecord.findFirst({
        where: { tenantId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { eventHash: true },
      });
      const createdAt = new Date();
      const eventHash = createHash("sha256").update(canonical({
        tenantId,
        userId: context.userId,
        correlationId,
        event: input.event,
        tool,
        outcome,
        metadata,
        previousHash: previous?.eventHash,
        createdAt,
      })).digest("hex");

      return tx.agentAuditEventRecord.create({
        data: {
          id: randomUUID(),
          tenantId,
          userId: context.userId,
          correlationId,
          event: input.event,
          tool,
          outcome,
          metadata,
          previousHash: previous?.eventHash,
          eventHash,
          createdAt,
        },
      });
    });
  },
  list: async (context: TenantContext, correlationId?: string, limit = 100) => {
    const tenantId = tenant(context);
    return db.agentAuditEventRecord.findMany({
      where: { tenantId, ...(correlationId ? { correlationId } : {}) },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: Math.min(Math.max(limit, 1), 500),
    });
  },
  verify: async (context: TenantContext) => {
    const tenantId = tenant(context);
    const events = await db.agentAuditEventRecord.findMany({
      where: { tenantId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    let previousHash: string | undefined;
    for (const event of events) {
      const expected = createHash("sha256").update(canonical({
        tenantId,
        userId: event.userId ?? undefined,
        correlationId: event.correlationId,
        event: event.event,
        tool: event.tool ?? undefined,
        outcome: event.outcome ?? undefined,
        metadata: event.metadata ?? undefined,
        previousHash,
        createdAt: event.createdAt,
      })).digest("hex");
      if (event.previousHash !== previousHash || event.eventHash !== expected) return false;
      previousHash = event.eventHash;
    }
    return true;
  },
};
