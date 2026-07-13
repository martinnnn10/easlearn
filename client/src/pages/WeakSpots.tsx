/**
 * My Weak Spots — aggregates knowledge check failures across all lessons
 * Shows which topics the learner consistently gets wrong with direct links back to relevant cards
 */
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, AlertTriangle, CheckCircle, BookOpen, RefreshCw, Target } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import SEO from "@/components/SEO";
import { getLoginUrl } from "@/const";

export default function WeakSpots() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data, isLoading } = trpc.lessonAssessment.getWeakSpots.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[oklch(0.05_0.003_250)] flex items-center justify-center">
        <div className="animate-pulse text-[oklch(0.45_0.006_250)]">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[oklch(0.05_0.003_250)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Target className="w-12 h-12 text-[oklch(0.55_0.12_30)] mx-auto" />
          <h2 className="text-xl font-bold text-white">Sign in to view your weak spots</h2>
          <p className="text-[oklch(0.55_0.008_250)]">Track your progress and identify areas for improvement.</p>
          <a href={getLoginUrl()} className="inline-block px-6 py-2 rounded-lg bg-[oklch(0.45_0.12_155)] text-white font-medium hover:bg-[oklch(0.50_0.12_155)] transition-colors">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  const weakSpots = data?.weakSpots ?? [];
  const totalFailures = data?.totalFailures ?? 0;
  const unresolvedCount = weakSpots.filter((s) => !s.resolved).length;
  const resolvedCount = weakSpots.filter((s) => s.resolved).length;

  return (
    <>
      <SEO title="My Weak Spots" description="Topics you need to review based on assessment performance" />
      <div className="min-h-screen bg-[oklch(0.05_0.003_250)]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-[oklch(0.55_0.12_155)] hover:text-[oklch(0.65_0.12_155)] mb-4">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight">My Weak Spots</h1>
            <p className="text-[oklch(0.55_0.008_250)] mt-1">
              Topics where you've struggled on knowledge checks — review these to strengthen your understanding.
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-lg border border-[oklch(0.15_0.004_250)] bg-[oklch(0.08_0.003_250)] p-4">
              <div className="text-2xl font-bold text-[oklch(0.55_0.12_30)]">{unresolvedCount}</div>
              <div className="text-xs text-[oklch(0.45_0.006_250)] mt-1">Needs Review</div>
            </div>
            <div className="rounded-lg border border-[oklch(0.15_0.004_250)] bg-[oklch(0.08_0.003_250)] p-4">
              <div className="text-2xl font-bold text-[oklch(0.55_0.12_155)]">{resolvedCount}</div>
              <div className="text-xs text-[oklch(0.45_0.006_250)] mt-1">Resolved</div>
            </div>
            <div className="rounded-lg border border-[oklch(0.15_0.004_250)] bg-[oklch(0.08_0.003_250)] p-4">
              <div className="text-2xl font-bold text-white">{totalFailures}</div>
              <div className="text-xs text-[oklch(0.45_0.006_250)] mt-1">Total Failures</div>
            </div>
          </div>

          {/* Empty State */}
          {weakSpots.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 rounded-lg border border-[oklch(0.15_0.004_250)] bg-[oklch(0.08_0.003_250)]"
            >
              <CheckCircle className="w-12 h-12 text-[oklch(0.55_0.12_155)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No weak spots yet</h3>
              <p className="text-[oklch(0.55_0.008_250)] max-w-md mx-auto">
                Complete knowledge checks in your lessons. Any topics you struggle with will appear here so you can review them.
              </p>
              <Link href="/courses" className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg bg-[oklch(0.45_0.12_155)] text-white text-sm font-medium hover:bg-[oklch(0.50_0.12_155)] transition-colors">
                <BookOpen className="w-4 h-4" /> Browse Courses
              </Link>
            </motion.div>
          )}

          {/* Weak Spots List */}
          {weakSpots.length > 0 && (
            <div className="space-y-3">
              {weakSpots.map((spot, idx) => (
                <motion.div
                  key={`${spot.lessonId}-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    href={`/courses/${spot.moduleSlug}/${spot.lessonSlug}`}
                    className={`block rounded-lg border p-4 transition-all hover:border-[oklch(0.55_0.12_155/40%)] ${
                      spot.resolved
                        ? "border-[oklch(0.15_0.004_250)] bg-[oklch(0.07_0.003_250)] opacity-70"
                        : "border-[oklch(0.55_0.12_30/30%)] bg-[oklch(0.08_0.003_250)]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 shrink-0 ${spot.resolved ? "text-[oklch(0.55_0.12_155)]" : "text-[oklch(0.55_0.12_30)]"}`}>
                        {spot.resolved ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-medium text-white">{spot.lessonTitle}</h3>
                          {spot.resolved && (
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[oklch(0.55_0.12_155/10%)] text-[oklch(0.55_0.12_155)] border border-[oklch(0.55_0.12_155/20%)]">
                              Resolved
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[oklch(0.45_0.006_250)] mt-0.5">{spot.moduleTitle}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-[oklch(0.45_0.006_250)]">
                          <span className="flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" />
                            {spot.failureCount} {spot.failureCount === 1 ? "failure" : "failures"}
                          </span>
                          <span>
                            {spot.assessmentTypes.includes("knowledge_check") && "Knowledge Check"}
                            {spot.assessmentTypes.includes("lesson_quiz") && spot.assessmentTypes.includes("knowledge_check") && " + "}
                            {spot.assessmentTypes.includes("lesson_quiz") && "Lesson Quiz"}
                          </span>
                          <span>
                            Last: {new Date(spot.lastFailed).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
