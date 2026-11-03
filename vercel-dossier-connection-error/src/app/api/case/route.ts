import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { buildCaseState, getOrCreateSession, resetSession, saveNotes, startSession } from "@/lib/case-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getOrCreateSession();
    return NextResponse.json({ ok: true, state: await buildCaseState(session.id) }, { headers: { "Cache-Control": "no-store" } });
  } catch (reason) { return apiError(reason); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { action?: string; alias?: string; notes?: string; confirm?: string };
    const session = await getOrCreateSession();
    if (body.action === "start") await startSession(String(body.alias ?? ""));
    else if (body.action === "notes") await saveNotes(String(body.notes ?? ""));
    else if (body.action === "reset") {
      if (body.confirm !== "ZERO MERIDIAN") return NextResponse.json({ ok: false, code: "CASE_RULE", message: "Type the full case name to reset." }, { status: 400 });
      await resetSession();
    } else return NextResponse.json({ ok: false, code: "CASE_RULE", message: "Unknown action." }, { status: 400 });
    return NextResponse.json({ ok: true, state: await buildCaseState(session.id) });
  } catch (reason) { return apiError(reason); }
}
