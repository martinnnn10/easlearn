/**
 * Platform Expansion Roadmap
 * Shows active development tracks, upcoming courses, simulator systems,
 * future certifications, enterprise features, and planned learning paths.
 * Honest language: "expanding", "in development", "foundational lessons available now"
 */
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Zap, Cpu, Cog, Wind, Thermometer, Gauge, Network, Bot,
  Shield, FileText, Wrench, Target, BookOpen, Clock, CheckCircle2,
  ArrowRight, GraduationCap, Trophy, Layers, Activity, FlaskConical,
  BarChart3, Users, Building2, Rocket, Calendar
} from "lucide-react";
import SEO from "@/components/SEO";
import { trpc } from "@/lib/trpc";

// ── Development Tracks ──

interface DevelopmentTrack {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  status: "live" | "expanding" | "in-development" | "planned";
  description: string;
  milestones: { label: string; done: boolean }[];
  estimatedLaunch?: string;
}

const developmentTracks: DevelopmentTrack[] = [
  {
    id: "electrical-fundamentals",
    title: "Electrical Fundamentals",
    icon: <Zap className="w-5 h-5" />,
    color: "oklch(0.75 0.15 85)",
    status: "live",
    description: "Complete foundational electrical training with 6 interactive lessons covering Ohm's Law, AC/DC theory, circuit analysis, and safety.",
    milestones: [
      { label: "Core lessons published", done: true },
      { label: "Interactive labs integrated", done: true },
      { label: "Module quiz available", done: true },
      { label: "Completion certificate", done: true },
    ],
  },
  {
    id: "plc-fundamentals",
    title: "PLC Fundamentals & Troubleshooting",
    icon: <Cpu className="w-5 h-5" />,
    color: "oklch(0.75 0.15 250)",
    status: "live",
    description: "24 in-depth lessons covering PLC architecture, ladder logic, I/O troubleshooting, structured text, and EtherNet/IP diagnostics.",
    milestones: [
      { label: "24 lessons published", done: true },
      { label: "Simulator scenarios linked", done: true },
      { label: "Module quiz available", done: true },
      { label: "Advanced diagnostics module", done: true },
    ],
  },
  {
    id: "powerflex-vfd",
    title: "PowerFlex VFD Programming & Troubleshooting",
    icon: <Gauge className="w-5 h-5" />,
    color: "oklch(0.75 0.15 155)",
    status: "live",
    description: "18 lessons covering VFD operating principles, fault codes, parameter programming, EtherNet/IP integration, and advanced features.",
    milestones: [
      { label: "18 lessons published", done: true },
      { label: "VFD Sandbox lab", done: true },
      { label: "6 VFD simulator scenarios", done: true },
      { label: "Module quiz available", done: true },
    ],
  },
  {
    id: "sensors-instrumentation",
    title: "Industrial Sensors & Instrumentation",
    icon: <Gauge className="w-5 h-5" />,
    color: "oklch(0.75 0.13 60)",
    status: "in-development",
    description: "Photoeyes, proximity sensors, RTDs, thermocouples, pressure transmitters, 4-20mA loops, and instrumentation troubleshooting.",
    milestones: [
      { label: "Curriculum designed", done: true },
      { label: "Foundational lessons drafted", done: true },
      { label: "Lab simulations", done: false },
      { label: "Simulator integration", done: false },
    ],
    estimatedLaunch: "Q3 2026",
  },
  {
    id: "networking-communications",
    title: "Industrial Networking & Communications",
    icon: <Network className="w-5 h-5" />,
    color: "oklch(0.70 0.12 220)",
    status: "in-development",
    description: "Ethernet/IP, Modbus, Profinet, PLC networking, remote I/O, managed switches, and communication troubleshooting.",
    milestones: [
      { label: "Curriculum designed", done: true },
      { label: "Protocol reference sheets", done: true },
      { label: "Foundational lessons", done: false },
      { label: "Network simulator", done: false },
    ],
    estimatedLaunch: "Q3 2026",
  },
  {
    id: "robotics-automation",
    title: "Robotics & Automation Systems",
    icon: <Bot className="w-5 h-5" />,
    color: "oklch(0.70 0.15 310)",
    status: "planned",
    description: "Servo systems, motion control, robotic cells, homing procedures, encoders, pick-and-place, and robotic troubleshooting.",
    milestones: [
      { label: "Curriculum outline", done: true },
      { label: "Foundational lessons", done: false },
      { label: "Motion control labs", done: false },
      { label: "Robotic cell simulator", done: false },
    ],
    estimatedLaunch: "Q4 2026",
  },
  {
    id: "safety-systems",
    title: "Industrial Safety Systems",
    icon: <Shield className="w-5 h-5" />,
    color: "oklch(0.70 0.15 25)",
    status: "in-development",
    description: "E-stop circuits, safety relays, STO, light curtains, interlocks, guarding systems, safety PLC basics, and LOTO procedures.",
    milestones: [
      { label: "Curriculum designed", done: true },
      { label: "Safety reference sheets", done: true },
      { label: "Foundational lessons", done: false },
      { label: "Safety relay simulator", done: false },
    ],
    estimatedLaunch: "Q3 2026",
  },
  {
    id: "print-reading",
    title: "Industrial Print Reading",
    icon: <FileText className="w-5 h-5" />,
    color: "oklch(0.65 0.08 240)",
    status: "planned",
    description: "Ladder diagrams, electrical schematics, one-line diagrams, terminal layouts, wire numbering, PLC I/O prints, and circuit tracing.",
    milestones: [
      { label: "Curriculum outline", done: true },
      { label: "Sample print library", done: false },
      { label: "Interactive tracing labs", done: false },
      { label: "Assessment quizzes", done: false },
    ],
    estimatedLaunch: "Q4 2026",
  },
  {
    id: "electrical-diagnostics",
    title: "Electrical Diagnostics & Root Cause Analysis",
    icon: <Target className="w-5 h-5" />,
    color: "oklch(0.75 0.15 0)",
    status: "planned",
    description: "Systematic fault isolation, intermittent fault diagnosis, multi-system failures, production fault analysis, and root cause methodology.",
    milestones: [
      { label: "Curriculum outline", done: true },
      { label: "Case study library", done: false },
      { label: "Multi-fault simulator", done: false },
      { label: "Capstone assessment", done: false },
    ],
    estimatedLaunch: "Q1 2027",
  },
  {
    id: "servo-systems",
    title: "Servo Systems & Motion Control",
    icon: <Activity className="w-5 h-5" />,
    color: "oklch(0.70 0.12 180)",
    status: "planned",
    description: "Servo drives, feedback devices, tuning, homing sequences, motion profiles, and servo troubleshooting.",
    milestones: [
      { label: "Curriculum outline", done: false },
      { label: "Foundational lessons", done: false },
      { label: "Motion control labs", done: false },
      { label: "Servo simulator", done: false },
    ],
    estimatedLaunch: "Q1 2027",
  },
];

