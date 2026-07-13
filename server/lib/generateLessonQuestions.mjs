/**
 * Content-aware question generation from lesson markdown.
 * Used by seed-lesson-assessments.mjs for all published lessons.
 */

const DISTRACTOR_POOL = [
  "Skip verification and replace the largest component first",
  "Ignore operator reports and rely only on intuition",
  "Apply maximum voltage to speed up diagnosis",
  "Bypass safety interlocks to restore production faster",
  "Use non-RMS meters on all PWM drive outputs",
  "Megger motor leads without disconnecting the VFD",
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(correct, count, pool) {
  const filtered = pool.filter((p) => p !== correct && !correct.includes(p.slice(0, 20)));
  return shuffle(filtered).slice(0, count);
}

export function extractConcepts(content, title) {
  const headers = [];
  for (const m of content.matchAll(/^#{2,3}\s+(.+)$/gm)) {
    headers.push(m[1].replace(/\*+/g, "").trim());
  }

  const boldTerms = [];
  for (const m of content.matchAll(/\*\*([^*]+)\*\*/g)) {
    const t = m[1].trim();
    if (t.length > 3 && t.length < 80) boldTerms.push(t);
  }

  const bullets = [];
  for (const m of content.matchAll(/^[-*]\s+(.+)$/gm)) {
    const b = m[1].replace(/\*+/g, "").trim();
    if (b.length > 10 && b.length < 200) bullets.push(b);
  }

  const sentences = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^#+\s.+$/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .split(/[.!?]\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 220);

  return {
    title,
    headers: [...new Set(headers)].slice(0, 8),
    boldTerms: [...new Set(boldTerms)].slice(0, 12),
    bullets: [...new Set(bullets)].slice(0, 10),
    sentences: [...new Set(sentences)].slice(0, 8),
  };
}

function makeMcq(question, correctAnswer, distractors, explanation) {
  const options = shuffle([correctAnswer, ...distractors.slice(0, 3)]);
  const correctIndex = options.indexOf(correctAnswer);
  return { question, options, correctIndex, explanation };
}

export function generateQuestionsForLesson({ content, title, moduleTitle, orderIndex }) {
  const c = extractConcepts(content, title);
  const knowledgeChecks = [];
  const lessonQuizzes = [];

  const focus =
    c.headers[0] ||
    c.boldTerms[0] ||
    `core concepts in ${title}`;

  // ── Knowledge checks (2 formative) ──
  if (c.headers.length >= 2) {
    const wrong = c.headers.slice(1, 4);
    while (wrong.length < 3) wrong.push(`Unrelated topic from ${moduleTitle}`);
    knowledgeChecks.push(
      makeMcq(
        `Which topic is a primary focus of "${title}"?`,
        c.headers[0],
        wrong,
        `"${title}" covers ${c.headers[0]} as a key learning objective in ${moduleTitle}.`,
      ),
    );
  } else {
    knowledgeChecks.push(
      makeMcq(
        `What is the main learning objective of the lesson "${title}"?`,
        `Apply ${focus} in industrial maintenance practice`,
        [
          `Memorize unrelated theory with no field application`,
          `Avoid using standard troubleshooting sequence`,
          `Skip documentation of findings`,
        ],
        `This lesson builds practical skill around ${focus}.`,
      ),
    );
  }

  const keyTerm = c.boldTerms[0] || focus;
  knowledgeChecks.push(
    makeMcq(
      `In "${title}", why is "${keyTerm}" important for maintenance technicians?`,
      `It supports safe, accurate troubleshooting and reliable equipment operation`,
      pickDistractors("safe operation", 3, DISTRACTOR_POOL),
      `Understanding ${keyTerm} reduces downtime and prevents unsafe shortcuts on the plant floor.`,
    ),
  );

  // ── Lesson quiz (4 summative) ──
  if (c.bullets.length >= 1) {
    const bullet = c.bullets[0];
    const shortCorrect = bullet.length > 90 ? bullet.slice(0, 87) + "…" : bullet;
    lessonQuizzes.push(
      makeMcq(
        `Which practice aligns with "${title}"?`,
        shortCorrect,
        pickDistractors(shortCorrect, 3, [...DISTRACTOR_POOL, ...c.bullets.slice(1, 3)]),
        bullet,
      ),
    );
  }

  if (c.sentences.length >= 1) {
    const sentence = c.sentences[0];
    const shortCorrect = sentence.length > 90 ? sentence.slice(0, 87) + "…" : sentence;
    lessonQuizzes.push(
      makeMcq(
        `Based on this lesson, which statement is correct?`,
        shortCorrect,
        pickDistractors(shortCorrect, 3, DISTRACTOR_POOL),
        sentence,
      ),
    );
  }

  if (c.boldTerms.length >= 2) {
    const term = c.boldTerms[1] || c.boldTerms[0];
    lessonQuizzes.push(
      makeMcq(
        `When working through "${title}", a technician should prioritize understanding:`,
        term,
        pickDistractors(term, 3, c.boldTerms.filter((t) => t !== term).concat(DISTRACTOR_POOL)),
        `${term} is a critical concept introduced in this lesson.`,
      ),
    );
  }

  const seq = orderIndex + 1;
  lessonQuizzes.push(
    makeMcq(
      `A technician has completed lesson ${seq} ("${title}") in ${moduleTitle}. What is the expected next step in the learning path?`,
      `Pass the lesson knowledge check and lesson quiz before advancing`,
      [
        `Skip assessments and jump to the module capstone quiz`,
        `Mark complete without answering any questions`,
        `Advance without verifying comprehension`,
      ],
      `Accreditation-aligned progression requires passing formative and summative checks per lesson.`,
    ),
  );

  // Pad to minimum counts
  while (knowledgeChecks.length < 2) {
    knowledgeChecks.push(
      makeMcq(
        `Before advancing from "${title}", what must you demonstrate?`,
        `Comprehension of the lesson's key maintenance concepts`,
        pickDistractors("comprehension", 3, DISTRACTOR_POOL),
        `Knowledge checks verify understanding before progression.`,
      ),
    );
  }
  while (lessonQuizzes.length < 4) {
    const n = lessonQuizzes.length + 1;
    lessonQuizzes.push(
      makeMcq(
        `Application question ${n} for "${title}": What best reflects competent practice?`,
        `Follow systematic troubleshooting and apply lesson concepts in the field`,
        pickDistractors("systematic", 3, DISTRACTOR_POOL),
        `Competent practice combines theory from "${title}" with disciplined field procedure.`,
      ),
    );
  }

  return {
    knowledgeChecks: knowledgeChecks.slice(0, 2),
    lessonQuizzes: lessonQuizzes.slice(0, 4),
  };
}
