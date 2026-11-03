"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Calculator, Check, ChevronRight, FileKey2, Filter, KeyRound, ScanSearch, Sigma, SortAsc } from "lucide-react";
import { CATALOG_RECORDS, CIPHER_TEXT, expectedCatalogCheck, type CatalogRecord } from "@/lib/puzzle-data";
import { decryptTransposition } from "@/lib/case-engine";
import { useCase } from "./case-provider";
import { usePersistentState } from "./use-persistent-state";
import { HintPanel, PuzzleActions, Reveal, SolvedFragment, StageGate, StageHeader, SubmissionFeedback, useStageSubmission } from "./stage-ui";

type SortKey = "original" | "year" | "title" | "shelf";
type CardFilter = "all" | "blue" | "violet" | "selected";

function CataloguePuzzle() {
  const { state } = useCase();
  const [selected, setSelected] = usePersistentState<string[]>("catalogue-selected", []);
  const [keyword, setKeyword] = usePersistentState("catalogue-keyword", "");
  const [sort, setSort] = usePersistentState<SortKey>("catalogue-sort", "original");
  const [filter, setFilter] = useState<CardFilter>("all");
  const [calculation, setCalculation] = usePersistentState("catalogue-calculator", { year: 1968, box: 4, pages: 28 });
  const { check, pending, feedback } = useStageSubmission("catalogue");
  const solved = state?.stages.find((stage) => stage.id === "catalogue")?.solved;
  const remainder = (calculation.year + calculation.box * 7 + calculation.pages * 3) % 17;
  const records = useMemo(() => {
    const result = CATALOG_RECORDS.filter((record) => filter === "all" || filter === "selected" && selected.includes(record.id) || filter === "blue" && record.stamp.startsWith("blue") || filter === "violet" && record.stamp === "violet");
    if (sort === "year") return [...result].sort((a, b) => a.year - b.year);
    if (sort === "title") return [...result].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "shelf") return [...result].sort((a, b) => a.shelf.localeCompare(b.shelf));
    return result;
  }, [filter, selected, sort]);
  const selectedRecords = CATALOG_RECORDS.filter((record) => selected.includes(record.id)).sort((a, b) => a.year - b.year);
  const toggle = (id: string) => {
    if (!solved) setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  };
  const loadRecord = (record: CatalogRecord) => setCalculation({ year: record.year, box: record.box, pages: record.pages });
  return <StageGate id="catalogue"><div className="catalogue-workbench">
    <div className="catalogue-standard"><Sigma /><div><span className="eyebrow">Archival standard M-17 / revision 4</span><h3>The control remainder</h3><p>For each card calculate <code>(year + 7 × box + 3 × pages) mod 17</code>. If the result differs from the printed control value, the card is forged. Stamp color is evidence for later — not the selection rule.</p></div></div>
    <div className="catalogue-tools">
      <div className="remainder-calculator"><div className="tool-heading"><Calculator /><div><span className="eyebrow">Tool 01</span><h3>Remainder calculator</h3></div></div><div className="calculator-fields">{(["year", "box", "pages"] as const).map((field) => <label key={field}><span>{field}</span><input type="number" value={calculation[field]} onChange={(event) => setCalculation({ ...calculation, [field]: Number(event.target.value) })} /></label>)}</div><div className="calculator-equation"><code>({calculation.year || 0} + 7×{calculation.box || 0} + 3×{calculation.pages || 0}) mod 17</code><strong>= {Number.isFinite(remainder) ? remainder : "—"}</strong></div><small>Use “Load” on any card, then compare this result with its printed control.</small></div>
      <div className="forgery-tray"><div className="tool-heading"><ScanSearch /><div><span className="eyebrow">Working set</span><h3>Suspected forgeries</h3></div><strong>{selected.length} / 6</strong></div>{selectedRecords.length ? <div className="forgery-year-list">{selectedRecords.map((record) => <button key={record.id} onClick={() => toggle(record.id)} disabled={solved} title="Remove from selected"><span>{record.year}</span><b>{record.title[0]}</b><small>{record.title}</small></button>)}</div> : <p>Select cards in the register. This tray orders only your picks by year and exposes their initials.</p>}<label className="field-label">Six-letter callsign<input className="key-input" value={keyword} onChange={(event) => setKeyword(event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6))} placeholder="······" disabled={solved} /></label></div>
    </div>
    <div className="register-toolbar"><div><Filter /><span>Show</span>{(["all", "blue", "violet", "selected"] as const).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item === "all" ? "All 12" : item === "blue" ? "Blue R-88" : item === "violet" ? "Violet" : `Selected ${selected.length}`}</button>)}</div><label><SortAsc />Sort<select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}><option value="original">Accession order</option><option value="year">Year</option><option value="title">Title</option><option value="shelf">Shelf</option></select></label></div>
    <div className="catalogue-table"><div className="catalogue-table-head"><span>Pick</span><span>Card / shelf</span><span>Year</span><span>Box</span><span>Pages</span><span>Control</span><span>Stamp</span><span>Tool</span></div><AnimatePresence mode="popLayout">{records.map((record) => <motion.article layout key={record.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`catalogue-row ${selected.includes(record.id) ? "selected" : ""}`}>
      <button className="record-check" onClick={() => toggle(record.id)} aria-pressed={selected.includes(record.id)} aria-label={`${selected.includes(record.id) ? "Remove" : "Select"} ${record.title}`} disabled={solved}>{selected.includes(record.id) ? <Check /> : <span />}</button><div className="record-title"><strong>{record.title}</strong><small>{record.id.toUpperCase()} · {record.shelf} · {record.note}</small></div><span data-label="Year">{record.year}</span><span data-label="Box">{record.box}</span><span data-label="Pages">{record.pages}</span><code data-label="Control">{String(record.check).padStart(2, "0")}</code><span data-label="Stamp" className={`stamp ${record.stamp.startsWith("blue") ? "blue" : ""}`}>{record.stamp}</span><button className="load-record" onClick={() => loadRecord(record)}>Load<Calculator /></button>
    </motion.article>)}</AnimatePresence>{records.length === 0 && <div className="empty-filter">No cards match this view. Select a card or reset the filter.</div>}</div>
    <div className="answer-console"><div><span className="eyebrow">Fund M-17 / control sheet</span><p>Submit all forged cards together with the callsign read in ascending year order.</p></div><PuzzleActions><button className="primary-button" disabled={pending || solved || selected.length !== 6 || keyword.length !== 6} onClick={() => void check({ selected, keyword })}>{pending ? "Verifying remainders…" : solved ? "Catalogue accepted" : "Verify the catalogue"}<ChevronRight /></button></PuzzleActions></div>
    <SubmissionFeedback feedback={feedback} /><SolvedFragment stageId="catalogue" /><HintPanel stageId="catalogue" />
  </div></StageGate>;
}

