import { motion } from "framer-motion";
import type { MachineState } from "@/lib/conveyorLab/types";
import {
  EStopDevice,
  GuardDevice,
  MotorDevice,
  OverloadDevice,
  PhotoeyeDevice,
  StackLight,
} from "./ConveyorPhysicalDevices";

interface ConveyorMachineViewProps {
  machine: MachineState;
  symptom?: string;
  operatorReport?: string;
}

/**
 * MACHINE TWIN — the physical, plant-floor view of the line: what the devices
 * look like and their live state (running / stopped / open / tripped). This tab
 * uses pictorial device icons, NOT schematic contacts, and does NOT link to the
 * schematic Standards Library (that jump belongs in the Ladder tab). The NC/NO
 * contact symbols live in the Ladder tab. See docs/SYMBOL_QA.md.
 */
export default function ConveyorMachineView({ machine, symptom, operatorReport }: ConveyorMachineViewProps) {
  const {
    beltRunning,
    motorCoilEnergized,
    contactorPulled,
    photoeyeBlocked,
    estopPressed,
    guardOpen,
    overloadTripped,
    productOnBelt,
    fpm,
    greenLight,
    redLight,
    mechanicalFault,
  } = machine;

  const devices = [
    {
      key: "ES1",
      label: "ES1",
      caption: "E-Stop",
      node: <EStopDevice pressed={estopPressed} />,
      state: estopPressed ? "PRESSED" : "OK",
      fault: estopPressed,
    },
    {
      key: "GS1",
      label: "GS1",
      caption: "Guard",
      node: <GuardDevice open={guardOpen} />,
      state: guardOpen ? "OPEN" : "CLOSED",
      fault: guardOpen,
    },
    {
      key: "OL1",
      label: "OL1",
      caption: "Overload",
      node: <OverloadDevice tripped={overloadTripped} />,
      state: overloadTripped ? "TRIPPED" : "OK",
      fault: overloadTripped,
    },
    {
      key: "M1",
      label: "M1",
      caption: "Motor",
      node: (
        <motion.div animate={contactorPulled ? { scale: [1, 1.03, 1] } : {}} transition={{ duration: 0.4 }}>
          <MotorDevice running={contactorPulled} />
        </motion.div>
      ),
      state: contactorPulled ? "RUNNING" : "STOPPED",
      fault: false,
    },
  ];

  return (
    <div className="conveyor-lab-panel h-full flex flex-col">
      <div className="px-4 py-2.5 border-b border-[oklch(0.14_0.004_250)]">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-mono text-[oklch(0.45_0.006_250)] uppercase tracking-wider">
            Packaging Line 4 — Machine Twin
          </h4>
          <span className="text-[10px] font-mono text-[oklch(0.40_0.006_250)] uppercase">Physical view</span>
        </div>
        {operatorReport && (
          <p className="text-[11px] text-[oklch(0.65_0.08_60)] mt-1 leading-relaxed italic">
            Operator: "{operatorReport}"
          </p>
        )}
        {symptom && (
          <p className="text-[11px] text-[oklch(0.55_0.008_250)] mt-1 leading-relaxed">{symptom}</p>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2.5">
        {/* Physical device row — safety string + motor as plant-floor equipment */}
        <div className="grid grid-cols-4 gap-1 py-2 rounded-lg bg-[oklch(0.06_0.003_250)] border border-[oklch(0.12_0.004_250)]">
          {devices.map((d) => (
            <div key={d.key} className="flex flex-col items-center gap-0.5 px-0.5">
              <div className="h-[54px] flex items-center justify-center">{d.node}</div>
              <span className="diag-text-xs font-mono text-[oklch(0.60_0.008_250)] font-semibold leading-none">{d.label}</span>
              <span className="text-[8px] font-mono text-[oklch(0.42_0.006_250)] uppercase tracking-wide leading-none">{d.caption}</span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                  d.fault
                    ? "text-[oklch(0.72_0.16_30)] bg-[oklch(0.14_0.05_30)]"
                    : d.state === "RUNNING"
                      ? "text-[oklch(0.75_0.14_155)] bg-[oklch(0.12_0.04_155)]"
                      : "text-[oklch(0.50_0.008_250)] bg-[oklch(0.10_0.003_250)]"
                }`}
              >
                {d.state}
              </span>
            </div>
          ))}
        </div>

        {/* Conveyor line — belt, drive motor, photo-eye, product, stack light */}
        <div className="relative flex-1 min-h-[104px] rounded-lg border border-[oklch(0.18_0.004_250)] bg-[oklch(0.05_0.003_250)] overflow-hidden">
          {/* stack light (status tower) top-left */}
          <div className="absolute left-3 top-2 z-10 flex flex-col items-center">
            <StackLight run={greenLight} fault={redLight} />
            <span className="diag-text-xs font-mono text-[oklch(0.45_0.006_250)]">STATUS</span>
          </div>

          {/* belt */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-14 bg-[oklch(0.10_0.003_250)] border-y border-[oklch(0.20_0.004_250)]">
            {beltRunning && (
              <motion.div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, oklch(0.25 0.006 250) 0px, oklch(0.25 0.006 250) 8px, transparent 8px, transparent 16px)",
                }}
                animate={{ backgroundPositionX: ["0px", "32px"] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            )}
            {mechanicalFault && motorCoilEnergized && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="diag-text-xs font-mono text-[oklch(0.70_0.15_30)] bg-[oklch(0.12_0.04_30)] px-2 py-1 rounded border border-[oklch(0.55_0.15_30/50%)]">
                  OUTPUT ON — NO MOTION
                </span>
              </div>
            )}
          </div>

          {/* drive roller / pulley at the belt end, coupled to M1 */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full border-2 ${
                contactorPulled
                  ? "border-[oklch(0.60_0.14_155)] bg-[oklch(0.14_0.05_155)]"
                  : "border-[oklch(0.35_0.01_250)] bg-[oklch(0.10_0.003_250)]"
              }`}
            />
            <span className="diag-text-xs font-mono text-[oklch(0.45_0.006_250)] mt-0.5">DRIVE·M1</span>
          </div>

          {/* photo-eye */}
          <div className="absolute left-[56%] top-1/2 -translate-y-[72%] flex flex-col items-center">
            <PhotoeyeDevice blocked={photoeyeBlocked} />
            <span className="diag-text-xs font-mono text-[oklch(0.45_0.006_250)]">PE1</span>
          </div>

          {/* debris blocking photoeye beam — visible during photoeye_jam */}
          {photoeyeBlocked && productOnBelt && (
            <motion.div
              className="absolute left-[55%] top-1/2 -translate-y-1/2 flex flex-col items-center z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-6 h-5 rounded-sm border border-[oklch(0.55_0.15_30)] bg-[oklch(0.20_0.08_30)] flex items-center justify-center">
                <span className="text-[7px] font-mono text-[oklch(0.70_0.15_30)] font-bold">JAM</span>
              </div>
            </motion.div>
          )}

          {/* product box */}
          {productOnBelt && (
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-10 h-8 rounded border-2 border-[oklch(0.45_0.06_60)] bg-[oklch(0.25_0.04_60)]"
              animate={beltRunning ? { left: ["8%", "62%"] } : { left: photoeyeBlocked ? "54%" : "20%" }}
              transition={beltRunning ? { duration: 4, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
            />
          )}
        </div>

        {/* Status readout */}
        <div className="grid grid-cols-2 gap-2 diag-text-xs font-mono">
          <div className="px-2 py-1.5 rounded bg-[oklch(0.08_0.003_250)] border border-[oklch(0.14_0.004_250)]">
            <span className="text-[oklch(0.45_0.006_250)]">Belt: </span>
            <span className={beltRunning ? "text-[oklch(0.75_0.12_155)]" : "text-[oklch(0.55_0.15_30)]"}>
              {beltRunning ? "RUNNING" : "STOPPED"}
            </span>
          </div>
          <div className="px-2 py-1.5 rounded bg-[oklch(0.08_0.003_250)] border border-[oklch(0.14_0.004_250)]">
            <span className="text-[oklch(0.45_0.006_250)]">Speed: </span>
            <span className="text-white">{beltRunning ? `${fpm} FPM` : "0 FPM"}</span>
          </div>
          <div className="px-2 py-1.5 rounded bg-[oklch(0.08_0.003_250)] border border-[oklch(0.14_0.004_250)]">
            <span className="text-[oklch(0.45_0.006_250)]">O:2/0: </span>
            <span className={motorCoilEnergized ? "text-[oklch(0.75_0.12_155)]" : "text-[oklch(0.50_0.006_250)]"}>
              {motorCoilEnergized ? "ON" : "OFF"}
            </span>
          </div>
          <div className="px-2 py-1.5 rounded bg-[oklch(0.08_0.003_250)] border border-[oklch(0.14_0.004_250)]">
            <span className="text-[oklch(0.45_0.006_250)]">M1 starter: </span>
            <span className={contactorPulled ? "text-[oklch(0.75_0.12_155)]" : "text-[oklch(0.50_0.006_250)]"}>
              {contactorPulled ? "PULLED" : "DROPPED"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
