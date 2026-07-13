import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);

  const data = JSON.parse(fs.readFileSync('/home/ubuntu/generate_simulator_scenarios.json', 'utf8'));

  console.log(`Inserting ${data.results.length} scenarios...`);

  for (const result of data.results) {
    try {
      let scenarioData;
      const raw = result.output.scenario_json;
      
      // Try to parse the JSON - it might be wrapped in code blocks
      try {
        scenarioData = JSON.parse(raw);
      } catch {
        const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          scenarioData = JSON.parse(jsonMatch[1].trim());
        } else {
          // Try to find JSON object in the string
          const start = raw.indexOf('{');
          const end = raw.lastIndexOf('}');
          if (start !== -1 && end !== -1) {
            scenarioData = JSON.parse(raw.substring(start, end + 1));
          } else {
            throw new Error('Cannot parse JSON');
          }
        }
      }

      await connection.execute(
        `INSERT INTO scenarios (title, category, difficulty, estimatedTime, description, equipment, steps, toolReadings, isFree, isPublished)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          scenarioData.title,
          scenarioData.category,
          scenarioData.difficulty,
          scenarioData.estimatedTime || '5-10 min',
          scenarioData.description,
          JSON.stringify(scenarioData.equipment),
          JSON.stringify(scenarioData.steps),
          JSON.stringify(scenarioData.toolReadings),
          false,
          true,
        ]
      );
      console.log(`  ✓ Inserted: ${scenarioData.title}`);
    } catch (e) {
      console.error(`  ✗ Failed for input: ${result.input.substring(0, 60)}...`, e.message);
    }
  }

  console.log('\n✓ All scenarios inserted.');
  await connection.end();
}

main().catch(e => { console.error(e); process.exit(1); });
