import { CONVEYOR_RUNGS, type ConveyorRung } from "./conveyorProgram";
import type { PlcState, TimerState } from "./types";

const SCAN_TICK_SEC = 0.2;

function getAddr(
  address: string,
  inputs: Record<string, boolean>,
  internals: Record<string, boolean>,
  outputs: Record<string, boolean>,
  timers: Record<string, TimerState>
): boolean {
  if (address.startsWith("I:")) return inputs[address] ?? false;
  if (address.startsWith("B3:")) return internals[address] ?? false;
  if (address.startsWith("O:")) return outputs[address] ?? false;
  if (address === "T4:0/DN") return timers["T4:0"]?.done ?? false;
  return false;
}

function evaluateRung(
  rung: ConveyorRung,
  inputs: Record<string, boolean>,
  internals: Record<string, boolean>,
  outputs: Record<string, boolean>,
  timers: Record<string, TimerState>
): boolean {
  return rung.elements.every((el) => {
    const state = getAddr(el.address, inputs, internals, outputs, timers);
    return el.type === "XIC" ? state : !state;
  });
}

/** Single PLC scan cycle — pure function */
export function runScanCycle(state: PlcState): PlcState {
  const inputs = state.inputs;
  const newInternal = { ...state.internals };
  const newOutputs = { ...state.outputs };
  const newTimers = { ...state.timers };

  for (const rung of CONVEYOR_RUNGS) {
    const rungResult = evaluateRung(rung, inputs, newInternal, newOutputs, newTimers);

    if (rung.output.type === "coil") {
      if (rungResult) {
        if (rung.output.address.startsWith("B3:")) {
          newInternal[rung.output.address] = true;
        } else if (rung.output.address.startsWith("O:")) {
          newOutputs[rung.output.address] = true;
        }
      }
    } else if (rung.output.type === "timer_on") {
      const timerAddr = rung.output.address;
      const timer = newTimers[timerAddr] ?? {
        preset: rung.output.timerPreset ?? 3,
        accumulated: 0,
        running: false,
        done: false,
      };
      if (rungResult) {
        timer.running = true;
        timer.accumulated = Math.min(timer.accumulated + SCAN_TICK_SEC, timer.preset);
        timer.done = timer.accumulated >= timer.preset;
      } else {
        timer.running = false;
        timer.accumulated = 0;
        timer.done = false;
      }
      newTimers[timerAddr] = timer;
    }
  }

  // RUN_CMD seal-in clear
  const runCmdRungs = CONVEYOR_RUNGS.filter((r) => r.output.address === "B3:0/0");
  const anyRunCmd = runCmdRungs.some((rung) =>
    evaluateRung(rung, inputs, newInternal, newOutputs, newTimers)
  );
  if (!anyRunCmd) newInternal["B3:0/0"] = false;

  // Clear internal bits not driven this scan
  const internalAddresses = Array.from(
    new Set(
      CONVEYOR_RUNGS.filter((r) => r.output.type === "coil" && r.output.address.startsWith("B3:"))
        .map((r) => r.output.address)
    )
  );
  for (const addr of internalAddresses) {
    if (addr === "B3:0/0") continue;
    const driven = CONVEYOR_RUNGS.filter((r) => r.output.address === addr).some((rung) =>
      evaluateRung(rung, inputs, newInternal, newOutputs, newTimers)
    );
    if (!driven) newInternal[addr] = false;
  }

  // Clear outputs not driven
  const outputAddresses = Array.from(
    new Set(
      CONVEYOR_RUNGS.filter((r) => r.output.type === "coil" && r.output.address.startsWith("O:"))
        .map((r) => r.output.address)
    )
  );
  for (const addr of outputAddresses) {
    const driven = CONVEYOR_RUNGS.filter((r) => r.output.address === addr).some((rung) =>
      evaluateRung(rung, inputs, newInternal, newOutputs, newTimers)
    );
    if (!driven) newOutputs[addr] = false;
  }

  return {
    inputs,
    internals: newInternal,
    outputs: newOutputs,
    timers: newTimers,
    scanCount: state.scanCount + 1,
  };
}

export function getRungOutputActive(
  rung: ConveyorRung,
  plc: PlcState
): boolean {
  if (rung.output.type === "timer_on") {
    return plc.timers[rung.output.address]?.running ?? false;
  }
  if (rung.output.address.startsWith("B3:")) {
    return plc.internals[rung.output.address] ?? false;
  }
  return plc.outputs[rung.output.address] ?? false;
}

export function getElementPasses(
  el: { type: "XIC" | "XIO"; address: string },
  plc: PlcState
): boolean {
  const state = getAddr(el.address, plc.inputs, plc.internals, plc.outputs, plc.timers);
  return el.type === "XIC" ? state : !state;
}
