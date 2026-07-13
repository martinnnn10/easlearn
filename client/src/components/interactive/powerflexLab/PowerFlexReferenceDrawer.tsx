import { useRef } from "react";
import { BookOpen, Printer, X } from "lucide-react";
import { Link } from "wouter";
import {
  POWERFLEX_FAULT_ONE_PAGER,
  buildPowerFlexOnePagerPrintText,
} from "@shared/powerflexFaultOnePager";

interface PowerFlexReferenceDrawerProps {
  open: boolean;
  onClose: () => void;
  onReviewed: () => void;
}

export default function PowerFlexReferenceDrawer({ open, onClose, onReviewed }: PowerFlexReferenceDrawerProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const body = buildPowerFlexOnePagerPrintText();
    const cards = printRef.current?.innerHTML ?? "";
    w.document.write(`<!DOCTYPE html><html><head><title>PowerFlex Fault One-Pager</title>
      <style>
        body { font-family: system-ui, sans-serif; font-size: 11px; margin: 16px; color: #111; line-height: 1.45; }
        h1 { font-size: 14px; margin-bottom: 4px; }
        h2 { font-size: 12px; margin: 16px 0 6px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
        ul { margin: 4px 0; padding-left: 18px; }
        .meta { color: #444; font-size: 10px; }
        .v3 { margin-top: 6px; font-size: 10px; color: #333; }
        @media print { body { margin: 12px; } }
      </style></head><body>
      <h1>PowerFlex 525 — Benchmark Fault Code One-Pager</h1>
      <p class="meta">Beta v1 · EASLearn PowerFlex Diagnostic Lab</p>
      ${cards}
      <pre style="white-space:pre-wrap;margin-top:24px;font-size:9px;color:#666">${body.replace(/</g, "&lt;")}</pre>
    </body></html>`);
    w.document.close();
    w.print();
    onReviewed();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end print:hidden">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close" />
      <div className="powerflex-reference-drawer relative w-full max-w-lg h-full bg-[oklch(0.06_0.003_250)] border-l border-[oklch(0.14_0.004_250)] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[oklch(0.14_0.004_250)] shrink-0">
          <h4 className="text-sm font-heading text-white">VFD Reference</h4>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded border border-[oklch(0.55_0.12_250/50%)] text-[oklch(0.75_0.12_250)]"
            >
              <Printer className="w-3 h-3" />
              Print one-pager
            </button>
            <button type="button" onClick={onClose} className="p-1 text-[oklch(0.50_0.006_250)] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div ref={printRef} className="flex-1 overflow-y-auto p-4 space-y-5 powerflex-one-pager-scroll">
          {POWERFLEX_FAULT_ONE_PAGER.map((entry) => (
            <article
              key={entry.code}
              className="rounded-lg border border-[oklch(0.14_0.004_250)] bg-[oklch(0.08_0.003_250)] p-3 sm:p-4"
            >
              <div className="flex flex-wrap items-baseline gap-2 mb-2">
                <span className="text-sm font-mono font-bold text-[oklch(0.75_0.12_250)]">{entry.code}</span>
                <span className="text-sm text-white font-medium">{entry.name}</span>
              </div>
              <p className="text-[11px] text-[oklch(0.55_0.008_250)] leading-relaxed mb-3">{entry.meaning}</p>

              <Section title="Symptoms" items={entry.symptoms} />
              <Section title="Likely causes" items={entry.likelyCauses} />
              <Section title="Key measurements" items={entry.keyMeasurements} />

              <p className="text-[10px] font-mono text-[oklch(0.50_0.008_250)] mt-2">
                Parameters: {entry.relatedParameters.join(" · ")}
              </p>
              <a
                href={`/simulator?scenario=${encodeURIComponent(entry.v3ScenarioId)}`}
                className="inline-block mt-2 text-[10px] font-mono text-[oklch(0.60_0.10_250)] hover:text-white"
              >
                Related V3: {entry.v3ScenarioId} →
              </a>
            </article>
          ))}

          <Link
            href="/reference/electrical/vfd"
            onClick={onReviewed}
            className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-2 rounded border border-[oklch(0.55_0.12_250/40%)] text-[oklch(0.75_0.12_250)]"
          >
            <BookOpen className="w-3.5 h-3.5" />
            View VFD Standard
          </Link>
          <p className="text-[10px] text-[oklch(0.42_0.006_250)] leading-relaxed pb-4">
            Beta lab reference — three benchmark faults only. Use Print for field notes.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mb-2">
      <div className="text-[9px] font-mono uppercase text-[oklch(0.45_0.006_250)] mb-1">{title}</div>
      <ul className="text-[10px] sm:text-[11px] text-[oklch(0.55_0.008_250)] space-y-0.5 list-disc list-inside leading-relaxed">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
