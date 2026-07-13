/**
 * CompetencyPreview — logged-out / demo render of the Competency Graph using
 * clearly-labeled synthetic data, so evaluators see what the live profile
 * produces before creating an account.
 */
import { Activity, Clock, ShieldCheck, AlertTriangle, Award, TrendingUp } from "lucide-react";
import { LEVEL_LABEL } from "@shared/competencyGraph";
import { SAMPLE_MY_GRAPH, METHODOLOGY_TIERS, tierForScore } from "@/lib/sampleCompetency";

const LEVEL_COLOR: Record<string, string> = {
  expert: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  proficient: "text-emerald-300 border-emerald-500/25 bg-emerald-500/5",
  competent: "text-amber-300 border-amber-500/25 bg-amber-500/5",
  developing: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  not_demonstrated: "text-gray-600 border-gray-800 bg-transparent",
};

function fmt(s: number | null) {
  if (s == null) return "—";
  const m = Math.floor(s / 60), ss = s % 60;
  return m > 0 ? `${m}m ${ss}s` : `${ss}s`;
}

export default function CompetencyPreview() {
  const data = SAMPLE_MY_GRAPH;
  const tier = tierForScore(data.overall);
  return (
    <div className="space-y-6">
      {/* Methodology tier + overall confidence — the headline signal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-emerald-500/30 bg-[#0d120d] p-4">
          <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">Methodology tier</div>
          <div className="text-emerald-300 font-semibold flex items-center gap-1.5"><Award className="w-4 h-4" /> {tier}</div>
        </div>
        <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-4">
          <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">Overall confidence</div>
          <div className="text-white font-mono text-2xl">{data.overall}%</div>
        </div>
        <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-4">
          <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">Readiness</div>
          <div className="text-emerald-300 font-semibold flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> Promotion-ready</div>
        </div>
      </div>

      {/* Domain-by-domain graph */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> Skill domains — demonstrated, not declared</h3>
        <div className="space-y-3">
          {data.cells.map((c) => (
            <div key={c.domain} className={`rounded-lg border p-4 ${c.attempts > 0 ? "border-gray-800 bg-[#0d120d]" : "border-gray-800/50 bg-transparent"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{c.label}</span>
                  <span className={`text-[10px] uppercase tracking-wide rounded border px-1.5 py-0.5 ${LEVEL_COLOR[c.level]}`}>{LEVEL_LABEL[c.level]}</span>
                  {c.managerValidated && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                {c.attempts > 0 && <span className="text-emerald-400 font-mono text-lg">{c.confidence}%</span>}
              </div>
              {c.attempts === 0 ? (
                <p className="text-gray-600 text-xs">Not demonstrated yet — run a scenario in this domain.</p>
              ) : (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
                  <span>{c.attempts} attempts</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> avg {fmt(c.avgTimeSeconds)} · best {fmt(c.bestTimeSeconds)}</span>
                  {c.velocity !== 0 && <span className="flex items-center gap-1 text-emerald-400"><TrendingUp className="w-3 h-3" /> +{c.velocity} trend</span>}
                  {c.decay !== "fresh" && (
                    <span className={`flex items-center gap-1 ${c.decay === "decayed" ? "text-red-400" : "text-amber-400"}`}>
                      <AlertTriangle className="w-3 h-3" /> {c.decay === "decayed" ? "needs refresh" : "getting stale"}{c.daysSince != null ? ` (${c.daysSince}d)` : ""}
                    </span>
                  )}
                  {c.managerValidated && <span className="flex items-center gap-1 text-emerald-400"><ShieldCheck className="w-3 h-3" /> manager-validated</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* How the tier is computed — makes the measurement legible to a buyer */}
      <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">How methodology is scored</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {METHODOLOGY_TIERS.map((t) => (
            <div key={t.tier} className="flex items-start gap-2 text-xs">
              <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${t.tone === "emerald" ? "bg-emerald-400" : t.tone === "amber" ? "bg-amber-400" : "bg-red-400"}`} />
              <div>
                <span className="text-gray-200 font-medium">{t.tier}</span>
                <span className="text-gray-600"> · {t.min}%+</span>
                <div className="text-gray-500">{t.blurb}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
