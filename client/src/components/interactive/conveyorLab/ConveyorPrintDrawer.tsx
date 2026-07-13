import { useRef, useState } from "react";
import { Printer, X } from "lucide-react";
import {
  buildConveyorPrintPackage,
  buildDeviceListText,
  buildFullPrintPackage,
  buildLadderPrintText,
  buildWiringSummary,
  CONVEYOR_DEVICES,
  CONVEYOR_WORKSHEET,
} from "@shared/conveyorPrintPackage";
import WiringDiagramSvg from "@/components/diagrams/WiringDiagramSvg";

interface ConveyorPrintDrawerProps {
  open: boolean;
  onClose: () => void;
  onReviewed?: () => void;
}

type PrintTab = "ladder" | "wiring" | "devices" | "worksheet";

export default function ConveyorPrintDrawer({ open, onClose }: ConveyorPrintDrawerProps) {
  const [tab, setTab] = useState<PrintTab>("wiring");
  const printRef = useRef<HTMLDivElement>(null);
  const printPackage = buildConveyorPrintPackage();

  if (!open) return null;

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const svgEl = printRef.current?.querySelector(".wiring-diagram-svg");
    const svgHtml = svgEl ? (svgEl as SVGSVGElement).outerHTML : "";
    const textBody = buildFullPrintPackage();
    w.document.write(`<!DOCTYPE html><html><head><title>Conveyor Print Package</title>
      <style>
        body { font-family: monospace; font-size: 11px; margin: 16px; color: #111; }
        pre { white-space: pre-wrap; }
        .wiring-print { margin-bottom: 24px; page-break-inside: avoid; }
        .wiring-print svg { width: 100%; max-width: 100%; height: auto; }
        @media print { .wiring-print svg { max-height: 7in; } }
      </style></head><body>
      <h2>Conveyor PLC Diagnostic Lab — Print Package</h2>
      <div class="wiring-print">${svgHtml}</div>
      <pre>${textBody.replace(/</g, "&lt;")}</pre>
    </body></html>`);
    w.document.close();
    w.print();
  };

  const tabs: { id: PrintTab; label: string }[] = [
    { id: "wiring", label: "Wiring" },
    { id: "ladder", label: "Ladder" },
    { id: "devices", label: "Devices" },
    { id: "worksheet", label: "Worksheet" },
  ];

  const drawerWide = tab === "wiring";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close" />
      <div
        className={`conveyor-print-drawer relative h-full bg-[oklch(0.06_0.003_250)] border-l border-[oklch(0.14_0.004_250)] flex flex-col shadow-xl transition-all ${
          drawerWide ? "w-full max-w-2xl" : "w-full max-w-md"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[oklch(0.14_0.004_250)]">
          <h4 className="text-sm font-heading text-white">Print Package</h4>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded border border-[oklch(0.55_0.12_155/50%)] text-[oklch(0.75_0.12_155)]"
            >
              <Printer className="w-3 h-3" />
              Print all
            </button>
            <button type="button" onClick={onClose} className="p-1 text-[oklch(0.50_0.006_250)] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-1 px-4 pt-3 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-2.5 min-h-[2.75rem] text-xs sm:text-[10px] font-mono rounded border shrink-0 ${
                tab === t.id
                  ? "border-[oklch(0.55_0.12_155)] text-[oklch(0.75_0.12_155)]"
                  : "border-[oklch(0.20_0.004_250)] text-[oklch(0.50_0.006_250)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div ref={printRef} className="flex-1 overflow-y-auto p-4">
          {tab === "wiring" && printPackage.wiringDiagram && (
            <div className="space-y-4">
              <p className="text-[10px] font-mono text-[oklch(0.55_0.08_60)] leading-relaxed rounded-md border border-[oklch(0.55_0.08_60/25%)] bg-[oklch(0.55_0.08_60/8%)] px-3 py-2">
                Daisy-chain +24 VDC field wiring is simplified for training. GS1 guard interlock is shown on
                sheet and device list — verify as-built prints on site.
              </p>
              <WiringDiagramSvg spec={printPackage.wiringDiagram} interactive />
              <pre className="text-[10px] font-mono text-[oklch(0.55_0.008_250)] whitespace-pre-wrap leading-relaxed border-t border-[oklch(0.12_0.004_250)] pt-4">
                {buildWiringSummary()}
              </pre>
            </div>
          )}
          {tab === "ladder" && (
            <pre className="text-[10px] font-mono text-[oklch(0.60_0.008_250)] whitespace-pre-wrap leading-relaxed">
              {buildLadderPrintText()}
            </pre>
          )}
          {tab === "devices" && (
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr className="text-[oklch(0.45_0.006_250)] text-left">
                  <th className="pb-2">Tag</th>
                  <th className="pb-2">Addr</th>
                  <th className="pb-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {CONVEYOR_DEVICES.map((d) => (
                  <tr key={d.tag} className="border-t border-[oklch(0.12_0.004_250)] text-[oklch(0.55_0.008_250)]">
                    <td className="py-1.5 pr-2 text-white">{d.tag}</td>
                    <td className="py-1.5 pr-2">{d.address}</td>
                    <td className="py-1.5">{d.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === "worksheet" && (
            <ol className="list-decimal list-inside space-y-3 text-[11px] text-[oklch(0.60_0.008_250)]">
              {CONVEYOR_WORKSHEET.map((q) => (
                <li key={q} className="leading-relaxed">{q}</li>
              ))}
            </ol>
          )}
        </div>

        <div className="px-4 py-3 border-t border-[oklch(0.14_0.004_250)] text-[10px] font-mono text-[oklch(0.40_0.006_250)]">
          {buildDeviceListText().split("\n").length} devices · Packaging Line 4 · v{printPackage.version}
        </div>
      </div>
    </div>
  );
}
