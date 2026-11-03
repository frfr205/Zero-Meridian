"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, ChevronDown, Lightbulb, LockKeyhole, Sparkles } from "lucide-react";
import { FRAGMENTS, getStage, STAGES } from "@/lib/case-data";
import type { StageId, SubmitResult } from "@/lib/case-types";
import { useCase } from "./case-provider";

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 44, clipPath: "inset(0 0 22% 0)" }} whileInView={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

export function StageHeader({ id, kicker }: { id: StageId; kicker?: string }) {
  const definition = getStage(id)!;
  const { state } = useCase();
  const progress = state?.stages.find((stage) => stage.id === id);
  return <header className="stage-header">
    <div className="stage-number">{definition.number}</div>
    <div className="stage-heading-copy">
      <span className="eyebrow">{kicker ?? `${definition.siteLabel} / Act ${definition.number}`}</span>
      <h1>{definition.title}</h1>
      <p className="stage-subtitle">{definition.subtitle}</p>
    </div>
    <div className="stage-header-meta">
      <span className={`status-pill ${progress?.solved ? "solved" : progress?.unlocked ? "open" : "locked"}`}>{progress?.solved ? <Check /> : progress?.unlocked ? <Sparkles /> : <LockKeyhole />}{progress?.solved ? "Evidence accepted" : progress?.unlocked ? "Act available" : "Act locked"}</span>
      <span>{definition.duration}</span>
    </div>
    <p className="stage-brief">{definition.brief}</p>
    <div className="stage-objective"><span>Objective</span><strong>{definition.objective}</strong></div>
  </header>;
}

export function StageGate({ id, children }: { id: StageId; children: ReactNode }) {
  const { state, loading } = useCase();
  const stage = state?.stages.find((item) => item.id === id);
  const definition = getStage(id)!;
  if (loading && !state) return <div className="stage-gate-loading"><span className="loader-line" /><p>Opening the case state…</p></div>;
  if (!stage?.unlocked && !stage?.solved) {
    const previousId = definition.prerequisites[definition.prerequisites.length - 1];
    const previous = previousId ? getStage(previousId) : undefined;
    return <motion.section className="locked-gate" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
      <div className="locked-orbit"><LockKeyhole /></div>
      <span className="eyebrow">Cryptographic sequence / access denied</span>
      <h2>This act has no input yet.</h2>
      <p>The material is preserved, but the workbench opens only after the previous evidence is accepted. Nothing is skipped and no answer is pre-filled.</p>
      {previous ? <Link className="primary-button" href={previous.href}>Return to {previous.title}<ArrowRight /></Link> : <Link className="primary-button" href="/">Open the briefing<ArrowRight /></Link>}
      <div className="route-mini">{STAGES.map((item) => <span key={item.id} className={state?.stages.find((s) => s.id === item.id)?.solved ? "done" : item.id === id ? "current" : ""}>{item.number}</span>)}</div>
    </motion.section>;
  }
  return <>{children}</>;
}

export function HintPanel({ stageId }: { stageId: StageId }) {
  const { state, revealHint } = useCase();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(true);
  const stage = state?.stages.find((item) => item.id === stageId);
  const hints = state?.revealedHints[stageId] ?? [];
  const used = stage?.hintsUsed ?? 0;
  const requestHint = async () => {
    setPending(true);
    await revealHint(stageId);
    setPending(false);
    setOpen(true);
  };
  return <section className="hint-panel">
    <button className="hint-panel-heading" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
      <span><Lightbulb />Observer assistance <small>{used} / 3 revealed</small></span><ChevronDown className={open ? "rotated" : ""} />
    </button>
    <AnimatePresence initial={false}>{open && <motion.div className="hint-panel-body" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
      <p>Hints are optional and recorded in the final rank. Each level is more explicit than the last.</p>
      <div className="hint-list">{hints.map((hint, index) => <motion.article key={index} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}><span>0{index + 1}</span><p>{hint}</p></motion.article>)}</div>
      <button className="secondary-button" onClick={() => void requestHint()} disabled={pending || used >= 3 || !stage?.unlocked}>{pending ? "Opening hint…" : used >= 3 ? "All hints revealed" : used === 0 ? "Reveal a directional hint" : `Reveal level ${used + 1}`}<Lightbulb /></button>
    </motion.div>}</AnimatePresence>
  </section>;
}

export function SolvedFragment({ stageId }: { stageId: StageId }) {
  const { state } = useCase();
  const stage = state?.stages.find((item) => item.id === stageId);
  if (!stage?.solved) return null;
  return <motion.div className="solved-fragment" initial={{ opacity: 0, scaleX: 0.7 }} animate={{ opacity: 1, scaleX: 1 }}><Check /><span>Act accepted · evidence added to the dossier</span><strong>{stageId === "core" ? "CASE CLOSED" : `FRAGMENT ${FRAGMENTS[stageId]}`}</strong></motion.div>;
}

export function SubmissionFeedback({ feedback }: { feedback: SubmitResult | null }) {
  return <AnimatePresence mode="wait">{feedback && <motion.div key={`${feedback.correct}-${feedback.message}`} className={`submission-feedback ${feedback.correct ? "correct" : "incorrect"}`} initial={{ opacity: 0, y: 10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, height: 0 }} role="status"><span>{feedback.correct ? <Check /> : "×"}</span><p>{feedback.message}</p></motion.div>}</AnimatePresence>;
}

export function PuzzleActions({ children }: { children: ReactNode }) {
  return <div className="puzzle-actions">{children}</div>;
}

export function useStageSubmission(stageId: StageId) {
  const { submit } = useCase();
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<SubmitResult | null>(null);
  const check = async (payload: unknown) => {
    setPending(true);
    const result = await submit(stageId, payload);
    setFeedback(result);
    setPending(false);
    return result;
  };
  return { check, pending, feedback };
}
