CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

CREATE TABLE "Tenant" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Membership" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Membership_userId_tenantId_key" ON "Membership"("userId", "tenantId");
CREATE INDEX "Membership_tenantId_role_idx" ON "Membership"("tenantId", "role");

INSERT INTO "Tenant" ("id", "name", "slug", "updatedAt") VALUES ('tenant_default', 'AEONCRM Default Tenant', 'default', CURRENT_TIMESTAMP);
INSERT INTO "User" ("id", "email", "name", "updatedAt") VALUES ('user_system', 'system@aeoncrm.local', 'AEONCRM System', CURRENT_TIMESTAMP);
INSERT INTO "Membership" ("id", "userId", "tenantId", "role") VALUES ('membership_system_default', 'user_system', 'tenant_default', 'OWNER');

ALTER TABLE "Company" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Contact" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Deal" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Activity" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Task" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "AgentConversation" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "AgentApproval" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "AgentMessage" ADD COLUMN "userId" TEXT;

UPDATE "Company" SET "tenantId" = 'tenant_default';
UPDATE "Contact" SET "tenantId" = 'tenant_default';
UPDATE "Deal" SET "tenantId" = 'tenant_default';
UPDATE "Activity" SET "tenantId" = 'tenant_default';
UPDATE "Task" SET "tenantId" = 'tenant_default';
UPDATE "AgentConversation" SET "tenantId" = 'tenant_default';
UPDATE "AgentApproval" SET "tenantId" = 'tenant_default';

ALTER TABLE "Company" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Contact" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Deal" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Activity" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "AgentConversation" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "AgentApproval" ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Company" ADD CONSTRAINT "Company_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentConversation" ADD CONSTRAINT "AgentConversation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentApproval" ADD CONSTRAINT "AgentApproval_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentMessage" ADD CONSTRAINT "AgentMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
