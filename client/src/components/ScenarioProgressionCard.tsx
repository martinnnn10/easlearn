/**
 * ScenarioProgressionCard - Shows recommended next scenario based on user history
 * Appears on the Simulator page and after scenario completion (debrief)
 */
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowRight, TrendingUp, Trophy, Sparkles } from "lucide-react";

const difficultyConfig = {
  beginner: { label: "Beginner", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  intermediate: { label: "Intermediate", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  advanced: { label: "Advanced", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
};

export default function ScenarioProgressionCard({ compact = false }: { compact?: boolean }) {
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = trpc.scenarioProgression.getRecommendation.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated || isLoading) return null;
  if (!data) return null;

  // All scenarios completed, no recommendation
  if (!data.recommended) {
    return (
      <div className={`rounded-lg border border-[oklch(0.15_0.004_250)] bg-[oklch(0.09_0.003_250)] ${compact ? "p-3" : "p-5"}`}>
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-heading text-white tracking-wide">ALL SCENARIOS COMPLETE</span>
        </div>
        <p className="text-xs text-[oklch(0.55_0.008_250)]">{data.reason}</p>
      </div>
    );
  }

  const { recommended, reason } = data;
  const config = difficultyConfig[recommended.difficulty];

  if (compact) {
    return (
      <div className="rounded-lg border border-[oklch(0.20_0.006_155/30%)] bg-[oklch(0.09_0.006_155/20%)] p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[oklch(0.55_0.12_155)]" />
          <span className="text-[11px] font-semibold text-[oklch(0.55_0.12_155)] uppercase tracking-wider">Up Next</span>
        </div>
        <Link
          href={`/simulator?scenario=${recommended.slug}`}
          className="flex items-center justify-between gap-2 group"
        >
          <div className="min-w-0">
            <p className="text-[13px] text-white font-medium truncate group-hover:text-[oklch(0.75_0.12_155)] transition-colors">
              {recommended.title}
            </p>
            <span className={`text-[10px] ${config.color}`}>{config.label}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-[oklch(0.35_0.006_250)] group-hover:text-[oklch(0.55_0.12_155)] transition-colors shrink-0" />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[oklch(0.20_0.006_155/30%)] bg-gradient-to-br from-[oklch(0.09_0.006_155/20%)] to-[oklch(0.07_0.003_250)] p-5">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
        <span className="text-sm font-heading text-white tracking-wide">RECOMMENDED NEXT</span>
      </div>

      <p className="text-xs text-[oklch(0.55_0.008_250)] mb-4 leading-relaxed">{reason}</p>

      <Link
        href={`/simulator?scenario=${recommended.slug}`}
        className="flex items-center justify-between gap-3 p-3 rounded-md bg-[oklch(0.07_0.003_250)] border border-[oklch(0.15_0.004_250)] hover:border-[oklch(0.30_0.06_155)] transition-colors group"
      >
        <div className="min-w-0">
          <p className="text-[14px] text-white font-medium group-hover:text-[oklch(0.75_0.12_155)] transition-colors">
            {recommended.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${config.bg} ${config.color} ${config.border} border`}>
              {config.label}
            </span>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-[oklch(0.35_0.006_250)] group-hover:text-[oklch(0.55_0.12_155)] transition-colors shrink-0" />
      </Link>
    </div>
  );
}
