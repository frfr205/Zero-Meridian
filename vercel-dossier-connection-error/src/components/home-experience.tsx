"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { ArrowDown, ArrowRight, ArrowUp, Check, ChevronRight, Clock3, Download, FileLock2, Fingerprint, GripVertical, Network, Play, Radio, Shuffle, Volume2 } from "lucide-react";
import { CASE_CODE, EVIDENCE, STAGES, SUSPECTS, evidenceForSolved } from "@/lib/case-data";
import { PROTOCOL_EVENTS } from "@/lib/puzzle-data";
import type { StageId } from "@/lib/case-types";
import { useCase } from "./case-provider";
import { usePersistentState } from "./use-persistent-state";
import { HintPanel, PuzzleActions, Reveal, SolvedFragment, StageGate, StageHeader, SubmissionFeedback, useStageSubmission } from "./stage-ui";

function MeridianInstrument() {
  return <div className="meridian-instrument" aria-hidden="true">
    <svg viewBox="0 0 600 600">
      <circle cx="300" cy="300" r="236" className="orbit outer" />
      <circle cx="300" cy="300" r="184" className="orbit" />
      <ellipse cx="300" cy="300" rx="88" ry="236" className="orbit" />
      <ellipse cx="300" cy="300" rx="178" ry="236" className="orbit faint" />
      <ellipse cx="300" cy="300" rx="236" ry="84" className="orbit" />
      <path d="M64 300H536M300 64V536" className="axis" />
      <path d="M112 194L486 405M130 424L472 170" className="axis faint" />
      <circle cx="300" cy="64" r="5" className="instrument-point" />
      <circle cx="486" cy="405" r="7" className="instrument-point hot" />
      <circle cx="130" cy="424" r="4" className="instrument-point" />
    </svg>
    <div className="instrument-core"><span>88.4</span><small>NO CARRIER</small></div>
    <span className="instrument-label top">N / 00°</span><span className="instrument-label right">E / 90°</span><span className="instrument-label bottom">S / 180°</span><span className="instrument-label left">W / 270°</span>
  </div>;
}

function StartCaseForm({ compact = false }: { compact?: boolean }) {
  const { state, start } = useCase();
  const [alias, setAlias] = usePersistentState("observer-alias", "");
  const [pending, setPending] = useState(false);
  const started = Boolean(state?.session.startedAt);
  const next = STAGES.find((stage) => state?.stages.find((item) => item.id === stage.id)?.unlocked && !state?.stages.find((item) => item.id === stage.id)?.solved) ?? STAGES[0];
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    const ok = await start(alias);
    setPending(false);
    if (ok) document.querySelector("#protocol")?.scrollIntoView({ behavior: "smooth" });
  };
  if (state?.session.completedAt) return <Link href="/core" className={`primary-button hero-start ${compact ? "compact" : ""}`}><Check />View the closed case<ArrowRight /></Link>;
  if (started) return <Link href={next.href} className={`primary-button hero-start ${compact ? "compact" : ""}`}><Play fill="currentColor" />Resume: {next.title}<ArrowRight /></Link>;
  return <form className={`start-case-form ${compact ? "compact" : ""}`} onSubmit={(event) => void submit(event)}>
    <label><span>Observer callsign <small>optional</small></span><input value={alias} maxLength={40} onChange={(event) => setAlias(event.target.value)} placeholder="Observer" /></label>
    <button className="primary-button" disabled={pending}>{pending ? "Opening dossier…" : "Accept the case"}<ArrowRight /></button>
    <p>No account. Your alias and progress use the storage mode shown above.</p>
  </form>;
}

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { state } = useCase();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const instrumentY = useTransform(scrollYProgress, [0, 1], [0, 240]);
  const instrumentScale = useTransform(scrollYProgress, [0, 1], [1, 1.48]);
  const instrumentRotate = useTransform(scrollYProgress, [0, 1], [0, 32]);
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const sceneClip = useTransform(scrollYProgress, [0, 1], ["inset(0% 0% 0% 0%)", "inset(0% 0% 24% 0%)"]);
  const motionStyle = reduced ? undefined : { clipPath: sceneClip };
  return <section className="home-hero" ref={ref}>
    <motion.div className="hero-scene" style={motionStyle}>
      <div className="hero-grid" /><div className="hero-noise" />
      <motion.div className="hero-instrument-wrap" style={reduced ? undefined : { y: instrumentY, scale: instrumentScale, rotate: instrumentRotate }} initial={{ opacity: 0, scale: 0.72, rotate: -18 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}><MeridianInstrument /></motion.div>
      <motion.div className="hero-title-block" style={reduced ? undefined : { y: titleY, opacity: titleOpacity }}>
        <motion.div className="hero-kicker" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}><span className="live-dot" />{CASE_CODE}<span>Research station Meridian</span></motion.div>
        <h1 aria-label="Zero Meridian"><span className="title-mask"><motion.span initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>ZERO</motion.span></span><span className="title-mask outline"><motion.span initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 1, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}>MERIDIAN</motion.span></span></h1>
        <motion.div className="hero-intro" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.7 }}><p>At 00:41 the station transmitted four letters and vanished from the network. Rebuild the route. Identify its keeper. Become the independent witness.</p><div><span>07 linked acts</span><span>04 persons of interest</span><span>01 immutable copy</span></div></motion.div>
      </motion.div>
      <motion.div className="hero-entry" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.7 }}><StartCaseForm /></motion.div>
      <motion.a href="#briefing" className="hero-scroll" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}><span>Read the incident</span><ArrowDown /></motion.a>
      <div className="hero-case-state"><small>CASE STATUS</small><strong>{state?.session.completedAt ? "CLOSED" : state?.session.startedAt ? `${state.stats.solved}/7 ACCEPTED` : "AWAITING OBSERVER"}</strong></div>
    </motion.div>
  </section>;
}

