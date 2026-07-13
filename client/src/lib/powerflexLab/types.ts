export type FaultId = "normal" | "overcurrent" | "dc_bus_undervoltage" | "cooling_fan_seized";

export type LabMode = "learn" | "practice" | "guided";

export type MobilePanel = "drive" | "parameters" | "status" | "actions";

export type DiagnosticStep =
  | "check_fault_display"
  | "check_fault_history"
  | "check_status_monitor"
  | "check_parameters"
  | "review_reference"
  | "clear_fault";

export interface FaultLogEntry {
  timestamp: string;
  code: string;
  description: string;
  severity: "info" | "warning" | "critical";
}

export interface PowerFlexFault {
  id: FaultId;
  label: string;
  faultCode: string;
  symptom: string;
  operatorReport: string;
  rootCause: string;
  correctFirstStep: DiagnosticStep;
  evidence: string[];
  incorrectPaths: string[];
  faultLog: FaultLogEntry[];
  v3ScenarioId: string;
}

export interface DriveTelemetry {
  statusWord: string;
  outputFreqHz: number;
  outputCurrentA: number;
  dcBusVolts: number;
  loadPercent: number;
  heatsinkTempC: number;
  fanRpm: number;
  displayLine1: string;
  displayLine2: string;
  faultActive: boolean;
}

export interface DriveParameter {
  number: string;
  name: string;
  group: string;
  value: string;
  unit: string;
  note?: string;
  abnormal?: boolean;
}

export interface DiagnosticEvent {
  id: string;
  timestamp: number;
  type: "observation" | "action" | "measurement";
  description: string;
}

export interface LabScore {
  totalPercent: number;
  rootCauseCorrect: boolean;
  firstStepCorrect: boolean;
  timeSeconds: number;
  coachingTips: string[];
  dimensionLabels: { label: string; score: number; max: number }[];
}
