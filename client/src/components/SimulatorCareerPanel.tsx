/**
 * SimulatorCareerPanel — Career mode progression panel for the Dashboard
 * Shows mastery level, achievements, difficulty breakdown, and recent completions
 */
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Zap, Award, Shield, Star, Crown, Target, Clock,
  Trophy, TrendingUp, ChevronRight, Lock, CheckCircle2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { pluralize } from "@/lib/pluralize";

const masteryConfig = {
  apprentice: { label: "Apprentice", icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", accent: "oklch(0.55_0.12_155)" },
  journeyman: { label: "Journeyman", icon: Star, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", accent: "oklch(0.60_0.15_250)" },
  specialist: { label: "Specialist", icon: Award, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", accent: "oklch(0.60_0.18_300)" },
  master: { label: "Master", icon: Crown, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", accent: "oklch(0.75_0.15_75)" },
};

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function SimulatorCareerPanel() {
  const { isAuthenticated } = useAuth();
  const { data: career, isLoading } = trpc.scenarioProgression.getCareerStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated || isLoading || !career) return null;
  if (career.totalCompleted === 0) {
    // Show CTA to start simulator
    return (
      <div className="p-5 rounded-xl border border-[oklch(0.16_0.004_250)] bg-[oklch(0.08_0.003_250)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[oklch(0.55_0.12_155/8%)] border border-[oklch(0.55_0.12_155/18%)] flex items-center justify-center">
            <Zap className="w-5 h-5 text-[oklch(0.55_0.12_155)]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Simulator Career Mode</h3>
            <p className="text-[11px] text-[oklch(0.45_0.006_250)]">Complete scenarios to earn achievements and advance your mastery level</p>
          </div>
        </div>
        <Link href="/simulator">
          <button className="w-full btn-primary flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg">
            Start Your First Scenario
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>
    );
  }

  const mastery = masteryConfig[career.masteryLevel];
  const MasteryIcon = mastery.icon;
  const earnedAchievements = career.achievements.filter(a => a.earned);
  const lockedAchievements = career.achievements.filter(a => !a.earned);

  return (
    <div className="rounded-xl border border-[oklch(0.16_0.004_250)] bg-[oklch(0.08_0.003_250)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[oklch(0.14_0.004_250)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[oklch(0.55_0.12_155/8%)] border border-[oklch(0.55_0.12_155/18%)] flex items-center justify-center">
            <Zap className="w-5 h-5 text-[oklch(0.55_0.12_155)]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Simulator Career</h3>
            <p className="text-[11px] text-[oklch(0.45_0.006_250)]">{pluralize(career.uniqueScenarios, "scenario")} mastered</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${mastery.bg} border ${mastery.border}`}>
          <MasteryIcon className={`w-4 h-4 ${mastery.color}`} />
          <span className={`text-xs font-bold ${mastery.color}`}>{mastery.label}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-px bg-[oklch(0.12_0.004_250)]">
        {[
          { label: "Avg Score", value: `${career.averageScore}%`, icon: Target },
          { label: "Best Score", value: `${career.bestScore}%`, icon: Trophy },
          { label: "Avg Time", value: formatTime(career.averageTimeSeconds), icon: Clock },
          { label: "Total Time", value: formatTime(career.totalTimeSeconds), icon: TrendingUp },
        ].map(stat => (
          <div key={stat.label} className="bg-[oklch(0.08_0.003_250)] p-3 text-center">
            <stat.icon className="w-3 h-3 text-[oklch(0.45_0.006_250)] mx-auto mb-1" />
            <div className="text-sm font-mono text-white">{stat.value}</div>
            <div className="text-[9px] text-[oklch(0.40_0.006_250)] uppercase tracking-wider mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Difficulty Breakdown */}
      <div className="px-5 py-3 border-t border-[oklch(0.14_0.004_250)]">
        <span className="text-[10px] text-[oklch(0.45_0.006_250)] uppercase tracking-wider font-mono block mb-2">Difficulty Progress</span>
        <div className="flex items-center gap-3">
          {[
            { label: "Beginner", count: career.difficultyBreakdown.beginner, total: 2, color: "bg-emerald-500" },
            { label: "Intermediate", count: career.difficultyBreakdown.intermediate, total: 4, color: "bg-blue-500" },
            { label: "Advanced", count: career.difficultyBreakdown.advanced, total: 2, color: "bg-amber-500" },
          ].map(d => (
            <div key={d.label} className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[oklch(0.50_0.008_250)]">{d.label}</span>
                <span className="text-[10px] font-mono text-[oklch(0.45_0.006_250)]">{d.count}/{d.total}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[oklch(0.13_0.004_250)] overflow-hidden">
                <div className={`h-full rounded-full ${d.color} transition-all`} style={{ width: `${Math.min((d.count / d.total) * 100, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="px-5 py-3 border-t border-[oklch(0.14_0.004_250)]">
        <span className="text-[10px] text-[oklch(0.45_0.006_250)] uppercase tracking-wider font-mono block mb-2">
          Achievements ({earnedAchievements.length}/{career.achievements.length})
        </span>
        <div className="flex flex-wrap gap-1.5">
          {earnedAchievements.map(a => (
            <motion.div
              key={a.id}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[oklch(0.55_0.12_155/8%)] border border-[oklch(0.55_0.12_155/20%)]"
              title={a.description}
            >
              <CheckCircle2 className="w-3 h-3 text-[oklch(0.55_0.12_155)]" />
              <span className="text-[10px] text-[oklch(0.55_0.12_155)] font-medium">{a.title}</span>
            </motion.div>
          ))}
          {lockedAchievements.slice(0, 3).map(a => (
            <div
              key={a.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[oklch(0.10_0.003_250)] border border-[oklch(0.14_0.004_250)] opacity-50"
              title={a.description}
            >
              <Lock className="w-3 h-3 text-[oklch(0.35_0.006_250)]" />
              <span className="text-[10px] text-[oklch(0.35_0.006_250)]">{a.title}</span>
            </div>
          ))}
          {lockedAchievements.length > 3 && (
            <span className="text-[10px] text-[oklch(0.40_0.006_250)] self-center ml-1">
              +{lockedAchievements.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Recent Completions */}
      {career.recentCompletions.length > 0 && (
        <div className="px-5 py-3 border-t border-[oklch(0.14_0.004_250)]">
          <span className="text-[10px] text-[oklch(0.45_0.006_250)] uppercase tracking-wider font-mono block mb-2">Recent Activity</span>
          <div className="space-y-1.5">
            {career.recentCompletions.slice(0, 3).map((c, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    c.difficulty === "beginner" ? "bg-emerald-500" : c.difficulty === "intermediate" ? "bg-blue-500" : "bg-amber-500"
                  }`} />
                  <span className="text-[11px] text-[oklch(0.60_0.008_250)] truncate max-w-[180px]">{c.scenarioTitle}</span>
                </div>
                <span className={`text-[11px] font-mono ${c.score >= 80 ? "text-emerald-400" : c.score >= 60 ? "text-amber-400" : "text-red-400"}`}>
                  {c.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="px-5 py-3 border-t border-[oklch(0.14_0.004_250)]">
        <Link href="/simulator">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-[oklch(0.55_0.12_155/8%)] border border-[oklch(0.55_0.12_155/20%)] text-[oklch(0.55_0.12_155)] hover:bg-[oklch(0.55_0.12_155/14%)] transition-colors">
            Continue Training
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>
    </div>
  );
}
