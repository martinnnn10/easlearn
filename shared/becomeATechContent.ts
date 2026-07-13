/**
 * B2B marketing content for /become-a-tech — digital apprenticeship positioning.
 * Shared between the page and any employer-facing surfaces.
 */

export const BECOME_A_TECH_HERO = {
  title: "Go from Machine Operator to Maintenance Technician",
  subheadline:
    "EASLearn is a digital apprenticeship platform that teaches real industrial troubleshooting, safety, electrical, mechanical, PLC, and reliability skills through guided lessons, simulations, and verified competency tracking.",
  ctas: {
    startLearning: { label: "Start Learning", href: "/courses/safety-systems/risk-assessment" },
    employerDemo: { label: "Request Employer Demo", href: "/contact?intent=employer-demo" },
  },
} as const;

export const BECOME_A_TECH_PROBLEM = {
  headline: "Operators want to grow. Plants need more maintenance talent.",
  body: "Traditional training is too slow, too generic, and does not prove real troubleshooting ability. You cannot reduce downtime with a video library and a certificate of attendance.",
} as const;

export const BECOME_A_TECH_SOLUTION = {
  headline: "The maintenance mindset — every call, every fault",
  steps: [
    { title: "Safety first", detail: "Assess hazards, isolate energy, verify zero before you touch." },
    { title: "Understand the machine", detail: "Read the print, know the sequence, identify what should happen." },
    { title: "Diagnose the symptom", detail: "Separate what the operator sees from what the machine is actually doing." },
    { title: "Find the root cause", detail: "Measure, trace, and prove — do not swap parts and hope." },
    { title: "Verify the repair", detail: "Run it, watch it, confirm the fault is gone and stays gone." },
    { title: "Document the work", detail: "Log what failed, what you did, and what to watch next shift." },
  ],
} as const;

export interface LearningPathLevel {
  level: number;
  title: string;
  topics: string;
  moduleSlug?: string;
  lessonSlug?: string;
  route?: string;
}

export const BECOME_A_TECH_PATH: LearningPathLevel[] = [
  { level: 0, title: "Operator Foundation", topics: "Machine operation, normal sequence, when to call maintenance", route: "/labs?entry=path&mode=practice#conveyor-troubleshoot" },
  { level: 1, title: "Safety, LOTO, Risk Assessment", topics: "Hazard vs risk, stored energy, before-touch checklist", moduleSlug: "safety-systems", lessonSlug: "risk-assessment" },
  { level: 2, title: "Mechanical Fundamentals", topics: "Bearings, belts, alignment, mechanical bind diagnosis", moduleSlug: "motors-controls", lessonSlug: "motor-theory" },
  { level: 3, title: "Electrical Fundamentals", topics: "Voltage, current, schematics, control power", moduleSlug: "electrical-fundamentals", lessonSlug: "electrical-safety-lockout" },
  { level: 4, title: "Sensors and Controls", topics: "Prox, photoeyes, 4–20 mA, input troubleshooting", moduleSlug: "sensors-instrumentation", lessonSlug: "proximity-photoelectric" },
  { level: 5, title: "Motors and VFDs", topics: "Starters, overloads, drive parameters, fault codes", moduleSlug: "powerflex-vfd", lessonSlug: "vfd-fundamentals" },
  { level: 6, title: "PLC Troubleshooting", topics: "Ladder logic, I/O faults, online diagnostics", moduleSlug: "plc-fundamentals", lessonSlug: "io-troubleshooting" },
  { level: 7, title: "Pneumatics and Hydraulics", topics: "Cylinders, valves, pressure, stored fluid energy", moduleSlug: "fluid-power" },
  { level: 8, title: "Preventive Maintenance and Reliability", topics: "PM inspections, failure modes, uptime planning", moduleSlug: "preventative-maintenance" },
  { level: 9, title: "Troubleshooting Mastery", topics: "Multi-fault diagnosis, methodology, scored simulators", moduleSlug: "industrial-troubleshooting", route: "/labs?entry=path&mode=practice#conveyor-troubleshoot" },
  { level: 10, title: "Job Readiness", topics: "Verified competency, skills passport, promotion readiness", route: "/skills-passport" },
];

