import { db, company as companyTable, contact as contactTable, deal as dealTable, lead as leadTable, ticket as ticketTable, product as productTable, lineItem as lineItemTable } from "@aeoncrm/db";
import { and, eq } from "drizzle-orm";
import type { TenantContext } from "./agent-memory";

function tenant(context: TenantContext) {
  if (!context?.tenantId) throw new Error("tenant context is required");
  return context.tenantId;
}

async function company(context: TenantContext, id?: string) {
  if (!id) return;
  if (!(await db.select({ id: companyTable.id }).from(companyTable).where(and(eq(companyTable.id, id), eq(companyTable.tenantId, tenant(context)))).limit(1))[0]) throw new Error("company not found");
}

async function contact(context: TenantContext, id?: string) {
  if (!id) return;
  if (!(await db.select({ id: contactTable.id }).from(contactTable).where(and(eq(contactTable.id, id), eq(contactTable.tenantId, tenant(context)))).limit(1))[0]) throw new Error("contact not found");
}

async function deal(context: TenantContext, id?: string) {
  if (!id) return;
  if (!(await db.select({ id: dealTable.id }).from(dealTable).where(and(eq(dealTable.id, id), eq(dealTable.tenantId, tenant(context)))).limit(1))[0]) throw new Error("deal not found");
}

async function lead(context: TenantContext, id?: string) {
  if (!id) return;
  if (!(await db.select({ id: leadTable.id }).from(leadTable).where(and(eq(leadTable.id, id), eq(leadTable.tenantId, tenant(context)))).limit(1))[0]) throw new Error("lead not found");
}

async function ticket(context: TenantContext, id?: string) {
  if (!id) return;
  if (!(await db.select({ id: ticketTable.id }).from(ticketTable).where(and(eq(ticketTable.id, id), eq(ticketTable.tenantId, tenant(context)))).limit(1))[0]) throw new Error("ticket not found");
}

async function product(context: TenantContext, id?: string) {
  if (!id) return;
  if (!(await db.select({ id: productTable.id }).from(productTable).where(and(eq(productTable.id, id), eq(productTable.tenantId, tenant(context)))).limit(1))[0]) throw new Error("product not found");
}

async function lineItem(context: TenantContext, id?: string) {
  if (!id) return;
  if (!(await db.select({ id: lineItemTable.id }).from(lineItemTable).where(and(eq(lineItemTable.id, id), eq(lineItemTable.tenantId, tenant(context)))).limit(1))[0]) throw new Error("line item not found");
}

export const tenantCrm = { company, contact, deal, lead, ticket, product, lineItem, tenant };
