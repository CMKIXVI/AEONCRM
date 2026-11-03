import { agentApprovalService } from "@aeoncrm/core";
import { handleApiError, json } from "../../../../../../lib/api";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || "approve";
    const approval = await agentApprovalService.get(params.id);
    if (!approval) return json({ error: "approval not found" }, { status: 404 });
    if (approval.status !== "PENDING") return json({ error: `approval is already ${approval.status.toLowerCase()}` }, { status: 409 });
    if (action === "reject") return json({ approval: await agentApprovalService.markRejected(params.id) });
    if (action !== "approve") return json({ error: "action must be approve or reject" }, { status: 400 });
    return json({ approval: await agentApprovalService.markApproved(params.id) });
  } catch (error) {
    return handleApiError(error);
  }
}
