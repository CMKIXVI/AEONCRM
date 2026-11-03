import { agentConversationService } from "@aeoncrm/core";
import { handleApiError, json } from "../../../../lib/api";

export async function GET() {
  try {
    return json({ conversations: await agentConversationService.list() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const conversation = await agentConversationService.create(body.title?.trim() || "New conversation");
    return json({ conversation }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
