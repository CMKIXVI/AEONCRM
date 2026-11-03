import { db } from "@aeoncrm/db";
import { tenantCrm } from "./crm-tenant";
import type { TenantContext } from "./agent-memory";

export type DealStage = "LEAD" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST";
export type CreateActivityInput = { type: "CALL" | "EMAIL" | "MEETING" | "TASK" | "NOTE"; subject: string; notes?: string; dueAt?: Date; companyId?: string; contactId?: string; dealId?: string };
export type CreateTaskInput = { title: string; notes?: string; dueAt?: Date; companyId?: string; contactId?: string; dealId?: string };

export const companyService = {
  list: (c: TenantContext) => db.company.findMany({ where: { tenantId: tenantCrm.tenant(c) }, include: { contacts: true, deals: true }, orderBy: { updatedAt: "desc" } }),
  get: (c: TenantContext, id: string) => db.company.findFirst({ where: { id, tenantId: tenantCrm.tenant(c) }, include: { contacts: true, deals: true, activities: true, tasks: true } }),
  create: (c: TenantContext, input: { name: string; website?: string; industry?: string; description?: string }) => db.company.create({ data: { ...input, tenantId: tenantCrm.tenant(c) } }),
};

export const contactService = {
  list: (c: TenantContext) => db.contact.findMany({ where: { tenantId: tenantCrm.tenant(c) }, include: { company: true }, orderBy: { updatedAt: "desc" } }),
  get: (c: TenantContext, id: string) => db.contact.findFirst({ where: { id, tenantId: tenantCrm.tenant(c) }, include: { company: true, deals: true, activities: true, tasks: true } }),
  create: async (c: TenantContext, input: { firstName: string; lastName: string; email?: string; phone?: string; title?: string; companyId?: string }) => { await tenantCrm.company(c, input.companyId); return db.contact.create({ data: { ...input, tenantId: tenantCrm.tenant(c) } }); },
};

export const dealService = {
  list: (c: TenantContext) => db.deal.findMany({ where: { tenantId: tenantCrm.tenant(c) }, include: { company: true, contact: true }, orderBy: { updatedAt: "desc" } }),
  get: (c: TenantContext, id: string) => db.deal.findFirst({ where: { id, tenantId: tenantCrm.tenant(c) }, include: { company: true, contact: true, activities: true, tasks: true } }),
  create: async (c: TenantContext, input: { name: string; value?: number; currency?: string; stage?: DealStage; probability?: number; companyId?: string; contactId?: string }) => { await tenantCrm.company(c, input.companyId); await tenantCrm.contact(c, input.contactId); return db.deal.create({ data: { ...input, tenantId: tenantCrm.tenant(c), value: input.value ?? 0 } }); },
  updateStage: async (c: TenantContext, id: string, stage: DealStage) => db.deal.updateMany({ where: { id, tenantId: tenantCrm.tenant(c) }, data: { stage } }),
};

export const activityService = {
  listRecent: (c: TenantContext, limit = 50) => db.activity.findMany({ where: { tenantId: tenantCrm.tenant(c) }, take: Math.min(Math.max(limit, 1), 200), include: { company: true, contact: true, deal: true }, orderBy: { occurredAt: "desc" } }),
  create: async (c: TenantContext, input: CreateActivityInput) => { await tenantCrm.company(c, input.companyId); await tenantCrm.contact(c, input.contactId); await tenantCrm.deal(c, input.dealId); return db.activity.create({ data: { tenantId: tenantCrm.tenant(c), type: input.type, subject: input.subject, body: input.notes, occurredAt: input.dueAt ?? new Date(), companyId: input.companyId, contactId: input.contactId, dealId: input.dealId } }); },
};

export const taskService = {
  listOpen: (c: TenantContext) => db.task.findMany({ where: { tenantId: tenantCrm.tenant(c), status: { in: ["TODO", "IN_PROGRESS"] } }, include: { company: true, contact: true, deal: true }, orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }] }),
  create: async (c: TenantContext, input: CreateTaskInput) => { await tenantCrm.company(c, input.companyId); await tenantCrm.contact(c, input.contactId); await tenantCrm.deal(c, input.dealId); return db.task.create({ data: { tenantId: tenantCrm.tenant(c), title: input.title, description: input.notes, dueAt: input.dueAt, companyId: input.companyId, contactId: input.contactId, dealId: input.dealId } }); },
  complete: async (c: TenantContext, id: string) => db.task.updateMany({ where: { id, tenantId: tenantCrm.tenant(c) }, data: { status: "DONE" } }),
};

export const dashboardService = {
  async summary(c: TenantContext) {
    const tenantId = tenantCrm.tenant(c);
    const [companies, contacts, openDeals, wonDeals, openTasks, followUps] = await Promise.all([
      db.company.count({ where: { tenantId } }), db.contact.count({ where: { tenantId } }),
      db.deal.aggregate({ where: { tenantId, status: "OPEN" }, _sum: { value: true }, _count: true }),
      db.deal.aggregate({ where: { tenantId, status: "WON" }, _sum: { value: true }, _count: true }),
      db.task.count({ where: { tenantId, status: { in: ["TODO", "IN_PROGRESS"] } } }),
      db.task.count({ where: { tenantId, status: { in: ["TODO", "IN_PROGRESS"], }, dueAt: { not: null } } }),
    ]);
    return { companies, contacts, openDeals: openDeals._count, openPipelineValue: Number(openDeals._sum.value ?? 0), wonDeals: wonDeals._count, wonRevenue: Number(wonDeals._sum.value ?? 0), openTasks, followUps };
  },
};

export { assertIdentity, canApprove } from "./identity";
export type { AeonIdentity } from "./identity";
export { agentConversationService, agentMessageService, agentApprovalService } from "./agent-memory";
export type { TenantContext } from "./agent-memory";
