/**
 * Methodology Progress Dashboard
 * 
 * Shows technician growth over time with:
 * - Radar chart of 8 methodology dimensions (SVG-based, no external chart lib)
 * - Trend line showing methodology score improvement
 * - Scenario completion history with methodology grades
 * - Strengths and weaknesses analysis
 * - Enterprise-ready design
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import SEO from "@/components/SEO";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Brain,
  Calendar,
  ChevronRight,
  Clock,
  Crosshair,
  Flame,
  Lightbulb,
  Lock,
  Radar,
  Shield,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Wrench,
  Zap,
} from "lucide-react";
import { useMemo } from "react";

// === RADAR CHART (pure SVG) ===

const DIMENSION_LABELS: Record<string, { short: string; full: string; icon: typeof Brain }> = {
  diagnosticSequence: { short: "Sequence", full: "Diagnostic Sequence", icon: Target },
  unnecessaryMeasurements: { short: "Efficiency", full: "Measurement Efficiency", icon: Crosshair },
  unsafeActions: { short: "Safety", full: "Safety Compliance", icon: Shield },
  excessiveGuessing: { short: "Precision", full: "Diagnostic Precision", icon: Brain },
  toolSelection: { short: "Tools", full: "Tool Selection", icon: Wrench },
  logicalIsolation: { short: "Isolation", full: "Logical Isolation", icon: Activity },
  hintUsage: { short: "Independence", full: "Independent Diagnosis", icon: Lightbulb },
  timeEfficiency: { short: "Speed", full: "Time Efficiency", icon: Timer },
};

const DIMENSION_ORDER = [
  "diagnosticSequence",
  "toolSelection",
  "logicalIsolation",
  "unnecessaryMeasurements",
  "timeEfficiency",
  "hintUsage",
  "unsafeActions",
  "excessiveGuessing",
];

interface RadarChartProps {
  data: Record<string, { avg: number; best: number }>;
  size?: number;
}

function RadarChart({ data, size = 280 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const levels = [20, 40, 60, 80, 100];
  const dims = DIMENSION_ORDER.filter(d => data[d]);
  const n = dims.length;
  if (n === 0) return null;

  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2; // top

  const getPoint = (index: number, value: number) => {
    const angle = startAngle + index * angleStep;
    const r = (value / 100) * radius;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  // Grid lines
  const gridPaths = levels.map(level => {
    const points = dims.map((_, i) => getPoint(i, level));
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  });

  // Data polygon (average)
  const avgPoints = dims.map((d, i) => getPoint(i, data[d].avg));
  const avgPath = avgPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  // Best polygon
  const bestPoints = dims.map((d, i) => getPoint(i, data[d].best));
  const bestPath = bestPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  // Axis lines
  const axisLines = dims.map((_, i) => {
    const end = getPoint(i, 100);
    return { x1: cx, y1: cy, x2: end.x, y2: end.y };
  });

  // Labels
  const labelPositions = dims.map((d, i) => {
    const p = getPoint(i, 118);
    return { ...p, label: DIMENSION_LABELS[d]?.short || d };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[320px] mx-auto">
      {/* Grid */}
      {gridPaths.map((path, i) => (
        <path key={i} d={path} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={i === levels.length - 1 ? 1 : 0.5} />
      ))}
      {/* Axes */}
      {axisLines.map((line, i) => (
        <line key={i} {...line} stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
      ))}
      {/* Best polygon */}
      <path d={bestPath} fill="rgba(34,197,94,0.08)" stroke="rgba(34,197,94,0.3)" strokeWidth={1} strokeDasharray="4 2" />
      {/* Average polygon */}
      <path d={avgPath} fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.8)" strokeWidth={1.5} />
      {/* Data points */}
      {avgPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#3b82f6" stroke="#1e3a5f" strokeWidth={1} />
      ))}
      {/* Labels */}
      {labelPositions.map((p, i) => (
        <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.5)" fontSize={9} fontFamily="var(--font-sim-mono, monospace)">
          {p.label}
        </text>
      ))}
    </svg>
  );
}

// === TREND CHART (pure SVG) ===

interface TrendChartProps {
  data: { date: Date | string | null; methodologyScore: number | null }[];
}

