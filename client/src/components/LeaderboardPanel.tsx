/**
 * LeaderboardPanel — Student Progress Leaderboard
 *
 * Shows top learners ranked by XP with the current user's position highlighted.
 * Includes period filter (all time / this week / this month) and XP breakdown.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Medal, Crown, Star, Shield, Target,
  ChevronUp, ChevronDown, BookOpen, Award,
  Flame, TrendingUp, Users
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { pluralize, pluralNoun } from "@/lib/pluralize";

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
  if (rank === 1) return <Crown className="w-4 h-4 text-amber-400" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-gray-300" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
  return <span className="text-xs text-gray-500 font-mono w-4 text-center">{rank}</span>;
}

function getRankBg(rank: number, isCurrentUser: boolean) {
  if (isCurrentUser) return "bg-[oklch(0.55_0.12_155/8%)] border-[oklch(0.55_0.12_155/30%)]";
  if (rank === 1) return "bg-amber-500/5 border-amber-500/20";
  if (rank === 2) return "bg-gray-400/5 border-gray-400/15";
  if (rank === 3) return "bg-amber-700/5 border-amber-700/15";
  return "bg-[oklch(0.09_0.003_250)] border-[oklch(0.18_0.004_250)]";
}

export default function LeaderboardPanel() {
  const [period, setPeriod] = useState<Period>("all");
  const [expanded, setExpanded] = useState(true);
  const { user, isAuthenticated } = useAuth();

  const { data: leaderboard, isLoading: lbLoading } = trpc.leaderboard.getLeaderboard.useQuery(
    { limit: 15, period },
    { staleTime: 60_000 }
  );

  const { data: myStats, isLoading: statsLoading } = trpc.leaderboard.getMyStats.useQuery(
    { period },
    { enabled: isAuthenticated, staleTime: 60_000 }
  );

  const entries = leaderboard?.entries ?? [];
  const isLoading = lbLoading || statsLoading;

  // Check if current user is in the visible list
  const userInList = useMemo(() => {
    if (!user) return false;
    return entries.some((e: any) => e.userId === user.id);
  }, [entries, user]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="rounded-lg border border-[oklch(0.18_0.004_250)] bg-[oklch(0.09_0.003_250)] overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Trophy className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-heading text-white tracking-wide">Leaderboard</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Top learners by XP earned</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {myStats && (
            <div className="text-right mr-2 hidden sm:block">
              <div className="text-xs text-gray-400">Your Rank</div>
              <div className="text-sm font-bold text-[oklch(0.55_0.12_155)] font-mono">#{myStats.rank}</div>
            </div>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* Period Filter */}
            <div className="px-5 pb-3 flex items-center gap-2">
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

            {/* My Stats Card (if authenticated) */}
            {myStats && (
              <div className="mx-5 mb-4 p-4 rounded-lg bg-[oklch(0.55_0.12_155/5%)] border border-[oklch(0.55_0.12_155/20%)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-[oklch(0.55_0.12_155)]">Your Stats</span>
                  <span className="text-xs text-gray-500">{PERIOD_LABELS[period]}</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center">
                    <div className="text-lg font-heading text-white">#{myStats.rank}</div>
                    <div className="text-[9px] text-gray-500 uppercase">Rank</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-heading text-amber-400">{myStats.totalXP.toLocaleString()}</div>
                    <div className="text-[9px] text-gray-500 uppercase">XP</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-heading text-white">{myStats.lessonsCompleted}</div>
                    <div className="text-[9px] text-gray-500 uppercase">Lessons</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-heading text-white">{myStats.quizzesPassed}</div>
                    <div className="text-[9px] text-gray-500 uppercase">Quizzes</div>
                  </div>
                </div>
                {myStats.totalLearners >= 10 && (
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-500">
                    <Users className="w-3 h-3" />
                    <span>Rank #{myStats.rank} of {pluralize(myStats.totalLearners, "learner")}</span>
                  </div>
                )}
              </div>
            )}

            {/* Leaderboard List */}
            <div className="px-5 pb-5">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 rounded-lg bg-[oklch(0.12_0.003_250)] animate-pulse" />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No learners yet for this period.</p>
                  <p className="text-xs text-gray-600 mt-1">Complete lessons and quizzes to appear here!</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {entries.map((entry: any, i: number) => {
                    const isCurrentUser = user?.id === entry.userId;
                    const cert = CERT_BADGES[entry.certLevel] || CERT_BADGES.none;
                    const CertIcon = cert.icon;

                    return (
                      <motion.div
                        key={entry.userId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${getRankBg(entry.rank, isCurrentUser)}`}
                      >
                        {/* Rank */}
                        <div className="w-6 flex items-center justify-center shrink-0">
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
                              {pluralize(entry.lessonsCompleted, "lesson")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Award className="w-2.5 h-2.5" />
                              {pluralize(entry.quizzesPassed, "quiz", "quizzes")}
                            </span>
                          </div>
                        </div>

                        {/* XP */}
                        <div className="text-right shrink-0">
                          <div className={`text-sm font-bold font-mono ${entry.rank <= 3 ? "text-amber-400" : "text-gray-300"}`}>
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
                      <div className="flex items-center gap-2 py-1">
                        <div className="flex-1 border-t border-dashed border-gray-800" />
                        <span className="text-[9px] text-gray-600">···</span>
                        <div className="flex-1 border-t border-dashed border-gray-800" />
                      </div>
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-[oklch(0.55_0.12_155/8%)] border-[oklch(0.55_0.12_155/30%)]">
                        <div className="w-6 flex items-center justify-center shrink-0">
                          <span className="text-xs text-[oklch(0.55_0.12_155)] font-mono font-bold">{myStats.rank}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-[oklch(0.55_0.12_155)]">You</span>
                          <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-2.5 h-2.5" />
                              {pluralize(myStats.lessonsCompleted, "lesson")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Award className="w-2.5 h-2.5" />
                              {pluralize(myStats.quizzesPassed, "quiz", "quizzes")}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold font-mono text-[oklch(0.55_0.12_155)]">
                            {myStats.totalXP.toLocaleString()}
                          </div>
                          <div className="text-[9px] text-gray-600 uppercase">XP</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* XP Breakdown Legend */}
              <div className="mt-4 pt-3 border-t border-[oklch(0.15_0.004_250)]">
                <div className="flex items-center gap-1.5 text-[9px] text-gray-600 mb-1.5">
                  <Flame className="w-3 h-3" />
                  <span className="font-mono uppercase tracking-wider">How XP is earned</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-500">
                  <span>50 XP / lesson completed</span>
                  <span>25 XP / scenario completed</span>
                  <span>Quiz score bonus (2x multiplier)</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
