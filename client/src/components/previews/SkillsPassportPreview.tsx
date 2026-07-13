/**
 * SkillsPassportPreview — logged-out / demo render of an operator's Skills
 * Passport with clearly-labeled sample data: verified competencies, completed
 * simulations, certificates, job-readiness, and the shareable verifiable proof.
 */
import { BadgeCheck, GraduationCap, ShieldCheck, Cpu, Share2, CheckCircle2, Trophy, Award, MessageSquare } from "lucide-react";
import { tierForScore } from "@/lib/sampleCompetency";

const COMMUNICATION = [
  { area: "Fault Explanation", level: "Ready", note: "Explained overload trip with verified coil voltage and follow-up." },
  { area: "Work Order Documentation", level: "Almost Ready", note: "Notes improving; occasionally missing the follow-up recommendation." },
  { area: "Operator Communication", level: "Ready", note: "Clear, calm, non-blaming — tells operators what to do if it recurs." },
  { area: "Shift Handoff", level: "Needs Training", note: "Tends to say 'fixed' without stating what's still unknown." },
];
const COMM_STYLE: Record<string, string> = {
  Ready: "text-emerald-300 border-emerald-500/30",
  "Almost Ready": "text-amber-300 border-amber-500/25",
  "Needs Training": "text-red-300 border-red-500/30",
};

const VERIFIED = [
  { domain: "Motor Control", conf: 88, validated: true },
  { domain: "Safety Circuits", conf: 84, validated: true },
  { domain: "Electrical Power", conf: 79, validated: false },
  { domain: "PLC Diagnostics", conf: 72, validated: false },
  { domain: "VFD Diagnostics", conf: 61, validated: false },
];

const SIMS = [
  { title: "PL-07 Conveyor Safety & Motor Control", tier: "Master Diagnostician", pct: 88 },
  { title: "VFD Fault-Code Recovery (F070)", tier: "Systematic Troubleshooter", pct: 71 },
  { title: "PLC I/O Troubleshooting — stuck output", tier: "Systematic Troubleshooter", pct: 69 },
];

const CERTS = ["Electrical Safety & LOTO", "Motor Control Circuits", "Industrial Troubleshooting Method"];
const STANDARDS = ["NFPA 70E", "NEC Art. 430", "OSHA 1910.147", "UL 508A"];

export default function SkillsPassportPreview() {
  const overall = 81;
  return (
    <div className="space-y-6">
      {/* Operator identity + job readiness */}
      <div className="rounded-xl border border-emerald-500/25 bg-gradient-to-br from-[#0d150d] to-[#0a0f0a] p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-lg">MD</div>
            <div>
              <div className="text-white font-semibold text-lg">Marcus D.</div>
              <div className="text-gray-500 text-xs">Operator → Maintenance Tech · 62 scenarios diagnosed</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs px-3 py-1.5 border border-emerald-500/30 h-fit">
            <Trophy className="w-3.5 h-3.5" /> Job-ready · {tierForScore(overall)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div><div className="text-white text-xl font-semibold">{overall}%</div><div className="text-gray-500 text-[11px]">Overall competency</div></div>
          <div><div className="text-white text-xl font-semibold">2</div><div className="text-gray-500 text-[11px]">Manager-validated domains</div></div>
          <div><div className="text-white text-xl font-semibold">3</div><div className="text-gray-500 text-[11px]">Certificates earned</div></div>
        </div>
      </div>

      {/* Verified competencies */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified competencies</h3>
        <div className="space-y-2">
          {VERIFIED.map((v) => (
            <div key={v.domain} className="flex items-center gap-3 rounded-lg border border-gray-800 bg-[#0d120d] p-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm">{v.domain}</span>
                  {v.validated && <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 border border-emerald-500/30 rounded px-1.5 py-0.5"><ShieldCheck className="w-3 h-3" /> manager-validated</span>}
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-gray-800 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${v.conf}%` }} /></div>
              </div>
              <span className="text-emerald-400 font-mono text-sm w-10 text-right">{v.conf}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Completed simulations */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Cpu className="w-4 h-4 text-emerald-400" /> Completed simulations</h3>
        <div className="space-y-2">
          {SIMS.map((s) => (
            <div key={s.title} className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-[#0d120d] p-3">
              <div className="flex items-center gap-2 min-w-0"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /><span className="text-gray-200 text-sm truncate">{s.title}</span></div>
              <div className="text-right shrink-0"><div className="text-emerald-300 text-xs">{s.tier}</div><div className="text-gray-500 text-[11px]">{s.pct}% method</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Certificates + standards */}
      <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-emerald-400" /> Certificates & standards alignment</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {CERTS.map((c) => <span key={c} className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 text-[11px] px-2 py-1"><Award className="w-3 h-3" /> {c}</span>)}
        </div>
        <div className="flex flex-wrap gap-2">
          {STANDARDS.map((c) => <span key={c} className="inline-flex items-center gap-1 rounded bg-gray-800 text-gray-300 text-[10px] px-2 py-1"><BadgeCheck className="w-3 h-3 text-emerald-400" /> {c}</span>)}
        </div>
        <p className="text-[10px] text-gray-600 mt-3">Content is aligned to the standards shown. Standards alignment is not an endorsement by the listed bodies.</p>
      </div>

      {/* Maintenance communication — job-readiness proof */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-emerald-400" /> Maintenance Communication</h3>
        <div className="space-y-2">
          {COMMUNICATION.map((c) => (
            <div key={c.area} className="flex items-start justify-between gap-3 rounded-lg border border-gray-800 bg-[#0d120d] p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2"><span className="text-white text-sm">{c.area}</span><span className={`text-[10px] uppercase tracking-wide rounded border px-1.5 py-0.5 ${COMM_STYLE[c.level]}`}>{c.level}</span></div>
                <p className="text-[11px] text-gray-500 mt-0.5">{c.note}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-500 mt-2">EASLearn measures whether a tech can <span className="text-gray-300">explain, document, and hand off</span> a fault — not just find it.</p>
      </div>

      {/* Shareable proof concept */}
      <div className="rounded-lg border border-emerald-500/25 bg-[#0d120d] p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-gray-300"><Share2 className="w-4 h-4 text-emerald-400" /> Employers verify this passport at a shareable link — no login required.</div>
        <code className="text-[11px] text-emerald-300 bg-black/40 rounded px-2 py-1">easlearn.com/verify/skills/MD-8F3A</code>
      </div>
    </div>
  );
}
