/**
 * PLC Hub — aggregates existing PLC lessons, labs, and Conveyor benchmark (A5).
 */
import { Link } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  Cpu,
  ExternalLink,
  FlaskConical,
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

const MODULE_SLUG = "plc-fundamentals";

export default function PlcHub() {
  const hub = getHubById("plc");
  const paths = getHubDashboardPaths("plc");
  const primaryPath = paths[0];
  const benchmark = hub ? getCatalogEntry(hub.benchmarkSimulatorId) : undefined;

  const benchmarkLesson = getLessonUnit(MODULE_SLUG, "program-troubleshooting");
  const benchmarkTroubleshoot = benchmarkLesson?.iluLinks.find((l) => l.stage === "troubleshoot");
  const benchmarkHref =
    benchmarkTroubleshoot && hub
      ? buildIluCtaHref({
          link: benchmarkTroubleshoot,
          moduleSlug: MODULE_SLUG,
          lessonSlug: "program-troubleshooting",
          hubId: "plc",
        })
      : "/labs?hub=plc&ilu=troubleshoot#conveyor-troubleshoot";

  const hubSimulators = getCatalogByHubId("plc").filter(
    (e) => e.clickable && e.status === "production" && e.id !== hub?.benchmarkSimulatorId
  );

  const plcIoLesson = getLessonUnit(MODULE_SLUG, "plc-architecture");
  const plcIoLink = plcIoLesson?.iluLinks.find((l) => l.stage === "troubleshoot" && l.targetSlug === "plc-io-fault-v3");
  const plcIoHref =
    plcIoLink && hub
      ? buildIluCtaHref({
          link: plcIoLink,
          moduleSlug: MODULE_SLUG,
          lessonSlug: "plc-architecture",
          hubId: "plc",
        })
      : null;

  if (!hub || !primaryPath) {
    return (
      <div className="container py-16 text-center text-[oklch(0.55_0.008_250)]">
        PLC Hub configuration unavailable.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="PLC Hub — EASLearn"
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
            <div className="p-3 rounded-xl bg-[oklch(0.55_0.12_155/12%)] border border-[oklch(0.55_0.12_155/25%)]">
              <Cpu className="w-8 h-8 text-[oklch(0.55_0.12_155)]" />
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
            secondaryLabel="PLC Fundamentals course"
            ctaLabel="Open Conveyor Lab"
          />
        )}

        {/* Learning path */}
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">{primaryPath.pathTitle}</h2>
              <p className="text-sm text-[oklch(0.50_0.008_250)] mt-1">
                {primaryPath.units.length} lessons · Allen-Bradley PLC fundamentals
              </p>
            </div>
            <Link
              href={`/courses/${MODULE_SLUG}`}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[oklch(0.55_0.12_155)] hover:text-white border border-[oklch(0.55_0.12_155/30%)] rounded px-3 py-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Course module
            </Link>
          </div>
          <div className="space-y-3">
            {primaryPath.units.map((unit) => (
              <HubLessonCard
                key={unit.lessonSlug}
                moduleSlug={MODULE_SLUG}
                unit={unit}
                hubId="plc"
              />
            ))}
          </div>
        </section>

        {/* Related scenarios & practice */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-1">Related labs & scenarios</h2>
          <p className="text-sm text-[oklch(0.50_0.008_250)] mb-4">
            Existing assets linked from PLC lessons — no new exercises.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {plcIoHref && (
              <Link href={plcIoHref}>
                <div className="card-panel p-4 h-full hover:border-[oklch(0.55_0.12_155/25%)] transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <FlaskConical className="w-4 h-4 text-[oklch(0.55_0.12_250)]" />
                    <span className="text-xs font-mono uppercase text-[oklch(0.45_0.006_250)]">V3 Scenario</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">PLC I/O Signal Wire Fault</h3>
                  <p className="text-xs text-[oklch(0.55_0.008_250)] mt-1">
                    From PLC Architecture lesson — PNP sensor path, half-split tracing.
                  </p>
                </div>
              </Link>
            )}
            <Link href="/labs?hub=plc&module=plc-fundamentals&lesson=ladder-logic-basics&ilu=practice#ladder">
              <div className="card-panel p-4 h-full hover:border-[oklch(0.55_0.12_155/25%)] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <FlaskConical className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
                  <span className="text-xs font-mono uppercase text-[oklch(0.45_0.006_250)]">Practice Lab</span>
                </div>
                <h3 className="text-sm font-semibold text-white">Ladder Logic Lab</h3>
                <p className="text-xs text-[oklch(0.55_0.008_250)] mt-1">
                  Contacts, coils, and timer rungs — ladder-logic-basics ILU practice.
                </p>
              </div>
            </Link>
            {hubSimulators.map((sim) => {
              const href = `/simulator?scenario=${encodeURIComponent(sim.id)}&hub=plc`;
              return (
                <Link key={sim.id} href={href}>
                  <div className="card-panel p-4 h-full hover:border-[oklch(0.55_0.12_155/25%)] transition-colors">
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
          <h2 className="text-sm font-mono text-[oklch(0.55_0.12_155)] uppercase tracking-wider mb-3">
            How this hub works
          </h2>
          <p className="text-sm text-[oklch(0.60_0.008_250)] leading-relaxed">
            Each lesson follows the integrated learning unit: read the lesson, practice in labs, troubleshoot in the
            Conveyor benchmark (or linked V3 scenario), then assess your diagnosis.
          </p>
          <p className="mt-3 text-[11px] font-mono text-[oklch(0.42_0.006_250)]">
            Example ILU links:{" "}
            {getLessonIluLinks(MODULE_SLUG, "io-troubleshooting", "A")
              .map((l) => l.stage)
              .join(" → ")}
          </p>
        </section>
      </div>
    </div>
  );
}
