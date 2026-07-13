/**
 * Learning Path — guided 10-stage journey from operator to maintenance tech.
 *
 * Each stage is an expandable detail card showing:
 * - Overview (what you'll learn)
 * - Why it matters on the floor
 * - Prerequisites
 * - Suggested lesson / course
 * - Practice lab
 * - Competency evidence
 *
 * Action buttons: "Start Lesson" | "Review Course" | "Practice Lab" | "View Readiness"
 * ONLY "Practice Lab" routes to /labs.
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  Wrench,
  Gauge,
  Shield,
  Cpu,
  Radio,
  Zap,
  ClipboardCheck,
  MessageSquare,
  Award,
  CheckCircle2,
  Circle,
  ArrowRight,
} from "lucide-react";
import SEO from "@/components/SEO";

/* ─── Stage Data ─────────────────────────────────────────────────────── */

interface PathStage {
  id: string;
  number: number;
  title: string;
  icon: any;
  overview: string;
  whyItMatters: string;
  prerequisites: string[];
  suggestedLesson: { label: string; href: string };
  suggestedCourse: { label: string; href: string };
  practiceLab: { label: string; href: string } | null;
  competencyEvidence: string;
}

const LEARNING_PATH_STAGES: PathStage[] = [
  {
    id: "foundation",
    number: 1,
    title: "Foundation",
    icon: Shield,
    overview:
      "Build the safety awareness and tool confidence every tech needs before touching live equipment. You'll learn lockout/tagout, arc-flash boundaries, PPE requirements, and how to use a multimeter without guessing.",
    whyItMatters:
      "No plant lets you near a live panel without LOTO training and arc-flash awareness. This is the legal gate — skip it and you never get past the door.",
    prerequisites: [],
    suggestedLesson: { label: "Electrical Safety & LOTO", href: "/courses/safety-systems" },
    suggestedCourse: { label: "Safety Systems", href: "/courses/safety-systems" },
    practiceLab: null,
    competencyEvidence: "Demonstrates safe work practices: LOTO procedure, PPE selection, arc-flash boundary awareness.",
  },
  {
    id: "electrical-basics",
    number: 2,
    title: "Electrical Basics",
    icon: Zap,
    overview:
      "Understand voltage, current, and resistance. Learn AC vs DC, single-phase vs three-phase, and how to take a reading without blowing a fuse or yourself.",
    whyItMatters:
      "Once you can read a print and take a voltage reading, you stop guessing and start diagnosing. This is where operators become dangerous — in a good way.",
    prerequisites: ["Foundation (Stage 1)"],
    suggestedLesson: { label: "Electrical Fundamentals", href: "/courses/electrical-fundamentals" },
    suggestedCourse: { label: "Electrical Fundamentals", href: "/courses/electrical-fundamentals" },
    practiceLab: { label: "Virtual Multimeter Lab", href: "/labs" },
    competencyEvidence: "Correctly identifies voltage levels, reads a print, and takes safe measurements on a de-energized panel.",
  },
  {
    id: "motor-controls",
    number: 3,
    title: "Motor Controls",
    icon: Gauge,
    overview:
      "Learn contactors, overloads, three-wire start/stop circuits, and control power. Understand how a motor starts, seals in, and what trips it offline.",
    whyItMatters:
      "Most calls a tech gets are motor-control related. Master the three-wire start/stop circuit and you handle the majority of the plant floor.",
    prerequisites: ["Electrical Basics (Stage 2)"],
    suggestedLesson: { label: "Motor Control Circuits", href: "/courses/motors-controls" },
    suggestedCourse: { label: "Motors & Controls", href: "/courses/motors-controls" },
    practiceLab: { label: "Motor Starter Simulator", href: "/labs" },
    competencyEvidence: "Traces a three-wire control circuit, identifies seal-in path, and explains overload trip sequence.",
  },
  {
    id: "safety-circuits",
    number: 4,
    title: "Safety Circuits",
    icon: Shield,
    overview:
      "Understand E-stop wiring, guard interlocks, safety relays, and how the safety string works. Learn why NC contacts are used and what happens when one opens.",
    whyItMatters:
      "Safety circuits are the first thing that stops a machine — and the first thing a tech checks. If you can't trace the safety string, you can't clear the fault.",
    prerequisites: ["Motor Controls (Stage 3)"],
    suggestedLesson: { label: "Safety Systems", href: "/courses/safety-systems" },
    suggestedCourse: { label: "Safety Systems", href: "/courses/safety-systems" },
    practiceLab: { label: "Conveyor Safety Faults", href: "/labs?entry=path&mode=practice#conveyor-troubleshoot" },
    competencyEvidence: "Identifies open safety device in a series string, explains NC wiring convention, and traces interlock logic.",
  },
  {
    id: "sensors",
    number: 5,
    title: "Sensors",
    icon: Radio,
    overview:
      "Learn proximity sensors, photoeyes, limit switches, and how they report to the PLC. Understand sourcing vs sinking, dark-operate vs light-operate, and how to test a sensor with a meter.",
    whyItMatters:
      "Sensors are the eyes and ears of every machine. When a photoeye gets blocked or a prox drifts, the line stops. Know how to test them and you solve half the calls.",
    prerequisites: ["Electrical Basics (Stage 2)"],
    suggestedLesson: { label: "Sensors & I/O Devices", href: "/courses/plc-fundamentals" },
    suggestedCourse: { label: "PLC Fundamentals", href: "/courses/plc-fundamentals" },
    practiceLab: { label: "Photoeye Jam Diagnosis", href: "/labs?entry=path&mode=practice#conveyor-troubleshoot" },
    competencyEvidence: "Tests a photoeye with a meter, identifies sourcing/sinking wiring, and clears a sensor-related fault.",
  },
  {
    id: "plc-io",
    number: 6,
    title: "PLC I/O",
    icon: Cpu,
    overview:
      "Understand PLC inputs and outputs, addressing (I:1/0, O:0/0), XIC vs XIO instructions, and how to read ladder logic online to see what the PLC sees.",
    whyItMatters:
      "The PLC is the brain. When you can go online, check I/O status, and trace ladder logic, you stop calling the controls tech for every fault. This is the pay-bump skill.",
    prerequisites: ["Sensors (Stage 5)", "Motor Controls (Stage 3)"],
    suggestedLesson: { label: "PLC Fundamentals & Troubleshooting", href: "/courses/plc-fundamentals" },
    suggestedCourse: { label: "PLC Fundamentals", href: "/courses/plc-fundamentals" },
    practiceLab: { label: "Conveyor PLC Lab", href: "/labs?entry=path&mode=practice#conveyor-troubleshoot" },
    competencyEvidence: "Reads ladder logic online, identifies forced I/O, traces a faulted rung, and correlates PLC state to field device.",
  },
  {
    id: "vfd-troubleshooting",
    number: 7,
    title: "VFD Troubleshooting",
    icon: Gauge,
    overview:
      "Learn drive parameters, fault codes, and how to clear common VFD faults. Understand V/Hz vs vector control, DC bus voltage, and when to call the drive vendor.",
    whyItMatters:
      "VFDs run most conveyors, fans, and pumps. A tech who can clear a drive fault and get the line running in 5 minutes instead of 45 is worth their weight in gold.",
    prerequisites: ["PLC I/O (Stage 6)", "Motor Controls (Stage 3)"],
    suggestedLesson: { label: "PowerFlex VFD", href: "/courses/powerflex-vfd" },
    suggestedCourse: { label: "PowerFlex VFD", href: "/courses/powerflex-vfd" },
    practiceLab: { label: "VFD Fault Simulator", href: "/labs" },
    competencyEvidence: "Clears a VFD fault code, verifies DC bus voltage, checks output transistors, and restores drive to run.",
  },
  {
    id: "diagnostic-labs",
    number: 8,
    title: "Diagnostic Labs",
    icon: Wrench,
    overview:
      "Put it all together. Diagnose real multi-fault scenarios that combine safety circuits, sensors, PLC logic, and motor control. Get scored on your method, not just your answer.",
    whyItMatters:
      "This is the scored simulator — the core of the whole program. Practice real faults and get graded on HOW you think, not just what you swap.",
    prerequisites: ["PLC I/O (Stage 6)", "Safety Circuits (Stage 4)", "Sensors (Stage 5)"],
    suggestedLesson: { label: "Industrial Troubleshooting", href: "/courses/industrial-troubleshooting" },
    suggestedCourse: { label: "Industrial Troubleshooting", href: "/courses/industrial-troubleshooting" },
    practiceLab: { label: "Full Diagnostic Lab", href: "/labs?entry=path&mode=practice#conveyor-troubleshoot" },
    competencyEvidence: "Completes a multi-step diagnostic with correct method: observe → check I/O → trace logic → measure → isolate root cause.",
  },
  {
    id: "communication-workorder",
    number: 9,
    title: "Communication & Work Orders",
    icon: MessageSquare,
    overview:
      "Learn how to write a clear work order, communicate with operators and supervisors, document what you found, and hand off to the next shift without losing information.",
    whyItMatters:
      "A tech who fixes the fault but can't explain what happened is only half useful. Plants need documentation for reliability, and supervisors need clear status updates.",
    prerequisites: ["Diagnostic Labs (Stage 8)"],
    suggestedLesson: { label: "Work Order & Communication", href: "/courses" },
    suggestedCourse: { label: "Browse Courses", href: "/courses" },
    practiceLab: null,
    competencyEvidence: "Writes a complete work order with fault description, root cause, corrective action, and parts used.",
  },
  {
    id: "verified-readiness",
    number: 10,
    title: "Verified Readiness",
    icon: Award,
    overview:
      "Earn your verified credential. Complete the capstone assessment, build your Skills Passport, and prove to any employer that you can diagnose, document, and communicate at a maintenance tech level.",
    whyItMatters:
      "The whole point. Turn skill into a job or a raise. Your Skills Passport is shareable proof of what you can do — not a certificate that says you watched videos.",
    prerequisites: ["All previous stages"],
    suggestedLesson: { label: "Skills Passport", href: "/skills-passport" },
    suggestedCourse: { label: "Review All Courses", href: "/courses" },
    practiceLab: { label: "Capstone Assessment", href: "/labs?entry=path&mode=practice#conveyor-troubleshoot" },
    competencyEvidence: "Passes the Tech-Ready capstone: multi-fault diagnostic, work order documentation, and communication assessment.",
  },
];

