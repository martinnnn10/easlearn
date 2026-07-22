/**
 * Manager Dashboard — the decision tool, now sourced from the Assessment Spine
 * (assessment.teamReadiness). One evidence model across the product: readiness
 * reflects demonstrated lesson reasoning, simulator methodology, spaced review,
 * decay, safety, and manager validation — with a visible rationale for every
 * status so a manager understands WHY.
 */
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Users, Loader2, Award, Zap, AlertTriangle, TrendingDown, ShieldCheck, ShieldAlert, BadgeCheck, MessageSquare } from "lucide-react";
import SEO from "@/components/SEO";
import AssignTraining from "@/components/AssignTraining";
import { SKILL_DOMAIN_LABELS, type SkillDomain } from "@shared/competencyMatrix";
import { COMMUNICATION_VALIDATION_OPTIONS, communicationDomainKey } from "@shared/assessmentSpine";
import ManagerDashboardPreview from "@/components/previews/ManagerDashboardPreview";
import PreviewFrame from "@/components/previews/PreviewFrame";

const DOMAINS = Object.keys(SKILL_DOMAIN_LABELS) as SkillDomain[];

interface Row {
  userId: number; name: string; domain: string; label: string; level: string;
  confidence: number; decay: string; hasSafety: boolean; needsReview: number; audit: string;
}

const LEVEL_COLOR: Record<string, string> = {
  "Promotion Candidate": "text-emerald-300", Ready: "text-emerald-400", "Needs Manager Validation": "text-sky-300",
  "Almost Ready": "text-amber-300", "Needs Review": "text-amber-400", "Needs Training": "text-red-400", "Needs Safety Review": "text-red-300",
};

