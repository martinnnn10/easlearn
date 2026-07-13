import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function HireReadyResult() {
  const params = useParams<{ id: string }>();
  const assessmentId = Number(params.id);

  const { data, isLoading } = trpc.hireReady.getResult.useQuery(
    { assessmentId },
    { enabled: Number.isFinite(assessmentId) && assessmentId > 0 },
  );

  const recColors = {
    hire: "bg-emerald-500/20 text-emerald-400",
    hold: "bg-yellow-500/20 text-yellow-400",
    no_hire: "bg-red-500/20 text-red-400",
  };

  return (
    <>
      <SEO title="HireReady Result" description="Candidate assessment results." path={`/hire-ready/${params.id}`} />
      <div className="min-h-screen bg-background py-10">
        <div className="container max-w-3xl">
          <Link href="/hire-ready" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> HireReady
          </Link>

          {isLoading ? (
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          ) : !data ? (
            <p>Assessment not found.</p>
          ) : (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>{data.assessment.candidateName}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {data.pack?.title ?? data.assessment.packSlug} · {data.assessment.candidateEmail}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4 items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Overall Score</p>
                    <p className="text-3xl font-bold">{data.averageScore}%</p>
                  </div>
                  {data.hireRecommendation && (
                    <Badge className={recColors[data.hireRecommendation as keyof typeof recColors]}>
                      {data.hireRecommendation.replace("_", " ").toUpperCase()}
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Scenario Results</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {data.results.map((r) => (
                    <div key={r.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                      <span className="text-sm">{r.scenarioTitle}</span>
                      <span className="font-bold">{r.percentage}%</span>
                    </div>
                  ))}
                  {data.results.length === 0 && (
                    <p className="text-muted-foreground text-sm">Candidate has not completed scenarios yet.</p>
                  )}
                </CardContent>
              </Card>

              {data.assessment.remediationToken && (
                <div className="mt-4">
                  <Link href={`/simulator`}>
                    <Button variant="outline">View Remediation Scenarios</Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
