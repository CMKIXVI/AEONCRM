import { dashboardService } from "@aeoncrm/core";
import { getRequestIdentity } from "../../../lib/auth";
import { handleApiError, json } from "../../../lib/api";

export async function GET(request: Request) {
  try { return json(await dashboardService.summary(getRequestIdentity(request))); }
  catch (error) { return handleApiError(error); }
}
