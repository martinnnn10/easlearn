/**
 * MethodologyBreakdown — Scoring Results UI
 * 
 * Displays the 8-dimension methodology score breakdown after a simulator scenario.
 * Shows overall grade, individual dimension scores with feedback, and coaching tips.
 */
import { motion } from "framer-motion";
import {
  Target, Shield, AlertTriangle, Brain, Wrench,
  GitBranch, Lightbulb, Timer, TrendingUp, Award,
  ChevronDown, ChevronUp, Info
} from "lucide-react";
import { useState } from "react";
import type { MethodologyScore, MethodologyDimension } from "@/lib/scoringEngine";

interface MethodologyBreakdownProps {
  score: MethodologyScore;
  /** Compact mode for inline display */
  compact?: boolean;
}

const DIMENSION_ICONS: Record<string, React.ReactNode> = {
  diagnostic_sequence: <Target className="w-4 h-4" />,
  unnecessary_measurements: <TrendingUp className="w-4 h-4" />,
  unsafe_actions: <Shield className="w-4 h-4" />,
  excessive_guessing: <Brain className="w-4 h-4" />,
  tool_selection: <Wrench className="w-4 h-4" />,
  logical_isolation: <GitBranch className="w-4 h-4" />,
  hint_usage: <Lightbulb className="w-4 h-4" />,
  time_efficiency: <Timer className="w-4 h-4" />,
};

const GRADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  excellent: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  good: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  fair: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  poor: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
};

const OVERALL_GRADE_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  A: { label: "Excellent Methodology", color: "#22c55e", description: "Your diagnostic approach demonstrates strong systematic troubleshooting skills." },
  B: { label: "Good Methodology", color: "#3b82f6", description: "Solid troubleshooting approach with room for refinement in specific areas." },
  C: { label: "Fair Methodology", color: "#eab308", description: "Your approach works but could be more systematic. Focus on the areas marked below." },
  D: { label: "Needs Improvement", color: "#f97316", description: "Review the fundamentals of systematic troubleshooting methodology." },
  F: { label: "Developing", color: "#ef4444", description: "Consider starting with Guided Learning mode to build your diagnostic process." },
};

function DimensionBar({ dimension, index }: { dimension: MethodologyDimension; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const colors = GRADE_COLORS[dimension.grade] || GRADE_COLORS.fair;
  const icon = DIMENSION_ICONS[dimension.id] || <Info className="w-4 h-4" />;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="group"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="flex items-center gap-3 py-2">
          {/* Icon */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg} ${colors.border} border shrink-0`}>
            <span className={colors.text}>{icon}</span>
          </div>

          {/* Label + Score */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-white font-medium truncate">{dimension.label}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs text-gray-400">
                  {dimension.score}/{dimension.maxScore}
                </span>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} ${colors.border} border`}>
                  {dimension.percentage}%
                </span>
                {expanded ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${dimension.percentage}%` }}
                transition={{ duration: 0.8, delay: index * 0.08 + 0.3 }}
                className={`h-full rounded-full ${
                  dimension.grade === "excellent" ? "bg-emerald-500" :
                  dimension.grade === "good" ? "bg-blue-500" :
                  dimension.grade === "fair" ? "bg-amber-500" : "bg-red-500"
                }`}
              />
            </div>
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="ml-11 mb-3"
        >
          {/* Feedback */}
          <p className="text-xs text-gray-400 mb-2 leading-relaxed">{dimension.feedback}</p>
          
          {/* Details */}
          {dimension.details.length > 0 && (
            <ul className="space-y-1">
              {dimension.details.map((detail, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-gray-500">
                  <span className="mt-1 w-1 h-1 rounded-full bg-gray-600 shrink-0" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function MethodologyBreakdown({ score, compact }: MethodologyBreakdownProps) {
  const [showAll, setShowAll] = useState(!compact);
  const gradeConfig = OVERALL_GRADE_CONFIG[score.overallGrade] || OVERALL_GRADE_CONFIG.C;

  // Sort dimensions: worst scores first (areas needing improvement)
  const sortedDimensions = [...score.dimensions].sort((a, b) => a.percentage - b.percentage);
  const displayDimensions = showAll ? sortedDimensions : sortedDimensions.slice(0, 3);

  return (
    <div className="sim-glass-elevated p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-semibold text-lg" style={{ fontFamily: "var(--font-sim-body)", textTransform: "none" }}>
          Methodology Assessment
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-gray-400">{score.totalScore}/{score.maxScore}</span>
        </div>
      </div>

      {/* Overall Grade Circle */}
      <div className="flex items-center gap-5 mb-6 p-4 rounded-xl bg-white/[2%] border border-white/[5%]">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="relative w-20 h-20 shrink-0"
        >
          {/* Background ring */}
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <motion.circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke={gradeConfig.color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - score.overallPercentage / 100) }}
              transition={{ duration: 1.2, delay: 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: gradeConfig.color, fontFamily: "var(--font-sim-body)" }}>
              {score.overallGrade}
            </span>
            <span className="text-[10px] text-gray-500 font-mono">{score.overallPercentage}%</span>
          </div>
        </motion.div>

        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm mb-1" style={{ color: gradeConfig.color }}>
            {gradeConfig.label}
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            {gradeConfig.description}
          </p>
        </div>
      </div>

      {/* Dimension Bars */}
      <div className="space-y-1">
        {displayDimensions.map((dim, i) => (
          <DimensionBar key={dim.id} dimension={dim} index={i} />
        ))}
      </div>

      {/* Show more/less */}
      {compact && sortedDimensions.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors mx-auto"
        >
          {showAll ? (
            <>Show Less <ChevronUp className="w-3 h-3" /></>
          ) : (
            <>Show All {sortedDimensions.length} Dimensions <ChevronDown className="w-3 h-3" /></>
          )}
        </button>
      )}

      {/* Coaching Tips */}
      {score.coachingTips.length > 0 && (
        <div className="mt-5 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">Coaching Tips</span>
          </div>
          <ul className="space-y-1.5">
            {score.coachingTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-amber-200/70">
                <span className="mt-1 w-1 h-1 rounded-full bg-amber-500/50 shrink-0" />
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
