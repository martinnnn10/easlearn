/**
 * ManagerDashboardPreview — logged-out / demo render of the Manager Dashboard
 * with clearly-labeled sample team data. Answers the maintenance manager's real
 * questions: who's ready, who's weak, who needs a refresh, where the gaps are.
 */
import { Award, Zap, AlertTriangle, TrendingDown, ShieldCheck, Download } from "lucide-react";
import { SKILL_DOMAIN_LABELS, type SkillDomain } from "@shared/competencyMatrix";
import { SAMPLE_TEAM } from "@/lib/sampleCompetency";

const DOMAINS = Object.keys(SKILL_DOMAIN_LABELS) as SkillDomain[];

export default function ManagerDashboardPreview() {
  const members = SAMPLE_TEAM;
  const promotionReady = members.filter((m) => m.promotionReady);
  const struggling: { name: string; domain: string; confidence: number }[] = [];
  const stale: { name: string; domain: string; days: number | null }[] = [];
  const strongest: Record<string, { name: string; score: number } | null> = {};
  for (const d of DOMAINS) {
    let best: { name: string; score: number } | null = null;
    for (const m of members) {
      const c = m.cells.find((x) => x.domain === d);
      if (c && c.attempts > 0 && (!best || c.confidence > best.score)) best = { name: m.name, score: c.confidence };
    }
    strongest[d] = best;
  }
  for (const m of members) {
    for (const c of m.cells) {
      if (c.attempts >= 2 && c.confidence < 50) struggling.push({ name: m.name, domain: c.label, confidence: c.confidence });
      if (c.attempts > 0 && c.decay === "decayed") stale.push({ name: m.name, domain: c.label, days: c.daysSince });
    }
  }

  return (
    <div className="space-y-6">
      {/* Decision cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-emerald-500/25 bg-[#0d120d] p-4">
          <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-2 mb-2"><Award className="w-4 h-4" /> Promotion-ready ({promotionReady.length})</h3>
          <ul className="text-sm text-gray-200 space-y-1">{promotionReady.map((m) => <li key={m.userId} className="flex justify-between"><span>{m.name} <span className="text-gray-500 text-xs">· {m.role}</span></span><span className="text-emerald-400 text-xs">overall {m.overall}%</span></li>)}</ul>
        </div>
        <div className="rounded-lg border border-red-500/25 bg-[#0d120d] p-4">
          <h3 className="text-sm font-semibold text-red-300 flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4" /> Needs training ({struggling.length})</h3>
          <ul className="text-sm text-gray-300 space-y-1">{struggling.slice(0, 6).map((s, i) => <li key={i} className="flex justify-between"><span>{s.name} · {s.domain}</span><span className="text-red-400 text-xs">{s.confidence}%</span></li>)}</ul>
        </div>
        <div className="rounded-lg border border-amber-500/25 bg-[#0d120d] p-4">
          <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4" /> Needs refresh / recert ({stale.length})</h3>
          {stale.length === 0 ? <p className="text-gray-600 text-xs">All competencies fresh.</p> : (
            <ul className="text-sm text-gray-300 space-y-1">{stale.slice(0, 6).map((s, i) => <li key={i} className="flex justify-between"><span>{s.name} · {s.domain}</span><span className="text-amber-400 text-xs">{s.days}d</span></li>)}</ul>
          )}
        </div>
        <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-4">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-emerald-400" /> Strongest by domain</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            {DOMAINS.map((d) => strongest[d] && (
              <li key={d} className="flex justify-between"><span>{SKILL_DOMAIN_LABELS[d]}</span><span className="text-gray-200">{strongest[d]!.name} · {strongest[d]!.score}%</span></li>
            ))}
          </ul>
        </div>
      </div>

      {/* Team competency matrix */}
      <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-4 overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300">Team competency matrix</h3>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300 border border-emerald-500/30 rounded px-2 py-1"><Download className="w-3 h-3" /> Export report (CSV)</span>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="text-gray-500 text-left">
            <th className="py-1 pr-3">Technician</th>
            {DOMAINS.map((d) => <th key={d} className="px-1 text-center" title={SKILL_DOMAIN_LABELS[d]}>{d.slice(0, 4)}</th>)}
          </tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.userId} className="border-t border-gray-800/60">
                <td className="py-2 pr-3 text-gray-200 whitespace-nowrap">{m.name} {m.promotionReady && <Award className="inline w-3 h-3 text-emerald-400" />}</td>
                {DOMAINS.map((d) => {
                  const c = m.cells.find((x) => x.domain === d);
                  const v = c && c.attempts > 0 ? c.confidence : null;
                  const color = v == null ? "text-gray-700" : v >= 70 ? "text-emerald-400" : v >= 50 ? "text-amber-400" : "text-red-400";
                  return <td key={d} className={`px-1 text-center font-mono ${color}`}>{v == null ? "·" : v}{c?.managerValidated ? <ShieldCheck className="inline w-2.5 h-2.5 ml-0.5 text-emerald-400" /> : null}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-gray-600 mt-3">Green ≥ 70% · amber 50–69% · red &lt; 50% · <ShieldCheck className="inline w-3 h-3 text-emerald-400" /> = manager-validated on the plant floor.</p>
      </div>
    </div>
  );
}
