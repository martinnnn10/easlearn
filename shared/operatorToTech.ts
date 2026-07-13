/**
 * "Operator → Maintenance Tech" — the flagship outcome program.
 *
 * Not a course catalog: a defined 90-day journey from "I run a machine" to
 * "I can troubleshoot, I've proven it, I'm job-ready." It sequences EXISTING
 * modules + the scored simulator into stages, and marks the connective-tissue
 * content still to build (meter bridge, capstone, job prep) as coming soon.
 *
 * Module slugs here are real (see shared/competencyMatrix MODULE_SKILL_DOMAIN).
 */

import type { SkillDomain } from "./competencyMatrix";

export type ProgramItemType = "module" | "lab" | "capstone" | "jobprep" | "practical";

export interface ProgramItem {
  type: ProgramItemType;
  title: string;
  /** Course module slug (for type "module") → /courses/:slug */
  slug?: string;
  /** Direct route for labs / other surfaces. */
  route?: string;
  /** Short operator-language note. */
  note?: string;
  /** Content not built yet — shown as "coming soon", excluded from progress %. */
  comingSoon?: boolean;
}

export interface ProgramStage {
  id: string;
  title: string;
  tagline: string;
  /** Why a broke operator should care — in his money terms. */
  whyItMatters: string;
  days: number;
  domains: SkillDomain[];
  items: ProgramItem[];
}

export interface Program {
  slug: string;
  title: string;
  subtitle: string;
  totalDays: number;
  promise: string;
  stages: ProgramStage[];
}

export const OPERATOR_TO_TECH: Program = {
  slug: "operator-to-tech",
  title: "Operator → Maintenance Tech",
  subtitle: "90 days. 20 minutes a day. On your phone.",
  totalDays: 90,
  promise: "Go from running the machine to fixing it — practice on real faults, prove your skill, and get job-ready. Your plant can pay for it.",
  stages: [
    {
      id: "safe-and-meter",
      title: "Get Safe & Get a Meter",
      tagline: "The two things that make you allowed to work on equipment.",
      whyItMatters: "No plant lets you near a live panel without LOTO and arc-flash awareness — and a tech who can't use a meter isn't a tech. Start here.",
      days: 10,
      domains: ["safety"],
      items: [
        { type: "module", title: "Electrical Safety & LOTO", slug: "safety-systems", note: "Lockout/tagout, arc flash, PPE — the legal gate to the job." },
        { type: "practical", title: "Get a $40 meter & learn it", comingSoon: true, note: "Hands-on multimeter bridge — coming soon. Buy a cheap meter; we'll teach you on your own gear." },
      ],
    },
    {
      id: "read-the-panel",
      title: "Read the Panel",
      tagline: "Voltage, current, and what all those wires actually do.",
      whyItMatters: "Once you can read a print and take a voltage reading, you stop guessing and start diagnosing. This is where operators become dangerous (in a good way).",
      days: 20,
      domains: ["electrical"],
      items: [
        { type: "module", title: "Electrical Fundamentals", slug: "electrical-fundamentals", note: "V, I, R · AC vs DC · single vs 3-phase." },
        { type: "module", title: "Print Reading (Electrical)", slug: "print-reading", note: "Read schematics, trace wires, understand the panel." },
        { type: "lab", title: "Virtual Multimeter Lab", route: "/labs", note: "Practice taking readings before you touch a live panel." },
      ],
    },
    {
      id: "make-the-motor-run",
      title: "Make the Motor Run",
      tagline: "Contactors, overloads, start/stop — the bread and butter.",
      whyItMatters: "Most calls a tech gets are motor-control. Master the three-wire start/stop circuit and you handle the majority of the plant floor.",
      days: 15,
      domains: ["motors"],
      items: [
        { type: "module", title: "Motor Control Circuits", slug: "motors-controls", note: "Contactors, overloads, seal-in, control power." },
        { type: "lab", title: "Motor Starter Simulator", route: "/labs", note: "Wire and troubleshoot a starter — safely, virtually." },
      ],
    },
    {
      id: "think-like-a-troubleshooter",
      title: "Think Like a Troubleshooter",
      tagline: "The one skill that separates a parts-changer from a tech.",
      whyItMatters: "Anyone can swap parts. A tech isolates the fault with a method. This is the scored simulator — practice real faults and get graded on HOW you think.",
      days: 15,
      domains: ["integration"],
      items: [
        { type: "lab", title: "Conveyor Troubleshooting Lab", route: "/labs?entry=program&mode=practice#conveyor-troubleshoot", note: "The core of the whole program. Diagnose a real down line." },
        { type: "module", title: "Industrial Troubleshooting", slug: "industrial-troubleshooting", note: "The methodology: gather → prints → measure → analyze → act." },
      ],
    },
    {
      id: "money-skills",
      title: "The Money Skills",
      tagline: "PLCs and VFDs — what the plant is desperate for.",
      whyItMatters: "This is the pay bump. Techs who can read ladder logic online and clear a VFD fault are worth $10–15/hr more. This is why you started.",
      days: 25,
      domains: ["plc", "vfd"],
      items: [
        { type: "module", title: "PLC Fundamentals & Troubleshooting", slug: "plc-fundamentals", note: "Ladder logic, I/O troubleshooting, online diagnostics." },
        { type: "module", title: "PowerFlex VFD", slug: "powerflex-vfd", note: "Drive setup, parameters, and clearing fault codes." },
      ],
    },
    {
      id: "prove-and-hired",
      title: "Prove It & Get Hired",
      tagline: "Turn skill into a job or a raise.",
      whyItMatters: "The whole point. Earn a credential that shows what you can do, then use it — resume, interview, and how to ask your supervisor for the transfer.",
      days: 5,
      domains: ["integration"],
      items: [
        { type: "capstone", title: "Tech-Ready Capstone Assessment", comingSoon: true, note: "A rigorous final that produces your verified credential — coming soon." },
        { type: "jobprep", title: "Resume, interview & the transfer conversation", comingSoon: true, note: "How to actually land the tech role — coming soon." },
        { type: "lab", title: "Your Skills Passport", route: "/skills-passport", note: "Shareable, verifiable proof of what you can diagnose." },
      ],
    },
  ],
};
