/**
 * LessonOperatorRoleplay — a plant-floor communication simulator. The AI plays a
 * production OPERATOR (in a persona) who just had a breakdown; the learner must
 * explain the fault clearly, calmly, and safely, and hold the line on unsafe
 * "just keep resetting it" thinking. The Mentor (separately) evaluates the
 * exchange and writes ai_operator_communication / ai_safety_intervention evidence
 * into the Assessment Spine — feeding the Operator Communication readiness area.
 *
 * Short by design: 2 learner turns max. Unsafe advice stops the role-play and
 * triggers the mentor's safety correction.
 */
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { HardHat, Wrench, Send, Loader2, ShieldAlert, CheckCircle2 } from "lucide-react";
import { OPERATOR_PERSONA_LABEL, type OperatorPersona } from "@shared/maintenanceMentor";
import type { LessonCloseout } from "@shared/lessonCloseouts";

const QUALITY_STYLE: Record<string, string> = {
  strong: "text-emerald-300 border-emerald-500/30",
  partial: "text-amber-300 border-amber-500/30",
  weak: "text-amber-400 border-amber-500/30",
  unsafe: "text-red-300 border-red-500/40",
  unclear: "text-gray-400 border-gray-700",
};

interface Turn { from: "operator" | "you" | "mentor"; text: string; quality?: string; unsafe?: boolean; recorded?: boolean }

export default function LessonOperatorRoleplay({
  lessonTitle,
  domain,
  closeout,
}: {
  lessonTitle: string;
  domain: string;
  closeout: LessonCloseout;
}) {
  // Scenario-specific config: the operator's situation, persona, unsafe temptation.
  const SCENARIO = `${closeout.scenario} Production is tempted by: ${closeout.unsafeTemptation} — the technician must hold the line on that.`;
  const SCENARIO_TAG = closeout.scenarioTag;
  const [persona, setPersona] = useState<OperatorPersona | null>(closeout.persona);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [learnerTurns, setLearnerTurns] = useState(0);
  const [done, setDone] = useState(false);
  const started = useRef(false);

  const operator = trpc.mentor.operator.useMutation();
  const coach = trpc.mentor.coach.useMutation();
  const busy = operator.isPending || coach.isPending;

  // Operator opens the conversation.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const r = await operator.mutateAsync({ scenario: SCENARIO, persona: closeout.persona, turn: 0 });
        setPersona(r.persona as OperatorPersona);
        setTurns([{ from: "operator", text: r.message || closeout.operatorOpeningLine }]);
      } catch {
        setTurns([{ from: "operator", text: closeout.operatorOpeningLine }]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const evaluate = async (learnerText: string, historyForCtx: Turn[]) => {
    const r = await coach.mutateAsync({
      mode: "operator_communication",
      lessonTitle,
      cardHeading: "Operator role-play",
      domain: domain as never,
      learnerReasoning: learnerText,
      persona: persona ?? undefined,
      scenarioTag: SCENARIO_TAG,
    });
    setTurns([...historyForCtx, { from: "mentor", text: r.message, quality: r.quality, unsafe: r.unsafe, recorded: !!r.evidenceEmitted }]);
    setDone(true);
  };

  const submit = async () => {
    const text = input.trim();
    if (!text || busy || done) return;
    setInput("");
    const withYou: Turn[] = [...turns, { from: "you", text }];
    setTurns(withYou);
    const nextLearnerTurns = learnerTurns + 1;
    setLearnerTurns(nextLearnerTurns);

    if (nextLearnerTurns >= 2) {
      // Final turn → mentor evaluates the exchange and records evidence.
      await evaluate(text, withYou);
      return;
    }

    // First turn → operator reacts (or stops if the advice was unsafe).
    try {
      const history = withYou.map((t) => ({ from: t.from === "operator" ? ("operator" as const) : ("learner" as const), text: t.text }));
      const r = await operator.mutateAsync({ scenario: SCENARIO, persona: persona ?? undefined, turn: 1, learnerMessage: text, history });
      if (r.stop) {
        // Unsafe advice — mentor takes over with a safety correction + safety evidence.
        await evaluate(text, withYou);
      } else {
        setTurns([...withYou, { from: "operator", text: r.message || "Alright… so what do I do if it stops again?" }]);
      }
    } catch {
      setTurns([...withYou, { from: "operator", text: "Alright… so what do I do if it stops again?" }]);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-sky-500/25 bg-[#0a0f14] p-5">
      <div className="flex items-center gap-2 mb-1">
        <HardHat className="w-5 h-5 text-sky-400" />
        <h3 className="text-lg font-bold text-white">Talk to the operator</h3>
        {persona && <span className="text-[11px] text-sky-300/80 border border-sky-500/30 rounded px-1.5 py-0.5">{OPERATOR_PERSONA_LABEL[persona]}</span>}
      </div>
      <p className="text-gray-400 text-sm mb-2">The machine is running again. The operator wants a word — explain what happened like a tech: clear, calm, honest, and safe.</p>
      <p className="text-[11px] text-gray-600 mb-4">This conversation generates Operator Communication evidence. Unsafe advice triggers a safety intervention visible to your manager.</p>

      <div className="space-y-2">
        {turns.map((t, i) => (
          <div key={i} className={t.from === "you" ? "text-right" : ""}>
            {t.from === "operator" && (
              <div className="inline-flex items-start gap-2 rounded-lg bg-[#0d1420] border border-sky-500/20 px-3 py-2 max-w-[90%] text-left">
                <HardHat className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-200">{t.text}</span>
              </div>
            )}
            {t.from === "you" && <span className="inline-block rounded-lg bg-[#101a10] border border-emerald-500/20 text-gray-200 text-sm px-3 py-1.5 max-w-[90%] text-left">{t.text}</span>}
            {t.from === "mentor" && (
              <div className={`rounded-lg border-l-2 pl-3 py-2 ${t.unsafe ? "border-l-red-500 bg-red-500/8" : "border-l-emerald-500/60 bg-[#0b110b]"}`} role="status">
                <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono uppercase tracking-wide text-[oklch(0.60_0.08_155)]">
                  {t.unsafe ? <ShieldAlert className="w-3 h-3 text-red-400" /> : <Wrench className="w-3 h-3" />} Mentor
                </div>
                <p className="text-sm text-gray-200 leading-relaxed">{t.text}</p>
                {t.quality && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className={`text-[10px] uppercase tracking-wide rounded border px-1.5 py-0.5 ${QUALITY_STYLE[t.quality] ?? QUALITY_STYLE.unclear}`}>{t.quality} communication</span>
                    {t.recorded && <span className="inline-flex items-center gap-1 text-[10px] text-gray-600"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> recorded to your competency</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="flex items-center gap-2 text-xs text-gray-500"><Loader2 className="w-3.5 h-3.5 animate-spin" /> …</div>}
      </div>

      {!done ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="Explain it to the operator…"
            disabled={busy || turns.length === 0}
            className="flex-1 rounded-md bg-[#070b0f] border border-gray-800 text-sm text-gray-200 px-3 py-2 focus:outline-none focus:border-sky-500/50"
          />
          <button type="button" disabled={!input.trim() || busy || turns.length === 0} onClick={submit} className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-sm px-3 py-2">
            <Send className="w-3.5 h-3.5" /> Say it
          </button>
        </div>
      ) : (
        <p className="mt-3 text-[11px] text-gray-600">Role-play complete — your communication was evaluated and recorded. A technician has to fix the machine and explain it.</p>
      )}
    </div>
  );
}
