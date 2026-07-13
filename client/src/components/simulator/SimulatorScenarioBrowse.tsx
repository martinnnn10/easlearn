/**
 * Category-organized simulator browse panel.
 */
import { Lock, Clock, Wrench, ChevronRight, Sparkles } from "lucide-react";
import {
  CATEGORY_META,
  getBrowsableCatalog,
  getFeaturedCatalog,
  getCatalogByCategory,
  getOrderedCategories,
  type SimulatorCatalogEntry,
} from "@shared/simulatorCatalog";

const difficultyColors: Record<string, string> = {
  Beginner: "text-[oklch(0.55_0.12_155)]",
  Intermediate: "text-[oklch(0.75_0.12_75)]",
  Advanced: "text-[oklch(0.65_0.18_25)]",
  Adaptive: "text-[oklch(0.55_0.12_155)]",
};

function StatusBadge({ entry }: { entry: SimulatorCatalogEntry }) {
  if (entry.status === "coming_soon") {
    return (
      <span className="font-mono-industrial text-[9px] px-2 py-0.5 rounded bg-[oklch(0.25_0.006_250)] border border-[oklch(0.30_0.006_250)] text-[oklch(0.55_0.008_250)]">
        COMING SOON
      </span>
    );
  }
  if (entry.status === "beta") {
    return (
      <span className="font-mono-industrial text-[9px] px-2 py-0.5 rounded bg-[oklch(0.75_0.12_75/8%)] border border-[oklch(0.75_0.12_75/25%)] text-[oklch(0.75_0.12_75)]">
        BETA
      </span>
    );
  }
  return null;
}

function SimulatorCard({
  entry,
  active,
  locked,
  bestScore,
  onSelect,
}: {
  entry: SimulatorCatalogEntry;
  active: boolean;
  locked: boolean;
  bestScore?: number;
  onSelect: (id: string) => void;
}) {
  const clickable = entry.clickable && !locked;

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={() => clickable && onSelect(entry.id)}
      className={`scenario-card w-full min-w-[260px] lg:min-w-0 shrink-0 snap-start text-left p-4 touch-manipulation ${
        active ? "active" : ""
      } ${!clickable ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
      aria-disabled={!clickable}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className={`font-mono-industrial text-[10px] tracking-wider ${difficultyColors[entry.difficulty] ?? difficultyColors.Adaptive}`}>
          {entry.difficulty.toUpperCase()}
        </span>
        <div className="flex items-center gap-1.5">
          <StatusBadge entry={entry} />
          <span className="font-mono-industrial text-[10px] text-[oklch(0.45_0.006_250)] flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {entry.duration}
          </span>
        </div>
      </div>
      <h3 className="text-[14px] font-semibold text-[oklch(0.88_0.005_250)] mb-1 leading-tight">{entry.title}</h3>
      <p className="text-[11px] text-[oklch(0.50_0.008_250)] mb-2 line-clamp-2">{entry.equipmentType}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        {entry.skills.slice(0, 2).map((skill) => (
          <span key={skill} className="text-[10px] px-1.5 py-0.5 rounded bg-[oklch(0.10_0.003_250)] text-[oklch(0.55_0.008_250)]">
            {skill}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[oklch(0.45_0.006_250)] flex items-center gap-1">
          <Wrench className="w-3 h-3" />
          {entry.scenarioType}
        </span>
        {locked ? (
          <span className="font-mono-industrial text-[9px] px-2 py-0.5 rounded bg-[oklch(0.75_0.12_75/8%)] border border-[oklch(0.75_0.12_75/20%)] text-[oklch(0.75_0.12_75)] flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" /> PRO
          </span>
        ) : bestScore != null ? (
          <span className="font-mono-industrial text-[9px] px-2 py-0.5 rounded bg-[oklch(0.55_0.12_155/10%)] border border-[oklch(0.55_0.12_155/25%)] text-[oklch(0.55_0.12_155)]">
            BEST: {bestScore}%
          </span>
        ) : entry.clickable ? (
          <ChevronRight className="w-4 h-4 text-[oklch(0.45_0.006_250)]" />
        ) : null}
      </div>
    </button>
  );
}

export interface SimulatorScenarioBrowseProps {
  activeId: string;
  isScenarioLocked: (entry: SimulatorCatalogEntry, indexAmongPaid: number) => boolean;
  getBestScore: (id: string) => number | undefined;
  onSelect: (id: string) => void;
  listRef?: React.RefObject<HTMLDivElement | null>;
}

export default function SimulatorScenarioBrowse({
  activeId,
  isScenarioLocked,
  getBestScore,
  onSelect,
  listRef,
}: SimulatorScenarioBrowseProps) {
  const featured = getFeaturedCatalog();
  const categories = getOrderedCategories();
  const browsable = getBrowsableCatalog();
  const paidIndexById = new Map(
    browsable.filter((e) => e.clickable && e.engine !== "lab").map((e, i) => [e.id, i])
  );

  const lockFor = (entry: SimulatorCatalogEntry) => {
    const idx = paidIndexById.get(entry.id) ?? 0;
    return isScenarioLocked(entry, idx);
  };

  return (
    <div className="space-y-8">
      {/* Featured */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[oklch(0.75_0.12_75)]" />
          <span className="font-mono-industrial text-[11px] text-[oklch(0.75_0.12_75)] tracking-wider">
            FEATURED DIAGNOSTIC CHALLENGES
          </span>
        </div>
        <div
          className="flex lg:grid lg:grid-cols-2 gap-2.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 snap-x snap-proximity lg:snap-none scrollbar-industrial"
          style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
        >
          {featured.map((entry) => (
            <SimulatorCard
              key={entry.id}
              entry={entry}
              active={activeId === entry.id}
              locked={lockFor(entry)}
              bestScore={getBestScore(entry.id)}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>

      {/* Categories */}
      <div
        ref={listRef}
        className="space-y-6 max-h-none lg:max-h-[58vh] lg:overflow-y-auto lg:pr-1 scrollbar-industrial"
      >
        {categories.map((cat) => {
          const items = getCatalogByCategory(cat);
          if (items.length === 0) return null;
          const meta = CATEGORY_META[cat];
          return (
            <div key={cat}>
              <div className="mb-2">
                <h3 className="text-[13px] font-semibold text-white tracking-wide">{meta.title}</h3>
                <p className="text-[11px] text-[oklch(0.50_0.008_250)]">{meta.description}</p>
              </div>
              <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-visible pb-1 snap-x lg:snap-none">
                {items.filter((e) => !e.featured).map((entry) => (
                  <SimulatorCard
                    key={entry.id}
                    entry={entry}
                    active={activeId === entry.id}
                    locked={lockFor(entry)}
                    bestScore={getBestScore(entry.id)}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
