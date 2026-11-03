import { getConversation } from "@aeoncrm/agent";
import { handleApiError, json } from "../../../../lib/api";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId") ?? "default";
    const limit = Number(url.searchParams.get("limit") ?? 20);
    return json(getConversation(sessionId, Number.isFinite(limit) ? limit : 20));
  } catch (error) {
    return handleApiError(error);
  }
}
