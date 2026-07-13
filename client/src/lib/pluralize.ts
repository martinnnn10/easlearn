/**
 * Simple pluralization utility for English nouns.
 * Returns singular form when count is 1, plural otherwise.
 *
 * @example
 * pluralize(1, "lesson") // "1 lesson"
 * pluralize(5, "lesson") // "5 lessons"
 * pluralize(0, "quiz", "quizzes") // "0 quizzes"
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  const form = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${form}`;
}

/**
 * Returns just the noun form (no count prefix).
 */
export function pluralNoun(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