// ── Upcoming Platform Features ──

interface PlatformFeature {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "live" | "beta" | "in-development" | "planned";
  category: "simulator" | "certification" | "enterprise" | "learning";
}

const platformFeatures: PlatformFeature[] = [
  {
    title: "Adaptive Multi-Fault Simulator",
    description: "V3 engine with dynamic difficulty, multi-fault scenarios, and real-time performance analytics.",
    icon: <Wrench className="w-5 h-5" />,
    status: "live",
    category: "simulator",
  },
  {
    title: "VFD Sandbox Lab",
    description: "Interactive VFD parameter experimentation with real-time motor response visualization.",
    icon: <FlaskConical className="w-5 h-5" />,
    status: "live",
    category: "learning",
  },
  {
    title: "Interactive Circuit & Relay Labs",
    description: "Hands-on circuit flow, relay logic, PLC ladder, and Ohm's Law simulations.",
    icon: <Zap className="w-5 h-5" />,
    status: "live",
    category: "learning",
  },
  {
    title: "Skill Certification Path",
    description: "4-tier certification from Apprentice to Master Troubleshooter with verifiable credentials.",
    icon: <GraduationCap className="w-5 h-5" />,
    status: "live",
    category: "certification",
  },
  {
    title: "Team Management Dashboard",
    description: "Track team member progress, XP, certifications, and export CSV reports.",
    icon: <Users className="w-5 h-5" />,
    status: "live",
    category: "enterprise",
  },
  {
    title: "Industrial Networking Simulator",
    description: "Simulate Ethernet/IP, Modbus, and Profinet communication troubleshooting.",
    icon: <Network className="w-5 h-5" />,
    status: "in-development",
    category: "simulator",
  },
  {
    title: "Safety System Simulator",
    description: "E-stop chain, safety relay, and interlock troubleshooting scenarios.",
    icon: <Shield className="w-5 h-5" />,
    status: "in-development",
    category: "simulator",
  },
  {
    title: "OSHA Safety Awareness Alignment",
    description: "Map EAS modules to OSHA safety awareness competency areas.",
    icon: <Shield className="w-5 h-5" />,
    status: "planned",
    category: "certification",
  },
  {
    title: "NIMS Competency Mapping",
    description: "Align curriculum with NIMS industrial maintenance competency standards.",
    icon: <Trophy className="w-5 h-5" />,
    status: "planned",
    category: "certification",
  },
  {
    title: "Enterprise SSO & LMS Integration",
    description: "SAML/OIDC single sign-on and SCORM/xAPI export for enterprise LMS platforms.",
    icon: <Building2 className="w-5 h-5" />,
    status: "planned",
    category: "enterprise",
  },
  {
    title: "Custom Scenario Builder",
    description: "Allow team admins to create custom troubleshooting scenarios for their equipment.",
    icon: <Cog className="w-5 h-5" />,
    status: "planned",
    category: "enterprise",
  },
  {
    title: "Manufacturer-Specific Learning Paths",
    description: "Dedicated training paths for Allen-Bradley, Siemens, ABB, and other major manufacturers.",
    icon: <Layers className="w-5 h-5" />,
    status: "planned",
    category: "learning",
  },
];

