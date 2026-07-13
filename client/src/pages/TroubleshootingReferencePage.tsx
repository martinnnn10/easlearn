import { Link, useRoute } from "wouter";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import SEO from "@/components/SEO";
import { getTroubleshootingRef } from "@shared/troubleshootingReferenceCatalog";
import { getSymbolById } from "@shared/electricalSymbolRegistry";
import NotFound from "@/pages/NotFound";

export default function TroubleshootingReferencePage() {
  const [, params] = useRoute("/reference/troubleshooting/:topicId");
  const entry = params?.topicId ? getTroubleshootingRef(params.topicId) : undefined;

  if (!entry) return <NotFound />;

  return (
    <div className="min-h-screen bg-background">
      <SEO title={entry.title} description={entry.summary} path={`/reference/troubleshooting/${entry.id}`} />

      <div className="container max-w-3xl py-12">
        <Link href="/reference/electrical" className="inline-flex items-center gap-2 text-sm text-[oklch(0.55_0.008_250)] hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" /> Standards Library
        </Link>

        <h1 className="text-2xl font-heading text-white mb-3">{entry.title}</h1>
        <p className="text-[oklch(0.60_0.008_250)] mb-8">{entry.summary}</p>

        <div className="card-panel p-5 mb-4">
          <h2 className="text-sm font-mono text-[oklch(0.55_0.12_155)] uppercase tracking-wider mb-3">Tools Required</h2>
          <ul className="list-disc pl-5 text-sm text-[oklch(0.65_0.008_250)] space-y-1">
            {entry.tools.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>

        <div className="card-panel p-5 mb-4">
          <h2 className="text-sm font-mono text-[oklch(0.55_0.12_155)] uppercase tracking-wider mb-3">Procedure</h2>
          <ol className="list-decimal pl-5 text-sm text-[oklch(0.65_0.008_250)] space-y-2">
            {entry.procedure.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="card-panel p-5 mb-4 border-[oklch(0.65_0.15_55/20%)]">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-[oklch(0.65_0.15_55)]" />
            <h2 className="text-sm font-mono text-[oklch(0.65_0.15_55)] uppercase tracking-wider">Safety Notes</h2>
          </div>
          <ul className="list-disc pl-5 text-sm text-[oklch(0.65_0.008_250)] space-y-1">
            {entry.safetyNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>

        {entry.relatedSymbolIds.length > 0 && (
          <div className="card-panel p-5">
            <h2 className="text-sm font-mono text-[oklch(0.55_0.12_155)] uppercase tracking-wider mb-3">Related Symbols</h2>
            <div className="flex flex-wrap gap-2">
              {entry.relatedSymbolIds.map((sid) => {
                const sym = getSymbolById(sid);
                return (
                  <Link key={sid} href={`/reference/electrical/${sid}`}>
                    <span className="text-[11px] font-mono px-2 py-1 rounded border border-[oklch(0.55_0.12_155/25%)] text-[oklch(0.55_0.12_155)] hover:bg-[oklch(0.55_0.12_155/8%)] cursor-pointer">
                      {sym?.name ?? sid}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