function ProtocolPuzzle() {
  const { state } = useCase();
  const [order, setOrder] = usePersistentState<string[]>("protocol-order", PROTOCOL_EVENTS.map((event) => event.id));
  const [code, setCode] = usePersistentState("protocol-code", "");
  const { check, pending, feedback } = useStageSubmission("protocol");
  const solved = state?.stages.find((stage) => stage.id === "protocol")?.solved;
  const events = order.map((id) => PROTOCOL_EVENTS.find((event) => event.id === id)!).filter(Boolean);
  const move = (index: number, direction: -1 | 1) => {
    if (solved) return;
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  };
  if (!state?.session.startedAt) return <div className="protocol-start"><span className="eyebrow">First authorization</span><h2>The loop needs a witness.</h2><p>Accepting the case starts the elapsed-time register and unlocks the timeline. No personal data or account is required.</p><StartCaseForm compact /></div>;
  return <StageGate id="protocol"><div className="protocol-workbench">
    <div className="protocol-instructions"><Fingerprint /><div><span className="eyebrow">Autosave order is not evidence</span><h3>Rebuild the causal chain.</h3><p>Move the six surviving entries into source order. Relative clauses are more reliable than the shuffled pages. Then enter the two digits hidden in the activation hour of the backup loop.</p></div><button className="secondary-button" disabled={solved} onClick={() => setOrder([...order].sort(() => Math.random() - 0.5))}><Shuffle />Shuffle</button></div>
    <motion.div layout className="timeline-list">{events.map((event, index) => <motion.article layout key={event.id} className="timeline-event" transition={{ type: "spring", stiffness: 380, damping: 34 }}>
      <div className="timeline-index"><GripVertical /><span>{String(index + 1).padStart(2, "0")}</span></div><time>{event.time}</time><div><small>{event.source}</small><p>{event.text}</p></div><div className="timeline-controls"><button onClick={() => move(index, -1)} disabled={index === 0 || solved} aria-label={`Move ${event.source} earlier`}><ArrowUp /></button><button onClick={() => move(index, 1)} disabled={index === events.length - 1 || solved} aria-label={`Move ${event.source} later`}><ArrowDown /></button></div>
    </motion.article>)}</motion.div>
    <div className="answer-console"><div><span className="eyebrow">Breach signature</span><p>The code is not a date or a room number. Read the activation entry.</p></div><label className="field-label">Two-digit code<input className="key-input numeric" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="00" inputMode="numeric" disabled={solved} /></label><PuzzleActions><button className="primary-button" disabled={pending || solved || code.length !== 2 || order.length !== 6} onClick={() => void check({ order, code })}>{pending ? "Checking the chain…" : solved ? "Timeline accepted" : "Verify timeline"}<ChevronRight /></button></PuzzleActions></div>
    <SubmissionFeedback feedback={feedback} /><SolvedFragment stageId="protocol" /><HintPanel stageId="protocol" />
  </div></StageGate>;
}

