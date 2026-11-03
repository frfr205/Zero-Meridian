import { relations } from "drizzle-orm";
import { integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const caseSessions = pgTable("case_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  alias: text("alias").notNull().default("Observer"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  notes: text("notes").notNull().default(""),
  wrongAttempts: integer("wrong_attempts").notNull().default(0),
  hintsUsed: integer("hints_used").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stageProgress = pgTable("stage_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => caseSessions.id, { onDelete: "cascade" }),
  stageId: text("stage_id").notNull(),
  attempts: integer("attempts").notNull().default(0),
  hintsUsed: integer("hints_used").notNull().default(0),
  solvedAt: timestamp("solved_at", { withTimezone: true }),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("stage_progress_session_stage_unique").on(table.sessionId, table.stageId)]);

export const attemptLog = pgTable("attempt_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => caseSessions.id, { onDelete: "cascade" }),
  stageId: text("stage_id").notNull(),
  submitted: jsonb("submitted").notNull(),
  correct: integer("correct").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessionRelations = relations(caseSessions, ({ many }) => ({
  progress: many(stageProgress), attempts: many(attemptLog),
}));
