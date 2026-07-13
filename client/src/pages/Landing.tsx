/**
 * Landing — the EASLearn homepage.
 *
 * Two audiences, one page. An OPERATOR must instantly see "this helps me become
 * maintenance" and can try the live simulator with no signup. A VP of Maintenance
 * / Plant Manager must see "this reduces downtime by building verified competency,
 * and I can measure it" — with proof: simulator, methodology scoring, competency
 * tracking, a manager dashboard, ROI, and an enterprise buying path.
 *
 * Depth that used to live only on /explore now sells here, without clutter.
 */
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Zap, ArrowRight, Gauge, Brain, ShieldCheck, Cpu, Activity, Users, Award,
  TrendingDown, Building2, Lock, FileCheck, Wrench, CheckCircle2, Clock, Download,
} from "lucide-react";
import SEO from "@/components/SEO";
import { OPERATOR_TO_TECH } from "@shared/operatorToTech";
import { METHODOLOGY_TIERS } from "@/lib/sampleCompetency";

const LAB_ENTRY = "/labs?entry=landing&mode=practice#conveyor-troubleshoot";

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`px-4 py-16 sm:py-20 border-t border-gray-900 ${className}`}>{children}</section>;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-3">{children}</div>;
}

export default function Landing() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#070b07] text-white">
      <SEO
        title="Train Operators Into Maintenance Technicians | EASLearn"
        description="EASLearn is a digital apprenticeship platform that helps manufacturers reduce downtime by building verified maintenance competency — plant-floor lessons, realistic troubleshooting simulations, AI coaching, and workforce readiness tracking."
        path="/"
      />

      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur bg-[#070b07]/80 border-b border-gray-900">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold tracking-wide text-sm">EASLearn</span>
            <span className="hidden sm:inline text-[11px] text-gray-500">· Manufacturing Competency Intelligence</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/contact")} className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold">
              Request employer demo
            </button>
            {isAuthenticated ? (
              <button onClick={() => navigate("/dashboard")} className="text-xs text-gray-400 hover:text-white px-2 py-1.5">Dashboard →</button>
            ) : (
              <button onClick={() => navigate("/login")} className="text-xs text-gray-400 hover:text-white px-2 py-1.5">Log in</button>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <div className="px-4 pt-16 pb-8">
        <div className="max-w-4xl mx-auto text-center">
          <Eyebrow>EASLearn · Industrial Maintenance Training</Eyebrow>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold leading-[1.08] mb-5" style={{ fontFamily: "var(--font-heading, inherit)" }}>
            Train Operators Into<br />Maintenance Technicians
          </h1>
          <p className="text-base sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            EASLearn is a digital apprenticeship platform that helps manufacturers reduce downtime by building
            verified maintenance competency through plant-floor lessons, realistic troubleshooting simulations,
            AI coaching, and workforce readiness tracking.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate("/contact")}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-7 py-4 text-base font-semibold shadow-lg shadow-emerald-900/40"
            >
              <Building2 className="w-5 h-5" /> Request Employer Demo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => navigate(LAB_ENTRY)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/40 hover:bg-emerald-500/10 px-7 py-4 text-base font-semibold text-emerald-300"
            >
              <Zap className="w-5 h-5" /> Start Diagnosing Free
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-4">No signup to try the simulator · Operators start free · Employers see a full workforce dashboard</p>
        </div>
      </div>

      {/* LIVE DEMO HOOK — the operator "aha", no signup */}
      <div className="px-4 pb-8">
        <div className="rounded-xl border border-red-500/25 bg-[#130c0c] p-6 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] px-3 py-1 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE DEMO · LINE DOWN · $400/min
          </div>
          <p className="text-white text-lg font-medium mb-1">A conveyor just went down. Can you find the fault?</p>
          <p className="text-gray-500 text-sm mb-4">Try the real scored simulator — no signup, no card. This is the exact experience your operators train on.</p>
          <button
            onClick={() => navigate(LAB_ENTRY)}
            className="group w-full inline-flex items-center justify-center gap-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-8 py-4 text-base font-semibold"
          >
            <Zap className="w-5 h-5" /> Start diagnosing free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* THE ONE-LINE THESIS + proof stats */}
      <Section className="bg-[#0a0f0a] text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">We reduce downtime by improving workforce competency.</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-10">
            Every hour a line is down costs thousands. The fastest lever most plants have isn't more headcount — it's
            turning the operators they already have into technicians who can diagnose, and knowing exactly who's ready.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { n: "6", l: "domain competency graph, demonstrated not declared", icon: Activity },
              { n: "90-day", l: "operator → maintenance-tech pathway", icon: Wrench },
              { n: "4-tier", l: "methodology scoring on every diagnosis", icon: Gauge },
              { n: "1 dash", l: "manager view of readiness & skill gaps", icon: Users },
            ].map((s) => (
              <div key={s.l} className="rounded-lg border border-gray-800 bg-[#0d120d] p-4 text-left">
                <s.icon className="w-4 h-4 text-emerald-400 mb-2" />
                <div className="text-white text-xl font-bold">{s.n}</div>
                <div className="text-gray-500 text-xs mt-1 leading-snug">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* SIMULATOR PREVIEW */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Eyebrow>Learn by diagnosing, not watching</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">A realistic troubleshooting simulator</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Operators work a down machine the way a tech does — read the twin, trace the ladder, check I/O, take meter readings, gather evidence, and commit to a diagnosis. Every move is scored.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Cpu, t: "Machine twin", d: "A live model of the machine — statuses, faults, and behavior respond to what you do." },
              { icon: Activity, t: "Ladder logic", d: "Read the running PLC program: rungs go green as conditions make, exactly like RSLogix online." },
              { icon: Zap, t: "I/O panel", d: "Inputs and outputs with real addresses (I:1/2, O:2/0) so you learn to trace signal, not memorize." },
              { icon: Gauge, t: "Multimeter", d: "Take voltage/continuity readings across the circuit and interpret what they mean." },
              { icon: FileCheck, t: "Evidence collection", d: "Build a case from prints and readings before you commit — the habit that separates techs from parts-changers." },
              { icon: Brain, t: "AI coaching", d: "Stuck? The tutor nudges toward the next logical check — it never just hands you the answer." },
            ].map((f) => (
              <div key={f.t} className="rounded-lg border border-gray-800 bg-[#0d120d] p-4">
                <f.icon className="w-5 h-5 text-emerald-400 mb-2" />
                <div className="text-white font-semibold text-sm">{f.t}</div>
                <div className="text-gray-500 text-xs mt-1 leading-relaxed">{f.d}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <button onClick={() => navigate(LAB_ENTRY)} className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold">
              Try the conveyor scenario free <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Section>

      {/* METHODOLOGY SCORING */}
      <Section className="bg-[#0a0f0a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Eyebrow>Methodology scoring</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">We measure how they think, not whether they watched</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Completion means nothing on a down line. Every diagnosis is scored on method — did they gather, check prints, measure, and isolate — and mapped to a tier a manager can act on.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {METHODOLOGY_TIERS.map((t) => (
              <div key={t.tier} className={`rounded-lg border p-4 ${t.tone === "emerald" ? "border-emerald-500/30 bg-[#0d120d]" : t.tone === "amber" ? "border-amber-500/25 bg-[#0d120d]" : "border-red-500/25 bg-[#0d120d]"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-semibold ${t.tone === "emerald" ? "text-emerald-300" : t.tone === "amber" ? "text-amber-300" : "text-red-300"}`}>{t.tier}</span>
                  <span className="text-gray-600 text-xs font-mono">{t.min}%+</span>
                </div>
                <p className="text-gray-500 text-sm">{t.blurb}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-600 mt-4">Plus diagnostic confidence, time-to-solve, and evidence quality on every attempt.</p>
        </div>
      </Section>

      {/* COMPETENCY PROOF */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Eyebrow>Competency tracking</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">A competency graph, demonstrated — not declared</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Skill is proven by how someone actually diagnoses, across eight domains. Confidence decays if it isn't re-demonstrated, and managers can validate competency on the plant floor.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-5">
              <div className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> Sample operator — domain strength</div>
              {[
                { d: "Motor Control", v: 88, tag: "manager-validated" },
                { d: "Safety Circuits", v: 84, tag: "manager-validated" },
                { d: "Electrical Power", v: 79 },
                { d: "PLC Diagnostics", v: 72, tag: "getting stale" },
                { d: "VFD Diagnostics", v: 61 },
              ].map((r) => (
                <div key={r.d} className="flex items-center gap-3 mb-2.5">
                  <span className="text-gray-300 text-xs w-32 shrink-0">{r.d}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden"><div className={`h-full ${r.v >= 70 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${r.v}%` }} /></div>
                  <span className="text-emerald-400 font-mono text-xs w-8 text-right">{r.v}%</span>
                  {r.tag && <span className={`text-[9px] rounded px-1 py-0.5 border ${r.tag === "getting stale" ? "text-amber-300 border-amber-500/30" : "text-emerald-300 border-emerald-500/30"}`}>{r.tag}</span>}
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-5 flex flex-col justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400 mb-3" />
              <h3 className="font-semibold text-white mb-2">Verified skill evidence</h3>
              <p className="text-gray-500 text-sm mb-4">Each operator builds a Skills Passport: verified competencies, completed simulations, certificates, and an employer-verifiable share link.</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigate("/competency")} className="inline-flex items-center gap-1.5 rounded border border-gray-700 hover:bg-gray-800 px-3 py-1.5 text-xs">See the competency graph <ArrowRight className="w-3 h-3" /></button>
                <button onClick={() => navigate("/skills-passport")} className="inline-flex items-center gap-1.5 rounded border border-gray-700 hover:bg-gray-800 px-3 py-1.5 text-xs">See a Skills Passport <ArrowRight className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* OPERATOR → TECH PATHWAY (real 6-stage program) */}
      <Section className="bg-[#0a0f0a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Eyebrow>The pathway</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">{OPERATOR_TO_TECH.title}</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">{OPERATOR_TO_TECH.subtitle} A structured apprenticeship from "operator who wants more" to a technician a plant will hire or promote.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {OPERATOR_TO_TECH.stages.map((s, i) => (
              <div key={s.id} className="rounded-lg border border-gray-800 bg-[#0d120d] p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-emerald-400 font-bold text-sm">Stage {i + 1}</span>
                  <span className="text-[11px] text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> ~{s.days}d</span>
                </div>
                <div className="text-white font-semibold text-sm">{s.title}</div>
                <div className="text-gray-500 text-xs mt-1 leading-relaxed">{s.tagline}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <button onClick={() => navigate("/become-a-tech")} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold">
              Follow the full path <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Section>

      {/* MANAGER DASHBOARD PREVIEW */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Eyebrow>For maintenance managers</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">See who's ready, who's weak, who needs training</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">One dashboard answers the questions you actually ask on shift — and exports a procurement-ready report.</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-[#0d120d] p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg border border-emerald-500/25 p-3">
                <div className="text-emerald-300 text-xs font-semibold flex items-center gap-1.5 mb-2"><Award className="w-3.5 h-3.5" /> Promotion-ready</div>
                <div className="text-sm text-gray-200">Marcus D. <span className="text-emerald-400 text-xs">88%</span></div>
                <div className="text-sm text-gray-200">Alicia M. <span className="text-emerald-400 text-xs">84%</span></div>
              </div>
              <div className="rounded-lg border border-red-500/25 p-3">
                <div className="text-red-300 text-xs font-semibold flex items-center gap-1.5 mb-2"><TrendingDown className="w-3.5 h-3.5" /> Needs training</div>
                <div className="text-sm text-gray-200">Tomás V. · Electrical <span className="text-red-400 text-xs">38%</span></div>
                <div className="text-sm text-gray-200">Danny R. · PLC <span className="text-red-400 text-xs">46%</span></div>
              </div>
              <div className="rounded-lg border border-amber-500/25 p-3">
                <div className="text-amber-300 text-xs font-semibold flex items-center gap-1.5 mb-2"><Clock className="w-3.5 h-3.5" /> Needs refresh</div>
                <div className="text-sm text-gray-200">Danny R. · PLC <span className="text-amber-400 text-xs">210d</span></div>
                <div className="text-xs text-gray-600 mt-1">Competency decays if not re-demonstrated.</div>
              </div>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300 border border-emerald-500/30 rounded px-2 py-1"><Download className="w-3 h-3" /> Export report (CSV)</span>
              <button onClick={() => navigate("/manager")} className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-sm font-semibold">Open the full manager dashboard <ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </Section>

      {/* ROI / DOWNTIME */}
      <Section className="bg-[#0a0f0a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Eyebrow>The business case</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Competency is the cheapest downtime insurance you have</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: TrendingDown, t: "Less downtime", d: "Techs who diagnose with a method fix the real fault the first time — fewer repeat calls, shorter MTTR." },
              { icon: Wrench, t: "Faster ramp", d: "A structured pathway cuts the months of shadowing it takes to make a new tech productive." },
              { icon: Users, t: "Internal promotion pipeline", d: "Grow techs from the operators you already have — cheaper and stickier than hiring off the street." },
              { icon: Gauge, t: "Less shadowing burden", d: "Simulated reps move practice off your senior techs and off live equipment." },
              { icon: Activity, t: "Manager visibility", d: "Know your real skill coverage per line and per shift — not a binder of expired certs." },
              { icon: FileCheck, t: "Reporting & exports", d: "Audit-ready competency records and CSV exports for HR, safety, and procurement." },
            ].map((f) => (
              <div key={f.t} className="rounded-lg border border-gray-800 bg-[#0d120d] p-4">
                <f.icon className="w-5 h-5 text-emerald-400 mb-2" />
                <div className="text-white font-semibold text-sm">{f.t}</div>
                <div className="text-gray-500 text-xs mt-1 leading-relaxed">{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ENTERPRISE TRUST */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Eyebrow>Enterprise-ready</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Built to deploy across a plant — or a network of them</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { icon: Lock, t: "SSO / SAML" },
              { icon: Users, t: "Volume seats" },
              { icon: Activity, t: "Competency analytics" },
              { icon: FileCheck, t: "Reporting & exports" },
              { icon: ShieldCheck, t: "Standards alignment" },
              { icon: Building2, t: "Procurement invoicing" },
              { icon: Wrench, t: "Custom implementation" },
              { icon: CheckCircle2, t: "Onboarding support" },
            ].map((f) => (
              <div key={f.t} className="rounded-lg border border-gray-800 bg-[#0d120d] p-3 flex items-center gap-2">
                <f.icon className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-gray-300 text-xs">{f.t}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => navigate("/enterprise")} className="inline-flex items-center gap-2 rounded-lg border border-gray-700 hover:bg-gray-800 px-5 py-2.5 text-sm font-semibold">See enterprise capabilities</button>
            <button onClick={() => navigate("/pricing")} className="inline-flex items-center gap-2 rounded-lg border border-gray-700 hover:bg-gray-800 px-5 py-2.5 text-sm font-semibold">View pricing</button>
          </div>
        </div>
      </Section>

      {/* DUAL FINAL CTA */}
      <Section className="bg-[#0a0f0a]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-emerald-500/25 bg-[#0d120d] p-6">
            <Wrench className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="text-xl font-bold mb-2">I'm an operator</h3>
            <p className="text-gray-400 text-sm mb-4">Become the tech your plant is desperate for. Start free — no card.</p>
            <button onClick={() => navigate(LAB_ENTRY)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold">Start diagnosing free <ArrowRight className="w-4 h-4" /></button>
          </div>
          <div className="rounded-xl border border-gray-800 bg-[#0d120d] p-6">
            <Building2 className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="text-xl font-bold mb-2">I run a maintenance team</h3>
            <p className="text-gray-400 text-sm mb-4">See how EASLearn builds and measures competency across your workforce.</p>
            <button onClick={() => navigate("/contact")} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold">Request an employer demo <ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>
      </Section>

      {/* footer links */}
      <div className="px-4 py-10 border-t border-gray-900">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-5 flex-wrap text-xs text-gray-600">
          <button onClick={() => navigate("/explore")} className="hover:text-gray-300">Explore everything</button>
          <span className="text-gray-800">·</span>
          <button onClick={() => navigate("/courses")} className="hover:text-gray-300">Courses</button>
          <span className="text-gray-800">·</span>
          <button onClick={() => navigate("/pricing")} className="hover:text-gray-300">Pricing</button>
          <span className="text-gray-800">·</span>
          <button onClick={() => navigate("/enterprise")} className="hover:text-gray-300">Enterprise</button>
          <span className="text-gray-800">·</span>
          <button onClick={() => navigate("/about")} className="hover:text-gray-300">About</button>
          <span className="text-gray-800">·</span>
          <button onClick={() => navigate("/contact")} className="hover:text-gray-300">Contact sales</button>
        </div>
      </div>
    </div>
  );
}
