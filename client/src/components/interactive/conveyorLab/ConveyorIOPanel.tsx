import { INPUT_ADDRESSES, INPUT_LABELS } from "@/lib/conveyorLab/conveyorProgram";
import type { PlcState } from "@/lib/conveyorLab/types";

// Fail-safe (energize-to-run): healthy NC safety inputs read TRUE (1); they drop
// to FALSE (0) when the device opens or the conductor is lost. The photoeye is a
// dark-operate jam interlock — TRUE means the beam is blocked.
function inputFieldState(addr: string, active: boolean): string {
  switch (addr) {
    case "I:1/2":
      return active ? "NC CLOSED" : "NC OPEN";
    case "I:1/3":
      return active ? "GUARD CLOSED" : "GUARD OPEN";
    case "I:1/4":
      return active ? "OL OK" : "OL TRIPPED";
    case "I:1/5":
      return active ? "PE BLOCKED" : "PE CLEAR";
    case "I:1/0":
      return active ? "STOP OK" : "STOP PRESSED";
    case "I:1/1":
      return active ? "START PRESSED" : "START RELEASED";
    default:
      return active ? "TRUE" : "FALSE";
  }
}

function isInputAlarm(addr: string, active: boolean): boolean {
  // NC safety inputs de-energized = open/tripped = alarm
  if (addr === "I:1/2" || addr === "I:1/3" || addr === "I:1/4") return !active;
  // Photoeye energized = beam blocked = alarm (jam interlock)
  if (addr === "I:1/5") return active;
  return false;
}

interface ConveyorIOPanelProps {
  plc: PlcState;
  onPulseStart: () => void;
  onPressStop: () => void;
  onResetEstop: () => void;
  onResetOverload: () => void;
  onActuateEstop?: () => void;
  onToggleGuard?: () => void;
  onTripOverload?: () => void;
  showFieldControls?: boolean;
  readOnly?: boolean;
  compact?: boolean;
}

