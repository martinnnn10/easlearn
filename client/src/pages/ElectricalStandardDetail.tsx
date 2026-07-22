import { Link, useRoute } from "wouter";
import { ArrowLeft, Info } from "lucide-react";
import SEO from "@/components/SEO";
import { getSymbolById, CATEGORY_META, SYMBOL_PRINT_TAGS, SYMBOL_REPRESENTATION } from "@shared/electricalSymbolRegistry";
import { getPublicSymbolById, CONTEXT_LABEL } from "@shared/electricalSymbolTaxonomy";
import StandardsSymbolPreview from "@/components/standards/StandardsSymbolPreview";
import TaxonomySymbolPreview from "@/components/standards/TaxonomySymbolPreview";
import type { SymbolPrimitiveId } from "@shared/electricalSymbolRegistry";
import { LESSON_PRACTICE_MAP } from "@shared/lessonPracticeMap";
import { getCatalogEntry } from "@shared/simulatorCatalog";
import NotFound from "@/pages/NotFound";

function TaxonomyDetail({ id }: { id: string }) {
  const sym = getPublicSymbolById(id)!;
  return (
    <div className="min-h-screen bg-background">
      <SEO title={`${sym.name} — Symbol Library`} description={sym.description} path={`/reference/electrical/${sym.id}`} />
      <div className="container max-w-3xl py-12">
        <Link href="/reference/electrical" className="inline-flex items-center gap-2 text-sm text-[oklch(0.55_0.008_250)] hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" /> Symbol Library
        </Link>
        <div className="card-panel p-6 mb-6">
          <div className="bg-[oklch(0.06_0.003_250)] rounded-lg border border-[oklch(0.14_0.004_250)] p-6 mb-6 flex items-center justify-center">
            <div className="w-56 h-56 max-w-full">
              <TaxonomySymbolPreview renderKey={sym.renderKey} />
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-3 mb-2">
            <h1 className="text-2xl font-heading text-white">{sym.name}</h1>
            {sym.exampleTag && (
              <span title="Example print tag — varies by plant" className="text-xs font-mono px-2 py-0.5 rounded border border-[oklch(0.30_0.02_155)] text-[oklch(0.62_0.10_155)] bg-[oklch(0.55_0.12_155/8%)]">{sym.exampleTag}</span>
            )}
          </div>
          <p className="text-[11px] font-mono uppercase tracking-wide text-[oklch(0.52_0.05_155)] mb-2">{CONTEXT_LABEL[sym.context]}</p>
          <p className="text-[oklch(0.62_0.008_250)] leading-relaxed mb-4">{sym.description}</p>
          {sym.note && (
            <div className="flex items-start gap-2 mb-4 rounded-lg border border-[oklch(0.72_0.11_75/25%)] bg-[oklch(0.72_0.11_75/8%)] px-3 py-2.5">
              <Info className="w-4 h-4 text-[oklch(0.72_0.11_75)] shrink-0 mt-0.5" />
              <p className="text-sm text-[oklch(0.78_0.10_75)] leading-relaxed">{sym.note}</p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase block mb-1">Represents</span>
              <p className="text-[oklch(0.65_0.008_250)]">{sym.represents}</p>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase block mb-1">Source</span>
              <p className="text-[oklch(0.65_0.008_250)]">{sym.source}</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-[oklch(0.45_0.006_250)] leading-relaxed">
          Geometry source-confirmed for this card (PLC instruction / functional block). Any print tag shown
          {sym.exampleTag ? ` (e.g. ${sym.exampleTag})` : ""} is an example for reference only; actual plant prints may vary.
        </p>
      </div>
    </div>
  );
}

function resolveLessonHref(lessonSlug: string): { href: string; title: string; moduleSlug: string } | null {
  for (const path of LESSON_PRACTICE_MAP) {
    const unit = path.units.find((l) => l.lessonSlug === lessonSlug);
    if (unit) {
      return {
        href: `/courses/${path.pathSlug}/${lessonSlug}`,
        title: unit.lessonTitle,
        moduleSlug: path.pathSlug,
      };
    }
  }
  return null;
}

export default function ElectricalStandardDetail() {
  const [, params] = useRoute("/reference/electrical/:symbolId");
  const symbolId = params?.symbolId;

  // Published taxonomy symbols (PLC instructions, functional blocks) render first.
  if (symbolId && getPublicSymbolById(symbolId)) return <TaxonomyDetail id={symbolId} />;

  // Symbols restructured/removed in the taxonomy remediation must not render their old glyph.
  const RESTRUCTURED: Record<string, string> = {
    timer_contact: "Timer symbols were removed pending the exact NEMA ICS 19 timer-relay family (and are separated from PLC timer instructions).",
    safety_relay: "The safety relay is now a functional module, not a coil — see “Safety Relay / Monitoring Module”.",
    vfd: "The generic VFD fault contact was replaced by “VFD Relay Output — Configurable”.",
  };
  if (symbolId && RESTRUCTURED[symbolId]) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-3xl py-12">
          <Link href="/reference/electrical" className="inline-flex items-center gap-2 text-sm text-[oklch(0.55_0.008_250)] hover:text-white mb-8">
            <ArrowLeft className="w-4 h-4" /> Symbol Library
          </Link>
          <div className="card-panel p-6 flex items-start gap-3">
            <Info className="w-5 h-5 text-[oklch(0.72_0.11_75)] shrink-0 mt-0.5" />
            <div>
              <h1 className="text-xl font-heading text-white mb-2">Symbol restructured</h1>
              <p className="text-sm text-[oklch(0.62_0.008_250)] leading-relaxed">{RESTRUCTURED[symbolId]}</p>
              <Link href="/reference/electrical" className="inline-block mt-4 text-sm text-[oklch(0.62_0.10_155)] hover:text-white">Go to the Symbol Library →</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Legacy registry detail (kept so existing lesson deep-links do not break).
  const entry = symbolId ? getSymbolById(symbolId) : undefined;

  if (!entry) return <NotFound />;

  const relatedLessons = entry.relatedLessonSlugs
    .map((slug) => resolveLessonHref(slug))
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const relatedModules = Array.from(new Set(relatedLessons.map((l) => l.moduleSlug)));

  const relatedSimulators = Array.from(
    new Set([...entry.relatedSimulatorIds, ...entry.relatedLabIds])
  )
    .map((id) => getCatalogEntry(id))
    .filter((x): x is NonNullable<typeof x> => x !== undefined);

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`${entry.name} — Standards`} description={entry.description} path={`/reference/electrical/${entry.id}`} />

      <div className="container max-w-3xl py-12">
        <Link href="/reference/electrical" className="inline-flex items-center gap-2 text-sm text-[oklch(0.55_0.008_250)] hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" /> Standards Library
        </Link>

        <div className="card-panel p-6 mb-6">
          <div className="bg-[oklch(0.06_0.003_250)] rounded-lg border border-[oklch(0.14_0.004_250)] p-6 mb-6 flex items-center justify-center">
            <div className="w-56 h-56 max-w-full">
              <StandardsSymbolPreview symbolId={entry.id as SymbolPrimitiveId} />
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-3 mb-2">
            <h1 className="text-2xl font-heading text-white">{entry.name}</h1>
            {SYMBOL_PRINT_TAGS[entry.id] && (
              <span
                title="Example print tag — varies by plant"
                className="text-xs font-mono px-2 py-0.5 rounded border border-[oklch(0.30_0.02_155)] text-[oklch(0.62_0.10_155)] bg-[oklch(0.55_0.12_155/8%)]"
              >
                {SYMBOL_PRINT_TAGS[entry.id]}
              </span>
            )}
          </div>
          {SYMBOL_REPRESENTATION[entry.id] && (
            <p className="text-[11px] font-mono uppercase tracking-wide text-[oklch(0.52_0.05_155)] mb-2">
              {SYMBOL_REPRESENTATION[entry.id]}
            </p>
          )}
          <p className="text-[oklch(0.62_0.008_250)] leading-relaxed mb-4">{entry.description}</p>

          {entry.contextNote && (
            <div className="flex items-start gap-2 mb-4 rounded-lg border border-[oklch(0.72_0.11_75/25%)] bg-[oklch(0.72_0.11_75/8%)] px-3 py-2.5">
              <Info className="w-4 h-4 text-[oklch(0.72_0.11_75)] shrink-0 mt-0.5" />
              <p className="text-sm text-[oklch(0.78_0.10_75)] leading-relaxed">{entry.contextNote}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase block mb-1">Function</span>
              <p className="text-[oklch(0.65_0.008_250)]">{entry.function}</p>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase block mb-1">Typical Use</span>
              <p className="text-[oklch(0.65_0.008_250)]">{entry.typicalUse}</p>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase block mb-1">NEMA / JIC / NFPA 79</span>
              <p className="text-[oklch(0.65_0.008_250)] font-mono text-xs">{entry.nemaJicReference}</p>
            </div>
          </div>
        </div>

        {entry.industrialApplications && entry.industrialApplications.length > 0 && (
          <div className="card-panel p-5 mb-4">
            <h2 className="text-sm font-mono text-[oklch(0.55_0.12_155)] uppercase tracking-wider mb-3">Industrial Applications</h2>
            <ul className="space-y-2">
              {entry.industrialApplications.map((item) => (
                <li key={item} className="text-sm text-[oklch(0.65_0.008_250)] leading-relaxed flex gap-2">
                  <span className="text-[oklch(0.55_0.12_155)] shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {entry.wiringNotes && (
          <div className="card-panel p-5 mb-4">
            <h2 className="text-sm font-mono text-[oklch(0.55_0.12_155)] uppercase tracking-wider mb-3">Wiring & PLC I/O Notes</h2>
            <p className="text-sm text-[oklch(0.65_0.008_250)] leading-relaxed">{entry.wiringNotes}</p>
          </div>
        )}

        <div className="card-panel p-5 mb-4">
          <h2 className="text-sm font-mono text-[oklch(0.55_0.12_155)] uppercase tracking-wider mb-3">Aliases</h2>
          <div className="flex flex-wrap gap-2">
            {entry.aliases.map((a) => (
              <span key={a} className="text-[11px] font-mono px-2 py-1 rounded bg-[oklch(0.10_0.003_250)] text-[oklch(0.55_0.008_250)]">
                {a}
              </span>
            ))}
          </div>
        </div>

        {(relatedLessons.length > 0 || relatedSimulators.length > 0 || relatedModules.length > 0) && (
          <div className="card-panel p-5 mb-4">
            <h2 className="text-sm font-mono text-[oklch(0.55_0.12_155)] uppercase tracking-wider mb-3">Related Learning</h2>
            <div className="space-y-4">
              {relatedModules.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase block mb-2">Learning Paths</span>
                  <div className="flex flex-wrap gap-2">
                    {relatedModules.map((moduleSlug) => (
                      <Link
                        key={moduleSlug}
                        href={`/courses/${moduleSlug}`}
                        className="text-xs font-mono px-2 py-1 rounded border border-[oklch(0.55_0.12_155/25%)] text-[oklch(0.55_0.12_155)] hover:text-white transition-colors"
                      >
                        {moduleSlug.replace(/-/g, " ")}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {relatedLessons.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase block mb-2">Lessons</span>
                  <div className="space-y-2">
                    {relatedLessons.map((lesson) => (
                      <Link
                        key={lesson.href}
                        href={lesson.href}
                        className="block text-sm text-[oklch(0.65_0.008_250)] hover:text-white transition-colors"
                      >
                        {lesson.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {relatedSimulators.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase block mb-2">Simulators & Labs</span>
                  <div className="space-y-2">
                    {relatedSimulators.map((sim) => (
                      <Link
                        key={sim.id}
                        href={sim.route ?? "/labs"}
                        className="block text-sm text-[oklch(0.65_0.008_250)] hover:text-white transition-colors"
                      >
                        {sim.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="card-panel p-5">
          <h2 className="text-sm font-mono text-[oklch(0.55_0.12_155)] uppercase tracking-wider mb-3">Category</h2>
          <p className="text-sm text-white">{CATEGORY_META[entry.category].title}</p>
          <p className="text-xs text-[oklch(0.50_0.008_250)] mt-1">{CATEGORY_META[entry.category].description}</p>
        </div>

        <p className="mt-6 text-xs text-[oklch(0.45_0.006_250)] leading-relaxed">
          Simplified EASLearn training symbol based on common North American motor-control conventions
          (NEMA / JIC / NFPA 79); actual plant or OEM prints may vary. Any print tag shown
          {SYMBOL_PRINT_TAGS[entry.id] ? ` (e.g. ${SYMBOL_PRINT_TAGS[entry.id]})` : ""} is an example for reference only.
        </p>
      </div>
    </div>
  );
}
