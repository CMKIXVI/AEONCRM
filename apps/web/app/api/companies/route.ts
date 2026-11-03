import { companyService } from "@aeoncrm/core";
import { handleApiError, json } from "../../../lib/api";

export async function GET() {
  try {
    return json(await companyService.list());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name || typeof body.name !== "string") {
      return json({ error: "name is required" }, 400);
    }
    return json(await companyService.create({
      name: body.name.trim(),
      website: body.website,
      industry: body.industry,
      description: body.description,
    }), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
