import { FAULT_CATALOG } from "@/lib/powerflexLab/faultCatalog";
import type { FaultId, LabMode } from "@/lib/powerflexLab/types";
import { getScopedPowerFlexFaultCatalog } from "@shared/powerflexLabAttribution";

interface PowerFlexFaultInjectorProps {
  mode: LabMode;
  activeFault: FaultId;
  faultScope?: FaultId[];
  onSelectFault: (id: FaultId) => void;
  onRandomFault: () => void;
}

export default function PowerFlexFaultInjector({
  mode,
  activeFault,
  faultScope,
  onSelectFault,
  onRandomFault,
}: PowerFlexFaultInjectorProps) {
  const scopedIds = getScopedPowerFlexFaultCatalog(faultScope);
  const visibleFaults = FAULT_CATALOG.filter((f) => scopedIds.includes(f.id));

  if (mode === "practice") {
    return (
      <div className="p-4 rounded-lg border border-[oklch(0.14_0.004_250)] bg-[oklch(0.06_0.003_250)]">
        <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase mb-2">Practice Mode</div>
        <p className="text-xs text-[oklch(0.55_0.008_250)]">
          A random VFD fault is active. Diagnose from HIM display, status monitor, parameters, and fault history.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg border border-[oklch(0.14_0.004_250)] bg-[oklch(0.06_0.003_250)]">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase">
          Fault Injector {mode === "learn" ? "(visible)" : "(guided)"}
        </div>
        <button
          type="button"
          onClick={onRandomFault}
          className="text-[10px] font-mono px-2 py-1 rounded border border-[oklch(0.25_0.006_250)] text-[oklch(0.55_0.008_250)] hover:border-[oklch(0.40_0.006_250)]"
        >
          Random
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSelectFault("normal")}
          className={`px-3 py-2 rounded-md border text-[10px] font-mono ${
            activeFault === "normal"
              ? "bg-[oklch(0.15_0.04_250)] border-[oklch(0.55_0.12_250)] text-[oklch(0.75_0.12_250)]"
              : "bg-[oklch(0.10_0.003_250)] border-[oklch(0.20_0.004_250)] text-[oklch(0.50_0.006_250)]"
          }`}
        >
          Normal / Ready
        </button>
        {visibleFaults.map((fault) => (
          <button
            key={fault.id}
            type="button"
            onClick={() => onSelectFault(fault.id)}
            className={`px-3 py-2 rounded-md border text-[10px] font-mono text-left ${
              activeFault === fault.id
                ? "bg-[oklch(0.18_0.06_30)] border-[oklch(0.55_0.15_30)] text-[oklch(0.75_0.15_30)]"
                : "bg-[oklch(0.10_0.003_250)] border-[oklch(0.20_0.004_250)] text-[oklch(0.50_0.006_250)]"
            }`}
          >
            {fault.faultCode} — {fault.label}
          </button>
        ))}
      </div>
      {activeFault !== "normal" && mode === "learn" && (
        <p className="mt-3 text-[11px] text-[oklch(0.55_0.008_250)]">
          {visibleFaults.find((f) => f.id === activeFault)?.symptom}
        </p>
      )}
    </div>
  );
}
