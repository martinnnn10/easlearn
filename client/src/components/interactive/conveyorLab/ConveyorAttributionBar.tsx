import { Link } from "wouter";
import { ArrowLeft, BookOpen, Cpu } from "lucide-react";
import type { ConveyorLabAttribution } from "@shared/conveyorLabAttribution";
import { getHubBackHref, getLessonBackHref } from "@shared/conveyorLabAttribution";

interface ConveyorAttributionBarProps {
  attribution: ConveyorLabAttribution;
}

export default function ConveyorAttributionBar({ attribution }: ConveyorAttributionBarProps) {
  const hubHref = attribution.hub ? getHubBackHref(attribution.hub) : null;
  const lessonHref =
    attribution.module ? getLessonBackHref(attribution.module, attribution.lesson) : null;

  if (!hubHref && !lessonHref) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-[oklch(0.14_0.004_250)]">
      {hubHref && attribution.hub === "plc" && (
        <Link
          href={hubHref}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono rounded-md border border-[oklch(0.30_0.06_250/40%)] text-[oklch(0.60_0.08_250)] hover:text-white hover:border-[oklch(0.55_0.12_250/50%)] transition-colors"
        >
          <Cpu className="w-3 h-3" />
          Back to PLC Hub
        </Link>
      )}
      {hubHref && attribution.hub && attribution.hub !== "plc" && (
        <Link
          href={hubHref}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono rounded-md border border-[oklch(0.25_0.004_250)] text-[oklch(0.55_0.008_250)] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to hub
        </Link>
      )}
      {lessonHref && (
        <Link
          href={lessonHref}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono rounded-md border border-[oklch(0.55_0.12_155/30%)] text-[oklch(0.65_0.10_155)] hover:text-white hover:border-[oklch(0.55_0.12_155/50%)] transition-colors"
        >
          <BookOpen className="w-3 h-3" />
          Back to lesson
        </Link>
      )}
      {attribution.ilu && (
        <span className="text-[10px] font-mono text-[oklch(0.40_0.006_250)] ml-auto">
          ILU: {attribution.ilu.replace(/_/g, " ")}
        </span>
      )}
    </div>
  );
}
