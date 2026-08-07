export type LabMode = "learn" | "practice" | "guided";

export type FaultId =
  | "normal"
  | "estop_open"
  | "guard_open"
  | "stop_stuck"
  | "photoeye_stuck_on"
  | "photoeye_jam"
  | "overload_tripped"
  | "output_on_motor_dead";

export type DiagnosticStep =
  | "check_estop"
  | "check_guard"
  | "check_io_panel"
  | "check_ladder_rung_2"
  | "check_overload"
  | "check_photoeye"
  | "check_motor_output_vs_motion"
  | "check_start_stop"
  | "review_prints"
  | "meter_measurement";

export type MeterProbeId =
  | "estop_nc"
  | "guard_nc"
  | "stop_nc"
  | "overload_nc"
  | "photoeye_signal"
  | "motor_coil"
  | "contactor_aux"
  | "output_terminal";

export type MeterMode = "continuity" | "voltage";

export interface TimerState {
  preset: number;
  accumulated: number;
  running: boolean;
  done: boolean;
}

export interface PlcState {
  inputs: Record<string, boolean>;
  internals: Record<string, boolean>;
  outputs: Record<string, boolean>;
  timers: Record<string, TimerState>;
  scanCount: number;
}

export interface MachineState {
  beltRunning: boolean;
  motorCoilEnergized: boolean;
  contactorPulled: boolean;
  photoeyeBlocked: boolean;
  estopPressed: boolean;
  guardOpen: boolean;
  overloadTripped: boolean;
  productOnBelt: boolean;
  mechanicalFault: boolean;
  fpm: number;
  greenLight: boolean;
  redLight: boolean;
  safeRun: boolean;
  runCmd: boolean;
  timerDone: boolean;
}

export interface ConveyorFault {
  id: FaultId;
  label: string;
  symptom: string;
  rootCause: string;
  correctFirstStep: DiagnosticStep;
  acceptableRootCauses: string[];
  evidence: string[];
  incorrectPaths: string[];
  operatorReport: string;
}

export interface LabScore {
  firstStepCorrect: boolean;
  toolUsed: DiagnosticStep | null;
  timeSeconds: number;
  rootCauseCorrect: boolean;
  safetyViolations: string[];
  totalPercent: number;
}

export interface DiagnosticEvent {
  id: string;
  timestamp: number;
  type: "observation" | "measurement" | "action" | "evidence" | "safety";
  description: string;
}

export type MobilePanel = "machine" | "ladder" | "diagnostics" | "actions";

export interface FlagshipLabScore extends LabScore {
  methodologyOverall: number;
  methodologyTier: string;
  dimensionLabels: { label: string; score: number; max: number }[];
  coachingTips: string[];
}
