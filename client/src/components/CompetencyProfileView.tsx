/**
 * CompetencyProfileView — renders a competency vector (the Skills Passport body).
 * Shared by the private passport page and the public employer-verifiable view.
 */
import { Award, Brain, Gauge, ShieldCheck } from "lucide-react";

export interface DomainCompetency {
  domain: string;
  label: string;
  masteryPercent: number;
  attempts: number;
}
export interface CompetencyProfile {
  name: string;
  verificationCode: string | null;
  domains: DomainCompetency[];
  overall: {
    competencyPercent: number;
    reasoningScore: number | null;
    tier: string | null;
    scenariosCompleted: number;
    openResponses: number;
  };
}

function barColor(pct: number) {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 55) return "bg-amber-500";
  if (pct > 0) return "bg-red-500";
  return "bg-gray-700";
}

export default function CompetencyProfileView({ profile, verified }: { profile: CompetencyProfile; verified?: boolean }) {
  const { overall } = profile;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
          <p className="text-gray-500 text-sm">Industrial Troubleshooting Competency</p>
        </div>
        {verified && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs px-3 py-1 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified
          </span>
        )}
      </div>

      {/* Headline metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Overall competency", value: `${overall.competencyPercent}%`, icon: Gauge },
          { label: "Reasoning (open-response)", value: overall.reasoningScore == null ? "—" : `${overall.reasoningScore}%`, icon: Brain },
          { label: "Certification tier", value: overall.tier ? overall.tier[0].toUpperCase() + overall.tier.slice(1) : "—", icon: Award },
          { label: "Scenarios completed", value: String(overall.scenariosCompleted), icon: ShieldCheck },
        ].map(m => (
          <div key={m.label} className="rounded-lg border border-gray-800 bg-[#0d120d] p-4">
            <m.icon className="w-4 h-4 text-emerald-400 mb-2" />
            <div className="text-white text-xl font-semibold">{m.value}</div>
            <div className="text-gray-500 text-[11px] mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Domain vector */}
      <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Competency by domain</h3>
        <div className="space-y-3">
          {profile.domains.map(d => (
            <div key={d.domain}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-300">{d.label}</span>
                <span className="text-gray-500">
                  {d.attempts > 0 ? `${d.masteryPercent}%` : "No data"}
                  {d.attempts > 0 && <span className="text-gray-600"> · {d.attempts} attempt{d.attempts === 1 ? "" : "s"}</span>}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                <div className={`h-full ${barColor(d.attempts > 0 ? d.masteryPercent : 0)}`} style={{ width: `${d.attempts > 0 ? d.masteryPercent : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
