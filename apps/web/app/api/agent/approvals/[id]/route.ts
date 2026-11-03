import { executeApproval } from "@aeoncrm/agent";
import { agentApprovalService } from "@aeoncrm/core";
import { getRequestIdentity } from "../../../../../../lib/auth";
import { handleApiError, json } from "../../../../../../lib/api";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const identity = getRequestIdentity(request);
    const body = await request.json().catch(() => ({}));
    const action = body.action || "approve";
    const approval = await agentApprovalService.get(identity, params.id);
    if (!approval) return json({ error: "approval not found" }, 404);
    if (approval.status !== "PENDING") return json({ error: `approval is already ${approval.status.toLowerCase()}` }, 409);
    if (action === "reject") return json({ approval: await agentApprovalService.markRejected(identity, params.id) });
    if (action !== "approve") return json({ error: "action must be approve or reject" }, 400);
    try {
      await agentApprovalService.markApproved(identity, params.id);
    } catch (error) {
      if (error instanceof Error && error.message === "approval authority required") return json({ error: "approval authority required" }, 403);
      throw error;
    }
    return json(await executeApproval(identity, params.id));
  } catch (error) { return handleApiError(error); }
}
