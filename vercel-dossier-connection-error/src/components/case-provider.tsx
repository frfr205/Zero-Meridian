"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { buildDossierMarkdown } from "@/lib/case-export";
import { createCaseState, refreshCaseState, resetLocalCase, revealLocalHint, startLocalCase, submitLocalStage } from "@/lib/case-engine";
import type { ApiResult, CaseState, PersistenceMode, StageId, SubmitResult } from "@/lib/case-types";

const STORAGE_KEY = "zero-meridian.case.v3";
type ToastTone = "info" | "success" | "error";
interface Toast { id: number; message: string; tone: ToastTone; }

interface CaseContextValue {
  state: CaseState | null;
  loading: boolean;
  mode: PersistenceMode;
  connectionIssue: string | null;
  storageAvailable: boolean;
  toasts: Toast[];
  refresh: () => Promise<void>;
  activateLocal: () => void;
  start: (alias: string) => Promise<boolean>;
  submit: (stageId: StageId, payload: unknown) => Promise<SubmitResult>;
  revealHint: (stageId: StageId) => Promise<string | null>;
  saveNotes: (notes: string) => Promise<boolean>;
  reset: (confirm: string) => Promise<boolean>;
  exportDossier: (format?: "md" | "json") => void;
  notify: (message: string, tone?: ToastTone) => void;
}

const CaseContext = createContext<CaseContextValue | null>(null);

function localId(): string {
  try { return crypto.randomUUID(); } catch { return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
}

function validLocalState(value: unknown): value is CaseState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CaseState>;
  return Boolean(candidate.session && typeof candidate.session.id === "string" && Array.isArray(candidate.stages) && candidate.stages.length === 7 && candidate.stats && typeof candidate.notes === "string");
}

async function apiRequest(url: string, init?: RequestInit): Promise<{ response: Response; result: ApiResult }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { ...init, cache: "no-store", signal: controller.signal });
    const result = await response.json().catch(() => ({ ok: false, message: "The dossier returned an unreadable response." })) as ApiResult;
    return { response, result };
  } finally { window.clearTimeout(timeout); }
}

