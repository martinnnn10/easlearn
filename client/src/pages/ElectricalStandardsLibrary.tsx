import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Search, BookOpen, Wrench, Info } from "lucide-react";
import SEO from "@/components/SEO";
import {
  getLearnerGroups,
  searchSymbols,
  PRINT_READING_STANDARDS,
  SYMBOL_PRINT_TAGS,
} from "@shared/electricalSymbolRegistry";
import type { ElectricalSymbolEntry } from "@shared/electricalSymbolRegistry";
import { TROUBLESHOOTING_REFERENCES } from "@shared/troubleshootingReferenceCatalog";
import StandardsSymbolPreview from "@/components/standards/StandardsSymbolPreview";
import type { SymbolPrimitiveId } from "@shared/electricalSymbolRegistry";

export default function ElectricalStandardsLibrary() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchSymbols(query), [query]);
  const groups = getLearnerGroups();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Electrical Standards Library"
        description="NEMA / JIC / NFPA 79 US industrial symbol reference. Verify every symbol on EASLearn against documented standards."
        path="/reference/electrical"
      />

      <section className="py-16 border-b border-[oklch(0.18_0.004_250)]">
        <div className="container max-w-5xl">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-[oklch(0.55_0.12_155)]" />
            <h1 className="text-3xl font-heading text-white tracking-wide">Electrical Symbol Library</h1>
          </div>
          <p className="text-base text-[oklch(0.62_0.008_250)] leading-relaxed mb-4 max-w-3xl">
            Common schematic symbols used in EASLearn labs and troubleshooting lessons, grouped the way
            a technician reads a panel — power circuit, control circuit, operator devices, safety, and I/O.
          </p>
          <div className="flex items-start gap-2 mb-6 max-w-3xl rounded-lg border border-[oklch(0.20_0.004_250)] bg-[oklch(0.09_0.003_250)] px-3 py-2.5">
            <Info className="w-4 h-4 text-[oklch(0.55_0.008_250)] shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-[oklch(0.55_0.008_250)]">
              These are <span className="text-[oklch(0.68_0.008_250)]">simplified EASLearn training symbols</span> based
              on common North American motor-control conventions (NEMA / JIC / NFPA 79). Actual plant or OEM prints may vary.
              The example print tags shown on each symbol (F1, CB1, PB1…) are for reference only — real prints may use different tag names.
            </p>
          </div>
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.45_0.006_250)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search symbols (e.g. NO contact, overload, fuse)..."
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[oklch(0.08_0.003_250)] border border-[oklch(0.18_0.004_250)] text-white placeholder:text-[oklch(0.40_0.006_250)] focus:outline-none focus:border-[oklch(0.55_0.12_155/40%)]"
            />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container max-w-5xl space-y-12">
          {query ? (
            <div>
              <h2 className="text-sm font-mono text-[oklch(0.55_0.12_155)] uppercase tracking-wider mb-5">
                Search Results ({results.length})
              </h2>
              {results.length === 0 ? (
                <p className="text-sm text-[oklch(0.50_0.008_250)]">No symbols match “{query}”.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {results.map((entry) => (
                    <SymbolCard key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.id}>
                <div className="flex items-baseline justify-between gap-4 mb-1">
                  <h2 className="text-2xl font-semibold text-white">{group.title}</h2>
                  <span className="text-xs font-mono text-[oklch(0.44_0.006_250)] shrink-0">
                    {group.symbols.length} symbols
                  </span>
                </div>
                <p className="text-base text-[oklch(0.55_0.008_250)] mb-5">{group.description}</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {group.symbols.map((entry) => (
                    <SymbolCard key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            ))
          )}

          {!query && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Print Reading Standards</h2>
              <p className="text-sm text-[oklch(0.52_0.008_250)] mb-5">
                How the symbols above are laid out on real drawings.
              </p>
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
          )}

          {!query && (
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
          )}
        </div>
      </section>
    </div>
  );
}

function SymbolCard({ entry }: { entry: ElectricalSymbolEntry }) {
  return (
    <Link href={`/reference/electrical/${entry.id}`}>
      <div className="card-panel p-4 flex gap-4 hover:border-[oklch(0.55_0.12_155/30%)] transition-colors cursor-pointer h-full">
        <div className="w-28 h-28 shrink-0 bg-[oklch(0.06_0.003_250)] rounded-lg border border-[oklch(0.14_0.004_250)] p-2 flex items-center justify-center">
          <StandardsSymbolPreview symbolId={entry.id as SymbolPrimitiveId} />
        </div>
        <div className="min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold text-white leading-tight">{entry.name}</h3>
            {SYMBOL_PRINT_TAGS[entry.id] && (
              <span
                title="Example print tag — varies by plant"
                className="shrink-0 mt-0.5 text-[11px] font-mono px-1.5 py-0.5 rounded border border-[oklch(0.30_0.02_155)] text-[oklch(0.62_0.10_155)] bg-[oklch(0.55_0.12_155/8%)]"
              >
                {SYMBOL_PRINT_TAGS[entry.id]}
              </span>
            )}
          </div>
          <p className="text-sm text-[oklch(0.60_0.008_250)] mt-1.5 leading-relaxed line-clamp-3">
            {entry.description}
          </p>
          {entry.contextNote && (
            <div className="mt-auto pt-2.5 flex items-start gap-1.5">
              <Info className="w-4 h-4 text-[oklch(0.72_0.11_75)] shrink-0 mt-px" />
              <span className="text-xs leading-snug text-[oklch(0.74_0.11_75)]">{entry.contextNote}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
