import { agentConversationService } from "@aeoncrm/core";
import { getRequestIdentity } from "../../../../lib/auth";
import { handleApiError, json } from "../../../../lib/api";

export async function GET(request: Request) {
  try { return json({ conversations: await agentConversationService.list(getRequestIdentity(request)) }); }
  catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const identity = getRequestIdentity(request);
    const body = await request.json().catch(() => ({}));
    const conversation = await agentConversationService.create(identity, body.title?.trim() || "New conversation");
    return json({ conversation }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
