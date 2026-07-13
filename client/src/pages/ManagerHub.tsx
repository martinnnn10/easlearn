/**
 * Manager Hub — the one front door for everything a maintenance manager runs:
 * team competency, training assignments, the workforce planner, intelligence,
 * team members, and an auditor-ready compliance export.
 */
import { useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  LayoutDashboard, ClipboardCheck, Users, BarChart3, Brain, Download, Loader2, Lock,
  Award, AlertTriangle, Activity, ArrowRight,
} from "lucide-react";
import SEO from "@/components/SEO";
import { toCsv, downloadCsv } from "@/lib/csv";

export default function ManagerHub() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  // Single source of truth: workforce stats come from the Assessment Spine.
  const team = trpc.assessment.teamReadiness.useQuery(undefined, { enabled: isAuthenticated });
  const assignments = trpc.assignments.teamAssignments.useQuery(undefined, { enabled: isAuthenticated });

  const members = team.data?.members ?? [];
  const rows = assignments.data?.rows ?? [];

  const stats = useMemo(() => {
    const promotionReady = members.filter((m) => m.readiness.some((r) => r.level === "Promotion Candidate")).length;
    const active = members.filter((m) => m.overallConfidence > 0);
    const avg = active.length ? Math.round(active.reduce((s, m) => s + m.overallConfidence, 0) / active.length) : 0;
    const overdue = rows.filter((r) => r.overdue).length;
    const openAssignments = rows.filter((r) => !r.completed).length;
    return { size: members.length, promotionReady, avg, overdue, openAssignments };
  }, [members, rows]);

  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] text-white flex items-center justify-center p-6">
        <div className="text-center"><Lock className="w-8 h-8 text-gray-600 mx-auto mb-3" /><p className="text-gray-400 mb-4">Sign in as a team manager.</p>
          <button onClick={() => navigate("/login")} className="rounded bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm">Sign in</button></div>
      </div>
    );
  }

  const isManager = team.data?.isManager !== false && assignments.data?.isManager !== false;

  const exportCompliance = () => {
    if (rows.length === 0) { toast.error("No training records to export yet"); return; }
    const csvRows = rows.map(r => ({
      Technician: r.userName,
      "Training Module": r.moduleTitle,
      Status: r.completed ? "Complete" : r.overdue ? "Overdue" : "In progress",
      "Progress %": r.progressPct,
      Assigned: r.assignedAt ? new Date(r.assignedAt).toLocaleDateString() : "",
      Due: r.dueAt ? new Date(r.dueAt).toLocaleDateString() : "",
      Completed: (r as any).completedAt ? new Date((r as any).completedAt).toLocaleDateString() : "",
    }));
    const csv = toCsv(["Technician", "Training Module", "Status", "Progress %", "Assigned", "Due", "Completed"], csvRows);
    downloadCsv(`training-compliance-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast.success("Compliance report downloaded");
  };

  const tools = [
    { icon: LayoutDashboard, title: "Team Competency", desc: "Who's ready, strong, stale, struggling", href: "/manager" },
    { icon: ClipboardCheck, title: "Assign & Track Training", desc: "Assign modules, set due dates, track completion", href: "/manager" },
    { icon: BarChart3, title: "Workforce Planner", desc: "Plan capital-project readiness + ROI", href: "/planner" },
    { icon: Brain, title: "Workforce Intelligence", desc: "Benchmarks, supply vs. demand, API", href: "/intelligence" },
    { icon: Users, title: "Team Members", desc: "Invite, manage seats and roles", href: "/team" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white">
      <SEO title="Manager Hub" description="Run your maintenance team's training and competency" path="/manage" />
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"><Activity className="w-6 h-6 text-emerald-400" /> Manager Hub</h1>
        <p className="text-gray-500 text-sm mb-6">Your maintenance team's training, competency, and readiness — in one place.</p>

        {(team.isLoading || assignments.isLoading) ? (
          <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading your team…</div>
        ) : !isManager ? (
          <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-6">
            <p className="text-gray-300 mb-2">You don't manage a team yet.</p>
            <p className="text-gray-500 text-sm mb-4">Create a team to assign training, track completion, and see workforce competency.</p>
            <button onClick={() => navigate("/team")} className="inline-flex items-center gap-2 rounded bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm">Set up your team <ArrowRight className="w-4 h-4" /></button>
          </div>
        ) : (
          <>
            {/* Stat tiles */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {[
                { label: "Team size", value: stats.size, icon: Users },
                { label: "Avg competency", value: `${stats.avg}%`, icon: Activity },
                { label: "Promotion-ready", value: stats.promotionReady, icon: Award },
                { label: "Open assignments", value: stats.openAssignments, icon: ClipboardCheck },
                { label: "Overdue", value: stats.overdue, icon: AlertTriangle, danger: stats.overdue > 0 },
              ].map(s => (
                <div key={s.label} className="rounded-lg border border-gray-800 bg-[#0d120d] p-4">
                  <s.icon className={`w-4 h-4 mb-2 ${s.danger ? "text-red-400" : "text-emerald-400"}`} />
                  <div className={`text-xl font-semibold ${s.danger ? "text-red-400" : "text-white"}`}>{s.value}</div>
                  <div className="text-[11px] text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Tool cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {tools.map(t => (
                <button key={t.title} onClick={() => navigate(t.href)} className="text-left rounded-lg border border-gray-800 bg-[#0d120d] hover:border-emerald-500/40 p-4 transition-colors">
                  <t.icon className="w-5 h-5 text-emerald-400 mb-2" />
                  <div className="text-sm font-semibold text-white">{t.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{t.desc}</div>
                </button>
              ))}
            </div>

            {/* Compliance report + export */}
            <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-300">Training compliance report</h3>
                <button onClick={exportCompliance} className="inline-flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-sm px-3 py-1.5">
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
              {rows.length === 0 ? (
                <p className="text-gray-600 text-xs">No training assigned yet. Assign modules from Team Competency, then completion tracks here.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-gray-500 text-left">
                      <th className="py-1 pr-3">Technician</th><th className="pr-3">Training</th><th className="pr-3">Status</th><th className="pr-3">Due</th><th>Completed</th>
                    </tr></thead>
                    <tbody>
                      {rows.map(r => (
                        <tr key={r.id} className="border-t border-gray-800/60">
                          <td className="py-2 pr-3 text-gray-200 whitespace-nowrap">{r.userName}</td>
                          <td className="pr-3 text-gray-400">{r.moduleTitle}</td>
                          <td className="pr-3">
                            {r.completed ? <span className="text-emerald-400">Complete</span> : r.overdue ? <span className="text-red-400">Overdue ({r.progressPct}%)</span> : <span className="text-amber-400">In progress ({r.progressPct}%)</span>}
                          </td>
                          <td className="pr-3 text-gray-500">{r.dueAt ? new Date(r.dueAt).toLocaleDateString() : "—"}</td>
                          <td className="text-gray-500">{(r as any).completedAt ? new Date((r as any).completedAt).toLocaleDateString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-[10px] text-gray-600 mt-3">Auditor-ready record of who was assigned which training and when they completed it (e.g., LOTO / safety). Export includes progress and dates.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
