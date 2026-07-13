import type { FaultId, MachineState, PlcState } from "./types";
import { getFaultEvidenceIds } from "./faultInjectionEngine";

/** Discover evidence items based on current PLC and machine state */
export function discoverEvidence(
  faultId: FaultId,
  plc: PlcState,
  machine: MachineState,
  alreadyFound: string[]
): string[] {
  if (faultId === "normal") return alreadyFound;

  const possible = getFaultEvidenceIds(faultId);
  const found = new Set(alreadyFound);

  for (const id of possible) {
    if (found.has(id)) continue;

    switch (id) {
      case "io_estop_true":
        // Fail-safe: E-stop fault shows as a de-energized input (I:1/2 = 0).
        if (!plc.inputs["I:1/2"]) found.add(id);
        break;
      case "io_guard_open":
        // Fail-safe: Guard fault shows as a de-energized input (I:1/3 = 0).
        if (!plc.inputs["I:1/3"]) found.add(id);
        break;
      case "io_stop_open":
        // Fail-safe: STOP stuck shows as a de-energized input (I:1/0 = 0).
        if (!plc.inputs["I:1/0"]) found.add(id);
        break;
      case "rung2_blocked":
        if (!plc.internals["B3:0/1"] && plc.internals["B3:0/0"]) found.add(id);
        break;
      case "motor_off":
        if (!plc.outputs["O:2/0"]) found.add(id);
        break;
      case "rung4_pe_blocked":
        if (faultId === "photoeye_stuck_on" && plc.inputs["I:1/5"]) found.add(id);
        break;
      case "io_overload_true":
        // Fail-safe: overload trip shows as a de-energized input (I:1/4 = 0).
        if (!plc.inputs["I:1/4"]) found.add(id);
        break;
      case "rung4_blocked":
        if (!plc.inputs["I:1/4"]) found.add(id);
        break;
      case "red_light":
        if (plc.outputs["O:2/2"]) found.add(id);
        break;
      case "io_pe_true":
        if (plc.inputs["I:1/5"] && !machine.beltRunning) found.add(id);
        if (plc.inputs["I:1/5"] && (faultId === "photoeye_stuck_on" || faultId === "photoeye_jam")) found.add(id);
        break;
      case "pe_blocked_no_product":
        if (faultId === "photoeye_stuck_on" && machine.photoeyeBlocked) found.add(id);
        break;
      case "pe_beam_blocked":
        if (faultId === "photoeye_jam" && machine.photoeyeBlocked) found.add(id);
        break;
      case "rung4_xio_open":
        if (faultId === "photoeye_jam" && plc.inputs["I:1/5"]) found.add(id);
        break;
      case "motor_output_on":
        if (plc.outputs["O:2/0"]) found.add(id);
        break;
      case "belt_stopped":
        if (plc.outputs["O:2/0"] && !machine.beltRunning) found.add(id);
        break;
      case "contactor_pulled":
        if (faultId === "output_on_motor_dead" && plc.outputs["O:2/0"] && !machine.contactorPulled) found.add(id);
        break;
    }
  }

  return Array.from(found);
}
