export const STAGE_IDS = [
  "protocol",
  "catalogue",
  "cipher",
  "signal",
  "atlas",
  "network",
  "core",
] as const;

export type StageId = (typeof STAGE_IDS)[number];
export type SiteId = "hub" | "archive" | "relay" | "atlas" | "core";
export type PersistenceMode = "connecting" | "server" | "local";

export interface StageDefinition {
  id: StageId;
  index: number;
  number: string;
  title: string;
  subtitle: string;
  site: SiteId;
  siteLabel: string;
  href: string;
  duration: string;
  brief: string;
  objective: string;
  prerequisites: StageId[];
}

export interface EvidenceItem {
  id: string;
  stageId: StageId;
  title: string;
  source: string;
  body: string;
  tag: string;
}

export interface StageState {
  id: StageId;
  unlocked: boolean;
  solved: boolean;
  attempts: number;
  hintsUsed: number;
  solvedAt: string | null;
}

export interface CaseSession {
  id: string;
  alias: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface CaseState {
  session: CaseSession;
  stages: StageState[];
  fragments: Partial<Record<StageId, string>>;
  revealedHints: Partial<Record<StageId, string[]>>;
  notes: string;
  stats: {
    solved: number;
    attempts: number;
    hints: number;
    elapsedSeconds: number;
  };
}

export interface Suspect {
  id: string;
  name: string;
  role: string;
  shift: string;
  access: string;
  statement: string;
  detail: string;
}

export interface ApiResult {
  ok: boolean;
  message?: string;
  code?: string;
  state?: CaseState;
  hint?: string;
  correct?: boolean;
}

export interface SubmitResult {
  correct: boolean;
  message: string;
}
