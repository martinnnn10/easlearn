/**
 * Job Board — technician-facing, competency-gated. You apply with PROVEN skill,
 * not a résumé. Jobs you qualify for (verified competency ≥ threshold) are
 * unlocked; others show exactly how much more competency you need.
 */
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Briefcase, MapPin, CheckCircle2, Lock, Loader2, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";

const DOMAIN_LABEL: Record<string, string> = {
  vfd: "VFD Diagnostics", plc: "PLC Diagnostics", motors: "Motor Control", safety: "Safety Circuits",
  electrical: "Electrical Power", networking: "Industrial Networking", sensors: "Sensors & Instrumentation", integration: "System Integration",
};

export default function JobBoard() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const jobs = trpc.jobs.list.useQuery(undefined, { enabled: isAuthenticated });
  const recs = trpc.intelligence.myRecommendations.useQuery(undefined, { enabled: isAuthenticated });
  const apply = trpc.jobs.applyToJob.useMutation();

  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] text-white flex items-center justify-center p-6">
        <div className="text-center">
          <Briefcase className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">Sign in to see jobs you qualify for by demonstrated skill.</p>
          <button onClick={() => navigate("/login")} className="rounded bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm">Sign in</button>
        </div>
      </div>
    );
  }

  const doApply = async (jobId: number) => {
    const res = await apply.mutateAsync({ jobId });
    if (res.ok) toast.success(res.already ? "Already applied" : "Applied with your verified competency");
    else if (res.reason === "underqualified") toast.error(`Build to ${res.required}% in this skill to apply (you're at ${res.yourCompetency}%)`);
    else toast.error("This role just closed");
    jobs.refetch();
  };

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white">
      <SEO title="Jobs" description="Industrial maintenance jobs matched to your demonstrated skill" path="/jobs" />
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"><Briefcase className="w-6 h-6 text-emerald-400" /> Jobs matched to your skill</h1>
        <p className="text-gray-500 text-sm mb-6">No résumé games. You qualify by what you've proven you can diagnose.</p>

        {/* Predictive nudge: jobs you're close to qualifying for */}
        {(recs.data?.almost.length ?? 0) > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 mb-6">
            <p className="text-amber-300 text-sm font-medium mb-1">
              You're close to {recs.data!.almost.length} more role{recs.data!.almost.length === 1 ? "" : "s"}.
            </p>
            <p className="text-gray-400 text-xs mb-2">
              The nearest: <span className="text-gray-200">{recs.data!.almost[0].title}</span> needs {recs.data!.almost[0].needed}% in {recs.data!.almost[0].domainLabel} — you're at {recs.data!.almost[0].yourScore}% ({recs.data!.almost[0].gap}% to go).
            </p>
            <button onClick={() => navigate("/daily")} className="inline-flex items-center gap-1.5 text-amber-400 text-xs hover:underline">
              Practice to close the gap <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {jobs.isLoading ? (
          <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading roles…</div>
        ) : (jobs.data?.length ?? 0) === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-2">No open roles yet.</p>
            <button onClick={() => navigate("/daily")} className="inline-flex items-center gap-1.5 text-emerald-400 text-sm hover:underline">
              Keep building competency <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.data!.map(j => (
              <div key={j.id} className={`rounded-lg border p-5 ${j.qualifies ? "border-emerald-500/30 bg-[#0d120d]" : "border-gray-800 bg-[#0c0f0c]"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-white font-semibold">{j.title}</h2>
                    <p className="text-gray-400 text-sm">{j.company}</p>
                    <p className="text-gray-500 text-xs mt-1 flex items-center gap-2">
                      <MapPin className="w-3 h-3" /> {j.remote ? "Remote" : j.location || "On-site"}
                      {(j.salaryMin || j.salaryMax) && <span>· ${j.salaryMin ?? "?"}k–${j.salaryMax ?? "?"}k</span>}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-wide text-gray-500 shrink-0">{DOMAIN_LABEL[j.requiredDomain] ?? j.requiredDomain}</span>
                </div>
                <p className="text-gray-400 text-sm mt-3 leading-relaxed line-clamp-3">{j.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`text-xs flex items-center gap-1.5 ${j.qualifies ? "text-emerald-400" : "text-amber-400"}`}>
                    {j.qualifies ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    You: {j.yourCompetency}% · needs {j.minCompetency}%
                  </span>
                  {j.applied ? (
                    <span className="text-xs text-gray-500">Applied ✓</span>
                  ) : j.qualifies ? (
                    <button onClick={() => doApply(j.id)} disabled={apply.isPending} className="rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-sm px-4 py-1.5">Apply with proof</button>
                  ) : (
                    <button onClick={() => navigate("/daily")} className="rounded border border-gray-700 hover:bg-gray-800 text-sm px-4 py-1.5">Build skill to unlock</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
