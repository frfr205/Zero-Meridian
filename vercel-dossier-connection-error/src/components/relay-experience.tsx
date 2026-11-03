"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Activity, ArrowRight, AudioLines, Check, ChevronDown, ChevronRight, Pause, Play, Radio, RotateCcw, Volume2 } from "lucide-react";
import { MORSE_MAP, SIGNAL_MORSE } from "@/lib/puzzle-data";
import { useCase } from "./case-provider";
import { usePersistentState } from "./use-persistent-state";
import { HintPanel, PuzzleActions, Reveal, SolvedFragment, StageGate, StageHeader, SubmissionFeedback, useStageSubmission } from "./stage-ui";

function Waveform({ frequency, phase, aligned }: { frequency: number; phase: number; aligned: boolean }) {
  const points = useMemo(() => {
    const error = Math.abs(frequency - 88.4) + Math.abs(phase - 270) / 180;
    return Array.from({ length: 241 }, (_, index) => {
      const x = index * 4;
      const carrier = Math.sin(index * 0.21 + phase * Math.PI / 180) * 34;
      const harmonic = Math.sin(index * 0.71 + frequency) * 12;
      const deterministicNoise = Math.sin(index * 12.9898 + frequency * 31.7) * Math.cos(index * 3.17) * Math.min(36, error * 32);
      return `${x},${(90 + carrier + harmonic + deterministicNoise).toFixed(2)}`;
    }).join(" ");
  }, [frequency, phase]);
  return <div className={`oscilloscope ${aligned ? "aligned" : ""}`}><div className="scope-grid" /><svg viewBox="0 0 960 180" preserveAspectRatio="none" role="img" aria-label={aligned ? "Synchronized carrier" : "Unsynchronized carrier"}><polyline points={points} /></svg><div className="scope-readout"><span>CH–04</span><span>{aligned ? "LOCK / Q 0.998" : "NO LOCK / PHASE ERROR"}</span></div></div>;
}

function MorseEnvelope({ aligned }: { aligned: boolean }) {
  const groups = SIGNAL_MORSE.split(" / ");
  return <div className={`morse-envelope ${aligned ? "visible" : "jammed"}`}><div className="envelope-label"><span>ENVELOPE / 620 Hz</span><span>{aligned ? "4 GROUPS" : "CARRIER NOT LOCKED"}</span></div><div className="morse-groups">{aligned ? groups.map((group, index) => <motion.div key={index} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}><small>0{index + 1}</small><div>{group.split("").map((symbol, symbolIndex) => <span key={symbolIndex} className={symbol === "." ? "dot" : "dash"} />)}</div><code>{group}</code></motion.div>) : Array.from({ length: 4 }, (_, index) => <div key={index}><small>0{index + 1}</small><div className="jammed-bars"><span /><span /><span /></div><code>ERROR</code></div>)}</div><p>Dots and dashes are shown by block length and by text code. The slash separates letters.</p></div>;
}

