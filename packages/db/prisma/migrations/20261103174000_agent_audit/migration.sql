CREATE TYPE "AgentAuditEvent" AS ENUM ('PLANNED', 'APPROVAL_REQUESTED', 'APPROVED', 'REJECTED', 'EXECUTION_STARTED', 'EXECUTED', 'FAILED');

ALTER TABLE "AgentApproval" ADD COLUMN "correlationId" TEXT NOT NULL DEFAULT gen_random_uuid()::text;
CREATE INDEX "AgentApproval_tenantId_correlationId_idx" ON "AgentApproval"("tenantId", "correlationId");

CREATE TABLE "AgentAuditEventRecord" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT,
  "correlationId" TEXT NOT NULL,
  "event" "AgentAuditEvent" NOT NULL,
  "tool" TEXT,
  "outcome" TEXT,
  "metadata" JSONB,
  "previousHash" TEXT,
  "eventHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgentAuditEventRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AgentAuditEventRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AgentAuditEventRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AgentAuditEventRecord_tenantId_eventHash_key" ON "AgentAuditEventRecord"("tenantId", "eventHash");
CREATE INDEX "AgentAuditEventRecord_tenantId_createdAt_idx" ON "AgentAuditEventRecord"("tenantId", "createdAt");
CREATE INDEX "AgentAuditEventRecord_tenantId_correlationId_createdAt_idx" ON "AgentAuditEventRecord"("tenantId", "correlationId", "createdAt");
CREATE INDEX "AgentAuditEventRecord_tenantId_event_idx" ON "AgentAuditEventRecord"("tenantId", "event");
