/**
 * Programs page semester placement — organization only.
 * Inclusion is driven by courses.listModules; unlisted slugs go to fallback semester.
 */

export interface SemesterConfig {
  number: number;
  title: string;
  description: string;
  /** DB course_modules.slug values in display order */
  moduleSlugs: string[];
}

export const PROGRAMS_SEMESTERS: SemesterConfig[] = [
  {
    number: 1,
    title: "Foundations",
    description: "Build your core electrical and mechanical knowledge",
    moduleSlugs: [
      "electrical-fundamentals",
      "print-reading",
      "power-distribution",
      "digital-fundamentals",
      "hvac-fundamentals",
      "safety-systems",
      "sensor-fundamentals",
      "instrumentation-basics",
    ],
  },
  {
    number: 2,
    title: "Systems & Controls",
    description: "Master automation systems and instrumentation",
    moduleSlugs: [
      "motors-controls",
      "plc-fundamentals",
      "fluid-power",
      "sensors-instrumentation",
      "semiconductor-fundamentals",
      "photoelectric-sensors",
      "position-limit-switches",
      "measurement-devices",
    ],
  },
  {
    number: 3,
    title: "Advanced Systems",
    description: "Specialize in advanced industrial technologies",
    moduleSlugs: [
      "powerflex-vfd",
      "industrial-networking",
      "process-control",
      "robotics-fundamentals",
      "calibration-troubleshooting",
      "plc-connection-fundamentals",
      "rslinx-communication-setup",
      "studio-5000-safe-access",
    ],
  },
  {
    number: 4,
    title: "Mastery & Capstone",
    description: "Integrate all skills in real-world scenarios",
    moduleSlugs: [
      "preventative-maintenance",
      "alignment",
      "industrial-troubleshooting",
      "real-troubleshooting-workflow",
      "safe-online-edits",
      "drives-servo-communication",
      "real-world-fault-scenarios",
    ],
  },
];

export const FALLBACK_SEMESTER_NUMBER = 5;

export const FALLBACK_SEMESTER: SemesterConfig = {
  number: FALLBACK_SEMESTER_NUMBER,
  title: "Additional Modules",
  description: "Published modules awaiting semester placement",
  moduleSlugs: [],
};

/** All slugs explicitly assigned across configured semesters */
export function getConfiguredModuleSlugs(): Set<string> {
  return new Set(PROGRAMS_SEMESTERS.flatMap((s) => s.moduleSlugs));
}

/**
 * Slugs returned by the API that are not in PROGRAMS_SEMESTERS.
 * Sorted by orderIndex then title for stable fallback ordering.
 */
export function getUnassignedSlugs(
  publishedSlugs: { slug: string; orderIndex: number; title: string }[]
): string[] {
  const configured = getConfiguredModuleSlugs();
  return publishedSlugs
    .filter((m) => !configured.has(m.slug))
    .sort((a, b) => a.orderIndex - b.orderIndex || a.title.localeCompare(b.title))
    .map((m) => m.slug);
}

/**
 * Semesters to render, appending a fallback semester when unassigned modules exist.
 */
export function resolveProgramsSemesters(unassignedSlugs: string[]): SemesterConfig[] {
  if (unassignedSlugs.length === 0) {
    return PROGRAMS_SEMESTERS;
  }
  return [
    ...PROGRAMS_SEMESTERS,
    {
      ...FALLBACK_SEMESTER,
      moduleSlugs: unassignedSlugs,
    },
  ];
}
