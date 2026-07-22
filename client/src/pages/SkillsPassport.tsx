/**
 * SkillsPassport — the learner's own competency system of record + the share
 * surface that turns it into a viral, employer-verifiable object.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Share2, Copy, Loader2, GraduationCap, BadgeCheck, ShieldCheck, ShieldAlert, Trophy } from "lucide-react";
import SEO from "@/components/SEO";
import InviteFriends from "@/components/InviteFriends";
import CommunicationReadinessView from "@/components/CommunicationReadinessView";
import SkillsPassportPreview from "@/components/previews/SkillsPassportPreview";
import PreviewFrame from "@/components/previews/PreviewFrame";

export default function SkillsPassport() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);

  const profileQuery = trpc.competency.myProfile.useQuery(undefined, { enabled: isAuthenticated });
  const transcriptQuery = trpc.accreditation.myTranscript.useQuery(undefined, { enabled: isAuthenticated });
  const readinessQuery = trpc.assessment.myReadiness.useQuery(undefined, { enabled: isAuthenticated });

  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] text-white">
        <SEO title="Skills Passport — Verified Maintenance Proof" description="A shareable, employer-verifiable record of an operator's demonstrated troubleshooting competency: verified skills, completed simulations, certificates, and job-readiness." path="/skills-passport" />
        <PreviewFrame
          title="Skills Passport"
          subtitle="A shareable, employer-verifiable record of what an operator can actually diagnose. The passport shown below is sample data."
        >
          <SkillsPassportPreview />
        </PreviewFrame>
      </div>
    );
  }

  const profile = profileQuery.data;
  const shareUrl = profile?.verificationCode
    ? `${window.location.origin}/verify/skills/${profile.verificationCode}`
    : null;

  const copyShare = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Verifiable link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white">
      <SEO title="Skills Passport" description="Your verified industrial troubleshooting competency" path="/skills-passport" />
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-xl font-bold flex items-center gap-2"><Share2 className="w-5 h-5 text-emerald-400" /> Skills Passport</h1>
          {shareUrl ? (
            <button onClick={copyShare} className="inline-flex items-center gap-2 rounded bg-emerald-600 hover:bg-emerald-700 text-sm px-3 py-1.5">
              <Copy className="w-4 h-4" /> {copied ? "Copied!" : "Copy verifiable link"}
            </button>
          ) : (
            <span className="text-xs text-gray-500">Earn a certification to unlock a shareable verifiable link.</span>
          )}
        </div>

        {/* Evidence-based verified competencies — the Assessment Spine, source of truth */}
        {readinessQuery.data && readinessQuery.data.hasEvidence && (
          <div className="mb-8">
            <div className="rounded-xl border border-emerald-500/25 bg-gradient-to-br from-[#0d150d] to-[#0a0f0a] p-5 mb-4 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-emerald-400" />
                <div>
                  <div className="text-white font-semibold">{readinessQuery.data.methodologyTier}</div>
                  <div className="text-gray-500 text-xs">Overall demonstrated competency · {readinessQuery.data.overallConfidence}% · evidence-based</div>
                </div>
              </div>
              {readinessQuery.data.promotionReady && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs px-3 py-1.5 border border-emerald-500/30"><Trophy className="w-3.5 h-3.5" /> Job-ready</span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified competencies</h3>
            <div className="space-y-2">
              {readinessQuery.data.readiness.filter((r) => r.attempts > 0 || r.managerValidated || r.hasSafetyViolation).map((r) => (
                <div key={r.domain} className="flex items-center gap-3 rounded-lg border border-gray-800 bg-[#0d120d] p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-sm">{r.label}</span>
                      <span className="text-[10px] text-gray-400 border border-gray-700 rounded px-1.5 py-0.5">{r.level}</span>
                      {r.managerValidated && <span title="Manager-validated"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /></span>}
                      {r.hasSafetyViolation && <span title="Safety flag on record"><ShieldAlert className="w-3.5 h-3.5 text-red-400" /></span>}
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-gray-800 overflow-hidden"><div className={`h-full ${r.confidence >= 70 ? "bg-emerald-500" : r.confidence >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${r.confidence}%` }} /></div>
                    {r.recentAudit[0] && <div className="text-[11px] text-gray-500 mt-1 truncate">{r.recentAudit[0].reason}</div>}
                  </div>
                  <span className="text-emerald-400 font-mono text-sm w-10 text-right shrink-0">{r.confidence}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {readinessQuery.data && !readinessQuery.data.hasEvidence && !profileQuery.isLoading && (
          <div className="mb-8 rounded-xl border border-gray-800 bg-[#0d120d] p-6 text-center">
            <ShieldCheck className="w-7 h-7 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-300 mb-1">No verified competencies yet.</p>
            <p className="text-gray-500 text-sm">Complete a lesson, lab, or review to generate the evidence that builds your passport.</p>
          </div>
        )}

        {/* Maintenance Communication — job-readiness proof from the closeout loop */}
        {readinessQuery.data && (
          <div className="mb-8">
            <CommunicationReadinessView data={readinessQuery.data.communication} validations={readinessQuery.data.communicationValidations} showEmployerCopy />
          </div>
        )}

        {(profileQuery.isLoading || loading || readinessQuery.isLoading) ? (
          <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Building your competency profile…</div>
        ) : profile ? (
          <>
            {/* Competency is shown by the evidence-based Assessment Spine block above.
                This section carries the CEU transcript + standards alignment only. */}

            {/* Continuing-education (CEU) transcript + standards alignment */}
            {transcriptQuery.data && transcriptQuery.data.totals.lessonsCompleted > 0 && (
              <div className="mt-8 rounded-lg border border-gray-800 bg-[#0d120d] p-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-400" /> Continuing Education Transcript
                </h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div><div className="text-white text-xl font-semibold">{transcriptQuery.data.totals.ceu}</div><div className="text-gray-500 text-[11px]">CEUs (1 = 10 contact hrs)</div></div>
                  <div><div className="text-white text-xl font-semibold">{transcriptQuery.data.totals.contactHours}</div><div className="text-gray-500 text-[11px]">Contact hours</div></div>
                  <div><div className="text-white text-xl font-semibold">{transcriptQuery.data.totals.assessmentsPassed}</div><div className="text-gray-500 text-[11px]">Assessments passed</div></div>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">Standards aligned across completed training:</p>
                <div className="flex flex-wrap gap-2">
                  {transcriptQuery.data.standardsCovered.map(c => (
                    <span key={c.id} className="inline-flex items-center gap-1 rounded bg-gray-800 text-gray-300 text-[10px] px-2 py-1" title={c.title}>
                      <BadgeCheck className="w-3 h-3 text-emerald-400" /> {c.ref}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-600 mt-4 leading-relaxed">
                  Content is aligned to the standards shown. CEU issuance requires ANSI/IACET accreditation
                  (in progress); standards alignment is not an endorsement by the listed bodies.
                </p>
              </div>
            )}

            <div className="mt-8">
              <InviteFriends />
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-sm">No competency data yet — complete a simulator scenario to start building your profile.</p>
        )}
      </div>
    </div>
  );
}
