import type { AlertAcknowledgeRequest } from "@/lib/domain";
import { actorFromRequest, cleanComment } from "@/lib/request-auth";
import { acknowledgeAlert } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const actor = actorFromRequest(request);
  if (!actor) return Response.json({ error: "Sign in is required to acknowledge alerts." }, { status: 401 });
  let body: Partial<AlertAcknowledgeRequest>;
  try { body = await request.json() as Partial<AlertAcknowledgeRequest>; } catch { return Response.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (typeof body.alertId !== "string") return Response.json({ error: "An alert id is required." }, { status: 400 });
  try {
    await acknowledgeAlert({ alertId: body.alertId, comment: cleanComment(body.comment) }, actor);
    return Response.json({ ok: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    return Response.json({ error: code.replaceAll("_", " ").toLowerCase() }, { status: code.includes("NOT_FOUND") ? 404 : 409 });
  }
}
