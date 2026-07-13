/**
 * Lesson ILU strip — Track A guided path (Lesson → Practice → Troubleshoot → Assess).
 * Reads from lessonPracticeMap; compact industrial stepper (A2).
 */
import { Link } from "wouter";
import {
  BookOpen,
  ChevronRight,
  FlaskConical,
  GraduationCap,
  Wrench,
  ExternalLink,
  Clock,
} from "lucide-react";
import { getLessonIluStripData, type IluStripItem } from "@shared/iluLinks";
import type { IluStage } from "@shared/hubRegistry";
import { LESSON_ILU_STRIP_FOOTER } from "@shared/progressionCopy";
import { getLessonUnit } from "@shared/lessonPracticeMap";

const STAGE_ICONS: Partial<Record<IluStage, typeof BookOpen>> = {
  lesson: BookOpen,
  practice: FlaskConical,
  troubleshoot: Wrench,
  assess: GraduationCap,
};

export interface LessonIluStripProps {
  moduleSlug: string;
  lessonSlug: string;
  lessonCompleted?: boolean;
  lessonQuizPassed?: boolean;
  knowledgeCheckPassed?: boolean;
  scenarioPassed?: boolean;
}

function StepChip({ item }: { item: IluStripItem }) {
  const Icon = STAGE_ICONS[item.stage] ?? BookOpen;
  const isCurrent = item.status === "current";
  const isComplete = item.status === "complete";
  const isScaffold = item.status === "scaffold";
  const isClickable = Boolean(item.href) && !isCurrent;

  const baseClass =
    "flex items-center gap-2 min-w-0 rounded-md border px-2.5 py-2.5 min-h-[2.75rem] sm:min-h-0 sm:py-2 text-xs transition-colors sm:px-3 sm:text-sm";

  const stateClass = isCurrent
    ? "border-[oklch(0.55_0.12_155/45%)] bg-[oklch(0.55_0.12_155/8%)] text-white"
    : isComplete
      ? "border-[oklch(0.45_0.10_155/30%)] bg-[oklch(0.12_0.003_250)] text-[oklch(0.65_0.10_155)]"
      : isScaffold
        ? "border-[oklch(0.25_0.004_250)] bg-[oklch(0.10_0.003_250)] text-[oklch(0.45_0.006_250)]"
        : isClickable
          ? "border-[oklch(0.20_0.004_250)] bg-[oklch(0.10_0.003_250)] text-[oklch(0.72_0.008_250)] hover:border-[oklch(0.55_0.12_155/35%)] hover:text-white"
          : "border-[oklch(0.18_0.004_250)] bg-[oklch(0.08_0.003_250)] text-[oklch(0.45_0.006_250)]";

  const inner = (
    <>
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
      <span className="font-medium truncate">{item.label}</span>
      {isScaffold && (
        <span className="hidden sm:inline text-[10px] uppercase tracking-wide text-[oklch(0.45_0.006_250)]">
          Soon
        </span>
      )}
      {isClickable && item.isExternalLab && (
        <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
      )}
    </>
  );

  if (isClickable && item.href) {
    const isHashOnly = item.href.startsWith("#");
    if (isHashOnly) {
      return (
        <a href={item.href} className={`${baseClass} ${stateClass}`} title={item.title}>
          {inner}
        </a>
      );
    }
    return (
      <Link href={item.href} className={`${baseClass} ${stateClass}`} title={item.title}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={`${baseClass} ${stateClass}`} title={item.title} aria-current={isCurrent ? "step" : undefined}>
      {inner}
    </div>
  );
}

export default function LessonIluStrip({
  moduleSlug,
  lessonSlug,
  lessonCompleted = false,
  lessonQuizPassed = false,
  knowledgeCheckPassed = false,
  scenarioPassed = false,
}: LessonIluStripProps) {
  const data = getLessonIluStripData(moduleSlug, lessonSlug, {
    isOnLessonPage: true,
    lessonCompleted,
    knowledgeCheckPassed,
    lessonQuizPassed,
    scenarioPassed,
  });
  const unit = getLessonUnit(moduleSlug, lessonSlug);
  const isCardLesson = unit?.lessonFormat === "cards";

  if (!data.mapped || data.items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Learning path"
      className="mb-8 rounded-lg border border-[oklch(0.18_0.004_250)] bg-[oklch(0.09_0.003_250/80%)] p-3 sm:p-4"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-[oklch(0.50_0.008_250)]">
          Your path
        </p>
        {isCardLesson ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-[oklch(0.55_0.10_155)]">
            Slide lesson · {unit?.trackB.cards.estimatedCount} cards
          </span>
        ) : data.trackBCardCount != null ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-[oklch(0.42_0.006_250)]">
            <Clock className="h-3 w-3" />
            Card format planned ({data.trackBCardCount} cards)
          </span>
        ) : null}
      </div>

      {/* Desktop: horizontal stepper */}
      <div className="hidden sm:flex sm:items-center sm:gap-1">
        {data.items.map((item, idx) => (
          <div key={item.stage} className="flex min-w-0 flex-1 items-center gap-1">
            <StepChip item={item} />
            {idx < data.items.length - 1 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[oklch(0.30_0.004_250)]" aria-hidden />
            )}
          </div>
        ))}
      </div>

      {/* Mobile: 2-column grid */}
      <div className="grid grid-cols-2 gap-2 sm:hidden">
        {data.items.map((item) => (
          <StepChip key={item.stage} item={item} />
        ))}
      </div>

      <p className="mt-2.5 text-sm sm:text-[11px] leading-relaxed text-[oklch(0.42_0.006_250)]">
        {LESSON_ILU_STRIP_FOOTER}
      </p>
    </nav>
  );
}
