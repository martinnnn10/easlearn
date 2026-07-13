/**
 * Programs Page — Industrial Maintenance Technician Academy
 *
 * Organized as a 4-semester technical school driven by courses.listModules.
 * Premium immersive industrial software feel — NOT a generic LMS.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  BookOpen, ChevronRight, CheckCircle2, Play, GraduationCap, Trophy,
  Target, Clock, Wrench, RefreshCw, AlertCircle,
} from "lucide-react";
import { pluralize } from "@/lib/pluralize";
import SEO from "@/components/SEO";
import { trpc } from "@/lib/trpc";
import {
  resolveProgramsSemesters,
  getUnassignedSlugs,
  type SemesterConfig,
} from "@/config/programsSemesters";
import {
  getModuleIcon,
  getModuleColor,
  getModuleTopics,
  getDisplayLabCount,
} from "@/config/programsPresentation";

type CourseModule = {
  slug: string;
  title: string;
  description: string;
  path: string;
  orderIndex: number;
  icon: string;
  actualLessonCount?: number;
  totalLessons?: number;
  quizQuestionCount?: number;
  estimatedHours?: number;
};

function getLessonCount(mod: CourseModule): number {
  return mod.actualLessonCount ?? mod.totalLessons ?? 0;
}

// === COMPONENT ===

function ModuleCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-zinc-800 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-2/5 rounded bg-zinc-800" />
          <div className="h-4 w-full rounded bg-zinc-800/80" />
          <div className="h-4 w-4/5 rounded bg-zinc-800/60" />
        </div>
        <div className="hidden sm:block w-20 h-4 rounded bg-zinc-800" />
      </div>
    </div>
  );
}

export default function Programs() {
  const [activeSemester, setActiveSemester] = useState(1);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const {
    data: courseModules,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = trpc.courses.listModules.useQuery();

  const awaitingModules = courseModules === undefined && (isLoading || isFetching);

  const modulesBySlug = useMemo(() => {
    const map = new Map<string, CourseModule>();
    for (const mod of courseModules ?? []) {
      map.set(mod.slug, mod as CourseModule);
    }
    return map;
  }, [courseModules]);

  const semesters = useMemo(() => {
    const unassigned = getUnassignedSlugs(
      (courseModules ?? []).map((m) => ({
        slug: m.slug,
        orderIndex: m.orderIndex,
        title: m.title,
      }))
    );
    return resolveProgramsSemesters(unassigned);
  }, [courseModules]);

  const currentSemester = useMemo(
    () => semesters.find((s) => s.number === activeSemester) ?? semesters[0]!,
    [semesters, activeSemester]
  );

  const semesterModules = useMemo(() => {
    return currentSemester.moduleSlugs
      .map((slug) => modulesBySlug.get(slug))
      .filter((mod): mod is CourseModule => mod != null);
  }, [currentSemester, modulesBySlug]);

  const totalLessons = useMemo(() => {
    return (courseModules ?? []).reduce(
      (sum, m) => sum + (m.actualLessonCount ?? m.totalLessons ?? 0),
      0
    );
  }, [courseModules]);

  const totalModules = courseModules?.length ?? 0;
  const availableCount = (courseModules ?? []).filter(
    (m) => (m.actualLessonCount ?? m.totalLessons ?? 0) > 0
  ).length;
  const pendingLabel = "…";
  const moduleCountLabel = awaitingModules
    ? pendingLabel
    : totalModules > 0
      ? String(totalModules)
      : "—";
  const lessonsLabel = awaitingModules
    ? pendingLabel
    : totalLessons > 0
      ? String(totalLessons)
      : "—";
  const availableLabel = awaitingModules ? pendingLabel : String(availableCount);
  const inDevelopmentLabel = awaitingModules
    ? pendingLabel
    : String(Math.max(0, totalModules - availableCount));

  return (
    <div className="min-h-screen bg-background pb-[calc(4rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
      <SEO
        title="Programs"
        description={`Industrial Maintenance Technician Academy — ${moduleCountLabel} modules across ${semesters.length} semesters covering electrical, mechanical, PLC, and advanced troubleshooting.`}
        path="/programs"
      />
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 to-transparent" />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

        <div className="container relative z-10">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm font-mono text-emerald-400 tracking-wider uppercase">
                Industrial Maintenance Technician Program
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
            >
              Complete Technical
              <br />
              <span className="text-emerald-400">Academy Program</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-zinc-400 max-w-2xl mb-8"
            >
              A structured technical curriculum built from real plant-floor experience — not classroom theory.
              All published modules are listed below by semester.
            </motion.p>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-6"
            >
              {[
                { label: "Published Modules", value: moduleCountLabel, icon: <BookOpen className="w-4 h-4" /> },
                { label: "Lessons", value: lessonsLabel, icon: <Target className="w-4 h-4" /> },
                { label: "Available Now", value: availableLabel, icon: <CheckCircle2 className="w-4 h-4" /> },
                { label: "In Development", value: inDevelopmentLabel, icon: <Clock className="w-4 h-4" /> },
                { label: "Certification Levels", value: "4", icon: <Trophy className="w-4 h-4" /> },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <span className="text-emerald-400">{stat.icon}</span>
                  <span className="text-white font-bold font-mono">{stat.value}</span>
                  <span className="text-zinc-500 text-sm">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Semester Navigation */}
      <section className="sticky top-[calc(4rem+env(safe-area-inset-top,0px))] z-30 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800">
        <div className="container">
          <div className="flex items-center gap-1 py-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory" style={{ WebkitOverflowScrolling: "touch" }}>
            {semesters.map((sem) => (
              <button
                key={sem.number}
                onClick={() => setActiveSemester(sem.number)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all snap-start ${
                  activeSemester === sem.number
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  activeSemester === sem.number
                    ? "bg-emerald-500 text-black"
                    : "bg-zinc-700 text-zinc-400"
                }`}>
                  {sem.number}
                </span>
                <span className="hidden sm:inline">{sem.title}</span>
                <span className="sm:hidden">S{sem.number}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Semester Content */}
      <section className="py-12">
        <div className="container">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSemester}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Semester Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Semester {currentSemester.number}: {currentSemester.title}
                </h2>
                <p className="text-zinc-400">{currentSemester.description}</p>
              </div>

              {isError && courseModules === undefined && (
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-300">Could not load course modules</p>
                      <p className="text-xs text-red-400/80 mt-1">
                        {error?.message ?? "The training catalog request failed. Check your connection and try again."}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium border border-zinc-700 transition-colors shrink-0"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              )}

              {/* Module Cards */}
              <div className="grid gap-4">
                {awaitingModules &&
                  currentSemester.moduleSlugs.map((slug) => (
                    <ModuleCardSkeleton key={slug} />
                  ))}
                {!awaitingModules && semesterModules.length === 0 && !isError && (
                  <p className="text-sm text-zinc-500 py-4">
                    No modules matched for this semester. Try refreshing the page.
                  </p>
                )}
                {!awaitingModules &&
                  semesterModules.map((module, index) => {
                  const lessonCount = getLessonCount(module);
                  const labCount = getDisplayLabCount(lessonCount);
                  const color = getModuleColor(module.slug, module.path);
                  const Icon = getModuleIcon(module.icon);
                  const topics = getModuleTopics(module.slug, module.description);

                  return (
                    <motion.div
                      key={module.slug}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group"
                    >
                      <div
                        className={`rounded-xl border transition-all cursor-pointer ${
                          expandedSlug === module.slug
                            ? "bg-zinc-800/80 border-emerald-500/30 shadow-lg shadow-emerald-500/5"
                            : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40"
                        }`}
                        onClick={() =>
                          setExpandedSlug(expandedSlug === module.slug ? null : module.slug)
                        }
                      >
                        {/* Module Header */}
                        <div className="flex items-center gap-4 p-5">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `color-mix(in oklch, ${color}, transparent 80%)`,
                              border: `1px solid color-mix(in oklch, ${color}, transparent 60%)`,
                            }}
                          >
                            <span style={{ color }}>
                              <Icon className="w-5 h-5" />
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                                {module.title}
                              </h3>
                              {lessonCount === 0 && (
                                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 whitespace-nowrap">
                                  Coming Soon
                                </span>
                              )}
                              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 whitespace-nowrap capitalize">
                                {module.path}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-500 mt-0.5 line-clamp-2">{module.description}</p>
                          </div>

                          <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-500">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5" />
                              {pluralize(lessonCount, "lesson")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Wrench className="w-3.5 h-3.5" />
                              {pluralize(labCount, "lab")}
                            </span>
                          </div>

                          <ChevronRight
                            className={`w-5 h-5 text-zinc-600 transition-transform shrink-0 ${
                              expandedSlug === module.slug ? "rotate-90" : ""
                            }`}
                          />
                        </div>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {expandedSlug === module.slug && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 pb-5 border-t border-zinc-800 pt-4">
                                <div className="mb-4">
                                  <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3">
                                    Topics Covered
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {topics.map((topic) => (
                                      <span
                                        key={topic}
                                        className="px-2.5 py-1 text-xs rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/50"
                                      >
                                        {topic}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 mt-4">
                                  {lessonCount > 0 ? (
                                    <>
                                      <Link href={`/courses/${module.slug}`}>
                                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors">
                                          <Play className="w-4 h-4" />
                                          Start Learning
                                        </button>
                                      </Link>
                                      <Link href="/labs">
                                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium border border-zinc-700 transition-colors">
                                          <Wrench className="w-4 h-4" />
                                          Open Labs
                                        </button>
                                      </Link>
                                    </>
                                  ) : (
                                    <div className="flex flex-col gap-2">
                                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-400/80 text-sm">
                                        <Clock className="w-4 h-4" />
                                        Foundational content in development — new lessons added monthly
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                                        <span className="flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-500/60" /> Curriculum designed
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-amber-400/60" /> Lessons in progress
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Program Progression Overview */}
      <section className="py-12 border-t border-zinc-800">
        <div className="container">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Program Progression</h2>

          <div className={`grid gap-4 max-w-6xl mx-auto ${
            semesters.length >= 5 ? "md:grid-cols-5" : "md:grid-cols-4"
          }`}>
            {semesters.map((sem, i) => (
              <SemesterProgressionCard
                key={sem.number}
                semester={sem}
                modulesBySlug={modulesBySlug}
                showConnector={i < semesters.length - 1}
              />
            ))}
          </div>

          {/* Certification Path */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-zinc-300">
                Complete all {semesters.length} semesters to earn{" "}
                <span className="text-amber-400 font-bold">Master Industrial Technician</span> certification
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SemesterProgressionCard({
  semester,
  modulesBySlug,
  showConnector,
}: {
  semester: SemesterConfig;
  modulesBySlug: Map<string, CourseModule>;
  showConnector: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-5 h-full">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400">
            {semester.number}
          </span>
          <span className="text-sm font-bold text-white">{semester.title}</span>
        </div>
        <ul className="space-y-1.5">
          {semester.moduleSlugs.map((slug) => {
            const mod = modulesBySlug.get(slug);
            return (
              <li key={slug} className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 shrink-0" />
                {mod?.title ?? slug}
              </li>
            );
          })}
        </ul>
      </div>
      {showConnector && (
        <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10">
          <ChevronRight className="w-4 h-4 text-emerald-500/50" />
        </div>
      )}
    </motion.div>
  );
}
