import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, Award, Clock, Users, BarChart3, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import SEO from "@/components/SEO";
import { pluralNoun } from "@/lib/pluralize";

export default function TeamProgress() {
  const { isAuthenticated } = useAuth();

  const progressQuery = trpc.team.getTeamProgress.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (progressQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  const data = progressQuery.data;

  if (!data) {
    return (
      <>
        <SEO title="Team Progress | EAS" description="View your team's training progress" />
        <div className="min-h-screen flex items-center justify-center px-4">
          <Card className="max-w-md w-full bg-zinc-900 border-zinc-800">
            <CardHeader className="text-center">
              <BarChart3 className="w-12 h-12 text-zinc-500 mx-auto mb-2" />
              <CardTitle className="text-white">No Team Found</CardTitle>
              <CardDescription>
                You need to be a team owner to view team progress.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </>
    );
  }

  const { team, memberProgress } = data;
  const avgCompletion = memberProgress.length > 0
    ? Math.round(memberProgress.reduce((sum, m) => sum + m.completionPercent, 0) / memberProgress.length)
    : 0;
  const totalCerts = memberProgress.reduce((sum, m) => sum + m.certificatesEarned, 0);
  const activeLastWeek = memberProgress.filter(m => {
    if (!m.lastActive) return false;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return new Date(m.lastActive).getTime() > weekAgo;
  }).length;

  return (
    <>
      <SEO title="Team Progress | EAS" description="View your team's training progress" />
      <div className="min-h-screen bg-zinc-950 py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white font-['Oswald']">
                Team Progress
              </h1>
              <p className="text-zinc-400 mt-1">{team.name} — Training Overview</p>
            </div>
            <Link href="/team">
              <Badge variant="outline" className="border-zinc-700 text-zinc-300 cursor-pointer hover:border-green-700">
                <Users className="w-3 h-3 mr-1" />
                Manage Team
              </Badge>
            </Link>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-900/30 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{avgCompletion}%</p>
                    <p className="text-sm text-zinc-400">Avg. Completion</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-900/30 rounded-lg">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{memberProgress.length}</p>
                    <p className="text-sm text-zinc-400">Active Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-900/30 rounded-lg">
                    <Award className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{totalCerts}</p>
                    <p className="text-sm text-zinc-400">Certificates Earned</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-900/30 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{activeLastWeek}</p>
                    <p className="text-sm text-zinc-400">Active This Week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Member Progress Table */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Member Progress</CardTitle>
                <CardDescription>Individual training completion for each team member</CardDescription>
              </div>
              {memberProgress.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-[oklch(0.18_0.004_250)] hover:border-[oklch(0.55_0.12_155/40%)] text-xs"
                  onClick={() => {
                    const headers = ["Name", "Email", "Completed Lessons", "Total Lessons", "Completion %", "Certificates Earned", "Last Active"];
                    const rows = memberProgress
                      .sort((a, b) => b.completionPercent - a.completionPercent)
                      .map(m => [
                        m.name,
                        m.email,
                        m.completedLessons,
                        m.totalLessons,
                        m.completionPercent,
                        m.certificatesEarned,
                        m.lastActive ? new Date(m.lastActive).toLocaleDateString() : "Never"
                      ]);
                    const csvContent = [headers, ...rows].map(row =>
                      row.map(cell => {
                        const str = String(cell);
                        return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
                      }).join(",")
                    ).join("\n");
                    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `${team.name.replace(/[^a-zA-Z0-9]/g, "_")}_progress_${new Date().toISOString().slice(0, 10)}.csv`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {memberProgress.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">
                  No active members yet. Invite your team from the{" "}
                  <Link href="/team" className="text-green-500 hover:underline">Team Dashboard</Link>.
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Header row */}
                  <div className="hidden md:grid grid-cols-12 gap-4 px-3 py-2 text-[11px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                    <div className="col-span-3">Member</div>
                    <div className="col-span-4">Progress</div>
                    <div className="col-span-2 text-center">Certificates</div>
                    <div className="col-span-3 text-right">Last Active</div>
                  </div>

                  {/* Member rows */}
                  {memberProgress
                    .sort((a, b) => b.completionPercent - a.completionPercent)
                    .map((member) => (
                    <div
                      key={member.userId}
                      className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-3 bg-zinc-800/50 rounded-lg items-center"
                    >
                      {/* Name & Email */}
                      <div className="md:col-span-3">
                        <p className="text-white font-medium text-sm">{member.name}</p>
                        <p className="text-zinc-500 text-xs truncate">{member.email}</p>
                      </div>

                      {/* Progress Bar */}
                      <div className="md:col-span-4">
                        <div className="flex items-center gap-3">
                          <Progress value={member.completionPercent} className="h-2 flex-1" />
                          <span className="text-sm text-white font-medium min-w-[3ch]">
                            {member.completionPercent}%
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          {member.completedLessons}/{member.totalLessons} {pluralNoun(member.totalLessons, "lesson")}
                        </p>
                      </div>

                      {/* Certificates */}
                      <div className="md:col-span-2 text-center">
                        {member.certificatesEarned > 0 ? (
                          <Badge variant="outline" className="border-yellow-700 text-yellow-400">
                            <Award className="w-3 h-3 mr-1" />
                            {member.certificatesEarned}
                          </Badge>
                        ) : (
                          <span className="text-zinc-600 text-sm">—</span>
                        )}
                      </div>

                      {/* Last Active */}
                      <div className="md:col-span-3 text-right">
                        <span className="text-sm text-zinc-400">
                          {member.lastActive
                            ? new Date(member.lastActive).toLocaleDateString()
                            : "Never"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
