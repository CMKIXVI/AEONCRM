import { contactService } from "@aeoncrm/core";
import { handleApiError, json } from "../../../lib/api";

export async function GET() {
  try {
    return json(await contactService.list());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.firstName || !body?.lastName) {
      return json({ error: "firstName and lastName are required" }, 400);
    }
    return json(await contactService.create(body), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
