import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import SEO from "@/components/SEO";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FAULT_DOMAIN_LABELS, type FaultTileState } from "@shared/faultMastery";
import { Target, Loader2, Play, CheckCircle2, XCircle, Lock } from "lucide-react";

const TILE_STYLES: Record<FaultTileState, string> = {
  locked: "border-muted opacity-50",
  available: "border-primary/30 bg-primary/5",
  attempted: "border-yellow-500/40 bg-yellow-500/5",
  failed: "border-red-500/40 bg-red-500/5",
  mastered: "border-emerald-500/40 bg-emerald-500/5",
};

function TileIcon({ state }: { state: FaultTileState }) {
  if (state === "mastered") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (state === "failed") return <XCircle className="w-4 h-4 text-red-400" />;
  if (state === "locked") return <Lock className="w-4 h-4 text-muted-foreground" />;
  return <Play className="w-4 h-4 text-primary" />;
}

export default function FaultMasteryMap() {
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = trpc.faultCompetency.getUserMastery.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <Target className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-xl font-bold mb-2">Fault Mastery Map</h1>
          <p className="text-muted-foreground mb-4">Track which industrial faults you can diagnose.</p>
          <a href="/login"><Button>Sign In</Button></a>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO title="Fault Mastery Map" description="Your troubleshooting competency by fault type." path="/mastery" />
      <div className="min-h-screen bg-background py-10">
        <div className="container max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Target className="w-8 h-8 text-primary" />
                Fault Mastery Map
              </h1>
              <p className="text-muted-foreground mt-1">
                Faults mastered — not lessons watched.
              </p>
            </div>
            {data?.careerLevel && (
              <Badge className="text-sm px-3 py-1">{data.careerLevel.title}</Badge>
            )}
          </div>

          {isLoading ? (
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
                {data?.domainStats.map((d) => (
                  <Card key={d.domain}>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{FAULT_DOMAIN_LABELS[d.domain]}</p>
                      <p className="text-2xl font-bold">{d.percent}%</p>
                      <p className="text-xs text-muted-foreground">{d.mastered}/{d.total} faults</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Fault Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {data?.tiles.map((tile) => (
                      <div
                        key={tile.slug}
                        className={`p-4 rounded-lg border ${TILE_STYLES[tile.state]}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium leading-tight">{tile.title}</p>
                          <TileIcon state={tile.state} />
                        </div>
                        <p className="text-xs text-muted-foreground capitalize mb-2">
                          {tile.domain} · {tile.difficulty}
                        </p>
                        {tile.scenarioSlug && tile.state !== "mastered" && (
                          <Link href={`/simulator?scenario=${encodeURIComponent(tile.scenarioSlug)}`}>
                            <Button size="sm" variant="outline" className="w-full mt-1">
                              Practice Scenario
                            </Button>
                          </Link>
                        )}
                        {tile.state === "mastered" && tile.bestMethodology != null && (
                          <p className="text-xs text-emerald-400">Best: {tile.bestMethodology}% methodology</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="mt-6 flex gap-3">
                <Link href="/simulator"><Button>Go to Simulator</Button></Link>
                <Link href="/progress"><Button variant="outline">Methodology Details</Button></Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
