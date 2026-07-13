/**
 * Review Queue — Competency Durability Surface
 *
 * This is the learner-facing queue for the spaced repetition scheduler.
 * Unlike /review (concept-level quiz cards), this shows broader review items:
 * fault retries, simulation repeats, communication practice, safety rechecks.
 *
 * Each item shows WHY it was assigned, what to do, and links to the relevant
 * activity. Priority is color-coded (safety-critical items are red).
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  Flame,
  Loader2,
  Lock,
  RefreshCcw,
  Shield,
  Zap,
} from "lucide-react";
import SEO from "@/components/SEO";

const PRIORITY_CONFIG = {
  critical: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: AlertTriangle, label: "Safety Critical" },
  high: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", icon: Flame, label: "High Priority" },
  medium: { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", icon: Brain, label: "Medium" },
  low: { color: "text-gray-400", bg: "bg-gray-500/10 border-gray-700", icon: Clock, label: "Low" },
} as const;

const ITEM_TYPE_LABELS: Record<string, { label: string; action: string; icon: typeof Brain }> = {
  retry_fault: { label: "Retry Fault Diagnosis", action: "Diagnose again", icon: Zap },
  review_concept: { label: "Review Concept", action: "Review", icon: Brain },
  repeat_simulation: { label: "Repeat Simulation", action: "Run again", icon: RefreshCcw },
  explain_fault: { label: "Explain Root Cause", action: "Explain", icon: Brain },
  practice_work_order: { label: "Practice Work Order", action: "Write work order", icon: Brain },
  practice_communication: { label: "Practice Communication", action: "Practice", icon: Brain },
  review_safety: { label: "Safety Review", action: "Review safety", icon: Shield },
  review_reasoning: { label: "Review Reasoning", action: "Review method", icon: Brain },
};

/**
 * Where a review item sends the learner to actually DO the review — closes the
 * loop instead of only self-reporting. Conveyor-fault items reopen the lab scoped
 * to that exact fault; concept/reasoning items go to concept review; the rest to
 * the simulator.
 */
function reviewTargetRoute(item: { sourceId?: string | null; itemType: string }): string {
  const sourceId = item.sourceId ?? "";
  if (sourceId.startsWith("conveyor-fault:")) {
    const fault = sourceId.slice("conveyor-fault:".length);
    return `/labs?faultScope=${encodeURIComponent(fault)}&mode=practice#conveyor-troubleshoot`;
  }
  switch (item.itemType) {
    case "review_concept":
    case "review_reasoning":
    case "review_safety":
      return "/review";
    default:
      return "/simulator";
  }
}

