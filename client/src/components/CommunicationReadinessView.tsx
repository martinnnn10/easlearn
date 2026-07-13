/**
 * CommunicationReadinessView — surfaces Maintenance Communication as a visible
 * job-readiness signal, from the Assessment Spine's communication evidence.
 * This is maintenance execution, not "soft skills": can this person explain the
 * fault, document it, and hand it off like a real technician?
 */
import { MessageSquare, ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import type { CommunicationReadiness, CommunicationArea } from "@shared/assessmentSpine";

const LEVEL_STYLE: Record<string, string> = {
  "Promotion Candidate": "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  Ready: "text-emerald-300 border-emerald-500/30 bg-emerald-500/5",
  "Needs Manager Validation": "text-sky-300 border-sky-500/30 bg-sky-500/5",
  "Almost Ready": "text-amber-300 border-amber-500/25 bg-amber-500/5",
  "Needs Review": "text-amber-300 border-amber-500/30 bg-amber-500/10",
  "Needs Training": "text-red-300 border-red-500/30 bg-red-500/5",
  "Needs Safety Review": "text-red-200 border-red-500/50 bg-red-500/15",
  "Not Demonstrated": "text-gray-500 border-gray-800 bg-transparent",
};

/** The plant-floor rationale for the most recent evidence in an area. Prefers the
 *  spine's actual audit reason (which includes "Escalated by mentor review: …"). */
function exampleLine(a: CommunicationArea): string | null {
  const audit = a.recentAudit[0];
  if (a.hasSafetyViolation) {
    const why = a.recentAudit.find((x) => x.direction === "unsafe")?.reason;
    return why ?? "Unsafe communication flagged (e.g. repeated-reset or bypass recommendation).";
  }
  if (!audit) return null;
  return audit.reason;
}

export interface CommunicationValidationDetail {
  area: string;
  label: string;
  note: string | null;
  at: string;
  validator: string;
}

export default function CommunicationReadinessView({
  data,
  validations = [],
  showEmployerCopy = false,
  compact = false,
}: {
  data: CommunicationReadiness;
  validations?: CommunicationValidationDetail[];
  showEmployerCopy?: boolean;
  compact?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" /> Maintenance Communication
        </h3>
        {data.hasEvidence && (
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] uppercase tracking-wide rounded border px-1.5 py-0.5 ${LEVEL_STYLE[data.overall.level] ?? LEVEL_STYLE["Not Demonstrated"]}`}>{data.overall.level}</span>
            {data.safetyCommunicationRisk && (
              <span className="text-[10px] uppercase tracking-wide rounded border border-red-500/40 text-red-300 px-1.5 py-0.5 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> safety comm risk</span>
            )}
          </div>
        )}
      </div>

      {!data.hasEvidence ? (
        <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-4 text-center">
          <MessageSquare className="w-6 h-6 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Not demonstrated yet.</p>
          <p className="text-gray-500 text-xs mt-1">Complete a lesson closeout or troubleshooting-lab reflection to generate evidence — explain the fault, tell the operator, write the work order, hand off.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {data.areas.map((a) => {
              const ex = exampleLine(a);
              return (
                <div key={a.key} className="rounded-lg border border-gray-800 bg-[#0d120d] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="text-white text-sm">{a.label}</span>
                      <span className={`text-[10px] uppercase tracking-wide rounded border px-1.5 py-0.5 ${LEVEL_STYLE[a.level] ?? LEVEL_STYLE["Not Demonstrated"]}`}>{a.level}</span>
                      {a.hasSafetyViolation && <span title="Unsafe communication on record"><ShieldAlert className="w-3.5 h-3.5 text-red-400" /></span>}
                      {a.managerValidated ? (
                        <span className="text-[10px] text-emerald-300 flex items-center gap-1" title="Manager-attested on the floor"><ShieldCheck className="w-3 h-3" /> manager validated</span>
                      ) : a.level === "Needs Manager Validation" ? (
                        <span className="text-[10px] text-sky-300/80 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> needs floor observation</span>
                      ) : null}
                    </div>
                    {a.attempts > 0 && <span className="text-emerald-400 font-mono text-xs shrink-0">{a.confidence}%</span>}
                  </div>
                  {!compact && <p className="text-[11px] text-gray-500 mt-0.5">{a.blurb}</p>}
                  {a.attempts === 0 ? (
                    <p className="text-[11px] text-gray-600 mt-1">Not demonstrated yet.</p>
                  ) : ex ? (
                    <p className="text-[11px] mt-1 flex items-start gap-1.5">
                      {a.hasSafetyViolation ? <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" /> : a.recentAudit[0]?.direction === "improve" || a.recentAudit[0]?.direction === "confirm" ? <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" /> : <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />}
                      <span className={a.hasSafetyViolation ? "text-red-300" : "text-gray-400"}>{ex}</span>
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Verified vs assumed: <span className={data.verifiedVsAssumed === "strong" ? "text-emerald-400" : data.verifiedVsAssumed === "weak" ? "text-amber-400" : "text-gray-400"}>{data.verifiedVsAssumed === "none" ? "—" : data.verifiedVsAssumed}</span>
            {" · "}Communication supports job-readiness but never replaces demonstrated troubleshooting or safety.
          </p>
          {data.crossCuttingValidated.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {data.crossCuttingValidated.map((c) => (
                <span key={c.key} className="inline-flex items-center gap-1 text-[10px] text-emerald-300 border border-emerald-500/30 rounded px-1.5 py-0.5"><ShieldCheck className="w-3 h-3" /> {c.label} — manager validated</span>
              ))}
            </div>
          )}
          {validations.length > 0 && (
            <div className="mt-3 border-t border-gray-800/70 pt-2">
              <div className="text-[11px] text-gray-500 mb-1">Manager attestations</div>
              <ul className="space-y-1">
                {validations.map((v, i) => (
                  <li key={i} className="text-[11px] text-gray-400 flex items-start gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                    <span><span className="text-gray-300">{v.label}</span> — {v.validator} · {new Date(v.at).toLocaleDateString()}{v.note ? <span className="text-gray-500"> · “{v.note}”</span> : null}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {showEmployerCopy && (
        <p className="text-xs text-gray-500 mt-3 leading-relaxed border-t border-gray-800/70 pt-3">
          EASLearn doesn't only measure whether someone can find a fault. It measures whether they can <span className="text-gray-300">explain, document, and hand off</span> the fault like a real maintenance technician — the communication that prevents repeat failures, bad handoffs, and unnecessary parts replacement.
        </p>
      )}
    </div>
  );
}
