/**
 * StreakCard - Professional login streak tracker
 * 
 * Industrial-styled card showing current streak, longest streak,
 * and total active days. Uses fire/flame aesthetic for active streaks
 * without being childish.
 */

import { motion } from "framer-motion";
import { Flame, Calendar, TrendingUp, Activity } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function StreakCard() {
  const { isAuthenticated } = useAuth();
  const { data: streak, isLoading } = trpc.streaks.getMyStreak.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  // Streak is recorded on lesson/scenario completion, not on page load.
  // See markLessonComplete and scenario completion handlers.

  if (isLoading || !streak) {
    return (
      <div className="p-5 rounded-xl border border-[oklch(0.16_0.004_250)] bg-[oklch(0.08_0.003_250)] animate-pulse">
        <div className="h-4 w-24 bg-[oklch(0.15_0.004_250)] rounded mb-4" />
        <div className="h-8 w-16 bg-[oklch(0.15_0.004_250)] rounded" />
      </div>
    );
  }

  const hasStreak = streak.currentStreak > 0;
  const isHot = streak.currentStreak >= 7;
  const isOnFire = streak.currentStreak >= 14;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-5 rounded-xl border overflow-hidden transition-all ${
        isOnFire
          ? "border-[oklch(0.50_0.14_60/40%)] bg-gradient-to-br from-[oklch(0.12_0.02_60/30%)] to-[oklch(0.08_0.003_250)]"
          : isHot
          ? "border-[oklch(0.40_0.10_60/30%)] bg-gradient-to-br from-[oklch(0.10_0.01_60/20%)] to-[oklch(0.08_0.003_250)]"
          : "border-[oklch(0.16_0.004_250)] bg-[oklch(0.08_0.003_250)]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[oklch(0.50_0.008_250)]" />
          <span className="text-[10px] sm:text-[11px] text-[oklch(0.45_0.006_250)] uppercase tracking-wider font-mono">
            Training Streak
          </span>
        </div>
        {hasStreak && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono ${
            isOnFire
              ? "bg-[oklch(0.50_0.14_60/15%)] text-[oklch(0.75_0.15_60)]"
              : isHot
              ? "bg-[oklch(0.45_0.10_60/12%)] text-[oklch(0.70_0.12_60)]"
              : "bg-[oklch(0.55_0.12_155/8%)] text-[oklch(0.55_0.12_155)]"
          }`}>
            <Flame className={`w-3 h-3 ${isOnFire ? "streak-fire" : ""}`} />
            {isOnFire ? "ON FIRE" : isHot ? "HOT" : "ACTIVE"}
          </div>
        )}
      </div>

      {/* Main streak number */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className={`text-3xl sm:text-4xl font-heading tracking-wide ${
          isOnFire
            ? "text-[oklch(0.75_0.15_60)] streak-fire"
            : isHot
            ? "text-[oklch(0.70_0.12_60)]"
            : hasStreak
            ? "text-[oklch(0.55_0.12_155)]"
            : "text-[oklch(0.40_0.005_250)]"
        }`}>
          {streak.currentStreak}
        </span>
        <span className="text-xs text-[oklch(0.45_0.006_250)] font-mono">
          {streak.currentStreak === 1 ? "day" : "days"}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-[oklch(0.45_0.006_250)]" />
          <div>
            <div className="text-xs text-[oklch(0.40_0.006_250)] font-mono">Best</div>
            <div className="text-sm font-medium text-white">{streak.longestStreak} days</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-[oklch(0.45_0.006_250)]" />
          <div>
            <div className="text-xs text-[oklch(0.40_0.006_250)] font-mono">Total</div>
            <div className="text-sm font-medium text-white">{streak.totalActiveDays} days</div>
          </div>
        </div>
      </div>

      {/* Ambient glow for active streaks */}
      {isHot && (
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[oklch(0.50_0.14_60/5%)] blur-2xl pointer-events-none" />
      )}
    </motion.div>
  );
}
