import type { ApprovalRequest } from "@/lib/domain";
import { actorFromRequest, cleanComment } from "@/lib/request-auth";
import { recordApprovalDecision } from "@/lib/store";

export const dynamic = "force-dynamic";

function isRequest(value: unknown): value is ApprovalRequest {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ApprovalRequest>;
  return typeof item.actionId === "string" && Number.isInteger(item.version) &&
    (item.decision === "approve" || item.decision === "reject");
}

export async function POST(request: Request) {
  const actor = actorFromRequest(request);
  if (!actor) return Response.json({ error: "Sign in is required for farm decisions." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (!isRequest(body)) return Response.json({ error: "Invalid approval request." }, { status: 400 });
  try {
    await recordApprovalDecision({ ...body, comment: cleanComment(body.comment) }, actor);
    return Response.json({ ok: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status = code === "ACTION_NOT_FOUND" ? 404 : code.includes("CONFLICT") || code.includes("DECIDED") ? 409 : 422;
    return Response.json({ error: code.replaceAll("_", " ").toLowerCase() }, { status });
  }
}
