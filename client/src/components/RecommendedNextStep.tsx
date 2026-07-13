/**
 * RecommendedNextStep — Server-driven personalized next step widget for Dashboard.
 * Shows the next ILU stage (Theory → Lab → Simulation → Assessment) to complete per module.
 * Combines course, simulator, and lab recommendations into a single actionable card.
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowRight, BookOpen, Zap, Cpu, Sparkles, Target,
  FlaskConical, Monitor, GraduationCap, CheckCircle2
} from "lucide-react";

const difficultyConfig: Record<string, { label: string; color: string }> = {
  beginner: { label: "Beginner", color: "text-emerald-400" },
  intermediate: { label: "Intermediate", color: "text-amber-400" },
  advanced: { label: "Advanced", color: "text-red-400" },
};

// ILU stage definitions for the progression indicator
const ILU_STAGES = [
  { key: "theory", label: "Theory", icon: BookOpen },
  { key: "lab", label: "Lab", icon: FlaskConical },
  { key: "simulation", label: "Simulation", icon: Monitor },
  { key: "assessment", label: "Assessment", icon: GraduationCap },
] as const;

export default function RecommendedNextStep() {
  const { isAuthenticated } = useAuth();

  // Server-driven simulator recommendation
  const { data: simRec } = trpc.scenarioProgression.getRecommendation.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Dashboard data for course progress
  const { data: dashboard } = trpc.courses.getDashboard.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Module mastery data for ILU stage tracking
  const { data: masteryData } = trpc.certification.getAllModuleMastery.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return null;

  // Determine best next step across courses, simulator, and labs
  const hasNextLesson = dashboard?.nextLesson;
  const hasSimRec = simRec?.recommended;
  const hasIncompleteCourses = dashboard?.modules?.some((m: any) => m.percentage > 0 && m.percentage < 100);

  // If no actionable recommendations, don't render
  if (!hasNextLesson && !hasSimRec && !hasIncompleteCourses) return null;

  // Find the current ILU stage for the active module
  const getCurrentILUStage = () => {
    if (!masteryData || !dashboard?.nextLesson) return null;
    const nl = dashboard.nextLesson as unknown as { moduleSlug: string; moduleName: string };
    const moduleMastery = (masteryData as any[])?.find((m: any) => m.moduleSlug === nl.moduleSlug);
    if (!moduleMastery) return { stage: "theory", index: 0, moduleName: nl.moduleName };

    // Determine which stage they're on based on completion
    if (!moduleMastery.stages?.theory) return { stage: "theory", index: 0, moduleName: nl.moduleName };
    if (!moduleMastery.stages?.lab) return { stage: "lab", index: 1, moduleName: nl.moduleName };
    if (!moduleMastery.stages?.simulation) return { stage: "simulation", index: 2, moduleName: nl.moduleName };
    if (!moduleMastery.stages?.assessment) return { stage: "assessment", index: 3, moduleName: nl.moduleName };
    return null; // All complete
  };

  const currentILU = getCurrentILUStage();

  // Build recommendation items
  const items: Array<{
    type: "course" | "simulator" | "lab";
    icon: typeof BookOpen;
    label: string;
    title: string;
    subtitle: string;
    href: string;
    accent: string;
    iluStage?: string;
  }> = [];

  // 1. Continue current lesson (highest priority)
  if (hasNextLesson) {
    const nl = dashboard!.nextLesson as unknown as { moduleSlug: string; moduleName: string; lessonSlug: string; lessonTitle: string };
    items.push({
      type: "course",
      icon: BookOpen,
      label: "Continue Course",
      title: nl.lessonTitle,
      subtitle: nl.moduleName,
      href: `/courses/${nl.moduleSlug}/${nl.lessonSlug}`,
      accent: "oklch(0.55_0.12_155)",
      iluStage: currentILU?.stage === "theory" ? "Theory Stage" : undefined,
    });
  }

  // 2. Simulator recommendation
  if (hasSimRec) {
    const rec = simRec!.recommended!;
    const diff = difficultyConfig[rec.difficulty] || difficultyConfig.beginner;
    items.push({
      type: "simulator",
      icon: Zap,
      label: "Next Scenario",
      title: rec.title,
      subtitle: `${diff.label} difficulty`,
      href: `/simulator?scenario=${rec.slug}`,
      accent: "oklch(0.60_0.15_80)",
      iluStage: "Simulation Stage",
    });
  }

  // 3. Labs suggestion (if they have course progress but haven't tried labs)
  if (dashboard && dashboard.completedLessons > 3 && items.length < 3) {
    items.push({
      type: "lab",
      icon: Cpu,
      label: "Try a Lab",
      title: "Interactive Labs",
      subtitle: "Hands-on practice with virtual equipment",
      href: "/labs",
      accent: "oklch(0.55_0.15_250)",
      iluStage: "Lab Stage",
    });
  }

  // Show max 3 items
  const displayItems = items.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-md bg-[oklch(0.55_0.12_155/10%)] border border-[oklch(0.55_0.12_155/25%)] flex items-center justify-center">
          <Target className="w-3.5 h-3.5 text-[oklch(0.55_0.12_155)]" />
        </div>
        <h3 className="text-sm font-heading text-white tracking-wide">Recommended Next Steps</h3>
      </div>

      {/* ILU Stage Indicator (when we know which stage user is on) */}
      {currentILU && (
        <div className="mb-4 p-3 rounded-lg border border-[oklch(0.14_0.004_250)] bg-[oklch(0.07_0.003_250)]">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase tracking-wider">
              Learning Path — {currentILU.moduleName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {ILU_STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isComplete = idx < currentILU.index;
              const isCurrent = idx === currentILU.index;
              return (
                <div key={stage.key} className="flex items-center">
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono transition-all ${
                      isComplete
                        ? "bg-[oklch(0.55_0.12_155/12%)] text-[oklch(0.55_0.12_155)]"
                        : isCurrent
                        ? "bg-[oklch(0.55_0.12_155/8%)] text-white border border-[oklch(0.55_0.12_155/30%)]"
                        : "text-[oklch(0.30_0.006_250)]"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                    <span className="hidden sm:inline">{stage.label}</span>
                  </div>
                  {idx < ILU_STAGES.length - 1 && (
                    <div className={`w-3 h-px mx-0.5 ${idx < currentILU.index ? "bg-[oklch(0.55_0.12_155/50%)]" : "bg-[oklch(0.18_0.004_250)]"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={`grid gap-3 ${displayItems.length === 1 ? "" : displayItems.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {displayItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link key={item.type} href={item.href}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="p-4 rounded-xl border border-[oklch(0.16_0.004_250)] bg-[oklch(0.08_0.003_250)] hover:border-[oklch(0.55_0.12_155/35%)] hover:bg-[oklch(0.09_0.003_250)] transition-all cursor-pointer group h-full"
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center border"
                    style={{
                      backgroundColor: `color-mix(in oklch, ${item.accent}, transparent 92%)`,
                      borderColor: `color-mix(in oklch, ${item.accent}, transparent 75%)`,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: item.accent }} />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: item.accent }}>
                    {item.label}
                  </span>
                  {i === 0 && (
                    <span className="ml-auto flex items-center gap-1 text-[9px] font-mono text-[oklch(0.55_0.12_155)] bg-[oklch(0.55_0.12_155/8%)] px-1.5 py-0.5 rounded-full">
                      <Sparkles className="w-2.5 h-2.5" />
                      Top Pick
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-medium text-white mb-1 group-hover:text-[oklch(0.75_0.12_155)] transition-colors leading-snug">
                  {item.title}
                </h4>
                <p className="text-[11px] text-[oklch(0.45_0.006_250)]">{item.subtitle}</p>
                {item.iluStage && (
                  <span className="inline-block mt-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-[oklch(0.12_0.003_250)] text-[oklch(0.50_0.008_250)] border border-[oklch(0.18_0.004_250)]">
                    {item.iluStage}
                  </span>
                )}
                <div className="flex items-center gap-1 mt-3 text-[11px] text-[oklch(0.45_0.006_250)] group-hover:text-[oklch(0.55_0.12_155)] transition-colors">
                  Start now
                  <ArrowRight className="w-3 h-3" />
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
