/**
 * Load quiz questions from generated JSON into the database
 * Run: node server/load-quizzes.mjs
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);

// Module slugs in the order they were generated
const moduleSlugs = [
  'powerflex-vfd',
  'plc-fundamentals',
  'fluid-power',
  'motors-controls',
  'alignment',
  'preventative-maintenance',
];

// Read the generated quiz results
const data = JSON.parse(fs.readFileSync('/home/ubuntu/generate_quiz_questions.json', 'utf-8'));

console.log('Loading quiz questions into database...');

for (let i = 0; i < data.results.length; i++) {
  const result = data.results[i];
  const moduleSlug = moduleSlugs[i];
  
  if (result.error) {
    console.error(`  ERROR for ${moduleSlug}: ${result.error}`);
    continue;
  }
  
  // Get module ID
  const [mods] = await connection.execute('SELECT id FROM course_modules WHERE slug = ?', [moduleSlug]);
  if (mods.length === 0) {
    console.error(`  Module not found: ${moduleSlug}`);
    continue;
  }
  const moduleId = mods[0].id;
  
  // Parse quiz JSON
  let questions;
  try {
    questions = JSON.parse(result.output.quiz_json);
  } catch (e) {
    console.error(`  Failed to parse JSON for ${moduleSlug}: ${e.message}`);
    continue;
  }
  
  // Insert questions
  for (let q = 0; q < questions.length; q++) {
    const question = questions[q];
    await connection.execute(
      'INSERT INTO quiz_questions (moduleId, question, options, correctIndex, explanation, sortOrder) VALUES (?, ?, ?, ?, ?, ?)',
      [
        moduleId,
        question.question,
        JSON.stringify(question.options),
        question.correctIndex,
        question.explanation || '',
        q + 1,
      ]
    );
  }
  
  console.log(`  Loaded ${questions.length} questions for: ${moduleSlug}`);
}

console.log('\nDone! All quiz questions loaded.');
await connection.end();
process.exit(0);
