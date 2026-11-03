import { dashboardService } from "@aeoncrm/core";
import { handleApiError, json } from "../../../lib/api";

export async function GET() {
  try {
    return json(await dashboardService.summary());
  } catch (error) {
    return handleApiError(error);
  }
}