export function CaseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CaseState | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<PersistenceMode>("connecting");
  const [connectionIssue, setConnectionIssue] = useState<string | null>(null);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const stateRef = useRef<CaseState | null>(null);
  const modeRef = useRef<PersistenceMode>("connecting");
  const toastId = useRef(0);

  const commit = useCallback((next: CaseState | null) => {
    stateRef.current = next;
    setState(next);
  }, []);
  const changeMode = useCallback((next: PersistenceMode) => {
    modeRef.current = next;
    setMode(next);
  }, []);
  const notify = useCallback((message: string, tone: ToastTone = "info") => {
    const id = ++toastId.current;
    setToasts((items) => [...items.slice(-2), { id, message, tone }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 5000);
  }, []);

  const persistLocal = useCallback((next: CaseState) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStorageAvailable(true);
    } catch { setStorageAvailable(false); }
  }, []);

  const commitLocal = useCallback((next: CaseState) => {
    const refreshed = refreshCaseState(next);
    changeMode("local");
    commit(refreshed);
    persistLocal(refreshed);
  }, [changeMode, commit, persistLocal]);

  const readLocal = useCallback((): CaseState => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (validLocalState(parsed)) return refreshCaseState(parsed);
      }
    } catch { setStorageAvailable(false); }
    const created = createCaseState(localId());
    persistLocal(created);
    return created;
  }, [persistLocal]);

  const activateLocal = useCallback(() => {
    commitLocal(stateRef.current && modeRef.current === "local" ? stateRef.current : readLocal());
    setConnectionIssue("Browser dossier active. Server synchronization is off; progress stays on this device.");
  }, [commitLocal, readLocal]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const local = readLocal();
    if (!stateRef.current || modeRef.current === "local") commit(local);
    try {
      const { response, result } = await apiRequest("/api/case");
      if (!response.ok || !result.ok || !result.state) {
        changeMode("local");
        commit(local);
        persistLocal(local);
        setConnectionIssue(result.code === "DATABASE_UNAVAILABLE"
          ? "PostgreSQL is not configured or is unreachable. Progress is stored only in this browser."
          : result.message ?? "The server dossier is unavailable. Progress is stored only in this browser.");
        return;
      }
      changeMode("server");
      commit(refreshCaseState(result.state));
      setConnectionIssue(null);
    } catch {
      changeMode("local");
      commit(local);
      persistLocal(local);
      setConnectionIssue("The Vercel function could not be reached. Your investigation remains available in this browser.");
    } finally { setLoading(false); }
  }, [changeMode, commit, persistLocal, readLocal]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (stateRef.current?.session.startedAt && !stateRef.current.session.completedAt) {
        const next = refreshCaseState(stateRef.current);
        stateRef.current = next;
        setState(next);
      }
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const start = useCallback(async (alias: string): Promise<boolean> => {
    if (modeRef.current !== "server") {
      const current = stateRef.current ?? readLocal();
      commitLocal(startLocalCase(current, alias));
      setConnectionIssue((issue) => issue ?? "Progress is stored in this browser.");
      notify("Case accepted. The Watch Protocol is available.", "success");
      return true;
    }
    try {
      const { response, result } = await apiRequest("/api/case", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start", alias }) });
      if (result.state) commit(refreshCaseState(result.state));
      if (!response.ok || !result.ok) { notify(result.message ?? "Could not start the case.", "error"); return false; }
      notify("Case accepted. The Watch Protocol is available.", "success");
      return true;
    } catch { notify("The server did not save the start. Retry or switch to browser mode.", "error"); return false; }
  }, [commit, commitLocal, notify, readLocal]);

  const submit = useCallback(async (stageId: StageId, payload: unknown): Promise<SubmitResult> => {
    if (modeRef.current !== "server") {
      const current = stateRef.current ?? readLocal();
      const outcome = submitLocalStage(current, stageId, payload);
      commitLocal(outcome.state);
      notify(outcome.result.message, outcome.result.correct ? "success" : "error");
      return outcome.result;
    }
    try {
      const { response, result } = await apiRequest("/api/case/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stageId, payload }) });
      if (result.state) commit(refreshCaseState(result.state));
      const message = result.message ?? (response.ok ? "Answer checked." : "Could not check the answer.");
      if (!response.ok || !result.ok) { notify(message, "error"); return { correct: false, message }; }
      notify(message, result.correct ? "success" : "error");
      return { correct: Boolean(result.correct), message };
    } catch {
      const message = "No answer was written: the server connection failed. Retry or switch to browser mode.";
      notify(message, "error");
      return { correct: false, message };
    }
  }, [commit, commitLocal, notify, readLocal]);

  const revealHint = useCallback(async (stageId: StageId): Promise<string | null> => {
    if (modeRef.current !== "server") {
      const outcome = revealLocalHint(stateRef.current ?? readLocal(), stageId);
      commitLocal(outcome.state);
      if (outcome.message) notify(outcome.message, "info");
      return outcome.hint;
    }
    try {
      const { response, result } = await apiRequest("/api/case/hint", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stageId }) });
      if (result.state) commit(refreshCaseState(result.state));
      if (!response.ok || !result.ok) { notify(result.message ?? "Hint unavailable.", "error"); return null; }
      if (result.message) notify(result.message, "info");
      return result.hint ?? null;
    } catch { notify("The hint could not be loaded from the server.", "error"); return null; }
  }, [commit, commitLocal, notify, readLocal]);

  const saveNotes = useCallback(async (notes: string): Promise<boolean> => {
    if (modeRef.current !== "server") {
      const current = stateRef.current ?? readLocal();
      commitLocal({ ...current, notes: notes.slice(0, 20000) });
      return true;
    }
    try {
      const { response, result } = await apiRequest("/api/case", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "notes", notes }) });
      if (result.state) commit(refreshCaseState(result.state));
      if (!response.ok || !result.ok) throw new Error(result.message);
      return true;
    } catch { notify("Notes were not saved on the server. Your text is still in the editor.", "error"); return false; }
  }, [commit, commitLocal, notify, readLocal]);

  const reset = useCallback(async (confirmText: string): Promise<boolean> => {
    if (confirmText !== "ZERO MERIDIAN") { notify("Type the full case name to reset.", "error"); return false; }
    if (modeRef.current !== "server") {
      const current = stateRef.current ?? readLocal();
      commitLocal(resetLocalCase(current));
      try {
        Object.keys(window.localStorage).filter((key) => key.startsWith("nm-ui-")).forEach((key) => window.localStorage.removeItem(key));
      } catch { /* no-op */ }
      window.dispatchEvent(new Event("zero-meridian-reset"));
      notify("Browser progress fully reset.", "info");
      return true;
    }
    try {
      const { response, result } = await apiRequest("/api/case", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reset", confirm: confirmText }) });
      if (result.state) commit(refreshCaseState(result.state));
      if (!response.ok || !result.ok) { notify(result.message ?? "Reset failed.", "error"); return false; }
      window.dispatchEvent(new Event("zero-meridian-reset"));
      notify("Server progress fully reset.", "info");
      return true;
    } catch { notify("The server did not reset the case.", "error"); return false; }
  }, [commit, commitLocal, notify, readLocal]);

  const exportDossier = useCallback((format: "md" | "json" = "md") => {
    const current = stateRef.current;
    if (!current) { notify("The dossier is still loading.", "error"); return; }
    const body = format === "json" ? JSON.stringify({ case: "Zero Meridian", persistence: modeRef.current, exportedAt: new Date().toISOString(), state: current }, null, 2) : buildDossierMarkdown(current, modeRef.current === "server" ? "server" : "local");
    const blob = new Blob([body], { type: format === "json" ? "application/json;charset=utf-8" : "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `zero-meridian-dossier.${format}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    notify(`${format.toUpperCase()} dossier exported from the current state.`, "success");
  }, [notify]);

  const value = useMemo<CaseContextValue>(() => ({ state, loading, mode, connectionIssue, storageAvailable, toasts, refresh, activateLocal, start, submit, revealHint, saveNotes, reset, exportDossier, notify }), [state, loading, mode, connectionIssue, storageAvailable, toasts, refresh, activateLocal, start, submit, revealHint, saveNotes, reset, exportDossier, notify]);
  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
}

export function useCase(): CaseContextValue {
  const context = useContext(CaseContext);
  if (!context) throw new Error("useCase must be used inside CaseProvider");
  return context;
}