function SignalPuzzle() {
  const { state } = useCase();
  const [frequency, setFrequency] = usePersistentState("signal-frequency", 88.1);
  const [phase, setPhase] = usePersistentState("signal-phase", 90);
  const [message, setMessage] = usePersistentState("signal-message", "");
  const [speed, setSpeed] = usePersistentState("signal-speed", 1);
  const [playing, setPlaying] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const aligned = Math.abs(frequency - 88.4) < 0.001 && phase === 270;
  const solved = state?.stages.find((stage) => stage.id === "signal")?.solved;
  const { check, pending, feedback } = useStageSubmission("signal");

  const stopAudio = () => {
    const context = audioRef.current;
    audioRef.current = null;
    if (context && context.state !== "closed") void context.close();
    setPlaying(false);
  };
  useEffect(() => () => { if (audioRef.current && audioRef.current.state !== "closed") void audioRef.current.close(); }, []);
  useEffect(() => { if (!aligned && audioRef.current) stopAudio(); }, [aligned]);

  const play = async () => {
    if (!aligned || playing) return;
    try {
      const context = new AudioContext();
      audioRef.current = context;
      await context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(620, context.currentTime);
      gain.gain.setValueAtTime(0, context.currentTime);
      oscillator.connect(gain).connect(context.destination);
      const unit = 0.12 / speed;
      let cursor = context.currentTime + 0.08;
      SIGNAL_MORSE.split("").forEach((symbol) => {
        if (symbol === "." || symbol === "-") {
          const length = symbol === "." ? unit : unit * 3;
          gain.gain.setValueAtTime(0, cursor);
          gain.gain.linearRampToValueAtTime(0.22, cursor + 0.006);
          gain.gain.setValueAtTime(0.22, cursor + Math.max(0.006, length - 0.006));
          gain.gain.linearRampToValueAtTime(0, cursor + length);
          cursor += length + unit;
        } else if (symbol === "/") cursor += unit * 2;
      });
      oscillator.start();
      oscillator.stop(cursor + 0.05);
      oscillator.onended = () => { setPlaying(false); if (audioRef.current === context) audioRef.current = null; if (context.state !== "closed") void context.close(); };
      setPlaying(true);
    } catch { setPlaying(false); }
  };

  return <StageGate id="signal"><div className="signal-workbench">
    <div className="receiver-console"><div className="receiver-top"><div><span className="live-dot" />RECEIVER R-88 / ACTIVE</div><div>CARRIER <strong>{frequency.toFixed(1)}</strong> MHz</div></div><Waveform frequency={frequency} phase={phase} aligned={aligned} /><div className="tuner-grid">
      <label className="tuner-control"><span><b>Carrier</b><output>{frequency.toFixed(1)} MHz</output></span><input type="range" min="87.8" max="89" step="0.1" value={frequency} onChange={(event) => setFrequency(Number(event.target.value))} disabled={solved} /><div><small>87.8</small><small>Step 0.1</small><small>89.0</small></div></label>
      <label className="tuner-control"><span><b>Phase</b><output>{phase}°</output></span><input type="range" min="0" max="330" step="30" value={phase} onChange={(event) => setPhase(Number(event.target.value))} disabled={solved} /><div><small>0°</small><small>Step 30°</small><small>330°</small></div></label>
    </div><div className="receiver-status"><Activity /><span>{aligned ? "Phase lock achieved. The demodulator outputs a clean envelope." : "There is a signal, but the phase or carrier does not match the telegram parameters."}</span><button onClick={() => { setFrequency(88.1); setPhase(90); }} disabled={solved}><RotateCcw />Reset</button></div></div>
    <MorseEnvelope aligned={aligned} />
    <div className="audio-console"><div className="audio-main"><button className="audio-play" disabled={!aligned || solved} onClick={() => playing ? stopAudio() : void play()} aria-label={playing ? "Stop Morse audio" : "Play Morse audio"}>{playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</button><div><span className="eyebrow">Synthesized audio path</span><h3>{playing ? "Transmitting…" : "Play the envelope"}</h3><p>620 Hz · dash = 3 dots · inter-letter pauses preserved</p></div></div><div className="speed-control"><span>Speed</span>{[0.75, 1, 1.5].map((value) => <button key={value} className={speed === value ? "active" : ""} onClick={() => { stopAudio(); setSpeed(value); }}>{value}×</button>)}</div><div className={`audio-bars ${playing ? "playing" : ""}`}>{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ height: `${18 + (index * 17) % 42}px`, animationDelay: `${index * -0.07}s` }} />)}</div></div>
    <div className="morse-reference"><button onClick={() => setReferenceOpen((value) => !value)} aria-expanded={referenceOpen}><Volume2 />Morse code reference<ChevronDown className={referenceOpen ? "rotated" : ""} /></button><AnimatePresence initial={false}>{referenceOpen && <motion.div className="morse-table" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>{Object.entries(MORSE_MAP).map(([letter, code]) => <div key={letter}><strong>{letter}</strong><code>{code}</code></div>)}</motion.div>}</AnimatePresence></div>
    <div className="answer-console"><div><span className="eyebrow">Demodulated message</span><p>Enter the four-letter word. Frequency and phase are checked together with your answer.</p></div><label className="field-label">Message<input className="key-input" value={message} onChange={(event) => setMessage(event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4))} placeholder="····" disabled={solved} /></label><PuzzleActions><button className="primary-button" disabled={pending || solved || message.length !== 4 || !aligned} onClick={() => void check({ frequency, phase, message })}>{pending ? "Checking demodulator…" : solved ? "Message accepted" : "Decode transmission"}<ChevronRight /></button></PuzzleActions></div>
    <SubmissionFeedback feedback={feedback} /><SolvedFragment stageId="signal" />
    {solved && <motion.section className="recovered-directive" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><AudioLines /><div><span className="eyebrow">Recovered atlas directive</span><h3>MOON / CHANNEL 04</h3><p>Use optical lunar observations only. Cloud cover must be no higher than 20%; altitude must be strictly positive. Sort by time, divide each azimuth by 15, then map the quotient to the English alphabet with A = 0.</p></div><Check /></motion.section>}
    <HintPanel stageId="signal" />
  </div></StageGate>;
}

export function RelayExperience() {
  const { state } = useCase();
  const atlasOpen = state?.stages.find((stage) => stage.id === "atlas")?.unlocked;
  return <main className="inner-page relay-page"><div className="page-intro-strip"><span>RELAY 88.4</span><span>R-88 NIGHT SHIFT</span><span>620 HZ DEMODULATOR</span></div><section className="section-shell puzzle-section" id="signal"><Reveal><StageHeader id="signal" /></Reveal><SignalPuzzle /></section><section className="next-act-banner"><div><span className="eyebrow">Next node / Lunar atlas</span><h2>Four letters become<br /><em>a five-row series.</em></h2></div>{atlasOpen ? <Link className="primary-button" href="/atlas">Open the atlas<ArrowRight /></Link> : <span className="locked-next">Decode the transmission to unlock atlas access</span>}</section></main>;
}
