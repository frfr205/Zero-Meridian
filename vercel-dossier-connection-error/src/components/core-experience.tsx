"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronRight, Copy, Cpu, Download, FileCheck2, Fingerprint, KeyRound, ShieldCheck, Trophy } from "lucide-react";
import { MOTIVES } from "@/lib/puzzle-data";
import { STAGES, SUSPECTS } from "@/lib/case-data";
import { formatDuration } from "@/lib/case-export";
import type { StageId } from "@/lib/case-types";
import { useCase } from "./case-provider";
import { usePersistentState } from "./use-persistent-state";
import { HintPanel, PuzzleActions, Reveal, StageGate, StageHeader, SubmissionFeedback, useStageSubmission } from "./stage-ui";

function CompletionCertificate() {
  const { state, notify, exportDossier } = useCase();
  if (!state?.session.completedAt) return null;
  const { hints, attempts, elapsedSeconds } = state.stats;
  const rank = hints === 0 && attempts === 0 ? "ABSOLUTE OBSERVER" : hints <= 3 && attempts <= 5 ? "KEEPER OF THE CHAIN" : "INDEPENDENT WITNESS";
  const share = async () => {
    const text = `I closed the “Zero Meridian” case: 7/7 acts, ${formatDuration(elapsedSeconds)}, ${attempts} failed checks, ${hints} hints. Rank: ${rank}.`;
    if (navigator.share) {
      try { await navigator.share({ title: "Zero Meridian", text }); return; } catch (reason) { if (reason instanceof DOMException && reason.name === "AbortError") return; }
    }
    try { await navigator.clipboard.writeText(text); notify("Result copied without revealing solutions.", "success"); }
    catch { notify("Clipboard access was blocked. Use the exported dossier instead.", "error"); }
  };
  return <motion.section className="completion-certificate" initial={{ opacity: 0, scale: 0.94, clipPath: "inset(20% 0 20% 0)" }} animate={{ opacity: 1, scale: 1, clipPath: "inset(0% 0 0% 0)" }} transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}>
    <div className="certificate-seal"><Trophy /><span>NM–17</span></div><span className="eyebrow">Independent witness protocol / complete</span><h2>CASE<br /><em>CLOSED</em></h2><p className="certificate-alias">{state.session.alias}</p><div className="certificate-rank"><small>Rank awarded</small><strong>{rank}</strong><span>Calculated from actual failed checks and hints, never randomized.</span></div><div className="certificate-stats"><div><strong>7/7</strong><span>acts</span></div><div><strong>{formatDuration(elapsedSeconds)}</strong><span>in the loop</span></div><div><strong>{attempts}</strong><span>misses</span></div><div><strong>{hints}</strong><span>hints</span></div></div><div className="certificate-actions"><button className="primary-button" onClick={() => exportDossier("md")}><Download />Download dossier</button><button className="secondary-button" onClick={() => exportDossier("json")}><FileCheck2 />Export JSON</button><button className="secondary-button" onClick={() => void share()}><Copy />Share result</button></div><small>Closed {new Intl.DateTimeFormat("en", { dateStyle: "long", timeStyle: "short" }).format(new Date(state.session.completedAt))}</small>
  </motion.section>;
}