function TrendChart({ data }: TrendChartProps) {
  const validData = data.filter(d => d.methodologyScore != null);
  if (validData.length < 2) return <div className="text-center text-gray-500 text-sm py-8">Complete more scenarios to see your trend</div>;

  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const scores = validData.map(d => d.methodologyScore!);
  const minScore = Math.max(0, Math.min(...scores) - 10);
  const maxScore = Math.min(100, Math.max(...scores) + 10);

  const points = validData.map((d, i) => ({
    x: padding.left + (i / (validData.length - 1)) * chartW,
    y: padding.top + chartH - ((d.methodologyScore! - minScore) / (maxScore - minScore)) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  // Y-axis labels
  const yLabels = [minScore, Math.round((minScore + maxScore) / 2), maxScore];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* Y-axis labels */}
      {yLabels.map((v, i) => {
        const y = padding.top + chartH - ((v - minScore) / (maxScore - minScore)) * chartH;
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
            <text x={padding.left - 8} y={y} textAnchor="end" dominantBaseline="middle" fill="rgba(255,255,255,0.4)" fontSize={10}>
              {v}%
            </text>
          </g>
        );
      })}
      {/* Area fill */}
      <path d={areaPath} fill="url(#trendGradient)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth={2} />
      {/* Points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#3b82f6" stroke="#0f172a" strokeWidth={1.5} />
      ))}
      {/* X-axis labels (first and last) */}
      <text x={points[0].x} y={height - 5} textAnchor="start" fill="rgba(255,255,255,0.4)" fontSize={9}>
        #{1}
      </text>
      <text x={points[points.length - 1].x} y={height - 5} textAnchor="end" fill="rgba(255,255,255,0.4)" fontSize={9}>
        #{validData.length}
      </text>
      {/* Gradient definition */}
      <defs>
        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(59,130,246,0.2)" />
          <stop offset="100%" stopColor="rgba(59,130,246,0)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// === GRADE BADGE ===

function GradeBadge({ grade, size = "md" }: { grade: string | null; size?: "sm" | "md" }) {
  const colors: Record<string, string> = {
    A: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    B: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    C: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    D: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    F: "bg-red-500/15 text-red-400 border-red-500/20",
  };
  const letter = grade?.charAt(0)?.toUpperCase() || "—";
  const colorClass = colors[letter] || "bg-gray-500/15 text-gray-400 border-gray-500/20";
  const sizeClass = size === "sm" ? "w-7 h-7 text-xs" : "w-10 h-10 text-base";

  return (
    <div className={`${sizeClass} rounded-lg border flex items-center justify-center font-bold font-mono ${colorClass}`}>
      {letter}
    </div>
  );
}

// === MAIN PAGE ===

export default function Progress() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: progress, isLoading } = trpc.scenarioProgression.getMethodologyProgress.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Compute derived data
  const stats = useMemo(() => {
    if (!progress) return null;

    const withMethodology = progress.completions.filter((c: typeof progress.completions[number]) => c.methodologyScore != null);
    const avgMethodology = withMethodology.length > 0
      ? Math.round(withMethodology.reduce((s: number, c: typeof progress.completions[number]) => s + (c.methodologyScore || 0), 0) / withMethodology.length)
      : 0;
    const bestMethodology = withMethodology.length > 0
      ? Math.max(...withMethodology.map((c: typeof progress.completions[number]) => c.methodologyScore || 0))
      : 0;

    // Improvement: compare first 3 vs last 3
    let improvement = 0;
    if (withMethodology.length >= 6) {
      const recent3 = withMethodology.slice(0, 3);
      const oldest3 = withMethodology.slice(-3);
      const recentAvg = recent3.reduce((s: number, c: typeof progress.completions[number]) => s + (c.methodologyScore || 0), 0) / 3;
      const oldestAvg = oldest3.reduce((s: number, c: typeof progress.completions[number]) => s + (c.methodologyScore || 0), 0) / 3;
      improvement = Math.round(recentAvg - oldestAvg);
    }

    // Strongest and weakest dimensions
    let strongest: { id: string; avg: number } | null = null;
    let weakest: { id: string; avg: number } | null = null;
    if (progress.averageDimensions) {
      const dims = progress.averageDimensions as Record<string, { avg: number; count: number; best: number }>;
      const entries = Object.entries(dims);
      if (entries.length > 0) {
        const sorted = entries.sort((a, b) => b[1].avg - a[1].avg);
        strongest = { id: sorted[0][0], avg: sorted[0][1].avg };
        weakest = { id: sorted[sorted.length - 1][0], avg: sorted[sorted.length - 1][1].avg };
      }
    }

    return { avgMethodology, bestMethodology, improvement, strongest, weakest, withMethodology };
  }, [progress]);

  // Not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#080c08] via-[#0a0f0a] to-[#060a06] flex items-center justify-center p-4">
        <SEO title="Methodology Progress" description="Track your troubleshooting methodology growth over time with radar charts and completion history." path="/progress" />
        <div className="text-center max-w-md">
          <Lock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Sign In Required</h1>
          <p className="text-gray-400 text-sm mb-6">Track your troubleshooting methodology growth over time.</p>
          <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors">
            Sign In to View Progress
          </a>
        </div>
      </div>
    );
  }

  // Loading
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#080c08] via-[#0a0f0a] to-[#060a06] flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading your progress...</div>
      </div>
    );
  }

  const hasData = progress && progress.totalAttempts > 0;
  const hasMethodologyData = stats && stats.withMethodology && stats.withMethodology.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#080c08] via-[#0a0f0a] to-[#060a06]">
      <SEO title="Methodology Progress" description="Track your troubleshooting methodology growth over time with radar charts and completion history." path="/progress" />
      <div className="container max-w-6xl py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors" aria-label="Back to dashboard">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              Methodology Progress
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Track how your troubleshooting approach improves over time</p>
          </div>
        </div>

        {!hasData ? (
          /* Empty state */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
              <Radar className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">No Scenarios Completed Yet</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-8">
              Complete simulator scenarios to start tracking your troubleshooting methodology. Your diagnostic sequence, tool selection, safety compliance, and more will be scored and tracked here.
            </p>
            <Link href="/simulator">
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
                <Wrench className="w-4 h-4" />
                Start a Scenario
                <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Scenarios</span>
                </div>
                <div className="text-2xl font-bold text-white">{progress?.totalAttempts || 0}</div>
                <div className="text-xs text-gray-500 mt-1">completed</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Avg Methodology</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats?.avgMethodology || 0}%</div>
                <div className="text-xs text-gray-500 mt-1">across all attempts</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Best Score</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats?.bestMethodology || 0}%</div>
                <div className="text-xs text-gray-500 mt-1">personal best</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Improvement</span>
                </div>
                <div className={`text-2xl font-bold ${stats && stats.improvement > 0 ? "text-emerald-400" : stats && stats.improvement < 0 ? "text-red-400" : "text-gray-400"}`}>
                  {stats && stats.improvement > 0 ? "+" : ""}{stats?.improvement || 0}%
                </div>
                <div className="text-xs text-gray-500 mt-1">recent vs early</div>
              </motion.div>
            </div>

            {hasMethodologyData && (
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Radar Chart */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                  <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                    <Radar className="w-4 h-4 text-blue-400" />
                    Methodology Radar
                  </h2>
                  <p className="text-xs text-gray-500 mb-4">Blue = average, dashed green = personal best</p>
                  {progress?.averageDimensions && (
                    <RadarChart data={progress.averageDimensions} />
                  )}
                  {/* Dimension legend */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {DIMENSION_ORDER.filter(d => progress?.averageDimensions?.[d]).map(dimId => {
                      const dim = DIMENSION_LABELS[dimId];
                      const data = progress!.averageDimensions![dimId];
                      const Icon = dim?.icon || Brain;
                      return (
                        <div key={dimId} className="flex items-center gap-2 text-xs">
                          <Icon className="w-3 h-3 text-gray-500 shrink-0" />
                          <span className="text-gray-400 truncate">{dim?.full || dimId}</span>
                          <span className="text-white font-mono ml-auto">{data.avg}%</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Trend Chart */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                  <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Score Trend
                  </h2>
                  <p className="text-xs text-gray-500 mb-4">Methodology score over your last {progress?.trend?.length || 0} attempts</p>
                  <TrendChart data={progress?.trend || []} />

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                      <div className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1 font-semibold">Strongest Area</div>
                      {stats?.strongest ? (
                        <>
                          <div className="text-sm text-white font-medium">{DIMENSION_LABELS[stats.strongest.id]?.full || stats.strongest.id}</div>
                          <div className="text-xs text-emerald-400 font-mono mt-0.5">{stats.strongest.avg}% avg</div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-500">Complete more scenarios</div>
                      )}
                    </div>
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
                      <div className="text-[10px] text-amber-400 uppercase tracking-wider mb-1 font-semibold">Needs Work</div>
                      {stats?.weakest ? (
                        <>
                          <div className="text-sm text-white font-medium">{DIMENSION_LABELS[stats.weakest.id]?.full || stats.weakest.id}</div>
                          <div className="text-xs text-amber-400 font-mono mt-0.5">{stats.weakest.avg}% avg</div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-500">Complete more scenarios</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Completion History */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                Scenario History
              </h2>
              <div className="space-y-2">
                {progress?.completions.slice(0, 20).map((comp: (typeof progress.completions)[number], i: number) => (
                  <div key={comp.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <GradeBadge grade={comp.methodologyGrade} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">{comp.scenarioTitle}</div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                          comp.difficulty === "advanced" ? "bg-red-500/10 text-red-400" :
                          comp.difficulty === "intermediate" ? "bg-amber-500/10 text-amber-400" :
                          "bg-emerald-500/10 text-emerald-400"
                        }`}>
                          {comp.difficulty}
                        </span>
                        {comp.playMode && comp.playMode !== "standard" && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-semibold">
                            {comp.playMode}
                          </span>
                        )}
                        {comp.difficultyModifier && comp.difficultyModifier !== "standard" && (
                          <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 text-[9px] font-semibold">
                            {comp.difficultyModifier.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm text-white font-mono">{comp.percentage}%</div>
                      {comp.methodologyScore != null && (
                        <div className="text-[10px] text-blue-400 font-mono">M:{comp.methodologyScore}%</div>
                      )}
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Clock className="w-3 h-3" />
                        {Math.floor(comp.timeSeconds / 60)}:{String(comp.timeSeconds % 60).padStart(2, "0")}
                      </div>
                      <div className="text-[10px] text-gray-600 mt-0.5">
                        {comp.completedAt ? new Date(comp.completedAt).toLocaleDateString() : "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {progress && progress.completions.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No scenarios completed yet. <Link href="/simulator" className="text-blue-400 hover:underline">Start practicing</Link>
                </div>
              )}
            </motion.div>

            {/* CTA */}
            <div className="mt-8 text-center">
              <Link href="/simulator">
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
                  <Wrench className="w-4 h-4" />
                  Continue Training
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
