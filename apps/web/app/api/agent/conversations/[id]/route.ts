import { agentConversationService } from "@aeoncrm/core";
import { getRequestIdentity } from "../../../../../lib/auth";
import { handleApiError, json } from "../../../../../lib/api";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const conversation = await agentConversationService.get(getRequestIdentity(request), params.id);
    if (!conversation) return json({ error: "conversation not found" }, { status: 404 });
    return json({ conversation });
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try { return json(await agentConversationService.archive(getRequestIdentity(request), params.id)); }
  catch (error) { return handleApiError(error); }
}
