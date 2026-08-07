/**
 * OnboardingStart — "Your first step is ready" page.
 * Shows after onboarding wizard completes. Displays:
 * - Assigned path name
 * - First lesson title + estimated time + why it matters
 * - Start First Lesson button that launches the actual lesson
 */
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import SEO from "@/components/SEO";

export default function OnboardingStart() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const { data: pathData, isLoading } = trpc.onboarding.getMyPath.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const trackEvent = trpc.onboarding.trackEvent.useMutation();

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.55_0.12_155)]" />
      </div>
    );
  }

  if (!pathData) {
    // No path assigned — redirect to dashboard
    navigate("/dashboard");
    return null;
  }

  const { path, firstLesson, totalLessons, modules } = pathData;

  const handleStartLesson = () => {
    trackEvent.mutate({ event: "first_lesson_launched", meta: { moduleSlug: firstLesson.moduleSlug, lessonSlug: firstLesson.lessonSlug } });
    navigate(`/courses/${firstLesson.moduleSlug}/${firstLesson.lessonSlug}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white flex flex-col items-center justify-center px-4 py-8">
      <SEO title="Your Path is Ready — EASLearn" description="Your personalized training path has been created." path="/onboarding/start" />

      <div className="max-w-md w-full">
        {/* Success indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[oklch(0.55_0.12_155/12%)] border border-[oklch(0.55_0.12_155/30%)] flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-[oklch(0.55_0.12_155)]" />
          </div>
        </div>

        {/* Path assigned */}
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-wider text-[oklch(0.55_0.12_155)] font-mono mb-2">
            Your path
          </p>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">{path.label}</h1>
          <p className="text-sm text-zinc-400">{path.description}</p>
          <p className="text-xs text-zinc-600 mt-2">
            {modules.length} modules · {totalLessons} lessons
          </p>
        </div>

        {/* First lesson card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 mb-6">
          <p className="text-xs uppercase tracking-wider text-[oklch(0.55_0.12_155)] font-mono mb-3">
            Your first step is ready
          </p>
          <h2 className="text-lg font-semibold mb-1">{firstLesson.title}</h2>
          <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~{firstLesson.estimatedMinutes} min</span>
            <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Lesson</span>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">{firstLesson.why}</p>
        </div>

        {/* CTA */}
        <Button
          onClick={handleStartLesson}
          className="w-full bg-[oklch(0.55_0.12_155)] hover:bg-[oklch(0.50_0.12_155)] text-white py-6 text-base font-semibold"
        >
          Start First Lesson <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        {/* Secondary */}
        <button
          onClick={() => navigate("/learn")}
          className="w-full mt-3 text-xs text-zinc-600 hover:text-zinc-400 transition-colors text-center py-2"
        >
          I'll start later — take me to my home screen
        </button>
      </div>
    </div>
  );
}
