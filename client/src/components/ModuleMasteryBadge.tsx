/**
 * ModuleMasteryBadge - Shows ILU mastery progress for a module
 * Displays Theory/Quiz/Scenario completion stages with a "Mastered" state
 */
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, BookOpen, Brain, Cpu, Award } from "lucide-react";

interface MasteryStages {
  theory: { complete: boolean; completed: number; total: number };
  quiz: { complete: boolean };
  scenario: { complete: boolean; required: number };
}

interface ModuleMasteryBadgeProps {
  mastered: boolean;
  stages: MasteryStages;
  compact?: boolean;
}

export function ModuleMasteryBadge({ mastered, stages, compact = false }: ModuleMasteryBadgeProps) {
  if (compact) {
    return <CompactBadge mastered={mastered} stages={stages} />;
  }

  return (
    <div className="mt-3">
      {mastered ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[oklch(0.55_0.12_155/12%)] border border-[oklch(0.55_0.12_155/30%)]"
        >
          <Award className="w-4 h-4 text-[oklch(0.65_0.12_155)]" />
          <span className="text-xs font-semibold text-[oklch(0.65_0.12_155)] tracking-wide">
            MODULE MASTERED
          </span>
        </motion.div>
      ) : (
        <div className="flex items-center gap-2">
          <StageIndicator
            icon={BookOpen}
            label="Theory"
            complete={stages.theory.complete}
            detail={`${stages.theory.completed}/${stages.theory.total}`}
          />
          <StageIndicator
            icon={Brain}
            label="Quiz"
            complete={stages.quiz.complete}
          />
          {stages.scenario.required > 0 && (
            <StageIndicator
              icon={Cpu}
              label="Sim"
              complete={stages.scenario.complete}
            />
          )}
        </div>
      )}
    </div>
  );
}

function CompactBadge({ mastered, stages }: { mastered: boolean; stages: MasteryStages }) {
  if (mastered) {
    return (
      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-[oklch(0.55_0.12_155/15%)] border border-[oklch(0.55_0.12_155/30%)]">
        <Award className="w-3 h-3 text-[oklch(0.65_0.12_155)]" />
        <span className="text-[10px] font-bold text-[oklch(0.65_0.12_155)] tracking-wider">
          MASTERED
        </span>
      </div>
    );
  }

  // Show progress dots
  const stagesCompleted = [
    stages.theory.complete,
    stages.quiz.complete,
    stages.scenario.required > 0 ? stages.scenario.complete : null,
  ].filter(s => s !== null);

  const completedCount = stagesCompleted.filter(Boolean).length;
  const totalStages = stagesCompleted.length;

  if (completedCount === 0) return null;

  return (
    <div className="absolute top-4 right-4 flex items-center gap-1">
      {stagesCompleted.map((complete, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            complete
              ? "bg-[oklch(0.55_0.12_155)]"
              : "bg-[oklch(0.25_0.004_250)]"
          }`}
        />
      ))}
    </div>
  );
}

function StageIndicator({
  icon: Icon,
  label,
  complete,
  detail,
}: {
  icon: any;
  label: string;
  complete: boolean;
  detail?: string;
}) {
  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium ${
        complete
          ? "bg-[oklch(0.55_0.12_155/10%)] text-[oklch(0.60_0.10_155)] border border-[oklch(0.55_0.12_155/20%)]"
          : "bg-[oklch(0.12_0.003_250)] text-[oklch(0.40_0.006_250)] border border-[oklch(0.18_0.004_250)]"
      }`}
    >
      {complete ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <Icon className="w-3 h-3" />
      )}
      <span>{label}</span>
      {detail && <span className="opacity-70">({detail})</span>}
    </div>
  );
}

/**
 * ModuleMasteryOverview - Full mastery dashboard for all modules
 * Used on the Learning Path or a dedicated mastery page
 */
export function ModuleMasteryOverview({ masteryData }: { masteryData: any[] }) {
  const masteredCount = masteryData.filter(m => m.mastered).length;
  const totalModules = masteryData.length;

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-heading text-white tracking-wide">
            Module Mastery Progress
          </h3>
          <p className="text-sm text-[oklch(0.50_0.008_250)]">
            Complete all ILU stages (Theory + Quiz + Simulation) to master a module
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-heading text-[oklch(0.55_0.12_155)]">
            {masteredCount}/{totalModules}
          </div>
          <div className="text-xs text-[oklch(0.45_0.006_250)]">Modules Mastered</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-[oklch(0.12_0.003_250)] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${totalModules > 0 ? (masteredCount / totalModules) * 100 : 0}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-[oklch(0.45_0.12_155)] to-[oklch(0.55_0.12_155)]"
        />
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {masteryData.map((mod) => (
          <div
            key={mod.moduleId}
            className={`p-4 rounded-lg border transition-all ${
              mod.mastered
                ? "bg-[oklch(0.55_0.12_155/5%)] border-[oklch(0.55_0.12_155/25%)]"
                : "bg-[oklch(0.08_0.003_250)] border-[oklch(0.18_0.004_250)]"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-sm font-medium text-white line-clamp-1">{mod.moduleTitle}</h4>
              {mod.mastered && <Award className="w-4 h-4 text-[oklch(0.65_0.12_155)] flex-shrink-0 ml-2" />}
            </div>
            <ModuleMasteryBadge mastered={mod.mastered} stages={mod.stages} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ModuleMasteryBadge;
