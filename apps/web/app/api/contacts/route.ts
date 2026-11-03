import { contactService } from "@aeoncrm/core";
import { getRequestIdentity } from "../../../lib/auth";
import { handleApiError, json } from "../../../lib/api";

export async function GET(request: Request) {
  try { return json(await contactService.list(getRequestIdentity(request))); }
  catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const identity = getRequestIdentity(request);
    const body = await request.json();
    if (!body?.firstName || !body?.lastName) return json({ error: "firstName and lastName are required" }, 400);
    return json(await contactService.create(identity, { firstName: body.firstName.trim(), lastName: body.lastName.trim(), email: body.email, phone: body.phone, title: body.title, companyId: body.companyId }), 201);
  } catch (error) { return handleApiError(error); }
}
