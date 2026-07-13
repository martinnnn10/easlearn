/**
 * B2B homepage content — operator-to-maintenance digital apprenticeship positioning.
 */

export const HOMEPAGE_HERO = {
  eyebrow: "Digital apprenticeship · Verified competency",
  headline: "Train Operators Into Maintenance Technicians",
  subheadline:
    "EASLearn is a digital apprenticeship platform that helps manufacturers reduce downtime by building verified industrial maintenance competency through guided lessons, simulations, AI coaching, and skill tracking.",
  primaryCta: { label: "Try the Simulator", href: "/labs?entry=home&mode=practice#conveyor-troubleshoot" },
  secondaryCta: { label: "For Employers", href: "/enterprise" },
} as const;

export const HOMEPAGE_PROBLEM = {
  headline: "The maintenance talent gap is costing you downtime",
  points: [
    "Manufacturers cannot find enough skilled maintenance technicians.",
    "Operators want career growth but lack a clear path into maintenance.",
    "Traditional training is too generic and does not prove troubleshooting ability.",
    "Downtime keeps rising when teams lack verified skills.",
  ],
} as const;

export const HOMEPAGE_SOLUTION = {
  headline: "How maintenance technicians actually learn",
  intro:
    "EASLearn trains workers the way the plant floor demands — not with passive videos, but with guided troubleshooting, scored simulations, and verified competency.",
  steps: [
    { title: "Safety first", detail: "Risk assessment and stored-energy control before every job." },
    { title: "Understand the machine", detail: "Read prints, know the sequence, identify normal operation." },
    { title: "Diagnose the symptom", detail: "Separate operator reports from what the machine is doing." },
    { title: "Find the root cause", detail: "Measure, trace, and prove — not parts-changing." },
    { title: "Verify the repair", detail: "Run it, watch it, confirm the fault stays gone." },
    { title: "Document the work", detail: "Handoff-ready notes for the next shift and your manager." },
  ],
} as const;

export const HOMEPAGE_LEARNING_PATH = [
  { level: 0, title: "Operator Foundation", topics: "Normal operation, when to call maintenance" },
  { level: 1, title: "Safety, LOTO, Risk Assessment", topics: "Hazard vs risk, before-touch checklist", href: "/courses/safety-systems/risk-assessment" },
  { level: 2, title: "Mechanical Fundamentals", topics: "Belts, bearings, mechanical bind", href: "/courses/motors-controls/motor-theory" },
  { level: 3, title: "Electrical Fundamentals", topics: "Voltage, schematics, control power", href: "/courses/electrical-fundamentals/electrical-safety-lockout" },
  { level: 4, title: "Sensors and Controls", topics: "Prox, photoeyes, 4–20 mA", href: "/courses/sensors-instrumentation/proximity-photoelectric" },
  { level: 5, title: "Motors and VFDs", topics: "Starters, overloads, drive faults", href: "/courses/powerflex-vfd/vfd-fundamentals" },
  { level: 6, title: "PLC Troubleshooting", topics: "Ladder logic, I/O faults", href: "/courses/plc-fundamentals/io-troubleshooting" },
  { level: 7, title: "Pneumatics and Hydraulics", topics: "Cylinders, stored fluid energy", href: "/courses/fluid-power" },
  { level: 8, title: "Preventive Maintenance and Reliability", topics: "PM inspections, failure modes", href: "/courses/preventative-maintenance" },
  { level: 9, title: "Troubleshooting Mastery", topics: "Scored multi-fault simulators", href: "/labs?entry=home&mode=practice#conveyor-troubleshoot" },
  { level: 10, title: "Job Readiness", topics: "Skills passport, promotion readiness", href: "/skills-passport" },
] as const;

