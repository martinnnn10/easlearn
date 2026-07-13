/**
 * ScenarioDifficultyProgression - Shows difficulty variant progression per scenario
 * 
 * For each scenario, shows which difficulty variants (beginner/intermediate/advanced)
 * have been completed. Encourages users to progress through all difficulty levels.
 * 
 * Uses the SCENARIO_VARIANTS registry and scenarioCompletions history.
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { SCENARIO_VARIANTS } from "@/lib/scenarioModular";
import {
  Shield, Zap, Flame, ChevronRight, CheckCircle2, Lock, TrendingUp, Award
} from "lucide-react";

// Map actual scenario IDs to SCENARIO_VARIANTS keys
const SCENARIO_ID_TO_VARIANT_KEY: Record<string, string> = {
  "vfd-conveyor-multifault-v3": "conveyor-multi-fault-v3",
  "vfd-overcurrent-ramp-v3": "vfd-overcurrent-v3",
  "vfd-dc-bus-undervoltage-v3": "vfd-undervoltage-v3",
  "vfd-ground-fault-cable-v3": "vfd-ground-fault-v3",
  "vfd-cooling-fan-seized-v3": "vfd-cooling-fan-v3",
  "vfd-input-phase-loss-v3": "vfd-phase-loss-v3",
  "blown-control-fuse": "blown-fuse-v3",
  "failed-safety-relay": "failed-relay-v3",
  "plc-io-fault-v3": "plc-io-fault-v3",
  "motor-overload-trip-v3": "motor-overload-trip-v3",
  "comm-loss-v3": "comm-loss-v3",
  "intermittent-ground-fault-v3": "intermittent-ground-fault-v3",
};

// Friendly scenario names for display
const SCENARIO_DISPLAY_NAMES: Record<string, string> = {
  "vfd-conveyor-multifault-v3": "Multi-Fault Conveyor",
  "vfd-overcurrent-ramp-v3": "VFD Overcurrent",
  "vfd-dc-bus-undervoltage-v3": "VFD Undervoltage",
  "vfd-ground-fault-cable-v3": "VFD Ground Fault",
  "vfd-cooling-fan-seized-v3": "VFD Cooling Fan",
  "vfd-input-phase-loss-v3": "VFD Phase Loss",
  "blown-control-fuse": "Blown Control Fuse",
  "failed-safety-relay": "Failed Safety Relay",
  "plc-io-fault-v3": "PLC I/O Fault",
  "motor-overload-trip-v3": "Motor Overload Trip",
  "comm-loss-v3": "Communication Loss",
  "intermittent-ground-fault-v3": "Intermittent Ground Fault",
};

// Group scenarios by category for module-level display
const SCENARIO_CATEGORIES: Record<string, { label: string; scenarioIds: string[] }> = {
  vfd: {
    label: "VFD Troubleshooting",
    scenarioIds: [
      "vfd-overcurrent-ramp-v3",
      "vfd-dc-bus-undervoltage-v3",
      "vfd-ground-fault-cable-v3",
      "vfd-cooling-fan-seized-v3",
      "vfd-input-phase-loss-v3",
    ],
  },
  electrical: {
    label: "Electrical Systems",
    scenarioIds: [
      "blown-control-fuse",
      "failed-safety-relay",
      "intermittent-ground-fault-v3",
    ],
  },
  plc: {
    label: "PLC & Controls",
    scenarioIds: [
      "plc-io-fault-v3",
      "comm-loss-v3",
    ],
  },
  motors: {
    label: "Motors & Drives",
    scenarioIds: [
      "motor-overload-trip-v3",
      "vfd-conveyor-multifault-v3",
    ],
  },
};

const DIFFICULTY_CONFIG = {
  beginner: { label: "Beginner", icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", ring: "ring-emerald-500/30" },
  intermediate: { label: "Intermediate", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", ring: "ring-amber-500/30" },
  advanced: { label: "Advanced", icon: Flame, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", ring: "ring-red-500/30" },
};

interface DifficultyProgressionProps {
  /** Show only a specific category, or all */
  category?: string;
  /** Compact mode for embedding in other panels */
  compact?: boolean;
}

