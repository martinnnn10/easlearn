/**
 * Learning Path Page
 * 
 * Visual ILU (Integrated Learning Unit) progression map showing:
 * - Module progression with prerequisite chains
 * - Per-module breakdown: Theory → Lab → Simulation → Assessment
 * - User progress overlay (completed/in-progress/locked states)
 * - Works for both authenticated (with progress) and public (overview) users
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import SEO from "@/components/SEO";
import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  GraduationCap,
  Lock,
  Monitor,
  Play,
  Trophy,
  Zap,
  ArrowRight,
  CircleDot,
  Target,
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";

// ILU stage definitions
const ILU_STAGES = [
  { key: "theory", label: "Theory", icon: BookOpen, description: "Core concepts & principles" },
  { key: "lab", label: "Lab", icon: FlaskConical, description: "Interactive hands-on practice" },
  { key: "simulation", label: "Simulation", icon: Monitor, description: "Troubleshooting scenarios" },
  { key: "assessment", label: "Assessment", icon: GraduationCap, description: "Knowledge verification" },
] as const;

// Module metadata for the visual path (maps to database modules)
const MODULE_PATH_DATA: Record<string, { color: string; hasLab: boolean; labName?: string }> = {
  "electrical-fundamentals": { color: "#3b82f6", hasLab: true, labName: "Circuit Flow Lab" },
  "digital-fundamentals": { color: "#8b5cf6", hasLab: false },
  "semiconductor-fundamentals": { color: "#a855f7", hasLab: false },
  "motors-controls": { color: "#f59e0b", hasLab: true, labName: "Relay Logic Lab" },
  "powerflex-vfd": { color: "#10b981", hasLab: true, labName: "VFD Parameter Lab" },
  "plc-fundamentals": { color: "#06b6d4", hasLab: true, labName: "Ladder Logic Lab" },
  "fluid-power": { color: "#ef4444", hasLab: false },
  "preventative-maintenance": { color: "#84cc16", hasLab: false },
  "alignment": { color: "#f97316", hasLab: false },
  "sensors-instrumentation": { color: "#ec4899", hasLab: true, labName: "Multimeter Lab" },
  "print-reading": { color: "#14b8a6", hasLab: false },
  "safety-systems": { color: "#dc2626", hasLab: false },
  "power-distribution": { color: "#eab308", hasLab: false },
  "industrial-networking": { color: "#6366f1", hasLab: false },
  "robotics-fundamentals": { color: "#0ea5e9", hasLab: false },
  "process-control": { color: "#d946ef", hasLab: false },
  "hvac-fundamentals": { color: "#22d3ee", hasLab: false },
  "industrial-troubleshooting": { color: "#f43f5e", hasLab: false },
};

export default function LearningPath() {
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;

  // Public data - always fetch
  const { data: modules, isLoading: modulesLoading } = trpc.courses.listModules.useQuery();

  // Protected data - only fetch if authenticated
  const { data: dashboardData } = trpc.courses.getDashboard.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: scenarioHistory } = trpc.scenarioProgression.getHistory.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: masteryData } = trpc.certification.getAllModuleMastery.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const isLoading = modulesLoading || authLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading learning path...</div>
      </div>
    );
  }

  // Separate modules by path
  const foundationalModules = modules?.filter((m: any) => m.path === "foundational") || [];
  const advancedModules = modules?.filter((m: any) => m.path === "advanced") || [];

  // Build progress map from dashboard data
  const progressMap = new Map<string, { completedCount: number; totalCount: number; percentage: number; hasCertificate: boolean }>();
  if (dashboardData?.modules) {
    dashboardData.modules.forEach((m: any) => {
      progressMap.set(m.slug, {
        completedCount: m.completedCount,
        totalCount: m.totalCount,
        percentage: m.percentage,
        hasCertificate: m.hasCertificate,
      });
    });
  }

  // Count scenario completions per category
  const scenarioCompletions = new Set(scenarioHistory?.map((s: any) => s.scenarioSlug) || []);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Learning Path | EAS Training Platform"
        description="Visual progression map showing your journey from electrical fundamentals to advanced industrial troubleshooting. Theory → Lab → Simulation → Assessment."
        path="/learning-path"
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/20 via-background to-background" />
        <div className="container relative py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium mb-3">
              <Target className="w-4 h-4" />
              <span>Integrated Learning Unit Architecture</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Your Learning Path
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Every module follows the ILU progression: master theory, practice in interactive labs, 
              apply knowledge in troubleshooting simulations, then prove competency through assessment. 
              This is how real technicians are trained.
            </p>

            {/* ILU Legend */}
            <div className="flex flex-wrap gap-4 mt-6">
              {ILU_STAGES.map((stage) => (
                <div key={stage.key} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <stage.icon className="w-4 h-4 text-emerald-500" />
                  <span>{stage.label}</span>
                </div>
              ))}
            </div>

            {/* Overall progress bar for authenticated users */}
            {isAuthenticated && dashboardData && (
              <div className="mt-8 p-4 rounded-lg bg-card border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Overall Progress</span>
                  <span className="text-sm text-emerald-500 font-semibold">
                    {dashboardData.completedLessons}/{dashboardData.totalLessons} lessons
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${dashboardData.overallProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Foundational Path */}
      <section className="container py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Foundational Path</h2>
            <p className="text-sm text-muted-foreground">Build your core knowledge — prerequisite for advanced paths</p>
          </div>
        </div>

        <div className="space-y-4">
          {foundationalModules.map((mod: any, idx: number) => (
            <ModulePathCard
              key={mod.id}
              module={mod}
              index={idx}
              progress={progressMap.get(mod.slug)}
              scenarioCompletions={scenarioCompletions}
              isAuthenticated={isAuthenticated}
              isLast={idx === foundationalModules.length - 1}
              mastery={masteryData?.find((m: any) => m.moduleId === mod.id)}
            />
          ))}
        </div>

        {/* Connector to Advanced */}
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-card border border-border">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium text-foreground">Complete foundational modules to unlock advanced paths</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </section>

      {/* Advanced Path */}
      <section className="container pb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Advanced Path</h2>
            <p className="text-sm text-muted-foreground">Specialized skills and advanced troubleshooting mastery</p>
          </div>
        </div>

        <div className="space-y-4">
          {advancedModules.map((mod: any, idx: number) => (
            <ModulePathCard
              key={mod.id}
              module={mod}
              index={idx}
              progress={progressMap.get(mod.slug)}
              scenarioCompletions={scenarioCompletions}
              isAuthenticated={isAuthenticated}
              isLast={idx === advancedModules.length - 1}
              mastery={masteryData?.find((m: any) => m.moduleId === mod.id)}
            />
          ))}
        </div>
      </section>

      {/* CTA for unauthenticated users */}
      {!isAuthenticated && (
        <section className="border-t border-border bg-card">
          <div className="container py-12 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">Ready to Start Your Journey?</h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Track your progress, earn certificates, and build real troubleshooting skills 
              through our integrated learning system.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button asChild>
                <a href={getLoginUrl("/learning-path")}>
                  Sign In to Track Progress
                </a>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/courses">Browse Courses</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// Individual module card showing ILU progression
function ModulePathCard({
  module: mod,
  index,
  progress,
  scenarioCompletions,
  isAuthenticated,
  isLast,
  mastery,
}: {
  module: any;
  index: number;
  progress?: { completedCount: number; totalCount: number; percentage: number; hasCertificate: boolean };
  scenarioCompletions: Set<string>;
  isAuthenticated: boolean;
  isLast: boolean;
  mastery?: any;
}) {
  const pathData = MODULE_PATH_DATA[mod.slug] || { color: "#6b7280", hasLab: false };
  const percentage = progress?.percentage || 0;
  const isCompleted = percentage === 100;
  const isStarted = percentage > 0;
  const hasCertificate = progress?.hasCertificate || false;

  // Determine module status
  const getStatus = () => {
    if (hasCertificate) return "certified";
    if (isCompleted) return "completed";
    if (isStarted) return "in-progress";
    return "not-started";
  };
  const status = getStatus();

  // ILU stage progress estimation
  const getStageProgress = () => {
    if (!isAuthenticated) return { theory: "available", lab: "available", simulation: "available", assessment: "available" };
    
    const lessonProgress = percentage / 100;
    
    return {
      theory: lessonProgress > 0 ? (lessonProgress >= 0.5 ? "completed" : "in-progress") : "available",
      lab: pathData.hasLab ? (lessonProgress >= 0.5 ? "completed" : lessonProgress > 0.25 ? "in-progress" : "available") : "na",
      simulation: lessonProgress >= 0.75 ? "completed" : lessonProgress >= 0.5 ? "in-progress" : "locked",
      assessment: hasCertificate ? "completed" : lessonProgress >= 0.8 ? "available" : "locked",
    };
  };
  const stageProgress = getStageProgress();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/courses/${mod.slug}`}>
        <div className="group relative p-5 rounded-xl bg-card border border-border hover:border-emerald-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/5 cursor-pointer">
          {/* Module header */}
          <div className="flex items-start gap-4">
            {/* Status indicator */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${pathData.color}15` }}
            >
              {status === "certified" ? (
                <Trophy className="w-5 h-5" style={{ color: pathData.color }} />
              ) : status === "completed" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : status === "in-progress" ? (
                <Play className="w-5 h-5" style={{ color: pathData.color }} />
              ) : (
                <CircleDot className="w-5 h-5 text-muted-foreground" />
              )}
            </div>

            {/* Module info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground group-hover:text-emerald-500 transition-colors truncate">
                  {mod.title}
                </h3>
                {mastery?.mastered && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-500">
                    Mastered
                  </span>
                )}
                {hasCertificate && !mastery?.mastered && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-500">
                    Certified
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">{mod.description}</p>

              {/* ILU Stage indicators */}
              <div className="flex items-center gap-1 mt-3">
                {ILU_STAGES.map((stage, i) => {
                  const stageStatus = stageProgress[stage.key as keyof typeof stageProgress];
                  if (stageStatus === "na") return null;

                  return (
                    <div key={stage.key} className="flex items-center">
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                          stageStatus === "completed"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : stageStatus === "in-progress"
                            ? "bg-amber-500/10 text-amber-500"
                            : stageStatus === "locked"
                            ? "bg-muted text-muted-foreground/50"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {stageStatus === "completed" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : stageStatus === "locked" ? (
                          <Lock className="w-3 h-3" />
                        ) : (
                          <stage.icon className="w-3 h-3" />
                        )}
                        <span className="hidden sm:inline">{stage.label}</span>
                      </div>
                      {i < ILU_STAGES.length - 1 && stageStatus !== "na" && (
                        <ChevronRight className="w-3 h-3 text-muted-foreground/30 mx-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress ring / lesson count */}
            <div className="shrink-0 text-right">
              {isAuthenticated && progress ? (
                <div className="flex flex-col items-end gap-1">
                  <div className="relative w-10 h-10">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18" cy="18" r="15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-muted"
                      />
                      <circle
                        cx="18" cy="18" r="15"
                        fill="none"
                        stroke={percentage === 100 ? "#10b981" : pathData.color}
                        strokeWidth="3"
                        strokeDasharray={`${percentage * 0.9425} 94.25`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                      {percentage}%
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {progress.completedCount}/{progress.totalCount}
                  </span>
                </div>
              ) : (
                <div className="text-right">
                  <span className="text-sm font-medium text-foreground">{mod.actualLessonCount ?? mod.totalLessons ?? 0}</span>
                  <span className="text-xs text-muted-foreground block">lessons</span>
                </div>
              )}
            </div>
          </div>

          {/* Prerequisite badge */}
          {mod.prerequisiteSlug && (
            <div className="mt-3 ml-14 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              <span>Requires: {mod.prerequisiteSlug.replace(/-/g, " ")}</span>
            </div>
          )}
        </div>
      </Link>

      {/* Connector line between modules */}
      {!isLast && (
        <div className="flex justify-start ml-9 py-1">
          <div className="w-px h-4 bg-border" />
        </div>
      )}
    </motion.div>
  );
}
