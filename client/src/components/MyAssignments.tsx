/**
 * MyAssignments — the learner side of the assign-and-track loop.
 * Shows the technician what their manager assigned, the due date, live progress,
 * and a one-tap way to start/continue. Renders nothing if nothing is assigned.
 */
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { ClipboardCheck, CheckCircle2, AlertTriangle, ArrowRight, Wrench } from "lucide-react";

export default function MyAssignments() {
  const { data } = trpc.assignments.myAssignments.useQuery();
  const wsData = trpc.workstation.myAssignments.useQuery();
  const rows = data ?? [];
  const wsRows = (wsData.data ?? []).filter((w: any) => w.status !== "completed");
  const open = rows.filter(r => !r.completed);
  if (rows.length === 0 && wsRows.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-emerald-500/25 bg-[#0d120d] p-5">
      <h3 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
        <ClipboardCheck className="w-4 h-4 text-emerald-400" /> Assigned to you
        {(open.length + wsRows.length) > 0 && <span className="text-[11px] text-amber-400">· {open.length + wsRows.length} to finish</span>}
      </h3>
      <div className="space-y-2">
        {wsRows.map((w: any) => (
          <Link key={`ws-${w.id}`} href={`/labs/motor-control-workstation?assignment=${w.id}${w.scenarioId ? `&scenario=${encodeURIComponent(w.scenarioId)}` : ""}`}>
            <div className="flex items-center gap-3 rounded-lg border border-gray-800 hover:border-emerald-500/40 bg-[#0a0f0a] p-3 cursor-pointer transition-colors">
              <Wrench className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate flex items-center gap-2">
                  Motor Control Diagnostic Workstation
                  {w.status === "overdue" && <span className="inline-flex items-center gap-1 text-red-400 text-[10px]"><AlertTriangle className="w-3 h-3" /> overdue</span>}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  {w.scenarioId ? w.scenarioId.replace(/_/g, " ") : "Any scenario"}
                  {w.dueAt ? ` · due ${new Date(w.dueAt).toLocaleDateString()}` : ""}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-600 shrink-0" />
            </div>
          </Link>
        ))}
        {rows.map(r => (
          <Link key={r.id} href={`/courses/${r.moduleSlug}`}>
            <div className="flex items-center gap-3 rounded-lg border border-gray-800 hover:border-emerald-500/40 bg-[#0a0f0a] p-3 cursor-pointer transition-colors">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate flex items-center gap-2">
                  {r.moduleTitle}
                  {r.completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  {r.overdue && <span className="inline-flex items-center gap-1 text-red-400 text-[10px]"><AlertTriangle className="w-3 h-3" /> overdue</span>}
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                  <div className={`h-full ${r.completed ? "bg-emerald-500" : r.overdue ? "bg-red-500" : "bg-amber-500"}`} style={{ width: `${r.progressPct}%` }} />
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  {r.progressPct}% {r.dueAt ? `· due ${new Date(r.dueAt).toLocaleDateString()}` : ""}
                </div>
              </div>
              {!r.completed && <ArrowRight className="w-4 h-4 text-gray-600 shrink-0" />}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
