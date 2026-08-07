/**
 * Seed safety-critical knowledge checks for Basic Meter Usage lessons.
 * These are blocking gates — learner cannot advance without correct answers.
 * Run: node server/seed-meter-kc.mjs
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }
const connection = await mysql.createConnection(DATABASE_URL);

// Get lesson IDs for Basic Meter Usage module (id=200002)
const [lessons] = await connection.query(
  'SELECT id, slug FROM course_lessons WHERE moduleId = 200002 ORDER BY orderIndex'
);
const lessonMap = Object.fromEntries(lessons.map(l => [l.slug, l.id]));
console.log('Lesson IDs:', lessonMap);

// Safety-critical KC questions per lesson
// These use blocking gates where misunderstanding creates safety risk, invalid measurement, or serious misconception

const questions = [
  // ─── Lesson 1: Know the Meter ───────────────────────────────────────────
  {
    lessonSlug: 'know-the-meter',
    type: 'knowledge_check',
    items: [
      {
        question: 'You are about to measure voltage in a 480V motor control center. Which of the following must you verify BEFORE connecting your meter?',
        options: [
          "The meter's CAT rating is appropriate for the voltage and environment",
          "The test leads are undamaged and fully seated in the correct jacks",
          "The selector dial is set to V AC (not Ω or continuity)",
          "All of the above"
        ],
        correctIndex: 3,
        explanation: 'All three checks are required before connecting a meter to a live circuit. Using a meter with the wrong CAT rating, damaged leads, or incorrect function selection can result in arc flash, meter explosion, or false readings. This is a non-negotiable safety practice.',
      },
      {
        question: 'Which meter terminal does the BLACK test lead connect to for standard voltage and resistance measurements?',
        options: [
          "The V/Ω terminal",
          "The COM (common) terminal",
          "The A (amps) terminal",
          "Any terminal — it does not matter"
        ],
        correctIndex: 1,
        explanation: 'The black lead always connects to the COM (common) terminal. This is your reference point for all measurements. Connecting leads to the wrong terminals can produce incorrect readings or create a dangerous short circuit.',
      },
    ],
  },

  // ─── Lesson 2: Select the Correct Function ─────────────────────────────
  {
    lessonSlug: 'select-correct-function',
    type: 'knowledge_check',
    items: [
      {
        question: 'You need to check if a 24V DC sensor power supply is working. What meter function do you select?',
        options: [
          "V AC (alternating current voltage)",
          "V DC (direct current voltage)",
          "Ω (resistance)",
          "Continuity"
        ],
        correctIndex: 1,
        explanation: 'Sensor power supplies in industrial controls are typically 24V DC. Selecting V DC measures the voltage without risk. Selecting V AC would give an incorrect reading. Selecting Ω or continuity on a live circuit would damage the meter and potentially cause injury.',
      },
      {
        question: 'What happens if you set the meter to resistance (Ω) and connect it to a live 480V circuit?',
        options: [
          "The meter displays the resistance value normally",
          "The meter shows 0 ohms",
          "The meter may explode or cause an arc flash — this is extremely dangerous",
          "Nothing happens — modern meters are protected"
        ],
        correctIndex: 2,
        explanation: 'Connecting a meter set to Ω or continuity to a live circuit can destroy the meter, cause an arc flash, and injure or kill you. Resistance and continuity measurements must ONLY be performed on de-energized circuits. This is a hard safety rule with no exceptions.',
      },
    ],
  },

  // ─── Lesson 3: Measuring Voltage ───────────────────────────────────────
  {
    lessonSlug: 'measuring-voltage',
    type: 'knowledge_check',
    items: [
      {
        question: 'The PLC shows output O:2/0 is ON, but the motor is not running. You measure 0V AC across the contactor coil. What does this tell you?',
        options: [
          "The PLC is broken",
          "The motor is bad",
          "There is an open circuit between the PLC output and the contactor coil — voltage is not reaching the coil despite the PLC commanding it",
          "The meter is broken"
        ],
        correctIndex: 2,
        explanation: 'The PLC is commanding the output (software state = ON), but 0V at the coil means the physical voltage is not arriving. Software state does NOT prove physical voltage. The fault is in the path between the PLC output card and the contactor coil — a broken wire, open fuse, or failed output card. This distinction between software state and measured field voltage is fundamental to troubleshooting.',
      },
      {
        question: 'A PLC screen shows an output as ON. An indicator light is illuminated. Does this prove that the correct voltage is physically present at the motor?',
        options: [
          "Yes — if the PLC shows ON and the light is on, voltage must be present",
          "No — software state and visual indicators do not prove physical voltage. Only a meter measurement at the actual test point proves voltage is present.",
          "Yes — indicator lights are connected directly to the motor circuit",
          "It depends on the brand of PLC"
        ],
        correctIndex: 1,
        explanation: 'Neither a PLC status screen nor an indicator light proves physical voltage at the load. The PLC output being ON means the PLC is commanding the output — it does not prove the output card is working, the wire is intact, or voltage is reaching the motor. Only a meter measurement at the actual test point proves voltage is present. This is one of the most important concepts in troubleshooting.',
      },
    ],
  },

  // ─── Lesson 4: Resistance and Continuity ───────────────────────────────
  {
    lessonSlug: 'resistance-and-continuity',
    type: 'knowledge_check',
    items: [
      {
        question: 'You want to check if a wire is broken between a junction box and a motor. The motor circuit is fed from a 480V MCC bucket. What must you do BEFORE setting your meter to continuity?',
        options: [
          "Nothing — just switch to continuity and test",
          "Ask someone if the power is off",
          "Verify the circuit is de-energized by measuring 0V with your voltage function, confirm LOTO is applied, then switch to continuity",
          "Look at the disconnect handle position only"
        ],
        correctIndex: 2,
        explanation: 'You must verify zero energy with your own meter (not someone else\'s word or a handle position alone), confirm LOTO is applied, and only then switch to resistance/continuity. Handle positions can be misleading. Verbal confirmation is not verification. Measuring resistance on a live circuit can destroy the meter and cause arc flash.',
      },
      {
        question: 'A wire shows continuity (beeps) between two terminals. Does this prove the wire can carry its rated current without problems?',
        options: [
          "Yes — if it beeps, the wire is good",
          "No — continuity only confirms a conductive path exists. It does not prove the wire can carry rated current, that connections are tight, or that the wire will function correctly under load.",
          "Yes — continuity means zero resistance",
          "It depends on how loud the beep is"
        ],
        correctIndex: 1,
        explanation: 'Continuity is a screening test that catches complete opens. A wire with a damaged strand may show continuity but fail under load. A corroded connection may beep but create a high-resistance joint that drops voltage. Continuity does NOT prove a component will operate correctly under load.',
      },
    ],
  },

  // ─── Lesson 5: Interpret and Document ──────────────────────────────────
  {
    lessonSlug: 'interpret-and-document',
    type: 'knowledge_check',
    items: [
      {
        question: 'You measured 480V at the line side of a contactor but 0V at the load side. The contactor is commanded ON by the PLC. What does this reading support?',
        options: [
          "The motor is bad",
          "The contactor contacts are open (not closing despite being commanded) — the fault is in the contactor or its coil circuit",
          "The power supply is failing",
          "The PLC program is wrong"
        ],
        correctIndex: 1,
        explanation: '480V on the line side and 0V on the load side of a contactor that should be closed means the contactor is not passing power. The contacts are open. This could mean the coil is not energized, the contacts are welded open, or the contactor has mechanically failed. Your next test would verify voltage at the coil.',
      },
      {
        question: 'After a single voltage measurement shows 0V at a contactor coil, can you conclude the diagnosis is complete?',
        options: [
          "Yes — 0V at the coil proves the wire is broken",
          "Yes — one measurement is always sufficient",
          "No — one reading narrows the problem but rarely proves the entire diagnosis. You still need to identify WHERE in the path the break is.",
          "No — you should replace the contactor immediately"
        ],
        correctIndex: 2,
        explanation: 'A single measurement narrows the problem but rarely solves it completely. 0V at the coil tells you voltage is not arriving, but you still don\'t know WHERE the break is: output card? Fuse? Wire? Safety contact in series? Each measurement eliminates possibilities. The diagnosis is confirmed when you have enough measurements to identify the single point of failure.',
      },
    ],
  },
];

// ─── SEED ────────────────────────────────────────────────────────────────────

try {
  let total = 0;
  for (const lesson of questions) {
    const lessonId = lessonMap[lesson.lessonSlug];
    if (!lessonId) {
      console.error(`  ✗ Lesson not found: ${lesson.lessonSlug}`);
      continue;
    }

    // Delete existing KC questions for this lesson (idempotent)
    await connection.query(
      'DELETE FROM lesson_assessment_questions WHERE lessonId = ? AND type = ?',
      [lessonId, lesson.type]
    );

    let sortOrder = 0;
    for (const item of lesson.items) {
      await connection.query(
        `INSERT INTO lesson_assessment_questions (lessonId, type, question, options, correctIndex, explanation, sortOrder)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [lessonId, lesson.type, item.question, JSON.stringify(item.options), item.correctIndex, item.explanation, sortOrder++]
      );
      total++;
    }
    console.log(`  ✓ ${lesson.lessonSlug}: ${lesson.items.length} KC questions`);
  }

  console.log(`\n✓ Seeded ${total} safety-critical knowledge checks for Basic Meter Usage.`);
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
} finally {
  await connection.end();
}
