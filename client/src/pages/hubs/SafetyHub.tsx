/**
 * Safety Systems Hub — aggregates safety lessons, labs, and Conveyor benchmark (E-Stop).
 */
import { useMemo } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  FlaskConical,
  ShieldAlert,
} from "lucide-react";
import SEO from "@/components/SEO";
import HubBenchmarkCard from "@/components/hubs/HubBenchmarkCard";
import HubLessonCard from "@/components/hubs/HubLessonCard";
import { getHubById, TRACK_A_ILU_STAGES } from "@shared/hubRegistry";
import { buildIluCtaHref } from "@shared/iluLinks";
import {
  getHubDashboardPaths,
  getLessonIluLinks,
  getLessonUnit,
} from "@shared/lessonPracticeMap";
import { getCatalogEntry, getCatalogByHubId } from "@shared/simulatorCatalog";
import type { LessonUnit } from "@shared/hubRegistry";

const MODULE_SLUG = "safety-systems";

function orderUnitsByHubPreference(units: LessonUnit[], order?: string[]): LessonUnit[] {
  if (!order?.length) return units;
  return [...units].sort((a, b) => {
    const ai = order.indexOf(a.lessonSlug);
    const bi = order.indexOf(b.lessonSlug);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

export default function SafetyHub() {
  const hub = getHubById("safety");
  const paths = getHubDashboardPaths("safety");
  const primaryPath = paths[0];
  const benchmark = hub ? getCatalogEntry(hub.benchmarkSimulatorId) : undefined;

  const orderedUnits = useMemo(
    () => (primaryPath ? orderUnitsByHubPreference(primaryPath.units, hub?.hubLessonOrder) : []),
    [primaryPath, hub?.hubLessonOrder]
  );

  // E-Stop benchmark link
  const estopLesson = getLessonUnit(MODULE_SLUG, "estop-circuits");
  const benchmarkTroubleshoot = estopLesson?.iluLinks.find((l) => l.stage === "troubleshoot");
  const benchmarkHref =
    benchmarkTroubleshoot && hub
      ? buildIluCtaHref({
          link: benchmarkTroubleshoot,
          moduleSlug: MODULE_SLUG,
          lessonSlug: "estop-circuits",
          hubId: "safety",
        })
      : "/labs?hub=safety&ilu=troubleshoot#conveyor-troubleshoot";

  // Related scenarios and labs
  const hubSimulators = getCatalogByHubId("safety").filter(
    (e) => e.clickable && e.status === "production" && e.id !== hub?.benchmarkSimulatorId
  );

  // Relay simulator practice link
  const relayPractice = estopLesson?.iluLinks.find((l) => l.stage === "practice");
  const relayLabHref =
    relayPractice && hub
      ? buildIluCtaHref({
          link: relayPractice,
          moduleSlug: MODULE_SLUG,
          lessonSlug: "estop-circuits",
          hubId: "safety",
        })
      : "/labs?hub=safety&module=safety-systems&lesson=estop-circuits&ilu=practice#relay";

  if (!hub || !primaryPath) {
    return (
      <div className="container py-16 text-center text-[oklch(0.55_0.008_250)]">
        Safety Hub configuration unavailable.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Safety Systems Hub — EASLearn"
        description={hub.description}
        path={hub.route}
      />

      {/* Header */}
      <section className="border-b border-[oklch(0.18_0.004_250)] py-10 sm:py-14">
        <div className="container max-w-4xl">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-sm text-[oklch(0.55_0.008_250)] hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            All courses
          </Link>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[oklch(0.55_0.12_30/12%)] border border-[oklch(0.55_0.12_30/25%)]">
              <ShieldAlert className="w-8 h-8 text-[oklch(0.65_0.15_30)]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading text-white tracking-wide">{hub.title}</h1>
              <p className="mt-2 text-[oklch(0.60_0.008_250)] leading-relaxed max-w-2xl">{hub.description}</p>
              <p className="mt-3 text-[11px] font-mono text-[oklch(0.45_0.006_250)]">
                ILU chain: {TRACK_A_ILU_STAGES.map((s) => s.replace("_", " ")).join(" → ")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container max-w-4xl py-10 space-y-10">
        {/* Benchmark */}
        {benchmark && (
          <HubBenchmarkCard
            hubTitle={hub.title}
            entry={benchmark}
            primaryHref={benchmarkHref}
            secondaryHref={`/courses/${MODULE_SLUG}`}
            secondaryLabel="Safety Systems course"
            ctaLabel="Open Conveyor Lab — E-Stop Fault"
          />
        )}

        {/* Learning path */}
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">{primaryPath.pathTitle}</h2>
              <p className="text-sm text-[oklch(0.50_0.008_250)] mt-1">
                {orderedUnits.length} lessons · Risk assessment, E-stop circuits, guarding & LOTO
              </p>
            </div>
            <Link
              href={`/courses/${MODULE_SLUG}`}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[oklch(0.65_0.15_30)] hover:text-white border border-[oklch(0.65_0.15_30/30%)] rounded px-3 py-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Course module
            </Link>
          </div>
          <div className="space-y-3">
            {orderedUnits.map((unit) => (
              <HubLessonCard
                key={unit.lessonSlug}
                moduleSlug={MODULE_SLUG}
                unit={unit}
                hubId="safety"
              />
            ))}
          </div>
        </section>

        {/* Related scenarios & practice */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-1">Related labs & scenarios</h2>
          <p className="text-sm text-[oklch(0.50_0.008_250)] mb-4">
            Safety-related practice assets linked from lessons.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {relayLabHref && (
              <Link href={relayLabHref}>
                <div className="card-panel p-4 h-full hover:border-[oklch(0.65_0.15_30/25%)] transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <FlaskConical className="w-4 h-4 text-[oklch(0.65_0.15_30)]" />
                    <span className="text-xs font-mono uppercase text-[oklch(0.45_0.006_250)]">Practice Lab</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">Relay Simulator</h3>
                  <p className="text-xs text-[oklch(0.55_0.008_250)] mt-1">
                    From E-Stop Circuits lesson — safety relay energize/de-energize behavior.
                  </p>
                </div>
              </Link>
            )}
            {hubSimulators.map((sim) => {
              const href = `/simulator?scenario=${encodeURIComponent(sim.id)}&hub=safety`;
              return (
                <Link key={sim.id} href={href}>
                  <div className="card-panel p-4 h-full hover:border-[oklch(0.65_0.15_30/25%)] transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="w-4 h-4 text-[oklch(0.50_0.008_250)]" />
                      <span className="text-xs font-mono uppercase text-[oklch(0.45_0.006_250)]">
                        {sim.engine.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">{sim.title}</h3>
                    <p className="text-xs text-[oklch(0.55_0.008_250)] mt-1 line-clamp-2">
                      {sim.skills.slice(0, 3).join(" · ")}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ILU reference */}
        <section className="card-panel p-5">
          <h2 className="text-sm font-mono text-[oklch(0.65_0.15_30)] uppercase tracking-wider mb-3">
            How this hub works
          </h2>
          <p className="text-sm text-[oklch(0.60_0.008_250)] leading-relaxed">
            Each lesson follows the integrated learning unit: read the lesson, practice in labs (relay simulator),
            troubleshoot in the Conveyor benchmark (E-Stop fault mode), then assess via the module quiz.
            Risk assessment covers ISO 12100 / Performance Levels; E-Stop covers safety chains and Category 3 circuits.
          </p>
          <p className="mt-3 text-[11px] font-mono text-[oklch(0.42_0.006_250)]">
            Example ILU links:{" "}
            {getLessonIluLinks(MODULE_SLUG, "estop-circuits", "A")
              .map((l) => l.stage)
              .join(" → ")}
          </p>
        </section>
      </div>
    </div>
  );
}
