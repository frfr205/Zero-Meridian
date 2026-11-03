"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { BookOpenText, Check, Cloud, CloudOff, Database, Download, HardDrive, LoaderCircle, Menu, NotebookPen, RefreshCw, RotateCcw, Server, X } from "lucide-react";
import { CASE_CODE, RESET_PHRASE, STAGES } from "@/lib/case-data";
import { useCase } from "./case-provider";

const NAV = [
  { href: "/", label: "Briefing", code: "00" },
  { href: "/archive", label: "Archive", code: "01–02" },
  { href: "/relay", label: "Relay", code: "03" },
  { href: "/atlas", label: "Atlas", code: "04–05" },
  { href: "/core", label: "Core", code: "06" },
];

function Modal({ children, onClose, label }: { children: ReactNode; onClose: () => void; label: string }) {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [onClose]);
  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <motion.section className="modal-card" role="dialog" aria-modal="true" aria-label={label} initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }} transition={{ duration: 0.28 }}>
      <button className="icon-button modal-close" onClick={onClose} aria-label="Close dialog"><X /></button>{children}
    </motion.section>
  </motion.div>;
}

function NotesDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, mode, saveNotes, exportDossier } = useCase();
  const [draft, setDraft] = useState("");
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  useEffect(() => { if (open) { setDraft(state?.notes ?? ""); setDirty(false); setStatus("idle"); } }, [open]); // Open is an explicit editor boundary.
  useEffect(() => {
    if (!open || !dirty) return;
    setStatus("saving");
    const timer = window.setTimeout(async () => {
      const saved = await saveNotes(draft);
      setStatus(saved ? "saved" : "error");
      if (saved) setDirty(false);
    }, 750);
    return () => window.clearTimeout(timer);
  }, [draft, dirty, open, saveNotes]);
  const manualSave = async () => {
    setStatus("saving");
    const saved = await saveNotes(draft);
    setStatus(saved ? "saved" : "error");
    if (saved) setDirty(false);
  };
  return <AnimatePresence>{open && <>
    <motion.button aria-label="Close notes" className="drawer-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
    <motion.aside className="notes-drawer" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 260 }} aria-label="Observer notes">
      <div className="drawer-head"><div><span className="eyebrow">Observer channel</span><h2>Field notes</h2></div><button className="icon-button" onClick={onClose} aria-label="Close notes"><X /></button></div>
      <p>Record arithmetic, routes and contradictions. Notes are attached to the active {mode === "server" ? "PostgreSQL server" : "browser"} dossier and included in exports.</p>
      <textarea value={draft} maxLength={20000} onChange={(event) => { setDraft(event.target.value); setDirty(true); }} placeholder="00:17 — backup loop…" aria-label="Case notes" />
      <div className="notes-meta"><span>{draft.length.toLocaleString()} / 20,000</span><span className={`save-status ${status}`}>{status === "saving" ? "Saving…" : status === "saved" ? "Saved" : status === "error" ? "Not saved — retry" : dirty ? "Editing" : "Up to date"}</span></div>
      <div className="drawer-actions"><button className="primary-button" onClick={() => void manualSave()} disabled={status === "saving"}><NotebookPen />Save notes</button><button className="secondary-button" onClick={() => exportDossier("md")}><Download />Export with dossier</button></div>
    </motion.aside>
  </>}</AnimatePresence>;
}

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state, mode, loading, connectionIssue, storageAvailable, toasts, refresh, activateLocal, reset, exportDossier } = useCase();
  const [menuOpen, setMenuOpen] = useState(false);
  const [connectionOpen, setConnectionOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [resetting, setResetting] = useState(false);
  const solved = state?.stats.solved ?? 0;
  const modeLabel = mode === "server" ? "PostgreSQL dossier" : mode === "local" ? storageAvailable ? "Browser dossier" : "Temporary memory" : "Connecting";

  const doReset = async () => {
    setResetting(true);
    const ok = await reset(confirm);
    setResetting(false);
    if (ok) { setResetOpen(false); setConfirm(""); }
  };

  return <>
    <a className="skip-link" href="#main-content">Skip to investigation</a>
    <header className="site-header">
      <div className="case-progress" style={{ transform: `scaleX(${solved / 7})` }} />
      <Link href="/" className="brand" aria-label="Zero Meridian home"><span className="brand-mark"><i /><i /></span><span><strong>ZERO MERIDIAN</strong><small>{CASE_CODE}</small></span></Link>
      <nav className="desktop-nav" aria-label="Case nodes">{NAV.map((item) => <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""}><small>{item.code}</small>{item.label}</Link>)}</nav>
      <div className="header-actions">
        <button className={`connection-button ${mode}`} onClick={() => setConnectionOpen(true)} aria-label={`Storage status: ${modeLabel}`}>
          {loading ? <LoaderCircle className="spin" /> : mode === "server" ? <Database /> : <HardDrive />}<span>{modeLabel}</span><i />
        </button>
        <button className="icon-button notes-button" onClick={() => setNotesOpen(true)} aria-label="Open field notes"><NotebookPen /><span>{solved}/7</span></button>
        <button className="icon-button mobile-menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
      </div>
    </header>
    <AnimatePresence>{menuOpen && <motion.nav className="mobile-nav" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} aria-label="Mobile case nodes">{NAV.map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={pathname === item.href ? "active" : ""}><small>{item.code}</small><span>{item.label}</span><b>{item.href === "/" ? state?.stages[0]?.solved ? "01" : "00" : STAGES.filter((stage) => stage.href.startsWith(item.href)).filter((stage) => state?.stages.find((s) => s.id === stage.id)?.solved).length.toString().padStart(2, "0")}</b></Link>)}</motion.nav>}</AnimatePresence>
    {connectionIssue && mode === "local" && <button className="local-notice" onClick={() => setConnectionOpen(true)}><CloudOff /><span>{connectionIssue}</span><b>Details</b></button>}
    <div id="main-content">{children}</div>
    <footer className="site-footer"><div className="brand footer-brand"><span className="brand-mark"><i /><i /></span><span><strong>ZERO MERIDIAN</strong><small>Independent witness protocol</small></span></div><p>Seven linked acts. All tools run locally in your browser; only case progress uses PostgreSQL when configured.</p><div><button onClick={() => exportDossier("md")}><Download />Dossier</button><button onClick={() => setResetOpen(true)}><RotateCcw />Reset</button></div></footer>
    <NotesDrawer open={notesOpen} onClose={() => setNotesOpen(false)} />
    <AnimatePresence>{connectionOpen && <Modal onClose={() => setConnectionOpen(false)} label="Dossier storage and connection">
      <span className="eyebrow">Deployment diagnostic / live state</span><h2>Where your case is stored</h2>
      <div className={`storage-hero ${mode}`}>{mode === "server" ? <Cloud /> : mode === "local" ? <HardDrive /> : <LoaderCircle className="spin" />}<div><strong>{modeLabel}</strong><p>{mode === "server" ? "Progress, hints and notes are written through Drizzle ORM to PostgreSQL using an HTTP-only session cookie." : storageAvailable ? "The game is fully playable. Progress is written to localStorage on this device and is not claimed to be on the server." : "Browser storage is blocked. The current tab still works, but progress may disappear when it closes."}</p></div></div>
      {mode === "local" && <div className="vercel-guide"><h3><Server />Enable server persistence on Vercel</h3><ol><li>Create a PostgreSQL database (for example, Vercel Postgres or Neon).</li><li>In Vercel → Project → Settings → Environment Variables, add <code>DATABASE_URL</code> with the full pooled connection string.</li><li>Create the three tables once from the project root: <code>npx drizzle-kit push</code>.</li><li>Redeploy. The status here will change to <strong>PostgreSQL dossier</strong>; existing browser progress remains separate.</li></ol><p><BookOpenText />No external database? No action is required for local play. This message replaces the old blocking “dossier server is not responding” screen.</p></div>}
      <div className="connection-stats"><span>Acts <b>{solved}/7</b></span><span>Failed checks <b>{state?.stats.attempts ?? 0}</b></span><span>Hints <b>{state?.stats.hints ?? 0}</b></span></div>
      <div className="modal-actions"><button className="primary-button" onClick={() => void refresh()} disabled={loading}><RefreshCw className={loading ? "spin" : ""} />Retry server</button>{mode === "server" && <button className="secondary-button" onClick={() => { activateLocal(); setConnectionOpen(false); }}><HardDrive />Use browser copy</button>}<button className="secondary-button" onClick={() => exportDossier("json")}><Download />Export JSON</button></div>
    </Modal>}</AnimatePresence>
    <AnimatePresence>{resetOpen && <Modal onClose={() => setResetOpen(false)} label="Reset investigation"><span className="eyebrow">Destructive action</span><h2>Erase this investigation?</h2><p>This clears solved acts, attempts, hints, notes and puzzle workbench state in the active {mode === "server" ? "server" : "browser"} dossier. It cannot be undone. Export first if you need a record.</p><label className="field-label">Type <strong>{RESET_PHRASE}</strong><input value={confirm} onChange={(event) => setConfirm(event.target.value.toUpperCase())} autoComplete="off" placeholder={RESET_PHRASE} /></label><div className="modal-actions"><button className="danger-button" disabled={confirm !== RESET_PHRASE || resetting} onClick={() => void doReset()}><RotateCcw />{resetting ? "Erasing…" : "Erase progress"}</button><button className="secondary-button" onClick={() => setResetOpen(false)}>Keep investigating</button></div></Modal>}</AnimatePresence>
    <div className="toast-stack" aria-live="polite"><AnimatePresence>{toasts.map((toast) => <motion.div layout key={toast.id} className={`toast ${toast.tone}`} initial={{ opacity: 0, x: 40, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 25 }}><span>{toast.tone === "success" ? <Check /> : toast.tone === "error" ? <CloudOff /> : <NotebookPen />}</span><p>{toast.message}</p></motion.div>)}</AnimatePresence></div>
  </>;
}
