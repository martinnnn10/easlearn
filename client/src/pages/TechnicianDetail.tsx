/**
 * Technician Detail — per-technician drill-down from the Manager Dashboard.
 * Shows readiness, assignments, recent activity, validations, and streak.
 * Only accessible to managers/admins/owners who manage this technician.
 */
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Flame, BookOpen, Target, ShieldCheck, AlertTriangle, Clock, CheckCircle2, Wrench, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import SEO from "@/components/SEO";

/** Workstation Attempts section with reasoning replay and validation */
function WorkstationAttemptsSection({ userId }: { userId: number }) {
  const attemptsQuery = trpc.workstation.learnerAttempts.useQuery({ userId });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  if (!attemptsQuery.data || attemptsQuery.data.length === 0) return null;
  return (
    <Card className="bg-zinc-900 border-zinc-800 mb-6">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <Wrench className="w-5 h-5 text-emerald-400" /> Workstation Attempts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {attemptsQuery.data.map((a: any) => (
            <div key={a.id}>
              <button onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800/70 transition-colors text-left">
                <div className="flex items-center gap-2">
                  {a.status === "completed" ? (a.diagnosisCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />) : a.status === "in_progress" ? <Clock className="w-4 h-4 text-sky-400" /> : <AlertTriangle className="w-4 h-4 text-zinc-500" />}
                  <span className="text-sm text-white">{a.scenarioId.replace(/_/g, " ")}</span>
                  {a.safetyViolation && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-900/40 text-red-400 font-medium">SAFETY</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${a.status === "completed" ? "bg-emerald-900/30 text-emerald-400" : a.status === "in_progress" ? "bg-sky-900/30 text-sky-400" : "bg-zinc-700/30 text-zinc-400"}`}>{a.status.replace(/_/g, " ").toUpperCase()}</span>
                  <span className="text-xs text-gray-500">{new Date(a.startedAt).toLocaleDateString()}</span>
                  {expandedId === a.id ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                </div>
              </button>
              {expandedId === a.id && <AttemptDetailPanel attemptId={a.id} attempt={a} />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Who produced an event — managers must see whose words/values they are reading. */
function eventProvenance(eventType: string): { label: string; cls: string } {
  if (["hypothesis_created", "hypothesis_status_changed", "measurement_interpreted", "diagnosis_submitted", "closeout_submitted", "measurement_predicted"].includes(eventType)) {
    return { label: "learner", cls: "bg-sky-900/40 text-sky-300" };
  }
  if (eventType === "measurement_performed") return { label: "sim reading", cls: "bg-amber-900/40 text-amber-300" };
  if (eventType.startsWith("unsafe_") || eventType === "workstation_completed" || eventType === "scenario_observed" || eventType === "repair_verification_performed") {
    return { label: "system", cls: "bg-purple-900/40 text-purple-300" };
  }
  return { label: "action", cls: "bg-zinc-800 text-zinc-400" };
}

/** Compact human-readable summary of the event's detail payload (the learner's actual reasoning). */
function eventDetailSummary(e: { eventType: string; detail: any }): string | null {
  const d = e.detail ?? {};
  switch (e.eventType) {
    case "measurement_performed": return `${d.mode ?? ""} @ ${d.component ?? d.probe ?? ""} ${d.terminals ?? ""} → ${d.reading ?? "?"}${d.expected ? ` (expected ${d.expected})` : ""}`;
    case "measurement_interpreted": return `"${d.interpretation ?? ""}"`;
    case "hypothesis_created": return `"${d.text ?? ""}"`;
    case "hypothesis_status_changed": return `"${d.text ?? d.hypothesisId ?? ""}": ${d.from ?? "?"} → ${d.to ?? "?"}`;
    case "diagnosis_submitted": return `"${d.hypothesisText ?? d.diagnosis ?? ""}"`;
    case "closeout_submitted": return `root cause: "${d.rootCause ?? ""}" · ${d.testsPerformed ?? 0} test(s)`;
    case "unsafe_action_attempted": return `${d.reason ?? ""}`;
    case "unsafe_action_blocked": return `${d.remediation ?? d.reasonBlocked ?? ""}`;
    case "corrective_action_selected": return `${d.actionLabel ?? ""}`;
    case "repair_verification_performed": return d.faultCleared ? `verified — ${d.result ?? "fault cleared"}` : "not verified";
    case "test_points_selected": return `${d.component ?? ""} ${d.terminals ?? ""}`;
    case "meter_function_selected": return `${d.mode ?? ""}`;
    case "workstation_completed": return d.diagnosisCorrect != null ? `diagnosis ${d.diagnosisCorrect ? "correct" : "incorrect"} (server-derived)` : null;
    default: return null;
  }
}

const VALIDATION_COMPETENCIES = [
  "motor_control_troubleshooting", "electrical_diagnostic_method", "meter_usage",
  "plc_output_verification", "safety_judgment", "root_cause_explanation",
  "repair_verification", "work_order_documentation",
] as const;
type ValidationCompetency = (typeof VALIDATION_COMPETENCIES)[number];

function AttemptDetailPanel({ attemptId, attempt }: { attemptId: number; attempt: any }) {
  const eventsQuery = trpc.workstation.getEvents.useQuery({ attemptId });
  const validationsQuery = trpc.workstation.getValidations.useQuery({ attemptId });
  const [valError, setValError] = useState<string | null>(null);
  const validateMut = trpc.workstation.validate.useMutation({
    onSuccess: () => { setValError(null); validationsQuery.refetch(); setValForm((f) => ({ ...f, comment: "" })); },
    onError: (err) => setValError(err.message || "Validation failed"),
  });
  const [valForm, setValForm] = useState<{ competency: ValidationCompetency; decision: string; comment: string }>({ competency: "motor_control_troubleshooting", decision: "validated", comment: "" });
  return (
    <div className="mt-1 p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/30 space-y-4">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div><span className="text-zinc-500">Scenario:</span> <span className="text-zinc-300">{attempt.scenarioId.replace(/_/g, " ")}</span></div>
        <div><span className="text-zinc-500">Fault:</span> <span className="text-zinc-300">{attempt.faultId.replace(/_/g, " ")}</span></div>
        {attempt.finalDiagnosis && <div className="col-span-2"><span className="text-zinc-500">Diagnosis:</span> <span className="text-zinc-300">{attempt.finalDiagnosis}</span></div>}
        {attempt.correctiveAction && <div className="col-span-2"><span className="text-zinc-500">Corrective Action:</span> <span className="text-zinc-300">{attempt.correctiveAction}</span></div>}
        {attempt.diagnosisCorrect != null && <div><span className="text-zinc-500">Correct:</span> <span className={attempt.diagnosisCorrect ? "text-emerald-400" : "text-red-400"}>{attempt.diagnosisCorrect ? "Yes" : "No"}</span></div>}
      </div>
      <div>
        <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Diagnostic Reasoning Replay</h4>
        {eventsQuery.isLoading && <p className="text-xs text-zinc-500">Loading events...</p>}
        {eventsQuery.data && eventsQuery.data.length === 0 && <p className="text-xs text-zinc-600 italic">No diagnostic events recorded.</p>}
        {eventsQuery.data && eventsQuery.data.length > 0 && (
          <div className="relative pl-4 border-l-2 border-zinc-700/50 space-y-1.5 max-h-72 overflow-y-auto">
            {eventsQuery.data.map((e: any) => {
              // Baseline is the attempt start (server timestamp), not the first event
              const base = new Date(attempt.startedAt).getTime();
              const elapsed = Math.max(0, Math.round((new Date(e.occurredAt).getTime() - base) / 1000));
              const mins = Math.floor(elapsed / 60); const secs = elapsed % 60;
              const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
              const isSafety = e.eventType.includes("unsafe");
              const prov = eventProvenance(e.eventType);
              const summary = eventDetailSummary(e);
              return (
                <div key={e.id} className="relative">
                  <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 ${isSafety ? "border-red-500 bg-red-900" : "border-zinc-600 bg-zinc-900"}`} />
                  <div className={`px-2 py-1 rounded text-[10px] ${isSafety ? "border border-red-700/30 bg-red-900/10" : "border border-zinc-700/20 bg-zinc-800/20"}`}>
                    <span className="text-[9px] text-zinc-500 font-mono mr-2">+{timeStr}</span>
                    <span className={`font-medium ${isSafety ? "text-red-400" : "text-zinc-300"}`}>{e.eventType.replace(/_/g, " ")}</span>
                    <span className={`ml-2 text-[8px] px-1 py-0.5 rounded ${prov.cls}`}>{prov.label}</span>
                    {e.componentRef && <span className="ml-2 text-zinc-500">@ {e.componentRef}</span>}
                    {summary && <div className="mt-0.5 text-[9px] text-zinc-400 leading-relaxed">{summary}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {validationsQuery.data && validationsQuery.data.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Validations</h4>
          <div className="space-y-1">
            {validationsQuery.data.map((v: any) => (
              <div key={v.id} className="flex items-center gap-2 text-xs p-2 rounded bg-zinc-800/30">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${v.decision === "validated" ? "bg-emerald-900/40 text-emerald-400" : v.decision === "needs_safety_review" ? "bg-red-900/40 text-red-400" : "bg-amber-900/40 text-amber-400"}`}>{v.decision.replace(/_/g, " ").toUpperCase()}</span>
                <span className="text-zinc-400">{v.competency.replace(/_/g, " ")}</span>
                {v.comment && <span className="text-zinc-500 italic">— {v.comment}</span>}
                <span className="ml-auto text-zinc-600 text-[9px]">{new Date(v.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {attempt.status === "completed" && (
        <div className="border-t border-zinc-700/30 pt-3">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Record Validation</h4>
          <div className="flex flex-wrap gap-2 items-end">
            <select value={valForm.competency} onChange={(e) => setValForm(f => ({ ...f, competency: e.target.value as ValidationCompetency }))} className="text-[10px] px-2 py-1.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300">
              <option value="motor_control_troubleshooting">Motor Control Troubleshooting</option>
              <option value="electrical_diagnostic_method">Electrical Diagnostic Method</option>
              <option value="meter_usage">Meter Usage</option>
              <option value="plc_output_verification">PLC Output Verification</option>
              <option value="safety_judgment">Safety Judgment</option>
              <option value="root_cause_explanation">Root-Cause Explanation</option>
              <option value="repair_verification">Repair Verification</option>
              <option value="work_order_documentation">Work-Order Documentation</option>
            </select>
            <select value={valForm.decision} onChange={(e) => setValForm(f => ({ ...f, decision: e.target.value }))} className="text-[10px] px-2 py-1.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300">
              <option value="validated">Validated</option>
              <option value="needs_additional_demonstration">Needs Additional Demonstration</option>
              <option value="needs_coaching">Needs Coaching</option>
              <option value="needs_safety_review">Needs Safety Review</option>
            </select>
            <input type="text" placeholder="Optional comment" value={valForm.comment} onChange={(e) => setValForm(f => ({ ...f, comment: e.target.value }))} className="text-[10px] px-2 py-1.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-300 flex-1 min-w-[120px]" />
            <button onClick={() => { validateMut.mutate({ attemptId, competency: valForm.competency, decision: valForm.decision as any, comment: valForm.comment || undefined }); }} disabled={validateMut.isPending} className="text-[10px] px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-50">
              {validateMut.isPending ? "Saving..." : "Submit"}
            </button>
          </div>
          {valError && <p className="mt-2 text-[10px] text-red-400">{valError}</p>}
        </div>
      )}
    </div>
  );
}

const LEVEL_COLOR: Record<string, string> = {
  "Promotion Candidate": "bg-emerald-900/40 text-emerald-300 border-emerald-700",
  Ready: "bg-emerald-900/30 text-emerald-400 border-emerald-700",
  "Needs Manager Validation": "bg-sky-900/30 text-sky-300 border-sky-700",
  "Almost Ready": "bg-amber-900/30 text-amber-300 border-amber-700",
  "Needs Review": "bg-amber-900/30 text-amber-400 border-amber-700",
  "Needs Training": "bg-red-900/30 text-red-400 border-red-700",
  "Needs Safety Review": "bg-red-900/40 text-red-300 border-red-700",
};

export default function TechnicianDetail() {
  const { userId } = useParams<{ userId: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const detail = trpc.assessment.technicianDetail.useQuery(
    { userId: Number(userId) },
    { enabled: isAuthenticated && !!userId }
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] flex items-center justify-center text-white">
        <p className="text-gray-500">Sign in to view technician details.</p>
      </div>
    );
  }

  if (detail.isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (detail.error) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] flex items-center justify-center text-white px-4">
        <Card className="bg-zinc-900 border-zinc-800 max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-300 mb-2">Access Denied</p>
            <p className="text-gray-500 text-sm">{detail.error.message}</p>
            <Button variant="outline" className="mt-4 border-zinc-700 text-zinc-300" onClick={() => navigate("/manager")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const d = detail.data;
  if (!d) return null;

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white">
      <SEO title={`${d.user.name} — Technician Detail`} description="Per-technician competency evidence and activity" path={`/manager/technician/${userId}`} />
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/manager")} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">{d.user.name}</h1>
            <p className="text-gray-500 text-sm">{d.user.email}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Target className="w-4 h-4" />
              <span>{d.overallConfidence}% confidence</span>
            </div>
            {d.streak && (
              <div className="flex items-center gap-1.5 text-orange-400">
                <Flame className="w-4 h-4" />
                <span>{d.streak.current}-day streak</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-gray-400">
              <BookOpen className="w-4 h-4" />
              <span>{d.lessonsCompleted} lessons</span>
            </div>
          </div>
        </div>

        {/* Readiness Grid */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-white">Competency Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            {d.readiness.length === 0 ? (
              <p className="text-gray-500 text-sm">No demonstrated competency yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {d.readiness.map((r: any) => (
                  <div key={r.domain} className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{r.label}</span>
                      <span className="text-xs text-gray-500">{r.confidence}%</span>
                    </div>
                    <Badge variant="outline" className={`text-xs ${LEVEL_COLOR[r.level] || "border-zinc-600 text-zinc-400"}`}>
                      {r.level}
                    </Badge>
                    {r.hasSafetyViolation && (
                      <span className="ml-2 text-xs text-red-400 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Safety flag
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignments */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-white">Assigned Training</CardTitle>
          </CardHeader>
          <CardContent>
            {d.assignments.length === 0 ? (
              <p className="text-gray-500 text-sm">No training assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {d.assignments.map((a: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                    <div className="flex items-center gap-2">
                      {a.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : a.overdue ? (
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-500 shrink-0" />
                      )}
                      <span className="text-sm text-white">{a.moduleTitle}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {a.completed ? "Completed" : a.overdue ? "Overdue" : a.dueAt ? `Due ${new Date(a.dueAt).toLocaleDateString()}` : "No deadline"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manager Validations */}
        {d.validations.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800 mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Manager Validations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {d.validations.map((v: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                    <div>
                      <span className="text-sm text-white">{v.domain}</span>
                      {v.note && <p className="text-xs text-gray-500 mt-0.5">{v.note}</p>}
                    </div>
                    <span className="text-xs text-gray-500">{new Date(v.validatedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Scenarios */}
        {d.scenarios.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800 mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-white">Recent Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {d.scenarios.map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                    <div>
                      <span className="text-sm text-white">{s.scenarioId}</span>
                      <span className="ml-2 text-xs text-gray-500">Score: {s.score}/{s.maxScore}</span>
                    </div>
                    <span className="text-xs text-gray-500">{new Date(s.completedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Fault Attempts */}
        {d.faultAttempts.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800 mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-white">Recent Fault Diagnosis Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {d.faultAttempts.map((f: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                    <div className="flex items-center gap-2">
                      {f.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      )}
                      <span className="text-sm text-white">{f.faultId}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {f.methodologyScore != null && <span className="mr-3">Methodology: {f.methodologyScore}%</span>}
                      {new Date(f.completedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workstation Attempts */}
        <WorkstationAttemptsSection userId={Number(userId)} />

        {/* Communication */}
        {d.communication && d.communication.hasEvidence && (
          <Card className="bg-zinc-900 border-zinc-800 mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-white">Communication Readiness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="outline" className={`${LEVEL_COLOR[d.communication.overall.level] || "border-zinc-600 text-zinc-400"}`}>
                  {d.communication.overall.level}
                </Badge>
                <span className="text-xs text-gray-500">{d.communication.overall.confidence}% confidence</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {d.communication.areas.map((a: any) => (
                  <div key={a.key} className="p-2 rounded bg-zinc-800/50 text-sm">
                    <span className="text-gray-300">{a.label}</span>
                    <span className="ml-2 text-xs text-gray-500">{a.level}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
