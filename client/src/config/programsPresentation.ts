/**
 * Visual presentation for Programs page cards — does not control module visibility.
 */
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  AlignCenter,
  BookOpen,
  Bot,
  Cpu,
  Edit,
  Eye,
  FileText,
  Gauge,
  Network,
  Radio,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Target,
  Thermometer,
  ToggleLeft,
  Wrench,
  Zap,
} from "lucide-react";

const MODULE_ICONS: Record<string, LucideIcon> = {
  Gauge: Gauge,
  Cpu: Cpu,
  Settings: Settings,
  Zap: Zap,
  AlignCenter: AlignCenter,
  Wrench: Wrench,
  Binary: Cpu,
  Thermometer: Thermometer,
  AlertTriangle: AlertTriangle,
  Network: Network,
  Bot: Bot,
  ShieldCheck: ShieldCheck,
  FileText: FileText,
  Activity: Activity,
  Shield: Shield,
  Edit: Edit,
  Search: Search,
  radio: Radio,
  eye: Eye,
  "toggle-left": ToggleLeft,
  gauge: Gauge,
  cpu: Cpu,
  settings: Settings,
  zap: Zap,
  aligncenter: AlignCenter,
  wrench: Wrench,
};

const SLUG_COLORS: Record<string, string> = {
  "electrical-fundamentals": "oklch(0.75 0.15 85)",
  "motors-controls": "oklch(0.75 0.15 155)",
  "plc-fundamentals": "oklch(0.75 0.15 250)",
  "digital-fundamentals": "oklch(0.70 0.12 290)",
  "semiconductor-fundamentals": "oklch(0.70 0.12 30)",
  "fluid-power": "oklch(0.70 0.15 200)",
  "hvac-fundamentals": "oklch(0.70 0.12 180)",
  alignment: "oklch(0.65 0.10 50)",
  "sensors-instrumentation": "oklch(0.75 0.13 60)",
  "industrial-networking": "oklch(0.70 0.12 220)",
  "robotics-fundamentals": "oklch(0.70 0.15 310)",
  "safety-systems": "oklch(0.70 0.15 25)",
  "print-reading": "oklch(0.65 0.08 240)",
  "preventative-maintenance": "oklch(0.65 0.10 120)",
  "industrial-troubleshooting": "oklch(0.75 0.15 0)",
  "powerflex-vfd": "oklch(0.72 0.14 145)",
  "process-control": "oklch(0.68 0.12 320)",
  "power-distribution": "oklch(0.72 0.13 75)",
};

const PATH_COLORS: Record<string, string> = {
  foundational: "oklch(0.70 0.12 200)",
  advanced: "oklch(0.72 0.14 250)",
};

/** Optional topic chips for expanded card (legacy academies content preserved where mapped) */
const TOPICS_BY_SLUG: Record<string, string[]> = {
  "electrical-fundamentals": [
    "Voltage", "Current", "Resistance", "Ohm's Law", "AC/DC", "Electrical Safety",
  ],
  "motors-controls": [
    "Motor Starters", "Overloads", "Three-Phase Power", "VFD Fundamentals", "MCC",
  ],
  "plc-fundamentals": [
    "PLC Architecture", "Ladder Logic", "Timers", "I/O Troubleshooting", "Communications",
  ],
  "digital-fundamentals": ["Binary", "Logic Gates", "Industrial I/O", "Sinking/Sourcing"],
  "semiconductor-fundamentals": ["Diodes", "Transistors", "IGBTs", "Power Supplies", "VFD Internals"],
  "fluid-power": ["Pneumatics", "Hydraulics", "Valves", "Schematics", "Pressure Systems"],
  "hvac-fundamentals": ["Refrigeration Cycle", "Compressors", "HVAC Controls", "Safeties"],
  alignment: ["Dial Indicator", "Laser Alignment", "Soft Foot", "Thermal Growth"],
  "sensors-instrumentation": ["Proximity Sensors", "4-20mA", "Photoeyes", "Calibration"],
  "industrial-networking": ["Ethernet/IP", "Managed Switches", "VLANs", "PLC Networking"],
  "robotics-fundamentals": ["Robot Axes", "PLC Integration", "Motion Control", "Fault Recovery"],
  "safety-systems": ["E-stops", "Light Curtains", "Safety PLCs", "Risk Assessment"],
  "print-reading": ["Ladder Diagrams", "Schematics", "Panel Layouts", "Wire Tracing"],
  "preventative-maintenance": ["PM Programs", "Thermography", "Vibration", "RCFA"],
  "industrial-troubleshooting": [
    "Systematic Process", "VFD Faults", "PLC Diagnostics", "Intermittent Faults",
  ],
  "powerflex-vfd": ["Parameters", "Fault Codes", "Motor Data", "Communication"],
  "process-control": ["PID Control", "Control Valves", "Loop Tuning", "Instrumentation"],
  "power-distribution": ["Switchgear", "MCCs", "Grounding", "Arc Flash"],
  "plc-connection-fundamentals": ["Ethernet/IP", "IP Addressing", "Physical Layer"],
  "rslinx-communication-setup": ["RSLinx Drivers", "RSWho", "Driver Conflicts"],
  "studio-5000-safe-access": ["Online Mode", "Processor Keys", "Safe Monitoring"],
  "real-troubleshooting-workflow": ["Ladder Logic", "HMI Faults", "Root Cause"],
  "safe-online-edits": ["Online Edits", "Bypass Documentation", "Version Control"],
  "drives-servo-communication": ["VFD Ethernet/IP", "CIP Motion", "Device Integration"],
  "real-world-fault-scenarios": ["I/O Loss", "Drive Faults", "Safety Lockouts"],
  "sensor-fundamentals": ["Inductive", "Capacitive", "Ultrasonic", "Wiring"],
  "photoelectric-sensors": ["Through-Beam", "Retroreflective", "Diffuse", "Alignment"],
  "position-limit-switches": ["Limit Switches", "Reed Switches", "Encoders"],
  "instrumentation-basics": ["4-20mA", "0-10V", "Analog vs Discrete"],
  "measurement-devices": ["Pressure Transmitters", "RTDs", "Thermocouples", "Flow"],
  "calibration-troubleshooting": ["Loop Calibration", "Instrumentation Faults", "Datasheets"],
};

export function getModuleIcon(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return BookOpen;
  return MODULE_ICONS[iconName] ?? BookOpen;
}

export function getModuleColor(slug: string, path: string): string {
  return SLUG_COLORS[slug] ?? PATH_COLORS[path] ?? PATH_COLORS.advanced;
}

export function getModuleTopics(slug: string, description: string): string[] {
  if (TOPICS_BY_SLUG[slug]) {
    return TOPICS_BY_SLUG[slug];
  }
  const words = description
    .replace(/[.—]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(0, 6);
  return words.length > 0 ? words : [slug.replace(/-/g, " ")];
}

/** Display lab count — derived from lesson count when not overridden */
export function getDisplayLabCount(lessonCount: number): number {
  if (lessonCount <= 0) return 0;
  return Math.max(1, Math.ceil(lessonCount / 3));
}
