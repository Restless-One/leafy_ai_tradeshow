import type { OverrideRequest } from "@/lib/domain";
import { actorFromRequest } from "@/lib/request-auth";
import { setAutomationOverride } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const actor = actorFromRequest(request);
  if (!actor) return Response.json({ error: "Sign in is required for manual overrides." }, { status: 401 });
  let body: Partial<OverrideRequest>;
  try { body = await request.json() as Partial<OverrideRequest>; } catch { return Response.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if ((body.mode !== "pause" && body.mode !== "resume" && body.mode !== "emergency_stop") || typeof body.reason !== "string" || body.reason.trim().length < 4) {
    return Response.json({ error: "A valid override mode and reason are required." }, { status: 400 });
  }
  await setAutomationOverride({ mode: body.mode, reason: body.reason.trim().slice(0, 240) }, actor);
  return Response.json({ ok: true });
}
