/**
 * PersonalizedRecommendations — Shows course recommendations based on
 * onboarding answers persisted in the database (via auth.me user object).
 * Falls back to localStorage key "eas-onboarding" for immediate display
 * before the server response arrives.
 * Only renders if the user has completed the onboarding wizard.
 *
 * IMPORTANT: All recommended course slugs MUST exist in the database
 * with at least one published lesson. See course-audit.md for the
 * canonical list of valid slugs.
 *
 * Valid slugs with published lessons:
 *   powerflex-vfd (18), plc-fundamentals (24), fluid-power (6),
 *   motors-controls (6), alignment (5), preventative-maintenance (6),
 *   electrical-fundamentals (6), digital-fundamentals (6),
 *   semiconductor-fundamentals (6), hvac-fundamentals (6),
 *   industrial-networking (3), sensors-instrumentation (3),
 *   robotics-fundamentals (3), print-reading (3), safety-systems (3),
 *   process-control (3), power-distribution (3)
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Zap, ArrowRight, Cpu, Wrench, Settings, Gauge,
  Factory, Shield, Target, Award, Briefcase, Sparkles, X
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

type ExperienceLevel = "beginner" | "intermediate" | "advanced";
type Goal = "certification" | "troubleshooting" | "career" | "compliance";

interface OnboardingData {
  experienceLevel: ExperienceLevel;
  goals: Goal[];
  equipment: string[];
  completedAt: number;
  skipped?: boolean;
}

interface CourseRec {
  slug: string;
  title: string;
  description: string;
  icon: React.ElementType;
  tag?: string;
}

// Maps experience levels to real module slugs in the database (all verified with published lessons)
const experienceRecommendations: Record<ExperienceLevel, CourseRec[]> = {
  beginner: [
    { slug: "electrical-fundamentals", title: "Electrical Fundamentals", description: "Voltage, current, resistance, and basic circuits — start here", icon: Zap, tag: "Foundation" },
    { slug: "safety-systems", title: "Safety Systems", description: "Machine guarding, safety relays, and LOTO procedures", icon: Shield, tag: "Foundation" },
    { slug: "print-reading", title: "Print Reading (Electrical)", description: "Read schematics, trace wires, and understand panel layouts", icon: Wrench, tag: "Foundation" },
  ],
  intermediate: [
    { slug: "powerflex-vfd", title: "PowerFlex VFD Programming", description: "Variable frequency drives — setup, parameters, and faults", icon: Settings, tag: "Level Up" },
    { slug: "plc-fundamentals", title: "PLC Fundamentals & Troubleshooting", description: "Ladder logic, I/O troubleshooting, and online diagnostics", icon: Cpu, tag: "Level Up" },
    { slug: "sensors-instrumentation", title: "Sensors & Instrumentation", description: "Proximity sensors, 4-20mA signals, and process measurement", icon: Gauge, tag: "Level Up" },
  ],
  advanced: [
    { slug: "industrial-networking", title: "Industrial Networking", description: "EtherNet/IP, managed switches, VLANs, and PLC communications", icon: Cpu, tag: "Advanced" },
    { slug: "process-control", title: "Process Control", description: "PID tuning, control valves, and instrumentation loops", icon: Target, tag: "Advanced" },
    { slug: "robotics-fundamentals", title: "Robotics Fundamentals", description: "Industrial robot types, PLC integration, and maintenance", icon: Factory, tag: "Advanced" },
  ],
};

// Additional recommendations based on selected goals (all verified slugs)
const goalRecommendations: Partial<Record<Goal, CourseRec>> = {
  troubleshooting: { slug: "powerflex-vfd", title: "PowerFlex VFD Troubleshooting", description: "Master VFD fault codes and systematic troubleshooting", icon: Settings },
  compliance: { slug: "safety-systems", title: "Safety Systems", description: "Machine guarding, safety relays, LOTO, and OSHA compliance", icon: Shield },
  certification: { slug: "alignment", title: "Precision Shaft Alignment", description: "Certifiable skill — laser alignment and best practices", icon: Award },
  career: { slug: "power-distribution", title: "Power Distribution", description: "Industrial power systems, overcurrent protection, and grounding", icon: Zap },
};

// Additional recommendations based on selected equipment (all verified slugs)
const equipmentRecommendations: Record<string, CourseRec> = {
  motors: { slug: "motors-controls", title: "Motors & Motor Controls", description: "AC/DC motor theory, starters, and diagnostics", icon: Gauge },
  plc: { slug: "plc-fundamentals", title: "PLC Fundamentals & Troubleshooting", description: "Ladder logic, I/O modules, and communication faults", icon: Cpu },
  electrical: { slug: "power-distribution", title: "Power Distribution", description: "Industrial power systems, overcurrent protection, and grounding", icon: Zap },
  hvac: { slug: "hvac-fundamentals", title: "HVAC Fundamentals", description: "Refrigeration cycles, motor controls, and diagnostics", icon: Factory },
  instrumentation: { slug: "sensors-instrumentation", title: "Sensors & Instrumentation", description: "Proximity sensors, 4-20mA signals, and process measurement", icon: Gauge },
  general: { slug: "preventative-maintenance", title: "Preventative Maintenance Programs", description: "PM schedules, inspections, and best practices", icon: Wrench },
};

const goalLabels: Record<Goal, { label: string; icon: React.ElementType }> = {
  certification: { label: "Certifications", icon: Award },
  troubleshooting: { label: "Troubleshooting", icon: Target },
  career: { label: "Career Growth", icon: Briefcase },
  compliance: { label: "Compliance", icon: Shield },
};

const levelLabels: Record<ExperienceLevel, string> = {
  beginner: "New to the Trade",
  intermediate: "Working Technician",
  advanced: "Seasoned Professional",
};

export default function PersonalizedRecommendations() {
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();

  const onboardingData = useMemo<OnboardingData | null>(() => {
    // Primary source: server-side onboardingSelections from user profile
    if (user && (user as any).onboardingSelections) {
      const serverData = (user as any).onboardingSelections as any;
      if (serverData.skipped) return null;
      if (!serverData.experienceLevel) return null;
      return {
        experienceLevel: serverData.experienceLevel,
        goals: serverData.goals || [],
        equipment: serverData.equipment || [],
        completedAt: serverData.completedAt || Date.now(),
      } as OnboardingData;
    }
    // Fallback: localStorage for immediate display before server responds
    try {
      const raw = localStorage.getItem("eas-onboarding");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.skipped) return null;
      if (!parsed.experienceLevel || !parsed.completedAt) return null;
      return parsed as OnboardingData;
    } catch {
      return null;
    }
  }, [user]);

  // Build a deduplicated list of recommended courses
  const recommendations = useMemo(() => {
    if (!onboardingData) return [];
    const seen = new Set<string>();
    const recs: CourseRec[] = [];

    // Primary: experience-level recommendations
    for (const rec of experienceRecommendations[onboardingData.experienceLevel] || []) {
      if (!seen.has(rec.slug)) {
        seen.add(rec.slug);
        recs.push(rec);
      }
    }

    // Secondary: goal-based recommendations
    for (const goal of onboardingData.goals || []) {
      const rec = goalRecommendations[goal];
      if (rec && !seen.has(rec.slug)) {
        seen.add(rec.slug);
        recs.push({ ...rec, tag: goalLabels[goal]?.label });
      }
    }

    // Tertiary: equipment-based recommendations
    for (const eq of onboardingData.equipment || []) {
      const rec = equipmentRecommendations[eq];
      if (rec && !seen.has(rec.slug)) {
        seen.add(rec.slug);
        recs.push({ ...rec, tag: "Your Equipment" });
      }
    }

    // Cap at 4 recommendations
    return recs.slice(0, 4);
  }, [onboardingData]);

  if (!onboardingData || dismissed || recommendations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="mb-8"
    >
      <div className="card-panel p-5 sm:p-6 rounded-xl relative overflow-hidden">
        {/* Top accent */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[oklch(0.55_0.12_155)] via-[oklch(0.55_0.12_155/40%)] to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[oklch(0.55_0.12_155/10%)] border border-[oklch(0.55_0.12_155/25%)] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
            </div>
            <div>
              <h3 className="text-sm font-heading text-white">Recommended for You</h3>
              <p className="text-[10px] text-[oklch(0.45_0.006_250)] font-mono">
                Based on your profile &middot; {levelLabels[onboardingData.experienceLevel]}
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-[oklch(0.35_0.006_250)] hover:text-white transition-colors p-1"
            aria-label="Dismiss recommendations"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile tags */}
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono bg-[oklch(0.55_0.12_155/10%)] text-[oklch(0.55_0.12_155)] border border-[oklch(0.55_0.12_155/20%)]">
            {levelLabels[onboardingData.experienceLevel]}
          </span>
          {onboardingData.goals?.slice(0, 3).map((g) => {
            const gl = goalLabels[g];
            if (!gl) return null;
            const GIcon = gl.icon;
            return (
              <span key={g} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono bg-[oklch(0.12_0.003_250)] text-[oklch(0.50_0.008_250)] border border-[oklch(0.16_0.004_250)]">
                <GIcon className="w-2.5 h-2.5" />
                {gl.label}
              </span>
            );
          })}
        </div>

        {/* Course cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recommendations.map((course, i) => {
            const Icon = course.icon;
            return (
              <motion.div
                key={course.slug}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
              >
                <Link
                  href={`/courses/${course.slug}`}
                  className="block p-3.5 rounded-xl bg-[oklch(0.07_0.003_250)] border border-[oklch(0.15_0.004_250)] hover:border-[oklch(0.55_0.12_155/30%)] hover:bg-[oklch(0.09_0.003_250)] transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[oklch(0.55_0.12_155/8%)] border border-[oklch(0.55_0.12_155/18%)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-4.5 h-4.5 text-[oklch(0.55_0.12_155)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-xs font-semibold text-white group-hover:text-[oklch(0.75_0.12_155)] transition-colors truncate">
                          {course.title}
                        </h4>
                        {course.tag && (
                          <span className="shrink-0 text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[oklch(0.55_0.12_155/8%)] text-[oklch(0.55_0.12_155)] border border-[oklch(0.55_0.12_155/15%)]">
                            {course.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[oklch(0.45_0.006_250)] leading-relaxed line-clamp-2">
                        {course.description}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[oklch(0.30_0.006_250)] group-hover:text-[oklch(0.55_0.12_155)] transition-colors shrink-0 mt-1" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[oklch(0.14_0.004_250)]">
          <Link href="/courses" className="text-[11px] text-[oklch(0.55_0.12_155)] hover:text-[oklch(0.65_0.12_155)] transition-colors font-medium">
            Browse all courses →
          </Link>
          <span className="text-[9px] text-[oklch(0.30_0.006_250)] font-mono">
            Personalized &middot; {new Date(onboardingData.completedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
