/**
 * Synthetic sample competency data for logged-out preview / demo modes.
 *
 * The evaluator pages (/competency, /skills-passport, /manager) must SELL before
 * login — a VP of Maintenance or Plant Manager should see exactly what the live
 * product produces without an account. This is clearly-labeled sample data, not
 * live records; it mirrors the real graph/matrix shapes so the previews look and
 * read like the authenticated views.
 */
import type { SkillDomain } from "@shared/competencyMatrix";
import type { CompetencyLevel } from "@shared/competencyGraph";

export const SAMPLE_BADGE = "SAMPLE DATA · sign in or request a demo for live records";

/** The four methodology tiers the scoring engine actually assigns, with cut lines. */
export const METHODOLOGY_TIERS: {
  tier: string;
  min: number;
  blurb: string;
  tone: "emerald" | "amber" | "red";
}[] = [
  { tier: "Master Diagnostician", min: 85, blurb: "Isolates root cause fast, with almost no wasted measurements.", tone: "emerald" },
  { tier: "Systematic Troubleshooter", min: 65, blurb: "Follows a sound gather → prints → measure → analyze → act method.", tone: "emerald" },
  { tier: "Developing Technician", min: 40, blurb: "Right instincts — still tightening the diagnostic method.", tone: "amber" },
  { tier: "Needs Methodology Training", min: 0, blurb: "Guesses before measuring — coach the process first.", tone: "red" },
];

export function tierForScore(pct: number): string {
  return METHODOLOGY_TIERS.find((t) => pct >= t.min)!.tier;
}

export interface SampleCell {
  domain: SkillDomain;
  label: string;
  level: CompetencyLevel;
  confidence: number;
  attempts: number;
  avgTimeSeconds: number | null;
  bestTimeSeconds: number | null;
  velocity: number;
  decay: "fresh" | "stale" | "decayed";
  daysSince: number | null;
  managerValidated: boolean;
}

function cell(
  domain: SkillDomain,
  label: string,
  confidence: number,
  attempts: number,
  opts: Partial<SampleCell> = {},
): SampleCell {
  const level: CompetencyLevel =
    attempts === 0 ? "not_demonstrated"
      : confidence >= 85 && attempts >= 3 ? "expert"
        : confidence >= 70 ? "proficient"
          : confidence >= 50 ? "competent"
            : "developing";
  return {
    domain, label, confidence, attempts, level,
    avgTimeSeconds: attempts ? 420 - confidence * 2 : null,
    bestTimeSeconds: attempts ? 300 - confidence : null,
    velocity: 0, decay: "fresh", daysSince: attempts ? 4 : null, managerValidated: false,
    ...opts,
  };
}

/** One operator's demonstrated competency graph (used by /competency preview). */
export const SAMPLE_MY_GRAPH: { promotionReady: boolean; overall: number; cells: SampleCell[] } = {
  promotionReady: true,
  overall: 81,
  cells: [
    cell("motors", "Motor Control", 88, 6, { managerValidated: true, velocity: 6 }),
    cell("safety", "Safety Circuits", 84, 5, { managerValidated: true }),
    cell("electrical", "Electrical Power", 79, 4, { velocity: 4 }),
    cell("plc", "PLC Diagnostics", 72, 4, { decay: "stale", daysSince: 190 }),
    cell("vfd", "VFD Diagnostics", 61, 3, { velocity: 8 }),
    cell("sensors", "Sensors & Instrumentation", 58, 3),
    cell("networking", "Industrial Networking", 44, 2, { velocity: 5 }),
    cell("integration", "System Integration", 0, 0),
  ],
};

export interface SampleMember {
  userId: string;
  name: string;
  role: string;
  overall: number;
  promotionReady: boolean;
  tier: string;
  cells: SampleCell[];
}

function member(userId: string, name: string, role: string, scores: Partial<Record<SkillDomain, number>>): SampleMember {
  const labels: Record<SkillDomain, string> = {
    vfd: "VFD Diagnostics", plc: "PLC Diagnostics", motors: "Motor Control", safety: "Safety Circuits",
    electrical: "Electrical Power", networking: "Industrial Networking", sensors: "Sensors & Instrumentation", integration: "System Integration",
    fluid_power: "Hydraulic Troubleshooting",
  };
  const domains = Object.keys(labels) as SkillDomain[];
  const cells = domains.map((d) => {
    const c = scores[d];
    if (c == null) return cell(d, labels[d], 0, 0);
    const stale = d === "plc" && userId === "u3";
    return cell(d, labels[d], c, c >= 50 ? 4 : 2, {
      managerValidated: c >= 80 && (d === "safety" || d === "motors"),
      decay: stale ? "decayed" : "fresh",
      daysSince: stale ? 210 : 5,
    });
  });
  const vals = domains.map((d) => scores[d] ?? 0).filter((v) => v > 0);
  const overall = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  return { userId, name, role, overall, promotionReady: overall >= 78, tier: tierForScore(overall), cells };
}

/** A maintenance team's competency matrix (used by /manager preview). */
export const SAMPLE_TEAM: SampleMember[] = [
  member("u1", "Marcus D.", "Operator → Tech", { motors: 90, safety: 86, electrical: 84, plc: 82, vfd: 74, sensors: 70, networking: 62 }),
  member("u2", "Priya N.", "Maintenance Tech I", { motors: 82, safety: 88, electrical: 79, plc: 68, vfd: 60, sensors: 66, networking: 55 }),
  member("u3", "Danny R.", "Operator", { motors: 64, safety: 58, electrical: 52, plc: 46, sensors: 48 }),
  member("u4", "Alicia M.", "Maintenance Tech II", { motors: 92, safety: 90, electrical: 88, plc: 85, vfd: 83, sensors: 78, networking: 74, integration: 70 }),
  member("u5", "Tomás V.", "Operator", { motors: 48, safety: 44, electrical: 38, sensors: 40 }),
];
