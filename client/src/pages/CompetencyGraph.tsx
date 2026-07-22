/**
 * My Competency Graph — the demonstrated capability profile, now sourced from the
 * Assessment Spine (assessment.myReadiness). One evidence model: lesson reasoning,
 * simulator methodology, spaced review, manager validation, decay, and safety —
 * with the audit trail of WHY each competency is where it is. "Demonstrated, not
 * declared." No vanity completion.
 */
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Activity, Loader2, ShieldCheck, AlertTriangle, Award, ShieldAlert, ArrowRight, Cpu, GraduationCap } from "lucide-react";
import SEO from "@/components/SEO";
import CompetencyPreview from "@/components/previews/CompetencyPreview";
import PreviewFrame from "@/components/previews/PreviewFrame";
import CommunicationReadinessView from "@/components/CommunicationReadinessView";

const READINESS_STYLE: Record<string, string> = {
  "Promotion Candidate": "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  Ready: "text-emerald-300 border-emerald-500/30 bg-emerald-500/5",
  "Needs Manager Validation": "text-sky-300 border-sky-500/30 bg-sky-500/5",
  "Almost Ready": "text-amber-300 border-amber-500/25 bg-amber-500/5",
  "Needs Review": "text-amber-300 border-amber-500/30 bg-amber-500/10",
  "Needs Training": "text-red-300 border-red-500/30 bg-red-500/5",
  "Needs Safety Review": "text-red-200 border-red-500/50 bg-red-500/15",
  "Not Demonstrated": "text-gray-600 border-gray-800 bg-transparent",
};

const AUDIT_TONE: Record<string, string> = {
  improve: "text-emerald-400", confirm: "text-emerald-300/80", ready_for_validation: "text-sky-300",
  needs_review: "text-amber-400", weaken: "text-amber-400", unsafe: "text-red-400",
};

export default function CompetencyGraph() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const rq = trpc.assessment.myReadiness.useQuery(undefined, { enabled: isAuthenticated });

  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] text-white">
        <SEO title="Competency Graph — Demonstrated Capability" description="See how EASLearn measures demonstrated maintenance competency: methodology tier, diagnostic confidence, domain readiness, decay, safety, and manager validation." path="/competency" />
        <PreviewFrame title="Competency Graph" subtitle="Demonstrated, not declared — built from how an operator actually diagnoses. The profile shown below is sample data.">
          <CompetencyPreview />
        </PreviewFrame>
      </div>
    );
  }

  const data = rq.data;
  const domains = data?.readiness ?? [];
  const withEvidence = domains.filter((d) => d.attempts > 0 || d.managerValidated || d.hasSafetyViolation);
  const rest = domains.filter((d) => !(d.attempts > 0 || d.managerValidated || d.hasSafetyViolation));

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white">
      <SEO title="My Competency Graph" description="Your demonstrated industrial capability — evidence-based readiness." path="/competency" />
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="w-6 h-6 text-emerald-400" /> Competency Graph</h1>
          {data && data.hasEvidence && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-800 text-gray-200 text-xs px-3 py-1 border border-gray-700"><GraduationCap className="w-3.5 h-3.5 text-emerald-400" /> {data.methodologyTier}</span>
              {data.promotionReady && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs px-3 py-1 border border-emerald-500/30"><Award className="w-3.5 h-3.5" /> Promotion-ready</span>}
            </div>
          )}
        </div>
        <p className="text-gray-500 text-sm mb-6">Readiness from demonstrated evidence — lessons, simulations, spaced review, and floor validation. Not completion.</p>

        {rq.isLoading ? (
          <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Building your graph…</div>
        ) : !data || !data.hasEvidence ? (
          <div className="rounded-xl border border-gray-800 bg-[#0d120d] p-8 text-center">
            <Activity className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-300 mb-1">No demonstrated competency yet.</p>
            <p className="text-gray-500 text-sm mb-5">Complete a lesson, lab, or review to generate evidence — your readiness is built from what you actually do.</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button onClick={() => navigate("/labs?entry=competency&mode=practice#conveyor-troubleshoot")} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold"><Cpu className="w-4 h-4" /> Diagnose a fault</button>
              <button onClick={() => navigate("/courses")} className="inline-flex items-center gap-2 rounded-lg border border-gray-700 hover:bg-gray-800 px-5 py-2.5 text-sm">Browse lessons <ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {[...withEvidence, ...rest].map((d) => (
              <div key={d.domain} className={`rounded-lg border p-4 ${d.attempts > 0 || d.managerValidated || d.hasSafetyViolation ? "border-gray-800 bg-[#0d120d]" : "border-gray-800/50 bg-transparent"}`}>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium">{d.label}</span>
                    <span className={`text-[10px] uppercase tracking-wide rounded border px-1.5 py-0.5 ${READINESS_STYLE[d.level] ?? READINESS_STYLE["Not Demonstrated"]}`}>{d.level}</span>
                    {d.managerValidated && <span title="Manager-validated on the floor"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /></span>}
                    {d.hasSafetyViolation && <span title="Safety flag on record"><ShieldAlert className="w-3.5 h-3.5 text-red-400" /></span>}
                  </div>
                  {d.attempts > 0 && <span className="text-emerald-400 font-mono text-lg">{d.confidence}%</span>}
                </div>
                {d.attempts === 0 && !d.managerValidated && !d.hasSafetyViolation ? (
                  <p className="text-gray-600 text-xs">Not demonstrated yet — run a scenario or lesson in this domain.</p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500 mb-2">
                      <span>{d.attempts} demonstration{d.attempts === 1 ? "" : "s"} of evidence</span>
                      {d.needsReviewCount > 0 && <span className="text-amber-400">{d.needsReviewCount} needs review</span>}
                      {d.decay !== "fresh" && (
                        <span className={`flex items-center gap-1 ${d.decay === "decayed" ? "text-red-400" : "text-amber-400"}`}>
                          <AlertTriangle className="w-3 h-3" /> {d.decay === "decayed" ? "needs refresh" : "getting stale"}
                        </span>
                      )}
                    </div>
                    {/* Audit trail — why this readiness is what it is */}
                    {d.recentAudit.length > 0 && (
                      <ul className="space-y-1 border-t border-gray-800/70 pt-2">
                        {d.recentAudit.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-[11px]">
                            <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${a.direction === "unsafe" ? "bg-red-400" : a.direction === "needs_review" || a.direction === "weaken" ? "bg-amber-400" : "bg-emerald-400"}`} />
                            <span className={AUDIT_TONE[a.direction] ?? "text-gray-500"}>{a.reason} <span className="text-gray-600">· {a.sourceType}</span></span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Maintenance Communication — visible job-readiness signal */}
        {data && data.communication.hasEvidence && (
          <div className="mt-8">
            <CommunicationReadinessView data={data.communication} compact />
          </div>
        )}
      </div>
    </div>
  );
}
