import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';
config();

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);
  
  // Get the current content
  const [rows] = await conn.execute('SELECT id, content FROM course_lessons WHERE id = 60001');
  if (!rows.length) {
    console.error('Lesson 60001 not found');
    await conn.end();
    return;
  }
  
  const currentContent = rows[0].content;
  
  // Add the interactive calculator marker at the end of the lesson
  const calculatorSection = `

---

## Interactive Ohm's Law Calculator

Use the calculator below to verify your calculations. Enter any two known values (voltage, current, or resistance) to solve for the third, and observe the resulting power dissipation.

<!-- INTERACTIVE: OhmsLawCalculator -->

---

**Practice Exercise:** Using the calculator above, verify the following industrial scenarios:

1. A 480V motor drawing 15A — what is the circuit resistance and power consumption?
2. A 24VDC control circuit with a 1.2kΩ relay coil — what current flows and what power does the coil dissipate?
3. A 4-20mA transmitter loop with 250Ω sense resistor — what voltage drop appears across the resistor at 20mA?
`;

  const updatedContent = currentContent + calculatorSection;
  
  await conn.execute('UPDATE course_lessons SET content = ? WHERE id = 60001', [updatedContent]);
  console.log('✅ Added OhmsLawCalculator interactive marker to lesson 60001 (Ohm\'s Law & Power Calculations)');
  console.log('Content length: ' + currentContent.length + ' → ' + updatedContent.length);
  
  await conn.end();
}

main().catch(console.error);
