import { agentConversationService } from "@aeoncrm/core";
import { handleApiError, json } from "../../../../../lib/api";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const conversation = await agentConversationService.get(params.id);
    if (!conversation) return json({ error: "conversation not found" }, { status: 404 });
    return json({ conversation });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    return json(await agentConversationService.archive(params.id));
  } catch (error) {
    return handleApiError(error);
  }
}
