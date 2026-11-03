import { agentApprovalService } from "@aeoncrm/core";
import { handleApiError, json } from "../../../../../lib/api";

export async function GET(request: Request) {
  try {
    const conversationId = new URL(request.url).searchParams.get("conversationId") || undefined;
    return json({ approvals: await agentApprovalService.listPending(conversationId) });
  } catch (error) {
    return handleApiError(error);
  }
}
