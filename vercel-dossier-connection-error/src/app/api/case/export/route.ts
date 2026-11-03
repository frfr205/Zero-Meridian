import { apiError } from "@/lib/api-response";
import { buildDossierMarkdown } from "@/lib/case-export";
import { buildCaseState, getOrCreateSession } from "@/lib/case-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getOrCreateSession();
    const state = await buildCaseState(session.id);
    const format = new URL(request.url).searchParams.get("format") === "json" ? "json" : "md";
    const body = format === "json" ? JSON.stringify({ case: "Zero Meridian", persistence: "server", exportedAt: new Date().toISOString(), state }, null, 2) : buildDossierMarkdown(state, "server");
    return new Response(body, { headers: { "Content-Type": format === "json" ? "application/json; charset=utf-8" : "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="zero-meridian-dossier.${format}"`, "Cache-Control": "no-store" } });
  } catch (reason) { return apiError(reason); }
}
