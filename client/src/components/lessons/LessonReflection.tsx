/**
 * LessonReflection — the closeout of the apprenticeship loop. After the learner
 * has worked the circuit and the reasoning mechanic, the mentor asks them to do
 * what a real technician must: explain what happened, tell the operator, write the
 * work order, hand off to the next shift. Each is graded for plant-floor
 * communication quality and recorded as ai_mentor evidence in the Assessment Spine.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Wrench, Send, Loader2, ShieldAlert, CheckCircle2 } from "lucide-react";
import type { MentorMode } from "@shared/maintenanceMentor";
import type { LessonCloseout } from "@shared/lessonCloseouts";

const QUALITY_STYLE: Record<string, string> = {
  strong: "text-emerald-300 border-emerald-500/30",
  partial: "text-amber-300 border-amber-500/30",
  weak: "text-amber-400 border-amber-500/30",
  unsafe: "text-red-300 border-red-500/40",
  unclear: "text-gray-400 border-gray-700",
};

function ReflectionBlock({
  lessonTitle,
  domain,
  mode,
  title,
  placeholder,
  scenarioTag,
}: {
  lessonTitle: string;
  domain: string;
  mode: MentorMode;
  title: string;
  placeholder: string;
  scenarioTag?: string;
}) {
  const [text, setText] = useState("");
  const [resp, setResp] = useState<{ message: string; quality: string; unsafe: boolean; recorded: boolean } | null>(null);
  const coach = trpc.mentor.coach.useMutation();

  const submit = async () => {
    if (!text.trim()) return;
    try {
      const r = await coach.mutateAsync({ mode, lessonTitle, domain: domain as never, learnerReasoning: text.trim(), scenarioTag });
      setResp({ message: r.message, quality: r.quality, unsafe: r.unsafe, recorded: !!r.evidenceEmitted });
    } catch {
      setResp({ message: "I couldn't reach you just now — but keep it specific: what did you actually verify?", quality: "unclear", unsafe: false, recorded: false });
    }
  };

  return (
    <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-4">
      <label className="block text-sm font-medium text-gray-200 mb-2">{title}</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-md bg-[#070b07] border border-gray-800 text-sm text-gray-200 px-3 py-2 focus:outline-none focus:border-emerald-500/50 resize-none"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          disabled={!text.trim() || coach.isPending}
          onClick={submit}
          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm px-3 py-1.5"
        >
          {coach.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Ask the mentor
        </button>
      </div>
      {resp && (
        <div className={`mt-3 rounded-md border-l-2 pl-3 py-2 ${resp.unsafe ? "border-l-red-500 bg-red-500/8" : "border-l-emerald-500/60 bg-[#0b110b]"}`} role="status">
          <div className="flex items-center gap-1.5 mb-1 text-[11px] font-mono uppercase tracking-wide text-[oklch(0.60_0.08_155)]">
            {resp.unsafe ? <ShieldAlert className="w-3 h-3 text-red-400" /> : <Wrench className="w-3 h-3" />} Mentor
          </div>
          <p className="text-sm text-gray-200 leading-relaxed">{resp.message}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className={`text-[10px] uppercase tracking-wide rounded border px-1.5 py-0.5 ${QUALITY_STYLE[resp.quality] ?? QUALITY_STYLE.unclear}`}>{resp.quality} communication</span>
            {resp.recorded && <span className="inline-flex items-center gap-1 text-[10px] text-gray-600"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> recorded to your competency</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LessonReflection({
  lessonTitle,
  domain,
  closeout,
}: {
  lessonTitle: string;
  domain: string;
  closeout: LessonCloseout;
}) {
  // Scenario-specific closeout blocks — never generic reflection prompts.
  const blocks: { mode: MentorMode; title: string; placeholder: string }[] = [
    { mode: "reflection", title: "1. What happened — and what did you verify vs. assume?", placeholder: closeout.prompts.reflection },
    { mode: "operator_communication", title: "2. Explain it to the operator", placeholder: closeout.prompts.operator },
    { mode: "work_order", title: "3. Write the work order note", placeholder: closeout.prompts.workOrder },
    { mode: "shift_handoff", title: "4. Hand off to the next shift", placeholder: closeout.prompts.handoff },
  ];

  return (
    <div className="mt-6 rounded-xl border border-emerald-500/25 bg-[#0b110b] p-5">
      <div className="flex items-center gap-2 mb-1">
        <Wrench className="w-5 h-5 text-emerald-400" />
        <h3 className="text-lg font-bold text-white">Close the ticket</h3>
      </div>
      <p className="text-gray-400 text-sm mb-3">{closeout.introLine} You're not finished when the machine runs; you're finished when the next person understands what happened.</p>
      <p className="text-[11px] text-gray-600 mb-4">Each response generates competency evidence. Your manager sees readiness update on the Manager Dashboard.</p>
      <div className="space-y-3">
        {blocks.map((b) => (
          <ReflectionBlock key={b.mode} lessonTitle={lessonTitle} domain={domain} mode={b.mode} title={b.title} placeholder={b.placeholder} scenarioTag={closeout.scenarioTag} />
        ))}
      </div>
    </div>
  );
}
