import { db } from "@aeoncrm/db";

export type CreateCompanyInput = {
  name: string;
  website?: string;
  industry?: string;
  description?: string;
};

export type CreateContactInput = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  companyId?: string;
};

export type CreateDealInput = {
  name: string;
  value: number;
  currency?: string;
  stage?: string;
  probability?: number;
  expectedAt?: Date;
  companyId?: string;
  contactId?: string;
};

export const companyService = {
  list: () => db.company.findMany({
    include: { contacts: true, deals: true },
    orderBy: { updatedAt: "desc" },
  }),
  get: (id: string) => db.company.findUnique({
    where: { id },
    include: { contacts: true, deals: true, activities: true, tasks: true },
  }),
  create: (input: CreateCompanyInput) => db.company.create({ data: input }),
};

export const contactService = {
  list: () => db.contact.findMany({
    include: { company: true },
    orderBy: { updatedAt: "desc" },
  }),
  get: (id: string) => db.contact.findUnique({
    where: { id },
    include: { company: true, deals: true, activities: true, tasks: true },
  }),
  create: (input: CreateContactInput) => db.contact.create({ data: input }),
};

export const dealService = {
  list: () => db.deal.findMany({
    include: { company: true, contact: true },
    orderBy: { updatedAt: "desc" },
  }),
  get: (id: string) => db.deal.findUnique({
    where: { id },
    include: { company: true, contact: true, activities: true, tasks: true },
  }),
  create: (input: CreateDealInput) => db.deal.create({
    data: {
      ...input,
      value: input.value,
    },
  }),
};

export const activityService = {
  listRecent: (limit = 50) => db.activity.findMany({
    take: limit,
    include: { company: true, contact: true, deal: true },
    orderBy: { occurredAt: "desc" },
  }),
};

export const taskService = {
  listOpen: () => db.task.findMany({
    where: { status: { in: ["TODO", "IN_PROGRESS"] } },
    include: { company: true, contact: true, deal: true },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
  }),
};

export const dashboardService = {
  async summary() {
    const [companies, contacts, openDeals, wonDeals, openTasks] = await Promise.all([
      db.company.count(),
      db.contact.count(),
      db.deal.aggregate({ where: { status: "OPEN" }, _sum: { value: true }, _count: true }),
      db.deal.aggregate({ where: { status: "WON" }, _sum: { value: true }, _count: true }),
      db.task.count({ where: { status: { in: ["TODO", "IN_PROGRESS"] } } }),
    ]);

    return {
      companies,
      contacts,
      openDeals: openDeals._count,
      openPipelineValue: Number(openDeals._sum.value ?? 0),
      wonDeals: wonDeals._count,
      wonRevenue: Number(wonDeals._sum.value ?? 0),
      openTasks,
    };
  },
};
