-- AEONCRM additive CRM object expansion.
-- This migration assumes the tenant-isolated baseline schema is already present.

CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST');
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'PENDING', 'RESOLVED', 'CLOSED');
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

CREATE TABLE "Lead" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  "companyName" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "title" TEXT,
  "source" TEXT,
  "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
  "score" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "companyId" TEXT,
  "contactId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Ticket" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "description" TEXT,
  "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
  "companyId" TEXT,
  "contactId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sku" TEXT,
  "description" TEXT,
  "unitPrice" DECIMAL(18,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LineItem" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "dealId" TEXT NOT NULL,
  "productId" TEXT,
  "description" TEXT,
  "quantity" DECIMAL(18,4) NOT NULL,
  "unitPrice" DECIMAL(18,2) NOT NULL,
  "discount" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LineItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Lead_tenantId_status_score_idx" ON "Lead"("tenantId", "status", "score");
CREATE INDEX "Lead_tenantId_email_idx" ON "Lead"("tenantId", "email");
CREATE INDEX "Lead_tenantId_companyId_idx" ON "Lead"("tenantId", "companyId");
CREATE INDEX "Ticket_tenantId_status_priority_idx" ON "Ticket"("tenantId", "status", "priority");
CREATE INDEX "Ticket_tenantId_companyId_idx" ON "Ticket"("tenantId", "companyId");
CREATE INDEX "Ticket_tenantId_contactId_idx" ON "Ticket"("tenantId", "contactId");
CREATE INDEX "Product_tenantId_name_idx" ON "Product"("tenantId", "name");
CREATE INDEX "Product_tenantId_sku_idx" ON "Product"("tenantId", "sku");
CREATE INDEX "LineItem_tenantId_dealId_idx" ON "LineItem"("tenantId", "dealId");
CREATE INDEX "LineItem_tenantId_productId_idx" ON "LineItem"("tenantId", "productId");

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LineItem" ADD CONSTRAINT "LineItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LineItem" ADD CONSTRAINT "LineItem_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LineItem" ADD CONSTRAINT "LineItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
