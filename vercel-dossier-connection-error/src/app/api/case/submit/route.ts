import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { submitServerStage } from "@/lib/case-service";
import { STAGE_IDS, type StageId } from "@/lib/case-types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { stageId?: string; payload?: unknown };
    if (!STAGE_IDS.includes(body.stageId as StageId)) return NextResponse.json({ ok: false, code: "CASE_RULE", message: "Unknown act." }, { status: 400 });
    const { state, result } = await submitServerStage(body.stageId as StageId, body.payload);
    return NextResponse.json({ ok: true, state, correct: result.correct, message: result.message });
  } catch (reason) { return apiError(reason); }
}
