import { createHash, randomUUID } from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import { agentAuditEventRecord, db, sql } from "@aeoncrm/db";
import type { AgentAuditEventRecord } from "@aeoncrm/db";
import type { TenantContext } from "./agent-memory";

export type AgentAuditInput = { correlationId: string; event: "PLANNED" | "APPROVAL_REQUESTED" | "APPROVED" | "REJECTED" | "EXECUTION_STARTED" | "EXECUTED" | "FAILED"; tool?: string; outcome?: string; metadata?: unknown };
const MAX_METADATA_BYTES = 16_384;
const MAX_TEXT_LENGTH = 512;

function tenant(context: TenantContext) { if (!context?.tenantId) throw new Error("tenant context is required"); return context.tenantId; }
function bounded(value: string | undefined, field: string) { if (value === undefined) return undefined; if (value.length > MAX_TEXT_LENGTH) throw new Error(`${field} is too long`); return value; }
function safeMetadata(metadata: unknown) { if (metadata === undefined) return undefined; const encoded = JSON.stringify(metadata); if (encoded.length > MAX_METADATA_BYTES) throw new Error("audit metadata is too large"); return metadata; }
function canonical(input: { tenantId: string; userId?: string; correlationId: string; event: AgentAuditInput["event"]; tool?: string; outcome?: string; metadata?: unknown; previousHash?: string; createdAt: Date }) {
  return JSON.stringify({ tenantId: input.tenantId, userId: input.userId ?? null, correlationId: input.correlationId, event: input.event, tool: input.tool ?? null, outcome: input.outcome ?? null, metadata: input.metadata ?? null, previousHash: input.previousHash ?? null, createdAt: input.createdAt.toISOString() });
}
function hashLockKey(tenantId: string) { return BigInt(`0x${createHash("sha256").update(tenantId).digest("hex").slice(0, 15)}`); }

export const agentAuditService = {
  append: async (context: TenantContext, input: AgentAuditInput) => {
    const tenantId = tenant(context); const correlationId = bounded(input.correlationId, "correlationId"); if (!correlationId) throw new Error("correlationId is required");
    const tool = bounded(input.tool, "tool"); const outcome = bounded(input.outcome, "outcome"); const metadata = safeMetadata(input.metadata);
    return db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${hashLockKey(tenantId)})`);
      const previous = await tx.select({ eventHash: agentAuditEventRecord.eventHash }).from(agentAuditEventRecord).where(eq(agentAuditEventRecord.tenantId, tenantId)).orderBy(desc(agentAuditEventRecord.createdAt), desc(agentAuditEventRecord.id)).limit(1);
      const previousHash = previous[0]?.eventHash;
      const createdAt = new Date();
      const eventHash = createHash("sha256").update(canonical({ tenantId, userId: context.userId, correlationId, event: input.event, tool, outcome, metadata, previousHash, createdAt })).digest("hex");
      const rows = await tx.insert(agentAuditEventRecord).values({ id: randomUUID(), tenantId, userId: context.userId, correlationId, event: input.event, tool, outcome, metadata, previousHash, eventHash, createdAt }).returning();
      return rows[0] as AgentAuditEventRecord;
    });
  },
  list: async (context: TenantContext, correlationId?: string, limit = 100) => {
    const tenantId = tenant(context); const conditions = correlationId ? and(eq(agentAuditEventRecord.tenantId, tenantId), eq(agentAuditEventRecord.correlationId, correlationId)) : eq(agentAuditEventRecord.tenantId, tenantId);
    return db.select().from(agentAuditEventRecord).where(conditions).orderBy(asc(agentAuditEventRecord.createdAt), asc(agentAuditEventRecord.id)).limit(Math.min(Math.max(limit, 1), 500));
  },
  verify: async (context: TenantContext) => {
    const tenantId = tenant(context); const events = await db.select().from(agentAuditEventRecord).where(eq(agentAuditEventRecord.tenantId, tenantId)).orderBy(asc(agentAuditEventRecord.createdAt), asc(agentAuditEventRecord.id));
    let previousHash: string | undefined;
    for (const event of events) {
      const expected = createHash("sha256").update(canonical({ tenantId, userId: event.userId ?? undefined, correlationId: event.correlationId, event: event.event, tool: event.tool ?? undefined, outcome: event.outcome ?? undefined, metadata: event.metadata ?? undefined, previousHash, createdAt: event.createdAt })).digest("hex");
      if (event.previousHash !== previousHash || event.eventHash !== expected) return false;
      previousHash = event.eventHash;
    }
    return true;
  },
};
