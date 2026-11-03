import { taskService } from "@aeoncrm/core";
import { handleApiError, json } from "../../../lib/api";

export async function GET() { try { return json(await taskService.listOpen()); } catch (error) { return handleApiError(error); } }
export async function POST(request: Request) { try { const body = await request.json(); if (!body.title?.trim()) return json({ error: "title is required" }, { status: 400 }); return json(await taskService.create({ title: body.title.trim(), notes: body.notes, dueAt: body.dueAt ? new Date(body.dueAt) : undefined, companyId: body.companyId, contactId: body.contactId, dealId: body.dealId }), { status: 201 }); } catch (error) { return handleApiError(error); } }
