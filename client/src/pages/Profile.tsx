/**
 * Technician Profile Page — Shows user stats, badges, certifications, and learning history.
 * Serves as a professional showcase for maintenance technicians.
 */
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Award, BookOpen, Zap, Clock, Trophy, Target,
  Shield, Wrench, Cpu, Flame, Star, ChevronRight
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useSubscription } from "@/hooks/useSubscription";
import SEO from "@/components/SEO";
import { Loader2 } from "lucide-react";
import { pluralize } from "@/lib/pluralize";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// Achievement badge definitions
const achievementBadges = [
  { id: "first-lesson", icon: BookOpen, label: "First Lesson", description: "Completed your first lesson", threshold: 1 },
  { id: "five-lessons", icon: Zap, label: "Quick Learner", description: "Completed 5 lessons", threshold: 5 },
  { id: "ten-lessons", icon: Target, label: "Dedicated", description: "Completed 10 lessons", threshold: 10 },
  { id: "twenty-lessons", icon: Flame, label: "On Fire", description: "Completed 20 lessons", threshold: 20 },
  { id: "fifty-lessons", icon: Trophy, label: "Expert", description: "Completed 50 lessons", threshold: 50 },
  { id: "first-sim", icon: Wrench, label: "Troubleshooter", description: "Completed first simulation", threshold: 1 },
  { id: "five-sims", icon: Cpu, label: "Diagnostician", description: "Completed 5 simulations", threshold: 5 },
  { id: "first-cert", icon: Award, label: "Certified", description: "Earned first certification", threshold: 1 },
];

