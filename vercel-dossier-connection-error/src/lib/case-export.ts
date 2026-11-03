import { CASE_CODE, CASE_TITLE, EVIDENCE, STAGES } from "./case-data";
import type { CaseState } from "./case-types";

export function formatDuration(total: number): string {
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function buildDossierMarkdown(state: CaseState, persistence: "server" | "local" = "local"): string {
  const solved = new Set(state.stages.filter((stage) => stage.solved).map((stage) => stage.id));
  const lines = [
    `# ${CASE_TITLE}`, "", `${CASE_CODE} · Independent witness dossier`, "",
    `- Observer: ${state.session.alias}`,
    `- Session: ${state.session.id}`,
    `- Persistence: ${persistence === "server" ? "PostgreSQL server" : "this browser"}`,
    `- Started: ${state.session.startedAt ?? "not started"}`,
    `- Closed: ${state.session.completedAt ?? "open"}`,
    `- Progress: ${state.stats.solved}/7 acts`,
    `- Elapsed: ${formatDuration(state.stats.elapsedSeconds)}`,
    `- Failed checks: ${state.stats.attempts}`,
    `- Hints revealed: ${state.stats.hints}`, "",
    "## Acts", "",
    ...STAGES.flatMap((stage) => {
      const progress = state.stages.find((item) => item.id === stage.id)!;
      return [`### ${stage.number} · ${stage.title}`, "", `${progress.solved ? "SOLVED" : progress.unlocked ? "OPEN" : "LOCKED"} · ${stage.objective}`, progress.solvedAt ? `Accepted: ${progress.solvedAt}` : "", ""];
    }),
    "## Recovered evidence", "",
    ...(() => {
      const recovered = EVIDENCE.filter((item) => solved.has(item.stageId));
      return recovered.length ? recovered.flatMap((item) => [`### ${item.title}`, `*${item.source} · ${item.tag}*`, "", item.body, ""]) : ["No evidence recovered yet.", ""];
    })(),
    "## Observer notes", "", state.notes || "No notes recorded.", "",
    "---", "Generated locally from the current case state. No answers are added to this export.",
  ];
  return lines.join("\n");
}
