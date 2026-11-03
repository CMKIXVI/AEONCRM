import { dealService } from "@aeoncrm/core";
import { getRequestIdentity } from "../../../lib/auth";
import { handleApiError, json } from "../../../lib/api";

export async function GET(request: Request) {
  try { return json(await dealService.list(getRequestIdentity(request))); }
  catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const identity = getRequestIdentity(request);
    const body = await request.json();
    if (!body?.name || body.value === undefined) return json({ error: "name and value are required" }, 400);
    return json(await dealService.create(identity, {
      name: body.name.trim(), value: Number(body.value), currency: body.currency,
      stage: body.stage, probability: body.probability === undefined ? undefined : Number(body.probability),
      expectedAt: body.expectedAt ? new Date(body.expectedAt) : undefined, companyId: body.companyId, contactId: body.contactId,
    }), 201);
  } catch (error) { return handleApiError(error); }
}
