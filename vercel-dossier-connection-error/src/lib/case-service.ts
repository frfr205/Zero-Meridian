import "server-only";

import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { attemptLog, caseSessions, stageProgress } from "@/db/schema";
import { STAGES } from "./case-data";
import { createCaseState, HINTS, refreshCaseState, verifyStage } from "./case-engine";
import type { CaseState, StageId, SubmitResult } from "./case-types";

const COOKIE_NAME = "nm_case_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

type SessionRow = typeof caseSessions.$inferSelect;

export class DatabaseUnavailableError extends Error {
  code = "DATABASE_UNAVAILABLE";
  constructor(configured = isDatabaseConfigured()) {
    super(configured ? "PostgreSQL did not accept the connection." : "DATABASE_URL is not configured.");
    this.name = "DatabaseUnavailableError";
  }
}

export class CaseRuleError extends Error {
  constructor(message: string) { super(message); this.name = "CaseRuleError"; }
}

function requireDb(): NonNullable<typeof db> {
  if (!db) throw new DatabaseUnavailableError(false);
  return db;
}

export async function getOrCreateSession(): Promise<SessionRow> {
  const database = requireDb();
  const jar = await cookies();
  const existingId = jar.get(COOKIE_NAME)?.value;
  const validSessionId = existingId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existingId);
  if (validSessionId && existingId) {
    const [existing] = await database.select().from(caseSessions).where(eq(caseSessions.id, existingId)).limit(1);
    if (existing) return existing;
  }
  const [created] = await database.insert(caseSessions).values({}).returning();
  jar.set(COOKIE_NAME, created.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: COOKIE_MAX_AGE });
  return created;
}

export async function buildCaseState(sessionId: string): Promise<CaseState> {
  const database = requireDb();
  const [session] = await database.select().from(caseSessions).where(eq(caseSessions.id, sessionId)).limit(1);
  if (!session) throw new CaseRuleError("Investigation session not found.");
  const progress = await database.select().from(stageProgress).where(eq(stageProgress.sessionId, sessionId));
  const progressMap = new Map(progress.map((row) => [row.stageId, row]));
  const base = createCaseState(session.id);
  const state: CaseState = {
    ...base,
    session: {
      id: session.id, alias: session.alias,
      startedAt: session.startedAt?.toISOString() ?? null,
      completedAt: session.completedAt?.toISOString() ?? null,
    },
    stages: STAGES.map((definition) => {
      const row = progressMap.get(definition.id);
      return { id: definition.id, unlocked: false, solved: Boolean(row?.solvedAt), attempts: row?.attempts ?? 0, hintsUsed: row?.hintsUsed ?? 0, solvedAt: row?.solvedAt?.toISOString() ?? null };
    }),
    revealedHints: Object.fromEntries(progress.filter((row) => row.hintsUsed > 0 && STAGES.some((stage) => stage.id === row.stageId)).map((row) => [row.stageId, HINTS[row.stageId as StageId].slice(0, row.hintsUsed)])),
    notes: session.notes,
    stats: { solved: 0, attempts: session.wrongAttempts, hints: session.hintsUsed, elapsedSeconds: 0 },
  };
  return refreshCaseState(state);
}

export async function startSession(alias: string): Promise<void> {
  const database = requireDb();
  const session = await getOrCreateSession();
  await database.update(caseSessions).set({ alias: alias.trim().slice(0, 40) || "Observer", startedAt: session.startedAt ?? new Date(), updatedAt: new Date() }).where(eq(caseSessions.id, session.id));
}

export async function saveNotes(notes: string): Promise<void> {
  const database = requireDb();
  const session = await getOrCreateSession();
  await database.update(caseSessions).set({ notes: notes.slice(0, 20000), updatedAt: new Date() }).where(eq(caseSessions.id, session.id));
}

export async function resetSession(): Promise<void> {
  const database = requireDb();
  const session = await getOrCreateSession();
  await database.delete(attemptLog).where(eq(attemptLog.sessionId, session.id));
  await database.delete(stageProgress).where(eq(stageProgress.sessionId, session.id));
  await database.update(caseSessions).set({ startedAt: null, completedAt: null, notes: "", wrongAttempts: 0, hintsUsed: 0, updatedAt: new Date() }).where(eq(caseSessions.id, session.id));
}

async function ensureStageRow(sessionId: string, stageId: StageId) {
  const database = requireDb();
  await database.insert(stageProgress).values({ sessionId, stageId }).onConflictDoNothing();
  const [row] = await database.select().from(stageProgress).where(and(eq(stageProgress.sessionId, sessionId), eq(stageProgress.stageId, stageId))).limit(1);
  if (!row) throw new Error("Could not initialize stage progress.");
  return row;
}

export async function submitServerStage(stageId: StageId, payload: unknown): Promise<{ state: CaseState; result: SubmitResult }> {
  const database = requireDb();
  const session = await getOrCreateSession();
  const before = await buildCaseState(session.id);
  const stage = before.stages.find((item) => item.id === stageId);
  if (!stage?.unlocked) throw new CaseRuleError("This act is still locked. Complete the previous link first.");
  if (stage.solved) return { state: before, result: { correct: true, message: "This act has already been accepted." } };
  const result = verifyStage(stageId, payload);
  const row = await ensureStageRow(session.id, stageId);
  const now = new Date();
  const recordedPayload = { value: payload ?? null };
  await database.transaction(async (transaction) => {
    await transaction.insert(attemptLog).values({ sessionId: session.id, stageId, submitted: recordedPayload, correct: result.correct ? 1 : 0 });
    await transaction.update(stageProgress).set({ attempts: row.attempts + 1, solvedAt: result.correct ? now : row.solvedAt, payload: recordedPayload, updatedAt: now }).where(eq(stageProgress.id, row.id));
    await transaction.update(caseSessions).set({ wrongAttempts: session.wrongAttempts + (result.correct ? 0 : 1), completedAt: result.correct && stageId === "core" ? now : session.completedAt, updatedAt: now }).where(eq(caseSessions.id, session.id));
  });
  return { state: await buildCaseState(session.id), result };
}

export async function revealServerHint(stageId: StageId): Promise<{ state: CaseState; hint: string; message?: string }> {
  const database = requireDb();
  const session = await getOrCreateSession();
  const before = await buildCaseState(session.id);
  const stage = before.stages.find((item) => item.id === stageId);
  if (!stage?.unlocked) throw new CaseRuleError("Complete the previous act to unlock these hints.");
  const row = await ensureStageRow(session.id, stageId);
  if (row.hintsUsed >= HINTS[stageId].length) return { state: before, hint: HINTS[stageId][HINTS[stageId].length - 1], message: "All three hint levels are already open." };
  const used = row.hintsUsed + 1;
  await database.update(stageProgress).set({ hintsUsed: used, updatedAt: new Date() }).where(eq(stageProgress.id, row.id));
  await database.update(caseSessions).set({ hintsUsed: session.hintsUsed + 1, updatedAt: new Date() }).where(eq(caseSessions.id, session.id));
  return { state: await buildCaseState(session.id), hint: HINTS[stageId][used - 1] };
}
