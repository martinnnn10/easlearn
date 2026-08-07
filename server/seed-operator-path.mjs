/**
 * Seed script: Minimum Viable Operator Path
 * Creates 3 modules:
 *   200001 — Industrial Maintenance Orientation (3 lessons)
 *   200002 — Basic Meter Usage (5 lessons)
 *   200003 — Guided Beginner Troubleshooting (1 guided lesson)
 *
 * Run: node server/seed-operator-path.mjs
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1); }
const connection = await mysql.createConnection(DATABASE_URL);

// ─── Helper ─────────────────────────────────────────────────────────────────────
async function upsertModule(mod) {
  const [existing] = await connection.query('SELECT id FROM course_modules WHERE id = ?', [mod.id]);
  if (existing.length > 0) {
    await connection.query(
      'UPDATE course_modules SET slug=?, title=?, description=?, icon=?, path=?, orderIndex=?, totalLessons=?, estimatedHours=?, isPublished=1 WHERE id=?',
      [mod.slug, mod.title, mod.description, mod.icon, mod.path, mod.orderIndex, mod.totalLessons, mod.estimatedHours, mod.id]
    );
    console.log(`  Updated module: ${mod.slug} (id=${mod.id})`);
  } else {
    await connection.query(
      'INSERT INTO course_modules (id, slug, title, description, icon, path, orderIndex, totalLessons, estimatedHours, isPublished) VALUES (?,?,?,?,?,?,?,?,?,1)',
      [mod.id, mod.slug, mod.title, mod.description, mod.icon, mod.path, mod.orderIndex, mod.totalLessons, mod.estimatedHours]
    );
    console.log(`  Created module: ${mod.slug} (id=${mod.id})`);
  }
}

async function seedLessons(moduleId, lessons) {
  for (const lesson of lessons) {
    const [existing] = await connection.query(
      'SELECT id FROM course_lessons WHERE moduleId = ? AND slug = ?', [moduleId, lesson.slug]
    );
    if (existing.length > 0) {
      await connection.query(
        'UPDATE course_lessons SET title=?, orderIndex=?, content=?, estimatedMinutes=?, isPublished=1, updatedAt=NOW() WHERE moduleId=? AND slug=?',
        [lesson.title, lesson.orderIndex, lesson.content, lesson.estimatedMinutes, moduleId, lesson.slug]
      );
      console.log(`    Updated: ${lesson.slug}`);
    } else {
      await connection.query(
        'INSERT INTO course_lessons (moduleId, slug, title, orderIndex, content, estimatedMinutes, isPublished) VALUES (?,?,?,?,?,?,1)',
        [moduleId, lesson.slug, lesson.title, lesson.orderIndex, lesson.content, lesson.estimatedMinutes]
      );
      console.log(`    Inserted: ${lesson.slug}`);
    }
  }
  const [countResult] = await connection.query(
    'SELECT COUNT(*) as cnt FROM course_lessons WHERE moduleId = ? AND isPublished = 1', [moduleId]
  );
  await connection.query('UPDATE course_modules SET totalLessons = ? WHERE id = ?', [countResult[0].cnt, moduleId]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 1: INDUSTRIAL MAINTENANCE ORIENTATION
// ═══════════════════════════════════════════════════════════════════════════════

const orientationModule = {
  id: 200001,
  slug: 'maintenance-orientation',
  title: 'Industrial Maintenance Orientation',
  description: 'What maintenance technicians do, how they think, and why safety and method come before tools. Built for machine operators considering a move into maintenance.',
  icon: 'hard-hat',
  path: 'foundational',
  orderIndex: -10,
  totalLessons: 3,
  estimatedHours: 1,
};

const orientationLessons = [
  {
    slug: 'what-maintenance-techs-do',
    title: 'What Maintenance Technicians Actually Do',
    orderIndex: 1,
    estimatedMinutes: 5,
    content: `# What Maintenance Technicians Actually Do

## The Job Nobody Sees Until the Line Stops

You already know what happens when a machine goes down. Production stops. People stand around. Supervisors make phone calls. Someone shows up with tools and gets it running again.

That person is a maintenance technician.

But the job is not just "fixing things." It is a structured process of observation, measurement, diagnosis, and verification. The best technicians are not the fastest wrench-turners — they are the ones who find the right problem before they touch anything.

## What the Role Involves

Industrial maintenance covers several areas. Most plants need technicians who can work across more than one:

| Area | What It Covers | Examples |
|------|---------------|----------|
| Electrical | Wiring, motors, power distribution, control circuits | Replacing a motor starter, tracing a broken wire, checking a fuse |
| Mechanical | Bearings, belts, gearboxes, alignment, lubrication | Changing a conveyor belt, aligning a coupling, replacing a bearing |
| Pneumatic | Air cylinders, valves, regulators, air preparation | Adjusting a cylinder speed, replacing a solenoid valve |
| Hydraulic | Pumps, cylinders, valves, fluid systems | Checking hydraulic pressure, replacing a seal |
| Controls | PLCs (Programmable Logic Controllers), sensors, drives | Reading a PLC program, replacing a sensor, clearing a drive fault |

You do not need to master all of these on day one. Most technicians start in one area and expand over time.

## Operator vs. Technician vs. Controls Tech vs. Leader

| Role | Primary Responsibility |
|------|----------------------|
| **Machine Operator** | Run the machine. Observe symptoms. Report problems. Do not open panels or bypass safety devices. |
| **Maintenance Technician** | Diagnose and repair. Use meters, prints, and logic. Follow lockout procedures. Document the repair. |
| **Controls / Electrical Technician** | Program PLCs, configure drives, design circuits, troubleshoot network faults. Requires deeper electrical theory. |
| **Maintenance Leader** | Assign work, track readiness, manage parts, evaluate team skills, make promotion decisions. |

Moving from operator to technician means learning to think differently — not just noticing that something is wrong, but proving *why* it is wrong and *where* the failure is.

## The Key Difference: Observation vs. Assumption

An operator says: "The motor won't start."

A technician asks: "Is power present at the starter? Is the overload tripped? Is the PLC commanding the output? Is the safety circuit complete?"

The difference is not intelligence. It is method. You will learn this method step by step.

---

**Knowledge Check**

Which statement best describes the difference between an operator and a maintenance technician?

- A) Technicians are stronger and faster
- B) Technicians use a structured process to find and prove the root cause before replacing parts
- C) Technicians are allowed to bypass safety devices
- D) Technicians only work on electrical systems

*Correct answer: B*

A technician's value is in their method — not their speed or their willingness to skip steps.`,
  },
  {
    slug: 'safety-before-troubleshooting',
    title: 'Safety and Authorization Come First',
    orderIndex: 2,
    estimatedMinutes: 5,
    content: `# Safety and Authorization Come First

## Why This Lesson Exists Before Any Technical Content

In industrial maintenance, people die from electrical contact, stored energy release, and unauthorized work on equipment that someone else energizes. This is not exaggeration. It happens every year in plants across the country.

Before you learn to use a meter, read a print, or diagnose a fault, you must understand:

1. You are not authorized to perform electrical work until your site says you are.
2. Completing online training does not authorize you to open panels, take measurements on live circuits, or perform lockout/tagout.
3. Authorization comes from your employer, your site safety program, and your demonstrated competency — not from a website.

## What LOTO Means

**LOTO** stands for **Lockout/Tagout**. It is the site procedure used to control hazardous energy before maintenance work begins.

Hazardous energy includes:
- Electrical (voltage that can shock or arc)
- Mechanical (springs, gravity, rotating parts)
- Pneumatic (compressed air in cylinders or lines)
- Hydraulic (pressurized fluid)
- Thermal (hot surfaces, steam)

LOTO ensures that energy is isolated, verified absent, and locked so it cannot be restored while someone is working on the equipment.

## When to Stop and Escalate

You should stop and call for help when:

- You are not trained or authorized for the task
- You do not understand the circuit or system
- You cannot verify zero energy
- The situation does not match what you expected
- Someone asks you to bypass a safety device
- You feel rushed or pressured to skip a step

Escalating is not weakness. It is professional judgment. Experienced technicians escalate regularly when they encounter unfamiliar systems.

## What You Will Learn in EASLearn

This platform teaches you the *knowledge and method* of maintenance troubleshooting. It does not replace:

- Site-specific safety training
- Employer authorization
- Hands-on supervised practice
- OSHA-required qualifications

Think of this as building the knowledge foundation. Your employer provides the authorization and supervised practice that turns knowledge into qualified performance.

---

**Knowledge Check**

When does completing this online training authorize you to perform electrical maintenance work?

- A) After you pass all quizzes
- B) After you complete the full learning path
- C) Never — authorization comes from your employer and site safety program
- D) After you earn a Skills Passport credential

*Correct answer: C*

Online training builds knowledge. Authorization comes from your employer, your site safety program, and demonstrated competency under supervision.`,
  },
  {
    slug: 'how-technicians-think',
    title: 'How Technicians Think: Symptoms, Root Causes, and Verification',
    orderIndex: 3,
    estimatedMinutes: 5,
    content: `# How Technicians Think: Symptoms, Root Causes, and Verification

## Symptoms Are Not Diagnoses

When a machine stops, everyone sees the symptom: "It's not running." But the symptom is just the starting point. A technician's job is to find the root cause — the specific component or condition that caused the failure.

| What You See (Symptom) | Possible Root Causes |
|------------------------|---------------------|
| Motor won't start | Overload tripped, contactor failed, PLC not commanding output, broken wire, E-stop pressed, safety device open |
| Conveyor running slow | VFD parameter wrong, belt slipping, mechanical binding, load too heavy |
| Sensor not detecting | Sensor failed, wiring broken, PLC input card failed, target out of range, sensor dirty |

One symptom can have many causes. Replacing the first thing you think of is expensive and often wrong.

## The Diagnostic Method

Experienced technicians follow a consistent process:

1. **Observe** — What is the machine doing? What should it be doing? What changed?
2. **Identify what is known** — What can you confirm without testing? (E-stop position, indicator lights, PLC status)
3. **Identify what is assumed** — What do you believe but have not verified?
4. **Review the print** — Find the relevant circuit. Identify the components between the power source and the load.
5. **Form a hypothesis** — Based on evidence, what is the most likely fault location?
6. **Choose a safe test** — What measurement will confirm or eliminate your hypothesis?
7. **Predict the result** — Before you measure, what do you expect to see if your hypothesis is correct?
8. **Measure** — Take the reading. Record the exact test points and value.
9. **Interpret** — Does the reading support, weaken, or eliminate your hypothesis?
10. **Decide next action** — If confirmed, correct the fault. If not, form a new hypothesis and test again.
11. **Verify** — After the repair, confirm the machine operates normally.
12. **Document** — Record what you found, what you did, and what you verified.

## Why Verification Matters

A common mistake: "I replaced the part and the machine started, so that must have been the problem."

But did you verify? Maybe the machine started because you also reset the overload during the repair. Maybe the real fault is intermittent and will return tomorrow.

Verification means:
- The machine runs through a normal cycle
- The original symptom does not return
- No new symptoms appeared
- You can explain *why* the repair fixed the problem

## What "Verified" Means in This Platform

Throughout EASLearn, you will see these terms:

| Term | Meaning |
|------|---------|
| **Verified** | A measurement or observation confirms a condition |
| **Not verified** | The condition has not been tested yet |
| **Supported** | Evidence points toward this hypothesis |
| **Weakened** | Evidence contradicts this hypothesis |
| **Eliminated** | A measurement proves this hypothesis is wrong |
| **Confirmed** | Multiple pieces of evidence prove the root cause |

These are the terms real technicians use when documenting their diagnostic process.

---

**Knowledge Check**

A motor won't start. You notice the overload is tripped. What should you do?

- A) Reset the overload and walk away — problem solved
- B) Replace the motor — it probably caused the overload to trip
- C) Reset the overload, verify the motor starts, then investigate why it tripped in the first place
- D) Call an electrician immediately

*Correct answer: C*

Resetting the overload addresses the immediate symptom, but a technician investigates *why* it tripped. Was the motor overloaded? Is there a mechanical binding? Is the current draw abnormal? The overload trip is a symptom, not necessarily the root cause.`,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 2: BASIC METER USAGE
// ═══════════════════════════════════════════════════════════════════════════════

const meterModule = {
  id: 200002,
  slug: 'basic-meter-usage',
  title: 'Basic Meter Usage',
  description: 'How to use an industrial multimeter safely and correctly. Covers meter parts, function selection, voltage measurement, resistance and continuity testing, and reading interpretation.',
  icon: 'gauge',
  path: 'foundational',
  orderIndex: -5,
  totalLessons: 5,
  estimatedHours: 2,
};

const meterLessons = [
  {
    slug: 'know-the-meter',
    title: 'Know the Meter',
    orderIndex: 1,
    estimatedMinutes: 10,
    content: `# Know the Meter

## Your Primary Diagnostic Tool

A digital multimeter (DMM) is the most important tool a maintenance technician carries. It measures electrical quantities — voltage, resistance, and continuity — that tell you whether a circuit is working correctly.

Before you use a meter to diagnose anything, you need to know what each part does and how to verify the meter itself is safe to use.

## Parts of a Digital Multimeter

| Part | What It Does |
|------|-------------|
| **Display** | Shows the measured value (voltage, resistance, etc.) and the selected function |
| **Selector dial** | Rotates to choose the measurement function (V AC, V DC, Ω, continuity, etc.) |
| **COM terminal** | The "common" or reference jack. One test lead always connects here. The black lead goes here by convention. |
| **V/Ω terminal** | The jack for voltage and resistance measurements. The red lead connects here for most measurements. |
| **A terminal** | The jack for current measurements. Do NOT use this terminal unless you are specifically measuring current in series. Using it incorrectly can blow the meter's internal fuse or cause a short circuit. |
| **Test leads** | Two insulated wires with probe tips. They connect the meter to the circuit you are testing. |
| **Probe tips** | The metal points at the end of each lead. You touch these to the test points in the circuit. |

## Meter Function vs. Measurement Unit

The selector dial chooses the *function* — what the meter does internally. The display shows the *measurement* — the value it detects.

| Function Selected | What the Meter Does | Unit Displayed |
|-------------------|--------------------|----|
| V AC | Measures alternating current voltage | Volts (V~) |
| V DC | Measures direct current voltage | Volts (V⎓) |
| Ω (Ohms) | Measures resistance | Ohms (Ω) |
| Continuity (🔊) | Tests if a path exists (low resistance) | Beeps if path exists |

## Before Every Use: Inspect the Meter and Leads

Before you connect a meter to any circuit, check:

1. **Leads are not damaged** — no cracked insulation, no exposed wire, no bent probe tips
2. **Leads are fully seated** in the correct jacks
3. **Selector is on the correct function** — never leave the meter on Ω or continuity and connect to a live circuit
4. **CAT rating matches the environment** — industrial panels require CAT III or CAT IV rated meters
5. **Battery is adequate** — a low battery can produce false readings

## Use Only Site-Approved Equipment

Your employer determines which meters are approved for use in your facility. Do not bring personal meters from home unless they meet the site's safety requirements (CAT rating, calibration status, condition).

If a meter is damaged, out of calibration, or not on the approved list — do not use it. Report it and get a replacement.

---

**Knowledge Check**

You are about to measure voltage in a 480V motor control center. Which of the following must you verify BEFORE connecting your meter?

- A) The meter's CAT rating is appropriate for the voltage and environment
- B) The test leads are undamaged and fully seated in the correct jacks
- C) The selector dial is set to V AC (not Ω or continuity)
- D) All of the above

*Correct answer: D*

All three checks are required before connecting a meter to a live circuit. Using a meter with the wrong CAT rating, damaged leads, or incorrect function selection can result in arc flash, meter explosion, or false readings.`,
  },
  {
    slug: 'select-correct-function',
    title: 'Select the Correct Function',
    orderIndex: 2,
    estimatedMinutes: 10,
    content: `# Select the Correct Function

## Why Function Selection Matters

Selecting the wrong function on your meter is not just an inconvenience — it can be dangerous. If you set the meter to resistance (Ω) and connect it to a live 480V circuit, the meter may explode or cause an arc flash.

The selector dial tells the meter what to measure and how to measure it. You must choose the correct function *before* you touch the probes to anything.

## The Four Functions You Will Use Most

### AC Voltage (V~)

Use when measuring voltage in:
- Motor control circuits (120V, 208V, 240V, 480V)
- Lighting circuits
- Transformer outputs
- Any circuit powered by the building's electrical service

AC voltage alternates direction 60 times per second (60 Hz in North America). The meter shows the effective (RMS) value.

### DC Voltage (V⎓)

Use when measuring voltage in:
- PLC I/O circuits (typically 24V DC)
- Sensor power supplies
- Battery-backed systems
- DC drives
- Control circuit logic signals

DC voltage flows in one direction. Polarity matters — if you connect the leads backward, the meter shows a negative value.

### Resistance (Ω)

Use when measuring:
- Whether a wire is continuous (low Ω = good wire)
- Whether a coil is intact (expected resistance value)
- Whether a heating element is open (infinite Ω = broken)
- Motor winding resistance

**CRITICAL SAFETY RULE: The circuit MUST be de-energized before measuring resistance.** Measuring resistance on a live circuit will damage the meter and may injure you.

### Continuity (🔊)

Use when testing:
- Whether a wire connects point A to point B
- Whether a switch is closed
- Whether a fuse is good

Continuity is a simplified resistance test. If the resistance is below a threshold (typically 20-50Ω), the meter beeps. If it does not beep, the path is open (broken).

**CRITICAL SAFETY RULE: Same as resistance — the circuit MUST be de-energized.**

## Decision Examples

| Situation | Correct Function |
|-----------|-----------------|
| "Is 480V present at the motor starter?" | V AC |
| "Is the PLC output sending 24V to the solenoid?" | V DC |
| "Is this wire broken between the junction box and the motor?" | Continuity or Ω |
| "Is the contactor coil open?" | Ω (measure coil resistance) |
| "Is the 24V DC sensor power supply working?" | V DC |
| "Is this fuse blown?" | Continuity |

## Common Mistake: Leaving the Meter on the Wrong Function

After measuring resistance, technicians sometimes forget to switch back to voltage before connecting to a live circuit. This is one of the most common causes of meter damage and near-miss incidents.

**Rule: Always verify your selector position before every measurement.**

---

**Knowledge Check**

You need to check if a 24V DC sensor is receiving power. What function do you select?

- A) V AC
- B) V DC
- C) Ω (resistance)
- D) Continuity

*Correct answer: B*

Sensor power supplies in industrial controls are typically 24V DC. Selecting V DC measures the voltage without risk. Selecting Ω or continuity on a live circuit would damage the meter.

---

**Exercise: Function Selection**

For each situation below, identify the correct meter function:

1. Checking if 120V AC is present at a control transformer secondary → **V AC**
2. Verifying a PLC output is energized (24V DC signal) → **V DC**
3. Testing if a wire is broken between two terminal blocks (circuit is locked out) → **Continuity**
4. Measuring the resistance of a motor winding (motor is disconnected) → **Ω**
5. Checking if a 480V supply is present at a disconnect → **V AC**`,
  },
  {
    slug: 'measuring-voltage',
    title: 'Measuring Voltage',
    orderIndex: 3,
    estimatedMinutes: 12,
    content: `# Measuring Voltage

## Voltage Is Measured Between Two Points

Voltage is the difference in electrical potential between two points. You cannot measure voltage at a single point — you always need two probe locations.

When a technician says "I measured 480V at the starter," they mean: "I placed one probe on Line 1 and the other probe on Line 2 (or neutral/ground), and the meter read 480V."

The two points matter. If you move one probe to a different location, you get a different reading — and that difference tells you where the problem is.

## Reference (Common) Matters

Your black lead (COM) is your reference point. Your red lead is your measurement point. The meter shows the voltage difference between them.

| Red Lead On | Black Lead On | Expected Reading | What It Tells You |
|-------------|---------------|-----------------|-------------------|
| Load side of fuse | Line side of fuse | 0V | Fuse is good (no voltage drop across it) |
| Load side of fuse | Line side of fuse | 480V | Fuse is blown (all voltage drops across the open) |
| Motor terminal T1 | Motor terminal T2 | 480V | Voltage is reaching the motor |
| Motor terminal T1 | Motor terminal T2 | 0V | Voltage is NOT reaching the motor |

## Lead Placement

For voltage measurements:
- Red lead on the point you are investigating
- Black lead on your reference (often neutral, ground, or the other side of the component)
- Both probes must make solid contact with bare metal (terminal screws, bus bars, test points)
- Do not let probe tips slip — a slip on a live bus bar can cause an arc flash

## Expected vs. Actual Reading

Before you measure, predict what you expect to see:

- If the circuit is working correctly, what voltage should be present?
- If your hypothesis is correct (e.g., "the wire is broken"), what voltage would you expect?

Then measure and compare:

| Expected | Actual | Interpretation |
|----------|--------|---------------|
| 480V | 480V | Voltage is present — this section of the circuit is working |
| 480V | 0V | Voltage is absent — the fault is upstream of this point or the path is open |
| 0V | 480V | Unexpected voltage — something is backfeeding or your hypothesis is wrong |
| 120V | 85V | Low voltage — possible high-resistance connection or overloaded circuit |

## Software State Does Not Prove Physical Voltage

A PLC screen may show an output as "ON." A drive display may show "RUN." An indicator light may be illuminated.

None of these prove that the correct voltage is physically present at the load.

The PLC output being ON means the PLC is *commanding* the output. It does not prove:
- The output card is working
- The wire between the output and the contactor is intact
- The contactor coil is receiving voltage
- The contactor contacts are closed
- Voltage is reaching the motor

**Only a meter measurement at the actual test point proves voltage is present.**

This is one of the most important concepts in troubleshooting: software state and physical state are separate things that must be independently verified.

## Stable vs. Unstable Readings

A stable reading stays at one value (e.g., 481V, 24.1V, 0.0V). This is normal.

An unstable reading fluctuates rapidly (e.g., jumping between 200V and 480V, or between 0V and 24V). This may indicate:
- A loose connection
- An intermittent fault
- Electrical noise (if measuring near a VFD)
- Incorrect meter function selected

If you see an unstable reading, do not ignore it. Record it and investigate the cause.

## Recording the Measurement

Every measurement should be recorded with:
- **What** was tested (e.g., "Voltage across contactor coil CR1")
- **Where** the leads were placed (e.g., "Red on terminal A1, Black on terminal A2")
- **What** the reading was (e.g., "0.0V AC")
- **What** was expected (e.g., "Expected 120V AC when PLC output is ON")

This record becomes your evidence. It supports or eliminates your hypothesis.

---

**Knowledge Check**

The PLC shows output O:2/0 is ON, but the motor is not running. You measure 0V AC across the contactor coil. What does this tell you?

- A) The PLC is broken
- B) The motor is bad
- C) There is an open circuit between the PLC output and the contactor coil — voltage is not reaching the coil despite the PLC commanding it
- D) The meter is broken

*Correct answer: C*

The PLC is commanding the output (software state = ON), but 0V at the coil means the physical voltage is not arriving. The fault is in the path between the PLC output card and the contactor coil — a broken wire, open fuse, or failed output card.

---

**Exercise: Lead Placement**

You suspect a fuse is blown in a 480V motor circuit. Where do you place your meter leads to verify?

- Red lead: Load side of the fuse
- Black lead: Line side of the fuse
- Expected reading if fuse is good: **0V** (no voltage drop across a closed path)
- Expected reading if fuse is blown: **480V** (all source voltage drops across the open fuse)`,
  },
  {
    slug: 'resistance-and-continuity',
    title: 'Resistance and Continuity',
    orderIndex: 4,
    estimatedMinutes: 10,
    content: `# Resistance and Continuity

## The Safety Gate

**STOP. Before you read further, understand this rule:**

> Resistance and continuity measurements MUST NOT be performed on an energized circuit.

This is not a suggestion. It is a hard safety requirement. Connecting a meter set to Ω or continuity to a live circuit can:
- Destroy the meter
- Cause an arc flash
- Injure or kill you

Before measuring resistance or continuity:
1. Verify the circuit is de-energized using your voltage function first
2. Verify the circuit is in a safe state (LOTO applied, or verified 0V)
3. Then — and only then — switch to Ω or continuity

## What Resistance Tells You

Resistance (measured in Ohms, symbol Ω) tells you how much a component or wire opposes current flow.

| Reading | What It Means |
|---------|--------------|
| 0Ω or very low (< 1Ω) | A direct connection exists (wire, closed switch, good fuse) |
| Expected value (e.g., 12Ω for a coil) | Component is intact and within specification |
| OL (Over Limit) or ∞ | Open circuit — no path exists (broken wire, blown fuse, open coil) |
| Unexpected low value | Possible short circuit or insulation breakdown |

## What Continuity Tells You

Continuity is a simplified resistance test. The meter beeps if resistance is below a threshold (typically 20-50Ω).

- **Beep** = path exists (wire is good, switch is closed, fuse is intact)
- **No beep** = path is open (wire is broken, switch is open, fuse is blown)

Continuity is faster than reading resistance values when you just need a yes/no answer: "Does a path exist between these two points?"

## Continuity Does Not Prove Full Function

A wire that shows continuity (beeps) confirms that a conductive path exists. It does NOT prove:
- The wire can carry its rated current without overheating
- A component will operate correctly under load
- The connection is tight and low-resistance enough for normal operation

A wire with a damaged strand may show continuity but fail under load. A corroded connection may beep but create a high-resistance joint that drops voltage.

Continuity is a screening test. It catches complete opens. It does not catch all problems.

## Low Resistance, Open Circuit, and Unexpected Paths

| Measurement | Interpretation |
|-------------|---------------|
| Wire from terminal 1 to terminal 2: 0.2Ω | Wire is intact |
| Wire from terminal 1 to terminal 2: OL | Wire is broken somewhere between those points |
| Coil resistance: 12Ω (expected: 10-15Ω) | Coil is within specification |
| Coil resistance: OL | Coil is open (burned out) |
| Motor winding T1-T2: 0.1Ω (expected: 2-5Ω) | Possible short between windings |
| Insulation to ground: 0.5Ω (expected: >1MΩ) | Insulation breakdown — do not energize |

## When NOT to Perform the Test

Do not measure resistance or continuity when:
- The circuit is energized (always verify with voltage first)
- You cannot confirm LOTO is applied
- Other circuits may backfeed into the one you are testing
- You are unsure whether stored energy (capacitors) has been discharged

---

**Safety Decision Exercise**

You want to check if a wire is broken between a junction box and a motor. The motor circuit is fed from a 480V MCC bucket. What must you do BEFORE setting your meter to continuity?

- A) Nothing — just switch to continuity and test
- B) Verify the circuit is de-energized by measuring 0V with your voltage function, confirm LOTO is applied, then switch to continuity
- C) Ask someone if the power is off
- D) Look at the disconnect handle position

*Correct answer: B*

You must verify zero energy with your own meter (not someone else's word or a handle position alone), confirm LOTO is applied, and only then switch to resistance/continuity. Handle positions can be misleading. Verbal confirmation is not verification.`,
  },
  {
    slug: 'interpret-and-document',
    title: 'Interpret and Document the Reading',
    orderIndex: 5,
    estimatedMinutes: 8,
    content: `# Interpret and Document the Reading

## A Reading Without Interpretation Is Just a Number

You measured 0V across a contactor coil. What does that mean?

It depends on context:
- If the PLC output is ON and you expected 120V → the reading means there is an open circuit upstream
- If the PLC output is OFF → the reading is expected and normal
- If you are measuring during a lockout → the reading confirms zero energy

The number alone tells you nothing. The interpretation — comparing actual to expected in context — is what advances your diagnosis.

## The Six Questions

After every measurement, answer these six questions:

### 1. What was tested?
"Voltage across contactor coil CR1"

### 2. Where were the leads placed?
"Red on terminal A1, Black on terminal A2"

### 3. What was the actual reading?
"0.0V AC"

### 4. What was the expected reading?
"120V AC (PLC output O:2/0 is commanding ON)"

### 5. What does the result support or eliminate?

| Term | Use When |
|------|----------|
| **Verified** | The measurement confirms a specific condition (e.g., "Voltage verified present at line side of starter") |
| **Not verified** | You have not yet tested this condition |
| **Supported** | The measurement is consistent with your hypothesis (e.g., "Supports hypothesis that wire W3 is open") |
| **Weakened** | The measurement contradicts your hypothesis but does not completely eliminate it |
| **Eliminated** | The measurement proves your hypothesis is wrong (e.g., "480V present at motor terminals eliminates 'no power to motor' hypothesis") |
| **Confirmed** | Multiple measurements together prove the root cause |

### 6. What remains unverified?
"Have not yet verified: output card voltage, wire continuity between output card and CR1 terminal A1, fuse F3 status"

## Why One Reading Rarely Proves the Entire Diagnosis

A single measurement narrows the problem. It rarely solves it completely.

Example:
- You measure 0V at the contactor coil → this tells you voltage is not arriving
- But you still don't know WHERE the break is: Is it the output card? The fuse? The wire? A safety contact in series?

Each measurement eliminates possibilities and narrows the search area. The diagnosis is confirmed when you have enough measurements to identify the single point of failure.

## Documentation Exercise

Complete this documentation for the following scenario:

*Scenario: Motor M1 will not start. PLC shows output O:2/0 is ON. You measure voltage across the contactor coil.*

| Field | Your Entry |
|-------|-----------|
| What was tested | Voltage across contactor coil CR1 |
| Lead placement | Red: terminal A1, Black: terminal A2 |
| Actual reading | 0.0V AC |
| Expected reading | 120V AC |
| Result supports | Open circuit between PLC output and coil |
| Result eliminates | "Coil is shorted" (if shorted, we'd still see voltage) |
| Remains unverified | Output card voltage, fuse F3, wire W3 continuity, safety contacts in series |

This documentation is your evidence. When you present your diagnosis to a supervisor or document it in a work order, this is what proves you followed a method — not a guess.

---

**Knowledge Check**

You measured 480V at the line side of a contactor but 0V at the load side. The contactor is commanded ON by the PLC. What does this reading support?

- A) The motor is bad
- B) The contactor contacts are open (not closing despite being commanded)
- C) The power supply is failing
- D) The PLC program is wrong

*Correct answer: B*

480V on the line side and 0V on the load side of a contactor that should be closed means the contactor is not passing power. The contacts are open. This could mean the coil is not energized, the contacts are welded open, or the contactor has mechanically failed. Your next test would verify voltage at the coil.`,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 3: GUIDED BEGINNER TROUBLESHOOTING
// ═══════════════════════════════════════════════════════════════════════════════

const guidedModule = {
  id: 200003,
  slug: 'guided-beginner-troubleshooting',
  title: 'Guided Beginner Troubleshooting',
  description: 'Your first guided diagnostic experience. Walk through a real fault step by step — observe, hypothesize, test, interpret, and verify. Uses the overload_tripped fault from the conveyor simulator.',
  icon: 'wrench',
  path: 'foundational',
  orderIndex: -1,
  totalLessons: 1,
  estimatedHours: 1,
};

const guidedLessons = [
  {
    slug: 'guided-overload-trip',
    title: 'Guided Diagnosis: Motor Overload Trip',
    orderIndex: 1,
    estimatedMinutes: 20,
    linkedScenarioSlug: 'overload-trip-v1',
    content: `# Guided Diagnosis: Motor Overload Trip

## Your First Real Diagnostic

A conveyor motor has stopped. Production is waiting. Your job is to find the fault, prove it, and restore operation — using the method you learned in the orientation.

This is a guided experience. You will receive prompts and explanations as you work through each step. On a second attempt, the prompts will be reduced and you will make more decisions independently.

---

## Step 1: Observe the Machine Symptom

The conveyor is not moving. The motor is silent. No unusual sounds, no smoke, no burning smell.

The operator reports: "It just stopped. I didn't change anything."

**What is known:**
- The conveyor was running normally before it stopped
- No operator action caused the stop
- The motor is not making any sound

**What is assumed (not yet verified):**
- Power may be present at the panel
- The PLC may be commanding the motor to run
- The motor itself may be functional

---

## Step 2: Identify Available Information

Before opening any panel or touching any tool, look at what you can observe safely:

- **PLC HMI/Status:** Does the PLC show the conveyor output as ON or OFF?
- **Indicator lights:** Is there a "motor running" light? Is it on or off?
- **Overload indicator:** Many overload relays have a trip flag or indicator. Is it visible?

In this scenario, you observe:
- The PLC screen shows the conveyor output is **ON** (commanding run)
- The motor running indicator light is **OFF**
- The overload relay has a visible **TRIP** flag

---

## Step 3: Review the Relevant Print Area

The motor control circuit shows:

\`\`\`
L1 ──[Fuse F1]──[OL Contact (NC)]──[Contactor Coil M1]── L2
\`\`\`

The overload contact is normally closed (NC). When the overload trips, this contact opens, breaking the circuit to the contactor coil.

If the contactor coil has no power, the contactor cannot close, and the motor cannot run.

---

## Step 4: Form Your Hypothesis

Based on your observations:
- PLC is commanding ON (software state)
- Motor is not running (physical state)
- Overload trip flag is visible

**Hypothesis:** The overload relay has tripped, opening the NC overload contact, which de-energizes the contactor coil, preventing the motor from starting.

Before you accept this as the answer, you must **verify it with a measurement**. The trip flag could be stuck from a previous event. The real fault could be elsewhere.

---

## Step 5: Choose a Safe Test

To verify your hypothesis, you need to confirm that the overload contact is open.

**Test:** Measure voltage across the overload contact.

- If the contact is open (tripped): you will measure **source voltage** across it (the voltage drops across the open)
- If the contact is closed (not tripped): you will measure **0V** across it (no voltage drop across a closed path)

**Predict your result:** Based on the visible trip flag, you predict you will measure source voltage (120V) across the overload contact.

---

## Step 6: Take the Measurement

Place your meter leads:
- Red lead: upstream side of the overload contact (power coming in)
- Black lead: downstream side of the overload contact (toward the coil)
- Function: V AC

**Reading: 120V AC**

---

## Step 7: Interpret the Result

| Field | Value |
|-------|-------|
| What was tested | Voltage across overload contact OL1 |
| Lead placement | Red: line side of OL contact, Black: load side of OL contact |
| Actual reading | 120V AC |
| Expected if hypothesis correct | 120V AC (voltage drops across open contact) |
| Result | **Supports** hypothesis — the overload contact is open |

Your hypothesis is supported. The overload contact is open, which means the contactor coil cannot energize, which means the motor cannot run.

---

## Step 8: Correct the Fault

The immediate corrective action is to **reset the overload relay**.

Most thermal overload relays have a reset button. Press it to close the NC contact again.

**But wait** — before you reset, ask yourself: *Why did the overload trip?*

Possible causes:
- Motor was mechanically overloaded (jammed product, worn bearing)
- Ambient temperature was too high
- The overload heater is undersized for the motor
- A phase was lost (single-phasing causes overcurrent on remaining phases)

For this guided exercise, reset the overload. In a real plant, you would investigate the cause before restarting.

---

## Step 9: Verify Normal Operation

After resetting the overload:
1. The contactor should energize (you may hear it click)
2. The motor should start
3. The conveyor should move
4. The motor running indicator should illuminate
5. The overload should NOT immediately re-trip

If the overload trips again immediately, the root cause is still present — do not keep resetting it.

---

## Step 10: Document the Repair

| Field | Entry |
|-------|-------|
| Symptom | Conveyor motor not running |
| Root cause | Thermal overload relay tripped (OL1) |
| Evidence | 120V measured across OL contact (open), trip flag visible |
| Corrective action | Reset overload relay |
| Verification | Motor started, conveyor running normally, overload stable |
| Follow-up needed | Monitor for re-trip. If it trips again, investigate mechanical load or phase loss. |

---

## What You Just Demonstrated

You followed the diagnostic method:
1. Observed the symptom
2. Identified what was known vs. assumed
3. Reviewed the print
4. Formed a hypothesis
5. Chose a safe test
6. Predicted the result
7. Measured
8. Interpreted the reading
9. Corrected the fault
10. Verified normal operation
11. Documented the repair

This is how experienced technicians work. The specific fault was simple — but the *method* is the same whether the fault takes 5 minutes or 5 hours to find.

---

## Next Steps

You are now ready to attempt the same fault in the **Conveyor PLC Lab** simulator without guidance. The simulator will present the same overload trip scenario, but you will choose your own test sequence and build your own evidence.

When you are ready, navigate to **Practice → Conveyor PLC Lab** and select a beginner scenario.

---

**Reflection**

Before moving on, answer honestly:

1. Could you have diagnosed this fault without the meter measurement? (The trip flag was visible.)
2. Why did we still measure? (Because the flag could be stuck, or the real fault could be elsewhere. Verification separates assumption from proof.)
3. What would you do differently if the overload tripped again immediately after reset?`,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// EXECUTE
// ═══════════════════════════════════════════════════════════════════════════════

try {
  console.log('\n=== Minimum Viable Operator Path ===\n');

  console.log('Module 1: Industrial Maintenance Orientation');
  await upsertModule(orientationModule);
  await seedLessons(200001, orientationLessons);

  console.log('\nModule 2: Basic Meter Usage');
  await upsertModule(meterModule);
  await seedLessons(200002, meterLessons);

  console.log('\nModule 3: Guided Beginner Troubleshooting');
  await upsertModule(guidedModule);
  await seedLessons(200003, guidedLessons);

  console.log('\n✓ All modules seeded successfully.\n');
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
} finally {
  await connection.end();
}
