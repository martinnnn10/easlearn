/** Marker stored in DB for lessons migrated to card decks (legacy markdown superseded). */
export const CARD_LESSON_CONTENT_STUB =
  "<!-- EASLearn card-format lesson — interactive deck served from shared/lessonDecks. Legacy markdown deprecated. -->";

export type LessonContentFormat = "markdown" | "cards";

export function isCardContentStub(content: string): boolean {
  return content.includes("EASLearn card-format lesson");
}