export default function ManagerDashboard() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const team = trpc.assessment.teamReadiness.useQuery(undefined, { enabled: isAuthenticated });
  const validate = trpc.competencyGraph.validate.useMutation();

  const members = team.data?.members ?? [];

  // Communication attestation form (reuses the manager-validation write path).
  const [attestUser, setAttestUser] = useState("");
  const [attestArea, setAttestArea] = useState("");
  const [attestNote, setAttestNote] = useState("");
  const attestCommunication = async () => {
    if (!attestUser || !attestArea || !attestNote.trim()) return;
    await validate.mutateAsync({ userId: Number(attestUser), domain: communicationDomainKey(attestArea), note: attestNote.trim() });
    const label = COMMUNICATION_VALIDATION_OPTIONS.find((o) => o.key === attestArea)?.label ?? attestArea;
    const who = members.find((m) => m.userId === Number(attestUser))?.name ?? "technician";
    toast.success(`Attested ${label} for ${who}`);
    setAttestArea("");
    setAttestNote("");
    team.refetch();
  };

  const insights = useMemo(() => {
    const rows: Row[] = [];
    for (const m of members) {
      for (const r of m.readiness) {
        if (!(r.attempts > 0 || r.managerValidated || r.hasSafetyViolation)) continue;
        rows.push({
          userId: m.userId, name: m.name, domain: r.domain, label: r.label, level: r.level,
          confidence: r.confidence, decay: r.decay, hasSafety: r.hasSafetyViolation, needsReview: r.needsReviewCount,
          audit: r.recentAudit[0]?.reason ?? "",
        });
      }
    }
    const promotion = members.filter((m) => m.readiness.some((r) => r.level === "Promotion Candidate"));
    const safetyRisk = rows.filter((r) => r.hasSafety || r.level === "Needs Safety Review");
    const needsValidation = rows.filter((r) => r.level === "Needs Manager Validation");
    const needsTraining = rows.filter((r) => r.level === "Needs Training");
    const needsReview = rows.filter((r) => r.level === "Needs Review" || (r.decay !== "fresh"));
    // Weakest domains across the team (avg confidence where demonstrated).
    const weakest = DOMAINS.map((d) => {
      const vals = rows.filter((r) => r.domain === d).map((r) => r.confidence);
      return { domain: d, avg: vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null, n: vals.length };
    }).filter((x) => x.avg != null).sort((a, b) => (a.avg! - b.avg!));
    // Communication readiness (job-readiness proof from the closeout loop).
    const STRONG = ["Ready", "Promotion Candidate", "Needs Manager Validation", "Almost Ready"];
    const commStrong = members.filter((m) => m.communication.hasEvidence && STRONG.includes(m.communication.overall.level));
    const commSafetyRisk = members.filter((m) => m.communication.safetyCommunicationRisk);
    const weakArea = (key: string) =>
      members.filter((m) => {
        const a = m.communication.areas.find((x) => x.key === key);
        return a && a.attempts > 0 && (a.level === "Needs Training" || a.level === "Needs Review");
      });
    const needsWorkOrderCoaching = weakArea("work_order");
    const needsOperatorCoaching = weakArea("operator_communication");
    const anyComm = members.some((m) => m.communication.hasEvidence);

    return { rows, promotion, safetyRisk, needsValidation, needsTraining, needsReview, weakest, commStrong, commSafetyRisk, needsWorkOrderCoaching, needsOperatorCoaching, anyComm };
  }, [members]);

  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] text-white">
        <SEO title="Manager Dashboard — Workforce Competency at a Glance" description="See who's ready, who needs review, who has a safety risk, and where your team's skill gaps are — from one evidence model." path="/manager" />
        <PreviewFrame title="Manager Dashboard" subtitle="Workforce competency, demonstrated — decisions, not just reports. The team shown below is sample data.">
          <ManagerDashboardPreview />
        </PreviewFrame>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white">
      <SEO title="Manager Dashboard" description="Workforce competency decisions at a glance — from the Assessment Spine." path="/manager" />
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-emerald-400" /> Manager Dashboard</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/manage")} className="text-xs rounded border border-gray-700 hover:bg-gray-800 px-3 py-1.5">← Manager Hub</button>
            <button onClick={() => navigate("/planner")} className="text-xs rounded bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5">Plan a project →</button>
          </div>
        </div>
        <p className="text-gray-500 text-sm mb-6">Readiness from demonstrated evidence — one model across lessons, simulations, review, and floor validation.</p>

        {team.isLoading ? (
          <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading your team…</div>
        ) : team.data && !team.data.isManager ? (
          <p className="text-gray-500 text-sm">You don't manage a team yet. Create one in Team settings to see workforce competency here.</p>
        ) : members.length === 0 ? (
          <p className="text-gray-500 text-sm">No team members yet. As your team completes lessons, labs, and reviews, their demonstrated readiness appears here.</p>
        ) : insights.rows.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-[#0d120d] p-8 text-center">
            <Users className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-300 mb-1">No demonstrated competency yet.</p>
            <p className="text-gray-500 text-sm">Your team's readiness is built from evidence — have them complete a lesson, lab, or review to generate it.</p>
          </div>
        ) : (
          <>
            {/* Safety first — always visible */}
            {insights.safetyRisk.length > 0 && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 mb-4">
                <h3 className="text-sm font-semibold text-red-200 flex items-center gap-2 mb-2"><ShieldAlert className="w-4 h-4" /> Safety risk ({insights.safetyRisk.length}) — review before any readiness call</h3>
                <ul className="text-sm text-red-100/90 space-y-1">{insights.safetyRisk.slice(0, 8).map((s, i) => <li key={i}><span className="font-medium">{s.name}</span> · {s.label}<span className="block text-[11px] text-red-200/70">{s.audit}</span></li>)}</ul>
              </div>
            )}

            {/* Decision cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="rounded-lg border border-emerald-500/25 bg-[#0d120d] p-4">
                <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-2 mb-2"><Award className="w-4 h-4" /> Promotion-ready ({insights.promotion.length})</h3>
                {insights.promotion.length === 0 ? <p className="text-gray-600 text-xs">None yet — needs expert-level, repeated, manager-validated evidence.</p> : (
                  <ul className="text-sm text-gray-200 space-y-1">{insights.promotion.map((m) => <li key={m.userId} className="flex justify-between"><span>{m.name}</span><span className="text-emerald-400 text-xs">{m.methodologyTier} · {m.overallConfidence}%</span></li>)}</ul>
                )}
              </div>
              <div className="rounded-lg border border-sky-500/25 bg-[#0d120d] p-4">
                <h3 className="text-sm font-semibold text-sky-300 flex items-center gap-2 mb-2"><BadgeCheck className="w-4 h-4" /> Needs manager validation ({insights.needsValidation.length})</h3>
                {insights.needsValidation.length === 0 ? <p className="text-gray-600 text-xs">Nothing awaiting sign-off.</p> : (
                  <ul className="text-sm text-gray-300 space-y-1">{insights.needsValidation.slice(0, 6).map((s, i) => <li key={i} className="flex justify-between"><span>{s.name} · {s.label}</span><span className="text-sky-300 text-xs">{s.confidence}%</span></li>)}</ul>
                )}
              </div>
              <div className="rounded-lg border border-red-500/25 bg-[#0d120d] p-4">
                <h3 className="text-sm font-semibold text-red-300 flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4" /> Needs training ({insights.needsTraining.length})</h3>
                {insights.needsTraining.length === 0 ? <p className="text-gray-600 text-xs">No one is below competent.</p> : (
                  <ul className="text-sm text-gray-300 space-y-1">{insights.needsTraining.slice(0, 6).map((s, i) => <li key={i} className="flex justify-between"><span>{s.name} · {s.label}</span><span className="text-red-400 text-xs">{s.confidence}%</span></li>)}</ul>
                )}
              </div>
              <div className="rounded-lg border border-amber-500/25 bg-[#0d120d] p-4">
                <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4" /> Needs review / decaying ({insights.needsReview.length})</h3>
                {insights.needsReview.length === 0 ? <p className="text-gray-600 text-xs">All competencies fresh.</p> : (
                  <ul className="text-sm text-gray-300 space-y-1">{insights.needsReview.slice(0, 6).map((s, i) => <li key={i} className="flex justify-between"><span>{s.name} · {s.label}</span><span className="text-amber-400 text-xs">{s.decay !== "fresh" ? s.decay : "review"}</span></li>)}</ul>
                )}
              </div>
            </div>

            {/* Weakest domains across the team */}
            <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-emerald-400" /> Weakest domains (team average)</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                {insights.weakest.slice(0, 6).map((w) => (
                  <li key={w.domain} className="flex justify-between"><span className="text-gray-400">{SKILL_DOMAIN_LABELS[w.domain as SkillDomain]}</span><span className={`${w.avg! >= 70 ? "text-emerald-400" : w.avg! >= 50 ? "text-amber-400" : "text-red-400"}`}>{w.avg}% · {w.n} tech</span></li>
                ))}
              </ul>
            </div>

            {/* Team communication readiness — can they explain, document, hand off? */}
            {insights.anyComm && (
              <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-3"><MessageSquare className="w-4 h-4 text-emerald-400" /> Maintenance communication readiness</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-emerald-300 text-xs font-semibold mb-1">Strong communicators ({insights.commStrong.length})</div>
                    {insights.commStrong.length === 0 ? <p className="text-gray-600 text-xs">None yet.</p> : <p className="text-gray-300 text-xs">{insights.commStrong.map((m) => m.name).join(", ")}</p>}
                  </div>
                  <div>
                    <div className="text-red-300 text-xs font-semibold mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Safety communication risk ({insights.commSafetyRisk.length})</div>
                    {insights.commSafetyRisk.length === 0 ? <p className="text-gray-600 text-xs">None flagged.</p> : <p className="text-red-200/90 text-xs">{insights.commSafetyRisk.map((m) => m.name).join(", ")}</p>}
                  </div>
                  <div>
                    <div className="text-amber-300 text-xs font-semibold mb-1">Needs work-order coaching ({insights.needsWorkOrderCoaching.length})</div>
                    {insights.needsWorkOrderCoaching.length === 0 ? <p className="text-gray-600 text-xs">Notes are clear.</p> : <p className="text-gray-300 text-xs">{insights.needsWorkOrderCoaching.map((m) => m.name).join(", ")}</p>}
                  </div>
                  <div>
                    <div className="text-amber-300 text-xs font-semibold mb-1">Needs operator-communication coaching ({insights.needsOperatorCoaching.length})</div>
                    {insights.needsOperatorCoaching.length === 0 ? <p className="text-gray-600 text-xs">Talking to operators well.</p> : <p className="text-gray-300 text-xs">{insights.needsOperatorCoaching.map((m) => m.name).join(", ")}</p>}
                  </div>
                </div>
                {/* Attest on the floor — reuses the manager-validation write path */}
                <div className="mt-4 border-t border-gray-800 pt-3">
                  <div className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1.5"><BadgeCheck className="w-3.5 h-3.5 text-emerald-400" /> Attest communication skill (floor observation)</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select value={attestUser} onChange={(e) => setAttestUser(e.target.value)} className="bg-[#0a0f0a] border border-gray-700 rounded text-xs px-2 py-1.5">
                      <option value="">Technician…</option>
                      {members.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}
                    </select>
                    <select value={attestArea} onChange={(e) => setAttestArea(e.target.value)} className="bg-[#0a0f0a] border border-gray-700 rounded text-xs px-2 py-1.5">
                      <option value="">Area…</option>
                      {COMMUNICATION_VALIDATION_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                    </select>
                    <input
                      value={attestNote}
                      onChange={(e) => setAttestNote(e.target.value)}
                      placeholder="What you observed or reviewed (required)"
                      className="flex-1 min-w-[200px] bg-[#0a0f0a] border border-gray-700 rounded text-xs px-2 py-1.5 text-gray-200"
                    />
                    <button
                      type="button"
                      disabled={!attestUser || !attestArea || !attestNote.trim() || validate.isPending}
                      onClick={attestCommunication}
                      className="rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs px-3 py-1.5"
                    >
                      Validate on floor
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1.5">Attest only what you actually observed or reviewed. Validation strengthens readiness (Almost Ready → Ready) but never clears a safety flag.</p>
                </div>
                <p className="text-[11px] text-gray-600 mt-3">A technician who can't explain, document, or hand off a fault causes repeat failures and bad reliability data — communication is measured, not assumed.</p>
              </div>
            )}

            <div className="mb-6"><AssignTraining /></div>

            {/* Team readiness matrix */}
            <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-4 overflow-x-auto">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Team readiness matrix</h3>
              <table className="w-full text-xs">
                <thead><tr className="text-gray-500 text-left">
                  <th className="py-1 pr-3">Technician</th>
                  {DOMAINS.map((d) => <th key={d} className="px-1 text-center" title={SKILL_DOMAIN_LABELS[d]}>{d.slice(0, 4)}</th>)}
                  <th className="text-center">Validate</th>
                </tr></thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.userId} className="border-t border-gray-800/60">
                      <td className="py-2 pr-3 text-gray-200 whitespace-nowrap">{m.name} <span className="text-[10px] text-gray-500">· {m.methodologyTier}</span></td>
                      {DOMAINS.map((d) => {
                        const r = m.readiness.find((x) => x.domain === d);
                        const v = r && r.attempts > 0 ? r.confidence : null;
                        const color = r?.hasSafetyViolation ? "text-red-400" : v == null ? "text-gray-700" : v >= 70 ? "text-emerald-400" : v >= 50 ? "text-amber-400" : "text-red-400";
                        return (
                          <td key={d} className={`px-1 text-center font-mono ${color}`} title={r?.recentAudit[0]?.reason ?? ""}>
                            {r?.hasSafetyViolation ? "⚠" : v == null ? "·" : v}
                            {r?.managerValidated ? <ShieldCheck className="inline w-2.5 h-2.5 ml-0.5 text-emerald-400" /> : null}
                          </td>
                        );
                      })}
                      <td className="text-center">
                        <select
                          className="bg-[#0a0f0a] border border-gray-700 rounded text-[10px] px-1 py-0.5"
                          defaultValue=""
                          onChange={async (e) => {
                            if (!e.target.value) return;
                            await validate.mutateAsync({ userId: m.userId, domain: e.target.value });
                            toast.success(`Validated ${m.name} · ${SKILL_DOMAIN_LABELS[e.target.value as SkillDomain]}`);
                            team.refetch();
                            e.target.value = "";
                          }}
                        >
                          <option value="">attest…</option>
                          {DOMAINS.map((d) => <option key={d} value={d}>{SKILL_DOMAIN_LABELS[d]}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[11px] text-gray-600 mt-3">Hover a cell for the evidence rationale · <ShieldCheck className="inline w-3 h-3 text-emerald-400" /> = manager-validated · ⚠ = safety flag.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
