import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  AlertTriangle, ArrowRight, BookOpen, Award, Zap, Clock,
  TrendingUp, Shield, CheckCircle, Star, BarChart3, Target,
  Lock, Cpu, Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import SEO from "@/components/SEO";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function Upgrade() {
  const { user, isAuthenticated } = useAuth();
  const { trialExpired, trialStartAt, status, tier } = useSubscription();
  const [, navigate] = useLocation();

  const { data: modules } = trpc.courses.listModules.useQuery();
  const totalLessonCount =
    modules?.reduce((sum, m) => sum + (m.actualLessonCount ?? m.totalLessons ?? 0), 0) ?? 0;
  const { data: dashboard } = trpc.courses.getDashboard.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: myStats } = trpc.leaderboard.getMyStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: certProgress } = trpc.certification.getMyProgress.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createCheckout = trpc.stripe.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
  });

  // Calculate progress metrics for loss aversion
  const metrics = useMemo(() => {
    const lessonsCompleted = dashboard?.completedLessons || 0;
    const totalLessons = dashboard?.totalLessons || 0;
    const modulesStarted = dashboard?.modules?.filter((m: any) => m.completedCount > 0).length || 0;
    const modulesCompleted = dashboard?.modules?.filter((m: any) => m.percentage === 100).length || 0;
    const totalModules = dashboard?.modules?.length || 0;
    const certificates = dashboard?.certificates?.length || 0;
    const overallProgress = dashboard?.overallProgress || 0;
    const totalXP = myStats?.totalXP || 0;
    const quizzesPassed = myStats?.quizzesPassed || 0;
    const rank = myStats?.rank || 0;
    const certLevel = myStats?.certLevel || "none";
    const earnedCerts = certProgress?.earnedCertifications?.length || 0;

    // Estimate hours spent (rough: 15 min per lesson, 5 min per quiz)
    const hoursSpent = Math.round((lessonsCompleted * 15 + quizzesPassed * 5) / 60 * 10) / 10;

    return {
      lessonsCompleted,
      totalLessons,
      modulesStarted,
      modulesCompleted,
      totalModules,
      certificates,
      overallProgress,
      totalXP,
      quizzesPassed,
      rank,
      certLevel,
      earnedCerts,
      hoursSpent,
    };
  }, [dashboard, myStats, certProgress]);

  // Days since trial started
  const daysSinceStart = useMemo(() => {
    if (!trialStartAt) return 0;
    return Math.floor((Date.now() - trialStartAt) / (1000 * 60 * 60 * 24));
  }, [trialStartAt]);

  const handleSubscribe = (plan: "pro" | "proAnnual") => {
    createCheckout.mutate({ plan });
  };

  // If user has active subscription, redirect to dashboard
  if (status === "active" && tier !== "free") {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen py-12 sm:py-20 px-4">
      <SEO
        title="Continue Your Training"
        description="Don't lose your progress. Subscribe to keep learning."
        path="/upgrade"
      />

      <div className="container max-w-5xl">
        {/* ─── Hero Section ─── */}
        <motion.div {...fadeUp} className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading text-white tracking-wide mb-4">
            {trialExpired ? "Your Trial Has Ended" : "Unlock Full Access"}
          </h1>
          <p className="text-lg text-[oklch(0.60_0.008_250)] max-w-2xl mx-auto leading-relaxed">
            {metrics.lessonsCompleted > 0
              ? `You've already made real progress — ${metrics.lessonsCompleted} lessons completed, ${metrics.totalXP.toLocaleString()} XP earned. Don't let it go to waste.`
              : "Get unlimited access to all courses, simulators, labs, and certifications."}
          </p>
        </motion.div>

        {/* ─── Progress At Risk Section ─── */}
        {metrics.lessonsCompleted > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-12"
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-heading text-white flex items-center justify-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Your Progress at Risk
              </h2>
              <p className="text-sm text-[oklch(0.50_0.008_250)] mt-1">
                Everything you've built over the past {daysSinceStart} days
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Lessons */}
              <div className="bg-[oklch(0.12_0.004_250)] border border-[oklch(0.20_0.004_250)] rounded-xl p-5 text-center">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white">{metrics.lessonsCompleted}</div>
                <div className="text-xs text-[oklch(0.50_0.008_250)] mt-1">Lessons Completed</div>
                {metrics.totalLessons > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-[oklch(0.18_0.004_250)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${metrics.overallProgress}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-blue-400 mt-1">{metrics.overallProgress}% complete</div>
                  </div>
                )}
              </div>

              {/* XP */}
              <div className="bg-[oklch(0.12_0.004_250)] border border-[oklch(0.20_0.004_250)] rounded-xl p-5 text-center">
                <div className="w-10 h-10 rounded-lg bg-[oklch(0.55_0.12_155/10%)] border border-[oklch(0.55_0.12_155/20%)] flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-5 h-5 text-[oklch(0.55_0.12_155)]" />
                </div>
                <div className="text-2xl font-bold text-white">{metrics.totalXP.toLocaleString()}</div>
                <div className="text-xs text-[oklch(0.50_0.008_250)] mt-1">XP Earned</div>
                {metrics.rank > 0 && (
                  <div className="text-[10px] text-[oklch(0.55_0.12_155)] mt-2">
                    Rank #{metrics.rank} on leaderboard
                  </div>
                )}
              </div>

              {/* Quizzes */}
              <div className="bg-[oklch(0.12_0.004_250)] border border-[oklch(0.20_0.004_250)] rounded-xl p-5 text-center">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white">{metrics.quizzesPassed}</div>
                <div className="text-xs text-[oklch(0.50_0.008_250)] mt-1">Quizzes Passed</div>
              </div>

              {/* Time Invested */}
              <div className="bg-[oklch(0.12_0.004_250)] border border-[oklch(0.20_0.004_250)] rounded-xl p-5 text-center">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-white">{metrics.hoursSpent}h</div>
                <div className="text-xs text-[oklch(0.50_0.008_250)] mt-1">Hours Invested</div>
              </div>
            </div>

            {/* Modules in progress */}
            {metrics.modulesStarted > 0 && (
              <div className="mt-6 bg-[oklch(0.12_0.004_250)] border border-amber-500/15 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-200 font-medium">
                      You have {metrics.modulesStarted} module{metrics.modulesStarted !== 1 ? "s" : ""} in progress
                    </p>
                    <p className="text-xs text-[oklch(0.50_0.008_250)] mt-1">
                      {metrics.modulesCompleted > 0
                        ? `${metrics.modulesCompleted} completed, ${metrics.modulesStarted - metrics.modulesCompleted} still in progress. `
                        : ""}
                      Without a subscription, you'll lose access to continue where you left off.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Certifications at risk */}
            {metrics.earnedCerts > 0 && (
              <div className="mt-4 bg-[oklch(0.12_0.004_250)] border border-purple-500/15 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-purple-200 font-medium">
                      {metrics.earnedCerts} certification{metrics.earnedCerts !== 1 ? "s" : ""} earned
                    </p>
                    <p className="text-xs text-[oklch(0.50_0.008_250)] mt-1">
                      Your certifications remain valid, but you'll need a subscription to earn more and advance your career path.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Plan Selection ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-xl font-heading text-white text-center mb-8">
            Choose Your Plan
          </h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Pro Monthly */}
            <div className="bg-[oklch(0.12_0.004_250)] border border-[oklch(0.55_0.12_155/30%)] rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-[oklch(0.55_0.12_155)] text-white text-[10px] font-bold rounded-bl-lg">
                MOST POPULAR
              </div>
              <h3 className="text-lg font-heading text-white mb-1">Pro Technician</h3>
              <p className="text-sm text-[oklch(0.50_0.008_250)] mb-4">Full access for individual learners</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-bold text-white">$49</span>
                <span className="text-sm text-[oklch(0.50_0.008_250)]">/month</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {[
                  "All 12+ troubleshooting scenarios (growing monthly)",
                  `Full course library (${totalLessonCount} lessons)`,
                  "Interactive labs & simulators",
                  "Progress tracking & analytics",
                  "EAS Certification path",
                  "Completion certificates",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-[oklch(0.65_0.008_250)]">
                    <CheckCircle className="w-4 h-4 text-[oklch(0.55_0.12_155)] shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSubscribe("pro")}
                disabled={createCheckout.isPending}
                className="w-full bg-[oklch(0.55_0.12_155)] hover:bg-[oklch(0.60_0.12_155)] text-white font-semibold py-3"
              >
                {createCheckout.isPending ? "Processing..." : "Subscribe — $49/mo"}
              </Button>
            </div>

            {/* Pro Annual */}
            <div className="bg-[oklch(0.12_0.004_250)] border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-black text-[10px] font-bold rounded-bl-lg">
                SAVE $120/YR
              </div>
              <h3 className="text-lg font-heading text-white mb-1">Pro Annual</h3>
              <p className="text-sm text-[oklch(0.50_0.008_250)] mb-4">Same access, 2 months free</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-bold text-white">$39</span>
                <span className="text-sm text-[oklch(0.50_0.008_250)]">/month</span>
                <span className="text-xs text-amber-400 ml-2">billed annually</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {[
                  "Everything in Pro Monthly",
                  "Save $120/year (2 months free)",
                  "Priority access to new content",
                  "Annual commitment discount",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-[oklch(0.65_0.008_250)]">
                    <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSubscribe("proAnnual")}
                disabled={createCheckout.isPending}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3"
              >
                {createCheckout.isPending ? "Processing..." : "Subscribe — $468/yr"}
              </Button>
            </div>
          </div>

          {/* Team plan callout */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[oklch(0.50_0.008_250)]">
              Training a team?{" "}
              <Link href="/pricing" className="text-[oklch(0.55_0.12_155)] hover:underline">
                View Team plans starting at $29/seat/mo
              </Link>
            </p>
          </div>
        </motion.div>

        {/* ─── What You Get Section ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-12"
        >
          <h2 className="text-xl font-heading text-white text-center mb-8">
            What's Included
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Cpu, title: "12+ Troubleshooting Scenarios", desc: "Real plant-floor VFD, PLC, and motor control faults — growing monthly" },
              { icon: BookOpen, title: `${totalLessonCount} Training Lessons`, desc: "From fundamentals to advanced diagnostics" },
              { icon: Wrench, title: "Interactive Labs", desc: "VFD sandbox, relay simulator, circuit animator" },
              { icon: Award, title: "EAS Certifications", desc: "Apprentice → Master certification path" },
              { icon: BarChart3, title: "Progress Analytics", desc: "Track XP, rank, and skill development" },
              { icon: Shield, title: "Guided Troubleshooting", desc: "Step-by-step coaching for every scenario" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-[oklch(0.12_0.004_250)] border border-[oklch(0.20_0.004_250)] rounded-xl p-5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[oklch(0.55_0.12_155/8%)] border border-[oklch(0.55_0.12_155/15%)] flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-[oklch(0.55_0.12_155)]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{title}</h3>
                  <p className="text-xs text-[oklch(0.50_0.008_250)] mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── Trust / FAQ ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <div className="bg-[oklch(0.12_0.004_250)] border border-[oklch(0.20_0.004_250)] rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-lg font-heading text-white mb-4">Frequently Asked</h3>
            <div className="space-y-4 text-left">
              <div>
                <p className="text-sm font-medium text-white">Will I keep my progress?</p>
                <p className="text-xs text-[oklch(0.50_0.008_250)] mt-1">
                  Yes. All your completed lessons, quiz scores, XP, and certifications are saved permanently. Subscribing instantly restores full access.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Can I cancel anytime?</p>
                <p className="text-xs text-[oklch(0.50_0.008_250)] mt-1">
                  Absolutely. Cancel anytime from your Account page. You'll keep access until the end of your billing period.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Is there a money-back guarantee?</p>
                <p className="text-xs text-[oklch(0.50_0.008_250)] mt-1">
                  Contact us within 14 days of subscribing for a full refund, no questions asked.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