export default function ConveyorIOPanel({
  plc,
  onPulseStart,
  onPressStop,
  onResetEstop,
  onResetOverload,
  onActuateEstop,
  onToggleGuard,
  onTripOverload,
  showFieldControls = false,
  readOnly = false,
  compact = false,
}: ConveyorIOPanelProps) {
  return (
    <div className={`conveyor-lab-panel ${compact ? "" : "h-full flex flex-col"}`}>
      {!compact && (
        <div className="px-4 py-3 border-b border-[oklch(0.14_0.004_250)]">
          <h4 className="text-xs font-mono text-[oklch(0.45_0.006_250)] uppercase tracking-wider">
            PLC I/O — Local:1
          </h4>
        </div>
      )}

      <div className={`${compact ? "space-y-3" : "flex-1 overflow-y-auto p-4 space-y-4"}`}>
        <div>
          <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] mb-2 uppercase">
            Operator Controls
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={readOnly}
              onClick={onPulseStart}
              className="px-4 py-2.5 rounded-md border text-xs font-mono bg-[oklch(0.12_0.04_155)] border-[oklch(0.55_0.12_155/50%)] text-[oklch(0.75_0.12_155)] hover:border-[oklch(0.55_0.12_155)] disabled:opacity-50 diag-touch-target"
            >
              START
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={onPressStop}
              className="px-4 py-2.5 rounded-md border text-xs font-mono bg-[oklch(0.12_0.04_30)] border-[oklch(0.55_0.15_30/50%)] text-[oklch(0.70_0.15_30)] hover:border-[oklch(0.55_0.15_30)] disabled:opacity-50 diag-touch-target"
            >
              STOP
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={onResetEstop}
              className="px-4 py-2.5 rounded-md border text-xs font-mono bg-[oklch(0.10_0.003_250)] border-[oklch(0.20_0.004_250)] text-[oklch(0.55_0.008_250)] hover:border-[oklch(0.30_0.006_250)] disabled:opacity-50 diag-touch-target"
            >
              RESET E-STOP
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={onResetOverload}
              className="px-4 py-2.5 rounded-md border text-xs font-mono bg-[oklch(0.10_0.003_250)] border-[oklch(0.20_0.004_250)] text-[oklch(0.55_0.008_250)] hover:border-[oklch(0.30_0.006_250)] disabled:opacity-50 diag-touch-target"
            >
              RESET OL
            </button>
            {showFieldControls && onActuateEstop && (
              <button
                type="button"
                disabled={readOnly}
                onClick={onActuateEstop}
                className="px-4 py-2.5 rounded-md border text-xs font-mono bg-[oklch(0.12_0.04_30)] border-[oklch(0.55_0.15_30/50%)] text-[oklch(0.70_0.15_30)] hover:border-[oklch(0.55_0.15_30)] disabled:opacity-50 diag-touch-target"
              >
                ACTUATE E-STOP
              </button>
            )}
            {showFieldControls && onToggleGuard && (
              <button
                type="button"
                disabled={readOnly}
                onClick={onToggleGuard}
                className="px-4 py-2.5 rounded-md border text-xs font-mono bg-[oklch(0.10_0.003_250)] border-[oklch(0.20_0.004_250)] text-[oklch(0.55_0.008_250)] hover:border-[oklch(0.30_0.006_250)] disabled:opacity-50 diag-touch-target"
              >
                TOGGLE GUARD
              </button>
            )}
            {showFieldControls && onTripOverload && (
              <button
                type="button"
                disabled={readOnly}
                onClick={onTripOverload}
                className="px-4 py-2.5 rounded-md border text-xs font-mono bg-[oklch(0.12_0.04_30)] border-[oklch(0.55_0.15_30/50%)] text-[oklch(0.70_0.15_30)] hover:border-[oklch(0.55_0.15_30)] disabled:opacity-50 diag-touch-target"
              >
                TRIP OL
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] mb-2 uppercase">
            Digital Inputs
          </div>
          <div className="grid grid-cols-2 gap-2">
            {INPUT_ADDRESSES.map((addr) => {
              const active = plc.inputs[addr] ?? false;
              const isAlarm = isInputAlarm(addr, active);
              return (
                <div
                  key={addr}
                  className={`px-2 py-2.5 min-h-[2.75rem] rounded-md border text-xs font-mono ${
                    isAlarm
                      ? "bg-[oklch(0.18_0.06_30)] border-[oklch(0.55_0.15_30)] text-[oklch(0.75_0.15_30)]"
                      : active
                      ? "bg-[oklch(0.15_0.04_155)] border-[oklch(0.55_0.12_155)] text-[oklch(0.75_0.12_155)]"
                      : "bg-[oklch(0.08_0.003_250)] border-[oklch(0.16_0.004_250)] text-[oklch(0.50_0.006_250)]"
                  }`}
                >
                  <div className="opacity-70">{addr}</div>
                  <div className="mt-0.5">{INPUT_LABELS[addr]}</div>
                  <div className="mt-1">{active ? "● TRUE" : "○ FALSE"}</div>
                  <div className="mt-0.5 opacity-80">{inputFieldState(addr, active)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] mb-2 uppercase">
            Outputs & Internals
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { addr: "B3:0/0", label: "RUN_CMD", state: plc.internals["B3:0/0"] },
              { addr: "B3:0/1", label: "SAFE_RUN", state: plc.internals["B3:0/1"] },
              { addr: "T4:0/DN", label: "TMR DONE", state: plc.timers["T4:0"]?.done },
              { addr: "O:2/0", label: "M1 STARTER", state: plc.outputs["O:2/0"] },
              { addr: "O:2/1", label: "GREEN", state: plc.outputs["O:2/1"] },
              { addr: "O:2/2", label: "RED", state: plc.outputs["O:2/2"] },
            ].map((item) => (
              <div
                key={item.addr}
                data-safety-coil={item.label}
                data-coil-on={item.state ? "true" : "false"}
                className={`px-2 py-2.5 min-h-[2.75rem] rounded-md border text-xs font-mono ${
                  item.state
                    ? item.addr === "O:2/2"
                      ? "bg-[oklch(0.18_0.06_30)] border-[oklch(0.55_0.15_30)] text-[oklch(0.75_0.15_30)]"
                      : "bg-[oklch(0.15_0.04_155)] border-[oklch(0.55_0.12_155)] text-[oklch(0.75_0.12_155)]"
                    : "bg-[oklch(0.08_0.003_250)] border-[oklch(0.16_0.004_250)] text-[oklch(0.50_0.006_250)]"
                }`}
              >
                <div className="opacity-70">{item.addr}</div>
                <div className="mt-0.5">{item.label}</div>
                <div className="mt-1">{item.state ? "● ON" : "○ OFF"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
