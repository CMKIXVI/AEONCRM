import { runAgent } from "@aeoncrm/agent";
import { handleApiError, json } from "../../../lib/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.message?.trim()) return json({ error: "message is required" }, { status: 400 });
    return json(await runAgent({
      message: body.message.trim(),
      approved: Boolean(body.approved),
      conversationId: typeof body.conversationId === "string" ? body.conversationId : undefined,
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
