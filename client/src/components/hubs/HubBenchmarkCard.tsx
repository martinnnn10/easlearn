/**
 * Hub benchmark simulator card — Conveyor PLC Lab for PLC Hub.
 */
import { Link } from "wouter";
import { ArrowRight, Award, Wrench } from "lucide-react";
import type { SimulatorCatalogEntry } from "@shared/simulatorCatalog";

interface HubBenchmarkCardProps {
  hubTitle: string;
  entry: SimulatorCatalogEntry;
  primaryHref?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  /** When true, primary CTA is disabled and marked coming soon (A7 scaffold). */
  scaffold?: boolean;
  scaffoldLabel?: string;
  ctaLabel?: string;
  description?: string;
}

export default function HubBenchmarkCard({
  hubTitle,
  entry,
  primaryHref,
  secondaryHref,
  secondaryLabel,
  scaffold = false,
  scaffoldLabel = "Coming Soon",
  ctaLabel,
  description,
}: HubBenchmarkCardProps) {
  const body =
    description ??
    `${hubTitle} troubleshooting anchor — machine twin, ladder logic, I/O diagnosis, and print package.`;

  return (
    <section
      className={`card-panel p-5 sm:p-6 ${
        scaffold
          ? "border-[oklch(0.25_0.004_250)] bg-gradient-to-br from-[oklch(0.09_0.003_250)] to-[oklch(0.07_0.003_250)]"
          : "border-[oklch(0.55_0.12_155/25%)] bg-gradient-to-br from-[oklch(0.10_0.02_155/40%)] to-[oklch(0.08_0.003_250)]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Award className={`w-4 h-4 ${scaffold ? "text-[oklch(0.45_0.006_250)]" : "text-[oklch(0.55_0.12_155)]"}`} />
            <span
              className={`text-[10px] font-mono uppercase tracking-wider ${
                scaffold ? "text-[oklch(0.45_0.006_250)]" : "text-[oklch(0.55_0.12_155)]"
              }`}
            >
              Benchmark Lab{scaffold ? " · Scaffold" : ""}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-heading text-white mb-1">{entry.title}</h2>
          <p className="text-sm text-[oklch(0.60_0.008_250)] leading-relaxed mb-3">{body}</p>
          <div className="flex flex-wrap gap-2 text-[10px] font-mono text-[oklch(0.50_0.008_250)]">
            <span className="px-2 py-0.5 rounded bg-[oklch(0.12_0.003_250)] border border-[oklch(0.18_0.004_250)]">
              {entry.duration}
            </span>
            <span className="px-2 py-0.5 rounded bg-[oklch(0.12_0.003_250)] border border-[oklch(0.18_0.004_250)]">
              {entry.equipmentType}
            </span>
          </div>
          {entry.faults && entry.faults.length > 0 && (
            <p className="mt-3 text-[11px] text-[oklch(0.55_0.008_250)]">
              Faults: {entry.faults.join(" · ")}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
          {scaffold ? (
            <span
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-[oklch(0.22_0.004_250)] bg-[oklch(0.10_0.003_250)] text-[oklch(0.45_0.006_250)] cursor-not-allowed"
              aria-disabled="true"
            >
              <Wrench className="w-4 h-4 opacity-50" />
              {scaffoldLabel}
            </span>
          ) : primaryHref ? (
            <Link
              href={primaryHref}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-[oklch(0.55_0.12_155)] text-[oklch(0.12_0.02_155)] hover:brightness-110 transition-all"
            >
              <Wrench className="w-4 h-4" />
              {ctaLabel ?? "Open Lab"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : null}
          {secondaryHref && (
            <Link
              href={secondaryHref}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono rounded-lg border border-[oklch(0.25_0.004_250)] text-[oklch(0.65_0.008_250)] hover:text-white hover:border-[oklch(0.55_0.12_155/40%)] transition-colors"
            >
              {secondaryLabel ?? "Course module"}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