/* ─── Expandable Stage Card ──────────────────────────────────────────── */

function StageCard({ stage, isExpanded, onToggle }: { stage: PathStage; isExpanded: boolean; onToggle: () => void }) {
  const Icon = stage.icon;
  const [, navigate] = useLocation();

  return (
    <div className={`rounded-xl border transition-all duration-200 ${isExpanded ? "border-emerald-500/40 bg-[#0d120d]" : "border-gray-800 bg-[#0a0f0a] hover:border-gray-700"}`}>
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 md:p-5 text-left"
      >
        <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${isExpanded ? "bg-emerald-500/15 text-emerald-400" : "bg-gray-800 text-gray-400"}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono">{String(stage.number).padStart(2, "0")}</span>
            <h3 className="text-white font-semibold text-sm md:text-base">{stage.title}</h3>
          </div>
          <p className="text-gray-500 text-xs mt-0.5 truncate">{stage.whyItMatters.slice(0, 80)}…</p>
        </div>
        <div className="shrink-0 text-gray-500">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded detail panel */}
      {isExpanded && (
        <div className="px-4 md:px-5 pb-5 border-t border-gray-800/60 pt-4 space-y-4">
          {/* Overview */}
          <div>
            <h4 className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1.5">What You'll Learn</h4>
            <p className="text-gray-300 text-sm leading-relaxed">{stage.overview}</p>
          </div>

          {/* Why it matters */}
          <div>
            <h4 className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Why It Matters on the Floor</h4>
            <p className="text-gray-400 text-sm leading-relaxed">{stage.whyItMatters}</p>
          </div>

          {/* Prerequisites */}
          {stage.prerequisites.length > 0 && (
            <div>
              <h4 className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Before You Start</h4>
              <ul className="space-y-1">
                {stage.prerequisites.map((p, i) => (
                  <li key={i} className="text-gray-400 text-sm flex items-center gap-2">
                    <Circle className="w-2.5 h-2.5 text-gray-600 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Competency evidence */}
          <div>
            <h4 className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Competency Evidence</h4>
            <p className="text-gray-400 text-sm italic">{stage.competencyEvidence}</p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => navigate(stage.suggestedLesson.href)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Start Lesson
            </button>
            <button
              onClick={() => navigate(stage.suggestedCourse.href)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 hover:border-emerald-500/40 text-gray-300 hover:text-white text-xs font-semibold px-3.5 py-2 transition-colors"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Review Course
            </button>
            {stage.practiceLab && (
              <button
                onClick={() => navigate(stage.practiceLab!.href)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5 text-amber-300 hover:text-amber-200 text-xs font-semibold px-3.5 py-2 transition-colors"
              >
                <Wrench className="w-3.5 h-3.5" />
                Practice Lab
              </button>
            )}
            <button
              onClick={() => navigate("/competency")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 hover:border-emerald-500/40 text-gray-300 hover:text-white text-xs font-semibold px-3.5 py-2 transition-colors"
            >
              <Award className="w-3.5 h-3.5" />
              View Readiness
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────── */

export default function OperatorToTech() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-[#070b07] text-white">
      <SEO
        title="Learning Path — Become a Maintenance Technician"
        description="A guided 10-stage journey from operator to maintenance tech. Learn the method before you diagnose the fault. Practice the fault after you understand the circuit."
        path="/become-a-tech"
      />
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-3 py-1 mb-4">
            <Wrench className="w-3.5 h-3.5" /> Guided Learning Path
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Become a Maintenance Technician</h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Learn the method before you diagnose the fault. Practice the fault after you understand the circuit. Each stage builds evidence toward maintenance readiness.
          </p>
          <p className="text-sm text-gray-500 mt-3 max-w-md mx-auto">
            10 stages. 20 minutes a day. On your phone. Complete each step before attempting the lab.
          </p>

          {!isAuthenticated && (
            <button
              onClick={() => navigate("/signup")}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold transition-colors"
            >
              Start free <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Pathway instruction */}
        <div className="mb-6 rounded-lg border border-gray-800 bg-[#0a0f0a] p-4">
          <p className="text-gray-400 text-sm leading-relaxed">
            <span className="text-emerald-400 font-medium">How this works:</span> Tap any stage below to see what you'll learn, why it matters, and your next action. Start with the lesson, then practice in the lab when you're ready. Each stage builds on the one before it.
          </p>
        </div>

        {/* Stage cards */}
        <div className="space-y-3">
          {LEARNING_PATH_STAGES.map((stage) => (
            <StageCard
              key={stage.id}
              stage={stage}
              isExpanded={expandedId === stage.id}
              onToggle={() => toggle(stage.id)}
            />
          ))}
        </div>

        {/* Employer-pays nudge */}
        <div className="mt-10 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-center">
          <p className="text-amber-300 text-sm font-medium mb-1">Your plant can pay for this.</p>
          <p className="text-gray-400 text-xs">
            Most plants will fund turning a good operator into a tech — it's cheaper than hiring one. Ask your supervisor; the ROI is downtime you already cost them.
          </p>
        </div>

        {/* Quick links */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/courses" className="rounded-lg border border-gray-800 hover:border-emerald-500/30 p-4 text-center transition-colors">
            <BookOpen className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <span className="text-sm text-gray-300">Browse Courses</span>
          </Link>
          <Link href="/labs?entry=nav&mode=practice#conveyor-troubleshoot" className="rounded-lg border border-gray-800 hover:border-emerald-500/30 p-4 text-center transition-colors">
            <Wrench className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <span className="text-sm text-gray-300">Practice Labs</span>
          </Link>
          <Link href="/skills-passport" className="rounded-lg border border-gray-800 hover:border-emerald-500/30 p-4 text-center transition-colors">
            <Award className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <span className="text-sm text-gray-300">Skills Passport</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
