import { Link } from "wouter";
import type { DriveTelemetry, FaultId } from "@/lib/powerflexLab/types";
import { getFaultById } from "@/lib/powerflexLab/faultCatalog";

interface PowerFlexDrivePanelProps {
  telemetry: DriveTelemetry;
  activeFault: FaultId;
  operatorReport?: string;
  symptom?: string;
  onViewFaultHistory: () => void;
}

export default function PowerFlexDrivePanel({
  telemetry,
  activeFault,
  operatorReport,
  symptom,
  onViewFaultHistory,
}: PowerFlexDrivePanelProps) {
  const fault = activeFault !== "normal" ? getFaultById(activeFault) : undefined;

  return (
    <div className="powerflex-lab-panel p-4 h-full flex flex-col gap-4">
      <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase">PowerFlex 525 — HIM Display</div>

      <div
        className={`rounded-lg border-2 p-4 font-mono ${
          telemetry.faultActive
            ? "border-[oklch(0.55_0.15_30)] bg-[oklch(0.12_0.04_30/50%)]"
            : "border-[oklch(0.35_0.08_155/40%)] bg-[oklch(0.08_0.02_155/20%)]"
        }`}
      >
        <div className="text-lg sm:text-xl text-[oklch(0.85_0.08_155)] tracking-wider" data-drive-display="line1">
          {telemetry.displayLine1}
        </div>
        <div className="text-sm text-[oklch(0.65_0.10_155)] mt-1" data-drive-display="line2">
          {telemetry.displayLine2}
        </div>
        <div className="text-[10px] text-[oklch(0.50_0.006_250)] mt-3">Status: {telemetry.statusWord}</div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {(["STATUS", "FAULT", "PARAM", "CLEAR"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={key === "FAULT" ? onViewFaultHistory : undefined}
            className="px-2 py-2 text-[9px] font-mono rounded border border-[oklch(0.25_0.004_250)] text-[oklch(0.55_0.008_250)] hover:border-[oklch(0.55_0.12_250/40%)] hover:text-white"
          >
            {key}
          </button>
        ))}
      </div>

      {(symptom || operatorReport) && (
        <div className="rounded-lg border border-[oklch(0.14_0.004_250)] bg-[oklch(0.06_0.003_250)] p-3">
          {operatorReport && (
            <p className="text-xs text-[oklch(0.60_0.008_250)]">
              <span className="text-[oklch(0.45_0.006_250)] font-mono">Operator: </span>
              {operatorReport}
            </p>
          )}
          {symptom && activeFault === "normal" && (
            <p className="text-xs text-[oklch(0.55_0.008_250)] mt-2">{symptom}</p>
          )}
        </div>
      )}

      {fault && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/reference/electrical/vfd"
            className="text-[10px] font-mono px-2 py-1 rounded border border-[oklch(0.55_0.12_250/35%)] text-[oklch(0.65_0.10_250)] hover:text-white"
          >
            View VFD Standard
          </Link>
          <a
            href={`/simulator?scenario=${encodeURIComponent(fault.v3ScenarioId)}`}
            className="text-[10px] font-mono px-2 py-1 rounded border border-[oklch(0.25_0.004_250)] text-[oklch(0.55_0.008_250)] hover:text-white"
          >
            Related V3 scenario
          </a>
        </div>
      )}
    </div>
  );
}