export const BECOME_A_TECH_COMPETENCY_PROOF = [
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

export const BECOME_A_TECH_WHO = {
  headline: "Who this pathway is for",
  audiences: [
    { title: "Machine operators", detail: "You run the equipment and want to move into maintenance — this is your promotion path with proof." },
    { title: "Entry-level maintenance techs", detail: "Fill gaps in safety, electrical, PLC, and VFD with plant-floor scenarios — not theory lectures." },
    { title: "Upskilling manufacturing employees", detail: "Your plant can build internal talent instead of hiring contractors for every fault." },
  ],
} as const;

export const BECOME_A_TECH_AI = {
  headline: "AI coaching that teaches method — not answers",
  body: "When you're stuck on a simulated fault or lesson check, the AI coach nudges you toward the maintenance mindset: safety first, measure before guessing, isolate the symptom from root cause. It won't hand you the fix — it builds troubleshooting confidence the way a senior tech would on nights.",
  points: [
    "Prompts you to check safety and stored energy before reaching in",
    "Asks what you measured — not what part you'd swap",
    "Connects lesson concepts to the active simulation fault",
    "Tracks your method score, not just right/wrong clicks",
  ],
} as const;

export const BECOME_A_TECH_EMPLOYERS = {
  headline: "How employers use this pathway",
  body: "Maintenance managers assign the operator-to-tech program, track demonstrated competency in the manager dashboard, and identify who is promotion-ready — with verified troubleshooting scores, not attendance certificates.",
  uses: [
    "Assign Level 1–10 to operators targeted for maintenance roles",
    "See skill-gap heat maps by domain: safety, electrical, PLC, VFD",
    "Validate promotion readiness with manager sign-off on competency",
    "Reduce downtime by growing internal troubleshooting capability",
  ],
  cta: { label: "Request Employer Demo", href: "/contact?intent=employer-demo" },
} as const;

export const BECOME_A_TECH_EMPLOYER_VALUE = [
  { label: "Who is ready for maintenance", detail: "Promotion-ready operators with verified troubleshooting scores." },
  { label: "Who needs more training", detail: "Skill gaps by domain — safety, electrical, PLC, VFD." },
  { label: "Which skills are missing", detail: "Heat maps tied to real fault scenarios, not course completion." },
  { label: "Which teams are strongest", detail: "Compare demonstrated competency across shifts and sites." },
  { label: "Where downtime risk exists", detail: "Decay alerts when skills are not practiced." },
  { label: "Which operators are ready to promote", detail: "Maintenance readiness score with manager validation." },
] as const;

export interface SimulationExample {
  title: string;
  description: string;
  route: string;
}

export const BECOME_A_TECH_SIMULATIONS: SimulationExample[] = [
  { title: "Conveyor will not start", description: "Trace permissives, photoeyes, and safety chain.", route: "/labs?entry=path&mode=practice#conveyor-troubleshoot" },
  { title: "Photoeye fault", description: "Input stuck ON — sensor vs wiring vs PLC.", route: "/labs?entry=path&mode=practice#plc-io-fault-v3" },
  { title: "Motor overload trip", description: "Find the mechanical or electrical cause before reset.", route: "/simulator?scenario=motor-overload-trip-v3" },
  { title: "Air cylinder stuck", description: "Bleed pressure, block the stroke, verify zero energy.", route: "/courses/safety-systems/risk-assessment" },
  { title: "VFD fault", description: "Read the fault code, check parameters, verify the load.", route: "/simulator?scenario=vfd-overcurrent-ramp-v3" },
  { title: "Guard door safety issue", description: "Walk the E-stop and guard chain — no bypasses.", route: "/simulator?scenario=conveyor-estop-v2" },
  { title: "PLC input not changing", description: "LED, field device, wiring, then logic.", route: "/courses/plc-fundamentals/io-troubleshooting" },
  { title: "Low air pressure fault", description: "Trace supply, regulator, and actuator.", route: "/courses/fluid-power" },
  { title: "Bad prox sensor", description: "LED, target, range, NPN/PNP match.", route: "/courses/sensors-instrumentation/proximity-photoelectric" },
  { title: "Loose wire in control circuit", description: "Meter the safety string for opens.", route: "/courses/motors-controls/motor-control-circuits" },
];
