/**
 * AI Workforce Planner — describe a capital project, get a readiness plan + ROI.
 *
 * "We're adding 3 packaging lines next month" → who's ready, who to accelerate,
 * who to train from scratch, a prioritized sequence, and a $ projection. Built on
 * the demonstrated competency graph; the AI organizes the data, never invents it.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ClipboardList, Loader2, Lock, Sparkles, CheckCircle2, AlertTriangle, DollarSign } from "lucide-react";
import SEO from "@/components/SEO";

const DOMAINS = [
  ["vfd", "VFD Diagnostics"], ["plc", "PLC Diagnostics"], ["motors", "Motor Control"], ["safety", "Safety Circuits"],
  ["electrical", "Electrical Power"], ["networking", "Industrial Networking"], ["sensors", "Sensors & Instrumentation"], ["integration", "System Integration"],
] as const;

const READY_STYLE: Record<string, string> = {
  ready: "text-emerald-400", accelerate: "text-amber-400", train: "text-red-400",
};

export default function WorkforcePlanner() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [projectName, setProjectName] = useState("");
  const [required, setRequired] = useState<string[]>(["plc"]);
  const [weeks, setWeeks] = useState(4);
  const [costPerMin, setCostPerMin] = useState("");
  const [downtimeHrs, setDowntimeHrs] = useState("");
  const plan = trpc.planner.plan.useMutation();

  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] text-white flex items-center justify-center p-6">
        <div className="text-center"><Lock className="w-8 h-8 text-gray-600 mx-auto mb-3" /><p className="text-gray-400 mb-4">Sign in as a team manager.</p>
          <button onClick={() => navigate("/login")} className="rounded bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm">Sign in</button></div>
      </div>
    );
  }

  const toggle = (d: string) => setRequired(r => r.includes(d) ? r.filter(x => x !== d) : [...r, d]);

  const run = async () => {
    if (!projectName.trim() || required.length === 0) { toast.error("Name the project and pick at least one required skill"); return; }
    const res = await plan.mutateAsync({
      projectName, requiredDomains: required as any, targetWeeks: weeks,
      downtimeCostPerMin: costPerMin ? Number(costPerMin) : undefined,
      currentDowntimeHoursPerMonth: downtimeHrs ? Number(downtimeHrs) : undefined,
    });
    if (!res.ok) toast.error("Create a team first to plan against your workforce.");
  };

  const r = plan.data && plan.data.ok ? plan.data : null;
  const gaps = r?.gaps ?? [];
  const roster = r?.roster ?? [];

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white">
      <SEO title="AI Workforce Planner" description="Plan capital-project readiness from demonstrated competency" path="/planner" />
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"><ClipboardList className="w-6 h-6 text-emerald-400" /> AI Workforce Planner</h1>
        <p className="text-gray-500 text-sm mb-6">Describe the project. See exactly who's ready, who to train, and what it's worth.</p>

        {/* Input */}
        <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-4 space-y-3 mb-6">
          <input className="w-full bg-[#0a0f0a] border border-gray-700 rounded px-3 py-2 text-sm" placeholder='e.g. "Installing 3 new packaging lines"' value={projectName} onChange={e => setProjectName(e.target.value)} />
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Required skills</label>
            <div className="flex flex-wrap gap-2">
              {DOMAINS.map(([v, l]) => (
                <button key={v} onClick={() => toggle(v)} className={`text-xs rounded-full px-3 py-1 border ${required.includes(v) ? "bg-emerald-600 border-emerald-500 text-white" : "border-gray-700 text-gray-400 hover:border-gray-500"}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="text-xs text-gray-400">Ready in (weeks)
              <input type="number" min={1} max={104} value={weeks} onChange={e => setWeeks(Number(e.target.value))} className="block mt-1 w-full bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs text-gray-400">Downtime $/min <span className="text-gray-600">(opt)</span>
              <input value={costPerMin} onChange={e => setCostPerMin(e.target.value)} placeholder="e.g. 250" className="block mt-1 w-full bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs text-gray-400">Downtime hrs/mo <span className="text-gray-600">(opt)</span>
              <input value={downtimeHrs} onChange={e => setDowntimeHrs(e.target.value)} placeholder="e.g. 40" className="block mt-1 w-full bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm" />
            </label>
          </div>
          <button onClick={run} disabled={plan.isPending} className="inline-flex items-center gap-2 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-sm px-4 py-2">
            {plan.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Build readiness plan
          </button>
        </div>

        {/* Result */}
        {r && (
          <div className="space-y-5">
            <div className="rounded-lg border border-emerald-500/25 bg-[#0d120d] p-5">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-3xl font-bold text-white">{r.fullyReady}/{r.teamSize}</span>
                <span className="text-gray-400 text-sm">fully ready for {r.projectName} in {r.targetWeeks} weeks</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{r.summary}</p>
            </div>

            {/* ROI */}
            {r.roi && (
              <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-4">
                <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4" /> Projected monthly savings: ${r.roi.projectedMonthlySavings.toLocaleString()}</h3>
                <p className="text-xs text-gray-400">{r.roi.basis}</p>
                <p className="text-[10px] text-gray-600 mt-1">{r.roi.assumptionNote}</p>
              </div>
            )}

            {/* Per-skill gap */}
            <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Gap by skill (ready / accelerate / train)</h3>
              <div className="space-y-2">
                {gaps.map(g => (
                  <div key={g.domain} className="flex items-center gap-3 text-sm">
                    <span className="w-44 text-gray-300">{g.label}</span>
                    <span className="text-emerald-400">{g.ready} ready</span>
                    <span className="text-amber-400">{g.accelerate} accelerate</span>
                    <span className="text-red-400">{g.train} train</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Roster */}
            <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-4 overflow-x-auto">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Roster readiness</h3>
              <table className="w-full text-xs">
                <thead><tr className="text-gray-500 text-left"><th className="py-1 pr-3">Technician</th>{gaps.map(g => <th key={g.domain} className="px-2">{g.domain.slice(0, 4)}</th>)}</tr></thead>
                <tbody>
                  {roster.map((m, i) => (
                    <tr key={i} className="border-t border-gray-800/60">
                      <td className="py-2 pr-3 text-gray-200 whitespace-nowrap">{m.name} {m.overallReady && <CheckCircle2 className="inline w-3 h-3 text-emerald-400" />}</td>
                      {gaps.map(g => {
                        const d = m.byDomain[g.domain];
                        return <td key={g.domain} className={`px-2 ${READY_STYLE[d.readiness]}`}>{d.readiness === "ready" ? "✓" : d.readiness === "accelerate" ? `~${d.confidence}` : "✗"}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-gray-600 mt-3 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> ✓ ready · ~score accelerate · ✗ train from scratch. Based on demonstrated competency only.</p>
            </div>
          </div>
        )}

        {plan.data && !plan.data.ok && (
          <p className="text-gray-500 text-sm">You need a team to plan against. Create one in Team settings.</p>
        )}
      </div>
    </div>
  );
}
