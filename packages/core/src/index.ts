import { db } from "@aeoncrm/db";

export type DealStage = "LEAD" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST";
export type CreateActivityInput = { type: "CALL" | "EMAIL" | "MEETING" | "TASK" | "NOTE"; subject: string; notes?: string; dueAt?: Date; companyId?: string; contactId?: string; dealId?: string };
export type CreateTaskInput = { title: string; notes?: string; dueAt?: Date; companyId?: string; contactId?: string; dealId?: string };

export const companyService = {
  list: () => db.company.findMany({ include: { contacts: true, deals: true }, orderBy: { updatedAt: "desc" } }),
  get: (id: string) => db.company.findUnique({ where: { id }, include: { contacts: true, deals: true, activities: true, tasks: true } }),
  create: (input: { name: string; website?: string; industry?: string; description?: string }) => db.company.create({ data: input }),
};

export const contactService = {
  list: () => db.contact.findMany({ include: { company: true }, orderBy: { updatedAt: "desc" } }),
  get: (id: string) => db.contact.findUnique({ where: { id }, include: { company: true, deals: true, activities: true, tasks: true } }),
  create: (input: { firstName: string; lastName: string; email?: string; phone?: string; title?: string; companyId?: string }) => db.contact.create({ data: input }),
};

export const dealService = {
  list: () => db.deal.findMany({ include: { company: true, contact: true }, orderBy: { updatedAt: "desc" } }),
  get: (id: string) => db.deal.findUnique({ where: { id }, include: { company: true, contact: true, activities: true, tasks: true } }),
  create: (input: { title: string; value?: number; currency?: string; stage?: DealStage; probability?: number; companyId?: string; contactId?: string }) => db.deal.create({ data: { ...input, value: input.value } }),
  updateStage: (id: string, stage: DealStage) => db.deal.update({ where: { id }, data: { stage } }),
};

export const activityService = {
  listRecent: (limit = 50) => db.activity.findMany({ take: limit, include: { company: true, contact: true, deal: true }, orderBy: { occurredAt: "desc" } }),
  create: (input: CreateActivityInput) => db.activity.create({ data: input }),
};

export const taskService = {
  listOpen: () => db.task.findMany({ where: { status: { in: ["TODO", "IN_PROGRESS"] } }, include: { company: true, contact: true, deal: true }, orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }] }),
  create: (input: CreateTaskInput) => db.task.create({ data: input }),
  complete: (id: string) => db.task.update({ where: { id }, data: { status: "DONE" } }),
};

export const dashboardService = {
  async summary() {
    const [companies, contacts, openDeals, wonDeals, openTasks, followUps] = await Promise.all([
      db.company.count(), db.contact.count(),
      db.deal.aggregate({ where: { stage: { notIn: ["WON", "LOST"] } }, _sum: { value: true }, _count: true }),
      db.deal.aggregate({ where: { stage: "WON" }, _sum: { value: true }, _count: true }),
      db.task.count({ where: { status: { in: ["TODO", "IN_PROGRESS"] } } }),
      db.activity.count({ where: { completed: false, dueAt: { not: null } } }),
    ]);
    return { companies, contacts, openDeals: openDeals._count, openPipelineValue: Number(openDeals._sum.value ?? 0), wonDeals: wonDeals._count, wonRevenue: Number(wonDeals._sum.value ?? 0), openTasks, followUps };
  },
};

export { agentConversationService, agentMessageService, agentApprovalService } from "./agent-memory";
