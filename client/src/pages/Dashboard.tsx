import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "wouter";
import {
  BookOpen, Award, ArrowRight, CheckCircle, Zap, TrendingUp,
  Cpu, Wrench, Settings, Gauge, AlignCenter, Shield, Star, Crown,
  Trophy, Target, Clock, Bookmark, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useAnalytics } from "@/hooks/useAnalytics";
import SEO from "@/components/SEO";
import LeaderboardPanel from "@/components/LeaderboardPanel";
import { WeeklyDigestCard } from "@/components/WeeklyDigestCard";
import SavedLessonsPanel from "@/components/SavedLessonsPanel";
import SimulatorCareerPanel from "@/components/SimulatorCareerPanel";
import { useSubscription } from "@/hooks/useSubscription";
import StreakCard from "@/components/StreakCard";
import OnboardingWizard from "@/components/OnboardingWizard";
import PendingResultWelcome from "@/components/PendingResultWelcome";
import MyAssignments from "@/components/MyAssignments";
import ContinueLearning from "@/components/ContinueLearning";
import Achievements from "@/components/Achievements";
import PersonalizedRecommendations from "@/components/PersonalizedRecommendations";
import RecommendedNextStep from "@/components/RecommendedNextStep";
import { pluralize } from "@/lib/pluralize";


const iconMap: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-5 h-5" />,
  Cpu: <Cpu className="w-5 h-5" />,
  Wrench: <Wrench className="w-5 h-5" />,
  Settings: <Settings className="w-5 h-5" />,
  Gauge: <Gauge className="w-5 h-5" />,
  AlignCenter: <AlignCenter className="w-5 h-5" />,
  Shield: <Shield className="w-5 h-5" />,
};

