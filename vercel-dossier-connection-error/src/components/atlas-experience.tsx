"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Check, ChevronRight, CircleDot, Compass, Filter, LocateFixed, RotateCcw, Route, Sigma, Undo2 } from "lucide-react";
import { CIPHER_ALPHABET, findNetworkEdge, NETWORK_EDGES, NETWORK_NODES, OBSERVATIONS, type LineId } from "@/lib/puzzle-data";
import { useCase } from "./case-provider";
import { usePersistentState } from "./use-persistent-state";
import { HintPanel, PuzzleActions, Reveal, SolvedFragment, StageGate, StageHeader, SubmissionFeedback, useStageSubmission } from "./stage-ui";

type FilterKey = "moon" | "optics" | "channel" | "clear" | "above";
const FILTER_LABELS: { id: FilterKey; label: string; detail: string }[] = [
  { id: "moon", label: "Moon only", detail: "object = Moon" }, { id: "optics", label: "Optics", detail: "not radio" },
  { id: "channel", label: "Channel 04", detail: "channel = 4" }, { id: "clear", label: "Clear", detail: "cloud ≤ 20%" },
  { id: "above", label: "Above horizon", detail: "altitude > 0°" },
];
const DEFAULT_FILTERS: Record<FilterKey, boolean> = { moon: false, optics: false, channel: false, clear: false, above: false };

