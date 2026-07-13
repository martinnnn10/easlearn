/**
 * Skill track cards for Learn / Courses page (UX Priority 4).
 * Maps display tracks to existing module routes — no new content.
 */
import { LESSON_PRACTICE_MAP } from "./lessonPracticeMap";

export type TrackDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface SkillTrack {
  id: string;
  name: string;
  description: string;
  moduleSlug: string;
  lessonCount: number;
  estimatedHours: number;
  difficulty: TrackDifficulty;
  startRoute: string;
}

function pathLessonCount(pathSlug: string): number {
  return LESSON_PRACTICE_MAP.find((p) => p.pathSlug === pathSlug)?.units.length ?? 0;
}

export const SKILL_TRACKS: SkillTrack[] = [
  {
    id: "electrical",
    name: "Electrical Fundamentals",
    description: "Ohm's law, meters, circuits, and safe work practices for maintenance techs.",
    moduleSlug: "ohms-law-power",
    lessonCount: 5,
    estimatedHours: 4,
    difficulty: "Beginner",
    startRoute: "/courses/ohms-law-power",
  },
  {
    id: "plc",
    name: "PLC / Controls",
    description: "Ladder logic, I/O troubleshooting, and Allen-Bradley PLC diagnostics.",
    moduleSlug: "plc-fundamentals",
    lessonCount: pathLessonCount("plc-fundamentals"),
    estimatedHours: 10,
    difficulty: "Intermediate",
    startRoute: "/courses/plc-fundamentals",
  },
  {
    id: "vfd",
    name: "VFD / Drives",
    description: "PowerFlex parameters, fault codes, and drive troubleshooting.",
    moduleSlug: "powerflex-vfd",
    lessonCount: pathLessonCount("powerflex-vfd"),
    estimatedHours: 8,
    difficulty: "Intermediate",
    startRoute: "/courses/powerflex-vfd",
  },
  {
    id: "fluid-power",
    name: "Hydraulics & Pneumatics",
    description: "Fluid power circuits, valves, pressure diagnostics, and PM.",
    moduleSlug: "fluid-power",
    lessonCount: 6,
    estimatedHours: 7,
    difficulty: "Beginner",
    startRoute: "/courses/fluid-power",
  },
  {
    id: "instrumentation",
    name: "Process Instrumentation",
    description: "Sensors, transmitters, loops, and field device troubleshooting.",
    moduleSlug: "sensors-instrumentation",
    lessonCount: pathLessonCount("sensors-instrumentation"),
    estimatedHours: 6,
    difficulty: "Intermediate",
    startRoute: "/courses/sensors-instrumentation",
  },
  {
    id: "safety",
    name: "Safety Systems",
    description: "E-stops, guard circuits, safety relays, and LOTO procedures.",
    moduleSlug: "safety-systems",
    lessonCount: pathLessonCount("safety-systems"),
    estimatedHours: 5,
    difficulty: "Beginner",
    startRoute: "/courses/safety-systems",
  },
];