export default function ReviewQueue() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());

  const stats = trpc.scheduler.stats.useQuery(undefined, { enabled: isAuthenticated });
  const dueItems = trpc.scheduler.getDueItems.useQuery({ limit: 20 }, { enabled: isAuthenticated });
  // Unify the two spaced-repetition surfaces: the skill/activity scheduler AND
  // per-question concept recall both live in this one queue so the learner has a
  // single place to strengthen weak spots.
  const conceptStats = trpc.review.stats.useQuery(undefined, { enabled: isAuthenticated });
  const submitReview = trpc.scheduler.submitReview.useMutation({
    onSuccess: () => {
      dueItems.refetch();
      stats.refetch();
    },
  });

  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] text-white flex items-center justify-center p-6">
        <div className="text-center">
          <Lock className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">Sign in to access your review queue.</p>
          <button onClick={() => navigate("/login")} className="rounded bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm">Sign in</button>
        </div>
      </div>
    );
  }

  const items = (dueItems.data ?? []).filter(item => !completedIds.has(item.id));

  const handleComplete = (id: number, passed: boolean) => {
    submitReview.mutate({ reviewId: id, passed });
    setCompletedIds(prev => { const next = new Set(Array.from(prev)); next.add(id); return next; });
  };

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white">
      <SEO title="Review Queue" description="Strengthen weak skills with targeted review" path="/review-queue" />
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Brain className="w-5 h-5 text-emerald-400" /> Review Queue
          </h1>
          {stats.data && (
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {stats.data.criticalDue > 0 && (
                <span className="text-red-400 font-semibold">{stats.data.criticalDue} safety</span>
              )}
              <span>{stats.data.dueToday} due</span>
              <span>{stats.data.completed} mastered</span>
            </div>
          )}
        </div>

        {/* Explanation */}
        <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-4 mb-6">
          <p className="text-sm text-gray-400 leading-relaxed">
            These items were assigned because you struggled with specific skills during diagnostics, simulations, or mentor sessions.
            Completing them builds <span className="text-emerald-400 font-medium">durable competency</span> — proving you can still perform under pressure weeks later.
          </p>
        </div>

        {/* Concept recall (the other spaced-repetition surface), unified into this queue */}
        {(conceptStats.data?.dueToday ?? 0) > 0 && (
          <button
            onClick={() => navigate("/review")}
            className="w-full text-left rounded-lg border border-emerald-800/50 bg-emerald-950/20 p-4 mb-4 flex items-center justify-between hover:border-emerald-600 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-sm text-white font-medium">Concept recall</div>
                <div className="text-xs text-gray-400">
                  {conceptStats.data!.dueToday} question{conceptStats.data!.dueToday === 1 ? "" : "s"} due for spaced recall
                </div>
              </div>
            </div>
            <span className="text-emerald-400 text-sm inline-flex items-center gap-1 shrink-0">
              Review <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        )}

        {/* Loading */}
        {dueItems.isLoading ? (
          <div className="flex items-center gap-2 text-gray-500 py-8">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading review queue…
          </div>
        ) : items.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-gray-300 font-semibold mb-1">Queue clear.</p>
            <p className="text-gray-500 text-sm mb-5">
              No reviews due right now. Keep diagnosing faults — the scheduler will assign reviews when it detects weak spots.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => navigate("/review")} className="inline-flex items-center gap-1.5 text-emerald-400 text-sm hover:underline">
                Concept Review <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => navigate("/simulator")} className="inline-flex items-center gap-1.5 text-emerald-400 text-sm hover:underline">
                Diagnose a Fault <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Review items list */
          <div className="space-y-3">
            {items.map(item => {
              const priority = PRIORITY_CONFIG[item.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium;
              const typeInfo = ITEM_TYPE_LABELS[item.itemType] ?? ITEM_TYPE_LABELS.review_concept;
              const PriorityIcon = priority.icon;
              const dueDate = new Date(item.dueAt);
              const isOverdue = dueDate < new Date(Date.now() - 24 * 60 * 60 * 1000);

              return (
                <div key={item.id} className={`rounded-xl border p-4 transition-all ${priority.bg}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Priority badge + type */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <PriorityIcon className={`w-3.5 h-3.5 ${priority.color}`} />
                        <span className={`text-xs font-medium ${priority.color}`}>{priority.label}</span>
                        {isOverdue && <span className="text-xs text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded">Overdue</span>}
                        {item.lapses > 0 && <span className="text-xs text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">{item.lapses} lapse{item.lapses > 1 ? "s" : ""}</span>}
                      </div>

                      {/* Source label */}
                      <h3 className="text-white font-medium text-sm truncate">{item.sourceLabel}</h3>

                      {/* Reason detail */}
                      <p className="text-gray-400 text-xs mt-1 leading-relaxed">{item.reasonDetail}</p>

                      {/* Domain + skill */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{item.domain}</span>
                        {item.skill && <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{item.skill}</span>}
                        <span className="text-xs text-gray-600">{typeInfo.label}</span>
                      </div>
                    </div>

                    {/* Action buttons — Start launches the real activity; the
                        self-report buttons update SM-2 state after. */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => navigate(reviewTargetRoute(item))}
                        className="rounded bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-medium transition-colors inline-flex items-center justify-center gap-1"
                      >
                        {typeInfo.action} <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleComplete(item.id, true)}
                        disabled={submitReview.isPending}
                        className="rounded border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/30 px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        Mark Done
                      </button>
                      <button
                        onClick={() => handleComplete(item.id, false)}
                        disabled={submitReview.isPending}
                        className="rounded bg-gray-700 hover:bg-gray-600 px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        Still Weak
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer nav */}
        <div className="mt-8 pt-4 border-t border-gray-800 flex items-center justify-between">
          <button onClick={() => navigate("/review")} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
            ← Concept Review
          </button>
          <button onClick={() => navigate("/dashboard")} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
            Dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}