export const HOMEPAGE_SIMULATIONS = [
  { title: "Conveyor will not start", description: "Trace permissives, photoeyes, safety chain.", route: "/labs?entry=home&mode=practice#conveyor-troubleshoot" },
  { title: "Photoeye fault", description: "Input stuck ON — sensor vs wiring vs PLC.", route: "/labs?mode=practice#plc-io-fault-v3" },
  { title: "Motor overload trip", description: "Find cause before reset.", route: "/simulator?scenario=motor-overload-trip-v3" },
  { title: "Air cylinder stuck", description: "Bleed pressure, verify zero energy.", route: "/courses/safety-systems/risk-assessment" },
  { title: "VFD fault", description: "Read fault code, check load.", route: "/simulator?scenario=vfd-overcurrent-ramp-v3" },
  { title: "Guard door safety issue", description: "Walk E-stop and guard chain.", route: "/simulator?scenario=conveyor-estop-v2" },
  { title: "PLC input not changing", description: "LED, field device, wiring, logic.", route: "/courses/plc-fundamentals/io-troubleshooting" },
  { title: "Low air pressure fault", description: "Trace supply, regulator, and actuator.", route: "/courses/fluid-power" },
  { title: "Bad prox sensor", description: "LED, target, range, NPN/PNP match.", route: "/courses/sensors-instrumentation/proximity-photoelectric" },
  { title: "Loose wire in control circuit", description: "Meter the safety string for opens.", route: "/courses/motors-controls/motor-control-circuits" },
] as const;

export const HOMEPAGE_COMPETENCY_PROOF = [
  "Can identify stored energy",
  "Can perform risk assessment",
  "Can use a multimeter",
  "Can read basic ladder logic",
  "Can diagnose input and output faults",
  "Can troubleshoot motor controls",
  "Can complete PM inspections",
  "Can document work correctly",
  "Can communicate findings during handoff",
] as const;

export const HOMEPAGE_MANAGER_VALUE = [
  { label: "Who is ready for maintenance", detail: "Promotion-ready operators with verified troubleshooting scores." },
  { label: "Who needs more training", detail: "Per-person skill gaps by domain — safety, electrical, PLC, VFD." },
  { label: "Which skills are missing", detail: "Heat maps from demonstrated faults, not attendance records." },
  { label: "Which teams are strongest", detail: "Compare workforce capability across shifts and sites." },
  { label: "Where downtime risk exists", detail: "Skill decay alerts when competency is not practiced." },
  { label: "Which operators are promotion-ready", detail: "Maintenance readiness score with manager validation." },
  { label: "Which technicians need retraining", detail: "Identify gaps before they become repeat failures." },
] as const;

export const HOMEPAGE_ROI = [
  { title: "Reduced downtime", detail: "Technicians who troubleshoot with a method — not trial and error." },
  { title: "Faster onboarding", detail: "Structured operator-to-maintenance pathway replaces tribal knowledge." },
  { title: "Lower contractor dependency", detail: "Build internal talent instead of renting it." },
  { title: "Stronger promotion pipeline", detail: "Verified competency for operator-to-tech transfers." },
  { title: "Better maintenance coverage", detail: "Skill-gap visibility across every shift." },
  { title: "Troubleshooting consistency", detail: "Same methodology, scored and tracked." },
  { title: "Reduced safety risk", detail: "Risk assessment and LOTO built into Level 1." },
  { title: "Better work order documentation", detail: "Document-the-work mindset in every lesson." },
] as const;

export const HOMEPAGE_EMPLOYER_CTA = {
  headline: "Build your internal maintenance pipeline.",
  subheadline: "See who is promotion-ready, where skill gaps exist, and how to reduce downtime — with verified competency data.",
  cta: { label: "Request a Demo", href: "/contact?intent=employer-demo" },
} as const;

export const HOMEPAGE_LEARNER_CTA = {
  headline: "Start your path from operator to maintenance.",
  subheadline: "Guided lessons, plant-floor simulations, and a skills passport employers can verify.",
  cta: { label: "Begin Level 1 — Risk Assessment", href: "/courses/safety-systems/risk-assessment" },
  alt: { label: "View full pathway", href: "/become-a-tech" },
} as const;

export const HOMEPAGE_DIFFERENTIATORS = [
  { title: "Not a video library", detail: "Scored troubleshooting simulations prove ability — not watch time." },
  { title: "Plant-floor voice", detail: "Built by maintenance leaders, controls engineers, and EHS professionals." },
  { title: "Verified competency", detail: "Skills passport and manager dashboard — promotion readiness with proof." },
  { title: "AI coaching", detail: "Stuck on a fault? Guided nudges that teach method — not answers." },
] as const;