function AtlasPuzzle() {
  const { state } = useCase();
  const [filters, setFilters] = usePersistentState<Record<FilterKey, boolean>>("atlas-filters", DEFAULT_FILTERS);
  const [selected, setSelected] = usePersistentState<string[]>("atlas-selected", []);
  const [keyword, setKeyword] = usePersistentState("atlas-keyword", "");
  const { check, pending, feedback } = useStageSubmission("atlas");
  const solved = state?.stages.find((stage) => stage.id === "atlas")?.solved;
  const visible = useMemo(() => OBSERVATIONS.filter((item) => {
    if (filters.moon && item.object !== "Moon") return false;
    if (filters.optics && item.instrument !== "optics") return false;
    if (filters.channel && item.channel !== 4) return false;
    if (filters.clear && item.clouds > 20) return false;
    if (filters.above && item.altitude <= 0) return false;
    return true;
  }).sort((a, b) => a.time.localeCompare(b.time)), [filters]);
  const selectedObservations = OBSERVATIONS.filter((item) => selected.includes(item.id)).sort((a, b) => a.time.localeCompare(b.time));
  const toggle = (id: string) => { if (!solved) setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]); };
  return <StageGate id="atlas"><div className="atlas-workbench">
    <div className="atlas-brief"><Compass /><div><span className="eyebrow">Disk rule / A = 0</span><p>Select the clean lunar series by the relay message. For each record divide azimuth by 15. The quotient is a letter index in the alphabet, A = 0. Read by observation time.</p></div><div className="atlas-count"><strong>{visible.length}</strong><span>rows visible</span></div></div>
    <div className="observation-filters"><div><Filter /><span>Combinable filters</span></div>{FILTER_LABELS.map((filter) => <button key={filter.id} className={filters[filter.id] ? "active" : ""} onClick={() => setFilters({ ...filters, [filter.id]: !filters[filter.id] })} aria-pressed={filters[filter.id]}><span>{filter.label}</span><small>{filter.detail}</small></button>)}<button className="filter-reset" onClick={() => setFilters(DEFAULT_FILTERS)}><RotateCcw />Reset</button></div>
    <div className="observation-table-wrap"><div className="observation-table-head"><span>Time / object</span><span>Instrument</span><span>Channel</span><span>Cloud</span><span>Altitude</span><span>Azimuth</span><span>Pick</span></div><div className="observation-list">{visible.map((item) => <motion.article layout key={item.id} className={`observation-row ${selected.includes(item.id) ? "selected" : ""}`}>
      <div><time>{item.time}</time><strong>{item.object}</strong><small>{item.operator} · {item.note}</small></div><span data-label="Instrument">{item.instrument}</span><span data-label="Channel">CH–{String(item.channel).padStart(2, "0")}</span><span data-label="Cloud" className={item.clouds > 20 ? "bad-value" : ""}>{item.clouds}%</span><span data-label="Altitude" className={item.altitude <= 0 ? "bad-value" : ""}>{item.altitude > 0 ? "+" : ""}{item.altitude}°</span><span data-label="Azimuth" className="azimuth-value">{item.azimuth}°</span><button className="observation-select" onClick={() => toggle(item.id)} aria-pressed={selected.includes(item.id)} aria-label={`${selected.includes(item.id) ? "Remove" : "Select"} observation at ${item.time}`} disabled={solved}>{selected.includes(item.id) ? <Check /> : <span />}</button>
    </motion.article>)}</div>{visible.length === 0 && <div className="empty-filter">No record passes the current combination of filters.</div>}</div>
    <div className="azimuth-desk"><div className="alphabet-disk"><div className="disk-title"><span className="eyebrow">Tool 03</span><h3>The fifteen-degree disk</h3><p>Azimuth ÷ 15 → index → letter. Indices start at zero.</p></div><div className="alphabet-ribbon">{CIPHER_ALPHABET.split("").map((letter, index) => <div key={letter}><strong>{letter}</strong><small>{index}</small></div>)}</div></div><div className="azimuth-tape"><div className="tape-head"><span>Selected series / by time</span><strong>{selected.length} / 5</strong></div>{selectedObservations.length === 0 ? <p>Pick records in the table — their quotients will appear here.</p> : selectedObservations.map((item, index) => <div key={item.id}><span>0{index + 1} · {item.time}</span><code>{item.azimuth} ÷ 15 = {item.azimuth / 15}</code><i>{Number.isInteger(item.azimuth / 15) ? "whole index" : "fraction"}</i></div>)}</div></div>
    <div className="answer-console"><div><span className="eyebrow">Route entry point</span><p>Select five records and enter the word read on the disk.</p></div><label className="field-label">Keyword<input className="key-input" value={keyword} onChange={(event) => setKeyword(event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5))} placeholder="·····" disabled={solved} /></label><PuzzleActions><button className="primary-button" disabled={pending || solved || selected.length !== 5 || keyword.length !== 5} onClick={() => void check({ selected, keyword })}>{pending ? "Checking the sky…" : solved ? "Series accepted" : "Fix the series"}<LocateFixed /></button></PuzzleActions></div>
    <SubmissionFeedback feedback={feedback} /><SolvedFragment stageId="atlas" /><HintPanel stageId="atlas" />
  </div></StageGate>;
}

const LINE_NAMES: Record<LineId, string> = { cyan: "Cyan", amber: "Amber", green: "Green" };

