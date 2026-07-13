/**
 * TutorDebrief — AI instructor's post-call debrief on the scenario end screen.
 *
 * Calls tutor.debrief once on mount with the already-computed MethodologyScore
 * summary. The LLM narrates over deterministic ground truth (tier, strengths,
 * improvements) — it never invents the score. Degrades to the engine's own
 * coachingTips if the call fails.
 */
import { useEffect, useRef, useState } from "react";
import { GraduationCap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { MethodologyScore } from "@/lib/scoringEngine";

interface TutorDebriefProps {
  scenarioTitle: string;
  methodologyScore: MethodologyScore;
}

export default function TutorDebrief({ scenarioTitle, methodologyScore }: TutorDebriefProps) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const debriefMutation = trpc.tutor.debrief.useMutation();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    debriefMutation
      .mutateAsync({
        scenarioTitle,
        overallPercentage: methodologyScore.overallPercentage,
        methodologyTier: methodologyScore.methodologyTier,
        strengths: methodologyScore.strengths,
        improvements: methodologyScore.improvements,
        coachingTips: methodologyScore.coachingTips,
      })
      .then(res => setText(res.debrief))
      .catch(() => setText(methodologyScore.coachingTips.join(" ")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nothing useful to show and not loading → render nothing.
  if (!loading && !text) return null;

  return (
    <div className="sim-glass-panel p-6 mb-6 border border-emerald-500/20">
      <h3
        className="text-white font-semibold text-lg mb-4 flex items-center gap-2"
        style={{ fontFamily: "var(--font-sim-body)", textTransform: "none" }}
      >
        <GraduationCap className="w-5 h-5 text-emerald-400" />
        Instructor Debrief
      </h3>
      {loading ? (
        <p className="text-gray-400 text-sm">Your instructor is reviewing the call…</p>
      ) : (
        <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-line">{text}</p>
      )}
    </div>
  );
}