function CipherPuzzle() {
  const { state } = useCase();
  const [key, setKey] = usePersistentState("cipher-key", "");
  const [carrier, setCarrier] = usePersistentState("cipher-carrier", "");
  const [phase, setPhase] = usePersistentState("cipher-phase", "");
  const { check, pending, feedback } = useStageSubmission("cipher");
  const solved = state?.stages.find((stage) => stage.id === "cipher")?.solved;
  const decrypted = useMemo(() => decryptTransposition(CIPHER_TEXT, key), [key]);
  const streams = Array.from({ length: 6 }, (_, index) => CIPHER_TEXT.slice(index * 7, index * 7 + 7));
  return <StageGate id="cipher"><div className="cipher-workbench">
    <div className="telegram-grid"><section className="intercept-telegram"><div className="telegram-head"><span>R-88</span><div><small>RELAY SHIFT</small><h3>Intercepted telegram</h3></div><b>42 SIGNS</b></div><p>The plaintext was written into a table by rows beneath the six key letters. Columns were then read in alphabetical order of those key letters. Spaces were removed.</p><div className="cipher-streams">{streams.map((column, index) => <div key={index}><small>STREAM {index + 1}</small><code>{column}</code></div>)}</div><div className="telegram-footer"><FileKey2 /><span>Columnar transposition · 7 rows × 6 columns · no letter substitution</span></div></section>
      <section className="decryptor"><div className="tool-heading"><KeyRound /><div><span className="eyebrow">Tool 02</span><h3>Transposition decryptor</h3></div></div><label className="field-label">Key from the dead catalogue<input className="key-input" value={key} onChange={(event) => setKey(event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6))} placeholder="······" /></label><div className="key-columns">{Array.from({ length: 6 }, (_, index) => <div key={index} className={key[index] ? "filled" : ""}><strong>{key[index] ?? "·"}</strong><small>column {index + 1}</small></div>)}</div>{decrypted.order.length > 0 && <p className="reading-order">Reading order: {decrypted.order.map((index) => index + 1).join(" → ")}</p>}<div className="decrypted-output"><span>REBUILT ROWS</span>{decrypted.output ? decrypted.output.split("\n").map((row, index) => <motion.code key={`${row}-${index}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>{row}</motion.code>) : <p>Enter a six-letter key to perform the inverse transposition.</p>}</div><small className="honest-tool-note">This is a genuine inverse algorithm: a wrong key produces a different arrangement, not a canned message.</small></section></div>
    <div className="answer-console"><div><span className="eyebrow">Parameters for the relay</span><p>The decimal part of the carrier is written as the word “and”: eighty eight and four = 88.4.</p></div><label className="field-label">Carrier, MHz<input value={carrier} onChange={(event) => setCarrier(event.target.value.slice(0, 5))} placeholder="00.0" inputMode="decimal" disabled={solved} /></label><label className="field-label">Phase, °<input value={phase} onChange={(event) => setPhase(event.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="000" inputMode="numeric" disabled={solved} /></label><PuzzleActions><button className="primary-button" disabled={pending || solved || !carrier || phase.length !== 3} onClick={() => void check({ carrier, phase })}>{pending ? "Sending parameters…" : solved ? "Parameters accepted" : "Send to relay"}<ChevronRight /></button></PuzzleActions></div>
    <SubmissionFeedback feedback={feedback} /><SolvedFragment stageId="cipher" /><HintPanel stageId="cipher" />
  </div></StageGate>;
}

export function ArchiveExperience() {
  const { state } = useCase();
  const signalOpen = state?.stages.find((stage) => stage.id === "signal")?.unlocked;
  return <main className="inner-page archive-page"><div className="page-intro-strip"><span>ARCHIVE 17</span><span>FUND M–17</span><span>ACCESS: INDEPENDENT WITNESS</span></div>
    <section className="section-shell puzzle-section" id="catalogue"><Reveal><StageHeader id="catalogue" /></Reveal><CataloguePuzzle /></section>
    <div className="act-divider"><span>END ACT 01</span><i /><span>BEGIN ACT 02</span></div>
    <section className="section-shell puzzle-section" id="cipher"><Reveal><StageHeader id="cipher" /></Reveal><CipherPuzzle /></section>
    <section className="next-act-banner"><div><span className="eyebrow">Next node / Relay 88.4</span><h2>The telegram was not the message.<br /><em>It was the tuning instruction.</em></h2></div>{signalOpen ? <Link className="primary-button" href="/relay">Open the receiver<ArrowRight /></Link> : <span className="locked-next">Decrypt the telegram to unlock relay access</span>}</section>
  </main>;
}
