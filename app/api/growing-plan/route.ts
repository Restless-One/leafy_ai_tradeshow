import type { GrowingPlanUpdateRequest } from "@/lib/domain";
import { actorFromRequest } from "@/lib/request-auth";
import { updateGrowingPlan } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const actor = actorFromRequest(request);
  if (!actor) return Response.json({ error: "Sign in is required to update the growing plan." }, { status: 401 });
  let body: Partial<GrowingPlanUpdateRequest>;
  try { body = await request.json() as Partial<GrowingPlanUpdateRequest>; } catch { return Response.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (typeof body.stage !== "string" || typeof body.nextMilestone !== "string" || typeof body.nextMilestoneAt !== "string") {
    return Response.json({ error: "Stage, milestone and milestone date are required." }, { status: 400 });
  }
  if (!Number.isFinite(new Date(body.nextMilestoneAt).getTime())) return Response.json({ error: "Milestone date is invalid." }, { status: 400 });
  await updateGrowingPlan({ stage: body.stage.trim().slice(0, 80), nextMilestone: body.nextMilestone.trim().slice(0, 140), nextMilestoneAt: body.nextMilestoneAt }, actor);
  return Response.json({ ok: true });
}