const rankConfig = {
  none: { label: "Unranked", icon: Target, color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20", glow: "" },
  apprentice: { label: "Apprentice", icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", glow: "shadow-emerald-500/5" },
  journeyman: { label: "Journeyman", icon: Star, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", glow: "shadow-blue-500/5" },
  specialist: { label: "Specialist", icon: Award, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", glow: "shadow-purple-500/5" },
  master: { label: "Master", icon: Crown, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", glow: "shadow-amber-500/5" },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { isTrial, trialDaysRemaining, trialEndsAt, status, tier, hasAccess } = useSubscription();
  const { data: dashboard, isLoading } = trpc.courses.getDashboard.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: certProgress } = trpc.certification.getMyProgress.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  // Server-side onboarding persistence (with localStorage fallback)
  const { data: onboardingStatus } = trpc.auth.getOnboardingStatus.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const completeOnboardingMutation = trpc.auth.completeOnboarding.useMutation();
  const { trackOnboardingCompleted } = useAnalytics();
  const [localDismissed, setLocalDismissed] = useState(
    () => localStorage.getItem('eas-onboarding-dismissed') === 'true'
  );
  const showOnboarding = !localDismissed && onboardingStatus?.completed === false;
  // Server-side XP (includes lessons + quizzes + scenarios + labs)
  const { data: myStats } = trpc.leaderboard.getMyStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[oklch(0.55_0.12_155)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[oklch(0.50_0.008_250)] font-mono">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <motion.div {...fadeUp} className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-[oklch(0.55_0.12_155/10%)] border border-[oklch(0.55_0.12_155/25%)] flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-8 h-8 text-[oklch(0.55_0.12_155)]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading text-white mb-3">Your Training Dashboard</h1>
          <p className="text-[oklch(0.60_0.008_250)] mb-8 leading-relaxed">
            Track progress, earn certifications, and compete on the leaderboard. Sign in to access your personalized training experience.
          </p>
          <a href="/login" className="inline-flex items-center gap-2 px-8 py-3.5 btn-primary text-sm font-semibold rounded-lg shadow-lg shadow-[oklch(0.55_0.12_155/15%)]">
            Sign In to Continue
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    );
  }

  if (isLoading || !dashboard) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[oklch(0.55_0.12_155)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[oklch(0.50_0.008_250)] font-mono">Loading your progress...</span>
        </div>
      </div>
    );
  }

  // Determine current rank from certifications
  const earnedLevels = certProgress?.earnedCertifications?.map((c: any) => c.level) || [];
  const currentRank = earnedLevels.includes("master") ? "master"
    : earnedLevels.includes("specialist") ? "specialist"
    : earnedLevels.includes("journeyman") ? "journeyman"
    : earnedLevels.includes("apprentice") ? "apprentice"
    : "none";
  const rank = rankConfig[currentRank];
  const RankIcon = rank.icon;

  // Use server-side XP (includes lessons + quizzes*2 + scenarios*25)
  // Fallback to 0 if myStats hasn't loaded yet — avoids stale formula mismatch
  const totalXP = myStats?.totalXP ?? 0;

  // Next rank threshold (based on lesson completion milestones)
  // Apprentice: ~10 lessons (500 XP), Journeyman: ~30 lessons (1500 XP), Specialist: ~50 lessons (2500 XP), Master: ~80 lessons (4000 XP)
  const xpThresholds = { none: 500, apprentice: 1500, journeyman: 2500, specialist: 4000, master: 99999 };
  const nextThreshold = xpThresholds[currentRank];
  const xpProgress = Math.min((totalXP / nextThreshold) * 100, 100);

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-0">
      <SEO
        title="My Progress Dashboard"
        description="Track your training progress across all course modules."
        path="/dashboard"
      />
      <div className="container max-w-6xl">
        {/* Claims the result earned during anonymous play — keeps the "save your result" promise */}
        <PendingResultWelcome />
        {/* Manager-assigned training with due dates + progress */}
        <MyAssignments />
        {/* ─── Onboarding Wizard for New Users ─── */}
        {showOnboarding && dashboard.completedLessons === 0 && (
          <OnboardingWizard
            userName={user?.name || ''}
            onDismiss={(selections) => {
              localStorage.setItem('eas-onboarding-dismissed', 'true');
              setLocalDismissed(true);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              completeOnboardingMutation.mutate(selections as any);
              trackOnboardingCompleted({
                experienceLevel: selections?.experienceLevel || 'unknown',
                goalCount: selections?.goals?.length || 0,
                equipmentCount: selections?.equipment?.length || 0,
                skipped: selections?.skipped ?? false,
              });
            }}
          />
        )}
        {/* ─── Continue Learning ─── */}
        {/* Only show localStorage-based ContinueLearning when server has no nextLesson (avoids inconsistency) */}
        {dashboard.completedLessons > 0 && !dashboard.nextLesson && <ContinueLearning />}

        {/* ─── Personalized Recommendations (from onboarding) ─── */}
        <PersonalizedRecommendations />

        {/* ─── Recommended Next Step (server-driven) ─── */}
        {!showOnboarding && <RecommendedNextStep />}

        {/* ─── Control Room Header ─── */}
        <motion.div {...fadeUp} className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="status-dot status-dot-green" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-[oklch(0.45_0.006_250)]">System Online &middot; {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading text-white tracking-wide mb-1">
                Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
              </h1>
              <p className="text-sm sm:text-base text-[oklch(0.55_0.008_250)]">
                Your training progress and performance overview.
              </p>
              {isTrial && trialDaysRemaining !== null && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[oklch(0.55_0.12_155/8%)] border border-[oklch(0.55_0.12_155/20%)]">
                  <Clock className="w-3.5 h-3.5 text-[oklch(0.55_0.12_155)]" />
                  <span className="text-xs font-mono text-[oklch(0.65_0.10_155)]">
                    {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left in trial
                  </span>
                  <Link href="/pricing" className="text-xs text-[oklch(0.55_0.12_155)] hover:underline font-medium ml-1">
                    Subscribe
                  </Link>
                </div>
              )}
            </div>
            {/* Rank Badge */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-xl ${rank.bg} border ${rank.border} shadow-lg ${rank.glow}`}
            >
              <RankIcon className={`w-7 h-7 ${rank.color}`} />
              <div>
                <div className={`text-sm font-bold ${rank.color}`}>{rank.label}</div>
                <div className="text-xs text-gray-400 font-mono">{totalXP.toLocaleString()} XP</div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* ─── XP Progress Bar ─── */}
        {currentRank !== "master" && (
          <motion.div
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="mb-8 p-5 rounded-xl border border-[oklch(0.16_0.004_250)] bg-[oklch(0.08_0.003_250)]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[oklch(0.50_0.008_250)] font-mono uppercase tracking-wider">Progress to Next Rank</span>
              <span className="text-xs text-[oklch(0.45_0.006_250)] font-mono">{totalXP.toLocaleString()} / {nextThreshold.toLocaleString()} XP</span>
            </div>
            <div className="h-2.5 rounded-full bg-[oklch(0.13_0.004_250)] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-[oklch(0.50_0.12_155)] to-[oklch(0.65_0.15_155)]"
              />
            </div>
            <div className="mt-2.5">
              <span className="text-[11px] text-[oklch(0.42_0.006_250)]">50 XP/lesson &middot; 25 XP/scenario &middot; Quiz bonus</span>
            </div>

            {/* Quick actions — clean, scannable, labeled */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-4">
              {[
                { href: "/daily", emoji: "⚡", label: "Fault of the Day", sub: "Today's challenge" },
                { href: "/review", emoji: "🧠", label: "Daily Review", sub: "Lock in skills" },
                { href: "/competency", emoji: "📊", label: "My Competency", sub: "What you can do" },
                { href: "/skills-passport", emoji: "🪪", label: "Skills Passport", sub: "Shareable proof" },
                { href: "/jobs", emoji: "💼", label: "Jobs", sub: "Matched to skill" },
                { href: "/certifications", emoji: "🏅", label: "Certifications", sub: "Your path" },
                { href: "/weak-spots", emoji: "🎯", label: "Weak Spots", sub: "What to review" },
                { href: "/manage", emoji: "👷", label: "Manager Hub", sub: "Run your team" },
              ].map((a) => (
                <Link key={a.href} href={a.href}>
                  <div className="group rounded-lg border border-[oklch(0.20_0.004_250)] bg-[oklch(0.13_0.004_250)] hover:border-[oklch(0.55_0.12_155/40%)] p-3 cursor-pointer transition-colors h-full">
                    <div className="text-lg mb-1">{a.emoji}</div>
                    <div className="text-[12px] font-medium text-white leading-tight">{a.label}</div>
                    <div className="text-[10px] text-[oklch(0.45_0.006_250)] mt-0.5">{a.sub}</div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── Stats Grid ─── */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8"
        >
          {[
            { icon: TrendingUp, label: "Progress", value: `${dashboard.overallProgress}%`, accent: false },
            { icon: CheckCircle, label: "Lessons", value: `${dashboard.completedLessons}`, sub: `/ ${dashboard.totalLessons}`, accent: false },
            { icon: Award, label: "Certificates", value: `${dashboard.certificates.length}`, accent: true },
            { icon: Trophy, label: "Total XP", value: totalXP.toLocaleString(), accent: true, amber: true },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="card-panel p-4 sm:p-5 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <stat.icon className={`w-4 h-4 ${stat.amber ? "text-amber-400" : "text-[oklch(0.55_0.12_155)]"}`} />
                <span className="text-[10px] sm:text-[11px] text-[oklch(0.45_0.006_250)] uppercase tracking-wider font-mono">{stat.label}</span>
              </div>
              <div className={`text-2xl sm:text-3xl font-heading ${stat.amber ? "text-amber-400" : stat.accent ? "text-[oklch(0.55_0.12_155)]" : "text-white"}`}>
                {stat.value}
                {stat.sub && <span className="text-base sm:text-lg text-[oklch(0.40_0.006_250)]">{stat.sub}</span>}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ─── Streak Card ─── */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.17 }}
          className="mb-8"
        >
          <StreakCard />
        </motion.div>

        {/* ─── Continue Learning ─── */}
        {dashboard.nextLesson && (() => {
          const nl = dashboard.nextLesson as { moduleSlug: string; moduleName: string; lessonSlug: string; lessonTitle: string };
          return (
            <motion.div
              {...fadeUp}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="p-5 sm:p-6 rounded-xl border border-[oklch(0.55_0.12_155/25%)] bg-gradient-to-r from-[oklch(0.55_0.12_155/6%)] to-[oklch(0.08_0.003_250)] hover:border-[oklch(0.55_0.12_155/40%)] transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-[oklch(0.55_0.12_155)] animate-pulse" />
                      <span className="text-xs font-mono uppercase tracking-wider text-[oklch(0.55_0.12_155)]">Continue Learning</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-white mb-1">
                      {nl.lessonTitle}
                    </h3>
                    <p className="text-sm text-[oklch(0.45_0.006_250)]">
                      {nl.moduleName}
                    </p>
                  </div>
                  <Link href={`/courses/${nl.moduleSlug}/${nl.lessonSlug}`}>
                    <Button className="gap-2 btn-primary whitespace-nowrap shadow-lg shadow-[oklch(0.55_0.12_155/10%)]">
                      Resume Lesson
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* ─── Module Progress Grid ─── */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg sm:text-xl font-heading text-white">Course Modules</h2>
            <Link href="/courses">
              <span className="text-xs text-[oklch(0.55_0.12_155)] hover:underline font-medium cursor-pointer">View All →</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {dashboard.modules.map((mod, i) => (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.04 }}
              >
                <Link href={`/courses/${mod.slug}`}>
                  <div className="p-4 sm:p-5 rounded-xl border border-[oklch(0.16_0.004_250)] bg-[oklch(0.08_0.003_250)] hover:border-[oklch(0.55_0.12_155/35%)] hover:bg-[oklch(0.09_0.003_250)] transition-all cursor-pointer h-full group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[oklch(0.55_0.12_155/8%)] border border-[oklch(0.55_0.12_155/18%)] flex items-center justify-center text-[oklch(0.55_0.12_155)] group-hover:scale-105 transition-transform">
                        {iconMap[mod.icon || "BookOpen"] || <BookOpen className="w-5 h-5" />}
                      </div>
                      {mod.hasCertificate && (
                        <div className="flex items-center gap-1 text-[10px] text-[oklch(0.55_0.12_155)] bg-[oklch(0.55_0.12_155/8%)] px-2 py-0.5 rounded-full">
                          <Award className="w-3 h-3" />
                          Certified
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-white mb-3 leading-snug">{mod.title}</h3>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-[oklch(0.13_0.004_250)]">
                        <div
                          className="h-full rounded-full bg-[oklch(0.55_0.12_155)] transition-all"
                          style={{ width: `${mod.percentage}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-[oklch(0.50_0.008_250)] font-mono w-8 text-right">{mod.percentage}%</span>
                    </div>
                    <p className="text-[11px] text-[oklch(0.42_0.006_250)]">
                      {mod.completedCount} / {mod.totalCount} {mod.totalCount === 1 ? "lesson" : "lessons"} completed
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ─── Simulator Career Mode ─── */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.28 }}
          className="mb-8"
        >
          <SimulatorCareerPanel />
        </motion.div>

        {/* ─── Achievements ─── */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Achievements
            completedLessons={dashboard.completedLessons}
            totalXP={totalXP}
            certCount={dashboard.certificates.length}
            simulatorRuns={0}
          />
        </motion.div>

        {/* ─── Saved Lessons & Weekly Activity ─── */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.32 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8"
        >
          <SavedLessonsPanel />
          <WeeklyDigestCard />
        </motion.div>

        {/* ─── Leaderboard ─── */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.35 }}
          className="mb-8"
        >
          <LeaderboardPanel />
        </motion.div>

        {/* ─── Quick Actions ─── */}
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.4 }}
          className="card-panel p-5 rounded-xl"
        >
          <h3 className="text-xs font-mono uppercase tracking-wider text-[oklch(0.45_0.006_250)] mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link href="/certifications">
              <Button variant="outline" size="sm" className="gap-2 text-xs border-[oklch(0.18_0.004_250)] hover:border-[oklch(0.30_0.004_250)]">
                <Trophy className="w-3.5 h-3.5" />
                Certification Path
              </Button>
            </Link>
            <Link href="/my-certificates">
              <Button variant="outline" size="sm" className="gap-2 text-xs border-[oklch(0.18_0.004_250)] hover:border-[oklch(0.30_0.004_250)]">
                <Award className="w-3.5 h-3.5" />
                My Certificates
              </Button>
            </Link>
            <Link href="/mastery">
              <Button variant="outline" size="sm" className="gap-2 text-xs border-[oklch(0.18_0.004_250)] hover:border-[oklch(0.30_0.004_250)]">
                <Target className="w-3.5 h-3.5" />
                Fault Mastery
              </Button>
            </Link>
            <Link href="/simulator">
              <Button variant="outline" size="sm" className="gap-2 text-xs border-[oklch(0.18_0.004_250)] hover:border-[oklch(0.30_0.004_250)]">
                <Zap className="w-3.5 h-3.5" />
                Practice Simulator
              </Button>
            </Link>
            <Link href="/progress">
              <Button variant="outline" size="sm" className="gap-2 text-xs border-[oklch(0.18_0.004_250)] hover:border-[oklch(0.30_0.004_250)]">
                <BarChart3 className="w-3.5 h-3.5" />
                My Methodology
              </Button>
            </Link>
            <Link href="/labs">
              <Button variant="outline" size="sm" className="gap-2 text-xs border-[oklch(0.18_0.004_250)] hover:border-[oklch(0.30_0.004_250)]">
                <Cpu className="w-3.5 h-3.5" />
                Interactive Labs
              </Button>
            </Link>
            <Link href="/account">
              <Button variant="outline" size="sm" className="gap-2 text-xs border-[oklch(0.18_0.004_250)] hover:border-[oklch(0.30_0.004_250)]">
                <Settings className="w-3.5 h-3.5" />
                Account Settings
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