export default function ScenarioDifficultyProgression({ category, compact = false }: DifficultyProgressionProps) {
  const { isAuthenticated } = useAuth();
  const { data: history, isLoading } = trpc.scenarioProgression.getHistory.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Build a map of completed difficulty variants per scenario
  const completionMap = useMemo(() => {
    if (!history) return new Map<string, Set<string>>();
    const map = new Map<string, Set<string>>();
    
    for (const completion of history) {
      const slug = completion.scenarioSlug;
      if (!map.has(slug)) map.set(slug, new Set());
      // The faultVariant field tells us which variant was played
      if (completion.faultVariant) {
        map.get(slug)!.add(completion.faultVariant);
      }
      // Also track by difficulty modifier
      if (completion.difficultyModifier) {
        map.get(slug)!.add(`mod:${completion.difficultyModifier}`);
      }
      // Track the difficulty level itself
      if (completion.difficulty) {
        map.get(slug)!.add(`diff:${completion.difficulty}`);
      }
    }
    return map;
  }, [history]);

  // Get difficulty variants completed for a scenario
  const getVariantProgress = (scenarioId: string) => {
    const variantKey = SCENARIO_ID_TO_VARIANT_KEY[scenarioId];
    const config = variantKey ? SCENARIO_VARIANTS[variantKey] : null;
    const completions = completionMap.get(scenarioId) || new Set();
    const hasAnyCompletion = completions.size > 0;

    if (!config) {
      return {
        beginner: hasAnyCompletion,
        intermediate: false,
        advanced: false,
        variants: [],
      };
    }

    // Check which difficulty levels have been completed
    const beginnerVariants = config.faultVariants.filter(v => v.difficulty === "beginner");
    const intermediateVariants = config.faultVariants.filter(v => v.difficulty === "intermediate");
    const advancedVariants = config.faultVariants.filter(v => v.difficulty === "advanced");

    const beginnerDone = beginnerVariants.length > 0
      ? beginnerVariants.some(v => completions.has(v.id))
      : completions.has("diff:beginner") || hasAnyCompletion;
    
    const intermediateDone = intermediateVariants.length > 0
      ? intermediateVariants.some(v => completions.has(v.id))
      : completions.has("diff:intermediate");
    
    const advancedDone = advancedVariants.length > 0
      ? advancedVariants.some(v => completions.has(v.id))
      : completions.has("diff:advanced");

    return {
      beginner: beginnerDone,
      intermediate: intermediateDone,
      advanced: advancedDone,
      variants: config.faultVariants,
    };
  };

  if (!isAuthenticated || isLoading) return null;

  const categories = category
    ? { [category]: SCENARIO_CATEGORIES[category] }
    : SCENARIO_CATEGORIES;

  // Calculate overall stats
  const allScenarioIds = Object.values(categories).flatMap(c => c?.scenarioIds || []);
  const totalVariants = allScenarioIds.length * 3; // 3 difficulty levels per scenario
  const completedVariants = allScenarioIds.reduce((sum, id) => {
    const progress = getVariantProgress(id);
    return sum + (progress.beginner ? 1 : 0) + (progress.intermediate ? 1 : 0) + (progress.advanced ? 1 : 0);
  }, 0);

  if (compact) {
    return (
      <div className="rounded-lg border border-[oklch(0.15_0.004_250)] bg-[oklch(0.09_0.003_250)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
          <span className="text-xs font-heading text-white tracking-wide">DIFFICULTY PROGRESSION</span>
          <span className="ml-auto text-[10px] font-mono text-[oklch(0.45_0.006_250)]">
            {completedVariants}/{totalVariants}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[oklch(0.12_0.003_250)] overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all"
            style={{ width: `${totalVariants > 0 ? (completedVariants / totalVariants) * 100 : 0}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {(["beginner", "intermediate", "advanced"] as const).map(diff => {
            const config = DIFFICULTY_CONFIG[diff];
            const count = allScenarioIds.filter(id => getVariantProgress(id)[diff]).length;
            return (
              <div key={diff} className={`px-2 py-1.5 rounded ${config.bg} ${config.border} border`}>
                <div className={`text-sm font-mono font-bold ${config.color}`}>{count}</div>
                <div className="text-[9px] text-[oklch(0.45_0.006_250)] uppercase tracking-wider">{config.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/10 via-amber-500/10 to-red-500/10 border border-[oklch(0.20_0.006_250)] flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[oklch(0.55_0.12_155)]" />
          </div>
          <div>
            <h3 className="text-base font-heading text-white tracking-wide">
              Difficulty Progression
            </h3>
            <p className="text-xs text-[oklch(0.45_0.006_250)]">
              Complete scenarios at increasing difficulty levels
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-mono font-bold text-white">{completedVariants}<span className="text-[oklch(0.35_0.006_250)]">/{totalVariants}</span></div>
          <div className="text-[10px] text-[oklch(0.40_0.006_250)] uppercase tracking-wider">Variants Done</div>
        </div>
      </div>

      {/* Category sections */}
      {Object.entries(categories).map(([key, cat]) => {
        if (!cat) return null;
        return (
          <div key={key} className="space-y-3">
            <h4 className="text-xs font-mono text-[oklch(0.50_0.008_250)] uppercase tracking-wider border-b border-[oklch(0.14_0.004_250)] pb-2">
              {cat.label}
            </h4>
            <div className="space-y-2">
              {cat.scenarioIds.map((scenarioId, idx) => {
                const progress = getVariantProgress(scenarioId);
                const allDone = progress.beginner && progress.intermediate && progress.advanced;
                
                return (
                  <motion.div
                    key={scenarioId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      allDone
                        ? "bg-[oklch(0.55_0.12_155/5%)] border-[oklch(0.55_0.12_155/20%)]"
                        : "bg-[oklch(0.08_0.003_250)] border-[oklch(0.14_0.004_250)]"
                    }`}
                  >
                    {/* Scenario name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white font-medium truncate">
                          {SCENARIO_DISPLAY_NAMES[scenarioId] || scenarioId}
                        </span>
                        {allDone && <Award className="w-3.5 h-3.5 text-[oklch(0.55_0.12_155)] shrink-0" />}
                      </div>
                    </div>

                    {/* Difficulty level indicators */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(["beginner", "intermediate", "advanced"] as const).map((diff, i) => {
                        const config = DIFFICULTY_CONFIG[diff];
                        const done = progress[diff];
                        const Icon = config.icon;
                        
                        return (
                          <div key={diff} className="flex items-center">
                            <div
                              className={`w-7 h-7 rounded-md flex items-center justify-center border transition-all ${
                                done
                                  ? `${config.bg} ${config.border}`
                                  : "bg-[oklch(0.10_0.003_250)] border-[oklch(0.18_0.004_250)]"
                              }`}
                              title={`${config.label}: ${done ? "Completed" : "Not completed"}`}
                            >
                              {done ? (
                                <CheckCircle2 className={`w-3.5 h-3.5 ${config.color}`} />
                              ) : (
                                <Icon className="w-3.5 h-3.5 text-[oklch(0.30_0.006_250)]" />
                              )}
                            </div>
                            {i < 2 && (
                              <ChevronRight className="w-3 h-3 text-[oklch(0.20_0.004_250)] mx-0.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex items-center gap-4 pt-2 border-t border-[oklch(0.14_0.004_250)]">
        {(["beginner", "intermediate", "advanced"] as const).map(diff => {
          const config = DIFFICULTY_CONFIG[diff];
          const Icon = config.icon;
          return (
            <div key={diff} className="flex items-center gap-1.5">
              <Icon className={`w-3 h-3 ${config.color}`} />
              <span className="text-[10px] text-[oklch(0.45_0.006_250)]">{config.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
