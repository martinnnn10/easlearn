import { LESSON_PRACTICE_MAP } from "../shared/lessonPracticeMap.ts";
import { getLessonCardDeck, isCardFormatLesson } from "../shared/lessonCardContent.ts";

const bad = [];
for (const p of LESSON_PRACTICE_MAP) {
  for (const u of p.units) {
    if (!isCardFormatLesson(p.pathSlug, u.lessonSlug)) continue;
    const d = getLessonCardDeck(p.pathSlug, u.lessonSlug);
    const i = d.cards.findIndex((c) => c.kind === "interaction");
    if (i !== 2) bad.push(`${p.pathSlug}/${u.lessonSlug}: card ${i + 1}`);
  }
}
console.log("non-card-3 KC:", bad.length);
bad.forEach((x) => console.log(x));
