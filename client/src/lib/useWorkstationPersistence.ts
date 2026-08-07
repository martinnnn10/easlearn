/**
 * useWorkstationPersistence — production persistence seam for the Motor Control
 * Diagnostic Workstation.
 *
 * Responsibilities:
 *  - Attempt bootstrap: server-authoritative resume-or-create (startAttempt is
 *    idempotent per (user, scenario); refresh/rerender cannot fork attempts).
 *  - Event recording: append-only queue, one client UUID per event, SERIAL pump
 *    (preserves action order ⇒ deterministic server ordering by insertion id),
 *    bounded retry with backoff, honest failure state (never silently dropped).
 *  - Auto-save: debounced machineState snapshots for resume.
 *  - Completion: drains the queue first, refuses if any write failed, then calls
 *    the fail-closed server completeAttempt — the server re-verifies persisted
 *    evidence and derives the grade itself.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import type { WorkstationEventType, WorkstationSavedState } from "@shared/workstationAnswerKey";
import { WORKSTATION_VERSION } from "@shared/workstationAnswerKey";

const MAX_RETRIES = 4;
const RETRY_BASE_MS = 750;
const AUTOSAVE_DEBOUNCE_MS = 2_000;

interface QueuedEvent {
  clientEventId: string;
  eventType: WorkstationEventType;
  detail?: unknown;
  componentRef?: string;
  tries: number;
}

export interface WorkstationPersistenceApi {
  /** Null until bootstrap finishes (events queue safely in the meantime). */
  attemptId: number | null;
  /** True while resume/create is in flight. */
  bootstrapping: boolean;
  /** Saved state from a resumed attempt (null on a fresh attempt). */
  resumedState: WorkstationSavedState | null;
  /** True if this attempt already has a recorded safety violation (resume). */
  resumedSafetyViolation: boolean;
  /** Bootstrap failure message (feature flag, network, …). */
  bootstrapError: string | null;
  /** Append a diagnostic event (fire-and-forget; queued + retried). */
  record: (eventType: WorkstationEventType, detail?: unknown, componentRef?: string) => void;
  /** Debounced machine-state autosave for resume. */
  saveState: (state: WorkstationSavedState) => void;
  /** Writes queued or in flight right now. */
  pendingWrites: number;
  /** Writes that exhausted retries — completion is blocked until retried. */
  failedWrites: number;
  /** Re-queue every failed write. */
  retryFailed: () => void;
  /** Drain queue, then complete server-side. Returns ok or an honest error. */
  complete: () => Promise<{ ok: boolean; error?: string; result?: unknown }>;
}

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useWorkstationPersistence(scenarioId: string, faultId: string, assignmentId?: number): WorkstationPersistenceApi {
  const utils = trpc.useUtils();
  const startMut = trpc.workstation.startAttempt.useMutation();
  const recordMut = trpc.workstation.recordEvent.useMutation();
  const saveMut = trpc.workstation.saveState.useMutation();
  const completeMut = trpc.workstation.completeAttempt.useMutation();

  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [resumedState, setResumedState] = useState<WorkstationSavedState | null>(null);
  const [resumedSafetyViolation, setResumedSafetyViolation] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [pendingWrites, setPendingWrites] = useState(0);
  const [failedWrites, setFailedWrites] = useState(0);

  const queueRef = useRef<QueuedEvent[]>([]);
  const failedRef = useRef<QueuedEvent[]>([]);
  const pumpingRef = useRef(false);
  const attemptIdRef = useRef<number | null>(null);
  const bootKeyRef = useRef<string>("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestStateRef = useRef<WorkstationSavedState | null>(null);

  const syncCounts = useCallback(() => {
    setPendingWrites(queueRef.current.length + (pumpingRef.current ? 1 : 0));
    setFailedWrites(failedRef.current.length);
  }, []);

  // ── Attempt bootstrap (resume-or-create). Guarded against StrictMode double-run
  //    per scenario key; the server is idempotent anyway. ──
  useEffect(() => {
    const key = `${scenarioId}::${assignmentId ?? ""}`;
    if (bootKeyRef.current === key) return;
    bootKeyRef.current = key;
    attemptIdRef.current = null;
    setAttemptId(null);
    setResumedState(null);
    setResumedSafetyViolation(false);
    setBootstrapError(null);
    setBootstrapping(true);

    startMut.mutateAsync({ scenarioId, faultId, assignmentId })
      .then((res) => {
        attemptIdRef.current = res.attemptId;
        setAttemptId(res.attemptId);
        if (res.resumed && res.machineState) {
          setResumedState(res.machineState as WorkstationSavedState);
        }
        setResumedSafetyViolation(!!res.safetyViolation);
      })
      .catch((err: unknown) => {
        setBootstrapError(err instanceof Error ? err.message : "Failed to start attempt");
      })
      .finally(() => setBootstrapping(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId, faultId, assignmentId]);

  // ── Serial queue pump: one event at a time, in order ──
  const pump = useCallback(async () => {
    if (pumpingRef.current) return;
    const aid = attemptIdRef.current;
    if (aid == null) return; // wait for bootstrap; events stay queued
    pumpingRef.current = true;
    syncCounts();
    try {
      while (queueRef.current.length > 0) {
        const evt = queueRef.current[0];
        try {
          await recordMut.mutateAsync({
            attemptId: aid,
            eventType: evt.eventType,
            detail: evt.detail,
            componentRef: evt.componentRef,
            idempotencyKey: `${aid}_${evt.clientEventId}`.slice(0, 64),
            scenarioVersion: WORKSTATION_VERSION,
          });
          queueRef.current.shift();
          syncCounts();
        } catch {
          evt.tries += 1;
          if (evt.tries >= MAX_RETRIES) {
            queueRef.current.shift();
            failedRef.current.push(evt);
            syncCounts();
          } else {
            syncCounts();
            await new Promise((r) => setTimeout(r, RETRY_BASE_MS * 2 ** (evt.tries - 1)));
          }
        }
      }
    } finally {
      pumpingRef.current = false;
      syncCounts();
    }
  }, [recordMut, syncCounts]);

  // Kick the pump whenever an attempt becomes available
  useEffect(() => {
    if (attemptId != null) void pump();
  }, [attemptId, pump]);

  const record = useCallback((eventType: WorkstationEventType, detail?: unknown, componentRef?: string) => {
    queueRef.current.push({ clientEventId: uuid(), eventType, detail, componentRef, tries: 0 });
    syncCounts();
    void pump();
  }, [pump, syncCounts]);

  const retryFailed = useCallback(() => {
    if (failedRef.current.length === 0) return;
    const failed = failedRef.current.splice(0, failedRef.current.length);
    for (const evt of failed) evt.tries = 0;
    queueRef.current.push(...failed);
    syncCounts();
    void pump();
  }, [pump, syncCounts]);

  // ── Debounced autosave ──
  const saveState = useCallback((state: WorkstationSavedState) => {
    latestStateRef.current = state;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const aid = attemptIdRef.current;
      const s = latestStateRef.current;
      if (aid == null || !s) return;
      saveMut.mutate({ attemptId: aid, machineState: s });
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [saveMut]);

  // Flush autosave on unmount/navigation (best effort)
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      const aid = attemptIdRef.current;
      const s = latestStateRef.current;
      if (aid != null && s) saveMut.mutate({ attemptId: aid, machineState: s });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Completion: drain queue → refuse on failures → server-side gate ──
  const complete = useCallback(async (): Promise<{ ok: boolean; error?: string; result?: unknown }> => {
    const aid = attemptIdRef.current;
    if (aid == null) return { ok: false, error: "No active attempt — cannot complete." };

    // Drain outstanding writes first (the server gate needs them persisted)
    const deadline = Date.now() + 30_000;
    while ((queueRef.current.length > 0 || pumpingRef.current) && Date.now() < deadline) {
      void pump();
      await new Promise((r) => setTimeout(r, 200));
    }
    if (failedRef.current.length > 0) {
      return { ok: false, error: `${failedRef.current.length} diagnostic event(s) failed to save. Retry saving before completing — your evidence is not on the server yet.` };
    }
    if (queueRef.current.length > 0 || pumpingRef.current) {
      return { ok: false, error: "Diagnostic events are still saving. Wait a moment and try again." };
    }

    // Flush the final state snapshot immediately
    if (latestStateRef.current) {
      try { await saveMut.mutateAsync({ attemptId: aid, machineState: latestStateRef.current }); } catch { /* non-blocking */ }
    }

    try {
      const result = await completeMut.mutateAsync({ attemptId: aid });
      void utils.workstation.myAssignments.invalidate();
      void utils.workstation.myCompletedAttempts.invalidate();
      return { ok: true, result };
    } catch (err: unknown) {
      return { ok: false, error: err instanceof Error ? err.message : "Completion failed on the server." };
    }
  }, [pump, saveMut, completeMut, utils]);

  return useMemo(() => ({
    attemptId, bootstrapping, resumedState, resumedSafetyViolation, bootstrapError,
    record, saveState, pendingWrites, failedWrites, retryFailed, complete,
  }), [attemptId, bootstrapping, resumedState, resumedSafetyViolation, bootstrapError, record, saveState, pendingWrites, failedWrites, retryFailed, complete]);
}
