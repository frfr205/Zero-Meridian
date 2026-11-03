import { NextResponse } from "next/server";
import { CaseRuleError, DatabaseUnavailableError } from "./case-service";

export function apiError(reason: unknown) {
  if (reason instanceof CaseRuleError) {
    return NextResponse.json({ ok: false, code: "CASE_RULE", message: reason.message }, { status: 400 });
  }
  const databaseError = reason instanceof DatabaseUnavailableError;
  if (!databaseError) console.error("Zero Meridian API error:", reason);
  return NextResponse.json({
    ok: false,
    code: "DATABASE_UNAVAILABLE",
    message: "The PostgreSQL dossier is unavailable. You can keep investigating; this browser will store the case locally.",
  }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