// ── Status Helpers ──

const statusConfig = {
  live: { label: "Live", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  beta: { label: "Beta", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", dot: "bg-blue-400" },
  expanding: { label: "Expanding", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", dot: "bg-blue-400" },
  "in-development": { label: "In Development", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", dot: "bg-amber-400" },
  planned: { label: "Planned", color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/30", dot: "bg-zinc-400" },
};

function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-medium px-2.5 py-1 rounded-full ${cfg.bg} border ${cfg.border} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Main Component ──

export default function Roadmap() {
  const { data: modules } = trpc.courses.listModules.useQuery();
  const liveTrackCount = developmentTracks.filter(t => t.status === "live").length;
  const inDevCount = developmentTracks.filter(t => t.status === "in-development").length;
  const plannedCount = developmentTracks.filter(t => t.status === "planned").length;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Platform Expansion Roadmap"
        description="See what's live, in development, and planned for the EAS industrial training platform. New courses, simulator systems, certifications, and enterprise features."
        path="/roadmap"
      />

      {/* Hero */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.12_0.02_250/10%)] via-transparent to-transparent" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[oklch(0.55_0.12_250/30%)] to-transparent" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.55_0.12_250/10%)] border border-[oklch(0.55_0.12_250/20%)] text-xs text-[oklch(0.65_0.10_250)] mb-5">
              <Rocket className="w-3.5 h-3.5" />
              Platform Expansion Roadmap
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading text-white tracking-wide mb-5">
              Building the Future of
              <br />
              <span className="text-[oklch(0.55_0.12_155)]">Industrial Training</span>
            </h1>
            <p className="text-lg text-[oklch(0.65_0.008_250)] leading-relaxed max-w-3xl mb-8">
              EAS is a rapidly growing industrial training ecosystem. New courses, simulator systems, 
              and enterprise features are added regularly. Here is what is live, what is in active development, 
              and what is planned next.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-bold">{liveTrackCount}</span>
                <span className="text-[oklch(0.55_0.008_250)]">Live</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-white font-bold">{inDevCount}</span>
                <span className="text-[oklch(0.55_0.008_250)]">In Development</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-500/10 border border-zinc-500/20">
                <Calendar className="w-4 h-4 text-zinc-400" />
                <span className="text-white font-bold">{plannedCount}</span>
                <span className="text-[oklch(0.55_0.008_250)]">Planned</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[oklch(0.20_0.004_250)] to-transparent" />
      </section>

      {/* Course Development Tracks */}
      <section className="py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-heading text-white tracking-wide mb-3">
              Course Development Tracks
            </h2>
            <p className="text-[oklch(0.55_0.008_250)] max-w-2xl">
              Each track represents a structured learning module. Live courses have full lesson libraries; 
              in-development tracks have curriculum designed with lessons being authored.
            </p>
          </motion.div>

          <div className="space-y-4">
            {developmentTracks.map((track, i) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="card-panel p-6 relative overflow-hidden"
              >
                {/* Top accent for live tracks */}
                {track.status === "live" && (
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
                )}

                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `color-mix(in oklch, ${track.color}, transparent 85%)`,
                      border: `1px solid color-mix(in oklch, ${track.color}, transparent 65%)`,
                    }}
                  >
                    <span style={{ color: track.color }}>{track.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-lg font-heading text-white tracking-wide">{track.title}</h3>
                      <StatusBadge status={track.status} />
                      {track.estimatedLaunch && (
                        <span className="text-[10px] font-mono text-[oklch(0.45_0.008_250)]">
                          Est. {track.estimatedLaunch}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[oklch(0.55_0.008_250)] leading-relaxed mb-4">
                      {track.description}
                    </p>

                    {/* Milestones */}
                    <div className="flex flex-wrap gap-3">
                      {track.milestones.map((m, j) => (
                        <span
                          key={j}
                          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md ${
                            m.done
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-[oklch(0.12_0.003_250)] text-[oklch(0.45_0.008_250)] border border-[oklch(0.18_0.004_250)]"
                          }`}
                        >
                          {m.done ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {m.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA for live tracks */}
                  {track.status === "live" && (
                    <Link
                      href={`/courses/${track.id}`}
                      className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-600/30 transition-colors"
                    >
                      Start Learning <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features & Systems */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[oklch(0.08_0.01_250/20%)] to-transparent pointer-events-none" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-heading text-white tracking-wide mb-3">
              Platform Features & Systems
            </h2>
            <p className="text-[oklch(0.55_0.008_250)] max-w-2xl">
              Beyond courses, EAS includes simulator systems, certification paths, enterprise tools, 
              and interactive learning environments.
            </p>
          </motion.div>

          {/* Category groups */}
          {(["simulator", "learning", "certification", "enterprise"] as const).map((category) => {
            const features = platformFeatures.filter(f => f.category === category);
            const categoryLabels = {
              simulator: { title: "Simulator Systems", icon: <Wrench className="w-5 h-5" /> },
              learning: { title: "Learning Tools", icon: <BookOpen className="w-5 h-5" /> },
              certification: { title: "Certifications & Standards", icon: <Trophy className="w-5 h-5" /> },
              enterprise: { title: "Enterprise Features", icon: <Building2 className="w-5 h-5" /> },
            };
            const cat = categoryLabels[category];

            return (
              <div key={category} className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[oklch(0.55_0.12_155)]">{cat.icon}</span>
                  <h3 className="text-lg font-heading text-white tracking-wide">{cat.title}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {features.map((feature, i) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="card-panel p-5"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-[oklch(0.12_0.003_250)] border border-[oklch(0.18_0.004_250)] flex items-center justify-center text-[oklch(0.55_0.12_155)] shrink-0">
                          {feature.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white mb-0.5">{feature.title}</h4>
                          <StatusBadge status={feature.status} />
                        </div>
                      </div>
                      <p className="text-xs text-[oklch(0.50_0.008_250)] leading-relaxed">
                        {feature.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Timeline Summary */}
      <section className="py-16 border-t border-[oklch(0.15_0.004_250)]">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-2xl sm:text-3xl font-heading text-white tracking-wide mb-8 text-center">
              Development Timeline
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  quarter: "Now",
                  items: [`${modules?.length ?? '...'} live course modules`, "7 simulator scenarios", "4 interactive labs", "4-tier certification path"],
                  status: "live" as const,
                },
                {
                  quarter: "Q3 2026",
                  items: ["Sensors & Instrumentation", "Industrial Networking", "Safety Systems", "New simulator scenarios"],
                  status: "in-development" as const,
                },
                {
                  quarter: "Q4 2026",
                  items: ["Robotics & Automation", "Print Reading", "Network simulator", "OSHA alignment"],
                  status: "planned" as const,
                },
                {
                  quarter: "Q1 2027",
                  items: ["Electrical Diagnostics", "Servo Systems", "NIMS mapping", "Enterprise SSO"],
                  status: "planned" as const,
                },
              ].map((phase, i) => {
                const cfg = statusConfig[phase.status];
                return (
                  <motion.div
                    key={phase.quarter}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`card-panel p-5 border-t-2 ${cfg.border}`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-sm font-bold ${cfg.color}`}>{phase.quarter}</span>
                      <StatusBadge status={phase.status} />
                    </div>
                    <ul className="space-y-2">
                      {phase.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-xs text-[oklch(0.55_0.008_250)]">
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center p-10 card-panel border-[oklch(0.55_0.12_155/20%)] relative overflow-hidden max-w-3xl mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.55_0.12_155/5%)] to-transparent" />
            <div className="relative">
              <Rocket className="w-10 h-10 text-[oklch(0.55_0.12_155)] mx-auto mb-4" />
              <h3 className="text-2xl font-heading text-white tracking-wide mb-3">
                Start Learning Today
              </h3>
              <p className="text-sm text-[oklch(0.58_0.008_250)] mb-6 max-w-lg mx-auto">
                Access all live courses, interactive labs, and simulator scenarios. 
                New content is added monthly as the platform expands.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 px-6 py-3 btn-primary text-sm font-medium rounded"
                >
                  Browse Courses <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded border border-[oklch(0.25_0.006_250)] text-sm font-medium text-white hover:bg-[oklch(0.12_0.003_250)] transition-colors"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
