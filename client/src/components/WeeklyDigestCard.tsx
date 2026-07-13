/**
 * WeeklyDigestCard — Shows a weekly activity summary on the Dashboard
 * Available to all users, shows platform-wide stats and the user's own weekly performance.
 * Admin users can trigger sending the digest notification.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Users,
  BookOpen,
  Award,
  Zap,
  Send,
  CheckCircle,
  BarChart3,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export function WeeklyDigestCard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Only admins can fetch the full digest
  const { data: digest, isLoading } = trpc.digest.getWeeklyDigest.useQuery(
    undefined,
    { enabled: isAdmin, retry: false, refetchOnWindowFocus: false }
  );

  // Per-user weekly stats from leaderboard
  const { data: myStats } = trpc.leaderboard.getMyStats.useQuery(
    { period: "week" },
    { retry: false, refetchOnWindowFocus: false }
  );

  const sendDigestMutation = trpc.digest.sendWeeklyDigest.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Weekly digest sent to your notifications.");
      } else {
        toast.error("Failed to send digest. Check notification settings.");
      }
    },
    onError: () => {
      toast.error("Error sending digest.");
    },
  });

  // RBAC: Non-admin users only see their own weekly stats
  // Admin-only sections (Platform Stats, Top Learners, Send Digest) are gated by isAdmin
  if (!isAdmin && !myStats) {
    return null;
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-emerald-500" />
          Weekly Activity Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User's own weekly stats */}
        {myStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox
              icon={<Zap className="h-4 w-4 text-yellow-500" />}
              label="Your XP"
              value={myStats.totalXP}
              suffix="XP"
            />
            <StatBox
              icon={<BookOpen className="h-4 w-4 text-blue-500" />}
              label="Lessons"
              value={myStats.lessonsCompleted}
            />
            <StatBox
              icon={<Award className="h-4 w-4 text-purple-500" />}
              label="Quizzes"
              value={myStats.quizzesPassed}
            />
            <StatBox
              icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
              label="Your Rank"
              value={`#${myStats.rank}`}
              suffix={`of ${myStats.totalLearners}`}
            />
          </div>
        )}

        {/* Admin-only: Platform digest */}
        {isAdmin && digest && (
          <>
            <div className="border-t border-border/50 pt-3 mt-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">
                Platform Stats ({digest.periodStart} – {digest.periodEnd})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatBox
                  icon={<Users className="h-4 w-4 text-cyan-500" />}
                  label="Active Learners"
                  value={digest.totalActiveLearners}
                />
                <StatBox
                  icon={<Users className="h-4 w-4 text-green-500" />}
                  label="New Signups"
                  value={digest.newUsersThisWeek}
                />
                <StatBox
                  icon={<BookOpen className="h-4 w-4 text-blue-500" />}
                  label="Lessons Done"
                  value={digest.totalLessonsCompleted}
                />
                <StatBox
                  icon={<Award className="h-4 w-4 text-purple-500" />}
                  label="Quizzes Passed"
                  value={digest.totalQuizzesPassed}
                />
                <StatBox
                  icon={<Zap className="h-4 w-4 text-yellow-500" />}
                  label="Total XP"
                  value={digest.platformTotalXP}
                />
                {digest.mostActiveModule && (
                  <StatBox
                    icon={<CheckCircle className="h-4 w-4 text-emerald-500" />}
                    label="Top Module"
                    value={digest.mostActiveModule}
                    isText
                  />
                )}
              </div>
            </div>

            {/* Top learners preview */}
            {digest.topLearners.length > 0 && (
              <div className="border-t border-border/50 pt-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-medium">
                  Top Learners This Week
                </p>
                <div className="space-y-1.5">
                  {digest.topLearners.slice(0, 3).map((learner, idx) => (
                    <div
                      key={learner.userId}
                      className="flex items-center justify-between text-sm py-1 px-2 rounded bg-muted/30"
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground w-5">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                        </span>
                        <span className="font-medium truncate max-w-[140px]">
                          {learner.userName}
                        </span>
                      </span>
                      <span className="text-emerald-500 font-semibold text-xs">
                        {learner.totalXP} XP
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Send digest button */}
            <div className="border-t border-border/50 pt-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => sendDigestMutation.mutate()}
                disabled={sendDigestMutation.isPending}
              >
                {sendDigestMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Digest Notification
              </Button>
            </div>
          </>
        )}

        {isAdmin && isLoading && (
          <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading platform stats...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatBox({
  icon,
  label,
  value,
  suffix,
  isText,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  suffix?: string;
  isText?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 p-2 rounded-lg bg-muted/20 border border-border/30">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`font-bold ${isText ? "text-xs" : "text-lg"} text-foreground`}>
          {value}
        </span>
        {suffix && <span className="text-[10px] text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}
