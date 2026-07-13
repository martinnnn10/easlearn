import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import SEO from "@/components/SEO";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CERTIFICATION_LEVELS } from "@shared/certificationConfig";
import {
  Award,
  Shield,
  Star,
  Crown,
  Lock,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useState } from "react";

const LEVEL_ICONS: Record<string, React.ReactNode> = {
  apprentice: <Shield className="w-8 h-8" />,
  journeyman: <Star className="w-8 h-8" />,
  specialist: <Award className="w-8 h-8" />,
  master: <Crown className="w-8 h-8" />,
};

const LEVEL_STYLES: Record<string, { color: string; bgColor: string; borderColor: string }> = {
  apprentice: { color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/30" },
  journeyman: { color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30" },
  specialist: { color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/30" },
  master: { color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/30" },
};

export default function Certifications() {
  const { isAuthenticated } = useAuth();

  const progressQuery = trpc.certification.getMyProgress.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [claimFeedback, setClaimFeedback] = useState<{
    type: "success" | "info" | "error";
    message: string;
  } | null>(null);

  const claimMutation = trpc.certification.claimLevel.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setClaimFeedback({
          type: "success",
          message: `Certification earned! Verification code: ${data.verificationCode}`,
        });
        progressQuery.refetch();
      } else {
        setClaimFeedback({
          type: "info",
          message: data.message || "Could not claim certification",
        });
      }
    },
    onError: (err) => {
      setClaimFeedback({
        type: "error",
        message: err.message || "Failed to claim certification",
      });
    },
  });

  const earnedLevels = new Set<string>(
    progressQuery.data?.earnedCertifications?.map((c) => c.level) || [],
  );

  const isLevelEarned = (level: string) => earnedLevels.has(level);

  return (
    <>
      <SEO
        title="Certification & Progression"
        description="Verifiable troubleshooting competency credentials from Apprentice to Master."
        path="/certifications"
      />
      <div className="min-h-screen bg-background">
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4">
                <Award className="w-3.5 h-3.5 mr-1" />
                Diagnostic Competency
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                EAS Certification Path
              </h1>
              <p className="text-lg text-muted-foreground">
                Earn certifications by completing modules, passing capstone quizzes, and clearing
                real troubleshooting scenarios — not by watching videos.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container">
            <div className="max-w-4xl mx-auto space-y-8">
              {CERTIFICATION_LEVELS.map((level, index) => {
                const earned = isLevelEarned(level.id);
                const prevEarned = index === 0 || isLevelEarned(CERTIFICATION_LEVELS[index - 1].id);
                const styles = LEVEL_STYLES[level.id];

                return (
                  <Card key={level.id} className={`${styles.borderColor} ${earned ? "ring-1 ring-primary/30" : ""}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl ${styles.bgColor} ${styles.color}`}>
                            {LEVEL_ICONS[level.id]}
                          </div>
                          <div>
                            <CardTitle className="text-xl">{level.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">Level {index + 1} of 4</p>
                          </div>
                        </div>
                        {earned && (
                          <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Earned
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{level.description}</p>
                      <ul className="space-y-1.5 mb-5">
                        {level.requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            {earned ? (
                              <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-muted-foreground/30 mt-0.5 shrink-0" />
                            )}
                            {req}
                          </li>
                        ))}
                      </ul>
                      {isAuthenticated && !earned && (
                        <Button
                          onClick={() => claimMutation.mutate({ level: level.id })}
                          disabled={claimMutation.isPending || !prevEarned}
                        >
                          {claimMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : !prevEarned ? (
                            <Lock className="w-4 h-4 mr-2" />
                          ) : (
                            <Award className="w-4 h-4 mr-2" />
                          )}
                          {!prevEarned ? "Locked" : "Claim Certification"}
                        </Button>
                      )}
                      {claimFeedback && isAuthenticated && !earned && (
                        <div className="mt-2 px-3 py-2 rounded-md text-sm bg-muted/50">{claimFeedback.message}</div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="max-w-3xl mx-auto mt-16 text-center">
              <Card className="bg-muted/30">
                <CardContent className="p-8">
                  <ExternalLink className="w-8 h-8 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Verify a Certification</h3>
                  <p className="text-muted-foreground mb-4">
                    Works for module completion certificates and skill-level certifications.
                  </p>
                  <Link href="/verify-certificate">
                    <Button variant="outline">
                      Verify a Certificate
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
