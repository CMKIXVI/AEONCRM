import { activityService } from "@aeoncrm/core";
import { getRequestIdentity } from "../../../lib/auth";
import { handleApiError, json } from "../../../lib/api";

export async function GET(request: Request) {
  try {
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 50);
    return json(await activityService.listRecent(getRequestIdentity(request), Math.min(Math.max(limit, 1), 100)));
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const identity = getRequestIdentity(request);
    const body = await request.json();
    if (!body.subject?.trim() || !body.type) return json({ error: "type and subject are required" }, { status: 400 });
    return json(await activityService.create(identity, { type: body.type, subject: body.subject.trim(), notes: body.notes, occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined, companyId: body.companyId, contactId: body.contactId, dealId: body.dealId }), { status: 201 });
  } catch (error) { return handleApiError(error); }
}
