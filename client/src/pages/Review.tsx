/**
 * Daily Review — the spaced-repetition retention surface (Mission model step 6).
 *
 * Pulls concepts due today, quizzes them one at a time with instant feedback, and
 * reschedules each via SM-2. This is the habit that turns "I watched it once" into
 * durable competence — the Duolingo daily-review loop, for industrial faults.
 */
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Brain, CheckCircle2, XCircle, Loader2, Lock, Sparkles, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";

export default function Review() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const backfill = trpc.review.backfill.useMutation();
  const stats = trpc.review.stats.useQuery(undefined, { enabled: isAuthenticated });
  const due = trpc.review.getDue.useQuery({ limit: 15 }, { enabled: isAuthenticated });
  const submit = trpc.review.submit.useMutation();

  // Idempotently enroll concepts from passed lessons on first load.
  useEffect(() => {
    if (isAuthenticated) backfill.mutateAsync().then(() => due.refetch()).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const items = due.data ?? [];
  const current = items[i];
  const options = useMemo(() => {
    const raw = (current?.options ?? []) as unknown;
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [current]);

  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] text-white flex items-center justify-center p-6">
        <div className="text-center">
          <Lock className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">Sign in to review what you've learned.</p>
          <button onClick={() => navigate("/login")} className="rounded bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm">Sign in</button>
        </div>
      </div>
    );
  }

  const answer = (idx: number) => {
    if (picked !== null || !current) return;
    setPicked(idx);
    const correct = idx === current.correctIndex;
    if (correct) setCorrectCount(c => c + 1);
    submit.mutate({ reviewId: current.reviewId, correct });
  };

  const next = () => {
    setPicked(null);
    setI(n => n + 1);
  };

  const done = items.length > 0 && i >= items.length;

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white">
      <SEO title="Daily Review" description="Lock in what you've learned with spaced repetition" path="/review" />
      <div className="max-w-xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold flex items-center gap-2"><Brain className="w-5 h-5 text-emerald-400" /> Daily Review</h1>
          {stats.data && (
            <span className="text-xs text-gray-500">{stats.data.dueToday} due · {stats.data.mastered} mastered</span>
          )}
        </div>

        {due.isLoading || backfill.isPending ? (
          <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading your review queue…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-gray-300 font-semibold mb-1">All caught up.</p>
            <p className="text-gray-500 text-sm mb-5">Nothing due right now. Complete a Mission to add concepts to your review queue.</p>
            <button onClick={() => navigate("/daily")} className="inline-flex items-center gap-1.5 text-emerald-400 text-sm hover:underline">
              Try today's Fault of the Day <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : done ? (
          <div className="text-center py-16">
            <Sparkles className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-2xl font-bold mb-1">{correctCount}/{items.length}</p>
            <p className="text-gray-400 text-sm mb-5">Review complete. Concepts you missed will come back sooner; the ones you nailed stretch out.</p>
            <button onClick={() => navigate("/dashboard")} className="rounded bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-sm font-semibold">Done</button>
          </div>
        ) : current ? (
          <div>
            <div className="h-2 rounded-full bg-gray-800 overflow-hidden mb-6">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(i / items.length) * 100}%` }} />
            </div>
            <div className="rounded-xl border border-gray-800 bg-[#0d120d] p-6">
              <p className="text-white text-lg font-medium mb-5">{current.question}</p>
              <div className="space-y-2">
                {options.map((opt, idx) => {
                  const isCorrect = idx === current.correctIndex;
                  const isPicked = picked === idx;
                  let cls = "border-gray-700 hover:border-emerald-500/50 hover:bg-gray-800/40";
                  if (picked !== null) {
                    if (isCorrect) cls = "border-emerald-500/60 bg-emerald-500/10 text-emerald-200";
                    else if (isPicked) cls = "border-red-500/60 bg-red-500/10 text-red-200";
                    else cls = "border-gray-800 text-gray-500";
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => answer(idx)}
                      disabled={picked !== null}
                      className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors flex items-center justify-between ${cls}`}
                    >
                      <span>{opt}</span>
                      {picked !== null && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {picked !== null && isPicked && !isCorrect && <XCircle className="w-4 h-4 text-red-400" />}
                    </button>
                  );
                })}
              </div>

              {picked !== null && current.explanation && (
                <div className="mt-4 rounded-lg bg-gray-800/40 border border-gray-700 p-3">
                  <p className="text-gray-300 text-sm leading-relaxed">{current.explanation}</p>
                </div>
              )}
              {picked !== null && (
                <button onClick={next} className="mt-4 w-full rounded bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-sm font-semibold">
                  {i + 1 >= items.length ? "Finish" : "Next"}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
