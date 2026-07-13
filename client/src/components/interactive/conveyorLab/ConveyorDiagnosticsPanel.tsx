import { METER_PROBES } from "@/lib/conveyorLab/faultCatalog";
import { describeEvidence } from "@/lib/conveyorLab/faultInjectionEngine";
import type {
  DiagnosticEvent,
  FaultId,
  MeterMode,
  MeterProbeId,
  PlcState,
} from "@/lib/conveyorLab/types";
import ConveyorIOPanel from "./ConveyorIOPanel";

interface ConveyorDiagnosticsPanelProps {
  plc: PlcState;
  activeFault: FaultId;
  events: DiagnosticEvent[];
  discoveredEvidence: string[];
  selectedProbe: MeterProbeId;
  meterMode: MeterMode;
  meterReading: string | null;
  onSelectProbe: (id: MeterProbeId) => void;
  onSetMeterMode: (mode: MeterMode) => void;
  onTakeReading: () => void;
  onPulseStart: () => void;
  onPressStop: () => void;
  onResetEstop: () => void;
  onResetOverload: () => void;
  onActuateEstop?: () => void;
  onToggleGuard?: () => void;
  onTripOverload?: () => void;
  showFieldControls?: boolean;
  elapsedSec: number;
  hintsUsed: number;
}

function computeMeterReading(
  probe: MeterProbeId,
  mode: MeterMode,
  plc: PlcState,
  mechanicalFault = false
): string {
  const inputs = plc.inputs;
  const motorOn = plc.outputs["O:2/0"] ?? false;

  switch (probe) {
    // Fail-safe wiring: input energized (TRUE) = healthy NC contact closed.
    case "estop_nc":
      return mode === "continuity"
        ? inputs["I:1/2"]
          ? "CLOSED (0 Ω)"
          : "OPEN (no continuity)"
        : inputs["I:1/2"]
        ? "~24 VDC (NC closed)"
        : "0 V (NC open)";
    case "guard_nc":
      return mode === "continuity"
        ? inputs["I:1/3"]
          ? "CLOSED (0 Ω)"
          : "OPEN (guard open)"
        : inputs["I:1/3"]
        ? "~24 VDC (NC closed)"
        : "0 V (NC open — guard door)";
    case "stop_nc":
      return mode === "continuity"
        ? inputs["I:1/0"]
          ? "CLOSED (0 Ω)"
          : "OPEN (button stuck)"
        : inputs["I:1/0"]
        ? "~24 VDC (NC closed)"
        : "0 V (NC open — STOP stuck)";
    case "overload_nc":
      return mode === "continuity"
        ? inputs["I:1/4"]
          ? "CLOSED (0 Ω)"
          : "OPEN (tripped)"
        : inputs["I:1/4"]
        ? "~24 VDC (NC closed)"
        : "0 V (NC open)";
    case "photoeye_signal":
      return mode === "voltage"
        ? inputs["I:1/5"]
          ? "24.1 VDC (blocked)"
          : "0.2 VDC (clear)"
        : inputs["I:1/5"]
        ? "LOW Ω (beam made)"
        : "OL (beam clear)";
    case "motor_coil":
      return mode === "voltage"
        ? motorOn
          ? "~24 VDC (coil energized)"
          : "0 V"
        : motorOn
        ? "Coil energized"
        : "No coil drive";
    case "contactor_aux":
      return mode === "continuity"
        ? motorOn && !mechanicalFault
          ? "CLOSED (0 Ω)"
          : "OPEN"
        : motorOn && !mechanicalFault
        ? "24 VDC aux"
        : "0 V";
    default:
      return "—";
  }
}

