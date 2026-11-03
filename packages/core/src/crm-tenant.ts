import { db } from "@aeoncrm/db";
import type { TenantContext } from "./agent-memory";

function tenant(context: TenantContext) {
  if (!context?.tenantId) throw new Error("tenant context is required");
  return context.tenantId;
}

async function company(context: TenantContext, id?: string) {
  if (!id) return;
  if (!(await db.company.findFirst({ where: { id, tenantId: tenant(context) }, select: { id: true } }))) throw new Error("company not found");
}

async function contact(context: TenantContext, id?: string) {
  if (!id) return;
  if (!(await db.contact.findFirst({ where: { id, tenantId: tenant(context) }, select: { id: true } }))) throw new Error("contact not found");
}

async function deal(context: TenantContext, id?: string) {
  if (!id) return;
  if (!(await db.deal.findFirst({ where: { id, tenantId: tenant(context) }, select: { id: true } }))) throw new Error("deal not found");
}

export const tenantCrm = {
  company,
  contact,
  deal,
  tenant,
};
