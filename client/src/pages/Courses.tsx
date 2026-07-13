/**
 * Learn / Courses — modules grouped by 6-track curriculum architecture
 */
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, BookOpen, Clock, GraduationCap, Layers } from "lucide-react";
import SEO from "@/components/SEO";
import { trpc } from "@/lib/trpc";
import { isCardFormatLesson } from "@shared/lessonCardContent";
import { getLearningPathBySlug, getModuleHubId } from "@shared/lessonPracticeMap";
import { getHubById } from "@shared/hubRegistry";
import { CURRICULUM_TRACKS, MODULE_CURRICULUM_TRACK } from "@shared/curriculumArchitecture";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.45 },
};

type ModuleRow = {
  slug: string;
  title: string;
  description: string;
  path: string;
  estimatedHours?: number | null;
  actualLessonCount?: number;
  totalLessons?: number | null;
};

function moduleHasCardFormat(moduleSlug: string): boolean {
  const path = getLearningPathBySlug(moduleSlug);
  if (!path) return false;
  return path.units.some((u) => isCardFormatLesson(moduleSlug, u.lessonSlug));
}

function ModuleCard({ mod }: { mod: ModuleRow }) {
  const hubId = getModuleHubId(mod.slug);
  const hub = hubId ? getHubById(hubId) : undefined;
  const hasCardFormat = moduleHasCardFormat(mod.slug);
  const lessonCount = mod.actualLessonCount ?? mod.totalLessons ?? 0;

  return (
    <Link
      href={`/courses/${mod.slug}`}
      className="block card-panel p-6 h-full group hover:border-[oklch(0.55_0.12_155/30%)] transition-colors"
    >
      <div className="flex flex-wrap items-start gap-2 mb-3">
        {hub && (
          <span className="text-[10px] font-mono uppercase px-2 py-1 rounded border border-[oklch(0.55_0.12_155/30%)] bg-[oklch(0.55_0.12_155/8%)] text-[oklch(0.65_0.10_155)]">
            {hub.title}
          </span>
        )}
        {hasCardFormat && (
          <span className="text-[10px] font-mono uppercase px-2 py-1 rounded border border-[oklch(0.60_0.12_80/30%)] bg-[oklch(0.60_0.12_80/8%)] text-[oklch(0.75_0.10_80)]">
            New: Slide Format
          </span>
        )}
      </div>
      <h3 className="text-lg font-heading text-white mb-2 group-hover:text-[oklch(0.55_0.12_155)] transition-colors">
        {mod.title}
      </h3>
      <p className="text-base text-[oklch(0.58_0.008_250)] leading-relaxed mb-4 line-clamp-3">
        {mod.description}
      </p>
      <div className="flex flex-wrap items-center gap-4 text-sm text-[oklch(0.50_0.008_250)]">
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          {lessonCount} lessons
        </span>
        {mod.estimatedHours ? (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />~{mod.estimatedHours}h
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function ModuleCardSkeleton() {
  return (
    <div className="card-panel p-6 animate-pulse">
      <div className="h-5 w-2/3 bg-[oklch(0.15_0.003_250)] rounded mb-3" />
      <div className="h-4 w-full bg-[oklch(0.12_0.003_250)] rounded mb-2" />
      <div className="h-4 w-4/5 bg-[oklch(0.12_0.003_250)] rounded" />
    </div>
  );
}

function TrackSection({
  trackNumber,
  name,
  description,
  exitCompetency,
  prerequisiteLabel,
  modules,
}: {
  trackNumber: number;
  name: string;
  description: string;
  exitCompetency: string;
  prerequisiteLabel: string;
  modules: ModuleRow[];
}) {
  if (modules.length === 0) return null;

  return (
    <div>
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[oklch(0.55_0.12_155/15%)] border border-[oklch(0.55_0.12_155/30%)] text-sm font-mono text-[oklch(0.65_0.10_155)]">
            {trackNumber}
          </span>
          <h2 className="text-xl font-heading text-white tracking-wide">{name}</h2>
        </div>
        <p className="text-base text-[oklch(0.65_0.008_250)] leading-relaxed max-w-3xl">{description}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[oklch(0.20_0.004_250)] bg-[oklch(0.12_0.003_250)] text-[oklch(0.55_0.008_250)]">
            <Layers className="w-3 h-3" />
            Prerequisites: {prerequisiteLabel}
          </span>
        </div>
        <p className="text-sm text-[oklch(0.50_0.008_250)] italic max-w-3xl">
          Exit competency: {exitCompetency}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {modules.map((mod, i) => (
          <motion.div key={mod.slug} {...fadeIn} transition={{ delay: i * 0.05 }}>
            <ModuleCard mod={mod} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function Courses() {
  const { data: modules, isLoading } = trpc.courses.listModules.useQuery();

  const moduleBySlug = new Map((modules ?? []).map((m) => [m.slug, m as ModuleRow]));

  const trackSections = CURRICULUM_TRACKS.map((track) => ({
    track,
    modules: track.moduleSlugs
      .map((slug) => moduleBySlug.get(slug))
      .filter((m): m is ModuleRow => Boolean(m)),
  }));

  const mappedSlugs = new Set(Object.keys(MODULE_CURRICULUM_TRACK));
  const additionalModules = (modules ?? []).filter(
    (m) => !mappedSlugs.has(m.slug)
  ) as ModuleRow[];

  return (
    <div className="overflow-x-hidden pb-8">
      <SEO
        title="Learn — Skill Tracks"
        description="Six-track industrial maintenance curriculum: electrical fundamentals through PLC, drives, instrumentation, and mechanical reliability."
        path="/courses"
      />

      <section className="py-12 sm:py-16 border-b border-[oklch(0.16_0.004_250)]">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.55_0.12_155/10%)] border border-[oklch(0.55_0.12_155/20%)] text-xs text-[oklch(0.65_0.10_155)] mb-4">
              <GraduationCap className="w-3.5 h-3.5" />
              Learn
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading text-white tracking-wide mb-3">
              Six-Track Curriculum
            </h1>
            <p className="text-base text-[oklch(0.65_0.008_250)] leading-relaxed mb-4">
              Progress from electrical fundamentals to job-ready PLC, drive, instrumentation, and mechanical
              reliability skills. Each track builds on the previous — follow the sequence for the fastest path
              from zero to competent maintenance technician.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-[oklch(0.55_0.008_250)]">
              {CURRICULUM_TRACKS.map((track) => (
                <span
                  key={track.id}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[oklch(0.18_0.004_250)]"
                >
                  <span className="font-mono text-[oklch(0.65_0.10_155)]">{track.trackNumber}</span>
                  {track.name}
                  {track.trackNumber < CURRICULUM_TRACKS.length && (
                    <ArrowRight className="w-3 h-3 opacity-40" />
                  )}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12">
        <div className="container space-y-14">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <ModuleCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              {trackSections.map(({ track, modules: trackModules }) => (
                <TrackSection
                  key={track.id}
                  trackNumber={track.trackNumber}
                  name={track.name}
                  description={track.description}
                  exitCompetency={track.exitCompetency}
                  prerequisiteLabel={
                    track.prerequisites.length === 0
                      ? "None — start here"
                      : track.prerequisites
                          .map((id) => CURRICULUM_TRACKS.find((t) => t.id === id)?.name ?? id)
                          .join(" + ")
                  }
                  modules={trackModules}
                />
              ))}

              {additionalModules.length > 0 && (
                <div>
                  <h2 className="text-xl font-heading text-white tracking-wide mb-2">Additional Courses</h2>
                  <p className="text-sm text-[oklch(0.55_0.008_250)] mb-6 max-w-2xl">
                    Supplementary modules outside the core six-track sequence — robotics, specialty topics, and
                    extended content.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {additionalModules.map((mod, i) => (
                      <motion.div key={mod.slug} {...fadeIn} transition={{ delay: i * 0.05 }}>
                        <ModuleCard mod={mod} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
