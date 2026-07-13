/**
 * Hub lesson row — ILU chain + lesson / lab CTAs.
 */
import { useMemo } from "react";
import { Link } from "wouter";
import { ArrowRight, BookOpen } from "lucide-react";
import type { HubId, LessonUnit } from "@shared/hubRegistry";
import { buildTrackAStripItems } from "@shared/iluLinks";
import { courseLessonRoute } from "@shared/hubRegistry";
import { trpc } from "@/lib/trpc";
import HubIluMiniStrip from "./HubIluMiniStrip";

interface HubLessonCardProps {
  moduleSlug: string;
  unit: LessonUnit;
  hubId: HubId;
}

export default function HubLessonCard({ moduleSlug, unit, hubId }: HubLessonCardProps) {
  const lessonHref = courseLessonRoute(moduleSlug, unit.lessonSlug);
  const { data: iluStatus } = trpc.hubs.getIluStatus.useQuery({
    moduleSlug,
    lessonSlug: unit.lessonSlug,
  });

  const stripItems = useMemo(() => {
    const items = buildTrackAStripItems(
      unit.iluLinks,
      { moduleSlug, lessonSlug: unit.lessonSlug, hubId },
      { lessonCompleted: false }
    );
    if (!iluStatus?.mapped) return items;
    return items.map((item) => {
      const stage = iluStatus.stages.find((s) => s.stage === item.stage);
      return stage ? { ...item, status: stage.status } : item;
    });
  }, [unit.iluLinks, moduleSlug, unit.lessonSlug, hubId, iluStatus]);

  const practiceLink = stripItems.find((i) => i.stage === "practice");
  const troubleshootLink = stripItems.find((i) => i.stage === "troubleshoot");

  return (
    <article className="card-panel p-4 sm:p-5 hover:border-[oklch(0.55_0.12_155/20%)] transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <span className="text-[10px] font-mono text-[oklch(0.45_0.006_250)]">
            Lesson {unit.orderIndex}
          </span>
          <h3 className="text-sm sm:text-base font-semibold text-white leading-snug mt-0.5">
            {unit.lessonTitle}
          </h3>
        </div>
        <Link
          href={lessonHref}
          className="inline-flex items-center gap-1.5 shrink-0 px-3 py-2.5 min-h-[2.75rem] text-sm sm:text-xs font-medium rounded-md border border-[oklch(0.55_0.12_155/35%)] text-[oklch(0.75_0.12_155)] hover:bg-[oklch(0.55_0.12_155/8%)] transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Open lesson
        </Link>
      </div>

      <HubIluMiniStrip items={stripItems} />

      <div className="mt-3 flex flex-wrap gap-2">
        {troubleshootLink?.href && troubleshootLink.status !== "scaffold" && (
          <Link
            href={troubleshootLink.href}
            className="inline-flex items-center gap-1 text-xs sm:text-[10px] font-mono px-3 py-2 min-h-[2.75rem] rounded border border-[oklch(0.30_0.06_250/40%)] text-[oklch(0.60_0.08_250)] hover:text-white transition-colors"
          >
            {troubleshootLink.title}
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
        {practiceLink?.href && (
          <Link
            href={practiceLink.href}
            className="inline-flex items-center gap-1 text-xs sm:text-[10px] font-mono px-3 py-2 min-h-[2.75rem] rounded border border-[oklch(0.25_0.004_250)] text-[oklch(0.55_0.008_250)] hover:text-white transition-colors"
          >
            {practiceLink.title}
          </Link>
        )}
      </div>
    </article>
  );
}
