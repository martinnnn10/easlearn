/**
 * Seed script to populate course modules and lessons
 * Run: node server/seed-courses.mjs
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);

// Course modules
const modules = [
  {
    slug: 'powerflex-vfd',
    title: 'PowerFlex VFD Programming & Troubleshooting',
    description: 'Master Allen-Bradley PowerFlex variable frequency drives. Learn parameter configuration, fault diagnostics, and common failure modes in manufacturing environments.',
    icon: 'gauge',
    orderIndex: 1,
    totalLessons: 6,
    estimatedHours: 8,
  },
  {
    slug: 'plc-fundamentals',
    title: 'PLC Fundamentals & Troubleshooting',
    description: 'Understand PLC architecture, ladder logic, I/O troubleshooting, and communication faults. Focused on Allen-Bradley ControlLogix and CompactLogix platforms.',
    icon: 'cpu',
    orderIndex: 2,
    totalLessons: 6,
    estimatedHours: 10,
  },
  {
    slug: 'fluid-power',
    title: 'Fluid Power Systems',
    description: 'Hydraulic and pneumatic system fundamentals. Circuit reading, pressure diagnostics, valve troubleshooting, and preventative maintenance for industrial fluid power.',
    icon: 'settings',
    orderIndex: 3,
    totalLessons: 6,
    estimatedHours: 7,
  },
  {
    slug: 'motors-controls',
    title: 'Motors & Motor Controls',
    description: 'AC/DC motor theory, motor control circuits, starter troubleshooting, overload protection, and single/three-phase motor diagnostics.',
    icon: 'zap',
    orderIndex: 4,
    totalLessons: 6,
    estimatedHours: 8,
  },
  {
    slug: 'alignment',
    title: 'Precision Shaft Alignment',
    description: 'Dial indicator and laser alignment methods. Soft foot correction, thermal growth compensation, and alignment tolerances for rotating equipment.',
    icon: 'aligncenter',
    orderIndex: 5,
    totalLessons: 5,
    estimatedHours: 5,
  },
  {
    slug: 'preventative-maintenance',
    title: 'Preventative Maintenance Programs',
    description: 'Build and execute PM programs for manufacturing equipment. Vibration analysis basics, thermography, lubrication schedules, and condition-based monitoring.',
    icon: 'wrench',
    orderIndex: 6,
    totalLessons: 6,
    estimatedHours: 6,
  },
];

// Lessons for each module
const lessons = {
  'powerflex-vfd': [
    { slug: 'vfd-fundamentals', title: 'VFD Fundamentals & Operating Principles', orderIndex: 1, estimatedMinutes: 20 },
    { slug: 'powerflex-parameter-groups', title: 'PowerFlex Parameter Groups & Navigation', orderIndex: 2, estimatedMinutes: 25 },
    { slug: 'basic-programming', title: 'Basic Programming: Speed Reference, Accel/Decel, Motor Data', orderIndex: 3, estimatedMinutes: 30 },
    { slug: 'fault-codes-diagnostics', title: 'Fault Codes & Diagnostic Procedures', orderIndex: 4, estimatedMinutes: 25 },
    { slug: 'common-failures', title: 'Common Failure Modes in Manufacturing', orderIndex: 5, estimatedMinutes: 20 },
    { slug: 'advanced-features', title: 'Advanced Features: PID, Multi-Speed, Communication', orderIndex: 6, estimatedMinutes: 30 },
  ],
  'plc-fundamentals': [
    { slug: 'plc-architecture', title: 'PLC Architecture & Hardware Components', orderIndex: 1, estimatedMinutes: 20 },
    { slug: 'ladder-logic-basics', title: 'Ladder Logic: Contacts, Coils, and Basic Instructions', orderIndex: 2, estimatedMinutes: 30 },
    { slug: 'io-troubleshooting', title: 'I/O Module Troubleshooting & Wiring', orderIndex: 3, estimatedMinutes: 25 },
    { slug: 'timers-counters', title: 'Timers, Counters, and Comparison Instructions', orderIndex: 4, estimatedMinutes: 25 },
    { slug: 'communication-faults', title: 'Communication Faults: EtherNet/IP & DeviceNet', orderIndex: 5, estimatedMinutes: 20 },
    { slug: 'program-troubleshooting', title: 'Online Troubleshooting & Forcing I/O', orderIndex: 6, estimatedMinutes: 30 },
  ],
  'fluid-power': [
    { slug: 'hydraulic-fundamentals', title: 'Hydraulic System Fundamentals', orderIndex: 1, estimatedMinutes: 20 },
    { slug: 'pneumatic-fundamentals', title: 'Pneumatic System Fundamentals', orderIndex: 2, estimatedMinutes: 20 },
    { slug: 'circuit-reading', title: 'Reading Hydraulic & Pneumatic Schematics', orderIndex: 3, estimatedMinutes: 25 },
    { slug: 'valve-troubleshooting', title: 'Valve Types & Troubleshooting', orderIndex: 4, estimatedMinutes: 25 },
    { slug: 'pressure-diagnostics', title: 'Pressure Diagnostics & Flow Testing', orderIndex: 5, estimatedMinutes: 20 },
    { slug: 'fluid-power-maintenance', title: 'Fluid Power Preventative Maintenance', orderIndex: 6, estimatedMinutes: 20 },
  ],
  'motors-controls': [
    { slug: 'motor-theory', title: 'AC & DC Motor Theory', orderIndex: 1, estimatedMinutes: 25 },
    { slug: 'motor-control-circuits', title: 'Motor Control Circuits & Schematics', orderIndex: 2, estimatedMinutes: 25 },
    { slug: 'starter-troubleshooting', title: 'Motor Starter Troubleshooting', orderIndex: 3, estimatedMinutes: 25 },
    { slug: 'overload-protection', title: 'Overload Protection & Sizing', orderIndex: 4, estimatedMinutes: 20 },
    { slug: 'single-three-phase', title: 'Single-Phase vs Three-Phase Diagnostics', orderIndex: 5, estimatedMinutes: 25 },
    { slug: 'motor-testing', title: 'Motor Testing: Megger, Winding Resistance, Vibration', orderIndex: 6, estimatedMinutes: 30 },
  ],
  'alignment': [
    { slug: 'alignment-fundamentals', title: 'Why Alignment Matters: Costs of Misalignment', orderIndex: 1, estimatedMinutes: 15 },
    { slug: 'dial-indicator-method', title: 'Dial Indicator Alignment Method', orderIndex: 2, estimatedMinutes: 25 },
    { slug: 'laser-alignment', title: 'Laser Alignment Systems & Procedures', orderIndex: 3, estimatedMinutes: 25 },
    { slug: 'soft-foot', title: 'Soft Foot Detection & Correction', orderIndex: 4, estimatedMinutes: 20 },
    { slug: 'thermal-growth', title: 'Thermal Growth Compensation & Tolerances', orderIndex: 5, estimatedMinutes: 20 },
  ],
  'preventative-maintenance': [
    { slug: 'pm-program-design', title: 'Designing a PM Program for Manufacturing', orderIndex: 1, estimatedMinutes: 20 },
    { slug: 'vibration-analysis', title: 'Vibration Analysis Basics', orderIndex: 2, estimatedMinutes: 25 },
    { slug: 'thermography', title: 'Infrared Thermography for Electrical Systems', orderIndex: 3, estimatedMinutes: 20 },
    { slug: 'lubrication', title: 'Lubrication Schedules & Best Practices', orderIndex: 4, estimatedMinutes: 15 },
    { slug: 'condition-monitoring', title: 'Condition-Based Monitoring vs Time-Based', orderIndex: 5, estimatedMinutes: 20 },
    { slug: 'failure-analysis', title: 'Root Cause Failure Analysis (RCFA)', orderIndex: 6, estimatedMinutes: 25 },
  ],
};

console.log('Seeding course modules...');

for (const mod of modules) {
  // Check if module already exists
  const [existing] = await connection.execute(
    'SELECT id FROM course_modules WHERE slug = ?',
    [mod.slug]
  );
  
  let moduleId;
  if (existing.length > 0) {
    moduleId = existing[0].id;
    await connection.execute(
      'UPDATE course_modules SET title = ?, description = ?, icon = ?, orderIndex = ?, estimatedHours = ? WHERE id = ?',
      [mod.title, mod.description, mod.icon, mod.orderIndex, mod.estimatedHours, moduleId]
    );
    console.log(`  Updated module: ${mod.title}`);
  } else {
    const [result] = await connection.execute(
      'INSERT INTO course_modules (slug, title, description, icon, orderIndex, totalLessons, estimatedHours, isPublished) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [mod.slug, mod.title, mod.description, mod.icon, mod.orderIndex, mod.totalLessons, mod.estimatedHours, true]
    );
    moduleId = result.insertId;
    console.log(`  Created module: ${mod.title}`);
  }

  // Seed lessons for this module
  const moduleLessons = lessons[mod.slug] || [];
  for (const lesson of moduleLessons) {
    const [existingLesson] = await connection.execute(
      'SELECT id FROM course_lessons WHERE moduleId = ? AND slug = ?',
      [moduleId, lesson.slug]
    );

    if (existingLesson.length > 0) {
      await connection.execute(
        'UPDATE course_lessons SET title = ?, orderIndex = ?, estimatedMinutes = ? WHERE id = ?',
        [lesson.title, lesson.orderIndex, lesson.estimatedMinutes, existingLesson[0].id]
      );
    } else {
      console.warn(
        `    SKIP new lesson "${lesson.slug}" — no content file. Run load-content.mjs or seed-foundational.mjs before publishing.`
      );
    }
  }
  console.log(`    Processed ${moduleLessons.length} lesson definitions for ${mod.slug}`);
}

console.log('\nSyncing totalLessons from published lesson counts...');
await connection.execute(`
  UPDATE course_modules cm
  SET totalLessons = (
    SELECT COUNT(*)
    FROM course_lessons cl
    WHERE cl.moduleId = cm.id AND cl.isPublished = 1
  )
`);

console.log('Done! Course structure seeded.');
await connection.end();
