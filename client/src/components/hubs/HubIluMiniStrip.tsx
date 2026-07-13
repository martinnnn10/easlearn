/**
 * Compact ILU chain for hub lesson cards (Track A).
 */
import { Link } from "wouter";
import { BookOpen, ChevronRight, FlaskConical, GraduationCap, Wrench } from "lucide-react";
import type { IluStage } from "@shared/hubRegistry";
import type { IluStripItem } from "@shared/iluLinks";

const STAGE_ICONS: Partial<Record<IluStage, typeof BookOpen>> = {
  lesson: BookOpen,
  practice: FlaskConical,
  troubleshoot: Wrench,
  assess: GraduationCap,
};

interface HubIluMiniStripProps {
  items: IluStripItem[];
}

export default function HubIluMiniStrip({ items }: HubIluMiniStripProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1" aria-label="Learning unit chain">
      {items.map((item, idx) => {
        const Icon = STAGE_ICONS[item.stage] ?? BookOpen;
        const isScaffold = item.status === "scaffold";
        const isClickable = Boolean(item.href) && !isScaffold;

        const chip = (
          <span
            className={`inline-flex items-center gap-1 rounded border px-2.5 py-2 min-h-[2.75rem] text-xs sm:px-2 sm:py-0.5 sm:min-h-0 sm:text-[10px] font-mono ${
              isScaffold
                ? "border-[oklch(0.22_0.004_250)] text-[oklch(0.42_0.006_250)]"
                : isClickable
                  ? "border-[oklch(0.35_0.08_155/40%)] text-[oklch(0.65_0.10_155)] hover:border-[oklch(0.55_0.12_155/50%)] hover:text-white"
                  : "border-[oklch(0.20_0.004_250)] text-[oklch(0.50_0.008_250)]"
            }`}
            title={item.title}
          >
            <Icon className="h-3 w-3 shrink-0 opacity-70" />
            {item.label}
            {isScaffold && <span className="opacity-60">· soon</span>}
          </span>
        );

        return (
          <span key={item.stage} className="inline-flex items-center gap-1">
            {isClickable && item.href ? (
              <Link href={item.href}>{chip}</Link>
            ) : (
              chip
            )}
            {idx < items.length - 1 && (
              <ChevronRight className="h-3 w-3 text-[oklch(0.30_0.004_250)]" aria-hidden />
            )}
          </span>
        );
      })}
    </div>
  );
}
