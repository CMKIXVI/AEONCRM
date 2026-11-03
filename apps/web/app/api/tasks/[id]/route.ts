import { taskService } from "@aeoncrm/core";
import { handleApiError, json } from "../../../../lib/api";

export async function PATCH(_: Request, { params }: { params: { id: string } }) { try { return json(await taskService.complete(params.id)); } catch (error) { return handleApiError(error); } }