function CorePuzzle() {
  const { state } = useCase();
  const [mask, setMask] = usePersistentState("core-mask", "511");
  const [code, setCode] = usePersistentState("core-code", "");
  const [culprit, setCulprit] = usePersistentState("core-culprit", "");
  const [motive, setMotive] = usePersistentState("core-motive", "");
  const { check, pending, feedback } = useStageSubmission("core");
  const solved = state?.stages.find((stage) => stage.id === "core")?.solved;
  const stageIds: StageId[] = ["protocol", "catalogue", "cipher", "signal", "atlas", "network"];
  const rows = stageIds.map((id, index) => ({ id, title: STAGES.find((stage) => stage.id === id)!.title, value: Number(state?.fragments[id] ?? 0), weight: index + 1 }));
  const registerA = rows.reduce((sum, row) => sum + row.value * row.weight, 0);
  const numericMask = Number(mask);
  const validMask = mask !== "" && Number.isInteger(numericMask) && numericMask >= 0;
  const registerB = validMask ? (registerA ^ numericMask) >>> 0 : 0;
  return <StageGate id="core"><div className="core-workbench">
    <div className="core-directive"><Cpu /><div><span className="eyebrow">Integrity directive / revision 511</span><h3>Two registers. One signature.</h3><p>Place fragments in the order they were earned. Compute <strong>A = Σ(Nᵢ × i)</strong>, where i = 1…6. Then compute <strong>B = A XOR 511</strong>. Join decimal A and B without a space. The mask is editable: the calculator performs a genuine bitwise XOR.</p></div></div>
    <div className="register-machine"><div className="fragment-register"><div className="register-head"><span>Input register</span><strong>{rows.filter((row) => row.value > 0).length} / 6 fragments</strong></div>{rows.map((row) => <div className="register-row" key={row.id}><span>{String(row.weight).padStart(2, "0")}</span><div><small>{row.title}</small><strong>{String(row.value).padStart(2, "0")}</strong></div><code>{row.value} × {row.weight} = {row.value * row.weight}</code></div>)}</div><div className="register-math"><div><small>Register A / weighted sum</small><strong>{registerA}</strong><code>{rows.map((row) => row.value * row.weight).join(" + ")} = {registerA}</code></div><label><span>XOR mask / decimal</span><div><span>DEC</span><input value={mask} onChange={(event) => setMask(event.target.value.replace(/\D/g, "").slice(0, 5))} inputMode="numeric" /></div><small>The mask is decimal; binary operands appear below.</small></label><div><small>Register B / A XOR mask</small><strong>{validMask ? registerB : "—"}</strong><code>{registerA.toString(2).padStart(10, "0")} ⊕ {validMask ? numericMask.toString(2).padStart(10, "0") : "—"} = {validMask ? registerB.toString(2).padStart(10, "0") : "—"}</code></div></div></div>
    <section className="verdict-section"><div className="verdict-heading"><Fingerprint /><div><span className="eyebrow">Part II / verdict</span><h3>Who built the route — and why?</h3><p>Cross-reference physical access to the archive, clearance II for phase, R-88 forms, and the note at station ZERO.</p></div></div><div className="core-suspects">{SUSPECTS.map((person) => <button key={person.id} className={culprit === person.id ? "selected" : ""} onClick={() => setCulprit(person.id)} disabled={solved}><div><span className="suspect-monogram small">{person.name.split(" ").map((part) => part[0]).join("")}</span>{culprit === person.id && <Check />}</div><h4>{person.name}</h4><strong>{person.role}</strong><p>{person.access}</p><small>{person.shift}</small></button>)}</div><fieldset className="motive-list"><legend>Author's motive</legend>{MOTIVES.map((item) => <label key={item.id} className={motive === item.id ? "selected" : ""}><input type="radio" name="motive" value={item.id} checked={motive === item.id} onChange={() => setMotive(item.id)} disabled={solved} /><span>{motive === item.id && <Check />}</span>{item.label}</label>)}</fieldset></section>
    <div className="core-submit"><label className="field-label">Two-register code<input className="core-code-input" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" inputMode="numeric" disabled={solved} /></label><div><span>Code: {code.length}/6</span><span>Author: {culprit ? "chosen" : "not chosen"}</span><span>Motive: {motive ? "chosen" : "not chosen"}</span></div><PuzzleActions><button className="primary-button" disabled={pending || solved || code.length !== 6 || !culprit || !motive} onClick={() => void check({ code, culprit, motive })}>{pending ? "Opening the core…" : solved ? "Verdict accepted" : "Close the case"}<KeyRound /></button></PuzzleActions></div>
    <SubmissionFeedback feedback={feedback} /><HintPanel stageId="core" />
    <AnimatePresence>{solved && <motion.div className="case-resolution" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}><ShieldCheck /><div><span className="eyebrow">Decrypted epilogue / station ZERO</span><h3>She did not steal the archive.<br />She made erasure impossible.</h3><p>Serafima Ro used her night-shift access and engineering forms to hide the originals in plain sight. The false cards were not a sale mechanism; they were a verification trail. The immutable backup is now released to you, the independent witness.</p></div></motion.div>}</AnimatePresence>
  </div></StageGate>;
}

export function CoreExperience() {
  return <main className="inner-page core-page"><div className="page-intro-strip"><span>ZERO CORE</span><span>REGISTER MASK 511</span><span>WITNESS AUTHORIZATION REQUIRED</span></div><section className="section-shell puzzle-section wide"><Reveal><StageHeader id="core" /></Reveal><CorePuzzle /></section><div className="section-shell"><CompletionCertificate /></div></main>;
}
