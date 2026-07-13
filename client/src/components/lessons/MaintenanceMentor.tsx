/**
 * MaintenanceMentor — the in-lesson AI mentor, native to EASLearn (not a sidebar
 * chatbot). A senior-tech teaching layer: ask the learner for reasoning, give
 * progressive hints, coach the thought process, protect safety, and record
 * ai_mentor evidence into the Assessment Spine. Never dumps answers.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Wrench, Lightbulb, Brain, ShieldAlert, Loader2, Send, ChevronDown, ChevronUp } from "lucide-react";

interface MentorTurn {
  from: "mentor" | "you";
  text: string;
  quality?: string;
  unsafe?: boolean;
  evidence?: string | null;
}

const QUALITY_STYLE: Record<string, string> = {
  strong: "text-emerald-300 border-emerald-500/30",
  partial: "text-amber-300 border-amber-500/30",
  weak: "text-amber-400 border-amber-500/30",
  unsafe: "text-red-300 border-red-500/40",
  unclear: "text-gray-400 border-gray-700",
};

export default function MaintenanceMentor({
  lessonTitle,
  cardHeading,
  mechanicId,
  domain,
  learnerAction,
}: {
  lessonTitle: string;
  cardHeading?: string;
  mechanicId?: string;
  domain: string;
  learnerAction?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reasoning, setReasoning] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [turns, setTurns] = useState<MentorTurn[]>([]);
  const coach = trpc.mentor.coach.useMutation();

  const ask = async (mode: "reasoning" | "hint" | "ask", opts: { reasoning?: string; hintLevel?: number } = {}) => {
    if (mode === "reasoning" && opts.reasoning) setTurns((t) => [...t, { from: "you", text: opts.reasoning! }]);
    try {
      const res = await coach.mutateAsync({
        mode,
        lessonTitle,
        cardHeading,
        mechanicId,
        domain: domain as never,
        learnerAction,
        learnerReasoning: opts.reasoning,
        hintLevel: opts.hintLevel,
      });
      setTurns((t) => [...t, { from: "mentor", text: res.message, quality: res.quality, unsafe: res.unsafe, evidence: res.evidenceEmitted?.evidenceType ?? null }]);
    } catch {
      setTurns((t) => [...t, { from: "mentor", text: "I couldn't reach you just now — take another look and tell me what you actually observe.", quality: "unclear" }]);
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-[oklch(0.22_0.06_155)] bg-[oklch(0.09_0.01_155)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-[oklch(0.80_0.10_155)]">
          <Wrench className="w-4 h-4" /> Ask the mentor
          <span className="text-[11px] text-[oklch(0.55_0.02_155)] font-normal">a senior tech, beside you</span>
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Conversation */}
          {turns.length > 0 && (
            <div className="space-y-2">
              {turns.map((t, i) => (
                <div key={i} className={t.from === "mentor" ? "" : "text-right"}>
                  {t.from === "mentor" ? (
                    <div className={`rounded-lg border-l-2 pl-3 py-2 ${t.unsafe ? "border-l-red-500 bg-red-500/8" : "border-l-emerald-500/60 bg-[oklch(0.11_0.01_155)]"}`}>
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono uppercase tracking-wide text-[oklch(0.60_0.08_155)]">
                        {t.unsafe ? <ShieldAlert className="w-3 h-3 text-red-400" /> : <Wrench className="w-3 h-3" />} Mentor
                      </div>
                      <p className="text-sm text-[oklch(0.80_0.01_155)] leading-relaxed">{t.text}</p>
                      {t.quality && (t.quality !== "unclear" || t.unsafe) && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className={`text-[10px] uppercase tracking-wide rounded border px-1.5 py-0.5 ${QUALITY_STYLE[t.quality] ?? QUALITY_STYLE.unclear}`}>{t.quality} reasoning</span>
                          {t.evidence && <span className="text-[10px] text-gray-600">recorded to your competency</span>}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="inline-block rounded-lg bg-[oklch(0.14_0.01_250)] text-gray-300 text-sm px-3 py-1.5 max-w-[85%] text-left">{t.text}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {coach.isPending && <div className="flex items-center gap-2 text-xs text-gray-500"><Loader2 className="w-3.5 h-3.5 animate-spin" /> the mentor is thinking…</div>}

          {/* Reasoning input */}
          {showInput ? (
            <div className="space-y-2">
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="What did you observe, and what would you check first — and why?"
                rows={2}
                className="w-full rounded-md bg-[oklch(0.07_0.005_155)] border border-[oklch(0.22_0.02_155)] text-sm text-gray-200 px-3 py-2 focus:outline-none focus:border-emerald-500/50 resize-none"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!reasoning.trim() || coach.isPending}
                  onClick={() => { ask("reasoning", { reasoning: reasoning.trim() }); setReasoning(""); setShowInput(false); }}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm px-3 py-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Tell the mentor
                </button>
                <button type="button" onClick={() => setShowInput(false)} className="text-xs text-gray-500 hover:text-gray-300">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setShowInput(true)} className="inline-flex items-center gap-1.5 rounded-md border border-[oklch(0.28_0.04_155)] text-[oklch(0.75_0.08_155)] hover:bg-[oklch(0.13_0.02_155)] text-sm px-3 py-1.5">
                <Brain className="w-3.5 h-3.5" /> Explain your reasoning
              </button>
              <button
                type="button"
                disabled={coach.isPending || hintLevel > 3}
                onClick={() => { ask("hint", { hintLevel }); setHintLevel((l) => Math.min(4, l + 1)); }}
                className="inline-flex items-center gap-1.5 rounded-md border border-[oklch(0.28_0.04_155)] text-[oklch(0.75_0.08_155)] hover:bg-[oklch(0.13_0.02_155)] disabled:opacity-40 text-sm px-3 py-1.5"
              >
                <Lightbulb className="w-3.5 h-3.5" /> {hintLevel === 0 ? "Need a hint?" : hintLevel > 3 ? "No more hints" : `Another hint (${hintLevel}/3)`}
              </button>
            </div>
          )}
          <p className="text-[10px] text-gray-600 leading-relaxed">The mentor coaches your thinking — it won't just hand you the answer. Your reasoning quality is recorded as competency evidence.</p>
        </div>
      )}
    </div>
  );
}