export default function ConveyorDiagnosticsPanel({
  plc,
  activeFault,
  events,
  discoveredEvidence,
  selectedProbe,
  meterMode,
  meterReading,
  onSelectProbe,
  onSetMeterMode,
  onTakeReading,
  onPulseStart,
  onPressStop,
  onResetEstop,
  onResetOverload,
  onActuateEstop,
  onToggleGuard,
  onTripOverload,
  showFieldControls = false,
  elapsedSec,
  hintsUsed,
}: ConveyorDiagnosticsPanelProps) {
  const mechanicalFault = activeFault === "output_on_motor_dead" && (plc.outputs["O:2/0"] ?? false);

  return (
    <div className="conveyor-lab-panel h-full flex flex-col">
      <div className="px-4 py-3 border-b border-[oklch(0.14_0.004_250)] flex items-center justify-between">
        <h4 className="text-xs font-mono text-[oklch(0.45_0.006_250)] uppercase tracking-wider">
          Diagnostics
        </h4>
        <div className="flex items-center gap-2 text-[10px] font-mono text-[oklch(0.45_0.006_250)]">
          <span>{Math.floor(elapsedSec / 60)}:{String(elapsedSec % 60).padStart(2, "0")}</span>
          {hintsUsed > 0 && <span>Hints: {hintsUsed}</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Multimeter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase">
              Multimeter
            </div>
          </div>
          <div className="flex gap-1 mb-2">
            {(["continuity", "voltage"] as MeterMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onSetMeterMode(m)}
                className={`px-2 py-1 text-[10px] font-mono rounded border capitalize ${
                  meterMode === m
                    ? "border-[oklch(0.55_0.12_155)] text-[oklch(0.75_0.12_155)]"
                    : "border-[oklch(0.20_0.004_250)] text-[oklch(0.50_0.006_250)]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <select
            value={selectedProbe}
            onChange={(e) => onSelectProbe(e.target.value as MeterProbeId)}
            className="w-full px-2 py-1.5 rounded-md bg-[oklch(0.08_0.003_250)] border border-[oklch(0.20_0.004_250)] text-[10px] font-mono text-white mb-2"
          >
            {METER_PROBES.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={onTakeReading}
            className="w-full px-3 py-2 text-[10px] font-mono rounded border border-[oklch(0.55_0.12_155/50%)] text-[oklch(0.75_0.12_155)] hover:border-[oklch(0.55_0.12_155)]"
          >
            Take reading
          </button>
          {meterReading && (
            <div className="mt-2 px-3 py-2 rounded bg-[oklch(0.08_0.003_250)] border border-[oklch(0.14_0.004_250)] text-[10px] font-mono text-white">
              {meterReading}
            </div>
          )}
          {!meterReading && (
            <div className="mt-1 text-[10px] font-mono text-[oklch(0.40_0.006_250)]">
              Select probe and mode, then take reading.
            </div>
          )}
        </div>

        {/* Evidence */}
        <div>
          <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] mb-2 uppercase">
            Evidence ({discoveredEvidence.length})
          </div>
          {discoveredEvidence.length === 0 ? (
            <p className="text-[10px] text-[oklch(0.45_0.006_250)]">
              Check I/O, ladder, and meter to collect evidence.
            </p>
          ) : (
            <ul className="space-y-1">
              {discoveredEvidence.map((id) => (
                <li
                  key={id}
                  className="text-[10px] font-mono px-2 py-1.5 rounded bg-[oklch(0.08_0.02_155)] border border-[oklch(0.55_0.12_155/25%)] text-[oklch(0.70_0.10_155)]"
                >
                  {describeEvidence(id)}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Event log */}
        <div>
          <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] mb-2 uppercase">
            Event log
          </div>
          <div className="max-h-28 overflow-y-auto space-y-1">
            {events.length === 0 ? (
              <p className="text-[10px] text-[oklch(0.40_0.006_250)]">No actions yet.</p>
            ) : (
              [...events].reverse().slice(0, 8).map((e) => (
                <div
                  key={e.id}
                  className="text-[10px] font-mono px-2 py-1 rounded bg-[oklch(0.06_0.003_250)] border border-[oklch(0.12_0.004_250)] text-[oklch(0.55_0.008_250)]"
                >
                  {e.description}
                </div>
              ))
            )}
          </div>
        </div>

        {/* I/O monitor (compact) */}
        <div>
          <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] mb-2 uppercase">
            I/O & Controls
          </div>
          <ConveyorIOPanel
            plc={plc}
            onPulseStart={onPulseStart}
            onPressStop={onPressStop}
            onResetEstop={onResetEstop}
            onResetOverload={onResetOverload}
            onActuateEstop={onActuateEstop}
            onToggleGuard={onToggleGuard}
            onTripOverload={onTripOverload}
            showFieldControls={showFieldControls}
            compact
          />
        </div>
      </div>
    </div>
  );
}

export { computeMeterReading };