function CaseRoutes() {
  const { state } = useCase();
  return <section className="section-shell routes-section"><Reveal><div className="section-heading"><span className="section-index">02 / CASE ROUTE</span><h2>Seven locks.<br /><em>Not one optional.</em></h2><p>Stages open only after the previous link is verified. Return to any accepted node whenever a later document changes your interpretation.</p></div></Reveal>
    <div className="route-list">{STAGES.map((stage, index) => {
      const progress = state?.stages.find((item) => item.id === stage.id);
      const open = progress?.unlocked || progress?.solved;
      const content = <><span className="route-number">{stage.number}</span><div className="route-title"><small>{stage.siteLabel}</small><h3>{stage.title}</h3><p>{stage.subtitle}</p></div><div className="route-objective">{stage.objective}</div><div className="route-status">{progress?.solved ? <Check /> : open ? <Radio /> : <FileLock2 />}<span>{progress?.solved ? "Accepted" : open ? "Open" : "Locked"}</span><small>{stage.duration}</small></div><ChevronRight className="route-arrow" /></>;
      return <motion.div key={stage.id} initial={{ opacity: 0, x: index % 2 ? 40 : -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ delay: index * 0.04, duration: 0.6 }}>{open ? <Link href={stage.href} className={`route-row ${progress?.solved ? "solved" : ""}`}>{content}</Link> : <div className="route-row locked" aria-disabled="true">{content}</div>}</motion.div>;
    })}</div>
  </section>;
}

const MAP_NODES = [
  { label: "BRIEFING", sub: "Timeline / access", x: -250, y: -100, r: -12, href: "/#protocol" },
  { label: "ARCHIVE 17", sub: "Modulus / transposition", x: 180, y: -180, r: 9, href: "/archive" },
  { label: "RELAY 88.4", sub: "Carrier / Morse", x: -160, y: 150, r: 14, href: "/relay" },
  { label: "LUNAR ATLAS", sub: "Filter / azimuth", x: 240, y: 100, r: -8, href: "/atlas" },
  { label: "ZERO CORE", sub: "Integrity / verdict", x: 30, y: 230, r: 6, href: "/core" },
];

function ConstellationNode({ node, index, progress, reduced }: { node: (typeof MAP_NODES)[number]; index: number; progress: MotionValue<number>; reduced: boolean }) {
  const x = useTransform(progress, [0, 0.72], [reduced ? 0 : node.x, 0]);
  const y = useTransform(progress, [0, 0.72], [reduced ? 0 : node.y, 0]);
  const rotate = useTransform(progress, [0, 0.72], [reduced ? 0 : node.r, 0]);
  const radius = useTransform(progress, [0, 0.72], ["50%", "3px"]);
  return <motion.div className="constellation-node" style={{ top: index * 104, x, y, rotate, borderRadius: radius }}><Link href={node.href}><span>0{index}</span><div><strong>{node.label}</strong><small>{node.sub}</small></div><ArrowRight /></Link></motion.div>;
}

function ArchitectureScene() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 65%"] });
  const spine = useTransform(scrollYProgress, [0.15, 0.85], [0, 1]);
  return <section className="architecture-section" ref={ref}><div className="section-shell architecture-grid"><div className="architecture-copy"><span className="section-index">03 / ARCHITECTURE</span><h2>Five nodes.<br />One clue always<br /><em>on another.</em></h2><p>Scroll to assemble the evidence chain. The instruments are genuine: a remainder calculator, an inverse transposition, synthesized Morse, observation filters and an interactive graph.</p><div className="architecture-legend"><span><i />Unsolved relation</span><span><i />Verified handoff</span></div></div>
    <div className="constellation"><motion.div className="constellation-spine" style={reduced ? undefined : { scaleY: spine }} />{MAP_NODES.map((node, index) => <ConstellationNode key={node.label} node={node} index={index} progress={scrollYProgress} reduced={reduced} />)}</div></div></section>;
}

