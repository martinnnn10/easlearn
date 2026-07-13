/**
 * Seed script to populate foundational course module lessons with real content
 * Run: node server/seed-foundational.mjs
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);

// Module IDs from the database
const MODULES = {
  electrical: 30001,
  digital: 30002,
  semiconductor: 30003,
  hvac: 30004,
};

// ============================================================
// ELECTRICAL FUNDAMENTALS - 6 Lessons
// ============================================================
const electricalLessons = [
  {
    slug: 'ohms-law-power',
    title: "Ohm's Law & Power Calculations",
    orderIndex: 1,
    estimatedMinutes: 20,
    content: `# Ohm's Law & Power Calculations

## The Foundation of All Electrical Work

Every measurement you take with a multimeter, every wire size you select, every fuse rating you verify — it all comes back to Ohm's Law. This isn't abstract theory. This is the math that keeps you alive and keeps production running.

## Ohm's Law: The Three Relationships

Ohm's Law defines the relationship between **voltage (V)**, **current (I)**, and **resistance (R)** in any electrical circuit:

$$V = I \\times R$$

$$I = V / R$$

$$R = V / I$$

| Quantity | Symbol | Unit | Measured With |
|----------|--------|------|---------------|
| Voltage (EMF) | V or E | Volts (V) | Voltmeter (parallel) |
| Current | I | Amperes (A) | Ammeter (series) or clamp meter |
| Resistance | R | Ohms (Ω) | Ohmmeter (circuit de-energized) |

### Why This Matters on the Plant Floor

When you measure 480V across a motor starter and 0V at the motor terminals, Ohm's Law tells you there's a high-resistance connection (open circuit) somewhere between those two points. The voltage is being dropped across the fault.

When you measure 2.5A on a circuit rated for 2A, you know either resistance decreased (short developing) or voltage increased. Either way, something is wrong.

## Power Calculations

Power is the rate at which electrical energy is converted to another form (heat, motion, light):

$$P = V \\times I$$

$$P = I^2 \\times R$$

$$P = V^2 / R$$

### The Power Triangle in Practice

| Application | Formula Used | Example |
|-------------|-------------|---------|
| Motor load check | P = V × I × √3 × PF | 480V, 10A, 0.85 PF = 7.1 kW |
| Heater element | P = V² / R | 240V across 20Ω = 2,880W |
| Wire heating | P = I² × R | 15A through 0.5Ω connection = 112.5W of heat |

> **Field Reality:** That last example — 112.5W of heat at a loose connection — is exactly how electrical fires start. A connection with just 0.5Ω of resistance at 15A generates enough heat to melt wire insulation within minutes.

## Practical Application: Troubleshooting with Ohm's Law

### Scenario: Motor Won't Start

1. Measure voltage at motor terminals: **478V** (good — power is present)
2. Measure current with clamp meter: **0A** (motor not drawing current)
3. Disconnect power, measure motor winding resistance: **OL (infinite)** 
4. **Diagnosis:** Open winding — motor needs replacement

### Scenario: Breaker Keeps Tripping

1. Circuit breaker rated: **20A**
2. Measure total load current: **22.5A**
3. Calculate: P = 480V × 22.5A × 1.73 × 0.85 = **15.9 kW**
4. **Diagnosis:** Circuit overloaded — need to redistribute loads or upsize breaker/wire

## Series vs. Parallel: Quick Reference

| Property | Series Circuit | Parallel Circuit |
|----------|---------------|-----------------|
| Current | Same through all components | Divides between branches |
| Voltage | Divides across components | Same across all branches |
| Resistance | R_total = R1 + R2 + R3... | 1/R_total = 1/R1 + 1/R2 + 1/R3... |
| One component opens | Entire circuit stops | Other branches continue |

## Interactive: Ohm's Law Calculator

Use the interactive calculator below to explore the relationships between voltage, current, and resistance. Enter any two values and calculate the third — just like you'd do when troubleshooting on the floor.

<!-- INTERACTIVE: OhmsLawCalculator -->

## Key Takeaways

- Ohm's Law (V = IR) is your primary diagnostic tool — every voltage reading tells you about current and resistance
- Power calculations (P = VI) tell you if a circuit is overloaded before the breaker trips
- Loose connections create resistance, resistance creates heat, heat creates fires
- Always verify your measurements make sense using these relationships
`
  },
  {
    slug: 'kirchhoffs-laws',
    title: "Kirchhoff's Voltage & Current Laws",
    orderIndex: 2,
    estimatedMinutes: 25,
    content: `# Kirchhoff's Voltage & Current Laws

## Beyond Ohm's Law: Analyzing Real Circuits

Ohm's Law works perfectly for a single component. But real industrial circuits have dozens of components — contactors, overloads, fuses, terminal blocks, and hundreds of feet of wire. Kirchhoff's Laws tell you how voltage and current behave across these complex circuits.

## Kirchhoff's Voltage Law (KVL)

> The sum of all voltages around any closed loop in a circuit equals zero.

In practical terms: **the source voltage is completely distributed across all components in a series path.** If you add up every voltage drop in a loop, it equals the supply voltage.

### How This Helps You Troubleshoot

When you measure voltage across each component in a control circuit:

| Component | Expected Drop | Measured Drop | Status |
|-----------|--------------|---------------|--------|
| Fuse | 0V | 0V | ✓ Good |
| E-Stop contacts | 0V | 0V | ✓ Good |
| OL relay contacts | 0V | **120V** | ✗ FAULT |
| Contactor coil | 120V | 0V | — No power reaching it |
| **Total** | **120V** | **120V** | KVL confirmed |

The 120V source is being dropped entirely across the open OL relay contacts. This is **voltage drop troubleshooting** — the most powerful technique in industrial maintenance.

### The Rule: Voltage Drops Across the Fault

- A **closed switch** (good contacts) has ≈0V across it
- An **open switch** (bad contacts, blown fuse, tripped OL) has full source voltage across it
- If you read source voltage across a component, that component is your problem

## Kirchhoff's Current Law (KCL)

> The total current entering a node equals the total current leaving that node.

In practical terms: **current doesn't disappear.** At any junction point, all the current going in must come out through the available paths.

### Parallel Branch Analysis

Consider a motor control center (MCC) bus feeding three motors:

| Branch | Motor | FLA | Measured |
|--------|-------|-----|----------|
| Bus feed | — | — | 45A |
| Branch 1 | Conveyor | 15A | 15.2A |
| Branch 2 | Pump | 20A | 19.8A |
| Branch 3 | Fan | 10A | 10.1A |
| **Total branches** | — | **45A** | **45.1A** |

KCL confirms: bus current (45A) ≈ sum of branch currents (45.1A). ✓

### When KCL Reveals a Problem

If the bus shows 45A but branches only add up to 35A, you have 10A going somewhere unintended — possibly a ground fault leaking current to the equipment frame.

## Practical Voltage Drop Troubleshooting Method

This is the #1 technique used by experienced industrial electricians:

### Step-by-Step Process

1. **Identify the circuit** — trace from source through all series components to load
2. **Measure source voltage** — confirm power is present at the beginning
3. **Measure load voltage** — check if power reaches the end
4. **If load has 0V:** Start measuring across each series component
5. **The component with source voltage across it** = your fault location

### Common Voltage Drops You'll Find

| Component | Normal Drop | Fault Indication |
|-----------|------------|-----------------|
| Wire (per 100ft) | 0.5-3V | >5V = undersized or damaged |
| Fuse (good) | <0.5V | Full voltage = blown |
| Contactor contacts | <1V | >5V = pitted/worn contacts |
| Terminal block | <0.1V | >1V = loose connection |
| Overload relay | 0V (closed) | Full voltage = tripped |

## Interactive: Circuit Flow Visualization

Watch how current flows through series and parallel paths. Notice how voltage distributes across components according to Kirchhoff's Laws:

<!-- INTERACTIVE: CircuitFlowAnimator -->

## Key Takeaways

- KVL: Source voltage = sum of all voltage drops in a loop. The fault gets the voltage.
- KCL: Current in = current out at every junction. Missing current means a ground fault.
- Voltage drop troubleshooting is faster than continuity testing — you can do it on an energized circuit
- Always start at the source and work toward the load, measuring across each component
`
  },
  {
    slug: 'ac-dc-theory',
    title: 'AC vs. DC: Theory & Industrial Applications',
    orderIndex: 3,
    estimatedMinutes: 22,
    content: `# AC vs. DC: Theory & Industrial Applications

## Two Types of Electrical Power

Every industrial facility uses both AC and DC power. Understanding the fundamental differences between them is critical for proper measurement, troubleshooting, and safety.

## Direct Current (DC)

DC flows in one direction only. The voltage is constant (steady-state).

### Where You'll Find DC in a Plant

| Application | Typical Voltage | Source |
|-------------|----------------|--------|
| PLC I/O modules | 24V DC | Power supply |
| Control relays | 24V DC | Power supply |
| VFD DC bus | 325V (from 230V AC) or 650V (from 480V AC) | Rectifier bridge |
| Battery backup / UPS | 12V, 24V, 48V, 125V | Batteries |
| Servo drives | 300-600V DC | Rectifier |
| Sensors & transmitters | 4-20mA (at 24V DC) | Loop power supply |
| Safety circuits | 24V DC | Safety relay module |

### DC Characteristics

- Polarity matters: positive (+) and negative (-) must be correct
- Capacitors charge to DC voltage and hold it (VFD DC bus!)
- DC arcs are harder to extinguish than AC arcs (no zero-crossing)
- Wire color code: Red = positive, Black = negative (control circuits)

## Alternating Current (AC)

AC reverses direction cyclically. In North America, it completes 60 cycles per second (60 Hz).

### AC Waveform Properties

| Property | Value (North America) | Value (International) |
|----------|----------------------|----------------------|
| Frequency | 60 Hz | 50 Hz |
| Single-phase | 120V, 240V | 220V, 230V |
| Three-phase | 208V, 480V, 600V | 380V, 400V, 415V |
| Period (one cycle) | 16.67 ms | 20 ms |

### Peak vs. RMS

Your meter reads **RMS** (Root Mean Square) — the effective DC equivalent:

- 480V RMS has a **peak** of 480 × 1.414 = **679V**
- This is why VFD DC bus voltage is ~650-680V from 480V AC input
- The rectifier charges capacitors to the peak value

> **Safety Note:** When a VFD input reads 480V AC, the internal DC bus is at 650+ volts DC. This is lethal. DC bus capacitors hold this charge for minutes after power removal.

## Three-Phase Power

Industrial motors and large loads use three-phase power because it:
- Delivers constant power (no pulsation like single-phase)
- Uses less copper for the same power delivery
- Creates a rotating magnetic field in motors (no starting mechanism needed)

### Three-Phase Voltage Relationships

| Configuration | Line-to-Line | Line-to-Neutral | Relationship |
|--------------|-------------|-----------------|--------------|
| Wye (Y) | 480V | 277V | V_LL = V_LN × √3 |
| Delta (Δ) | 480V | N/A | No neutral available |

### Phase Rotation

Phase rotation (A-B-C or A-C-B) determines motor rotation direction. Swapping any two phases reverses rotation. This is critical when:
- Connecting a new motor
- Reconnecting after maintenance
- Troubleshooting a pump running backward

## Measuring AC vs. DC

| Setting | Use For | Common Mistake |
|---------|---------|----------------|
| V AC | Motor power, control transformers | Using DC setting on AC circuit (reads 0) |
| V DC | PLC I/O, sensors, DC bus | Using AC setting on DC (reads ~0.7× actual) |
| True RMS | VFD output, PWM signals | Non-true-RMS meter on VFD output (reads wrong) |

> **Critical:** Standard multimeters cannot accurately read VFD output voltage. The PWM waveform gives false readings. Use the VFD's built-in display or a meter specifically rated for inverter duty.

## Impedance: AC's Extra Resistance

In DC circuits, only resistance (R) opposes current flow. In AC circuits, you also have:

- **Inductive reactance (X_L):** Opposition from coils/motors — increases with frequency
- **Capacitive reactance (X_C):** Opposition from capacitors — decreases with frequency
- **Impedance (Z):** Total opposition = √(R² + (X_L - X_C)²)

This is why a motor that measures 2Ω with an ohmmeter doesn't draw 240A at 480V. The inductive reactance of the windings limits current to the nameplate FLA.

## Key Takeaways

- DC is constant polarity, used for controls (24V) and VFD internals (650V DC bus)
- AC alternates 60 times/second, used for power distribution and motors
- Three-phase delivers constant power and creates rotating magnetic fields
- Always match your meter setting (AC/DC) to the circuit you're measuring
- VFD DC bus voltage is 1.414× the AC input — always lethal
`
  },
  {
    slug: 'series-parallel-circuits',
    title: 'Series & Parallel Circuits in Industrial Systems',
    orderIndex: 4,
    estimatedMinutes: 20,
    content: `# Series & Parallel Circuits in Industrial Systems

## Real Circuits Are Combinations

Every industrial control circuit is a combination of series and parallel paths. Understanding which components are in series (and therefore which single failure stops the whole circuit) vs. parallel (where one failure doesn't affect others) is the key to fast troubleshooting.

## Series Circuits: The Safety Chain

In a series circuit, current has only ONE path. If any component opens, the entire circuit stops.

### Classic Example: Motor Starter Control Circuit

The typical motor control circuit is a series string:

\`\`\`
L1 ──[Fuse]──[E-Stop NC]──[OL NC]──[Stop NC]──[Start NO/Seal]──[Coil]── L2
\`\`\`

Every component is in series. Opening ANY one stops the motor:
- Blown fuse → motor stops
- E-Stop pressed → motor stops  
- Overload tripped → motor stops
- Stop button pressed → motor stops

> **Design Principle:** Safety devices are ALWAYS in series with the load. This ensures any single failure results in a safe (de-energized) state. This is called "fail-safe" design.

### Series Circuit Rules for Troubleshooting

| Rule | Implication |
|------|------------|
| Same current everywhere | If current flows anywhere, it flows everywhere |
| Voltage divides | Each component drops a portion of source voltage |
| Total R = sum of all R | Adding components increases total resistance |
| One open = all stop | Any break kills the entire circuit |

### Voltage Drop Method (Series Circuits)

Since voltage divides across series components, you can find the open component by measuring voltage across each one:

- **0V across a component** = current is flowing through it (it's good)
- **Full source voltage across a component** = it's open (the fault)

## Parallel Circuits: Power Distribution

In a parallel circuit, current has MULTIPLE paths. Each branch operates independently.

### Classic Example: Motor Control Center (MCC)

\`\`\`
480V Bus ──┬──[Breaker 1]──[Starter 1]──[Motor 1]
           ├──[Breaker 2]──[Starter 2]──[Motor 2]  
           ├──[Breaker 3]──[Starter 3]──[Motor 3]
           └──[Breaker 4]──[Starter 4]──[Motor 4]
\`\`\`

Each motor circuit is a parallel branch. Tripping Breaker 2 stops Motor 2 but Motors 1, 3, and 4 continue running.

### Parallel Circuit Rules

| Rule | Implication |
|------|------------|
| Same voltage across all branches | Each motor sees 480V regardless of others |
| Current divides between branches | Total current = sum of all branch currents |
| 1/R_total = 1/R1 + 1/R2 + ... | Adding branches decreases total resistance |
| One branch open = others unaffected | Independent operation |

## Combination Circuits: The Real World

Real industrial circuits combine series and parallel elements:

### Example: Dual-Speed Motor with Interlocks

\`\`\`
L1 ──[Fuse]──[E-Stop]──[OL]──┬──[Low Speed Start]──[High Speed Interlock NC]──[Low Coil]
                               └──[High Speed Start]──[Low Speed Interlock NC]──[High Coil]
\`\`\`

- The safety devices (fuse, E-stop, OL) are in **series** with everything — they protect both speeds
- The two speed circuits are in **parallel** — you can select either one
- The interlocks are in **series** with the opposite speed — prevents both running simultaneously

## Practical Troubleshooting Strategy

### Step 1: Identify Series vs. Parallel

Ask yourself: "If this component fails open, what else stops working?"
- If EVERYTHING downstream stops → it's in series
- If only ONE branch stops → it's in parallel

### Step 2: Apply the Right Technique

| Circuit Type | Best Troubleshooting Method |
|-------------|---------------------------|
| Series (control circuit) | Voltage drop across each component |
| Parallel (power distribution) | Current measurement per branch |
| Combination | Identify which section has the fault first, then narrow down |

### Step 3: Common Industrial Series Strings

| System | Series Safety Chain |
|--------|-------------------|
| Motor starter | Fuse → E-Stop → OL → Stop → Start/Seal → Coil |
| Safety circuit | Light curtain → Safety relay → Gate switch → E-Stop → Output |
| PLC output | Fuse → PLC output → Interposing relay → Contactor coil |
| VFD control | Enable → Run command → Safety → Speed reference valid |

## Interactive: Circuit Flow Visualization

Explore how current divides in parallel branches and how voltage drops across series components:

<!-- INTERACTIVE: CircuitFlowAnimator -->

## Key Takeaways

- Series = one path, one failure stops everything (safety devices go here)
- Parallel = multiple paths, independent operation (power distribution)
- Real circuits are combinations — identify the series safety chain first
- Voltage drop method works on series strings: full voltage across the fault
- Current measurement works for parallel branches: compare to expected values
`
  },
  {
    slug: 'electrical-safety-lockout',
    title: 'Electrical Safety & Lockout/Tagout',
    orderIndex: 5,
    estimatedMinutes: 18,
    content: `# Electrical Safety & Lockout/Tagout

## The Non-Negotiable Foundation

Electrical safety isn't a suggestion — it's the difference between going home at the end of your shift and not. Every year, approximately 160 workers die from electrical contact in the United States. Many more suffer severe burns, amputations, and permanent disability.

## Voltage Thresholds & Human Body

| Voltage/Current | Effect on Human Body |
|----------------|---------------------|
| 1 mA | Perception threshold (tingling) |
| 5 mA | Pain, difficulty releasing grip |
| 15-20 mA | Muscular paralysis ("can't let go") |
| 50-100 mA | Ventricular fibrillation (heart stops) |
| >100 mA | Cardiac arrest, severe burns |

> **Critical Fact:** It takes only 50 milliamps (0.050A) to kill. At 480V with wet hands (1,000Ω body resistance), current through the body = 480/1000 = 0.48A = 480mA. That's nearly 10× the lethal threshold.

## NFPA 70E: Arc Flash & Shock Protection

### Approach Boundaries (480V System)

| Boundary | Distance | Requirement |
|----------|----------|-------------|
| Limited Approach | 3.5 feet | Only qualified persons beyond this |
| Restricted Approach | 1 foot | PPE required, qualified only |
| Arc Flash Boundary | Varies (calculated) | Full arc-rated PPE required |

### PPE Categories

| Category | Cal/cm² | Typical Equipment |
|----------|---------|-------------------|
| 1 | 4 | Arc-rated shirt/pants, safety glasses, hard hat |
| 2 | 8 | Arc-rated shirt/pants, face shield, hard hat, gloves |
| 3 | 25 | Arc flash suit, hood, hard hat, gloves |
| 4 | 40 | Multi-layer arc flash suit, full hood, heavy gloves |

## Lockout/Tagout (LOTO) — OSHA 1910.147

### The Six Steps of LOTO

1. **Notify** — Inform all affected employees
2. **Shut down** — Use normal stopping procedure
3. **Isolate** — Open disconnects, close valves, block energy
4. **Lock & Tag** — Apply personal lock and tag to each energy isolation device
5. **Verify** — Attempt to restart (should not start), test with meter
6. **Release stored energy** — Bleed capacitors, release springs, block gravity loads

### Verification: The Step That Saves Lives

After applying locks:
1. Try to start the equipment (it should not start)
2. Use a **known-good meter** to verify zero energy
3. Test the meter on a known live source BEFORE and AFTER testing the locked-out circuit
4. Check ALL phases (L1-L2, L2-L3, L1-L3, each to ground)

> **The Live-Dead-Live Test:** Test meter on known live source (confirms meter works) → Test locked-out circuit (should read 0V) → Test meter on known live source again (confirms meter didn't fail during test). This is non-negotiable.

## Common Electrical Hazards in Industrial Settings

### Stored Energy Sources

| Source | Location | Hazard | Mitigation |
|--------|----------|--------|-----------|
| DC bus capacitors | VFD internals | 650V+ DC for 5+ minutes | Wait time + verify with meter |
| UPS batteries | Electrical rooms | 125V-480V DC, always live | Separate disconnect required |
| Motor back-EMF | Large motors coasting | Voltage while spinning | Wait for full stop |
| Capacitor banks | Power factor correction | Thousands of volts | Discharge resistors + verify |
| Control transformer | Secondary side | 120V even with primary locked out? NO — but verify |

### Arc Flash Scenarios

| Scenario | Incident Energy | Consequence |
|----------|----------------|-------------|
| 480V MCC bucket, bolted fault | 8-25 cal/cm² | Severe burns at 18" |
| 480V panel, loose connection arcs | 4-12 cal/cm² | Burns, blast pressure |
| 4160V switchgear | 40+ cal/cm² | Fatal without full suit |
| 120V panel | 1-4 cal/cm² | Still dangerous — don't dismiss |

## Working Live: When It's Justified

NFPA 70E requires de-energized work UNLESS:
- De-energizing creates a **greater hazard** (life support, continuous process)
- The task is **infeasible** to perform de-energized (voltage testing, thermography)

If live work is justified:
- Energized work permit required
- Full PPE for calculated incident energy
- Insulated tools only
- Second qualified person present
- Barricades around work area

## Key Takeaways

- 50mA kills. 480V through a wet body delivers 480mA. Respect the voltage.
- LOTO is six steps — verification (Live-Dead-Live) is the most critical
- VFD DC bus holds lethal voltage for 5+ minutes after power removal
- Arc flash PPE is selected based on calculated incident energy, not guesswork
- Working live requires formal justification, permits, and full PPE — never casual
`
  },
  {
    slug: 'meters-measurements',
    title: 'Meters & Measurement Techniques',
    orderIndex: 6,
    estimatedMinutes: 22,
    content: `# Meters & Measurement Techniques

## Your Meter Is Your Primary Diagnostic Tool

A multimeter is to an electrician what a stethoscope is to a doctor. Knowing how to use it correctly — and understanding what the readings mean — separates a technician from a parts-changer.

## The Fluke 87V: Industry Standard

Most industrial electricians carry a Fluke 87V or equivalent true-RMS meter. Key capabilities:

| Function | Range | Application |
|----------|-------|-------------|
| V AC | 0-1000V | Motor power, control circuits |
| V DC | 0-1000V | PLC I/O, sensors, DC bus |
| Resistance (Ω) | 0-50MΩ | Winding resistance, continuity |
| Continuity | <25Ω beeps | Wire tracing, contact verification |
| Current (mA) | 0-400mA | 4-20mA loop signals |
| Frequency (Hz) | 0-200kHz | VFD output frequency verification |
| Capacitance | 0-10,000µF | Motor run/start capacitors |
| Diode test | 0-2V | Semiconductor junction testing |

## Measurement Techniques

### Voltage Measurement (Parallel Connection)

Connect meter leads **across** (in parallel with) the component:
- Red lead to one side, black lead to the other side
- Circuit remains energized during measurement
- Set meter to V AC or V DC as appropriate

**Common Mistakes:**
- Wrong AC/DC setting → misleading reading
- Measuring VFD output with non-true-RMS meter → reads 20-40% low
- Not selecting correct range (auto-range meters handle this)

### Current Measurement (Clamp Meter)

For most industrial work, use a **clamp-on ammeter** around a single conductor:
- Clamp around ONE wire only (not the entire cable)
- If you clamp around all conductors in a cable, fields cancel → reads 0A
- Exception: clamping all conductors reads ground fault current (imbalance)

| Measurement | Method | Expected |
|-------------|--------|----------|
| Motor running current | Clamp one phase conductor | Should be ≤ nameplate FLA |
| Ground fault detection | Clamp all 3 phases together | Should be <0.5A (ideally 0) |
| Control circuit current | Clamp one wire | Typically <1A for relay coils |

### Resistance Measurement (Circuit MUST Be De-energized)

**CRITICAL: Never measure resistance on an energized circuit.** You will:
- Get a meaningless reading
- Potentially damage the meter
- Risk injury from the circuit

**Proper procedure:**
1. De-energize and LOTO the circuit
2. Discharge any capacitors
3. Disconnect the component from the circuit (to avoid parallel paths giving false low readings)
4. Connect meter leads across the component
5. Read the value

### Common Resistance Values

| Component | Expected Resistance | Fault Indication |
|-----------|-------------------|-----------------|
| Good fuse | <1Ω | OL (infinite) = blown |
| Contactor coil (120V) | 20-200Ω | OL = open coil, <5Ω = shorted |
| Motor winding (small) | 2-50Ω | OL = open, <1Ω = shorted |
| Motor winding (large) | 0.1-5Ω | Imbalance >5% between phases = problem |
| Closed contacts | <1Ω | >5Ω = pitted/corroded |
| Wire (per 100ft, #12) | ~0.16Ω | Higher = damaged/corroded |

## Megohmmeter (Insulation Resistance Testing)

A megger applies high DC voltage (250V, 500V, or 1000V) to test insulation integrity:

| Test Voltage | Application |
|-------------|-------------|
| 250V DC | Low-voltage control circuits |
| 500V DC | Motors up to 480V |
| 1000V DC | Motors 480V-600V |
| 2500V DC | Medium voltage (2.3kV-4.16kV) |

### Acceptable Readings

| Reading | Interpretation |
|---------|---------------|
| >100 MΩ | Excellent insulation |
| 10-100 MΩ | Good — monitor trend |
| 2-10 MΩ | Deteriorating — schedule replacement |
| <2 MΩ | Poor — replace soon |
| <1 MΩ | Dangerous — remove from service |

> **WARNING:** Never megger through a VFD. Disconnect motor leads at the VFD output terminals before testing. The test voltage will destroy IGBT modules and DC bus capacitors instantly.

## Measurement Best Practices

### Before Every Measurement

1. Inspect leads for damaged insulation, exposed conductors, bent probes
2. Verify meter is set to correct function (V AC, V DC, Ω, etc.)
3. For voltage: verify meter works on a known live source first
4. For resistance: verify circuit is de-energized and discharged

### Reading Interpretation

| Situation | What It Means |
|-----------|---------------|
| Voltage reading fluctuates wildly | Loose connection or intermittent contact |
| Resistance reads OL | Open circuit (infinite resistance) |
| Resistance reads 0Ω | Short circuit or meter leads touching |
| Voltage reads half of expected | One phase lost (single-phasing) |
| Current much higher than nameplate | Mechanical overload or electrical fault |

## Interactive: Ohm's Law Calculator

Practice calculating expected values before you measure. If your measurement doesn't match the calculation, you've found your problem:

<!-- INTERACTIVE: OhmsLawCalculator -->

## Key Takeaways

- Always verify your meter works on a known source before trusting a "0V" reading
- Never measure resistance on an energized circuit
- Clamp ONE conductor for current — all conductors together reads ground fault current
- VFD output requires true-RMS meter rated for inverter duty
- Megger testing: always disconnect from VFDs and electronic equipment first
- Trending resistance/insulation readings over time catches failures before they happen
`
  },
];

// ============================================================
// DIGITAL FUNDAMENTALS - 6 Lessons
// ============================================================
const digitalLessons = [
  {
    slug: 'binary-number-systems',
    title: 'Binary, Hex & Number Systems for PLCs',
    orderIndex: 1,
    estimatedMinutes: 18,
    content: `# Binary, Hex & Number Systems for PLCs

## Why Electricians Need to Understand Binary

PLCs think in binary — every input is either ON (1) or OFF (0), every output is energized or de-energized. When you're troubleshooting a PLC, the status LEDs, data tables, and fault codes all use binary and hexadecimal. Understanding these number systems lets you read PLC memory directly.

## Binary: The Language of Digital Logic

Binary uses only two digits: **0** and **1**

| Binary | Decimal | PLC Meaning |
|--------|---------|-------------|
| 0 | 0 | OFF, False, De-energized |
| 1 | 1 | ON, True, Energized |
| 0000 | 0 | All 4 inputs OFF |
| 0001 | 1 | Input 0 ON, rest OFF |
| 0101 | 5 | Inputs 0 and 2 ON |
| 1111 | 15 | All 4 inputs ON |

### Place Values (Right to Left)

| Position | 7 | 6 | 5 | 4 | 3 | 2 | 1 | 0 |
|----------|---|---|---|---|---|---|---|---|
| Value | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |

**Example:** Binary 10110011 = 128 + 32 + 16 + 2 + 1 = **179 decimal**

### Reading PLC I/O Status

A CompactLogix input module shows 16 inputs as a binary word:

\`\`\`
Input Word: 0000 0000 0010 0101
             ↑                ↑
           Bit 15           Bit 0
\`\`\`

This means: Inputs 0, 2, and 5 are ON. All others are OFF.

## Hexadecimal: Compact Binary

Hexadecimal (hex) uses 16 digits: 0-9 and A-F. Each hex digit represents exactly 4 binary bits:

| Hex | Binary | Decimal |
|-----|--------|---------|
| 0 | 0000 | 0 |
| 1 | 0001 | 1 |
| 5 | 0101 | 5 |
| 9 | 1001 | 9 |
| A | 1010 | 10 |
| B | 1011 | 11 |
| F | 1111 | 15 |

### Why Hex Matters

PLC fault codes, memory addresses, and IP addresses often display in hex:

| Display | Meaning |
|---------|---------|
| Fault 0x0004 | Fault code 4 (undervoltage) |
| Address 0xFF | Memory location 255 |
| IP: C0.A8.01.01 | 192.168.1.1 |
| Module status: 0x30 | Binary 0011 0000 = bits 4 and 5 set |

### Quick Conversion: Binary ↔ Hex

Split binary into groups of 4 (from right), convert each group:

\`\`\`
Binary:  1010  1100  0011  0101
Hex:       A     C     3     5
Result: 0xAC35
\`\`\`

## Data Types in PLCs

| Type | Size | Range | Use |
|------|------|-------|-----|
| BOOL | 1 bit | 0 or 1 | Single I/O point |
| BYTE | 8 bits | 0-255 | Small counters, status |
| INT | 16 bits | -32,768 to 32,767 | Analog values, timers |
| DINT | 32 bits | ±2.1 billion | Large counts, timestamps |
| REAL | 32 bits | ±3.4×10³⁸ | Floating point (temperature, flow) |

### Practical Application: Analog Scaling

A 4-20mA input scaled to 0-100% in a PLC:

- 4mA = 0 counts (or 0 in engineering units)
- 20mA = 32,767 counts (full scale for 16-bit)
- Formula: Engineering Value = (Raw - 6553) × 100 / 26214

## Bit Manipulation: Masking & Shifting

PLCs often pack multiple status bits into a single word:

\`\`\`
Status Word: 0000 0000 0001 0110
             Bit 4: Fault Active = 1 (YES)
             Bit 2: Running = 1 (YES)  
             Bit 1: Ready = 1 (YES)
             Bit 0: Enabled = 0 (NO)
\`\`\`

To check if Bit 4 is set: AND the word with 0000 0000 0001 0000 (mask = 16)
- If result ≠ 0, the bit is set

## Key Takeaways

- Binary is the native language of PLCs — every I/O point is a single bit
- Hex is shorthand for binary: each hex digit = 4 bits
- PLC fault codes and addresses are often in hex — learn to convert quickly
- Understanding bit positions lets you read raw PLC status words
- Analog values are scaled integers — know the scaling formula for your system
`
  },
  {
    slug: 'logic-gates-boolean',
    title: 'Logic Gates & Boolean Algebra',
    orderIndex: 2,
    estimatedMinutes: 20,
    content: `# Logic Gates & Boolean Algebra

## Digital Logic: The Building Blocks of PLC Programs

Every PLC program — whether written in ladder logic, function block, or structured text — is built from basic logic operations. These are the same logic gates used in every digital circuit, from a simple safety relay to a complex motion controller.

## The Seven Basic Logic Gates

### AND Gate — Series Contacts

Both inputs must be TRUE for output to be TRUE.

| A | B | Output (A AND B) |
|---|---|-----------------|
| 0 | 0 | 0 |
| 0 | 1 | 0 |
| 1 | 0 | 0 |
| 1 | 1 | **1** |

**Industrial Example:** A press will only cycle if BOTH the left-hand palm button AND the right-hand palm button are pressed simultaneously. This ensures both hands are away from the point of operation.

**Ladder Logic:** Two contacts in SERIES = AND function

### OR Gate — Parallel Contacts

Either input (or both) must be TRUE for output to be TRUE.

| A | B | Output (A OR B) |
|---|---|----------------|
| 0 | 0 | 0 |
| 0 | 1 | **1** |
| 1 | 0 | **1** |
| 1 | 1 | **1** |

**Industrial Example:** A conveyor can be started from the local pushbutton OR from the HMI screen OR from the PLC auto sequence.

**Ladder Logic:** Two contacts in PARALLEL = OR function

### NOT Gate — Normally Closed Contact

Inverts the input. TRUE becomes FALSE, FALSE becomes TRUE.

| A | Output (NOT A) |
|---|---------------|
| 0 | **1** |
| 1 | 0 |

**Industrial Example:** A safety circuit uses NC (Normally Closed) contacts. When the E-Stop is NOT pressed (input = 0), the safety relay output is ON (1). When pressed (input = 1), output goes OFF (0).

**Ladder Logic:** NC contact (XIO instruction) = NOT function

### NAND Gate — NOT AND

Output is TRUE unless ALL inputs are TRUE.

| A | B | Output |
|---|---|--------|
| 0 | 0 | **1** |
| 0 | 1 | **1** |
| 1 | 0 | **1** |
| 1 | 1 | 0 |

### NOR Gate — NOT OR

Output is TRUE only when ALL inputs are FALSE.

| A | B | Output |
|---|---|--------|
| 0 | 0 | **1** |
| 0 | 1 | 0 |
| 1 | 0 | 0 |
| 1 | 1 | 0 |

### XOR Gate — Exclusive OR

Output is TRUE when inputs are DIFFERENT.

| A | B | Output |
|---|---|--------|
| 0 | 0 | 0 |
| 0 | 1 | **1** |
| 1 | 0 | **1** |
| 1 | 1 | 0 |

**Industrial Example:** A conveyor direction selector — Forward XOR Reverse. Only one direction can be active. If both are somehow active, output is FALSE (fault condition).

## Boolean Algebra: Simplifying Logic

### Basic Laws

| Law | Expression | Meaning |
|-----|-----------|---------|
| Identity | A AND 1 = A | ANDing with TRUE doesn't change anything |
| Null | A AND 0 = 0 | ANDing with FALSE always gives FALSE |
| Complement | A AND (NOT A) = 0 | A thing can't be both true and false |
| Idempotent | A OR A = A | ORing with itself doesn't change anything |
| De Morgan's | NOT(A AND B) = (NOT A) OR (NOT B) | Breaking a NAND into individual NOTs |

### De Morgan's Theorem in Troubleshooting

De Morgan's Law helps you understand complex safety circuits:

> "The machine will NOT run if Guard A AND Guard B are both closed" 

is the same as:

> "The machine WILL run if Guard A is open OR Guard B is open"

Wait — that's wrong! This is why you must be careful with logic inversion in safety circuits.

## Interactive: PLC Logic Visualizer

Experiment with logic gates interactively. Toggle inputs and watch how outputs respond through AND, OR, NOT, and combination circuits:

<!-- INTERACTIVE: PLCLogicVisualizer -->

## From Logic Gates to Ladder Logic

| Logic Gate | Ladder Logic Equivalent |
|-----------|----------------------|
| AND | Contacts in series on same rung |
| OR | Contacts in parallel (branched) |
| NOT | NC contact (XIO instruction) |
| NAND | Series contacts with inverted output |
| Latch (SET/RESET) | OTL/OTU instructions or seal-in circuit |

## Key Takeaways

- AND = series contacts (all must be true)
- OR = parallel contacts (any can be true)
- NOT = NC contact (inverts the logic)
- Safety circuits use NC contacts so wire breaks = safe shutdown (fail-safe)
- De Morgan's theorem helps you trace inverted logic in complex safety systems
- Every PLC program is built from these basic building blocks
`
  },
  {
    slug: 'plc-introduction',
    title: 'Introduction to PLCs: Architecture & Operation',
    orderIndex: 3,
    estimatedMinutes: 22,
    content: `# Introduction to PLCs: Architecture & Operation

## What Is a PLC?

A Programmable Logic Controller (PLC) is a ruggedized industrial computer designed to control manufacturing processes. Unlike a desktop PC, a PLC is built to:

- Operate in extreme temperatures (-20°C to 60°C)
- Withstand vibration, dust, and electrical noise
- Run 24/7/365 without crashes or reboots
- Execute its program in a deterministic, repeatable scan cycle

## PLC Hardware Architecture

### The Five Core Components

| Component | Function | Industrial Example |
|-----------|----------|-------------------|
| **Power Supply** | Converts AC to DC for PLC internals | 120V AC → 24V DC, or 24V DC direct |
| **CPU (Processor)** | Executes the program, manages I/O | ControlLogix 5580, CompactLogix 5380 |
| **Input Modules** | Read field device states into memory | 24V DC discrete, 4-20mA analog |
| **Output Modules** | Control field devices from memory | Relay, transistor, 4-20mA analog |
| **Communication** | Network connectivity | EtherNet/IP, DeviceNet, RS-232 |

### Input Devices (Field → PLC)

| Device | Signal Type | PLC Input Type |
|--------|------------|---------------|
| Pushbutton | 24V DC discrete | Digital input (DI) |
| Limit switch | 24V DC discrete | Digital input (DI) |
| Proximity sensor | 24V DC (PNP/NPN) | Digital input (DI) |
| Pressure transmitter | 4-20mA | Analog input (AI) |
| Thermocouple | mV signal | Thermocouple input |
| Encoder | Pulse train | High-speed counter |

### Output Devices (PLC → Field)

| Device | Signal Type | PLC Output Type |
|--------|------------|----------------|
| Contactor coil | 24V DC / 120V AC | Digital output (DO) |
| Solenoid valve | 24V DC | Digital output (DO) |
| Indicator light | 24V DC | Digital output (DO) |
| VFD speed reference | 4-20mA or 0-10V | Analog output (AO) |
| Proportional valve | 4-20mA | Analog output (AO) |

## The PLC Scan Cycle

The PLC executes its program in a continuous loop called the **scan cycle**:

### 1. Input Scan (Read Inputs)
- PLC reads ALL physical input states
- Stores them in the **Input Image Table** (memory)
- Physical inputs are NOT read again until next scan

### 2. Program Execution (Logic Solve)
- CPU evaluates the entire program top-to-bottom, left-to-right
- Uses Input Image Table values (not live inputs)
- Calculates output states and stores in **Output Image Table**

### 3. Output Scan (Write Outputs)
- PLC writes ALL output states from Output Image Table to physical outputs
- All outputs update simultaneously at end of scan

### 4. Housekeeping & Communications
- Updates timers and counters
- Processes communication requests
- Performs self-diagnostics

### Scan Time

| PLC Platform | Typical Scan Time | Program Size |
|-------------|-------------------|-------------|
| Micro800 | 5-20 ms | Small (< 1000 rungs) |
| CompactLogix | 2-10 ms | Medium (1000-5000 rungs) |
| ControlLogix | 1-5 ms | Large (5000+ rungs) |

> **Why Scan Time Matters:** If your scan time is 10ms, the fastest you can detect an input change is 10ms. For high-speed applications (counting, motion), you need high-speed counter inputs that bypass the normal scan cycle.

## PLC Memory Organization

### Allen-Bradley Tag-Based Memory (Logix Platform)

Modern Allen-Bradley PLCs use named tags instead of numbered addresses:

| Tag Name | Data Type | Description |
|----------|-----------|-------------|
| Conveyor_Running | BOOL | Conveyor motor status |
| Tank_Level | REAL | Tank level in gallons |
| Batch_Count | DINT | Number of batches completed |
| Motor_Speed_Ref | INT | Speed reference 0-32767 |

### Older Fixed-Address PLCs (SLC-500, PLC-5)

| File | Address Format | Content |
|------|---------------|---------|
| I:0 | I:0/0 through I:0/15 | Input image (slot 0) |
| O:0 | O:0/0 through O:0/15 | Output image (slot 0) |
| B3 | B3:0/0 through B3:x/15 | Internal bits |
| T4 | T4:0.ACC | Timer accumulators |
| C5 | C5:0.ACC | Counter accumulators |
| N7 | N7:0 through N7:x | Integer data |

## PLC vs. Relay Logic: Why PLCs Won

| Feature | Relay Logic | PLC |
|---------|------------|-----|
| Modification | Rewire physical panel | Change program (minutes) |
| Troubleshooting | Trace physical wires | Monitor logic online |
| Timing | Pneumatic timers (drift) | Electronic timers (precise) |
| Counting | Mechanical counters | Software counters (unlimited) |
| Documentation | Paper drawings (outdated) | Program IS the documentation |
| Space | Large relay panels | Compact DIN-rail mount |
| Cost (complex system) | Very high | Moderate |

## Key Takeaways

- PLCs execute a continuous scan cycle: Read Inputs → Solve Logic → Write Outputs
- Inputs are only read once per scan — the program works from the image table
- Scan time determines response speed (typically 1-20ms)
- Modern PLCs use named tags; older ones use file/address notation
- Understanding the scan cycle explains why outputs don't change mid-program
`
  },
  {
    slug: 'ladder-logic-basics',
    title: 'Ladder Logic: Reading & Writing Basic Programs',
    orderIndex: 4,
    estimatedMinutes: 25,
    content: `# Ladder Logic: Reading & Writing Basic Programs

## The Universal Language of Industrial Control

Ladder logic was designed to look like electrical schematics so that electricians could program PLCs without learning a traditional programming language. Each "rung" of the ladder represents a circuit path from the left power rail to the right power rail.

## Ladder Logic Structure

\`\`\`
Left Rail                                    Right Rail
   |                                              |
   |---[ ]---[ ]---[ ]---( )---|                  |
   |  Input1  Input2  Input3  Output1             |
   |                                              |
   |---[/]---+---[ ]---( )---|                    |
   |  Input4  |  Input5  Output2                  |
   |          |                                   |
   |          +---[ ]---+                         |
   |             Input6                           |
   |                                              |
\`\`\`

### Basic Elements

| Symbol | Name | Function |
|--------|------|----------|
| ---[ ]--- | XIC (Examine If Closed) | TRUE when bit = 1 (NO contact) |
| ---[/]--- | XIO (Examine If Open) | TRUE when bit = 0 (NC contact) |
| ---( )--- | OTE (Output Energize) | Sets bit = 1 when rung is true |
| ---(L)--- | OTL (Output Latch) | Sets bit = 1, stays latched |
| ---(U)--- | OTU (Output Unlatch) | Resets latched bit to 0 |

## Reading Ladder Logic: Left to Right, Top to Bottom

### Rule 1: Series = AND

Contacts in series ALL must be true for the rung to be true:

\`\`\`
|---[Start_PB]---[Safety_OK]---[Not_Faulted]---(Motor_Run)---|
\`\`\`

Motor_Run = Start_PB AND Safety_OK AND Not_Faulted

### Rule 2: Parallel = OR

Contacts in parallel — ANY one being true makes that branch true:

\`\`\`
|---[Local_Start]---+---(Conveyor_Run)---|
|                   |                     |
|---[HMI_Start]----+                     |
|                   |                     |
|---[Auto_Start]---+                     |
\`\`\`

Conveyor_Run = Local_Start OR HMI_Start OR Auto_Start

### Rule 3: NC Contact (XIO) = NOT

\`\`\`
|---[/Stop_PB]---[Start_PB]---(Motor_Run)---|
\`\`\`

Motor_Run = (NOT Stop_PB) AND Start_PB

The Stop pushbutton is wired NC — when you press it (input goes TRUE), the XIO goes FALSE, killing the rung.

## The Seal-In Circuit: Most Common Pattern

The seal-in (or latch) circuit is the most fundamental pattern in industrial controls:

\`\`\`
|---[Start_PB]---+---[/Stop_PB]---[/OL_Tripped]---(Motor_Coil)---|
|                |                                                  |
|---[Motor_Coil]-+                                                 |
\`\`\`

**How it works:**
1. Press Start → Start_PB goes TRUE → rung goes TRUE → Motor_Coil energizes
2. Release Start → Start_PB goes FALSE → BUT Motor_Coil contact (seal-in) keeps rung TRUE
3. Press Stop → Stop_PB goes TRUE → XIO goes FALSE → rung goes FALSE → Motor stops
4. OL trips → same effect as Stop

> **This is identical to a hardwired 3-wire motor control circuit.** The PLC seal-in replaces the physical auxiliary contact on the contactor.

## Common Ladder Logic Patterns

### Timer (TON — Timer On-Delay)

\`\`\`
|---[Sensor_Blocked]---[TON Timer_1, 5000ms]---|
|                                               |
|---[Timer_1.DN]---(Alarm_Output)---|
\`\`\`

If sensor stays blocked for 5 seconds continuously, alarm activates.

### Counter (CTU — Count Up)

\`\`\`
|---[Part_Sensor]---[CTU Counter_1, Preset=100]---|
|                                                  |
|---[Counter_1.DN]---(Batch_Complete)---|
\`\`\`

After 100 parts are detected, Batch_Complete goes TRUE.

### One-Shot (ONS — One Shot)

\`\`\`
|---[Trigger]---[ONS Oneshot_1]---(Pulse_Output)---|
\`\`\`

Output is TRUE for exactly ONE scan when Trigger transitions from FALSE to TRUE. Used for counting edges, triggering single events.

## Troubleshooting Ladder Logic Online

When connected to a running PLC, you can monitor logic in real-time:

| Visual Indicator | Meaning |
|-----------------|---------|
| Green/highlighted rung | Rung is TRUE (power flowing) |
| Green contact | Contact condition is TRUE |
| Dim/unhighlighted | Rung or contact is FALSE |
| Output highlighted | Output is energized |

### Troubleshooting Process

1. Find the output that should be ON but isn't
2. Look at its rung — which contacts are FALSE (dim)?
3. The FALSE contact is preventing the output
4. Is that contact supposed to be FALSE? Check the physical input.
5. If the input should be TRUE but isn't → field wiring or device problem

## Interactive: PLC Logic Visualizer

Practice reading ladder logic with this interactive visualizer. Toggle inputs and watch power flow through the rungs:

<!-- INTERACTIVE: PLCLogicVisualizer -->

## Key Takeaways

- Series contacts = AND logic (all must be true)
- Parallel contacts = OR logic (any can be true)
- XIO (NC contact) = NOT logic (inverts the condition)
- Seal-in circuit = start/stop motor control (most common pattern)
- Online monitoring shows real-time logic state — follow the highlighted path
- The FALSE contact on a TRUE rung is always your starting point for troubleshooting
`
  },
  {
    slug: 'io-addressing',
    title: 'I/O Addressing & Wiring',
    orderIndex: 5,
    estimatedMinutes: 20,
    content: `# I/O Addressing & Wiring

## Connecting the Physical World to the PLC

I/O (Input/Output) modules are the bridge between field devices (switches, sensors, motors) and the PLC program. Understanding how physical terminals map to program addresses is essential for troubleshooting.

## I/O Module Types

### Digital (Discrete) Inputs

| Specification | Common Values |
|--------------|---------------|
| Voltage | 24V DC (most common), 120V AC, 5V DC |
| Current draw | 5-15mA per input |
| Response time | 1-10ms filter |
| Points per module | 8, 16, or 32 |
| Wiring | Sinking (NPN) or Sourcing (PNP) |

### Sinking vs. Sourcing

**Sourcing Input Module** (most common in North America):
- Module provides the positive (+) voltage
- Field device switches the negative (-) path
- PNP sensors connect directly

**Sinking Input Module:**
- Module provides the negative (-) return path
- Field device switches the positive (+) path
- NPN sensors connect directly

> **Rule of Thumb:** In North America, most systems use **sourcing I/O** with **PNP sensors**. In Europe/Asia, sinking I/O with NPN sensors is more common. Mixing them causes inputs that never turn ON or are always ON.

### Digital (Discrete) Outputs

| Type | Application | Load Rating |
|------|-------------|-------------|
| Relay | AC or DC loads, infrequent switching | 2A @ 240V AC |
| Transistor (DC) | Fast switching, DC loads | 0.5-2A @ 24V DC |
| Triac (AC) | Fast switching, AC loads | 1A @ 240V AC |

### Analog I/O

| Signal | Range | Resolution | Application |
|--------|-------|-----------|-------------|
| 4-20mA | 4.000-20.000 mA | 16-bit (0-32767) | Pressure, flow, level |
| 0-10V | 0.000-10.000 V | 16-bit | Speed reference, position |
| Thermocouple | Type J, K, T, E | 0.1°C | Temperature |
| RTD | Pt100, Pt1000 | 0.1°C | Precision temperature |

## I/O Addressing

### Allen-Bradley CompactLogix/ControlLogix

Addresses follow the pattern: **Local:Slot:Type.Member.Bit**

| Address | Meaning |
|---------|---------|
| Local:1:I.Data.0 | Slot 1, Input, Data word, Bit 0 |
| Local:1:I.Data.5 | Slot 1, Input, Data word, Bit 5 |
| Local:2:O.Data.0 | Slot 2, Output, Data word, Bit 0 |
| Local:3:I.Ch0Data | Slot 3, Analog Input, Channel 0 |

In tag-based programming, you typically create aliases:

| Physical Address | Alias Tag | Description |
|-----------------|-----------|-------------|
| Local:1:I.Data.0 | Start_PB | Start pushbutton |
| Local:1:I.Data.1 | Stop_PB | Stop pushbutton |
| Local:1:I.Data.2 | E_Stop | Emergency stop |
| Local:2:O.Data.0 | Motor_Contactor | Main motor contactor |
| Local:2:O.Data.1 | Run_Light | Motor running indicator |

### Older SLC-500 / MicroLogix

| Address | Meaning |
|---------|---------|
| I:1/0 | Input module slot 1, bit 0 |
| I:1/7 | Input module slot 1, bit 7 |
| O:2/0 | Output module slot 2, bit 0 |
| I:3.0 | Analog input slot 3, channel 0 (word) |

## Wiring Best Practices

### Input Wiring (24V DC Sourcing Module)

\`\`\`
+24V DC ──────┬──[Pushbutton NO]──── Input Terminal 0
              ├──[Limit Switch NC]── Input Terminal 1
              ├──[Prox Sensor PNP]── Input Terminal 2
              └──[Photoelectric]──── Input Terminal 3
              
Module COM ──── 0V DC (Common return)
\`\`\`

### Output Wiring (24V DC Transistor Module)

\`\`\`
+24V DC ──── Output Module V+ (power for loads)

Output 0 ────[Solenoid Valve]──── 0V DC
Output 1 ────[Indicator Light]──── 0V DC
Output 2 ────[Relay Coil]──── 0V DC

Module COM ──── 0V DC
\`\`\`

### Common Wiring Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| PNP sensor on sinking input | Input always ON or never ON | Match sensor type to module type |
| Missing common wire | No inputs work | Connect COM to 0V DC |
| Shared commons between modules | Erratic operation | Each module needs its own common |
| Output overloaded | Module fault, blown fuse | Check load current vs. module rating |
| Wire landed on wrong terminal | Wrong input activates | Verify against I/O drawing |

## Troubleshooting I/O

### Input Not Working

1. **Check the LED on the module** — is it lit when the device activates?
   - LED ON but program shows OFF → addressing error or module fault
   - LED OFF when device should be active → field wiring problem
2. **Measure voltage at the input terminal** — should see 24V DC when active
3. **Check the field device** — does it work? (bypass test with jumper wire)
4. **Check the common** — broken common = no inputs work on that group

### Output Not Working

1. **Check program** — is the output bit ON in the program?
   - Bit ON but LED OFF → module fault or blown fuse
   - Bit OFF → trace the logic to find why
2. **Check the module fuse** — many output modules have per-group fuses
3. **Measure voltage at output terminal** — should see 24V when energized
4. **Check the load** — disconnect and measure load resistance

## Interactive: Relay Simulator

Practice understanding how relay contacts (NO/NC) map to PLC I/O states:

<!-- INTERACTIVE: RelaySimulator -->

## Key Takeaways

- I/O addresses map physical terminals to program bits — know your addressing scheme
- Sinking/sourcing mismatch is the #1 cause of "new sensor doesn't work"
- Always check the module LED first — it tells you if the problem is field-side or program-side
- Analog signals (4-20mA) scale to integer values in the PLC — know the scaling formula
- Alias tags make programs readable — always use descriptive names
`
  },
  {
    slug: 'timers-counters-plc',
    title: 'Timers & Counters in PLC Programs',
    orderIndex: 6,
    estimatedMinutes: 20,
    content: `# Timers & Counters in PLC Programs

## Time and Counting: Essential Control Functions

Almost every automated process involves timing (how long something runs) or counting (how many parts have passed). PLCs provide built-in timer and counter instructions that replace the old pneumatic timers and mechanical counters.

## Timer Types

### TON — Timer On-Delay (Most Common)

**Behavior:** Output turns ON after input has been TRUE for the preset time. Resets immediately when input goes FALSE.

| Parameter | Description |
|-----------|-------------|
| Enable (rung condition) | Input that starts timing |
| Preset (PRE) | Target time in milliseconds |
| Accumulator (ACC) | Current elapsed time |
| Timer Timing (TT) | TRUE while timing (ACC < PRE) |
| Done (DN) | TRUE when ACC ≥ PRE |

**Application:** Delay before starting a process, debouncing a sensor, alarm delay

\`\`\`
|---[Sensor_Blocked]---[TON Jam_Timer, PRE=5000]---|
|                                                   |
|---[Jam_Timer.DN]---(Jam_Alarm)---|
\`\`\`

If sensor stays blocked for 5 seconds → alarm activates. If sensor clears before 5 seconds → timer resets, no alarm.

### TOF — Timer Off-Delay

**Behavior:** Output turns ON immediately when input is TRUE. Output stays ON for preset time AFTER input goes FALSE.

**Application:** Cooling fan run-on after motor stops, light stays on after motion detected

\`\`\`
|---[Motor_Running]---[TOF Fan_Timer, PRE=30000]---|
|                                                   |
|---[Fan_Timer.DN]---(Cooling_Fan)---|
\`\`\`

Fan runs while motor runs, plus 30 seconds after motor stops.

### RTO — Retentive Timer On-Delay

**Behavior:** Like TON but does NOT reset when input goes FALSE. Accumulator retains its value. Requires a separate RES (reset) instruction.

**Application:** Total run-time tracking, maintenance hour counters

\`\`\`
|---[Motor_Running]---[RTO Runtime_Timer, PRE=360000000]---|
|                                                          |
|---[Runtime_Timer.DN]---(Maintenance_Due)---|
|                                                          |
|---[Maintenance_Done]---[RES Runtime_Timer]---|
\`\`\`

Tracks total motor run time. After 100 hours (360,000,000 ms), flags maintenance due.

## Counter Types

### CTU — Count Up

**Behavior:** Increments accumulator by 1 on each FALSE-to-TRUE transition of the input.

| Parameter | Description |
|-----------|-------------|
| Count input | Rising edge triggers count |
| Preset (PRE) | Target count |
| Accumulator (ACC) | Current count |
| Done (DN) | TRUE when ACC ≥ PRE |
| Overflow (OV) | TRUE if ACC exceeds max value |

\`\`\`
|---[Part_Sensor]---[CTU Batch_Counter, PRE=24]---|
|                                                  |
|---[Batch_Counter.DN]---(Case_Full)---|
|                                                  |
|---[New_Case_Started]---[RES Batch_Counter]---|
\`\`\`

Counts 24 parts into a case, signals case full, resets for next case.

### CTD — Count Down

**Behavior:** Decrements accumulator on each rising edge. DN bit is TRUE when ACC ≤ 0.

**Application:** Remaining inventory, countdown sequences

### CTUD — Count Up/Down (Combined)

Has separate count-up and count-down inputs. Useful for tracking items in a buffer or queue.

## Practical Timer/Counter Applications

### Debounce Filter

Mechanical contacts bounce when they close, creating false triggers:

\`\`\`
|---[Raw_Input]---[TON Debounce, PRE=50]---|
|                                           |
|---[Debounce.DN]---(Clean_Input)---|
\`\`\`

50ms delay filters out contact bounce. Only stable signals pass through.

### Sequence Timer (Step Sequencer)

\`\`\`
|---[Start]---+---[/Step2_Timer.DN]---(Step1_Output)---|
|             |
|---[Step1_Timer.DN]---[/Step3_Timer.DN]---(Step2_Output)---|
|             |
|---[Step2_Timer.DN]---(Step3_Output)---|

|---[Step1_Output]---[TON Step1_Timer, PRE=3000]---|
|---[Step2_Output]---[TON Step2_Timer, PRE=5000]---|
|---[Step3_Output]---[TON Step3_Timer, PRE=2000]---|
\`\`\`

Step 1 runs for 3 seconds, then Step 2 for 5 seconds, then Step 3 for 2 seconds.

### Production Counter with Shift Reset

\`\`\`
|---[Part_Detected]---[CTU Shift_Counter, PRE=99999]---|
|                                                       |
|---[Shift_Change]---[MOV Shift_Counter.ACC → Shift_Total]---|
|                    [RES Shift_Counter]---|
\`\`\`

Counts parts all shift, saves total at shift change, resets for new shift.

## Troubleshooting Timers & Counters

| Problem | Likely Cause | Check |
|---------|-------------|-------|
| Timer never reaches DN | Input not staying TRUE long enough | Monitor ACC — does it keep resetting? |
| Timer stuck at 0 | Rung condition never TRUE | Check upstream contacts |
| Counter counts too fast | Sensor bouncing or noisy | Add debounce filter (50-100ms TON) |
| Counter misses parts | Scan time too slow for part speed | Use high-speed counter input |
| Timer preset wrong | Wrong time base (ms vs. seconds) | Verify: 5000ms = 5 seconds |

## Interactive: PLC Logic with Timers

See how timers interact with logic in a running PLC program:

<!-- INTERACTIVE: PLCLogicVisualizer -->

## Key Takeaways

- TON (on-delay) is the most common timer — output delayed after input
- TOF (off-delay) keeps output on after input drops — used for run-on applications
- RTO (retentive) accumulates time across multiple enable cycles — used for maintenance tracking
- Counters trigger on rising edges — one count per FALSE→TRUE transition
- Debounce timers (50-100ms TON) prevent false counts from contact bounce
- Always check the time base: most PLCs use milliseconds, not seconds
`
  },
];

// ============================================================
// SEMICONDUCTOR FUNDAMENTALS - 6 Lessons
// ============================================================
const semiconductorLessons = [
  {
    slug: 'diode-fundamentals',
    title: 'Diodes: Rectification & Protection',
    orderIndex: 1,
    estimatedMinutes: 20,
    content: `# Diodes: Rectification & Protection

## The One-Way Valve of Electronics

A diode is the simplest semiconductor device — it allows current to flow in one direction only. In industrial applications, diodes are everywhere: power supplies, VFD rectifier bridges, flyback protection, and signal conditioning.

## How a Diode Works

A diode is made from two types of semiconductor material joined together:
- **P-type** (positive): Has "holes" (missing electrons) that act as positive charge carriers
- **N-type** (negative): Has excess free electrons

The junction between them creates a **depletion zone** — a barrier that must be overcome for current to flow.

### Forward Bias (Current Flows)

When positive voltage is applied to the anode (P-side) and negative to the cathode (N-side):
- Voltage must exceed the **forward voltage drop** (V_f)
- Silicon diode: V_f ≈ 0.6-0.7V
- Once conducting, the diode acts like a closed switch with a small voltage drop

### Reverse Bias (Current Blocked)

When voltage is reversed (positive to cathode):
- The depletion zone widens
- Only tiny leakage current flows (microamps)
- The diode acts like an open switch

### Breakdown

If reverse voltage exceeds the **Peak Inverse Voltage (PIV)** rating:
- The diode breaks down and conducts in reverse
- This is destructive for standard diodes
- Zener diodes are designed to operate in controlled breakdown

## Diode Types in Industrial Applications

| Type | Symbol | Application | Key Spec |
|------|--------|-------------|----------|
| Standard rectifier | → | Power supply rectification | PIV, I_max |
| Fast recovery | →(fast) | VFD rectifier bridge | Recovery time <200ns |
| Schottky | →(S) | Low-voltage, high-speed | V_f = 0.2-0.4V |
| Zener | →(Z) | Voltage regulation/clamping | V_z (breakdown voltage) |
| LED | →(light) | Indicators, PLC I/O status | V_f = 1.8-3.3V |
| TVS (Transient) | ←→ | Surge protection | Clamping voltage |

## Rectification: AC to DC Conversion

### Half-Wave Rectifier (1 diode)
- Only passes positive half of AC waveform
- Output: pulsating DC at 60 Hz
- Inefficient — wastes half the power
- Used in: simple chargers, low-power supplies

### Full-Wave Bridge Rectifier (4 diodes)
- Passes BOTH halves of AC waveform (flips negative half)
- Output: pulsating DC at 120 Hz
- Much smoother, more efficient
- **Used in: Every VFD input stage, every industrial power supply**

### VFD Rectifier Bridge

The input stage of every VFD is a 6-diode (3-phase) bridge rectifier:

| Input | Output | Calculation |
|-------|--------|-------------|
| 208V AC 3-phase | ~294V DC | 208 × 1.414 = 294V |
| 480V AC 3-phase | ~679V DC | 480 × 1.414 = 679V |
| 600V AC 3-phase | ~849V DC | 600 × 1.414 = 849V |

> **This is why VFD DC bus voltage is so high.** The rectifier charges the DC bus capacitors to the PEAK value of the AC input, which is 1.414× the RMS voltage.

## Flyback (Freewheeling) Diodes

When a relay coil or solenoid is de-energized, the collapsing magnetic field generates a voltage spike (back-EMF) that can be hundreds of volts. A flyback diode across the coil absorbs this spike.

### Where You'll Find Them

- Across every relay coil driven by a PLC transistor output
- Across solenoid valves
- Across contactor coils (when DC-driven)
- Built into many PLC output modules

### What Happens Without Them

- PLC transistor outputs get destroyed by voltage spikes
- Relay driver transistors fail
- Electrical noise causes erratic PLC behavior
- Contact arcing is severe

## Testing Diodes with a Multimeter

### Diode Test Mode (Best Method)

| Measurement | Good Diode | Shorted | Open |
|-------------|-----------|---------|------|
| Forward (+ to anode) | 0.5-0.7V | 0.000V | OL |
| Reverse (+ to cathode) | OL | 0.000V | OL |

### Resistance Mode (Quick Check)

| Measurement | Good Diode | Shorted | Open |
|-------------|-----------|---------|------|
| Forward | Low (100-1000Ω) | 0Ω | OL |
| Reverse | OL (infinite) | 0Ω | OL |

## Key Takeaways

- Diodes allow current in one direction only — the "check valve" of electronics
- Forward voltage drop is ~0.7V for silicon (important for voltage calculations)
- VFD rectifier bridges convert 480V AC to ~679V DC (peak value)
- Flyback diodes protect transistor outputs from inductive voltage spikes
- Test with diode mode: 0.5-0.7V forward, OL reverse = good diode
`
  },
  {
    slug: 'transistors-switching',
    title: 'Transistors: Switching & Amplification',
    orderIndex: 2,
    estimatedMinutes: 22,
    content: `# Transistors: Switching & Amplification

## The Electronic Switch

A transistor is a semiconductor device that can act as an electronically controlled switch or an amplifier. In industrial applications, transistors are the building blocks of PLC output modules, sensor circuits, and power electronics.

## Transistor Types

### Bipolar Junction Transistor (BJT)

| Type | Current Flow | Symbol | Common Use |
|------|-------------|--------|-----------|
| NPN | Collector → Emitter (conventional) | Arrow out | PLC sinking outputs, relay drivers |
| PNP | Emitter → Collector (conventional) | Arrow in | PLC sourcing outputs, sensor outputs |

### How a BJT Works (Simplified)

Think of it as a **current-controlled switch:**
- A small current into the Base (control) allows a large current to flow from Collector to Emitter (load)
- No base current = switch OFF (no load current)
- Base current applied = switch ON (load current flows)

**Gain (hFE or β):** The ratio of load current to control current. Typical β = 50-300.
- If β = 100 and base current = 1mA, collector current can be up to 100mA

### NPN Transistor as a Switch (PLC Output)

\`\`\`
+24V ──── [Load (relay coil)] ──── Collector
                                      |
                                   [NPN Transistor]
                                      |
PLC Logic Signal ──── Base           Emitter ──── 0V (GND)
\`\`\`

When PLC output goes HIGH → base current flows → transistor turns ON → load energizes.

### PNP vs. NPN Sensors

| Sensor Type | Output Behavior | Connects To |
|-------------|----------------|-------------|
| PNP (sourcing) | Switches +V to load | Sourcing input module |
| NPN (sinking) | Switches 0V to load | Sinking input module |

> **Mnematch Rule:** PNP sensors work with sinking inputs. NPN sensors work with sourcing inputs. If your new sensor "doesn't work," check this first.

## Field Effect Transistors (FET/MOSFET)

### MOSFET vs. BJT

| Property | BJT | MOSFET |
|----------|-----|--------|
| Control | Current-driven (base) | Voltage-driven (gate) |
| Input impedance | Low (draws current) | Very high (almost no current) |
| Switching speed | Moderate | Very fast |
| On-resistance | V_CE(sat) ≈ 0.2-0.7V | R_DS(on) = milliohms |
| Power handling | Moderate | High (when properly driven) |
| Industrial use | Relay drivers, sensors | VFD gate drivers, power supplies |

### MOSFET as a Switch

\`\`\`
+V ──── [Load] ──── Drain
                       |
                    [MOSFET]
                       |
Gate Driver ──── Gate  Source ──── 0V
\`\`\`

Apply voltage to Gate → channel opens → current flows Drain to Source.
Remove gate voltage → channel closes → no current flows.

## Transistor Failures in Industrial Settings

### Common Failure Modes

| Failure | Cause | Symptom |
|---------|-------|---------|
| Short (C-E) | Overcurrent, voltage spike | Output always ON, fuse blows |
| Open (C-E) | Thermal stress, aging | Output never turns ON |
| Leakage | Heat damage, contamination | Output partially ON, erratic |
| Gate damage (MOSFET) | Static discharge, overvoltage | Unpredictable switching |

### Testing Transistors

**BJT with Diode Test Mode:**

| Test | NPN Good | PNP Good |
|------|----------|----------|
| B→E (base to emitter) | 0.5-0.7V | OL |
| E→B (emitter to base) | OL | 0.5-0.7V |
| B→C (base to collector) | 0.5-0.7V | OL |
| C→B (collector to base) | OL | 0.5-0.7V |
| C→E | OL | OL |
| E→C | OL | OL |

If C→E reads low or 0V in both directions → transistor is shorted.

## Darlington Pairs

Two transistors connected so the first drives the second. Total gain = β₁ × β₂ (thousands).

**Used in:** PLC output modules (ULN2003/ULN2803 Darlington arrays), high-gain relay drivers.

**Trade-off:** Higher voltage drop (1.2-1.4V) across the pair, slower switching.

## Key Takeaways

- Transistors are electronic switches — small control signal switches large load current
- NPN = sinking (load between +V and collector), PNP = sourcing (load between emitter and 0V)
- PNP sensors → sinking inputs, NPN sensors → sourcing inputs (common mismatch issue)
- MOSFETs are voltage-controlled, faster, and used in power electronics (VFD gate drivers)
- Test BJTs with diode mode: two junctions should read 0.5-0.7V in one direction, OL in reverse
`
  },
  {
    slug: 'igbt-power-electronics',
    title: 'IGBTs & Power Electronics',
    orderIndex: 3,
    estimatedMinutes: 22,
    content: `# IGBTs & Power Electronics

## The Heart of Every VFD

The Insulated Gate Bipolar Transistor (IGBT) is the power switching device that makes modern Variable Frequency Drives possible. Every VFD you'll encounter in a plant uses IGBTs to convert DC bus voltage into a variable-frequency AC output for the motor.

## What Is an IGBT?

An IGBT combines the best features of two transistor types:
- **MOSFET gate** (voltage-controlled, high input impedance, fast switching)
- **BJT output** (low on-state voltage drop, high current capability)

| Property | MOSFET | BJT | IGBT |
|----------|--------|-----|------|
| Control | Voltage (easy) | Current (complex) | Voltage (easy) |
| On-state loss | High at high voltage | Low | Low |
| Switching speed | Very fast | Slow | Fast (but slower than MOSFET) |
| Voltage rating | Limited at high V | Good | Excellent (1200V+) |
| Current rating | Good | Good | Excellent |
| **Best for** | Low voltage, high freq | — | **High voltage, high current** |

## IGBTs in a VFD

### The Inverter Section

A 3-phase VFD inverter uses **6 IGBTs** arranged in 3 half-bridge pairs:

\`\`\`
DC Bus (+) ────┬────────┬────────┬────
               |        |        |
             [IGBT1]  [IGBT3]  [IGBT5]   ← Upper IGBTs
               |        |        |
               ├─ U ────├─ V ────├─ W ──── Motor
               |        |        |
             [IGBT2]  [IGBT4]  [IGBT6]   ← Lower IGBTs
               |        |        |
DC Bus (-) ────┴────────┴────────┴────
\`\`\`

Each IGBT pair switches the motor terminal between DC+ and DC-. By controlling the switching pattern (PWM), the VFD creates a simulated AC waveform at any desired frequency.

### Pulse Width Modulation (PWM)

The IGBTs switch ON and OFF thousands of times per second (carrier frequency = 2-16 kHz):
- Wider ON pulses = higher average voltage
- Pattern of pulses approximates a sine wave
- Motor "sees" the average — responds as if receiving true AC

| Carrier Frequency | Switching Speed | Audible Noise | IGBT Heating |
|-------------------|----------------|---------------|-------------|
| 2 kHz | Slow | Loud motor whine | Low |
| 4 kHz (default) | Moderate | Moderate | Moderate |
| 8 kHz | Fast | Quiet | High |
| 16 kHz | Very fast | Silent | Very high (derate!) |

> **Trade-off:** Higher carrier frequency = quieter motor but hotter IGBTs. Most VFDs default to 4 kHz. Going above 8 kHz typically requires derating the drive's output current.

## IGBT Failure Modes

### Common Failures

| Failure Mode | Cause | Symptom |
|-------------|-------|---------|
| Short circuit (C-E) | Overcurrent, shoot-through | Ground fault trip, blown fuses |
| Open circuit | Thermal fatigue, bond wire lift | Phase loss, motor won't run |
| Gate damage | Voltage spike, driver failure | Erratic operation, one phase weak |
| Thermal failure | Blocked cooling, overload | Drive trips on overtemperature |

### What Kills IGBTs

1. **Shoot-through:** Both upper and lower IGBTs in same leg ON simultaneously → dead short across DC bus → catastrophic failure in microseconds
2. **Overcurrent:** Motor short circuit, ground fault → exceeds IGBT safe operating area
3. **Overvoltage:** Regenerative braking without braking resistor → DC bus overvoltage → IGBT avalanche
4. **Overtemperature:** Blocked fan, high ambient, excessive carrier frequency → thermal runaway
5. **dV/dt stress:** Fast switching creates voltage spikes on motor cables (especially long runs)

## Testing IGBTs

### With a Multimeter (Diode Test Mode)

Each IGBT has a built-in freewheeling diode. Test procedure:

| Test | Expected (Good) | Failed |
|------|----------------|--------|
| + to Collector, - to Emitter | OL | 0V (shorted) |
| + to Emitter, - to Collector | 0.3-0.6V (diode) | OL (open) or 0V (shorted) |
| + to Gate, - to Emitter | OL or charges (meter may beep briefly) | 0V (gate shorted) |
| + to Emitter, - to Gate | OL | 0V (gate shorted) |

> **Important:** After testing Gate-Emitter, the gate may remain charged. Short Gate to Emitter before testing Collector-Emitter to discharge the gate capacitance.

### Module Testing (6-pack IGBT Module)

Most modern VFDs use a single IGBT module containing all 6 transistors and 6 diodes. Test each of the 6 IGBT/diode pairs individually:

1. Identify terminals: DC+, DC-, U, V, W (motor phases)
2. Test each upper IGBT: DC+ to U, DC+ to V, DC+ to W
3. Test each lower IGBT: U to DC-, V to DC-, W to DC-
4. Compare readings — all 6 should be similar

## Gate Drivers

IGBTs require a dedicated gate driver circuit that:
- Provides +15V to turn ON, -5V to -8V to turn OFF (ensures fast, reliable switching)
- Includes dead-time (both IGBTs OFF briefly) to prevent shoot-through
- Has desaturation detection (detects short circuit in <10µs and shuts down)
- Provides galvanic isolation between control and power circuits

### Gate Driver Failure Symptoms

| Symptom | Possible Cause |
|---------|---------------|
| One motor phase missing | Gate driver for that leg failed |
| Drive trips immediately on run | Desaturation fault (IGBT or driver) |
| Erratic motor operation | Intermittent gate drive signal |
| Drive won't power up | Gate driver power supply failed |

## Key Takeaways

- IGBTs are the power switches in every modern VFD — 6 per 3-phase drive
- PWM switching at 2-16 kHz creates variable-frequency AC from DC bus voltage
- Higher carrier frequency = quieter but hotter — most drives default to 4 kHz
- Test IGBTs with diode mode: check the built-in freewheeling diode in each device
- The #1 IGBT killer is shoot-through (both in same leg ON) — gate drivers prevent this
- Always discharge DC bus capacitors before testing IGBTs
`
  },
  {
    slug: 'thyristors-scrs',
    title: 'Thyristors & SCRs: Phase Control',
    orderIndex: 4,
    estimatedMinutes: 18,
    content: `# Thyristors & SCRs: Phase Control

## The Original Power Electronics

Before IGBTs dominated VFD design, Silicon Controlled Rectifiers (SCRs) were the primary power switching device. SCRs are still widely used in DC drives, soft starters, power regulators, and phase-controlled rectifiers.

## How an SCR Works

An SCR is a 4-layer semiconductor (PNPN) with three terminals:
- **Anode (A):** Positive power terminal
- **Cathode (K):** Negative power terminal  
- **Gate (G):** Control terminal (trigger)

### Operating Principle

1. **OFF state:** No current flows from Anode to Cathode (like an open switch)
2. **Triggering:** Apply a small pulse to the Gate while Anode is positive
3. **ON state:** SCR latches ON — current flows freely (like a closed switch)
4. **Turn-off:** Current must drop below "holding current" (naturally happens at AC zero-crossing)

> **Key Difference from Transistors:** Once an SCR turns ON, it STAYS on even after the gate signal is removed. It can only turn off when current drops to zero. This is why SCRs work naturally with AC (which crosses zero 120 times/second) but require special commutation circuits for DC.

## SCR Applications in Industry

### 1. DC Motor Drives (SCR Drives)

Older DC motor speed controllers use SCRs to create variable DC voltage from AC input:

| Drive Type | SCRs Used | Application |
|-----------|-----------|-------------|
| Half-controlled | 3 SCRs + 3 diodes | Single-quadrant (forward only) |
| Full-controlled | 6 SCRs | Two-quadrant (forward + regen braking) |
| Reversing | 12 SCRs | Four-quadrant (forward/reverse + regen) |

### Phase Angle Control

By delaying the gate trigger pulse, the SCR conducts for only part of each AC half-cycle:

| Firing Angle | Conduction | Output Voltage |
|-------------|-----------|---------------|
| 0° (fire immediately) | Full half-cycle | Maximum (~100%) |
| 45° | 3/4 of half-cycle | ~85% |
| 90° | Half of half-cycle | ~50% |
| 135° | 1/4 of half-cycle | ~15% |
| 180° (never fire) | None | 0% |

### 2. Soft Starters

Soft starters use 6 SCRs (2 per phase, anti-parallel) to gradually increase voltage to an AC motor during starting:

- **Start:** Firing angle begins at ~150° (low voltage) and ramps to 0° (full voltage)
- **Run:** SCRs fully conducting — bypassed by contactor for efficiency
- **Stop:** Firing angle ramps from 0° back to 150° (soft stop)

| Parameter | Typical Range |
|-----------|--------------|
| Ramp-up time | 2-30 seconds |
| Starting current | 2-4× FLA (vs. 6-8× across-the-line) |
| Starting torque | Reduced (not suitable for high-inertia loads) |

### 3. Power Regulators (Heaters, Furnaces)

SCR power controllers regulate power to resistance heaters:
- Phase-angle control: smooth but creates harmonics
- Zero-cross firing: switches full cycles ON/OFF — cleaner power quality

## Troubleshooting SCR Circuits

### Common SCR Failures

| Failure | Cause | Symptom |
|---------|-------|---------|
| Shorted (A-K) | Overcurrent, voltage spike | Full voltage to load, no control |
| Open (A-K) | Thermal stress | No output on that phase |
| Gate open | Wire break, driver failure | SCR won't fire, no output |
| Won't turn off | Excessive dI/dt, snubber failure | Output stays on after command off |

### Testing SCRs with a Multimeter

| Test | Good SCR | Shorted | Open |
|------|----------|---------|------|
| A→K (forward, no gate) | OL | Low/0V | OL |
| K→A (reverse) | OL | Low/0V | OL |
| G→K (gate-cathode) | 0.5-0.8V | 0V | OL |
| K→G (reverse gate) | OL or high | 0V | OL |

**Dynamic test:** With meter on A→K (diode mode), briefly short Gate to Anode. SCR should latch ON (reading drops to 0.5-1V). It stays on until you remove the meter leads (current drops below holding current).

### SCR Drive Troubleshooting

| Symptom | Check |
|---------|-------|
| Motor won't run | Gate firing pulses present? SCRs conducting? |
| Motor runs rough/vibrates | One SCR not firing → missing half-cycles |
| No speed control | Firing angle not changing → speed pot or controller |
| Overcurrent trip | SCR shorted → full voltage to motor |
| Motor runs at full speed | SCR shorted or bypass contactor stuck closed |

## SCRs vs. IGBTs: When Each Is Used

| Application | SCR | IGBT |
|-------------|-----|------|
| DC motor drives | ✓ (traditional) | ✓ (modern PWM DC drives) |
| AC motor VFDs | ✗ (too slow) | ✓ (standard) |
| Soft starters | ✓ (standard) | ✗ (overkill) |
| Power regulators | ✓ (standard) | ✗ |
| UPS systems | ✓ (input rectifier) | ✓ (inverter output) |
| Welders | ✓ (phase control) | ✓ (inverter welders) |

## Key Takeaways

- SCRs latch ON when triggered and stay on until current reaches zero
- Phase angle control adjusts output by delaying the gate trigger pulse
- Soft starters use SCRs to ramp motor voltage gradually during start
- SCR drives are still common on older DC motors — don't assume everything is a VFD
- Test SCRs with diode mode: should block in both directions until gate is triggered
- A shorted SCR means full uncontrolled voltage to the load — dangerous condition
`
  },
  {
    slug: 'power-supply-circuits',
    title: 'Industrial Power Supply Circuits',
    orderIndex: 5,
    estimatedMinutes: 20,
    content: `# Industrial Power Supply Circuits

## Every Control System Needs Clean DC Power

Every PLC, sensor, HMI, and control device in a plant requires a regulated DC power supply. Understanding how these supplies work helps you troubleshoot the most common cause of "random" control system failures: power quality issues.

## Linear vs. Switching Power Supplies

### Linear Power Supply (Older, Simple)

\`\`\`
AC Input → Transformer → Rectifier → Filter Cap → Voltage Regulator → DC Output
\`\`\`

| Characteristic | Value |
|---------------|-------|
| Efficiency | 30-50% (rest is heat) |
| Noise output | Very low (clean DC) |
| Size/weight | Large and heavy |
| Cost | Low for small supplies |
| Regulation | Good (±1-3%) |
| Still used for | Sensitive analog circuits, audio |

### Switching Power Supply (Modern, Standard)

\`\`\`
AC Input → Rectifier → High-Freq Switching → Transformer → Rectifier → Filter → DC Output
                              ↑
                    PWM Controller (feedback loop)
\`\`\`

| Characteristic | Value |
|---------------|-------|
| Efficiency | 85-95% |
| Noise output | Higher (switching noise) |
| Size/weight | Compact and light |
| Cost | Moderate |
| Regulation | Excellent (±0.5-1%) |
| Used for | PLC power, 24V DC systems, everything modern |

## The 24V DC Control Power System

### Typical Industrial 24V DC Distribution

\`\`\`
480V AC → Control Transformer (480:120V) → 24V DC Power Supply → Distribution
                                                    |
                                              ┌─────┼─────┐
                                              ↓     ↓     ↓
                                            PLC   I/O   Sensors
                                           Rack  Modules  & Field
                                                         Devices
\`\`\`

### Sizing a 24V DC Supply

| Load Type | Typical Current | Example |
|-----------|----------------|---------|
| PLC CPU | 0.5-2A | CompactLogix 5380 |
| Digital input module (16pt) | 0.1-0.3A | Per module |
| Digital output module (16pt) | 0.5-2A | Depends on loads |
| Proximity sensor | 0.01-0.05A | Each sensor |
| Solenoid valve | 0.1-0.5A | Each valve |
| HMI panel | 0.5-2A | PanelView Plus |
| Safety relay | 0.1-0.3A | GuardLogix |

**Rule of Thumb:** Add up all loads, then add 20-30% margin. A 10A supply for a typical small control panel is common.

### Redundancy and Protection

| Feature | Purpose |
|---------|---------|
| Redundant supplies | Two supplies in parallel with diode ORing |
| Electronic breakers | Per-circuit current limiting (replaces fuses) |
| UPS / battery backup | Ride-through during power dips |
| Surge protection | MOVs and TVS diodes on input |
| Output fusing | Individual fuses per branch circuit |

## Troubleshooting Power Supplies

### Symptoms of Power Supply Problems

| Symptom | Possible Cause |
|---------|---------------|
| PLC faults randomly | Voltage sag under load, loose connection |
| Sensors read erratically | Noise on 24V DC bus, ground loop |
| All outputs dead | 24V supply failed or main fuse blown |
| Some outputs work, some don't | Branch fuse blown, electronic breaker tripped |
| HMI reboots randomly | Voltage dip during high-current switching |

### Measurement Checklist

| Measurement | Expected | Problem If |
|-------------|----------|-----------|
| Output voltage (no load) | 24.0-24.5V DC | <23V or >26V |
| Output voltage (full load) | 23.5-24.0V DC | <22V (supply undersized or failing) |
| Ripple (AC on DC output) | <200mV p-p | >500mV (filter caps failing) |
| Input voltage | 120V AC ±10% | <108V or >132V |
| Ground to DC- | <1V DC | >5V = ground fault somewhere |

### The #1 Power Supply Killer: Inrush Current

When a power supply first energizes, the input filter capacitors draw a massive inrush current (10-50× normal). This is why:
- Breakers trip on power-up but not during normal operation
- Power supplies have "soft start" circuits to limit inrush
- Multiple supplies should be staggered (not all starting simultaneously)

## Capacitor Aging: The Silent Failure

Electrolytic capacitors in power supplies have a limited lifespan:

| Factor | Effect on Life |
|--------|---------------|
| Temperature +10°C | Life halved |
| Ripple current exceeded | Heating → life reduced |
| Voltage stress | Dielectric degradation |
| Age (calendar) | Electrolyte dries out |

**Typical life:** 5-10 years in industrial environment (40-50°C ambient)

**Symptoms of failing caps:**
- Output voltage drops under load
- Increased ripple on output
- Supply runs hotter than normal
- Visible bulging on capacitor tops
- Brown/crusty electrolyte leakage

## Key Takeaways

- Switching supplies are standard in modern industrial panels (85-95% efficient)
- 24V DC is the universal control voltage — size supplies with 20-30% margin
- Voltage sags under load cause "random" PLC faults — measure under load, not no-load
- Capacitor aging is the #1 failure mode — plan replacement at 7-10 years
- Always check ripple voltage (AC component on DC output) when troubleshooting erratic behavior
- Inrush current on power-up can trip breakers — stagger supply startups
`
  },
  {
    slug: 'vfd-power-stage',
    title: 'VFD Power Stage: From Input to Output',
    orderIndex: 6,
    estimatedMinutes: 25,
    content: `# VFD Power Stage: From Input to Output

## The Complete VFD Power Path

A Variable Frequency Drive converts fixed-frequency AC power into variable-frequency, variable-voltage AC power for motor speed control. Understanding each stage of the power path is essential for diagnosing VFD faults.

## The Three Stages

\`\`\`
AC Input → [RECTIFIER] → DC Bus → [DC BUS + CAPS] → [INVERTER] → AC Output → Motor
 480V AC     (Diodes)     679V DC    (Energy Storage)    (IGBTs)    0-480V AC
 60 Hz                                                              0-60+ Hz
\`\`\`

## Stage 1: Rectifier (AC → DC)

### 6-Pulse Diode Bridge

Six diodes arranged in a 3-phase bridge convert AC to DC:

| Input | DC Bus Voltage | Ripple Frequency |
|-------|---------------|-----------------|
| 208V 3Ø | ~294V DC | 360 Hz |
| 480V 3Ø | ~679V DC | 360 Hz |
| 600V 3Ø | ~849V DC | 360 Hz |

**Formula:** V_DC = V_AC × 1.414 (√2) for unloaded bus

Under load, the DC bus voltage drops slightly (typically 5-10%) due to:
- Diode forward voltage drops (6 × 0.7V = 4.2V)
- Source impedance
- Capacitor ESR

### Rectifier Faults

| Fault | Cause | Symptom |
|-------|-------|---------|
| Open diode | Overcurrent, thermal | DC bus voltage low, increased ripple |
| Shorted diode | Voltage spike, aging | Input fuse blows, ground fault |
| All diodes OK but low bus | Input voltage low, phase loss | Undervoltage fault |

## Stage 2: DC Bus (Energy Storage)

### DC Bus Capacitors

Large electrolytic capacitors smooth the rectified DC and provide energy storage:

| Function | Why It Matters |
|----------|---------------|
| Smooth ripple | Provides clean DC for the inverter |
| Energy buffer | Supplies current during motor acceleration |
| Absorb regen | Captures energy when motor decelerates |
| Ride-through | Maintains operation during brief power dips |

### DC Bus Voltage Monitoring

The VFD continuously monitors DC bus voltage:

| Condition | Bus Voltage (480V system) | VFD Response |
|-----------|--------------------------|-------------|
| Normal operation | 650-680V | Normal |
| Light load / regen | 680-750V | Normal (slight rise) |
| Heavy regen braking | 750-800V | Overvoltage warning |
| Overvoltage trip | >800V | Fault — stops drive |
| Power dip | 500-600V | Undervoltage warning |
| Undervoltage trip | <450V | Fault — stops drive |
| Power loss | Decaying from 680V | Coast stop or controlled decel |

### Braking Resistor

When a motor decelerates faster than friction alone allows, it becomes a generator — pumping energy back into the DC bus. Without a braking resistor:
- DC bus voltage rises rapidly
- Drive trips on overvoltage

The braking resistor dissipates regenerated energy as heat:
\`\`\`
DC Bus (+) ──── [Brake IGBT] ──── [Brake Resistor] ──── DC Bus (-)
\`\`\`

## Stage 3: Inverter (DC → Variable AC)

### 6 IGBTs Create 3-Phase AC

The inverter section uses 6 IGBTs to "chop" the DC bus into a PWM pattern that the motor interprets as AC:

| Parameter | Controlled By |
|-----------|--------------|
| Output frequency | PWM switching pattern timing |
| Output voltage | PWM pulse width (duty cycle) |
| V/Hz ratio | Maintained automatically (constant flux) |

### V/Hz Control (Volts per Hertz)

To maintain constant motor torque, voltage must be proportional to frequency:

| Frequency | Voltage (480V motor) | Ratio |
|-----------|---------------------|-------|
| 60 Hz | 480V | 8 V/Hz |
| 30 Hz | 240V | 8 V/Hz |
| 15 Hz | 120V | 8 V/Hz |
| 5 Hz | 40V + boost | Boosted for starting torque |

Below ~5 Hz, extra voltage "boost" is needed to overcome stator resistance and maintain torque.

## Common VFD Faults by Stage

### Input/Rectifier Stage

| Fault Code | Meaning | Common Cause |
|-----------|---------|-------------|
| Phase Loss | Input phase missing | Blown fuse, loose connection, utility issue |
| Undervoltage | DC bus too low | Voltage sag, capacitor degradation |
| Ground Fault | Current leaking to ground | Cable damage, motor insulation failure |

### DC Bus Stage

| Fault Code | Meaning | Common Cause |
|-----------|---------|-------------|
| Overvoltage | DC bus too high | Decel too fast, no brake resistor |
| Bus Undervoltage | Capacitors can't hold voltage | Aged capacitors, power quality |
| Precharge Fault | Precharge circuit failed | Precharge resistor open, relay stuck |

### Inverter/Output Stage

| Fault Code | Meaning | Common Cause |
|-----------|---------|-------------|
| Overcurrent | Output current exceeded limit | Motor short, ground fault, mechanical jam |
| IGBT Fault | Desaturation detected | IGBT failing, gate driver issue |
| Output Phase Loss | Motor phase missing | Cable break, motor winding open |
| Overtemperature | Heatsink too hot | Fan failed, blocked airflow, ambient too high |

## Measurement Points for VFD Troubleshooting

| Test Point | Expected Value | Tool |
|-----------|---------------|------|
| Input L1-L2, L2-L3, L1-L3 | 480V ±10% (balanced) | True-RMS voltmeter |
| DC bus (+ to -) | 650-680V DC | DC voltmeter (CAUTION!) |
| Output U-V, V-W, U-W | Use VFD display only | VFD parameter readout |
| Motor current | ≤ nameplate FLA | Clamp meter on output |
| Ground fault current | <0.5A | Clamp all 3 output phases |
| Heatsink temperature | <80°C | IR thermometer |

> **SAFETY WARNING:** DC bus measurements require extreme caution. 679V DC is instantly lethal. Use properly rated probes, stand on insulated mat, and have a second person present. Better yet — use the VFD's built-in DC bus voltage display parameter.

## Key Takeaways

- VFD has 3 stages: Rectifier (AC→DC), DC Bus (storage), Inverter (DC→variable AC)
- DC bus voltage = AC input × 1.414 (480V AC → 679V DC)
- DC bus capacitors are the most common age-related failure (7-10 year life)
- Overvoltage = motor regenerating faster than bus can absorb (need brake resistor)
- Undervoltage = power quality issue or capacitor degradation
- Never measure VFD output with a standard meter — use VFD display parameters
- DC bus retains lethal voltage for 5+ minutes after power removal
`
  },
];

// ============================================================
// HVAC FUNDAMENTALS - 6 Lessons
// ============================================================
const hvacLessons = [
  {
    slug: 'refrigeration-cycle',
    title: 'The Refrigeration Cycle',
    orderIndex: 1,
    estimatedMinutes: 22,
    content: `# The Refrigeration Cycle

## How Every Cooling System Works

Whether it's a 500-ton chiller cooling a manufacturing plant, a 5-ton rooftop unit for an office, or a walk-in freezer in a food processing facility — they all use the same fundamental refrigeration cycle. Understanding this cycle is essential for maintaining the HVAC systems that keep production environments at required temperatures.

## The Four Components

Every refrigeration system has four essential components:

| Component | Function | State Change |
|-----------|----------|-------------|
| **Compressor** | Pumps refrigerant, raises pressure | Low-pressure gas → High-pressure gas |
| **Condenser** | Rejects heat to outside | High-pressure gas → High-pressure liquid |
| **Expansion Device** | Reduces pressure | High-pressure liquid → Low-pressure liquid/gas mix |
| **Evaporator** | Absorbs heat from space | Low-pressure liquid → Low-pressure gas |

## The Cycle Step by Step

### Step 1: Compression (Compressor)

- Low-pressure, low-temperature **gas** enters the compressor
- Compressor raises pressure (and temperature) significantly
- Exits as high-pressure, high-temperature **superheated gas**
- Typical discharge: 150-250°F, 200-400 psig (R-410A system)

### Step 2: Condensation (Condenser)

- Hot, high-pressure gas enters the condenser coil
- Heat transfers from refrigerant to outdoor air (or cooling water)
- Refrigerant changes state from gas to **liquid** (condensation)
- Exits as high-pressure, warm **subcooled liquid**
- Typical: 90-120°F liquid, same high pressure

### Step 3: Expansion (Metering Device)

- High-pressure liquid passes through a restriction (TXV, EEV, or orifice)
- Pressure drops dramatically
- Some liquid flashes to gas (flash gas)
- Exits as low-pressure, cold **liquid/gas mixture**
- Typical: 35-45°F, 60-130 psig (R-410A, cooling mode)

### Step 4: Evaporation (Evaporator)

- Cold, low-pressure mixture enters the evaporator coil
- Heat transfers from indoor air to the cold refrigerant
- Refrigerant absorbs heat and changes from liquid to **gas** (evaporation)
- Exits as low-pressure **superheated gas** (ready for compressor)
- Indoor air is cooled in the process

## Key Measurements

### Superheat

**Superheat** = Temperature of gas leaving evaporator - Saturation temperature at that pressure

| Superheat | Meaning |
|-----------|---------|
| 0°F | Liquid reaching compressor — DANGER (liquid slugging) |
| 5-8°F | Low — evaporator is flooding (too much refrigerant) |
| 10-15°F | Normal range for TXV systems |
| 20-25°F | Normal range for fixed orifice systems |
| >30°F | High — low charge, restricted flow, or poor airflow |

### Subcooling

**Subcooling** = Saturation temperature at condenser pressure - Temperature of liquid leaving condenser

| Subcooling | Meaning |
|-----------|---------|
| 0°F | Condenser not fully condensing — problem |
| 5-8°F | Low — possible low charge |
| 10-15°F | Normal range |
| >20°F | High — overcharge or restriction downstream |

## Pressure-Temperature Relationship

Refrigerant has a fixed relationship between pressure and saturation temperature. This is how we determine superheat and subcooling without cutting into the system:

### R-410A (Common in Modern Systems)

| Pressure (psig) | Saturation Temp (°F) | Location |
|-----------------|---------------------|----------|
| 118 | 40°F | Evaporator (cooling) |
| 130 | 45°F | Evaporator (cooling) |
| 370 | 100°F | Condenser |
| 418 | 110°F | Condenser (hot day) |

### R-22 (Older Systems, Being Phased Out)

| Pressure (psig) | Saturation Temp (°F) | Location |
|-----------------|---------------------|----------|
| 69 | 40°F | Evaporator |
| 76 | 45°F | Evaporator |
| 196 | 100°F | Condenser |
| 226 | 110°F | Condenser |

## Common Refrigeration Problems

| Symptom | Superheat | Subcooling | Likely Cause |
|---------|-----------|-----------|-------------|
| Poor cooling, low suction | High | Low | Low refrigerant charge |
| Poor cooling, high suction | Low | Normal | Compressor weak |
| Compressor short-cycling | Normal | High | Overcharge or restriction |
| Ice on suction line | Very low | Normal | TXV stuck open, overcharge |
| High head pressure | Normal | High | Dirty condenser, overcharge |
| Low head pressure | High | Low | Low charge, condenser fan issue |

## Key Takeaways

- The refrigeration cycle moves heat from where you don't want it to where you do
- Four components: Compressor → Condenser → Expansion → Evaporator
- Superheat protects the compressor (ensures only gas enters)
- Subcooling ensures liquid reaches the expansion device (no flash gas in liquid line)
- Pressure-temperature charts are your primary diagnostic tool
- Every cooling problem shows up in superheat, subcooling, or both
`
  },
  {
    slug: 'hvac-motor-controls',
    title: 'HVAC Motor Controls & Starters',
    orderIndex: 2,
    estimatedMinutes: 20,
    content: `# HVAC Motor Controls & Starters

## Motors in HVAC Systems

HVAC systems are motor-intensive — compressors, condenser fans, evaporator blowers, pumps, and cooling tower fans all require motor control. Understanding how these motors are started, protected, and controlled is essential for HVAC maintenance.

## Motor Types in HVAC

| Application | Motor Type | Typical Size | Starting Method |
|-------------|-----------|-------------|----------------|
| Small condenser fan | PSC (single-phase) | 1/4 - 1 HP | Direct-on-line |
| Large condenser fan | 3-phase induction | 2-15 HP | Contactor |
| Supply/return blower | ECM or PSC | 1/2 - 5 HP | ECM: DC bus, PSC: direct |
| Scroll compressor | 3-phase hermetic | 5-30 HP | Contactor + start capacitor |
| Screw compressor | 3-phase | 50-500 HP | Wye-Delta or VFD |
| Centrifugal compressor | 3-phase | 100-2000 HP | VFD (always) |
| Chilled water pump | 3-phase | 5-100 HP | VFD or soft starter |
| Cooling tower fan | 3-phase | 10-75 HP | VFD (common) or 2-speed |

## Starting Methods

### Direct-On-Line (DOL)

Simplest method — contactor connects motor directly to power.

| Advantage | Disadvantage |
|-----------|-------------|
| Simple, cheap | 6-8× FLA inrush current |
| Maximum starting torque | Mechanical stress on belts/couplings |
| Fast start | Voltage dip on electrical system |

**Used for:** Small motors (<10 HP), where inrush is acceptable

### Wye-Delta (Star-Delta)

Motor starts in Wye (reduced voltage), then transitions to Delta (full voltage):

| Phase | Voltage | Current | Torque |
|-------|---------|---------|--------|
| Start (Wye) | 58% (V/√3) | 33% of DOL | 33% of DOL |
| Transition | Brief open | Current spike | Torque dip |
| Run (Delta) | 100% | Normal FLA | Full torque |

**Used for:** Screw compressors, large fans (where reduced starting torque is acceptable)

### Part-Winding Start

Motor has two parallel windings. First one energizes, then both:

| Phase | Windings | Current | Torque |
|-------|----------|---------|--------|
| Start | 1 of 2 | ~65% of DOL | ~50% of DOL |
| Run | Both | Normal FLA | Full torque |

**Used for:** Hermetic compressors with dual-winding motors

### VFD (Variable Frequency Drive)

Ramps motor from 0 Hz to full speed gradually:

| Advantage | Application |
|-----------|-------------|
| Zero inrush current | Large compressors |
| Variable speed operation | Fans, pumps (energy savings) |
| Soft start/stop | Reduces mechanical stress |
| Precise speed control | Chiller capacity modulation |

## Motor Protection in HVAC

### Overload Protection

| Protection Type | Application | Response Time |
|----------------|-------------|---------------|
| Bi-metallic OL relay | Small motors | Slow (seconds to minutes) |
| Electronic OL relay | Medium motors | Adjustable (Class 10/20/30) |
| Motor protector (internal) | Hermetic compressors | Fast (winding temperature) |
| VFD electronic protection | VFD-driven motors | Instantaneous |

### Compressor-Specific Protection

| Protection | What It Detects | Action |
|-----------|----------------|--------|
| High-pressure switch | Condenser problem, overcharge | Locks out compressor |
| Low-pressure switch | Low charge, airflow problem | Locks out compressor |
| Oil pressure switch | Low oil, pump failure | Time-delayed lockout |
| Discharge temperature | Overheating | Lockout |
| Phase monitor | Phase loss, reversal, imbalance | Prevents start |
| Short-cycle timer | Rapid cycling | Delays restart (5 min) |

### Why Short-Cycle Protection Matters

Compressors need time between starts for:
- Oil to return to the compressor crankcase
- Pressures to equalize (reduces starting load)
- Motor windings to cool
- Starting components to cool (capacitors, contacts)

> **Rule:** Most compressor manufacturers require minimum 5 minutes between starts and maximum 6-8 starts per hour. Violating this dramatically shortens compressor life.

## Control Circuits

### Basic Cooling Sequence

\`\`\`
Thermostat calls for cooling
  → Indoor blower starts (G relay)
  → Compressor contactor energizes (Y relay) [after anti-short-cycle delay]
  → Condenser fan starts (with compressor or on pressure)
  → System runs until thermostat satisfied
  → Compressor stops, blower runs 60-90 seconds (fan-off delay)
\`\`\`

### Staging (Multi-Compressor Systems)

| Stage | Load | Active Equipment |
|-------|------|-----------------|
| Stage 1 | 0-33% | Compressor 1 only |
| Stage 2 | 33-66% | Compressors 1 + 2 |
| Stage 3 | 66-100% | All 3 compressors |

Lead/lag rotation ensures equal wear across compressors.

## Interactive: Relay Simulator

Practice understanding how HVAC control relays (R, G, Y, W, O/B) energize different components:

<!-- INTERACTIVE: RelaySimulator -->

## Key Takeaways

- HVAC systems use many motor types — match the starting method to the application
- VFDs are increasingly standard for fans and pumps (30-50% energy savings)
- Compressor protection is multi-layered: electrical + mechanical + thermal
- Short-cycle protection prevents the #1 cause of premature compressor failure
- Understanding the control sequence helps you trace which relay should be energized when
`
  },
  {
    slug: 'vfd-hvac-applications',
    title: 'VFDs in HVAC: Energy Savings & Control',
    orderIndex: 3,
    estimatedMinutes: 22,
    content: `# VFDs in HVAC: Energy Savings & Control

## Why VFDs Dominate Modern HVAC

The single biggest energy savings opportunity in commercial and industrial HVAC is variable-speed operation of fans and pumps. The physics are compelling: reducing fan speed by 20% reduces power consumption by nearly 50%.

## The Affinity Laws (Fan/Pump Laws)

These laws govern the relationship between speed, flow, pressure, and power:

| Parameter | Relationship | Example (80% speed) |
|-----------|-------------|-------------------|
| Flow | Proportional to speed | 80% flow |
| Pressure | Proportional to speed² | 64% pressure |
| **Power** | **Proportional to speed³** | **51% power** |

> **The Cube Law:** Running a fan at 80% speed uses only 51% of the power. At 50% speed, power drops to just 12.5% of full-speed power. This is why VFDs on HVAC fans and pumps have 2-3 year payback periods.

### Real-World Energy Savings

| Application | Traditional Control | VFD Control | Savings |
|-------------|-------------------|-------------|---------|
| AHU supply fan | Inlet vanes at 70% | VFD at 70% speed | 40-50% |
| Chilled water pump | Throttling valve | VFD to maintain ΔP | 30-60% |
| Condenser fan | Cycling ON/OFF | VFD modulating | 25-40% |
| Cooling tower fan | 2-speed motor | VFD continuous | 35-50% |

## Common HVAC VFD Applications

### 1. Air Handling Unit (AHU) Supply Fans

**Control Signal:** Building Automation System (BAS) sends 0-10V or 4-20mA signal based on duct static pressure.

**Typical Setup:**
- Setpoint: 1.0-1.5" WC duct static pressure
- PID loop in BAS (or VFD built-in PID) modulates speed
- Minimum speed: 20-30% (for ventilation requirements)
- Maximum speed: 100% (design airflow)

**Common Issues:**
| Problem | Cause | Fix |
|---------|-------|-----|
| Hunting (speed oscillates) | PID gains too aggressive | Reduce proportional gain, increase integral time |
| Motor overheating at low speed | Insufficient cooling | Add external cooling fan or set minimum speed higher |
| Bearing noise at low speed | Below minimum speed for bearing lubrication | Set minimum frequency ≥15 Hz |
| VFD trips on overcurrent at start | High static pressure on startup | Use "flying start" or pre-open dampers |

### 2. Chilled Water Pumps

**Control Signal:** Differential pressure across the most remote coil (ΔP setpoint).

**Typical Setup:**
- Primary pumps: constant speed (matched to chiller flow)
- Secondary pumps: VFD controlled to maintain ΔP
- Setpoint: 8-15 psid (depends on system design)
- As valves close (less load), pump slows down

**Energy Impact:**
- At 50% load, pump runs at ~70% speed → uses only 35% power
- At 25% load, pump runs at ~50% speed → uses only 12.5% power

### 3. Cooling Tower Fans

**Control Signal:** Condenser water return temperature (or approach temperature).

**Typical Setup:**
- Setpoint: 78-85°F condenser water supply
- VFD modulates fan speed to maintain setpoint
- Multiple fans: stage ON/OFF with lead fan on VFD
- Minimum speed: 10-20% (to prevent motor overheating)

### 4. Exhaust Fans (Parking Garages, Labs)

**Control Signal:** CO level (parking) or room pressure (labs).

**Demand-controlled ventilation:**
- CO sensors detect vehicle exhaust levels
- Fans speed up only when CO exceeds setpoint
- At night/low occupancy: fans at minimum speed
- Savings: 60-80% compared to constant-speed operation

## VFD Parameters for HVAC

### Critical Parameters to Set

| Parameter | Typical HVAC Setting | Why |
|-----------|---------------------|-----|
| Accel time | 15-60 seconds | Prevent duct pressure spikes |
| Decel time | 15-60 seconds | Prevent water hammer (pumps) |
| Min frequency | 15-20 Hz | Motor cooling, bearing life |
| Max frequency | 60 Hz | Don't overspeed (unless designed for it) |
| Motor NP voltage | Match nameplate | Proper V/Hz ratio |
| Motor NP current | Match nameplate | Overload protection |
| Carrier frequency | 4-8 kHz | Balance noise vs. efficiency |
| Auto-restart | Enabled (3 attempts) | Resume after power blip |
| Flying start | Enabled (fans) | Catch spinning fan on restart |
| PID setpoint | Per application | Static pressure, ΔP, temperature |

### Built-in PID Control

Many HVAC VFDs have built-in PID controllers:
- Eliminates need for external BAS PID loop
- Feedback signal (4-20mA from pressure sensor) connects directly to VFD
- VFD adjusts speed to maintain setpoint
- Simpler wiring, faster response

## Troubleshooting HVAC VFDs

| Symptom | Check |
|---------|-------|
| Fan won't start | Run command present? Speed reference >0? Safety chain complete? |
| Fan runs but no airflow | Belt broken? Dampers closed? Wrong rotation? |
| Speed won't go above 40 Hz | Speed limit parameter? Analog input scaled wrong? |
| VFD trips on overload | Dirty filters (high static)? Belt too tight? Bearing seized? |
| Hunting/oscillating speed | PID gains need tuning. Increase integral time, reduce P gain |
| Motor hot at low speed | Below minimum cooling speed. Add forced cooling or raise min Hz |

## Interactive: Ohm's Law Calculator

Calculate power savings at different speeds using the cube law relationship:

<!-- INTERACTIVE: OhmsLawCalculator -->

## Key Takeaways

- The cube law means small speed reductions yield huge power savings (20% slower = 49% less power)
- VFDs on HVAC fans and pumps typically pay for themselves in 2-3 years
- Set minimum frequency ≥15 Hz to protect motor bearings and cooling
- Use long accel/decel times (15-60s) to prevent pressure spikes and water hammer
- Built-in PID eliminates the need for external controllers in simple applications
- Flying start is essential for fans that may still be spinning on restart
`
  },
  {
    slug: 'compressor-types',
    title: 'Compressor Types & Operation',
    orderIndex: 4,
    estimatedMinutes: 20,
    content: `# Compressor Types & Operation

## The Heart of Every Refrigeration System

The compressor is the most expensive and critical component in any HVAC system. It's also the component most likely to fail catastrophically if not properly maintained. Understanding compressor types helps you diagnose problems and communicate effectively with HVAC specialists.

## Compressor Types by Application

| Type | Capacity Range | Application | Efficiency |
|------|---------------|-------------|-----------|
| Reciprocating | 1-150 tons | Small commercial, residential | Good |
| Scroll | 1-60 tons | RTUs, split systems, small chillers | Very good |
| Screw | 50-1500 tons | Large chillers, industrial | Excellent |
| Centrifugal | 150-10,000 tons | Large chillers, district cooling | Excellent |

## Reciprocating Compressors

### How They Work
Like a car engine: pistons move up and down in cylinders, compressing refrigerant gas.

### Types
- **Hermetic:** Motor and compressor sealed in one shell (residential/light commercial)
- **Semi-hermetic:** Bolted shell, serviceable (medium commercial)
- **Open-drive:** Separate motor, shaft seal (industrial, ammonia systems)

### Capacity Control
- Cylinder unloading (solenoid-operated unloader valves)
- Hot gas bypass
- VFD (modern systems)
- Cycling ON/OFF (small systems)

### Common Failures

| Failure | Cause | Symptom |
|---------|-------|---------|
| Valve plate failure | Liquid slugging, wear | Loss of capacity, high superheat |
| Bearing failure | Oil loss, contamination | Noise, high current, lockout |
| Motor winding failure
 | Overheating, voltage issues | High current, trips on overload |
| Liquid slugging | Flooded evaporator, fast start | Broken valves, mechanical noise |

## Scroll Compressors

### How They Work
Two spiral-shaped scrolls — one fixed, one orbiting. Gas is trapped between them and compressed as the orbiting scroll moves inward.

### Advantages
- Fewer moving parts than reciprocating (1 vs. many)
- Smoother operation, less vibration
- Higher efficiency at part load
- Quieter operation
- Tolerates small amounts of liquid (compliant scroll)

### Capacity Control
- Digital scroll (periodic unloading)
- Tandem/trio (multiple scrolls, staging)
- VFD (variable speed scroll — newest technology)

### Common Failures

| Failure | Cause | Symptom |
|---------|-------|---------|
| Scroll wear | Contamination, loss of oil | Reduced capacity, noise |
| Motor burnout | Overheating, voltage issues | Locked rotor, trips breaker |
| Bearing failure | Oil loss | Noise, vibration, high current |
| Reverse rotation | Phase reversal after power work | No cooling, high noise, rapid failure |

> **Critical:** Scroll compressors can only run in ONE direction. Reverse rotation causes immediate damage. Always verify phase rotation after any electrical work.

## Screw Compressors

### How They Work
Two helical rotors (male and female) mesh together, trapping and compressing gas as it moves along the rotor length.

### Capacity Control
- Slide valve (0-100% continuous modulation)
- VFD (most efficient method)
- Combination of slide valve + VFD

### Key Maintenance
- Oil system is critical (oil separates from refrigerant in oil separator)
- Oil filter changes per manufacturer schedule
- Bearing inspection at major overhauls
- Vibration monitoring for early failure detection

## Centrifugal Compressors

### How They Work
An impeller spinning at high speed (10,000-50,000 RPM) accelerates refrigerant gas outward. The kinetic energy converts to pressure in the diffuser.

### Capacity Control
- Inlet guide vanes (IGVs) — most common
- VFD speed control — most efficient
- Hot gas bypass — least efficient (emergency only)

### Surge
The most dangerous operating condition for a centrifugal compressor:
- Occurs when flow drops below minimum while maintaining high pressure
- Refrigerant reverses flow momentarily → violent vibration
- Can destroy bearings and impeller in seconds
- Anti-surge controls are mandatory

## Oil Management

| System | Oil Concern |
|--------|------------|
| Reciprocating | Oil logging in evaporator at low load |
| Scroll | Oil dilution from liquid refrigerant |
| Screw | Oil separator efficiency, oil cooling |
| Centrifugal | Oil migration, bearing lubrication |

## Key Takeaways

- Scroll compressors dominate small-medium commercial HVAC (quiet, efficient, reliable)
- Screw compressors handle medium-large loads with excellent part-load efficiency
- Centrifugal compressors are for large facilities — most efficient but most complex
- Liquid slugging damages reciprocating and scroll compressors — protect with proper superheat
- Scroll compressors MUST run in correct rotation — verify after any electrical work
- Oil management is critical for all compressor types — oil = bearing life
`
  },
  {
    slug: 'controls-thermostats',
    title: 'HVAC Controls & Building Automation',
    orderIndex: 5,
    estimatedMinutes: 20,
    content: `# HVAC Controls & Building Automation

## From Thermostats to Building Automation Systems

HVAC controls range from simple room thermostats to sophisticated Building Automation Systems (BAS) managing thousands of points across multiple buildings. Understanding the control hierarchy helps you troubleshoot effectively.

## Control Hierarchy

### Level 1: Field Devices (Sensors & Actuators)

| Device | Signal | Function |
|--------|--------|----------|
| Room temperature sensor | 10kΩ thermistor or 4-20mA | Measures space temperature |
| Duct temperature sensor | 10kΩ or RTD | Measures supply/return air temp |
| Humidity sensor | 4-20mA or 0-10V | Measures relative humidity |
| CO2 sensor | 0-10V or 4-20mA | Measures air quality |
| Duct static pressure | 4-20mA | Measures duct pressure |
| Damper actuator | 0-10V or 2-10V DC | Positions dampers |
| Valve actuator | 0-10V or floating | Positions control valves |
| Current switch | Dry contact | Proves fan/pump running |

### Level 2: Unit Controllers (DDC Controllers)

Direct Digital Control (DDC) controllers manage individual equipment:
- Rooftop unit controller
- Air handler controller
- VAV box controller
- Chiller plant controller
- Boiler controller

### Level 3: Building Automation System (BAS)

The supervisory system that:
- Monitors all DDC controllers
- Provides operator interface (graphics, alarms, trends)
- Implements global strategies (optimal start, demand limiting)
- Logs data for energy management
- Sends alarms via email/text

### Common BAS Platforms

| Manufacturer | System | Protocol |
|-------------|--------|----------|
| Johnson Controls | Metasys | BACnet, N2 |
| Honeywell | Niagara/EBI | BACnet, LON |
| Siemens | Desigo CC | BACnet |
| Trane | Tracer | BACnet, proprietary |
| Carrier | i-Vu | BACnet |

## Communication Protocols

### BACnet (Building Automation and Control Network)

The industry standard protocol:
- **BACnet/IP:** Over Ethernet (most common for supervisory level)
- **BACnet MS/TP:** Over RS-485 (for field controllers, slower but cheaper)

### Modbus

Older but still widely used:
- **Modbus RTU:** Over RS-485 (serial)
- **Modbus TCP:** Over Ethernet

### Analog Signals (Still Everywhere)

| Signal | Application |
|--------|-------------|
| 0-10V DC | Damper/valve position command |
| 4-20mA | Sensor readings, VFD speed command |
| 24V AC/DC | Binary commands (on/off) |
| Dry contact | Status feedback, alarms |

## PID Control in HVAC

Most HVAC control loops use PID (Proportional-Integral-Derivative) control:

### Example: Duct Static Pressure Control

- **Setpoint:** 1.2" WC
- **Process Variable:** Measured duct static pressure
- **Output:** VFD speed command (0-100%)

| PID Term | Function | Effect |
|----------|----------|--------|
| Proportional (P) | Responds to current error | Fast response, but leaves offset |
| Integral (I) | Eliminates steady-state error | Slower, eliminates offset |
| Derivative (D) | Responds to rate of change | Reduces overshoot (rarely used in HVAC) |

### Common PID Tuning Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Oscillation (hunting) | P gain too high | Reduce P, increase I time |
| Slow response | P gain too low | Increase P |
| Offset from setpoint | No integral action | Add or increase I |
| Overshoot on startup | I wind-up | Enable anti-windup, reduce I |

> **HVAC Rule of Thumb:** Most HVAC loops work well with PI control only (no D term). Start with low P gain and moderate I time, then adjust.

## Economizer Control

Free cooling using outdoor air when conditions allow:

### Dry-Bulb Economizer
- Compare outdoor temperature to return air temperature
- If outdoor < return, use outdoor air for cooling
- Changeover temperature: typically 55-65°F

### Enthalpy Economizer
- Compare outdoor enthalpy to return air enthalpy
- Accounts for humidity (more accurate than dry-bulb)
- Better in humid climates

### Common Economizer Problems

| Problem | Cause | Effect |
|---------|-------|--------|
| Dampers stuck open | Actuator failure, linkage broken | Overcooling in winter, high energy |
| Dampers stuck closed | Same | No free cooling, compressor runs unnecessarily |
| Wrong changeover point | Sensor drift, bad setpoint | Bringing in hot/humid air |
| Minimum OA too low | Damper not opening enough | Poor indoor air quality, CO2 high |

## Troubleshooting HVAC Controls

### Systematic Approach

1. **Check the setpoint** — is the controller trying to do the right thing?
2. **Check the sensor** — is it reading accurately? (Compare to handheld instrument)
3. **Check the output** — is the controller commanding the right action?
4. **Check the actuator** — is it responding to the command?
5. **Check the result** — is the controlled variable moving toward setpoint?

### Common Control Problems

| Symptom | Likely Cause |
|---------|-------------|
| Space too warm | Sensor reading low (thinks it's cool), valve stuck closed, VFD at min speed |
| Space too cold | Sensor reading high, damper stuck open, heating valve leaking |
| Humidity too high | Economizer bringing in humid air, coil not dehumidifying |
| System won't start | Schedule wrong, safety tripped, communication loss |
| Erratic operation | Sensor failure, loose wiring, PID hunting |

## Key Takeaways

- HVAC controls are hierarchical: field devices → unit controllers → BAS
- BACnet is the industry standard protocol — learn to read BACnet point lists
- PID control drives most HVAC loops — PI (no D) works for most applications
- Economizers save significant energy but are the most commonly failed HVAC control
- Troubleshoot systematically: setpoint → sensor → output → actuator → result
- A bad sensor causes the controller to do the wrong thing perfectly
`
  },
  {
    slug: 'hvac-troubleshooting',
    title: 'HVAC Troubleshooting: Systematic Approach',
    orderIndex: 6,
    estimatedMinutes: 22,
    content: `# HVAC Troubleshooting: Systematic Approach

## The Diagnostic Mindset

HVAC troubleshooting combines electrical skills, mechanical knowledge, and refrigeration theory. The best technicians don't guess — they follow a systematic process that narrows down the problem quickly.

## The Five-Step Diagnostic Process

### Step 1: Gather Information

Before touching anything:
- What is the complaint? (Too hot, too cold, no cooling, strange noise)
- When did it start? (Sudden or gradual)
- What changed? (Power outage, maintenance work, weather change)
- What equipment is involved? (Unit model, age, refrigerant type)
- Any recent service history?

### Step 2: Verify the Complaint

Go to the space and confirm:
- Measure actual temperature vs. setpoint
- Check thermostat/controller settings
- Is the system running? (Listen, feel airflow)
- Are other zones affected or just this one?

### Step 3: Identify the System

Determine what type of system you're working on:

| System Type | Components to Check |
|-------------|-------------------|
| Split system | Indoor unit, outdoor unit, refrigerant lines, thermostat |
| Rooftop unit (RTU) | Self-contained — all components in one unit |
| Chilled water | Chiller, pumps, piping, AHU coils, valves |
| VRF/VRV | Outdoor unit(s), indoor units, refrigerant piping, controls |
| Geothermal | Heat pump, ground loop, pumps |

### Step 4: Systematic Diagnosis

Work through the system in order:

#### Electrical First
1. Power present at disconnect? (All 3 phases)
2. Control voltage present? (24V AC at thermostat/controller)
3. Thermostat/controller calling for cooling/heating?
4. Contactors/relays energized?
5. Motors running? (Compressor, fans, pumps)
6. Safety devices tripped? (High pressure, low pressure, overloads)

#### Then Mechanical
7. Airflow adequate? (Filters clean, belts intact, dampers open)
8. Refrigerant pressures normal? (Suction and discharge)
9. Superheat and subcooling in range?
10. Condenser clean? (Airflow unobstructed)
11. Drain clear? (No water backup)

### Step 5: Repair and Verify

After making the repair:
- Run the system for a full cycle
- Verify temperatures are reaching setpoint
- Check all pressures and electrical readings
- Document what you found and what you did

## Common HVAC Problems by Symptom

### No Cooling at All

| Check | Finding | Diagnosis |
|-------|---------|-----------|
| Thermostat | Not calling for cooling | Wrong mode, setpoint too high, schedule |
| Power | No voltage at unit | Tripped breaker, blown fuse, disconnect off |
| Contactor | Not pulled in | No control signal, coil open, contacts welded |
| Compressor | Locked rotor | Bad start capacitor, seized compressor, low voltage |
| High-pressure switch | Tripped | Dirty condenser, overcharge, condenser fan failed |
| Low-pressure switch | Tripped | Low charge, frozen evaporator, TXV stuck closed |

### Cooling But Not Enough

| Check | Finding | Diagnosis |
|-------|---------|-----------|
| Airflow | Low | Dirty filter, broken belt, damper closed |
| Suction pressure | Low | Low charge, restricted TXV, low airflow |
| Suction pressure | High | Compressor weak, TXV stuck open |
| Discharge pressure | High | Dirty condenser, overcharge, non-condensables |
| Superheat | High (>25°F) | Low charge, restricted metering device |
| Superheat | Low (<5°F) | Overcharge, TXV stuck open |
| Subcooling | Low (<5°F) | Low charge |
| Subcooling | High (>20°F) | Overcharge, restriction in liquid line |

### Compressor Short-Cycling

| Interval | Likely Cause |
|----------|-------------|
| <1 minute | Low charge (low-pressure cutout), thermostat anticipator |
| 2-5 minutes | Dirty condenser (high-pressure cutout), overcharge |
| 5-10 minutes | Oversized equipment, thermostat location |

### Frozen Evaporator Coil

| Cause | Check |
|-------|-------|
| Low airflow | Filter, blower, belt, ductwork |
| Low charge | Suction pressure, superheat |
| Defrost failure (heat pump) | Defrost board, reversing valve, sensors |
| TXV stuck open | Superheat near 0, liquid at compressor |
| Low ambient operation | Without low-ambient controls |

## Electrical Troubleshooting Specifics

### Compressor Won't Start

\`\`\`
Check sequence:
1. 24V at thermostat Y terminal? → If no: thermostat/wiring
2. 24V at contactor coil? → If no: safety chain (HP, LP, OL)
3. Contactor pulled in? → If no: coil open, low voltage
4. Voltage at compressor terminals? → If no: contactor contacts
5. Compressor drawing current? → If no: internal overload open, winding open
6. Current too high? → Locked rotor: bad cap, seized, low voltage
\`\`\`

### Reading Compressor Windings (Single-Phase Hermetic)

Three terminals: **C** (Common), **S** (Start), **R** (Run)

| Measurement | Relationship |
|-------------|-------------|
| C to S | Highest resistance |
| C to R | Middle resistance |
| S to R | C-S + C-R (should equal sum) |

If any reading is OL → open winding (compressor dead)
If any reading is 0Ω → shorted winding (compressor dead)
If C to ground reads low → grounded winding (compressor dead)

### Capacitor Testing

| Test | Good | Bad |
|------|------|-----|
| Visual | No bulging, no leaking | Bulged top, oil leaking |
| Capacitance | Within ±5% of rated µF | >10% off = replace |
| Resistance | Charges then goes to OL | Stays at 0Ω (shorted) or OL (open) |

## Documentation Template

After every service call, document:

| Field | Example |
|-------|---------|
| Equipment | RTU-3, Carrier 50XC, 10-ton |
| Complaint | Space at 82°F, setpoint 72°F |
| Findings | Low charge, suction 52 psig (R-410A), SH 28°F |
| Repair | Found leak at service valve, repaired, charged to 118 psig suction, 12°F SH |
| Verification | Space reached 73°F in 45 minutes, all readings normal |

## Key Takeaways

- Always start with information gathering — don't jump to conclusions
- Check electrical FIRST (power, controls, safeties) before opening the refrigerant system
- Superheat and subcooling tell you 80% of what's wrong with the refrigerant side
- Compressor short-cycling is always a symptom, not the problem — find the root cause
- Document everything — the next technician (or you in 6 months) will thank you
- A systematic approach beats experience-based guessing every time
`
  },
];

// ============================================================
// DATABASE INSERTION
// ============================================================

async function seedLessons(moduleId, lessons) {
  for (const lesson of lessons) {
    // Check if lesson already exists
    const [existing] = await connection.query(
      'SELECT id FROM course_lessons WHERE moduleId = ? AND slug = ?',
      [moduleId, lesson.slug]
    );
    
    if (existing.length > 0) {
      // Update existing lesson
      await connection.query(
        `UPDATE course_lessons SET title = ?, orderIndex = ?, content = ?, estimatedMinutes = ?, isPublished = 1, updatedAt = NOW() WHERE moduleId = ? AND slug = ?`,
        [lesson.title, lesson.orderIndex, lesson.content, lesson.estimatedMinutes, moduleId, lesson.slug]
      );
      console.log(`  Updated: ${lesson.slug}`);
    } else {
      // Insert new lesson
      await connection.query(
        `INSERT INTO course_lessons (moduleId, slug, title, orderIndex, content, estimatedMinutes, isPublished) VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [moduleId, lesson.slug, lesson.title, lesson.orderIndex, lesson.content, lesson.estimatedMinutes]
      );
      console.log(`  Inserted: ${lesson.slug}`);
    }
  }
  
  // Update module totalLessons count
  const [countResult] = await connection.query(
    'SELECT COUNT(*) as cnt FROM course_lessons WHERE moduleId = ?',
    [moduleId]
  );
  await connection.query(
    'UPDATE course_modules SET totalLessons = ? WHERE id = ?',
    [countResult[0].cnt, moduleId]
  );
  console.log(`  Module totalLessons updated to ${countResult[0].cnt}`);
}

try {
  console.log('Seeding Electrical Fundamentals...');
  await seedLessons(MODULES.electrical, electricalLessons);
  
  console.log('Seeding Digital Fundamentals...');
  await seedLessons(MODULES.digital, digitalLessons);
  
  console.log('Seeding Semiconductor Fundamentals...');
  await seedLessons(MODULES.semiconductor, semiconductorLessons);
  
  console.log('Seeding HVAC Fundamentals...');
  await seedLessons(MODULES.hvac, hvacLessons);
  
  console.log('\nAll foundational lessons seeded successfully!');
} catch (error) {
  console.error('Error seeding lessons:', error);
} finally {
  await connection.end();
}
