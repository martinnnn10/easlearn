/**
 * Six-track curriculum architecture — prerequisite-ordered skill progression.
 * Part 1 canonical sequence for technician training (zero → job-ready).
 */

export interface CurriculumTrack {
  id: string;
  trackNumber: number;
  name: string;
  /** Track ids that should be completed first */
  prerequisites: string[];
  /** Short summary for Courses page */
  description: string;
  /** Topics covered (display) */
  covers: string;
  /** Exit competency — what a tech can do after completing the track */
  exitCompetency: string;
  /** Published module slugs grouped under this track */
  moduleSlugs: readonly string[];
}

export const CURRICULUM_TRACKS: readonly CurriculumTrack[] = [
  {
    id: "electrical-fundamentals",
    trackNumber: 1,
    name: "Electrical Fundamentals",
    prerequisites: [],
    description:
      "Voltage, current, resistance, AC/DC theory, grounding, NEC basics, print reading, and safe multimeter work.",
    covers:
      "Ohm's law, Kirchhoff's laws, AC/DC theory, transformers, grounding, NEC basics, print reading, multimeter use, continuity and insulation resistance",
    exitCompetency:
      "Can safely troubleshoot a 480V control panel using a multimeter and prints",
    moduleSlugs: [
      "electrical-fundamentals",
      "print-reading",
      "power-distribution",
    ],
  },
  {
    id: "digital-control-fundamentals",
    trackNumber: 2,
    name: "Digital & Control Fundamentals",
    prerequisites: ["electrical-fundamentals"],
    description:
      "Binary and Boolean logic, relay control circuits, pilot devices, and 120V control power.",
    covers:
      "Binary/hex/BCD, logic gates, Boolean algebra, relay logic, control circuit design, selector switches, pilot devices, control transformers, 120V control circuits",
    exitCompetency:
      "Can trace a relay control circuit from prints and identify why a motor won't start",
    moduleSlugs: [
      "digital-fundamentals",
      "semiconductor-fundamentals",
      "safety-systems",
    ],
  },
  {
    id: "plc-controls",
    trackNumber: 3,
    name: "PLC / Controls",
    prerequisites: ["digital-control-fundamentals"],
    description:
      "Allen-Bradley PLC architecture, ladder logic, I/O troubleshooting, Studio 5000 online work, and industrial networking.",
    covers:
      "PLC architecture, scan cycle, I/O addressing, ladder instructions, timers/counters, program troubleshooting, ControlLogix/CompactLogix, Studio 5000, online monitoring, forcing I/O, tag-based addressing",
    exitCompetency:
      "Can go online with a ControlLogix, identify a faulted rung, force an output to test a field device, and document the finding",
    moduleSlugs: [
      "plc-fundamentals",
      "plc-connection-fundamentals",
      "rslinx-communication-setup",
      "studio-5000-safe-access",
      "industrial-networking",
      "safe-online-edits",
    ],
  },
  {
    id: "motors-drives-motion",
    trackNumber: 4,
    name: "Motors, Drives & Motion",
    prerequisites: ["electrical-fundamentals", "plc-controls"],
    description:
      "Motor theory, starters and overloads, PowerFlex VFD commissioning, fault diagnosis, and motion-related drive work.",
    covers:
      "Motor theory, nameplate data, motor testing, starter circuits, overload selection, VFD fundamentals, PowerFlex parameter groups, fault codes, harmonics, encoder feedback, closed-loop control",
    exitCompetency:
      "Can commission a PowerFlex 755, set accel/decel ramps, diagnose an F012 overcurrent fault, and determine whether the fault is motor, mechanical, or drive related",
    moduleSlugs: [
      "motors-controls",
      "powerflex-vfd",
      "drives-servo-communication",
    ],
  },
  {
    id: "sensors-instrumentation-process",
    trackNumber: 5,
    name: "Sensors, Instrumentation & Process",
    prerequisites: ["plc-controls"],
    description:
      "Field devices, 4-20mA loops, calibration, P&ID reading, and PID loop work.",
    covers:
      "Sensor types, NPN/PNP wiring, 4-20mA loops, HART, thermocouple/RTD, pressure transmitters, flow and level measurement, PID control, loop tuning, P&ID reading",
    exitCompetency:
      "Can calibrate a 4-20mA pressure transmitter, verify loop integrity, and tune a PID loop from a P&ID drawing",
    moduleSlugs: [
      "sensor-fundamentals",
      "instrumentation-basics",
      "sensors-instrumentation",
      "photoelectric-sensors",
      "position-limit-switches",
      "measurement-devices",
      "process-control",
      "calibration-troubleshooting",
    ],
  },
  {
    id: "mechanical-systems-reliability",
    trackNumber: 6,
    name: "Mechanical Systems & Reliability",
    prerequisites: ["electrical-fundamentals"],
    description:
      "Alignment, bearings, fluid power, vibration basics, PM programs, and plant reliability practices.",
    covers:
      "Bearings, shaft alignment, couplings, gearbox maintenance, lubrication, vibration analysis, hydraulics/pneumatics, contamination control, PM vs predictive maintenance, CMMS basics",
    exitCompetency:
      "Can perform a shaft alignment to 0.002\" tolerance, interpret a vibration spectrum for bearing defect frequencies, and troubleshoot a hydraulic system using a schematic and pressure gauges",
    moduleSlugs: [
      "fluid-power",
      "alignment",
      "preventative-maintenance",
      "hvac-fundamentals",
      "industrial-troubleshooting",
      "real-troubleshooting-workflow",
      "real-world-fault-scenarios",
    ],
  },
] as const;

const trackById = new Map(CURRICULUM_TRACKS.map((t) => [t.id, t]));

/** module slug → curriculum track id */
export const MODULE_CURRICULUM_TRACK: Record<string, string> = Object.fromEntries(
  CURRICULUM_TRACKS.flatMap((track) =>
    track.moduleSlugs.map((slug) => [slug, track.id] as const)
  )
);

export function getCurriculumTrackById(id: string): CurriculumTrack | undefined {
  return trackById.get(id);
}

export function getCurriculumTrackForModule(moduleSlug: string): CurriculumTrack | undefined {
  const trackId = MODULE_CURRICULUM_TRACK[moduleSlug];
  return trackId ? trackById.get(trackId) : undefined;
}

export function getPrerequisiteTrackNames(track: CurriculumTrack): string {
  if (track.prerequisites.length === 0) return "None — start here";
  return track.prerequisites
    .map((id) => trackById.get(id)?.name ?? id)
    .join(" + ");
}
