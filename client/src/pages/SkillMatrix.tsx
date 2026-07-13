import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import SEO from "@/components/SEO";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SKILL_DOMAIN_LABELS, type SkillDomain } from "@shared/competencyMatrix";
import { ArrowLeft, BarChart3, Users, Loader2 } from "lucide-react";

const SKILL_AREAS: Array<{ id: SkillDomain; label: string; short: string }> = [
  { id: "vfd", label: "VFD", short: "VFD" },
  { id: "plc", label: "PLC", short: "PLC" },
  { id: "motors", label: "Motors", short: "MTR" },
  { id: "safety", label: "Safety", short: "SAF" },
  { id: "electrical", label: "Electrical", short: "ELC" },
  { id: "networking", label: "Network", short: "NET" },
  { id: "sensors", label: "Sensors", short: "SNS" },
  { id: "integration", label: "Integration", short: "INT" },
];

function getSkillColor(score: number): string {
  if (score === 0) return "bg-red-500/20 text-red-400";
  if (score < 40) return "bg-orange-500/20 text-orange-400";
  if (score < 70) return "bg-yellow-500/20 text-yellow-400";
  return "bg-emerald-500/20 text-emerald-400";
}

export default function SkillMatrix() {
  const { isAuthenticated } = useAuth();
  const teamQuery = trpc.team.getMyTeam.useQuery(undefined, { enabled: isAuthenticated });
  const progressQuery = trpc.team.getTeamProgress.useQuery(undefined, {
    enabled: isAuthenticated && !!teamQuery.data,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="mb-4 text-muted-foreground">Sign in to view team skill matrix.</p>
            <a href="/login"><Button>Sign In</Button></a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!teamQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="mb-4 text-muted-foreground">Team plan required for skill matrix.</p>
            <Link href="/pricing"><Button>View Team Plans</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const members = progressQuery.data?.memberProgress ?? [];

  const memberSkills = members.map((member: {
    userName?: string;
    name?: string;
    moduleProgress?: Array<{
      skillDomain: SkillDomain;
      completedLessons: number;
      totalLessons: number;
    }>;
    scenariosCompleted?: number;
  }) => {
    const skills: Record<SkillDomain, number> = {
      vfd: 0, plc: 0, motors: 0, safety: 0, electrical: 0, networking: 0, sensors: 0, integration: 0,
    };
    const totals: Record<SkillDomain, number> = { ...skills };

    for (const mp of member.moduleProgress ?? []) {
      const domain = mp.skillDomain;
      totals[domain] += mp.totalLessons;
      skills[domain] += mp.completedLessons;
    }

    const pct: Record<string, number> = {};
    for (const area of SKILL_AREAS) {
      const total = totals[area.id];
      pct[area.id] = total > 0 ? Math.min(100, Math.round((skills[area.id] / total) * 100)) : 0;
    }

    return {
      name: member.userName || member.name || "Team Member",
      skills: pct,
      scenariosCompleted: member.scenariosCompleted ?? 0,
    };
  });

  const teamAverages = SKILL_AREAS.map((area) => {
    if (memberSkills.length === 0) return { ...area, avg: 0 };
    const sum = memberSkills.reduce((acc, m) => acc + (m.skills[area.id] || 0), 0);
    return { ...area, avg: Math.round(sum / memberSkills.length) };
  });

  return (
    <>
      <SEO title="Team Skill Matrix" description="Fault-domain progress by team member." path="/team/skills" />
      <div className="min-h-screen bg-background py-8">
        <div className="container max-w-5xl">
          <Link href="/team" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6 hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Team
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Team Skill Matrix</h1>
              <p className="text-sm text-muted-foreground">Per-domain lesson progress + scenario completions</p>
            </div>
          </div>

          {progressQuery.isLoading ? (
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          ) : (
            <>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="text-lg">Team Averages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {teamAverages.map((area) => (
                      <div key={area.id} className={`p-3 rounded-lg text-center ${getSkillColor(area.avg)}`}>
                        <p className="text-xs font-mono">{area.short}</p>
                        <p className="text-xl font-bold">{area.avg}%</p>
                        <p className="text-[10px] opacity-80">{SKILL_DOMAIN_LABELS[area.id]}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {memberSkills.map((member, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{member.name}</span>
                        </div>
                        <Badge variant="outline">{member.scenariosCompleted} scenarios cleared</Badge>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {SKILL_AREAS.map((area) => (
                          <div key={area.id} className={`p-2 rounded text-center text-xs ${getSkillColor(member.skills[area.id] || 0)}`}>
                            <div className="font-mono">{area.short}</div>
                            <div className="font-bold">{member.skills[area.id] || 0}%</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
