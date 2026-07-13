/**
 * OnboardingWizard — Multi-step onboarding for new users.
 * Steps: Welcome → Experience Level → Goals → Equipment → Recommendation
 * Feels like a professional intake form for a training program.
 *
 * IMPORTANT: All recommended course slugs MUST exist in the database
 * with at least one published lesson. See course-audit.md for the
 * canonical list of valid slugs.
 *
 * Valid slugs with published lessons:
 *   powerflex-vfd (18), plc-fundamentals (24), fluid-power (6),
 *   motors-controls (6), alignment (5), preventative-maintenance (6),
 *   electrical-fundamentals (6), digital-fundamentals (6),
 *   semiconductor-fundamentals (6), hvac-fundamentals (6)
 *
 * DO NOT recommend: industrial-troubleshooting (0 lessons)
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Zap, ArrowRight, ArrowLeft, CheckCircle, Cpu, Wrench,
  Settings, Shield, GraduationCap, Target, Factory, HardHat,
  Gauge, BookOpen, Award, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingWizardProps {
  userName: string;
  onDismiss: (selections?: { experienceLevel: string | null; goals: string[]; equipment: string[]; skipped?: boolean }) => void;
}

type ExperienceLevel = "beginner" | "intermediate" | "advanced";
type Goal = "certification" | "troubleshooting" | "career" | "compliance";

const experienceLevels = [
  {
    id: "beginner" as ExperienceLevel,
    label: "New to the Trade",
    description: "Just starting out or switching careers. Need fundamentals.",
    icon: Shield,
    years: "0-1 years",
  },
  {
    id: "intermediate" as ExperienceLevel,
    label: "Working Technician",
    description: "Comfortable with basics, ready to level up troubleshooting.",
    icon: Wrench,
    years: "1-5 years",
  },
  {
    id: "advanced" as ExperienceLevel,
    label: "Seasoned Professional",
    description: "Years of experience, looking for advanced topics and certification prep.",
    icon: Cpu,
    years: "5+ years",
  },
];

const goals = [
  { id: "certification" as Goal, label: "Earn Certifications", description: "Get certified to advance my career", icon: Award },
  { id: "troubleshooting" as Goal, label: "Better Troubleshooting", description: "Faster fault-finding on the plant floor", icon: Target },
  { id: "career" as Goal, label: "Career Advancement", description: "Move into a senior or supervisory role", icon: Briefcase },
  { id: "compliance" as Goal, label: "Safety & Compliance", description: "Meet OSHA/NFPA/NEC requirements", icon: Shield },
];

const equipmentTypes = [
  { id: "motors", label: "Motors & Drives", icon: Gauge },
  { id: "plc", label: "PLCs & Controls", icon: Cpu },
  { id: "electrical", label: "Power Distribution", icon: Zap },
  { id: "instrumentation", label: "Instrumentation", icon: Settings },
  { id: "hvac", label: "HVAC Systems", icon: Factory },
  { id: "general", label: "General Maintenance", icon: Wrench },
];

// All slugs here are verified to exist in the database with published lessons
const recommendations: Record<ExperienceLevel, Array<{ slug: string; title: string; description: string; icon: React.ElementType }>> = {
  beginner: [
    { slug: "electrical-fundamentals", title: "Electrical Fundamentals", description: "Start here — voltage, current, resistance, and basic circuits", icon: Zap },
    { slug: "safety-systems", title: "Safety Systems", description: "Machine guarding, safety relays, and LOTO procedures", icon: Shield },
    { slug: "print-reading", title: "Print Reading (Electrical)", description: "Read schematics, trace wires, and understand panel layouts", icon: BookOpen },
  ],
  intermediate: [
    { slug: "powerflex-vfd", title: "PowerFlex VFD Programming", description: "Variable frequency drives — setup, parameters, and faults", icon: Settings },
    { slug: "plc-fundamentals", title: "PLC Fundamentals & Troubleshooting", description: "Ladder logic, I/O troubleshooting, and online diagnostics", icon: Cpu },
    { slug: "sensors-instrumentation", title: "Sensors & Instrumentation", description: "Proximity sensors, 4-20mA signals, and process measurement", icon: Gauge },
  ],
  advanced: [
    { slug: "industrial-networking", title: "Industrial Networking", description: "EtherNet/IP, managed switches, VLANs, and PLC communications", icon: Cpu },
    { slug: "process-control", title: "Process Control", description: "PID tuning, control valves, and instrumentation loops", icon: Target },
    { slug: "robotics-fundamentals", title: "Robotics Fundamentals", description: "Industrial robot types, PLC integration, and maintenance", icon: Factory },
  ],
};

type Step = "welcome" | "experience" | "goals" | "equipment" | "recommendation";

const stepOrder: Step[] = ["welcome", "experience", "goals", "equipment", "recommendation"];

export default function OnboardingWizard({ userName, onDismiss }: OnboardingWizardProps) {
  const [step, setStep] = useState<Step>("welcome");
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<Goal[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  const firstName = userName?.split(" ")[0] || "there";
  const currentStepIndex = stepOrder.indexOf(step);
  const totalSteps = stepOrder.length;

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < totalSteps) setStep(stepOrder[nextIndex]);
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) setStep(stepOrder[prevIndex]);
  };

  const toggleGoal = (g: Goal) => {
    setSelectedGoals((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const toggleEquipment = (e: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]
    );
  };

  // Equipment-to-course boost mapping
  const EQUIPMENT_COURSE_MAP: Record<string, string[]> = {
    motors: ["motors-controls", "powerflex-vfd", "alignment"],
    plc: ["plc-fundamentals", "digital-fundamentals"],
    electrical: ["electrical-fundamentals", "print-reading", "safety-systems"],
    instrumentation: ["sensors-instrumentation", "process-control"],
    hvac: ["hvac-fundamentals"],
    general: ["preventative-maintenance", "alignment"],
  };

  // All valid courses with published lessons for equipment-based recs
  const ALL_COURSES: Array<{ slug: string; title: string; description: string; icon: React.ElementType }> = [
    { slug: "electrical-fundamentals", title: "Electrical Fundamentals", description: "Voltage, current, resistance, and basic circuits", icon: Zap },
    { slug: "motors-controls", title: "Motors & Motor Controls", description: "Motor types, starters, overloads, and control circuits", icon: Gauge },
    { slug: "powerflex-vfd", title: "PowerFlex VFD Programming", description: "Variable frequency drives — setup, parameters, and faults", icon: Settings },
    { slug: "plc-fundamentals", title: "PLC Fundamentals & Troubleshooting", description: "Ladder logic, I/O troubleshooting, and online diagnostics", icon: Cpu },
    { slug: "alignment", title: "Precision Alignment", description: "Shaft alignment, laser tools, and vibration analysis", icon: Target },
    { slug: "preventative-maintenance", title: "Preventative Maintenance", description: "PM schedules, lubrication, and predictive techniques", icon: Wrench },
    { slug: "sensors-instrumentation", title: "Sensors & Instrumentation", description: "Proximity sensors, 4-20mA signals, and process measurement", icon: Gauge },
    { slug: "hvac-fundamentals", title: "HVAC Fundamentals", description: "Heating, ventilation, and air conditioning systems", icon: Factory },
    { slug: "digital-fundamentals", title: "Digital Fundamentals", description: "Binary logic, gates, and digital control systems", icon: Cpu },
    { slug: "fluid-power", title: "Fluid Power", description: "Hydraulics and pneumatics fundamentals", icon: Settings },
    { slug: "safety-systems", title: "Safety Systems", description: "Machine guarding, safety relays, and LOTO procedures", icon: Shield },
    { slug: "print-reading", title: "Print Reading (Electrical)", description: "Read schematics, trace wires, and understand panel layouts", icon: BookOpen },
    { slug: "process-control", title: "Process Control", description: "PID tuning, control valves, and instrumentation loops", icon: Target },
    { slug: "industrial-networking", title: "Industrial Networking", description: "EtherNet/IP, managed switches, VLANs, and PLC communications", icon: Cpu },
    { slug: "semiconductor-fundamentals", title: "Semiconductor Fundamentals", description: "Diodes, transistors, and semiconductor devices", icon: Zap },
    { slug: "robotics-fundamentals", title: "Robotics Fundamentals", description: "Industrial robot types, PLC integration, and maintenance", icon: Factory },
  ];

  // Build recommendations: start with experience-level defaults, then boost equipment-relevant courses
  const baseRecs = selectedLevel ? recommendations[selectedLevel] : [];
  let recs = baseRecs;

  if (selectedEquipment.length > 0) {
    // Collect equipment-boosted slugs
    const boostedSlugs = new Set<string>();
    for (const eq of selectedEquipment) {
      const mapped = EQUIPMENT_COURSE_MAP[eq] || [];
      mapped.forEach(s => boostedSlugs.add(s));
    }
    // Remove base recs that aren't relevant, add equipment-matched courses
    const baseSlugs = new Set(baseRecs.map(r => r.slug));
    const equipmentRecs = ALL_COURSES.filter(c => boostedSlugs.has(c.slug) && !baseSlugs.has(c.slug));
    // Merge: base recs that are also equipment-relevant first, then equipment-only, then remaining base
    const relevant = baseRecs.filter(r => boostedSlugs.has(r.slug));
    const remaining = baseRecs.filter(r => !boostedSlugs.has(r.slug));
    recs = [...relevant, ...equipmentRecs, ...remaining].slice(0, 4);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-panel p-6 sm:p-8 mb-8 relative overflow-hidden"
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[oklch(0.55_0.12_155)] via-[oklch(0.55_0.12_155/50%)] to-transparent" />

      {/* Step indicator */}
      {step !== "welcome" && (
        <div className="flex items-center gap-1.5 mb-6">
          {stepOrder.slice(1).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i < currentStepIndex
                  ? "bg-[oklch(0.55_0.12_155)]"
                  : i === currentStepIndex - 1
                  ? "bg-[oklch(0.55_0.12_155/60%)]"
                  : "bg-[oklch(0.15_0.004_250)]"
              }`}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ─── Step 1: Welcome ─── */}
        {step === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[oklch(0.55_0.12_155/10%)] border border-[oklch(0.55_0.12_155/25%)] flex items-center justify-center">
                  <HardHat className="w-6 h-6 text-[oklch(0.55_0.12_155)]" />
                </div>
                <div>
                  <h3 className="text-xl font-heading text-white">Welcome, {firstName}!</h3>
                  <p className="text-sm text-[oklch(0.55_0.008_250)]">Let's build your training plan</p>
                </div>
              </div>
              <button
                onClick={() => {
                  try {
                    localStorage.setItem("eas-onboarding", JSON.stringify({
                      experienceLevel: null,
                      goals: [],
                      equipment: [],
                      completedAt: Date.now(),
                      skipped: true,
                    }));
                  } catch {}
                  onDismiss({ experienceLevel: null, goals: [], equipment: [], skipped: true });
                }}
                className="text-xs text-[oklch(0.45_0.008_250)] hover:text-white transition-colors"
              >
                Skip
              </button>
            </div>

            <p className="text-[oklch(0.65_0.008_250)] mb-6 leading-relaxed">
              Answer a few quick questions so we can recommend the best courses for your skill level, 
              goals, and the equipment you work with. Takes about 30 seconds.
            </p>

            <div className="flex items-center gap-4">
              <Button onClick={goNext} className="btn-primary">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <span className="text-[11px] text-[oklch(0.40_0.006_250)] font-mono">~30 sec</span>
            </div>
          </motion.div>
        )}

        {/* ─── Step 2: Experience Level ─── */}
        {step === "experience" && (
          <motion.div
            key="experience"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-heading text-white">Your Experience Level</h3>
                <p className="text-xs text-[oklch(0.50_0.008_250)] mt-0.5">How long have you been in the trade?</p>
              </div>
              <button onClick={goBack} className="text-xs text-[oklch(0.45_0.008_250)] hover:text-white transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
            </div>

            <div className="grid gap-3">
              {experienceLevels.map((level) => {
                const Icon = level.icon;
                const isSelected = selectedLevel === level.id;
                return (
                  <button
                    key={level.id}
                    onClick={() => {
                      setSelectedLevel(level.id);
                      setTimeout(goNext, 300);
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? "bg-[oklch(0.55_0.12_155/10%)] border-[oklch(0.55_0.12_155/40%)]"
                        : "bg-[oklch(0.08_0.003_250)] border-[oklch(0.16_0.004_250)] hover:border-[oklch(0.55_0.12_155/25%)] hover:bg-[oklch(0.10_0.003_250)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected ? "bg-[oklch(0.55_0.12_155/20%)]" : "bg-[oklch(0.12_0.003_250)]"
                      }`}>
                        <Icon className={`w-5 h-5 ${isSelected ? "text-[oklch(0.55_0.12_155)]" : "text-[oklch(0.50_0.008_250)]"}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-white">{level.label}</h4>
                          <span className="text-[10px] font-mono text-[oklch(0.40_0.006_250)] bg-[oklch(0.12_0.003_250)] px-1.5 py-0.5 rounded">{level.years}</span>
                        </div>
                        <p className="text-xs text-[oklch(0.50_0.008_250)]">{level.description}</p>
                      </div>
                      {isSelected && <CheckCircle className="w-5 h-5 text-[oklch(0.55_0.12_155)] shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ─── Step 3: Goals ─── */}
        {step === "goals" && (
          <motion.div
            key="goals"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-heading text-white">What are your goals?</h3>
                <p className="text-xs text-[oklch(0.50_0.008_250)] mt-0.5">Select all that apply</p>
              </div>
              <button onClick={goBack} className="text-xs text-[oklch(0.45_0.008_250)] hover:text-white transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {goals.map((goal) => {
                const Icon = goal.icon;
                const isSelected = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`text-left p-3.5 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? "bg-[oklch(0.55_0.12_155/10%)] border-[oklch(0.55_0.12_155/40%)]"
                        : "bg-[oklch(0.08_0.003_250)] border-[oklch(0.16_0.004_250)] hover:border-[oklch(0.55_0.12_155/25%)]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? "text-[oklch(0.55_0.12_155)]" : "text-[oklch(0.45_0.006_250)]"}`} />
                      <div>
                        <h4 className="text-xs font-semibold text-white leading-tight">{goal.label}</h4>
                        <p className="text-[10px] text-[oklch(0.45_0.006_250)] mt-0.5">{goal.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              onClick={goNext}
              disabled={selectedGoals.length === 0}
              className="btn-primary"
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* ─── Step 4: Equipment ─── */}
        {step === "equipment" && (
          <motion.div
            key="equipment"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-heading text-white">What equipment do you work with?</h3>
                <p className="text-xs text-[oklch(0.50_0.008_250)] mt-0.5">Select all that apply</p>
              </div>
              <button onClick={goBack} className="text-xs text-[oklch(0.45_0.008_250)] hover:text-white transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {equipmentTypes.map((eq) => {
                const Icon = eq.icon;
                const isSelected = selectedEquipment.includes(eq.id);
                return (
                  <button
                    key={eq.id}
                    onClick={() => toggleEquipment(eq.id)}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? "bg-[oklch(0.55_0.12_155/10%)] border-[oklch(0.55_0.12_155/40%)]"
                        : "bg-[oklch(0.08_0.003_250)] border-[oklch(0.16_0.004_250)] hover:border-[oklch(0.55_0.12_155/25%)]"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? "text-[oklch(0.55_0.12_155)]" : "text-[oklch(0.45_0.006_250)]"}`} />
                    <span className={`text-[10px] font-medium text-center leading-tight ${isSelected ? "text-white" : "text-[oklch(0.55_0.008_250)]"}`}>
                      {eq.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <Button
              onClick={goNext}
              className="btn-primary"
            >
              See My Recommendations <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* ─── Step 5: Recommendations ─── */}
        {step === "recommendation" && (
          <motion.div
            key="recommendation"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-heading text-white">Your Training Path</h3>
                <p className="text-xs text-[oklch(0.50_0.008_250)] mt-0.5">
                  Recommended courses based on your profile
                </p>
              </div>
              <button onClick={goBack} className="text-xs text-[oklch(0.45_0.008_250)] hover:text-white transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Adjust
              </button>
            </div>

            {/* Profile summary */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
              {selectedLevel && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono bg-[oklch(0.55_0.12_155/10%)] text-[oklch(0.55_0.12_155)] border border-[oklch(0.55_0.12_155/20%)]">
                  {experienceLevels.find(l => l.id === selectedLevel)?.label}
                </span>
              )}
              {selectedGoals.map((g) => (
                <span key={g} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono bg-[oklch(0.12_0.003_250)] text-[oklch(0.55_0.008_250)] border border-[oklch(0.16_0.004_250)]">
                  {goals.find(x => x.id === g)?.label}
                </span>
              ))}
            </div>

            <div className="grid gap-3 mb-6">
              {recs.map((course) => {
                const Icon = course.icon;
                return (
                  <Link
                    key={course.slug}
                    href={`/courses/${course.slug}`}
                    className="block p-4 rounded-xl bg-[oklch(0.08_0.003_250)] border border-[oklch(0.16_0.004_250)] hover:border-[oklch(0.55_0.12_155/30%)] hover:bg-[oklch(0.10_0.003_250)] transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[oklch(0.55_0.12_155/8%)] border border-[oklch(0.55_0.12_155/18%)] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5 text-[oklch(0.55_0.12_155)]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white group-hover:text-[oklch(0.75_0.12_155)] transition-colors">
                          {course.title}
                        </h4>
                        <p className="text-xs text-[oklch(0.50_0.008_250)] mt-0.5">{course.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[oklch(0.40_0.008_250)] group-hover:text-[oklch(0.55_0.12_155)] transition-colors shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/courses" className="text-sm text-[oklch(0.55_0.12_155)] hover:text-[oklch(0.65_0.12_155)] transition-colors">
                  Browse all courses →
                </Link>
                <span className="text-[oklch(0.25_0.006_250)]">|</span>
                <Link href="/labs?entry=onboarding&mode=practice#conveyor-troubleshoot" className="text-sm text-[oklch(0.55_0.12_155)] hover:text-[oklch(0.65_0.12_155)] transition-colors">
                  Diagnose your first fault →
                </Link>
              </div>
              <button
                onClick={() => {
                  // Save onboarding answers to localStorage for dashboard personalization
                  try {
                    localStorage.setItem("eas-onboarding", JSON.stringify({
                      experienceLevel: selectedLevel,
                      goals: selectedGoals,
                      equipment: selectedEquipment,
                      completedAt: Date.now(),
                    }));
                  } catch {}
                  onDismiss({ experienceLevel: selectedLevel, goals: selectedGoals, equipment: selectedEquipment });
                }}
                className="text-xs text-[oklch(0.40_0.008_250)] hover:text-white transition-colors"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
