/** Local QA-only legacy lesson bodies when DB is unavailable (`?qa=full`). */
const PARA =
  "Induction motors use rotating magnetic fields from stator windings. Understanding slip, torque, and nameplate data prevents misdiagnosis when a motor hums but does not turn.\n\n";

export const LEGACY_QA_LESSON_CONTENT: Record<
  string,
  { title: string; moduleTitle: string; estimatedMinutes: number; content: string }
> = {
  "motors-controls/motor-theory": {
    title: "AC & DC Motor Theory",
    moduleTitle: "Motors & Motor Controls",
    estimatedMinutes: 25,
    content: `# AC & DC Motor Theory\n\n${PARA.repeat(60)}`,
  },
};

export function getLegacyQaLesson(moduleSlug: string, lessonSlug: string) {
  return LEGACY_QA_LESSON_CONTENT[`${moduleSlug}/${lessonSlug}`];
}
