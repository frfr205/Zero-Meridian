import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { revealServerHint } from "@/lib/case-service";
import { STAGE_IDS, type StageId } from "@/lib/case-types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { stageId?: string };
    if (!STAGE_IDS.includes(body.stageId as StageId)) return NextResponse.json({ ok: false, code: "CASE_RULE", message: "Unknown act." }, { status: 400 });
    const result = await revealServerHint(body.stageId as StageId);
    return NextResponse.json({ ok: true, ...result });
  } catch (reason) { return apiError(reason); }
}
