/**
 * FreeTextDiagnosis — open-response assessment on the scenario debrief screen.
 *
 * Asks the learner to state the root cause in their own words, then grades it with
 * tutor.gradeFreeText against the scenario's known Fault.rootCause (ground truth).
 * This assesses REASONING, not recognition — the single biggest assessment-validity
 * upgrade for HireReady / certification. Optional: skippable, never blocks the debrief.
 */
import { useState } from "react";
import { PenLine, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface FreeTextDiagnosisProps {
  faultName: string;
  correctRootCause: string;
  /** Links the graded attempt to the scenario in the accreditation trail. */
  scenarioSlug?: string;
}

export default function FreeTextDiagnosis({ faultName, correctRootCause, scenarioSlug }: FreeTextDiagnosisProps) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<{ score: number; rationale: string; missed: string } | null>(null);
  const grade = trpc.tutor.gradeFreeText.useMutation();

  const submit = async () => {
    if (!answer.trim()) return;
    const res = await grade.mutateAsync({ faultName, correctRootCause, learnerAnswer: answer, scenarioSlug });
    setResult({ score: res.score, rationale: res.rationale, missed: res.missed });
  };

  const scoreColor = result
    ? result.score >= 80
      ? "text-emerald-400"
      : result.score >= 50
        ? "text-amber-400"
        : "text-red-400"
    : "text-gray-400";

  return (
    <div className="sim-glass-panel p-6 mb-6 border border-gray-700/40">
      <h3
        className="text-white font-semibold text-lg mb-2 flex items-center gap-2"
        style={{ fontFamily: "var(--font-sim-body)", textTransform: "none" }}
      >
        <PenLine className="w-5 h-5 text-emerald-400" />
        Explain it in your own words
      </h3>
      <p className="text-gray-400 text-xs mb-3 leading-relaxed">
        What was the root cause of <span className="text-gray-200">{faultName}</span>, and how would you confirm it?
      </p>

      {!result ? (
        <>
          <textarea
            className="w-full bg-[#0a0f0a] border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 h-24"
            placeholder="Type your diagnosis…"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
          />
          <button
            onClick={submit}
            disabled={grade.isPending || !answer.trim()}
            className="mt-2 flex items-center gap-2 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-sm px-3 py-1.5 text-white"
          >
            {grade.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Submit diagnosis
          </button>
        </>
      ) : (
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${scoreColor}`}>{result.score}</span>
            <span className="text-gray-500 text-xs">/ 100</span>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{result.rationale}</p>
          {result.missed && (
            <p className="text-amber-400/90 text-xs flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Missed: {result.missed}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
