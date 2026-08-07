/**
 * LearnerHome — beginner-friendly home screen for authenticated learners.
 * Primary card: CONTINUE YOUR PATH (current path, lesson, progress, next activity).
 * Secondary: Practice, Recently completed, Skills earned.
 * Returning users see "Continue where you left off" — never the wizard again.
 * Role routing: leaders → /manager, no-onboarding → /onboarding.
 */
import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowRight, BookOpen, Zap, Award, Clock, Target, BarChart3 } from "lucide-react";
import SEO from "@/components/SEO";

export default function LearnerHome() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const { data: pathData, isLoading: pathLoading } = trpc.onboarding.getMyPath.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: onboardingStatus } = trpc.auth.getOnboardingStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Role-specific routing
  useEffect(() => {
    if (authLoading || pathLoading) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    // If onboarding not completed, redirect to wizard
    if (onboardingStatus && !onboardingStatus.completed) {
      navigate("/onboarding");
      return;
    }
    // If leader persona, redirect to manager
    if (onboardingStatus?.selections?.persona === "leader") {
      navigate("/manager");
      return;
    }
  }, [authLoading, pathLoading, isAuthenticated, onboardingStatus, navigate]);

  if (authLoading || pathLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.55_0.12_155)]" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white">
      <SEO title="My Training — EASLearn" description="Continue your training path" path="/learn" />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">
            {pathData ? "Continue where you left off" : `Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {pathData ? `${pathData.path.label} · ${pathData.percentComplete}% complete` : "Your training dashboard"}
          </p>
        </div>

        {/* Primary: Continue Your Path */}
        {pathData && !pathData.isComplete && (
          <Card className="bg-zinc-900/80 border-zinc-800 mb-6">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
                <span className="text-xs uppercase tracking-wider text-[oklch(0.55_0.12_155)] font-mono font-semibold">
                  Continue Your Path
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-zinc-800 rounded-full mb-4">
                <div
                  className="h-full bg-[oklch(0.55_0.12_155)] rounded-full transition-all"
                  style={{ width: `${pathData.percentComplete}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-500 mb-5">
                <span>{pathData.totalCompleted} of {pathData.totalLessons} lessons</span>
                <span>{pathData.percentComplete}%</span>
              </div>

              {/* Current module */}
              {pathData.currentModule && (
                <div className="mb-4">
                  <p className="text-xs text-zinc-500 mb-1">Current module</p>
                  <p className="text-sm font-medium">{pathData.currentModule.title}</p>
                </div>
              )}

              {/* Next lesson */}
              {pathData.nextLesson && (
                <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
                  <p className="text-xs text-zinc-500 mb-1">Next up</p>
                  <p className="text-sm font-medium mb-2">{pathData.nextLesson.title}</p>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~10 min</span>
                    <BookOpen className="w-3.5 h-3.5 ml-2" />
                    <span>Lesson</span>
                  </div>
                </div>
              )}

              {/* CTA */}
              {pathData.nextLesson && (
                <Link href={`/courses/${pathData.nextLesson.moduleSlug}/${pathData.nextLesson.slug}`}>
                  <Button className="w-full bg-[oklch(0.55_0.12_155)] hover:bg-[oklch(0.50_0.12_155)] text-white py-5">
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Path complete state */}
        {pathData?.isComplete && (
          <Card className="bg-zinc-900/80 border-[oklch(0.55_0.12_155/30%)] mb-6">
            <CardContent className="p-5 text-center">
              <Award className="w-10 h-10 text-[oklch(0.55_0.12_155)] mx-auto mb-3" />
              <h2 className="text-lg font-bold mb-1">Path Complete</h2>
              <p className="text-sm text-zinc-400 mb-4">
                You've completed all {pathData.totalLessons} lessons in {pathData.path.label}.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/labs">
                  <Button variant="outline" className="border-zinc-700 text-zinc-300">
                    Practice Labs
                  </Button>
                </Link>
                <Link href="/skills-passport">
                  <Button className="bg-[oklch(0.55_0.12_155)] text-white">
                    View Skills Passport
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No path assigned — honest recovery state */}
        {!pathData && (
          <Card className="bg-zinc-900/80 border-amber-500/20 mb-6">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold">Let's finish setting up your learning path.</h2>
              </div>
              <p className="text-sm text-zinc-400 mb-4">
                Answer 3 quick questions about your experience and goals, and we'll build a training sequence just for you.
              </p>
              <Link href="/onboarding">
                <Button className="w-full bg-[oklch(0.55_0.12_155)] hover:bg-[oklch(0.50_0.12_155)] text-white py-5">
                  Set Up My Path <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <p className="text-xs text-zinc-600 mt-3 text-center">
                Or <Link href="/courses" className="text-zinc-400 underline">explore all courses</Link> on your own.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Secondary sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Practice */}
          <Link href="/labs">
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium">Practice</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Hands-on troubleshooting labs and simulators
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Skills Passport */}
          <Link href="/skills-passport">
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
                  <span className="text-sm font-medium">Skills Passport</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Your demonstrated skills and readiness
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Explore */}
          <Link href="/courses">
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  <span className="text-sm font-medium">Explore Courses</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Browse all available training modules
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Progress */}
          <Link href="/dashboard">
            <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer h-full">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium">Full Dashboard</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Detailed progress, stats, and leaderboard
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Retake onboarding option */}
        {onboardingStatus?.completed && (
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate("/onboarding")}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Retake onboarding quiz to change your path
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
