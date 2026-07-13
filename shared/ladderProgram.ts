/**
 * Ladder-logic program model — drives the RSLogix/Studio-5000-style ladder view.
 *
 * Kept deliberately simple (series contacts + optional seal-in branch + one output
 * per rung) which covers the classic start/stop/safety patterns the simulator
 * teaches, and renders cleanly. `energized` is the live "green when true" state.
 */

export type ContactType = "XIC" | "XIO"; // examine-if-closed (NO), examine-if-open (NC)
export type CoilType = "OTE" | "OTL" | "OTU"; // energize, latch, unlatch

export interface LadderContact {
  type: ContactType;
  address: string; // e.g. "I:1/2"
  nickname?: string; // e.g. "E_STOP"
  energized: boolean; // rung condition true (drawn green)
}

export interface LadderCoil {
  type: CoilType;
  address: string; // e.g. "O:2/0"
  nickname?: string;
  energized: boolean;
}

/** Instruction box: TON/TOF timers, CTU/CTD counters, LES/EQU/GEQ compares, XOR/MOV math. */
export interface LadderBox {
  instr: string; // "TON", "CTU", "LES", "XOR", "MOV"
  title?: string; // "Timer On Delay", "Less Than (A<B)"
  operands: { label: string; value: string }[];
  /** Right-side output legs for OUTPUT boxes (e.g. ["EN","DN"]); omit for compare boxes. */
  legs?: string[];
  energized?: boolean;
}

export interface LadderRung {
  number: number;
  comment?: string;
  /** Main-line series contacts, left → right. */
  series: LadderContact[];
  /** Optional compare box in the condition path (drawn after the series contacts). */
  compare?: LadderBox;
  /** Optional parallel branch (seal-in) around the FIRST series contact. */
  sealIn?: LadderContact;
  /** A coil OR an output instruction box terminates the rung. */
  coil?: LadderCoil;
  outputBox?: LadderBox;
}

export interface LadderProgram {
  rungs: LadderRung[];
}

/**
 * PL-07 conveyor safety + motor-run ladder, aligned to the scenario's real
 * addresses (I:1/2 E-stop, I:1/4 overload, I:1/5 photoeye, O:2/0 motor).
 * `safetyOk` false = the safety-circuit fault; `running` = motor commanded.
 */
export function buildConveyorLadder(safetyOk: boolean, running: boolean): LadderProgram {
  return {
    rungs: [
      {
        number: 0,
        comment: "Safety circuit OK when E-Stop chain closed and overload not tripped",
        series: [
          { type: "XIC", address: "I:1/2", nickname: "E_STOP_OK", energized: safetyOk },
          { type: "XIC", address: "I:1/4", nickname: "OL_OK", energized: safetyOk },
        ],
        coil: { type: "OTE", address: "B3:0", nickname: "SAFETY_OK", energized: safetyOk },
      },
      {
        number: 1,
        comment: "Run the conveyor motor when safety is OK and the path is clear",
        series: [
          { type: "XIC", address: "B3:0", nickname: "SAFETY_OK", energized: safetyOk },
          { type: "XIC", address: "I:1/5", nickname: "PATH_CLEAR", energized: safetyOk && running },
        ],
        sealIn: { type: "XIC", address: "O:2/0", nickname: "MTR_RUN", energized: running },
        coil: { type: "OTE", address: "O:2/0", nickname: "MTR_RUN", energized: running },
      },
    ],
  };
}

/**
 * Instruction-box reference ladder — exercises the timer / counter / compare /
 * math boxes the renderer now supports (TON, CTU, LES, XOR). Used by authoring
 * and lessons to show a "full" program beyond the start/stop/seal-in pattern.
 * `jamBlocked` = photoeye blocked (timer accumulating); `accum` drives displays.
 */
export function buildInstructionDemoLadder(jamBlocked: boolean, accum = 0): LadderProgram {
  return {
    rungs: [
      {
        number: 0,
        comment: "Jam timer — start a 5 s timer while the photo-eye is blocked and the motor runs",
        series: [
          { type: "XIC", address: "O:2/0", nickname: "MTR_RUN", energized: true },
          { type: "XIO", address: "I:1/5", nickname: "PATH_CLEAR", energized: jamBlocked },
        ],
        outputBox: {
          instr: "TON",
          title: "Timer On Delay",
          operands: [
            { label: "Timer", value: "T4:0" },
            { label: "Time Base", value: "1.0" },
            { label: "Preset", value: "5" },
            { label: "Accum", value: String(accum) },
          ],
          legs: ["EN", "DN"],
          energized: jamBlocked,
        },
      },
      {
        number: 1,
        comment: "Count each part as it clears the photo-eye",
        series: [{ type: "XIC", address: "I:1/5", nickname: "PART_EDGE", energized: !jamBlocked }],
        outputBox: {
          instr: "CTU",
          title: "Count Up",
          operands: [
            { label: "Counter", value: "C5:0" },
            { label: "Preset", value: "100" },
            { label: "Accum", value: "42" },
          ],
          legs: ["CU", "DN"],
          energized: !jamBlocked,
        },
      },
      {
        number: 2,
        comment: "Fault the line if the jam timer times out (Accum < Preset is FALSE ⇒ DN)",
        series: [{ type: "XIC", address: "T4:0/DN", nickname: "JAM_TMR_DN", energized: jamBlocked && accum >= 5 }],
        compare: {
          instr: "LES",
          title: "Less Than (A<B)",
          operands: [
            { label: "Source A", value: "T4:0.ACC" },
            { label: "Source B", value: "5" },
          ],
          energized: accum < 5,
        },
        coil: { type: "OTL", address: "B3:1", nickname: "JAM_FAULT", energized: jamBlocked && accum >= 5 },
      },
    ],
  };
}
