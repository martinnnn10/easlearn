/**
 * AssignTraining — the manager's assign-and-track workflow.
 * Assign a course module to team members with a due date, then track live
 * completion (derived from real lesson progress) and overdue status.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ClipboardCheck, Plus, X, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

export default function AssignTraining() {
  // Roster comes from the Assessment Spine (single source of truth); we only need
  // each member's id + name for the assignment picker.
  const team = trpc.assessment.teamReadiness.useQuery();
  const modules = trpc.courses.listModules.useQuery();
  const assignments = trpc.assignments.teamAssignments.useQuery();
  const assign = trpc.assignments.assign.useMutation();
  const unassign = trpc.assignments.unassign.useMutation();

  const [selected, setSelected] = useState<number[]>([]);
  const [moduleId, setModuleId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");

  const members = team.data?.members ?? [];
  const rows = assignments.data?.rows ?? [];

  const toggle = (id: number) => setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));

  const doAssign = async () => {
    if (selected.length === 0 || !moduleId) {
      toast.error("Pick at least one technician and a module");
      return;
    }
    const res = await assign.mutateAsync({
      userIds: selected,
      moduleId: Number(moduleId),
      dueAt: dueDate ? new Date(dueDate + "T23:59:59").toISOString() : undefined,
    });
    if (!res.ok) {
      toast.error(res.reason === "not_a_manager" ? "You don't manage a team yet" : "No valid team members selected");
      return;
    }
    toast.success(`Assigned to ${res.assigned}${res.skipped ? ` (${res.skipped} already had it)` : ""}`);
    setSelected([]);
    setModuleId("");
    setDueDate("");
    assignments.refetch();
  };

  const statusBadge = (r: (typeof rows)[number]) => {
    if (r.completed) return <span className="inline-flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> Complete</span>;
    if (r.overdue) return <span className="inline-flex items-center gap-1 text-red-400 text-xs"><AlertTriangle className="w-3.5 h-3.5" /> Overdue ({r.progressPct}%)</span>;
    return <span className="inline-flex items-center gap-1 text-amber-400 text-xs"><Clock className="w-3.5 h-3.5" /> In progress ({r.progressPct}%)</span>;
  };

  return (
    <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <ClipboardCheck className="w-4 h-4 text-emerald-400" /> Assign & track training
      </h3>

      {members.length === 0 ? (
        <p className="text-gray-600 text-xs">Invite technicians to your team first, then assign training here.</p>
      ) : (
        <>
          {/* Assign form */}
          <div className="rounded border border-gray-800 p-3 mb-4">
            <p className="text-[11px] text-gray-500 mb-2">Who</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {members.map((m: any) => (
                <button
                  key={m.userId}
                  onClick={() => toggle(m.userId)}
                  className={`text-xs rounded-full px-3 py-1 border ${selected.includes(m.userId) ? "bg-emerald-600 border-emerald-500 text-white" : "border-gray-700 text-gray-400 hover:border-gray-500"}`}
                >
                  {m.name}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-[11px] text-gray-500">Module
                <select value={moduleId} onChange={e => setModuleId(e.target.value)} className="block mt-1 bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm min-w-[200px]">
                  <option value="">Select a module…</option>
                  {modules.data?.map((m: any) => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </label>
              <label className="text-[11px] text-gray-500">Due date (optional)
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="block mt-1 bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm" />
              </label>
              <button onClick={doAssign} disabled={assign.isPending} className="inline-flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-sm px-3 py-1.5">
                <Plus className="w-4 h-4" /> Assign
              </button>
            </div>
          </div>

          {/* Tracking list */}
          {rows.length === 0 ? (
            <p className="text-gray-600 text-xs">No training assigned yet.</p>
          ) : (
            <div className="space-y-1.5">
              {rows.map(r => (
                <div key={r.id} className="flex items-center gap-3 text-sm border-t border-gray-800/60 py-2">
                  <span className="text-gray-200 w-32 truncate">{r.userName}</span>
                  <span className="text-gray-400 flex-1 truncate">{r.moduleTitle}</span>
                  {r.dueAt && <span className="text-[11px] text-gray-500">due {new Date(r.dueAt).toLocaleDateString()}</span>}
                  {statusBadge(r)}
                  <button onClick={() => unassign.mutateAsync({ id: r.id }).then(() => assignments.refetch())} className="text-gray-600 hover:text-red-400" aria-label="Remove assignment"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
