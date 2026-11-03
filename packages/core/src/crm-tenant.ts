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

async function lead(context: TenantContext, id?: string) {
  if (!id) return;
  if (!(await db.lead.findFirst({ where: { id, tenantId: tenant(context) }, select: { id: true } }))) throw new Error("lead not found");
}

async function ticket(context: TenantContext, id?: string) {
  if (!id) return;
  if (!(await db.ticket.findFirst({ where: { id, tenantId: tenant(context) }, select: { id: true } }))) throw new Error("ticket not found");
}

async function product(context: TenantContext, id?: string) {
  if (!id) return;
  if (!(await db.product.findFirst({ where: { id, tenantId: tenant(context) }, select: { id: true } }))) throw new Error("product not found");
}

async function lineItem(context: TenantContext, id?: string) {
  if (!id) return;
  if (!(await db.lineItem.findFirst({ where: { id, tenantId: tenant(context) }, select: { id: true } }))) throw new Error("line item not found");
}

export const tenantCrm = {
  company,
  contact,
  deal,
  lead,
  ticket,
  product,
  lineItem,
  tenant,
};
