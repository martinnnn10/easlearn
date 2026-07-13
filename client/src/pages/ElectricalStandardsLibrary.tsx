import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Search, BookOpen, Wrench } from "lucide-react";
import SEO from "@/components/SEO";
import {
  CATEGORY_META,
  getOrderedCategories,
  getSymbolsByCategory,
  searchSymbols,
  PRINT_READING_STANDARDS,
} from "@shared/electricalSymbolRegistry";
import { TROUBLESHOOTING_REFERENCES } from "@shared/troubleshootingReferenceCatalog";
import StandardsSymbolPreview from "@/components/standards/StandardsSymbolPreview";
import type { SymbolPrimitiveId } from "@shared/electricalSymbolRegistry";

export default function ElectricalStandardsLibrary() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchSymbols(query), [query]);
  const categories = getOrderedCategories();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Electrical Standards Library"
        description="NEMA / JIC / NFPA 79 US industrial symbol reference. Verify every symbol on EASLearn against documented standards."
        path="/reference/electrical"
      />

      <section className="py-16 border-b border-[oklch(0.18_0.004_250)]">
        <div className="container max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-[oklch(0.55_0.12_155)]" />
            <h1 className="text-3xl font-heading text-white tracking-wide">Electrical Standards Library</h1>
          </div>
          <p className="text-[oklch(0.60_0.008_250)] leading-relaxed mb-6">
            Every symbol used in EASLearn simulators and lessons traces to US manufacturing standards — NEMA / JIC / NFPA 79.
            Search by name, alias, or function.
          </p>
          <div className="relative">
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
        <div className="container max-w-4xl space-y-10">
          {query ? (
            <div>
              <h2 className="text-sm font-mono text-[oklch(0.55_0.12_155)] uppercase tracking-wider mb-4">
                Search Results ({results.length})
              </h2>
              <div className="grid gap-3">
                {results.map((entry) => (
                  <SymbolCard key={entry.id} id={entry.id} name={entry.name} category={entry.category} />
                ))}
              </div>
            </div>
          ) : (
            categories.map((cat) => {
              const items = getSymbolsByCategory(cat);
              if (items.length === 0) return null;
              const meta = CATEGORY_META[cat];
              return (
                <div key={cat}>
                  <h2 className="text-lg font-semibold text-white mb-1">{meta.title}</h2>
                  <p className="text-sm text-[oklch(0.50_0.008_250)] mb-4">{meta.description}</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {items.map((entry) => (
                      <SymbolCard key={entry.id} id={entry.id} name={entry.name} category={entry.category} />
                    ))}
                  </div>
                </div>
              );
            })
          )}

          {!query && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Print Reading Standards</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {PRINT_READING_STANDARDS.map((p) => (
                  <div key={p.id} className="card-panel p-4">
                    <h3 className="text-sm font-semibold text-white mb-1">{p.name}</h3>
                    <p className="text-xs text-[oklch(0.55_0.008_250)] mb-2">{p.description}</p>
                    <p className="text-[10px] font-mono text-[oklch(0.45_0.006_250)]">{p.nemaJicReference}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-5 h-5 text-[oklch(0.55_0.12_155)]" />
              <h2 className="text-lg font-semibold text-white">Field Troubleshooting References</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {TROUBLESHOOTING_REFERENCES.map((ref) => (
                <Link key={ref.id} href={`/reference/troubleshooting/${ref.id}`}>
                  <div className="card-panel p-4 hover:border-[oklch(0.55_0.12_155/30%)] transition-colors cursor-pointer h-full">
                    <h3 className="text-sm font-semibold text-white mb-1">{ref.title}</h3>
                    <p className="text-xs text-[oklch(0.55_0.008_250)] line-clamp-2">{ref.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SymbolCard({ id, name, category }: { id: string; name: string; category: string }) {
  return (
    <Link href={`/reference/electrical/${id}`}>
      <div className="card-panel p-4 flex gap-4 hover:border-[oklch(0.55_0.12_155/30%)] transition-colors cursor-pointer">
        <div className="w-24 shrink-0 bg-[oklch(0.06_0.003_250)] rounded border border-[oklch(0.14_0.004_250)] p-2 flex items-center">
          <StandardsSymbolPreview symbolId={id as SymbolPrimitiveId} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white leading-tight">{name}</h3>
          <p className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] mt-1 uppercase">{category.replace(/_/g, " ")}</p>
        </div>
      </div>
    </Link>
  );
}
