import { readDashboardSnapshot } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await readDashboardSnapshot();
    return Response.json(snapshot, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Unable to load dashboard snapshot", error);
    return Response.json(
      { error: "Dashboard data is temporarily unavailable." },
      { status: 503 },
    );
  }
}
