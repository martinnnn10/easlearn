/**
 * Hydraulic Pressure-Loss Simulator — MVP driver.
 *
 * A method-first diagnostic flow (observe → isolate → verify → act → close out),
 * NOT a quiz. All grading is the shared engine (shared/hydraulicSim.ts); every
 * graded action emits an EvidenceEvent into the existing Assessment Spine via
 * trpc.assessment.recordEvidence. Fire-and-forget, only for signed-in learners.
 */
import { useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import HydraulicSchematic from "./HydraulicSchematic";
import {
  HYDRAULIC_SCENARIOS,
  HYDRAULIC_TEST_POINTS,
  HYDRAULIC_CAUSES,
  HYDRAULIC_ACTIONS,
  getHydraulicAction,
  evaluateDiagnosis,
  scoreMethodology,
  methodologyTier,
  diagnosisEvidence,
  safetyActionEvidence,
  hydraulicCompletionEvidence,
  hydraulicCloseoutEvidence,
  type HydraulicFaultId,
  type HydraulicTestPointId,
  type HydraulicCauseId,
  type HydraulicActionId,
  type DiagnosisResult,
  type HydraulicSession,
} from "@shared/hydraulicSim";
import type { EvidenceEvent } from "@shared/assessmentSpine";

type Phase = "brief" | "investigate" | "diagnose" | "act" | "closeout" | "debrief";

/** Strip an EvidenceEvent to the flat fields the recordEvidence input accepts. */
function toPayload(ev: EvidenceEvent) {
  return {
    sourceType: ev.sourceType,
    evidenceType: ev.evidenceType,
    domain: ev.domain,
    skill: ev.skill,
    lessonId: ev.lessonId,
    correctness: ev.correctness,
    reasoningQuality: ev.reasoningQuality,
    methodologyScore: ev.methodologyScore,
    confidenceScore: ev.confidenceScore,
    safetyFlag: ev.safetyFlag,
  };
}

export default function HydraulicSim({ initialFault = "clogged_filter" }: { initialFault?: HydraulicFaultId }) {
  const { isAuthenticated } = useAuth();
  const recordEvidence = trpc.assessment.recordEvidence.useMutation();
  const emit = (ev: EvidenceEvent) => {
    if (isAuthenticated) recordEvidence.mutate(toPayload(ev));
  };

  const [faultId, setFaultId] = useState<HydraulicFaultId>(initialFault);
  const scenario = HYDRAULIC_SCENARIOS[faultId];
  const [phase, setPhase] = useState<Phase>("brief");
  const [gathered, setGathered] = useState<Set<HydraulicTestPointId>>(new Set());
  const [unsafeTaken, setUnsafeTaken] = useState<HydraulicActionId[]>([]);
  const [safeTaken, setSafeTaken] = useState<HydraulicActionId[]>([]);
  const [wrongDiagnoses, setWrongDiagnoses] = useState(0);
  const [cause, setCause] = useState<HydraulicCauseId | "">("");
  const [confidence, setConfidence] = useState(60);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [warning, setWarning] = useState<{ id: HydraulicActionId; hazard: string } | null>(null);
  const [operatorText, setOperatorText] = useState("");
  const [woText, setWoText] = useState("");
  const [handoffText, setHandoffText] = useState("");
  const startRef = useRef(0);

  const reset = (f: HydraulicFaultId) => {
    setFaultId(f); setPhase("brief"); setGathered(new Set()); setUnsafeTaken([]); setSafeTaken([]);
    setWrongDiagnoses(0); setCause(""); setConfidence(60); setDiagnosis(null);
    setOperatorText(""); setWoText(""); setHandoffText("");
  };

  const session: HydraulicSession = useMemo(
    () => ({ faultId, cluesGathered: Array.from(gathered), unsafeActionsTaken: unsafeTaken, wrongDiagnoses, diagnosis: diagnosis ?? undefined,
      timeSeconds: startRef.current ? Math.round((Date.now() - startRef.current) / 1000) : undefined }),
    [faultId, gathered, unsafeTaken, wrongDiagnoses, diagnosis],
  );

  const probe = (p: HydraulicTestPointId) => {
    if (gathered.has(p)) return;
    setGathered((prev) => new Set(prev).add(p));
  };

  const takeAction = (id: HydraulicActionId) => {
    const action = getHydraulicAction(id);
    if (!action.safe) { setWarning({ id, hazard: action.hazard ?? "" }); return; }
    setSafeTaken((prev) => (prev.includes(id) ? prev : [...prev, id]));
    emit(safetyActionEvidence(action));
  };

  const confirmUnsafe = () => {
    if (!warning) return;
    const action = getHydraulicAction(warning.id);
    setUnsafeTaken((prev) => [...prev, warning.id]);
    emit(safetyActionEvidence(action)); // safetyFlag → Needs Safety Review
    setWarning(null);
  };

  const commitDiagnosis = () => {
    if (!cause) return;
    const result = evaluateDiagnosis(scenario, cause, gathered);
    setDiagnosis(result);
    diagnosisEvidence(scenario, result, confidence).forEach(emit);
    if (!result.correct) { setWrongDiagnoses((n) => n + 1); return; }
    setPhase("act");
  };

  const finishAct = () => setPhase("closeout");

  const finishCloseout = () => {
    emit(hydraulicCloseoutEvidence("operator", operatorText));
    emit(hydraulicCloseoutEvidence("workOrder", woText));
    emit(hydraulicCloseoutEvidence("handoff", handoffText));
    emit(hydraulicCompletionEvidence(scenario, session));
    setPhase("debrief");
  };

  const score = scoreMethodology(scenario, session);
  const relievedFirst = safeTaken.includes("relieve_and_verify_zero");

  const card = "rounded-xl border border-[oklch(0.20_0.004_250)] bg-[oklch(0.11_0.003_250)] p-4";
  const btn = "rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-11";

  return (
    <div className="space-y-4 text-[oklch(0.82_0.01_250)]">
      {/* Scenario switch */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-[oklch(0.55_0.01_250)]">Scenario:</span>
        {(["clogged_filter", "pump_wear"] as HydraulicFaultId[]).map((f) => (
          <button key={f} onClick={() => reset(f)}
            className={`${btn} ${faultId === f ? "bg-[oklch(0.30_0.10_155)] text-white" : "bg-[oklch(0.16_0.004_250)] text-[oklch(0.70_0.01_250)]"}`}>
            {f === "clogged_filter" ? "F1 · Clogged filter" : "F4 · Pump wear"}
          </button>
        ))}
      </div>

      {/* Brief */}
      {phase === "brief" && (
        <div className={card}>
          <h3 className="text-white font-semibold mb-1">{scenario.title}</h3>
          <p className="text-sm text-[oklch(0.68_0.01_250)] mb-3">{scenario.dispatch}</p>
          <p className="text-xs text-[oklch(0.55_0.01_250)] mb-3">Method: <b>observe → check the print → check pressure at the source → isolate the section → verify → act safely → close out.</b> Don't blame the pump until the evidence proves the pump.</p>
          <button className={`${btn} bg-[oklch(0.30_0.10_155)] text-white`} onClick={() => { startRef.current = Date.now(); setPhase("investigate"); }}>Take the call →</button>
        </div>
      )}

      {/* Investigate */}
      {(phase === "investigate" || phase === "diagnose") && (
        <>
          <div className={card}>
            <HydraulicSchematic readings={scenario.readings} gathered={gathered} onProbe={probe} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className={card}>
              <div className="text-xs uppercase tracking-wide text-[oklch(0.55_0.01_250)] mb-2">Readings taken ({gathered.size}/{HYDRAULIC_TEST_POINTS.length})</div>
              <ul className="space-y-1.5 text-sm">
                {Array.from(gathered).map((p) => {
                  const r = scenario.readings[p];
                  const meta = HYDRAULIC_TEST_POINTS.find((t) => t.id === p)!;
                  return <li key={p} className="flex justify-between gap-2"><span className="text-[oklch(0.60_0.01_250)]">{meta.label}</span><span className="font-mono">{r.value}{r.unit ? ` ${r.unit}` : ""}</span></li>;
                })}
                {gathered.size === 0 && <li className="text-[oklch(0.50_0.01_250)]">Tap a test point on the schematic to start.</li>}
              </ul>
              {Array.from(gathered).some((p) => scenario.readings[p].interpretation) && (
                <p className="mt-3 text-xs text-[oklch(0.62_0.01_250)] border-l-2 border-[oklch(0.40_0.08_155)] pl-2">{scenario.readings[Array.from(gathered).at(-1)!].interpretation}</p>
              )}
            </div>
            <div className={card}>
              <div className="text-xs uppercase tracking-wide text-[oklch(0.55_0.01_250)] mb-2">Before you touch anything</div>
              <div className="flex flex-col gap-2">
                {HYDRAULIC_ACTIONS.filter((a) => a.category === "verify" || a.category === "isolate" || a.category === "unsafe").map((a) => (
                  <button key={a.id} onClick={() => takeAction(a.id)}
                    className={`${btn} text-left ${a.safe ? "bg-[oklch(0.16_0.05_155)] text-[oklch(0.80_0.10_155)]" : "bg-[oklch(0.15_0.06_25)] text-[oklch(0.78_0.12_25)]"} ${safeTaken.includes(a.id) ? "ring-1 ring-[oklch(0.55_0.12_155)]" : ""}`}>
                    {a.safe ? "✓ " : "⚠ "}{a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button className={`${btn} bg-[oklch(0.30_0.10_155)] text-white`} onClick={() => setPhase("diagnose")}>I've isolated it — commit a diagnosis →</button>
        </>
      )}

      {/* Diagnose */}
      {phase === "diagnose" && (
        <div className={card}>
          <div className="text-white font-semibold mb-2">What's the cause? Commit — then defend it.</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {HYDRAULIC_CAUSES.map((c) => (
              <button key={c.id} onClick={() => setCause(c.id)}
                className={`${btn} text-left ${cause === c.id ? "bg-[oklch(0.28_0.08_250)] text-white" : "bg-[oklch(0.16_0.004_250)] text-[oklch(0.72_0.01_250)]"}`}>{c.label}</button>
            ))}
          </div>
          <div className="mt-3 text-sm">
            <label className="text-[oklch(0.60_0.01_250)]">Confidence: {confidence}%</label>
            <input type="range" min={10} max={100} step={10} value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} className="w-full" />
          </div>
          <button disabled={!cause} className={`${btn} mt-3 bg-[oklch(0.30_0.10_155)] text-white disabled:opacity-40`} onClick={commitDiagnosis}>Commit diagnosis</button>
          {diagnosis && (
            <div className={`mt-3 rounded-lg p-3 text-sm ${diagnosis.correct ? (diagnosis.reasoningQuality === "sound" ? "bg-[oklch(0.18_0.06_155)] text-[oklch(0.85_0.10_155)]" : "bg-[oklch(0.18_0.06_85)] text-[oklch(0.85_0.10_85)]") : "bg-[oklch(0.18_0.07_25)] text-[oklch(0.85_0.10_25)]"}`}>
              <b>{diagnosis.correct ? (diagnosis.reasoningQuality === "sound" ? "Sound call." : "Right cause — but not yet mastery.") : "Not the evidence."}</b> {diagnosis.message}
              {!diagnosis.correct && <div className="mt-1 text-xs opacity-80">Keep investigating and try again.</div>}
            </div>
          )}
        </div>
      )}

      {/* Act */}
      {phase === "act" && (
        <div className={card}>
          <div className="text-white font-semibold mb-2">Repair — safely.</div>
          {!relievedFirst && <p className="text-xs text-[oklch(0.78_0.12_25)] mb-2">⚠ You have not relieved system pressure / verified 0 psi. Do that before opening the system.</p>}
          <div className="flex flex-col gap-2">
            {HYDRAULIC_ACTIONS.filter((a) => a.category === "repair" || a.category === "verify" || a.category === "isolate").map((a) => (
              <button key={a.id} onClick={() => takeAction(a.id)}
                className={`${btn} text-left bg-[oklch(0.16_0.05_155)] text-[oklch(0.80_0.10_155)] ${safeTaken.includes(a.id) ? "ring-1 ring-[oklch(0.55_0.12_155)]" : ""}`}>✓ {a.label}</button>
            ))}
          </div>
          <p className="mt-3 text-sm text-[oklch(0.62_0.01_250)]">Correct fix: <b>{scenario.correctFixLabel}</b></p>
          <button className={`${btn} mt-3 bg-[oklch(0.30_0.10_155)] text-white`} onClick={finishAct}>Fix verified — close out the job →</button>
        </div>
      )}

      {/* Closeout */}
      {phase === "closeout" && (
        <div className={card}>
          <div className="text-white font-semibold mb-1">Close the ticket</div>
          <p className="text-sm text-[oklch(0.68_0.01_250)] mb-3 border-l-2 border-[oklch(0.40_0.06_250)] pl-2 italic">Operator: "It's moving again — was it the pump? Can we just crank the pressure up and keep running if it gets slow again?"</p>
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-[oklch(0.60_0.01_250)]">Explain it to the operator (no blame; what you verified; why running it weak/cranking the relief is unsafe):</label>
              <textarea value={operatorText} onChange={(e) => setOperatorText(e.target.value)} rows={3} className="mt-1 w-full rounded-md bg-[oklch(0.08_0.003_250)] border border-[oklch(0.22_0.004_250)] p-2 text-[oklch(0.82_0.01_250)]" placeholder="The clamp was weak because… I verified… don't keep running it slow — call maintenance if…" />
            </div>
            <div>
              <label className="text-[oklch(0.60_0.01_250)]">Work order (symptom · readings · test points · cause · action · follow-up):</label>
              <textarea value={woText} onChange={(e) => setWoText(e.target.value)} rows={2} className="mt-1 w-full rounded-md bg-[oklch(0.08_0.003_250)] border border-[oklch(0.22_0.004_250)] p-2 text-[oklch(0.82_0.01_250)]" placeholder="Symptom… P1/P2… cause… corrective action… follow-up…" />
            </div>
            <div>
              <label className="text-[oklch(0.60_0.01_250)]">Shift handoff (state · verified · still unknown · watch for):</label>
              <textarea value={handoffText} onChange={(e) => setHandoffText(e.target.value)} rows={2} className="mt-1 w-full rounded-md bg-[oklch(0.08_0.003_250)] border border-[oklch(0.22_0.004_250)] p-2 text-[oklch(0.82_0.01_250)]" placeholder="Clamp back up… verified… still open… watch…" />
            </div>
          </div>
          <button className={`${btn} mt-3 bg-[oklch(0.30_0.10_155)] text-white`} onClick={finishCloseout}>Submit closeout</button>
        </div>
      )}

      {/* Debrief */}
      {phase === "debrief" && (
        <div className={card}>
          <div className="text-white font-semibold mb-2">Debrief</div>
          <div className="grid gap-2 sm:grid-cols-3 text-sm mb-3">
            <div className="rounded-lg bg-[oklch(0.14_0.004_250)] p-3"><div className="text-2xl font-bold text-white">{score}</div><div className="text-xs text-[oklch(0.55_0.01_250)]">Methodology · {methodologyTier(score)}</div></div>
            <div className="rounded-lg bg-[oklch(0.14_0.004_250)] p-3"><div className={`text-lg font-bold ${diagnosis?.reasoningQuality === "sound" ? "text-[oklch(0.75_0.12_155)]" : "text-[oklch(0.78_0.12_85)]"}`}>{diagnosis?.reasoningQuality ?? "—"}</div><div className="text-xs text-[oklch(0.55_0.01_250)]">Reasoning</div></div>
            <div className="rounded-lg bg-[oklch(0.14_0.004_250)] p-3"><div className={`text-lg font-bold ${unsafeTaken.length ? "text-[oklch(0.72_0.14_25)]" : "text-[oklch(0.75_0.12_155)]"}`}>{unsafeTaken.length ? "Safety review" : "Clear"}</div><div className="text-xs text-[oklch(0.55_0.01_250)]">Safety</div></div>
          </div>
          <p className="text-xs text-[oklch(0.60_0.01_250)]">Evidence emitted to your Skills Passport under <b>Hydraulic Troubleshooting</b> (fluid_power): readings, committed diagnosis with reasoning, safety actions, methodology, and closeout communication. A strong run supports readiness — mastery still needs manager validation.</p>
          <button className={`${btn} mt-3 bg-[oklch(0.16_0.004_250)] text-[oklch(0.72_0.01_250)]`} onClick={() => reset(faultId === "clogged_filter" ? "pump_wear" : "clogged_filter")}>Run the other scenario →</button>
        </div>
      )}

      {/* Unsafe warning modal */}
      {warning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setWarning(null)}>
          <div className="max-w-sm rounded-xl border border-[oklch(0.40_0.14_25)] bg-[oklch(0.12_0.02_25)] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-[oklch(0.85_0.14_25)] font-semibold mb-1">⚠ Stored hydraulic energy</div>
            <p className="text-sm text-[oklch(0.80_0.04_25)] mb-3">{warning.hazard}</p>
            <div className="flex gap-2">
              <button className={`${btn} bg-[oklch(0.20_0.004_250)] text-[oklch(0.80_0.01_250)] flex-1`} onClick={() => setWarning(null)}>Cancel (stay safe)</button>
              <button className={`${btn} bg-[oklch(0.30_0.10_25)] text-white flex-1`} onClick={confirmUnsafe}>Do it anyway</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