function NetworkPuzzle() {
  const { state, notify } = useCase();
  const [path, setPath] = usePersistentState<string[]>("network-path", ["zen"]);
  const { check, pending, feedback } = useStageSubmission("network");
  const solved = state?.stages.find((stage) => stage.id === "network")?.solved;
  const safePath = path.length && NETWORK_NODES.some((node) => node.id === path[0]) ? path : ["zen"];
  const current = safePath[safePath.length - 1];
  const sensors = safePath.map((id) => NETWORK_NODES.find((node) => node.id === id)?.sensor).filter((value): value is number => value !== undefined);
  const gateways = safePath.filter((id) => NETWORK_NODES.find((node) => node.id === id)?.gateway).length;
  const lines = safePath.slice(1).map((id, index) => findNetworkEdge(safePath[index], id)?.line ?? "cyan");
  const currentLine = lines[lines.length - 1];
  let sameLineRun = 0;
  for (let index = lines.length - 1; index >= 0 && lines[index] === currentLine; index -= 1) sameLineRun += 1;
  const nodeById = (id: string) => NETWORK_NODES.find((node) => node.id === id)!;
  const available = new Set(NETWORK_EDGES.filter((edge) => edge.a === current || edge.b === current).map((edge) => edge.a === current ? edge.b : edge.a));

  const addNode = (id: string) => {
    if (solved) return;
    if (id === current) return;
    if (safePath.includes(id)) { notify("This station is already visited. Undo the last moves to change the route.", "error"); return; }
    const edge = findNetworkEdge(current, id);
    if (!edge) { notify("There is no direct leg. Pick a station connected by a line to the current one.", "error"); return; }
    if (safePath.length >= 16) { notify("The limit of 15 legs is reached.", "error"); return; }
    if (lines.length >= 2 && lines.slice(-2).every((line) => line === edge.line)) { notify("A third leg in a row on this line is forbidden by the fuse.", "error"); return; }
    setPath([...safePath, id]);
  };
  const undo = () => { if (!solved && safePath.length > 1) setPath(safePath.slice(0, -1)); };
  const reset = () => { if (!solved) setPath(["zen"]); };
  return <StageGate id="network"><div className="network-workbench">
    <div className="network-rules"><Route /><div><span className="eyebrow">Router directive / register 99</span><h3>Every station. Exactly once.</h3><p>Start at RIGEL, finish at ZERO. Cross all 16 stations in 15 legs. Sensors must fire in fragment order <strong>17 → 6 → 88 → 4 → 15</strong>. All four square gateways are mandatory. A third consecutive leg on one color trips the fuse.</p></div><div className="line-legend">{(Object.keys(LINE_NAMES) as LineId[]).map((line) => <span key={line}><i className={line} />{LINE_NAMES[line]}</span>)}</div></div>
    <div className="network-console">
      <div className="network-map-wrap"><div className="network-map-top"><span>TOPOLOGY / NM-17</span><span>{available.size} direct exits</span></div><svg className="network-map" viewBox="0 0 1000 600" role="group" aria-label="Interactive station network">
        <defs><pattern id="network-grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" className="network-grid-line" /></pattern></defs><rect width="1000" height="600" fill="url(#network-grid)" />
        {NETWORK_EDGES.map((edge) => { const a = nodeById(edge.a); const b = nodeById(edge.b); const active = safePath.some((id, index) => index > 0 && (findNetworkEdge(safePath[index - 1], id) === edge)); return <line key={`${edge.a}-${edge.b}`} x1={a.x * 10} y1={a.y * 6} x2={b.x * 10} y2={b.y * 6} className={`network-edge ${edge.line} ${active ? "active" : ""}`} />; })}
        {safePath.length > 1 && <polyline className="route-trace" points={safePath.map((id) => { const node = nodeById(id); return `${node.x * 10},${node.y * 6}`; }).join(" ")} />}
        {NETWORK_NODES.map((node) => {
          const visited = safePath.includes(node.id); const isCurrent = current === node.id; const canVisit = available.has(node.id) && !visited && !solved;
          return <g key={node.id} transform={`translate(${node.x * 10} ${node.y * 6})`} className={`network-node ${visited ? "visited" : ""} ${isCurrent ? "current" : ""} ${canVisit ? "available" : ""}`} role="button" tabIndex={canVisit ? 0 : -1} aria-label={`${node.name}${node.sensor ? `, sensor ${node.sensor}` : node.gateway ? ", gateway" : ""}${visited ? ", visited" : canVisit ? ", available" : ""}`} onClick={() => addNode(node.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); addNode(node.id); } }}>
            {node.gateway ? <rect x="-14" y="-14" width="28" height="28" /> : <circle r={node.sensor ? 18 : 13} />}{isCurrent && <circle className="current-ring" r="27" />}{node.sensor && <text className="sensor-value" y="-27">{node.sensor}</text>}<text className="node-name" y="38">{node.name}</text>{visited && <text className="visit-index" y="5">{safePath.indexOf(node.id) + 1}</text>}
          </g>;
        })}
      </svg><div className="map-instruction"><CircleDot /><span>Stations with a pulsing outline connect to your current position. Use Undo to explore a branch; revisits are rejected.</span></div></div>
      <aside className="route-register"><div className="route-register-head"><span>LIVE ROUTE</span><strong>{safePath.length - 1} / 15 legs</strong></div><div className="route-metrics"><div><strong>{sensors.length}/5</strong><span>sensors</span></div><div><strong>{gateways}/4</strong><span>gateways</span></div><div><strong>{sameLineRun}/2</strong><span>{currentLine ?? "line"} run</span></div></div><div className="route-path-list">{safePath.map((id, index) => <motion.div layout key={`${id}-${index}`} className={index === safePath.length - 1 ? "current" : ""}><span>{String(index + 1).padStart(2, "0")}</span><strong>{nodeById(id)?.name ?? id}</strong>{nodeById(id)?.sensor && <b>S {nodeById(id).sensor}</b>}{nodeById(id)?.gateway && <b>GATE</b>}{index > 0 && <i className={lines[index - 1]} />}</motion.div>)}</div><div className="route-controls"><button onClick={undo} disabled={safePath.length <= 1 || solved}><Undo2 />Undo</button><button onClick={reset} disabled={safePath.length <= 1 || solved}><RotateCcw />Reset</button></div><div className="sensor-register"><Sigma /><div><small>Sensor sum mod 99</small><code>{sensors.length ? `${sensors.join(" + ")} = ${sensors.reduce((sum, value) => sum + value, 0)}` : "No sensors fired"}</code><strong>{sensors.reduce((sum, value) => sum + value, 0) % 99}</strong></div></div></aside>
    </div>
    <div className="answer-console"><div><span className="eyebrow">Hamiltonian route validation</span><p>The check independently validates every leg, all station IDs, sensor order and line fuses.</p></div><PuzzleActions><button className="primary-button" disabled={pending || solved || safePath.length !== 16} onClick={() => void check({ path: safePath })}>{pending ? "Testing every leg…" : solved ? "Route accepted" : `Validate ${safePath.length - 1}/15 legs`}<ChevronRight /></button></PuzzleActions></div>
    <SubmissionFeedback feedback={feedback} /><SolvedFragment stageId="network" />
    {solved && <motion.section className="keeper-note" initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}><span className="eyebrow">Station ZERO / unsigned local buffer</span><blockquote>“I did not need a burglar, I needed a witness. I swapped the catalogue so the corporation would not find the originals, and I left the route for whoever could verify every link. Not a sale. Not revenge. Preservation.”</blockquote><p>The route leads to an immutable backup copy. It cannot be opened without an independent witness.</p></motion.section>}
    <HintPanel stageId="network" />
  </div></StageGate>;
}

export function AtlasExperience() {
  const { state } = useCase();
  const coreOpen = state?.stages.find((stage) => stage.id === "core")?.unlocked;
  return <main className="inner-page atlas-page"><div className="page-intro-strip"><span>LUNAR ATLAS</span><span>OPTICAL CHANNEL 04</span><span>ROUTER / 16 STATIONS</span></div><section className="section-shell puzzle-section" id="atlas"><Reveal><StageHeader id="atlas" /></Reveal><AtlasPuzzle /></section><div className="act-divider"><span>END ACT 04</span><i /><span>BEGIN ACT 05</span></div><section className="section-shell puzzle-section wide" id="network"><Reveal><StageHeader id="network" /></Reveal><NetworkPuzzle /></section><section className="next-act-banner"><div><span className="eyebrow">Final node / Zero core</span><h2>The route ends.<br /><em>The judgment begins.</em></h2></div>{coreOpen ? <Link className="primary-button" href="/core">Enter the core<ArrowRight /></Link> : <span className="locked-next">Complete the route to unlock the core</span>}</section></main>;
}