function PeopleAndEvidence() {
  const { state, exportDossier } = useCase();
  const solved = (state?.stages.filter((stage) => stage.solved).map((stage) => stage.id) ?? []) as StageId[];
  const evidence = evidenceForSolved(solved);
  return <>
    <section className="section-shell people-section"><Reveal><div className="section-heading horizontal"><div><span className="section-index">04 / PEOPLE</span><h2>Four had a motive.<br /><em>One had the whole access.</em></h2></div><p>The statements are available immediately. Do not rush to a conclusion: decisive evidence appears at the relay, in the archive and at station ZERO.</p></div></Reveal>
      <div className="suspect-grid">{SUSPECTS.map((person, index) => <Reveal key={person.id} delay={index * 0.08}><article className="suspect-card"><div className="suspect-top"><span className="suspect-monogram">{person.name.split(" ").map((part) => part[0]).join("")}</span><small>PERSON OF INTEREST 0{index + 1}</small></div><h3>{person.name}</h3><strong>{person.role}</strong><dl><div><dt>Shift</dt><dd>{person.shift}</dd></div><div><dt>Access</dt><dd>{person.access}</dd></div></dl><blockquote>{person.statement}</blockquote><p>{person.detail}</p></article></Reveal>)}</div>
    </section>
    <section className="section-shell evidence-section"><Reveal><div className="section-heading horizontal"><div><span className="section-index">05 / RECOVERED EVIDENCE</span><h2>The archive remembers<br /><em>what people erased.</em></h2></div><div><p>{evidence.length} of {EVIDENCE.length} evidence records recovered. Solving an act permanently adds its primary documents to this view.</p><button className="secondary-button" onClick={() => exportDossier("md")}><Download />Export current dossier</button></div></div></Reveal>
      {evidence.length ? <div className="evidence-grid">{evidence.map((item, index) => <motion.article key={item.id} initial={{ opacity: 0, y: 24, rotate: index % 2 ? 1 : -1 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true }}><div><span>{item.tag}</span><small>{item.source}</small></div><h3>{item.title}</h3><p>{item.body}</p><b><Check />VERIFIED</b></motion.article>)}</div> : <div className="empty-evidence"><FileLock2 /><h3>No primary evidence accepted yet.</h3><p>Start with the timeline above. The first two records explain both the intrusion window and the difference between physical and certified access.</p><a href="#protocol" className="text-link">Return to the Watch Protocol <ArrowRight /></a></div>}
    </section>
  </>;
}

export function HomeExperience() {
  return <main className="home-page"><Hero />
    <section className="section-shell briefing-section" id="briefing"><Reveal><div className="section-heading horizontal"><div><span className="section-index">01 / BRIEFING</span><h2>This is not a quiz.<br /><em>It is a chain of evidence.</em></h2></div><div className="briefing-copy"><p>At 00:41 the research station “Meridian” transmitted four letters and dropped off the network. By morning fund M-17 was sealed, six catalogue cards were swapped, and the backup copy was locked behind an independent-witness procedure.</p><p>The route's author assumed it would be solved without outside programs. Every material belongs to this case. Search engines give no ready answer.</p></div></div></Reveal><div className="briefing-stats"><div><strong>07</strong><span>linked acts</span></div><div><strong>16</strong><span>stations in the final graph</span></div><div><strong>12+12</strong><span>cards and observations</span></div><div><strong>21</strong><span>levels of help</span></div></div></section>
    <section className="section-shell protocol-section" id="protocol"><Reveal><StageHeader id="protocol" kicker="00 / The night register" /></Reveal><ProtocolPuzzle /></section>
    <CaseRoutes /><ArchitectureScene /><PeopleAndEvidence />
    <section className="closing-scene"><div className="closing-rings" /><Reveal><span className="eyebrow"><span className="live-dot" />Observer channel open</span><h2>The archive remembers<br /><em>what people erased.</em></h2><p>Begin with six surviving entries. End with a verdict the evidence can carry.</p><StartCaseForm compact /></Reveal><Volume2 className="closing-icon" /><Clock3 className="closing-clock" /><Network className="closing-network" /></section>
  </main>;
}
