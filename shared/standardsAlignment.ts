/**
 * Standards Alignment Registry — the machine-readable crosswalk between platform
 * content and external standards. This is the artifact accreditors and corporate
 * EHS auditors require: "show me, clause by clause, what your training covers."
 *
 * IMPORTANT — what each body actually does (do not conflate "alignment" with
 * "accreditation"):
 *   - OSHA       : does NOT accredit courses. Content is *aligned* to 29 CFR clauses;
 *                  the only "OSHA card" path is becoming an Outreach-authorized
 *                  provider (OSHA 10/30) via an OTI Education Center.
 *   - NFPA 70E   : a consensus standard (referenced by OSHA). Align content; no accreditation.
 *   - NEMA/ICEA  : trade-association standards bodies. Align content; they do not accredit training.
 *   - ANSI       : accredits CERTIFICATION bodies (ISO/IEC 17024) and certificate
 *                  programs (ASTM E2659) via ANAB — that applies to our CERT program, not the app.
 *   - IACET      : accredits TRAINING PROVIDERS to award CEUs (ANSI/IACET 1-2018) — best direct fit.
 *   - ABET       : accredits DEGREE PROGRAMS at institutions, not vendors — partner, don't pursue directly.
 *
 * So this registry powers two real, achievable things: (1) auditable standards
 * coverage for buyers, and (2) the documented outcome-to-content mapping that
 * IACET / ANAB accreditation reviews demand.
 */

export type StandardsBody = "OSHA" | "NFPA" | "NEMA" | "ICEA" | "ANSI" | "IACET";

export interface StandardClause {
  id: string;
  body: StandardsBody;
  /** Clause / document number, e.g. "29 CFR 1910.147" or "NEMA ICS 2". */
  ref: string;
  title: string;
}

/** Canonical clauses the curriculum maps to. */
export const STANDARD_CLAUSES: Record<string, StandardClause> = {
  "osha-1910-147": { id: "osha-1910-147", body: "OSHA", ref: "29 CFR 1910.147", title: "The Control of Hazardous Energy (Lockout/Tagout)" },
  "osha-1910-332": { id: "osha-1910-332", body: "OSHA", ref: "29 CFR 1910.332", title: "Electrical Safety-Related Work Practices — Training" },
  "osha-1910-333": { id: "osha-1910-333", body: "OSHA", ref: "29 CFR 1910.333", title: "Selection and Use of Work Practices (De-energizing)" },
  "osha-1910-269": { id: "osha-1910-269", body: "OSHA", ref: "29 CFR 1910.269", title: "Electric Power Generation, Transmission, and Distribution" },
  "nfpa-70e": { id: "nfpa-70e", body: "NFPA", ref: "NFPA 70E", title: "Standard for Electrical Safety in the Workplace (Arc Flash / PPE)" },
  "nema-ics-2": { id: "nema-ics-2", body: "NEMA", ref: "NEMA ICS 2", title: "Industrial Control and Systems: Controllers, Contactors, Overload Relays" },
  "nema-mg-1": { id: "nema-mg-1", body: "NEMA", ref: "NEMA MG-1", title: "Motors and Generators" },
  "nema-250": { id: "nema-250", body: "NEMA", ref: "NEMA 250", title: "Enclosures for Electrical Equipment" },
  "icea-s-95-658": { id: "icea-s-95-658", body: "ICEA", ref: "ICEA S-95-658", title: "Nonshielded Power Cables Rated 2000V or Less" },
  "ansi-z535": { id: "ansi-z535", body: "ANSI", ref: "ANSI Z535", title: "Safety Signs, Colors, and Tags" },
  "ansi-isa-5-1": { id: "ansi-isa-5-1", body: "ANSI", ref: "ANSI/ISA-5.1", title: "Instrumentation Symbols and Identification (P&ID)" },
  "iacet-1-2018": { id: "iacet-1-2018", body: "IACET", ref: "ANSI/IACET 1-2018", title: "Standard for Continuing Education and Training (CEU issuance)" },
};

/**
 * Module/domain → clauses covered. Keyed by SkillDomain so it stays robust as the
 * catalog grows. Maps to shared/competencyMatrix SkillDomain values.
 */
export const DOMAIN_STANDARDS: Record<string, string[]> = {
  safety: ["osha-1910-147", "osha-1910-332", "osha-1910-333", "nfpa-70e", "ansi-z535"],
  electrical: ["osha-1910-333", "osha-1910-269", "nfpa-70e", "icea-s-95-658", "nema-250"],
  motors: ["nema-mg-1", "nema-ics-2", "osha-1910-333"],
  vfd: ["nema-ics-2", "nema-mg-1", "nfpa-70e"],
  plc: ["nema-ics-2", "ansi-isa-5-1"],
  sensors: ["ansi-isa-5-1", "nema-ics-2"],
  networking: ["ansi-isa-5-1"],
  integration: ["osha-1910-147", "nfpa-70e", "ansi-isa-5-1", "nema-ics-2"],
};

export function clausesForDomain(domain: string): StandardClause[] {
  return (DOMAIN_STANDARDS[domain] ?? []).map(id => STANDARD_CLAUSES[id]).filter(Boolean);
}

/** All distinct bodies a given domain touches (for badges). */
export function bodiesForDomain(domain: string): StandardsBody[] {
  return Array.from(new Set(clausesForDomain(domain).map(c => c.body)));
}

// ── CEU math (ANSI/IACET 1-2018) ──────────────────────────────────────────────
// 1 CEU = 10 contact hours of qualifying, assessed instruction.
export const MINUTES_PER_CEU = 600;

export function contactHoursToCeu(minutes: number): number {
  return Math.round((minutes / MINUTES_PER_CEU) * 100) / 100; // 2 decimals
}