// Rank definitions matching Dashboard
const ranks = [
  { name: "Apprentice", minXP: 0, icon: Wrench },
  { name: "Journeyman", minXP: 250, icon: Shield },
  { name: "Specialist", minXP: 750, icon: Star },
  { name: "Master Tech", minXP: 1500, icon: Award },
  { name: "Chief Engineer", minXP: 2500, icon: Trophy },
];

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { tier } = useSubscription();

  const { data: dashboard, isLoading: dashLoading } = trpc.courses.getDashboard.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: certs } = trpc.certificates.getMyCertificates.useQuery(undefined, {
    enabled: !!user,
  });

  if (authLoading || dashLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[oklch(0.55_0.12_155)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-3xl py-20 text-center">
        <SEO title="Profile" description="View your technician profile" path="/profile" />
        <Shield className="w-12 h-12 text-[oklch(0.40_0.006_250)] mx-auto mb-4" />
        <h1 className="text-2xl font-heading text-white mb-3">Sign In to View Your Profile</h1>
        <p className="text-[oklch(0.55_0.008_250)] mb-6">Log in to see your learning progress, achievements, and certifications.</p>
        <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 btn-primary text-sm font-semibold rounded-lg">
          Sign In
        </Link>
      </div>
    );
  }

  const completedLessons = dashboard?.completedLessons ?? 0;
  const totalLessons = dashboard?.totalLessons ?? 0;
  const totalXP = completedLessons * 50;
  const certsEarned = certs?.length ?? 0;
  // Simulations completed count from certificates (each cert implies simulation mastery)
  const simulationsCompleted = certsEarned;

  // Determine rank
  const currentRank = [...ranks].reverse().find(r => totalXP >= r.minXP) || ranks[0];
  const nextRank = ranks[ranks.indexOf(currentRank) + 1];

  // Determine earned badges
  const earnedBadges = achievementBadges.filter(badge => {
    if (badge.id.includes("lesson")) return completedLessons >= badge.threshold;
    if (badge.id.includes("sim")) return simulationsCompleted >= badge.threshold;
    if (badge.id.includes("cert")) return certsEarned >= badge.threshold;
    return false;
  });

  const tierLabel = tier === "pro" ? "Pro" : tier === "team" ? "Team" : "Starter";
  const tierColor = tier === "pro" ? "text-[oklch(0.55_0.12_155)]" : tier === "team" ? "text-blue-400" : "text-[oklch(0.50_0.008_250)]";

  return (
    <div className="container max-w-4xl py-10 sm:py-16">
      <SEO title="My Profile" description="Your technician profile and learning progress" path="/profile" />

      {/* Profile Header */}
      <motion.div {...fadeUp} className="card-panel p-6 sm:p-8 rounded-xl mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-[oklch(0.55_0.12_155)] to-[oklch(0.40_0.12_155)] flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shrink-0">
            {(user.name || user.email || "?")[0].toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl sm:text-2xl font-heading text-white truncate">
                {user.name || "Technician"}
              </h1>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${tierColor} border-current/20 bg-current/5`}>
                {tierLabel}
              </span>
            </div>
            <p className="text-sm text-[oklch(0.50_0.008_250)] mb-2">{user.email}</p>

            <div className="flex items-center gap-4 text-xs text-[oklch(0.55_0.008_250)]">
              <span className="flex items-center gap-1.5">
                {(() => { const RankIcon = currentRank.icon; return <RankIcon className="w-3.5 h-3.5 text-[oklch(0.55_0.12_155)]" />; })()}
                {currentRank.name}
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                {totalXP.toLocaleString()} XP
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                {pluralize(completedLessons, "lesson")}
              </span>
            </div>
          </div>
        </div>

        {/* XP Progress to Next Rank */}
        {nextRank && (
          <div className="mt-5 pt-5 border-t border-[oklch(0.15_0.004_250)]">
            <div className="flex items-center justify-between text-[11px] mb-2">
              <span className="text-[oklch(0.50_0.008_250)]">Progress to {nextRank.name}</span>
              <span className="font-mono text-[oklch(0.55_0.12_155)]">
                {totalXP} / {nextRank.minXP} XP
              </span>
            </div>
            <div className="h-2 bg-[oklch(0.12_0.003_250)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[oklch(0.55_0.12_155)] to-[oklch(0.65_0.12_155)] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (totalXP / nextRank.minXP) * 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Lessons Completed", value: completedLessons, total: totalLessons, icon: BookOpen, color: "text-[oklch(0.55_0.12_155)]" },
          { label: "Simulations", value: simulationsCompleted, icon: Wrench, color: "text-amber-400" },
          { label: "Certifications", value: certsEarned, icon: Award, color: "text-blue-400" },
          { label: "Achievements", value: earnedBadges.length, total: achievementBadges.length, icon: Trophy, color: "text-purple-400" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              {...fadeUp}
              transition={{ delay: i * 0.05 }}
              className="card-panel p-4 rounded-xl text-center"
            >
              <Icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
              <div className="text-xl font-bold text-white">
                {stat.value}
                {stat.total !== undefined && <span className="text-sm text-[oklch(0.40_0.006_250)]">/{stat.total}</span>}
              </div>
              <div className="text-[10px] text-[oklch(0.45_0.006_250)] mt-1">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Achievements */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="card-panel p-5 sm:p-6 rounded-xl mb-6">
        <h2 className="text-sm font-heading text-white mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          Achievements
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {achievementBadges.map((badge) => {
            const Icon = badge.icon;
            const earned = earnedBadges.includes(badge);
            return (
              <div
                key={badge.id}
                className={`p-3 rounded-lg text-center transition-all ${
                  earned
                    ? "bg-[oklch(0.55_0.12_155/8%)] border border-[oklch(0.55_0.12_155/20%)]"
                    : "bg-[oklch(0.10_0.003_250)] border border-[oklch(0.14_0.004_250)] opacity-40"
                }`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-1.5 ${earned ? "text-[oklch(0.55_0.12_155)]" : "text-[oklch(0.30_0.006_250)]"}`} />
                <div className={`text-[11px] font-semibold ${earned ? "text-white" : "text-[oklch(0.35_0.006_250)]"}`}>
                  {badge.label}
                </div>
                <div className="text-[9px] text-[oklch(0.40_0.006_250)] mt-0.5">{badge.description}</div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Certifications */}
      {certs && certs.length > 0 && (
        <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="card-panel p-5 sm:p-6 rounded-xl mb-6">
          <h2 className="text-sm font-heading text-white mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-400" />
            Certifications
          </h2>
          <div className="space-y-2">
            {certs.map((cert: any) => (
              <div key={cert.id} className="flex items-center justify-between p-3 rounded-lg bg-[oklch(0.10_0.003_250)] border border-[oklch(0.14_0.004_250)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Award className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm text-white font-medium">{cert.levelName || cert.certificationLevel?.name || "Certification"}</div>
                    <div className="text-[10px] text-[oklch(0.45_0.006_250)]">
                      Earned {cert.earnedAt ? new Date(cert.earnedAt).toLocaleDateString() : ""}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[oklch(0.35_0.006_250)]" />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Links */}
      <motion.div {...fadeUp} transition={{ delay: 0.4 }} className="grid sm:grid-cols-2 gap-3">
        <Link href="/dashboard" className="card-panel p-4 rounded-xl flex items-center gap-3 hover:border-[oklch(0.55_0.12_155/30%)] transition-colors group">
          <Target className="w-5 h-5 text-[oklch(0.55_0.12_155)]" />
          <div>
            <div className="text-sm text-white font-medium">Continue Learning</div>
            <div className="text-[10px] text-[oklch(0.45_0.006_250)]">Back to your dashboard</div>
          </div>
          <ChevronRight className="w-4 h-4 text-[oklch(0.30_0.006_250)] ml-auto group-hover:text-[oklch(0.55_0.12_155)] transition-colors" />
        </Link>
        <Link href="/account" className="card-panel p-4 rounded-xl flex items-center gap-3 hover:border-[oklch(0.55_0.12_155/30%)] transition-colors group">
          <Shield className="w-5 h-5 text-[oklch(0.55_0.12_155)]" />
          <div>
            <div className="text-sm text-white font-medium">Account Settings</div>
            <div className="text-[10px] text-[oklch(0.45_0.006_250)]">Manage your subscription</div>
          </div>
          <ChevronRight className="w-4 h-4 text-[oklch(0.30_0.006_250)] ml-auto group-hover:text-[oklch(0.55_0.12_155)] transition-colors" />
        </Link>
      </motion.div>
    </div>
  );
}
