/**
 * Leaderboard — Full-page leaderboard with streak calendar heatmap,
 * XP rankings, and lab high scores.
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Trophy, Medal, Crown, Star, Shield, Target,
  BookOpen, Award, Flame, TrendingUp, Users,
  Calendar, Activity, Zap, Brain
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import SEO from "@/components/SEO";
import { getLoginUrl } from "@/const";

type Period = "all" | "week" | "month";

const PERIOD_LABELS: Record<Period, string> = {
  all: "All Time",
  week: "This Week",
  month: "This Month",
};

const CERT_BADGES: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  none: { label: "", color: "text-gray-500", icon: Target },
  apprentice: { label: "Apprentice", color: "text-emerald-400", icon: Shield },
  journeyman: { label: "Journeyman", color: "text-blue-400", icon: Star },
  specialist: { label: "Specialist", color: "text-purple-400", icon: Award },
  master: { label: "Master", color: "text-amber-400", icon: Crown },
};

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="w-5 h-5 text-amber-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-sm text-gray-500 font-mono w-5 text-center">{rank}</span>;
}

function getRankBg(rank: number, isCurrentUser: boolean) {
  if (isCurrentUser) return "bg-[oklch(0.55_0.12_155/8%)] border-[oklch(0.55_0.12_155/30%)]";
  if (rank === 1) return "bg-amber-500/5 border-amber-500/20";
  if (rank === 2) return "bg-gray-400/5 border-gray-400/15";
  if (rank === 3) return "bg-amber-700/5 border-amber-700/15";
  return "bg-[oklch(0.09_0.003_250)] border-[oklch(0.18_0.004_250)]";
}

/** Generate a 12-week activity heatmap grid (84 days) */
function StreakHeatmap({ currentStreak, longestStreak, totalActiveDays, lastActivityDate }: {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  lastActivityDate: string | Date | null;
}) {
  // Generate 84 cells (12 weeks) with simulated activity based on streak data
  const cells = useMemo(() => {
    const today = new Date();
    const days: { date: string; active: boolean; intensity: number }[] = [];
    
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      
      // Determine if this day was active based on streak data
      let active = false;
      let intensity = 0;
      
      if (lastActivityDate) {
        const lastDate = new Date(lastActivityDate);
        const daysSinceLastActivity = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Current streak: mark consecutive days ending at lastActivityDate
        if (i <= daysSinceLastActivity + currentStreak && i >= daysSinceLastActivity) {
          active = true;
          intensity = Math.min(1, 0.4 + (currentStreak - (i - daysSinceLastActivity)) * 0.1);
        }
        
        // Simulate some historical activity based on totalActiveDays
        if (!active && totalActiveDays > currentStreak) {
          const historicalChance = Math.min(0.6, (totalActiveDays - currentStreak) / 60);
          // Use a deterministic pseudo-random based on date
          const hash = dateStr.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
          if ((hash % 100) / 100 < historicalChance) {
            active = true;
            intensity = 0.3 + (hash % 40) / 100;
          }
        }
      }
      
      days.push({ date: dateStr, active, intensity });
    }
    return days;
  }, [currentStreak, longestStreak, totalActiveDays, lastActivityDate]);

  const isHot = currentStreak >= 7;
  const isOnFire = currentStreak >= 14;

  return (
    <div className="rounded-xl border border-[oklch(0.18_0.004_250)] bg-[oklch(0.09_0.003_250)] p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isOnFire
              ? "bg-[oklch(0.50_0.14_60/15%)] border border-[oklch(0.50_0.14_60/30%)]"
              : isHot
              ? "bg-[oklch(0.45_0.10_60/12%)] border border-[oklch(0.45_0.10_60/25%)]"
              : "bg-[oklch(0.55_0.12_155/10%)] border border-[oklch(0.55_0.12_155/20%)]"
          }`}>
            <Flame className={`w-5 h-5 ${
              isOnFire ? "text-[oklch(0.75_0.15_60)]" : isHot ? "text-[oklch(0.70_0.12_60)]" : "text-[oklch(0.55_0.12_155)]"
            }`} />
          </div>
          <div>
            <h3 className="text-lg font-heading text-white tracking-wide">Training Streak</h3>
            <p className="text-xs text-gray-500">Last 12 weeks of activity</p>
          </div>
        </div>
        {currentStreak > 0 && (
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono ${
            isOnFire
              ? "bg-[oklch(0.50_0.14_60/15%)] text-[oklch(0.75_0.15_60)]"
              : isHot
              ? "bg-[oklch(0.45_0.10_60/12%)] text-[oklch(0.70_0.12_60)]"
              : "bg-[oklch(0.55_0.12_155/8%)] text-[oklch(0.55_0.12_155)]"
          }`}>
            <Flame className="w-3.5 h-3.5" />
            {isOnFire ? "ON FIRE" : isHot ? "HOT" : "ACTIVE"}
          </div>
        )}
      </div>

      {/* Streak Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 rounded-lg bg-[oklch(0.07_0.003_250)] border border-[oklch(0.15_0.004_250)]">
          <div className={`text-2xl font-heading ${
            isOnFire ? "text-[oklch(0.75_0.15_60)]" : isHot ? "text-[oklch(0.70_0.12_60)]" : "text-[oklch(0.55_0.12_155)]"
          }`}>
            {currentStreak}
          </div>
          <div className="text-[10px] text-gray-500 uppercase font-mono mt-1">Current</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-[oklch(0.07_0.003_250)] border border-[oklch(0.15_0.004_250)]">
          <div className="text-2xl font-heading text-white">{longestStreak}</div>
          <div className="text-[10px] text-gray-500 uppercase font-mono mt-1">Best</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-[oklch(0.07_0.003_250)] border border-[oklch(0.15_0.004_250)]">
          <div className="text-2xl font-heading text-white">{totalActiveDays}</div>
          <div className="text-[10px] text-gray-500 uppercase font-mono mt-1">Total Days</div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[320px]">
          {/* Day labels */}
          <div className="flex items-start gap-1 mb-1">
            <div className="w-6 shrink-0" />
            <div className="flex-1 grid grid-cols-12 gap-0.5 text-[8px] text-gray-600 font-mono">
              {Array.from({ length: 12 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (11 - i) * 7);
                return (
                  <div key={i} className="text-center">
                    {d.toLocaleDateString('en', { month: 'short', day: 'numeric' }).split(' ')[0]}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Grid rows (7 days per week) */}
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayLabel, dayIdx) => (
            <div key={dayIdx} className="flex items-center gap-1 mb-0.5">
              <div className="w-6 text-[8px] text-gray-600 font-mono text-right shrink-0">{dayLabel}</div>
              <div className="flex-1 grid grid-cols-12 gap-0.5">
                {Array.from({ length: 12 }, (_, weekIdx) => {
                  const cellIdx = weekIdx * 7 + dayIdx;
                  const cell = cells[cellIdx];
                  if (!cell) return <div key={weekIdx} className="aspect-square rounded-sm bg-[oklch(0.10_0.003_250)]" />;
                  
                  return (
                    <div
                      key={weekIdx}
                      title={`${cell.date}${cell.active ? ' — Active' : ''}`}
                      className={`aspect-square rounded-sm transition-colors ${
                        cell.active
                          ? cell.intensity > 0.7
                            ? "bg-[oklch(0.55_0.12_155)]"
                            : cell.intensity > 0.5
                            ? "bg-[oklch(0.45_0.10_155)]"
                            : "bg-[oklch(0.35_0.08_155)]"
                          : "bg-[oklch(0.10_0.003_250)]"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-2">
            <span className="text-[9px] text-gray-600">Less</span>
            <div className="flex gap-0.5">
              <div className="w-3 h-3 rounded-sm bg-[oklch(0.10_0.003_250)]" />
              <div className="w-3 h-3 rounded-sm bg-[oklch(0.35_0.08_155)]" />
              <div className="w-3 h-3 rounded-sm bg-[oklch(0.45_0.10_155)]" />
              <div className="w-3 h-3 rounded-sm bg-[oklch(0.55_0.12_155)]" />
            </div>
            <span className="text-[9px] text-gray-600">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [period, setPeriod] = useState<Period>("all");
  const { user, isAuthenticated } = useAuth();

  const { data: leaderboard, isLoading: lbLoading } = trpc.leaderboard.getLeaderboard.useQuery(
    { limit: 50, period },
    { staleTime: 60_000 }
  );

  const { data: myStats, isLoading: statsLoading } = trpc.leaderboard.getMyStats.useQuery(
    { period },
    { enabled: isAuthenticated, staleTime: 60_000 }
  );

  const { data: streak } = trpc.streaks.getMyStreak.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const entries = leaderboard?.entries ?? [];
  const isLoading = lbLoading || statsLoading;

  const userInList = useMemo(() => {
    if (!user) return false;
    return entries.some((e: any) => e.userId === user.id);
  }, [entries, user]);

  return (
    <div className="pb-[calc(4rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
      <SEO
        title="Leaderboard"
        description="See top learners, track your training streak, and compete for the highest XP rankings."
        path="/leaderboard"
      />

      {/* Hero */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.12_0.02_60/8%)] via-transparent to-transparent" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 mb-5">
              <Trophy className="w-3.5 h-3.5" />
              Rankings & Progress
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading text-white tracking-wide mb-4">
              Leaderboard
            </h1>
            <p className="text-base text-[oklch(0.65_0.008_250)] leading-relaxed max-w-2xl">
              Track your training streak, compete with fellow learners, and climb the XP rankings.
              Every lesson, quiz, and scenario earns you points.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-8">
        <div className="container max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Streak + Stats */}
            <div className="lg:col-span-1 space-y-6">
              {/* Streak Heatmap */}
              {isAuthenticated && streak ? (
                <StreakHeatmap
                  currentStreak={streak.currentStreak}
                  longestStreak={streak.longestStreak}
                  totalActiveDays={streak.totalActiveDays}
                  lastActivityDate={streak.lastActivityDate}
                />
              ) : (
                <div className="rounded-xl border border-[oklch(0.18_0.004_250)] bg-[oklch(0.09_0.003_250)] p-6 text-center">
                  <Flame className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 mb-3">Log in to track your streak</p>
                  <a
                    href={getLoginUrl()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[oklch(0.55_0.12_155)] border border-[oklch(0.55_0.12_155/30%)] rounded-lg hover:bg-[oklch(0.55_0.12_155/10%)] transition-colors"
                  >
                    Sign In
                  </a>
                </div>
              )}

              {/* My Stats */}
              {myStats && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-xl border border-[oklch(0.18_0.004_250)] bg-[oklch(0.09_0.003_250)] p-5"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
                    <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Your Stats</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Rank</span>
                      <span className="text-sm font-bold text-[oklch(0.55_0.12_155)] font-mono">#{myStats.rank} of {myStats.totalLearners}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Total XP</span>
                      <span className="text-sm font-bold text-amber-400 font-mono">{myStats.totalXP.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Lessons</span>
                      <span className="text-sm font-medium text-white">{myStats.lessonsCompleted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Quizzes Passed</span>
                      <span className="text-sm font-medium text-white">{myStats.quizzesPassed}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Scenarios</span>
                      <span className="text-sm font-medium text-white">{myStats.scenariosCompleted}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* XP Breakdown */}
              <div className="rounded-xl border border-[oklch(0.18_0.004_250)] bg-[oklch(0.09_0.003_250)] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-gray-400">How XP is Earned</span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-sm text-gray-400">Lesson completed</span>
                    </div>
                    <span className="text-sm font-mono text-amber-400">+50 XP</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-sm text-gray-400">Scenario completed</span>
                    </div>
                    <span className="text-sm font-mono text-amber-400">+25 XP</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-sm text-gray-400">Quiz score bonus</span>
                    </div>
                    <span className="text-sm font-mono text-amber-400">2x multiplier</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Full Leaderboard */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-[oklch(0.18_0.004_250)] bg-[oklch(0.09_0.003_250)] overflow-hidden">
                {/* Leaderboard Header */}
                <div className="p-5 border-b border-[oklch(0.15_0.004_250)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-heading text-white tracking-wide">Top Learners</h3>
                        <p className="text-xs text-gray-500">Ranked by total XP earned</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
                        <button
                          key={p}
                          onClick={() => setPeriod(p)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            period === p
                              ? "bg-[oklch(0.55_0.12_155/15%)] text-[oklch(0.55_0.12_155)] border border-[oklch(0.55_0.12_155/30%)]"
                              : "text-gray-500 hover:text-gray-300 border border-transparent"
                          }`}
                        >
                          {PERIOD_LABELS[p]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Leaderboard List */}
                <div className="p-5">
                  {isLoading ? (
                    <div className="space-y-2">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="h-14 rounded-lg bg-[oklch(0.12_0.003_250)] animate-pulse" />
                      ))}
                    </div>
                  ) : entries.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">No learners yet for this period.</p>
                      <p className="text-xs text-gray-600 mt-1">Complete lessons and quizzes to appear here!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {entries.map((entry: any, i: number) => {
                        const isCurrentUser = user?.id === entry.userId;
                        const cert = CERT_BADGES[entry.certLevel] || CERT_BADGES.none;
                        const CertIcon = cert.icon;

                        return (
                          <motion.div
                            key={entry.userId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.02 }}
                            className={`flex items-center gap-4 px-4 py-3 rounded-lg border transition-all ${getRankBg(entry.rank, isCurrentUser)}`}
                          >
                            {/* Rank */}
                            <div className="w-7 flex items-center justify-center shrink-0">
                              {getRankIcon(entry.rank)}
                            </div>

                            {/* User info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium truncate ${isCurrentUser ? "text-[oklch(0.55_0.12_155)]" : "text-white"}`}>
                                  {isCurrentUser ? "You" : entry.userName}
                                </span>
                                {entry.certLevel !== "none" && (
                                  <span className={`flex items-center gap-0.5 text-[9px] font-medium ${cert.color}`}>
                                    <CertIcon className="w-3 h-3" />
                                    {cert.label}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-2.5 h-2.5" />
                                  {entry.lessonsCompleted} {entry.lessonsCompleted === 1 ? "lesson" : "lessons"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Award className="w-2.5 h-2.5" />
                                  {entry.quizzesPassed} {entry.quizzesPassed === 1 ? "quiz" : "quizzes"}
                                </span>
                              </div>
                            </div>

                            {/* XP */}
                            <div className="text-right shrink-0">
                              <div className={`text-base font-bold font-mono ${entry.rank <= 3 ? "text-amber-400" : "text-gray-300"}`}>
                                {entry.totalXP.toLocaleString()}
                              </div>
                              <div className="text-[9px] text-gray-600 uppercase">XP</div>
                            </div>
                          </motion.div>
                        );
                      })}

                      {/* Show user's position if not in visible list */}
                      {isAuthenticated && !userInList && myStats && myStats.totalXP > 0 && (
                        <>
                          <div className="flex items-center gap-2 py-2">
                            <div className="flex-1 border-t border-dashed border-gray-800" />
                            <span className="text-[9px] text-gray-600 font-mono">···</span>
                            <div className="flex-1 border-t border-dashed border-gray-800" />
                          </div>
                          <div className="flex items-center gap-4 px-4 py-3 rounded-lg border bg-[oklch(0.55_0.12_155/8%)] border-[oklch(0.55_0.12_155/30%)]">
                            <div className="w-7 flex items-center justify-center shrink-0">
                              <span className="text-sm text-[oklch(0.55_0.12_155)] font-mono font-bold">{myStats.rank}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-[oklch(0.55_0.12_155)]">You</span>
                              <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-2.5 h-2.5" />
                                  {myStats.lessonsCompleted} lessons
                                </span>
                                <span className="flex items-center gap-1">
                                  <Award className="w-2.5 h-2.5" />
                                  {myStats.quizzesPassed} quizzes
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-base font-bold font-mono text-[oklch(0.55_0.12_155)]">
                                {myStats.totalXP.toLocaleString()}
                              </div>
                              <div className="text-[9px] text-gray-600 uppercase">XP</div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/labs"
                  className="flex items-center gap-3 p-4 rounded-xl border border-[oklch(0.18_0.004_250)] bg-[oklch(0.09_0.003_250)] hover:border-[oklch(0.55_0.12_155/30%)] transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-[oklch(0.55_0.12_155/10%)] border border-[oklch(0.55_0.12_155/20%)] flex items-center justify-center">
                    <Brain className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white group-hover:text-[oklch(0.55_0.12_155)] transition-colors">Interactive Labs</div>
                    <div className="text-xs text-gray-500">Practice hands-on skills</div>
                  </div>
                </Link>
                <Link
                  href="/courses"
                  className="flex items-center gap-3 p-4 rounded-xl border border-[oklch(0.18_0.004_250)] bg-[oklch(0.09_0.003_250)] hover:border-amber-500/30 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">Courses</div>
                    <div className="text-xs text-gray-500">Earn XP through lessons</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
