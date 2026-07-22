import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Search, BookOpen, Wrench, Info, Lock } from "lucide-react";
import SEO from "@/components/SEO";
import { PRINT_READING_STANDARDS } from "@shared/electricalSymbolRegistry";
import {
  PUBLISHED_SECTIONS,
  PENDING_LIBRARY,
  CONTEXT_LABEL,
  getAllPublicSymbols,
  pendingRecordCount,
} from "@shared/electricalSymbolTaxonomy";
import type { PublicSymbol } from "@shared/electricalSymbolTaxonomy";
import { TROUBLESHOOTING_REFERENCES } from "@shared/troubleshootingReferenceCatalog";
import TaxonomySymbolPreview from "@/components/standards/TaxonomySymbolPreview";

export default function ElectricalStandardsLibrary() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return [];
    return getAllPublicSymbols().filter((s) =>
      [s.name, s.description, s.represents, s.designation ?? "", CONTEXT_LABEL[s.context]]
        .join(" ").toLowerCase().includes(q)
    );
  }, [q]);
  const pendingCount = pendingRecordCount();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Electrical Symbol Library"
        description="Source-controlled electrical notation reference. PLC ladder instructions and functional blocks are shown; hardwired NEMA/JIC symbols are withheld pending licensed ICS 19 geometry and SME review."
        path="/reference/electrical"
      />

      <section className="py-16 border-b border-[oklch(0.18_0.004_250)]">
        <div className="container max-w-5xl">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-[oklch(0.55_0.12_155)]" />
            <h1 className="text-3xl font-heading text-white tracking-wide">Electrical Symbol Library</h1>
          </div>
          <p className="text-base text-[oklch(0.62_0.008_250)] leading-relaxed mb-4 max-w-3xl">
            Common schematic symbols used in EASLearn labs and troubleshooting lessons, organized by the
            context each symbol belongs to — physical device, hardwired control schematic, power circuit,
            one-line, PLC ladder instruction, or functional block.
          </p>
          <div className="flex items-start gap-2 mb-6 max-w-3xl rounded-lg border border-[oklch(0.20_0.004_250)] bg-[oklch(0.09_0.003_250)] px-3 py-2.5">
            <Info className="w-4 h-4 text-[oklch(0.55_0.008_250)] shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-[oklch(0.55_0.008_250)]">
              This library is being rebuilt against authoritative sources. Only symbols whose geometry is
              independently source-confirmed are drawn here: <span className="text-[oklch(0.68_0.008_250)]">PLC ladder
              instructions</span> (per Rockwell) and <span className="text-[oklch(0.68_0.008_250)]">functional blocks</span> (per
              vendor documentation). Hardwired NEMA/JIC symbols are <span className="text-[oklch(0.68_0.008_250)]">withheld
              until their exact geometry is confirmed against licensed NEMA ICS 19 and reviewed by a qualified SME</span> —
              accuracy over symbol count. Example print tags are for reference only; real prints vary.
            </p>
          </div>
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.45_0.006_250)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search published symbols (e.g. XIC, timer, safety relay)..."
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[oklch(0.08_0.003_250)] border border-[oklch(0.18_0.004_250)] text-white placeholder:text-[oklch(0.40_0.006_250)] focus:outline-none focus:border-[oklch(0.55_0.12_155/40%)]"
            />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-5xl space-y-12">
          {q ? (
            <div>
              <h2 className="text-sm font-mono text-[oklch(0.55_0.12_155)] uppercase tracking-wider mb-5">
                Search Results ({results.length})
              </h2>
              {results.length === 0 ? (
                <p className="text-sm text-[oklch(0.50_0.008_250)]">No published symbols match “{query}”. Hardwired NEMA symbols are withheld pending source review (see below).</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {results.map((s) => <SymbolCard key={s.id} sym={s} />)}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Device vs contact / instruction vs hardware explainer */}
              <div className="rounded-xl border border-[oklch(0.20_0.004_250)] bg-[oklch(0.07_0.003_250)] p-5">
                <h2 className="text-sm font-semibold text-white mb-2">How this library is organized</h2>
                <ul className="text-sm text-[oklch(0.58_0.008_250)] space-y-1.5 leading-relaxed">
                  <li>• A <span className="text-white">physical device</span> (the operator you touch) is separate from its <span className="text-white">electrical contact</span> (the line on the schematic). One card never shows both.</li>
                  <li>• A <span className="text-white">PLC ladder instruction</span> (XIC, XIO, OTE…) evaluates or acts on a <span className="text-white">bit</span> in memory. It is not a physical NO/NC contact or coil.</li>
                  <li>• <span className="text-white">PLC I/O modules</span> are hardware (functional blocks); the instructions that read/drive their bits are a separate library.</li>
                  <li>• A <span className="text-white">safety relay</span> is a functional module (monitored inputs, safety outputs, aux), not a simple coil.</li>
                </ul>
              </div>

              {PUBLISHED_SECTIONS.map((section) => (
                <div key={section.id}>
                  <div className="flex items-baseline justify-between gap-4 mb-1">
                    <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
                    <span className="text-xs font-mono text-[oklch(0.44_0.006_250)] shrink-0">{section.symbols.length} symbols</span>
                  </div>
                  <p className="text-base text-[oklch(0.55_0.008_250)] mb-5 max-w-3xl">{section.description}</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {section.symbols.map((s) => <SymbolCard key={s.id} sym={s} />)}
                  </div>
                </div>
              ))}

              {/* Withheld-pending panel */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="w-5 h-5 text-[oklch(0.62_0.10_75)]" />
                  <h2 className="text-2xl font-semibold text-white">Withheld pending source + SME review</h2>
                  <span className="text-xs font-mono text-[oklch(0.44_0.006_250)]">{pendingCount} records</span>
                </div>
                <p className="text-base text-[oklch(0.55_0.008_250)] mb-5 max-w-3xl">
                  These symbols have confirmed meaning and context, but their exact NEMA/JIC glyph geometry is
                  pending licensed ICS 19 confirmation and qualified SME review. Their records exist in the
                  taxonomy; the glyphs are not drawn until verified.
                </p>
                <div className="space-y-5">
                  {PENDING_LIBRARY.map((g) => (
                    <div key={g.id} className="card-panel p-5">
                      <h3 className="text-base font-semibold text-white">{g.title}</h3>
                      <p className="text-xs text-[oklch(0.52_0.008_250)] mt-1 mb-3 leading-relaxed">{g.note}</p>
                      <ul className="space-y-2">
                        {g.records.map((r) => (
                          <li key={r.name} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                            <span className="text-[oklch(0.72_0.008_250)]">{r.name}</span>
                            {r.noNc && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[oklch(0.12_0.003_250)] text-[oklch(0.55_0.008_250)]">{r.noNc}</span>}
                            <span className="text-[10px] font-mono uppercase tracking-wide text-[oklch(0.62_0.10_75)]">{r.status.replace(/_/g, " ")}</span>
                            <span className="text-xs text-[oklch(0.45_0.006_250)] basis-full">{r.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Print Reading Standards</h2>
                <p className="text-sm text-[oklch(0.52_0.008_250)] mb-5">How symbols are laid out on real drawings.</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  {PRINT_READING_STANDARDS.map((p) => (
                    <div key={p.id} className="card-panel p-4">
                      <h3 className="text-sm font-semibold text-white mb-1">{p.name}</h3>
                      <p className="text-xs text-[oklch(0.55_0.008_250)] mb-2 leading-relaxed">{p.description}</p>
                      <p className="text-[10px] font-mono text-[oklch(0.45_0.006_250)]">{p.nemaJicReference}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-5">
                  <Wrench className="w-5 h-5 text-[oklch(0.55_0.12_155)]" />
                  <h2 className="text-xl font-semibold text-white">Field Troubleshooting References</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {TROUBLESHOOTING_REFERENCES.map((ref) => (
                    <Link key={ref.id} href={`/reference/troubleshooting/${ref.id}`}>
                      <div className="card-panel p-4 hover:border-[oklch(0.55_0.12_155/30%)] transition-colors cursor-pointer h-full">
                        <h3 className="text-sm font-semibold text-white mb-1">{ref.title}</h3>
                        <p className="text-xs text-[oklch(0.55_0.008_250)] line-clamp-2 leading-relaxed">{ref.summary}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function SymbolCard({ sym }: { sym: PublicSymbol }) {
  return (
    <Link href={`/reference/electrical/${sym.id}`}>
      <div className="card-panel p-4 flex gap-4 hover:border-[oklch(0.55_0.12_155/30%)] transition-colors cursor-pointer h-full">
        <div className="w-28 h-28 shrink-0 bg-[oklch(0.06_0.003_250)] rounded-lg border border-[oklch(0.14_0.004_250)] p-2 flex items-center justify-center">
          <TaxonomySymbolPreview renderKey={sym.renderKey} />
        </div>
        <div className="min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-white leading-tight">{sym.name}</h3>
            {sym.exampleTag && (
              <span title="Example print tag — varies by plant" className="shrink-0 mt-0.5 text-[11px] font-mono px-1.5 py-0.5 rounded border border-[oklch(0.30_0.02_155)] text-[oklch(0.62_0.10_155)] bg-[oklch(0.55_0.12_155/8%)]">
                {sym.exampleTag}
              </span>
            )}
          </div>
          <span className="mt-1 text-[10px] font-mono uppercase tracking-wide text-[oklch(0.52_0.05_155)]">{CONTEXT_LABEL[sym.context]}</span>
          <p className="text-sm text-[oklch(0.60_0.008_250)] mt-1 leading-relaxed line-clamp-3">{sym.description}</p>
          {sym.note && (
            <div className="mt-auto pt-2.5 flex items-start gap-1.5">
              <Info className="w-4 h-4 text-[oklch(0.72_0.11_75)] shrink-0 mt-px" />
              <span className="text-xs leading-snug text-[oklch(0.74_0.11_75)]">{sym.note}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
