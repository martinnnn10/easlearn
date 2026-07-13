import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import SEO from "@/components/SEO";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, ClipboardList, Copy, Loader2, UserCheck } from "lucide-react";

export default function HireReadyDashboard() {
  const { isAuthenticated } = useAuth();
  const { data: packs } = trpc.hireReady.listPacks.useQuery(undefined, { enabled: isAuthenticated });
  const { data: assessments, refetch, isLoading } = trpc.hireReady.listForTeam.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [showCreate, setShowCreate] = useState(false);
  const [packSlug, setPackSlug] = useState("imt-core");
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [position, setPosition] = useState("");

  const createMutation = trpc.hireReady.createFromPack.useMutation({
    onSuccess: (data) => {
      toast.success("Assessment created");
      const url = `${window.location.origin}${data.assessmentUrl}`;
      navigator.clipboard.writeText(url).catch(() => {});
      setShowCreate(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <p className="mb-4">Team admin sign-in required.</p>
          <a href="/login"><Button>Sign In</Button></a>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO title="HireReady" description="Technician competency assessments for employers." path="/hire-ready" />
      <div className="min-h-screen bg-background py-10">
        <div className="container max-w-4xl">
          <Link href="/team" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Team
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <UserCheck className="w-8 h-8 text-primary" />
                HireReady™
              </h1>
              <p className="text-muted-foreground">Prove technician competency — not resume keywords.</p>
            </div>
            <Button onClick={() => setShowCreate(!showCreate)}>New Assessment</Button>
          </div>

          {showCreate && (
            <Card className="mb-8">
              <CardHeader><CardTitle>Create Assessment</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Assessment Pack</Label>
                  <select
                    className="w-full mt-1 p-2 rounded-md border bg-background"
                    value={packSlug}
                    onChange={(e) => setPackSlug(e.target.value)}
                  >
                    {(packs ?? []).map((p) => (
                      <option key={p.slug} value={p.slug}>{p.title}</option>
                    ))}
                    {!packs?.length && (
                      <>
                        <option value="imt-core">HireReady IMT-Core</option>
                        <option value="et-standard">HireReady ET-Standard</option>
                        <option value="ct-plus">HireReady CT-Plus</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <Label>Candidate Name</Label>
                  <Input value={candidateName} onChange={(e) => setCandidateName(e.target.value)} />
                </div>
                <div>
                  <Label>Candidate Email</Label>
                  <Input type="email" value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)} />
                </div>
                <div>
                  <Label>Position (optional)</Label>
                  <Input value={position} onChange={(e) => setPosition(e.target.value)} />
                </div>
                <Button
                  disabled={createMutation.isPending || !candidateName || !candidateEmail}
                  onClick={() => createMutation.mutate({
                    packSlug,
                    candidateName,
                    candidateEmail,
                    position: position || undefined,
                  })}
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create & Copy Link"}
                </Button>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          ) : (
            <div className="space-y-3">
              {(assessments ?? []).length === 0 && (
                <p className="text-muted-foreground text-center py-8">No assessments yet. Create one above.</p>
              )}
              {(assessments ?? []).map((a) => {
                const avg = a.results?.length
                  ? Math.round(a.results.reduce((s, r) => s + r.percentage, 0) / a.results.length)
                  : null;
                const url = `${window.location.origin}/assessment/${a.token}`;
                return (
                  <Card key={a.id}>
                    <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{a.candidateName}</p>
                        <p className="text-sm text-muted-foreground">{a.candidateEmail} · {a.packSlug || "custom"}</p>
                        <Badge variant="outline" className="mt-1 capitalize">{a.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {avg != null && <span className="text-lg font-bold">{avg}%</span>}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(url);
                            toast.success("Link copied");
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Link href={`/hire-ready/${a.id}`}>
                          <Button size="sm" variant="outline">
                            <ClipboardList className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
