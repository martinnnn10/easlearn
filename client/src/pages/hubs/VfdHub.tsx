/**
 * PowerFlex VFD Hub — aggregates VFD lessons, labs, and V3 scenarios (A7).
 */
import { useMemo } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  FlaskConical,
  Gauge,
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

const MODULE_SLUG = "powerflex-vfd";

function orderUnitsByHubPreference(units: LessonUnit[], order?: string[]): LessonUnit[] {
  if (!order?.length) return units;
  return [...units].sort((a, b) => {
    const ai = order.indexOf(a.lessonSlug);
    const bi = order.indexOf(b.lessonSlug);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

export default function VfdHub() {
  const hub = getHubById("vfd");
  const paths = getHubDashboardPaths("vfd");
  const primaryPath = paths[0];
  const benchmark = hub ? getCatalogEntry(hub.benchmarkSimulatorId) : undefined;

  const orderedUnits = useMemo(
    () => (primaryPath ? orderUnitsByHubPreference(primaryPath.units, hub?.hubLessonOrder) : []),
    [primaryPath, hub?.hubLessonOrder]
  );

  const hubAssets = getCatalogByHubId("vfd").filter(
    (e) => e.id !== hub?.benchmarkSimulatorId
  );

  const productionLabs = hubAssets.filter(
    (e) => e.engine === "lab" && e.clickable && e.status === "production"
  );

  const productionScenarios = hubAssets.filter(
    (e) => e.engine === "v3" && e.clickable && e.status === "production"
  );

  const paramLesson = getLessonUnit(MODULE_SLUG, "powerflex-parameter-groups");
  const paramPractice = paramLesson?.iluLinks.find((l) => l.stage === "practice");
  const paramLabHref =
    paramPractice && hub
      ? buildIluCtaHref({
          link: paramPractice,
          moduleSlug: MODULE_SLUG,
          lessonSlug: "powerflex-parameter-groups",
          hubId: "vfd",
        })
      : "/labs?hub=vfd&module=powerflex-vfd&lesson=powerflex-parameter-groups&ilu=practice#vfd";

  const fundamentalsLesson = getLessonUnit(MODULE_SLUG, "vfd-fundamentals");
  const circuitPractice = fundamentalsLesson?.iluLinks.find((l) => l.stage === "practice");
  const circuitLabHref =
    circuitPractice && hub
      ? buildIluCtaHref({
          link: circuitPractice,
          moduleSlug: MODULE_SLUG,
          lessonSlug: "vfd-fundamentals",
          hubId: "vfd",
        })
      : null;

  const faultCodesLesson = getLessonUnit(MODULE_SLUG, "fault-codes-diagnostics");
  const benchmarkTroubleshoot = faultCodesLesson?.iluLinks.find((l) => l.stage === "troubleshoot");
  const benchmarkHref =
    benchmarkTroubleshoot && hub
      ? buildIluCtaHref({
          link: benchmarkTroubleshoot,
          moduleSlug: MODULE_SLUG,
          lessonSlug: "fault-codes-diagnostics",
          hubId: "vfd",
        })
      : "/labs?hub=vfd&ilu=troubleshoot#powerflex-diagnostic";

  const multimeterPractice = faultCodesLesson?.iluLinks.find((l) => l.stage === "practice");
  const multimeterHref =
    multimeterPractice && hub
      ? buildIluCtaHref({
          link: multimeterPractice,
          moduleSlug: MODULE_SLUG,
          lessonSlug: "fault-codes-diagnostics",
          hubId: "vfd",
        })
      : null;

  function scenarioHrefFromLesson(lessonSlug: string, scenarioId: string): string | null {
    const unit = getLessonUnit(MODULE_SLUG, lessonSlug);
    const troubleshoot = unit?.iluLinks.find(
      (l) => l.stage === "troubleshoot" && l.targetSlug === scenarioId
    );
    if (!troubleshoot || troubleshoot.simulatorStatus === "scaffold") return null;
    return buildIluCtaHref({
      link: troubleshoot,
      moduleSlug: MODULE_SLUG,
      lessonSlug,
      hubId: "vfd",
    });
  }

  if (!hub || !primaryPath) {
    return (
      <div className="container py-16 text-center text-[oklch(0.55_0.008_250)]">
        VFD Hub configuration unavailable.
      </div>
    );
  }

  const isBenchmarkScaffold = hub.benchmarkStatus === "scaffold" || benchmark?.clickable === false;
  const isBenchmarkBeta = benchmark?.status === "beta";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="PowerFlex VFD Hub — EASLearn"
        description={hub.description}
        path={hub.route}
      />

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
            <div className="p-3 rounded-xl bg-[oklch(0.55_0.12_250/12%)] border border-[oklch(0.55_0.12_250/25%)]">
              <Gauge className="w-8 h-8 text-[oklch(0.55_0.12_250)]" />
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
        {benchmark && (
          <HubBenchmarkCard
            hubTitle={hub.title}
            entry={benchmark}
            scaffold={isBenchmarkScaffold}
            scaffoldLabel="Coming Soon"
            primaryHref={benchmarkHref}
            ctaLabel={isBenchmarkBeta ? "Open Beta Diagnostic Lab" : "Open Diagnostic Lab"}
            secondaryHref={`/courses/${MODULE_SLUG}`}
            secondaryLabel="PowerFlex VFD course"
            description="Beta VFD troubleshooting anchor — fault code diagnosis, parameter trace, keypad display, and status monitor. Three faults in v1; not a complete benchmark yet."
          />
        )}

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">{primaryPath.pathTitle}</h2>
              <p className="text-sm text-[oklch(0.50_0.008_250)] mt-1">
                {orderedUnits.length} lessons · PowerFlex 525 drive programming & diagnostics
              </p>
            </div>
            <Link
              href={`/courses/${MODULE_SLUG}`}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[oklch(0.55_0.12_250)] hover:text-white border border-[oklch(0.55_0.12_250/30%)] rounded px-3 py-1.5 transition-colors"
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
                hubId="vfd"
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-1">Related labs & scenarios</h2>
          <p className="text-sm text-[oklch(0.50_0.008_250)] mb-4">
            Production VFD labs and scenarios linked from the lessons. More scenarios are added regularly.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {paramLabHref && (
              <Link href={paramLabHref}>
                <div className="card-panel p-4 h-full hover:border-[oklch(0.55_0.12_250/25%)] transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <FlaskConical className="w-4 h-4 text-[oklch(0.55_0.12_250)]" />
                    <span className="text-xs font-mono uppercase text-[oklch(0.45_0.006_250)]">Practice Lab</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">VFD Parameter Lab</h3>
                  <p className="text-xs text-[oklch(0.55_0.008_250)] mt-1">
                    Parameter groups & navigation — PowerFlex Parameter Groups lesson.
                  </p>
                </div>
              </Link>
            )}
            {circuitLabHref && (
              <Link href={circuitLabHref}>
                <div className="card-panel p-4 h-full hover:border-[oklch(0.55_0.12_250/25%)] transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <FlaskConical className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
                    <span className="text-xs font-mono uppercase text-[oklch(0.45_0.006_250)]">Practice Lab</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">Circuit Flow Lab</h3>
                  <p className="text-xs text-[oklch(0.55_0.008_250)] mt-1">
                    VFD fundamentals prerequisite — power flow through drive stages.
                  </p>
                </div>
              </Link>
            )}
            {multimeterHref && (
              <Link href={multimeterHref}>
                <div className="card-panel p-4 h-full hover:border-[oklch(0.55_0.12_250/25%)] transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <FlaskConical className="w-4 h-4 text-[oklch(0.50_0.008_250)]" />
                    <span className="text-xs font-mono uppercase text-[oklch(0.45_0.006_250)]">Practice Lab</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">Virtual Multimeter Lab</h3>
                  <p className="text-xs text-[oklch(0.55_0.008_250)] mt-1">
                    From Fault Codes lesson — meter technique before drive diagnostics.
                  </p>
                </div>
              </Link>
            )}
            {productionScenarios.map((sim) => {
              const attributed =
                scenarioHrefFromLesson("powerflex-parameter-groups", sim.id) ??
                scenarioHrefFromLesson("basic-programming", sim.id) ??
                `/simulator?scenario=${encodeURIComponent(sim.id)}&hub=vfd`;
              return (
                <Link key={sim.id} href={attributed}>
                  <div className="card-panel p-4 h-full hover:border-[oklch(0.55_0.12_250/25%)] transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="w-4 h-4 text-[oklch(0.50_0.008_250)]" />
                      <span className="text-xs font-mono uppercase text-[oklch(0.45_0.006_250)]">V3 Scenario</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">{sim.title}</h3>
                    <p className="text-xs text-[oklch(0.55_0.008_250)] mt-1 line-clamp-2">
                      {sim.skills.slice(0, 3).join(" · ")}
                    </p>
                  </div>
                </Link>
              );
            })}
            {productionLabs
              .filter((lab) => lab.id !== "vfd-parameter-lab")
              .map((lab) => {
                const href = `/labs?hub=vfd&ilu=practice#${lab.route?.split("#")[1] ?? lab.id}`;
                return (
                  <Link key={lab.id} href={href}>
                    <div className="card-panel p-4 h-full hover:border-[oklch(0.55_0.12_250/25%)] transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <FlaskConical className="w-4 h-4 text-[oklch(0.55_0.12_250)]" />
                        <span className="text-xs font-mono uppercase text-[oklch(0.45_0.006_250)]">Lab</span>
                      </div>
                      <h3 className="text-sm font-semibold text-white">{lab.title}</h3>
                      <p className="text-xs text-[oklch(0.55_0.008_250)] mt-1 line-clamp-2">
                        {lab.skills.slice(0, 3).join(" · ")}
                      </p>
                    </div>
                  </Link>
                );
              })}
          </div>
        </section>

        <section className="card-panel p-5">
          <h2 className="text-sm font-mono text-[oklch(0.55_0.12_250)] uppercase tracking-wider mb-3">
            How this hub works
          </h2>
          <p className="text-sm text-[oklch(0.60_0.008_250)] leading-relaxed">
            Each lesson follows the integrated learning unit: read the lesson, practice in the VFD Parameter Lab
            (or linked labs), troubleshoot in V3 scenarios or the beta PowerFlex Diagnostic Lab, then assess.
            Three faults in v1 — not a complete benchmark yet.
          </p>
          <p className="mt-3 text-[11px] font-mono text-[oklch(0.42_0.006_250)]">
            Example ILU links:{" "}
            {getLessonIluLinks(MODULE_SLUG, "fault-codes-diagnostics", "A")
              .map((l) => l.stage)
              .join(" → ")}
          </p>
        </section>
      </div>
    </div>
  );
}
