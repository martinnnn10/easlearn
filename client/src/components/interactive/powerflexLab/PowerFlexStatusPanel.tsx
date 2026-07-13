import type { DriveTelemetry, FaultLogEntry } from "@/lib/powerflexLab/types";

interface PowerFlexStatusPanelProps {
  telemetry: DriveTelemetry;
  faultLog: FaultLogEntry[];
  discoveredEvidence: string[];
  elapsedSec: number;
  onReviewStatus: () => void;
  onReviewHistory: () => void;
}

export default function PowerFlexStatusPanel({
  telemetry,
  faultLog,
  discoveredEvidence,
  elapsedSec,
  onReviewStatus,
  onReviewHistory,
}: PowerFlexStatusPanelProps) {
  const metrics = [
    { label: "Output Freq", value: `${telemetry.outputFreqHz.toFixed(1)} Hz`, dataKey: "output-freq" },
    { label: "Motor Current", value: `${telemetry.outputCurrentA.toFixed(1)} A` },
    { label: "DC Bus", value: `${telemetry.dcBusVolts} V` },
    { label: "Load", value: `${telemetry.loadPercent}%` },
    { label: "Heatsink", value: `${telemetry.heatsinkTempC}°C` },
    { label: "Fan RPM", value: `${telemetry.fanRpm}` },
  ];

  return (
    <div className="powerflex-lab-panel p-4 h-full overflow-y-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase">Status Monitor</div>
        <span className="text-[10px] font-mono text-[oklch(0.45_0.006_250)]">
          {Math.floor(elapsedSec / 60)}:{String(elapsedSec % 60).padStart(2, "0")}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {metrics.map((m) => (
          <div
            key={m.label}
            {...(m.dataKey ? { "data-drive-metric": m.dataKey } : {})}
            className="px-3 py-2 rounded bg-[oklch(0.08_0.003_250)] border border-[oklch(0.14_0.004_250)]"
          >
            <div className="text-[9px] font-mono text-[oklch(0.45_0.006_250)]">{m.label}</div>
            <div className="text-sm font-mono text-white mt-0.5" data-drive-value={m.dataKey || undefined}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onReviewStatus} className="text-[10px] font-mono px-2 py-1 rounded border border-[oklch(0.55_0.12_250/40%)] text-[oklch(0.65_0.10_250)]">
          Log status review
        </button>
        <button type="button" onClick={onReviewHistory} className="text-[10px] font-mono px-2 py-1 rounded border border-[oklch(0.25_0.004_250)] text-[oklch(0.55_0.008_250)]">
          Log fault history
        </button>
      </div>

      <div>
        <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase mb-2">Fault History</div>
        <ul className="space-y-1.5 max-h-40 overflow-y-auto">
          {faultLog.map((entry) => (
            <li
              key={`${entry.timestamp}-${entry.code}`}
              className={`text-[10px] font-mono px-2 py-1 rounded border ${
                entry.severity === "critical"
                  ? "border-[oklch(0.55_0.15_30/40%)] text-[oklch(0.75_0.15_30)]"
                  : entry.severity === "warning"
                    ? "border-[oklch(0.55_0.12_85/30%)] text-[oklch(0.70_0.12_85)]"
                    : "border-[oklch(0.14_0.004_250)] text-[oklch(0.50_0.008_250)]"
              }`}
            >
              <span className="text-[oklch(0.42_0.006_250)]">{entry.timestamp}</span> {entry.code} — {entry.description}
            </li>
          ))}
        </ul>
      </div>

      {discoveredEvidence.length > 0 && (
        <div>
          <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase mb-1">Evidence collected</div>
          <div className="flex flex-wrap gap-1">
            {discoveredEvidence.map((e) => (
              <span key={e} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[oklch(0.12_0.04_250/30%)] text-[oklch(0.65_0.10_250)]">
                {e.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
