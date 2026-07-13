/**
 * Seed script: 7 New Course Tracks with Foundational Lessons
 * Run: node server/seed-new-tracks.mjs
 * 
 * Creates modules + 3-5 lessons each for:
 * 1. Industrial Networking
 * 2. Sensors & Instrumentation
 * 3. Robotics Fundamentals
 * 4. Print Reading (Electrical)
 * 5. Safety Systems
 * 6. Process Control
 * 7. Power Distribution
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { ELECTRICAL_SCHEMATIC_SYMBOLS_SECTION } from './content/electrical-schematic-symbols.mjs';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);

// ============================================================
// HELPER: Upsert module
// ============================================================
async function upsertModule(slug, title, description, icon, path, orderIndex) {
  const [existing] = await connection.query(
    'SELECT id FROM course_modules WHERE slug = ?', [slug]
  );
  if (existing.length > 0) {
    await connection.query(
      'UPDATE course_modules SET title = ?, description = ?, icon = ?, path = ?, orderIndex = ?, isPublished = 1 WHERE slug = ?',
      [title, description, icon, path, orderIndex, slug]
    );
    console.log(`  Updated module: ${slug} (id=${existing[0].id})`);
    return existing[0].id;
  } else {
    const [result] = await connection.query(
      'INSERT INTO course_modules (slug, title, description, icon, path, orderIndex, totalLessons, isPublished) VALUES (?, ?, ?, ?, ?, ?, 0, 1)',
      [slug, title, description, icon, path, orderIndex]
    );
    console.log(`  Created module: ${slug} (id=${result.insertId})`);
    return result.insertId;
  }
}

// ============================================================
// HELPER: Seed lessons for a module
// ============================================================
async function seedLessons(moduleId, lessons) {
  for (const lesson of lessons) {
    const [existing] = await connection.query(
      'SELECT id FROM course_lessons WHERE moduleId = ? AND slug = ?',
      [moduleId, lesson.slug]
    );
    if (existing.length > 0) {
      await connection.query(
        'UPDATE course_lessons SET title = ?, orderIndex = ?, content = ?, estimatedMinutes = ?, isPublished = 1, updatedAt = NOW() WHERE moduleId = ? AND slug = ?',
        [lesson.title, lesson.orderIndex, lesson.content, lesson.estimatedMinutes, moduleId, lesson.slug]
      );
      console.log(`    Updated: ${lesson.slug}`);
    } else {
      await connection.query(
        'INSERT INTO course_lessons (moduleId, slug, title, orderIndex, content, estimatedMinutes, isPublished) VALUES (?, ?, ?, ?, ?, ?, 1)',
        [moduleId, lesson.slug, lesson.title, lesson.orderIndex, lesson.content, lesson.estimatedMinutes]
      );
      console.log(`    Inserted: ${lesson.slug}`);
    }
  }
  // Update totalLessons
  const [countResult] = await connection.query(
    'SELECT COUNT(*) as cnt FROM course_lessons WHERE moduleId = ? AND isPublished = 1', [moduleId]
  );
  await connection.query('UPDATE course_modules SET totalLessons = ? WHERE id = ?', [countResult[0].cnt, moduleId]);
  console.log(`    Module totalLessons updated to ${countResult[0].cnt}`);
}

// ============================================================
// 1. INDUSTRIAL NETWORKING
// ============================================================
const industrialNetworkingLessons = [
  {
    slug: 'ethernet-ip-fundamentals',
    title: 'Ethernet/IP Fundamentals for Industrial Networks',
    orderIndex: 1,
    estimatedMinutes: 25,
    content: `# Ethernet/IP Fundamentals for Industrial Networks

## Why Industrial Networking Matters

Every modern plant runs on networked devices. PLCs talk to VFDs over Ethernet/IP. HMIs pull data from remote I/O racks. SCADA systems aggregate data from hundreds of field devices. When the network goes down, production stops — and the maintenance tech who understands networking becomes the most valuable person on the floor.

## Ethernet/IP vs. Office Ethernet

Industrial Ethernet uses the same physical layer (Cat5e/Cat6 cables, RJ45 connectors) as office networks, but the protocol layer is different:

| Feature | Office Ethernet | Ethernet/IP (Industrial) |
|---------|----------------|--------------------------|
| Protocol | TCP/IP, HTTP | CIP over TCP/UDP |
| Timing | Best-effort | Deterministic (implicit messaging) |
| Topology | Star (switch-based) | Star, ring, DLR |
| Hardware | Consumer switches | Managed industrial switches |
| Environment | Climate-controlled | Vibration, heat, EMI |
| Failure impact | Email delayed | Production line stops |

### CIP: Common Industrial Protocol

Ethernet/IP stands for **Ethernet Industrial Protocol**, not "Ethernet Internet Protocol." The CIP (Common Industrial Protocol) layer rides on top of standard TCP/IP and UDP/IP:

- **Explicit messaging (TCP):** Configuration, diagnostics, parameter reads/writes. Like asking a VFD "what's your output frequency?"
- **Implicit messaging (UDP):** Real-time I/O data exchange. Like the PLC continuously sending speed commands to a VFD at 10ms intervals.

> **Field Reality:** When a VFD shows "Comm Loss" and the PLC shows the drive faulted, the first thing to check is the implicit messaging connection. A single bad cable crimp or a switch port running at half-duplex can cause intermittent packet loss that drops implicit connections.

## IP Addressing in Industrial Networks

Every device on an Ethernet/IP network needs a unique IP address. The standard industrial convention:

| Subnet | Typical Use | Example |
|--------|-------------|---------|
| 192.168.1.x | PLC/Controller network | PLC at 192.168.1.1 |
| 192.168.2.x | VFD/Drive network | Drive at 192.168.2.10 |
| 192.168.3.x | I/O network | Remote rack at 192.168.3.20 |
| 10.x.x.x | Plant backbone | SCADA at 10.1.1.100 |

### Subnet Masks Explained Simply

A subnet mask tells a device which part of the IP address is the "network" and which part is the "device":

- **255.255.255.0** = First three octets are network, last octet is device. Allows 254 devices.
- **255.255.0.0** = First two octets are network. Allows 65,534 devices.

If two devices have the same network portion and subnet mask, they can talk directly. If not, they need a router (gateway).

### Common IP Addressing Mistakes

1. **Duplicate IP addresses** — Two VFDs assigned the same IP. One works, one doesn't. Use a network scanner before commissioning.
2. **Wrong subnet mask** — PLC at 192.168.1.1/24 can't reach a drive at 192.168.2.10/24 without a gateway.
3. **Gateway not set** — Device works on local subnet but can't reach SCADA on a different subnet.

## Troubleshooting Network Issues

### The 5-Step Network Diagnostic Process

1. **Ping the device** — Can you reach it? \`ping 192.168.1.10\`
2. **Check link lights** — Is the physical connection good? Green = link, amber = activity.
3. **Check switch port status** — Speed, duplex, error counters.
4. **Check IP configuration** — Right IP, right subnet, right gateway?
5. **Check CIP connection** — Is the implicit messaging connection established?

### Common Failure Modes

| Symptom | Likely Cause | First Check |
|---------|-------------|-------------|
| No link light | Cable fault, wrong port | Try known-good cable |
| Link but no ping | IP mismatch, wrong VLAN | Verify IP and subnet |
| Intermittent comm loss | Half-duplex, EMI, bad crimp | Check switch port errors |
| Slow response | Network congestion, broadcast storm | Check switch CPU load |

## Glossary

| Term | Definition |
|------|-----------|
| **Ethernet/IP** | Ethernet Industrial Protocol — CIP over standard Ethernet |
| **CIP** | Common Industrial Protocol — application layer for industrial automation |
| **Implicit messaging** | Real-time UDP-based I/O data exchange |
| **Explicit messaging** | TCP-based configuration and diagnostic messaging |
| **DLR** | Device Level Ring — fault-tolerant ring topology |
| **Managed switch** | Switch with configurable VLANs, QoS, port mirroring |
| **IGMP snooping** | Switch feature that limits multicast traffic to subscribed ports |
| **RPI** | Requested Packet Interval — how often implicit messages are sent |
`
  },
  {
    slug: 'managed-switches-vlans',
    title: 'Managed Switches, VLANs & Network Segmentation',
    orderIndex: 2,
    estimatedMinutes: 20,
    content: `# Managed Switches, VLANs & Network Segmentation

## Why Managed Switches Matter

An unmanaged switch is a dumb device — it forwards everything to everywhere. In a plant with 200+ networked devices, this creates broadcast storms, security vulnerabilities, and impossible-to-diagnose intermittent failures.

A **managed switch** gives you:
- **VLANs** — Separate traffic domains (PLC network isolated from office network)
- **Port mirroring** — Copy traffic from one port to another for diagnostics
- **QoS** — Prioritize real-time control traffic over file transfers
- **IGMP snooping** — Prevent multicast floods from overwhelming devices
- **Port security** — Lock ports to specific MAC addresses
- **Diagnostics** — Error counters, bandwidth utilization, cable diagnostics

## VLANs: Virtual Network Segmentation

A VLAN (Virtual Local Area Network) creates separate broadcast domains on the same physical switch:

| VLAN ID | Name | Purpose | Devices |
|---------|------|---------|---------|
| 10 | Control | PLC/Controller traffic | PLCs, HMIs, remote I/O |
| 20 | Drives | VFD communication | All VFDs, drive controllers |
| 30 | Safety | Safety network | Safety PLCs, E-stop modules |
| 100 | Management | Switch management | IT access, SCADA |

### Why Segment?

1. **Performance** — A broadcast from a VFD doesn't flood the PLC network
2. **Security** — Office computers can't accidentally reach safety controllers
3. **Troubleshooting** — Problems are isolated to one VLAN, not the entire plant
4. **Compliance** — Many standards (IEC 62443) require network segmentation

> **Field Reality:** A real case: An office printer's DHCP broadcast was flooding the control network every 30 seconds, causing intermittent PLC comm faults. Adding VLANs fixed it permanently in 20 minutes.

## Switch Configuration Basics

### Port Speed and Duplex

Always configure industrial switch ports for:
- **Auto-negotiation ON** for most devices
- **100 Mbps Full Duplex forced** for older devices that don't auto-negotiate properly

| Setting | When to Use |
|---------|-------------|
| Auto | Default for modern devices |
| 100/Full forced | Legacy devices with known auto-negotiate issues |
| 1000/Full | Backbone uplinks between switches |

### Spanning Tree Protocol (STP)

STP prevents network loops (which cause broadcast storms that take down entire networks):

- **RSTP (Rapid STP)** — Converges in 1-3 seconds. Standard for most industrial networks.
- **DLR (Device Level Ring)** — Rockwell's ring protocol. Sub-millisecond failover.

### Port Mirroring for Diagnostics

When troubleshooting network issues, mirror the suspect port to a diagnostic port:

1. Connect a laptop with Wireshark to the mirror port
2. Configure the switch to copy traffic from the suspect port
3. Capture packets and analyze for retransmissions, malformed frames, or timing issues

## Troubleshooting Switch Issues

| Symptom | Check | Solution |
|---------|-------|----------|
| CRC errors on port | Cable quality, connector | Replace cable, re-terminate |
| High collision count | Duplex mismatch | Force both ends to same setting |
| Port flapping | Loose cable, bad SFP | Reseat connections, check SFP |
| Broadcast storm | Loop in network | Enable STP, find the loop |

## Glossary

| Term | Definition |
|------|-----------|
| **VLAN** | Virtual LAN — logical network segmentation on a physical switch |
| **STP/RSTP** | Spanning Tree Protocol — prevents network loops |
| **QoS** | Quality of Service — traffic prioritization |
| **IGMP** | Internet Group Management Protocol — manages multicast groups |
| **Port mirroring** | Copying traffic from one port to another for analysis |
| **Trunk port** | Switch port carrying multiple VLANs (tagged traffic) |
| **Access port** | Switch port assigned to a single VLAN (untagged) |
`
  },
  {
    slug: 'plc-network-communications',
    title: 'PLC Network Communications & Troubleshooting',
    orderIndex: 3,
    estimatedMinutes: 22,
    content: `# PLC Network Communications & Troubleshooting

## How PLCs Communicate Over Networks

A modern PLC doesn't just run ladder logic — it's a network node that communicates with dozens of devices simultaneously:

- **Implicit I/O connections** to remote I/O racks (cyclic, real-time)
- **Produced/Consumed tags** shared between PLCs (peer-to-peer)
- **MSG instructions** for on-demand reads/writes to other controllers
- **HMI connections** serving tag data to operator interfaces

## Connection Types

### Implicit (Real-Time I/O)

Used for: Remote I/O, VFD control, safety I/O

| Parameter | Typical Value | Impact |
|-----------|--------------|--------|
| RPI (Requested Packet Interval) | 10-100 ms | Lower = faster response, more bandwidth |
| Connection timeout | 4× RPI | How long before "Comm Loss" fault |
| Multicast vs. Unicast | Depends on device | Multicast needs IGMP snooping |

> **Field Reality:** Setting RPI to 2ms on every connection because "faster is better" is a common mistake. A ControlLogix with 50 connections at 2ms RPI will max out its network capacity. Use 10ms for drives, 20ms for remote I/O, 100ms for monitoring-only connections.

### Produced/Consumed Tags

Used for: PLC-to-PLC data sharing

- Producer creates a tag and broadcasts it
- One or more consumers subscribe to that tag
- RPI determines update rate
- If the producer goes offline, consumers detect the loss within the timeout multiplier

### MSG Instructions

Used for: On-demand reads/writes, recipe downloads, data logging

- Runs over explicit messaging (TCP)
- Non-deterministic — timing depends on network load
- Must be triggered by logic (not continuous)
- Common use: Reading VFD parameters, writing recipe values

## Diagnosing Network Faults in RSLogix/Studio 5000

### Module Properties → Connection Tab

Every networked module shows connection status:

| Status | Meaning | Action |
|--------|---------|--------|
| Running | Normal operation | None |
| Inhibited | Manually disabled | Check if intentional |
| Faulted | Connection lost | Check cable, IP, switch |
| Validating | Establishing connection | Wait, or check config |

### Common Fault Codes

| Code | Description | Likely Cause |
|------|-------------|-------------|
| 16#0107 | Connection not found | Wrong IP or module offline |
| 16#0109 | Connection timeout | Network issue, RPI too fast |
| 16#0114 | Module type mismatch | Wrong firmware or config |
| 16#0203 | Connection already exists | Duplicate connection |

## Network Troubleshooting Checklist

1. **Check the PLC I/O tree** — Is the module faulted? What's the fault code?
2. **Ping the device** — From the PLC's Ethernet port or a laptop on the same network
3. **Check switch port** — Link light? Error counters? Right VLAN?
4. **Verify IP settings** — Device IP, subnet mask, gateway all correct?
5. **Check RPI and timeout** — Is the timeout multiplier reasonable (4× minimum)?
6. **Review network load** — Too many fast connections saturating bandwidth?

## Glossary

| Term | Definition |
|------|-----------|
| **RPI** | Requested Packet Interval — cyclic update rate for implicit connections |
| **Produced tag** | A tag broadcast by one PLC for others to consume |
| **Consumed tag** | A tag received from another PLC's produced tag |
| **MSG instruction** | PLC instruction for on-demand network reads/writes |
| **Connection timeout** | Time before a lost connection triggers a fault |
| **I/O tree** | Hierarchical view of all networked modules in the PLC project |
`
  },
];

// ============================================================
// 2. SENSORS & INSTRUMENTATION
// ============================================================
const sensorsLessons = [
  {
    slug: 'proximity-sensors-photoeyes',
    title: 'Proximity Sensors & Photoeyes: Selection, Wiring & Troubleshooting',
    orderIndex: 1,
    estimatedMinutes: 25,
    content: `# Proximity Sensors & Photoeyes

## The Eyes and Ears of Automation

Proximity sensors and photoeyes are the most common field devices in any automated facility. They detect presence, position, count parts, verify operations, and trigger sequences. When one fails, the machine stops — and knowing how to quickly diagnose the failure separates a good technician from a great one.

## Proximity Sensor Types

### Inductive Proximity Sensors

Detect **metal targets only** using an oscillating electromagnetic field.

| Specification | Typical Range | Notes |
|--------------|---------------|-------|
| Sensing distance | 2-30mm | Depends on target size and material |
| Switching frequency | 500-5000 Hz | How fast it can toggle |
| Output type | NPN, PNP, or analog | Must match PLC input card |
| Supply voltage | 10-30 VDC | Standard industrial range |

**Target material correction factors:**

| Material | Factor | Example: 10mm rated sensor |
|----------|--------|---------------------------|
| Mild steel | 1.0 | Detects at 10mm |
| Stainless steel | 0.7 | Detects at 7mm |
| Aluminum | 0.4 | Detects at 4mm |
| Copper | 0.3 | Detects at 3mm |

> **Field Reality:** A sensor rated for 10mm on steel will only detect aluminum at 4mm. If someone replaces a steel bracket with aluminum and the sensor stops working, this is why.

### Capacitive Proximity Sensors

Detect **any material** (metal, plastic, liquid, powder) by measuring changes in capacitance.

- Use for: Level detection in tanks, detecting plastic bottles, counting cardboard boxes
- Sensitivity is adjustable — critical for ignoring thin materials while detecting thick ones
- Affected by moisture and contamination more than inductive sensors

### Photoelectric Sensors (Photoeyes)

Use light beams to detect presence:

| Type | How It Works | Best For |
|------|-------------|----------|
| Through-beam | Separate emitter and receiver | Long range (up to 30m), dusty environments |
| Retro-reflective | Emitter/receiver in one housing, reflects off reflector | Medium range, easy alignment |
| Diffuse | Emitter/receiver in one housing, reflects off target | Short range, color-sensitive |
| Background suppression | Ignores objects beyond set distance | Precise position detection |

## Wiring: NPN vs. PNP

This is the #1 source of sensor wiring mistakes:

| Type | Switching | Common Wire | PLC Input Type |
|------|-----------|-------------|----------------|
| **PNP** (sourcing) | Switches +V to output | Connect to 0V (common) | Sinking input card |
| **NPN** (sinking) | Switches 0V to output | Connect to +V (common) | Sourcing input card |

### Wire Color Standards (Most Manufacturers)

| Wire | Color | Function |
|------|-------|----------|
| +V (supply) | Brown | 24VDC positive |
| 0V (supply) | Blue | 24VDC negative |
| Output | Black | Signal wire to PLC |
| N/O vs N/C | White | Second output (if available) |

## Troubleshooting Sensors

### Quick Diagnostic Steps

1. **Check the indicator LED** — Most sensors have a built-in LED that lights when the output is active
2. **Measure supply voltage** — Should be 20-28VDC at the sensor (not at the power supply)
3. **Measure output voltage** — PNP: ~24V when active, ~0V when inactive. NPN: opposite.
4. **Check for physical damage** — Cracked face, cut cable, bent mounting bracket
5. **Check for contamination** — Dust, oil, metal shavings on the sensing face

### Common Failure Modes

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Always ON | Short in cable, sensor stuck | Check cable, replace sensor |
| Always OFF | No power, broken wire, target too far | Check voltage, check gap |
| Intermittent | Loose connection, vibration, marginal gap | Tighten, adjust gap |
| Slow response | Wrong sensor type, dirty lens | Clean or replace |

## Glossary

| Term | Definition |
|------|-----------|
| **NPN** | Sinking output — switches ground to the load |
| **PNP** | Sourcing output — switches positive voltage to the load |
| **Sensing distance** | Maximum gap between sensor face and target for reliable detection |
| **Hysteresis** | Difference between switch-on and switch-off distances (prevents chatter) |
| **Through-beam** | Photoeye with separate emitter and receiver units |
| **Retro-reflective** | Photoeye that bounces light off a reflector back to the sensor |
| **Diffuse** | Photoeye that detects light reflected directly from the target |
`
  },
  {
    slug: 'analog-signals-4-20ma',
    title: 'Analog Signals: 4-20mA, 0-10V & Scaling',
    orderIndex: 2,
    estimatedMinutes: 22,
    content: `# Analog Signals: 4-20mA, 0-10V & Scaling

## Beyond On/Off: The Analog World

Digital sensors tell you "yes" or "no." Analog sensors tell you "how much." Temperature, pressure, flow rate, level, speed — these are all continuous values that require analog signals.

## The 4-20mA Standard

The 4-20mA current loop is the dominant analog signal in industrial automation:

| Signal Level | Meaning |
|-------------|---------|
| 4 mA | 0% of range (zero) |
| 12 mA | 50% of range (midpoint) |
| 20 mA | 100% of range (full scale) |
| 0 mA | **Wire broken** (fault condition) |
| < 3.8 mA | Under-range (sensor fault) |
| > 20.5 mA | Over-range (sensor fault) |

### Why 4-20mA Instead of 0-20mA?

The "live zero" at 4mA is the key advantage: if the signal drops to 0mA, you know the wire is broken — not that the process value is zero. This is a critical safety feature.

> **Field Reality:** A tank level transmitter reading 0mA doesn't mean the tank is empty — it means you've lost the signal. If you assume the tank is empty and start filling, you could overflow it. The 4mA live zero prevents this exact scenario.

### Scaling Formula

To convert a 4-20mA signal to engineering units:

$$\\text{Value} = \\text{Range Low} + \\frac{(\\text{mA} - 4)}{16} \\times (\\text{Range High} - \\text{Range Low})$$

**Example:** Pressure transmitter, 0-100 PSI range, reading 14.4 mA:

$$\\text{PSI} = 0 + \\frac{(14.4 - 4)}{16} \\times 100 = 65 \\text{ PSI}$$

| mA Reading | 0-100 PSI | 0-500°F | 0-200 GPM |
|-----------|-----------|---------|-----------|
| 4.0 | 0 PSI | 0°F | 0 GPM |
| 8.0 | 25 PSI | 125°F | 50 GPM |
| 12.0 | 50 PSI | 250°F | 100 GPM |
| 16.0 | 75 PSI | 375°F | 150 GPM |
| 20.0 | 100 PSI | 500°F | 200 GPM |

## 0-10V Signals

Voltage signals are simpler but less noise-immune:

| Feature | 4-20mA | 0-10V |
|---------|--------|-------|
| Noise immunity | Excellent (current loop) | Poor (voltage drop over distance) |
| Wire length | Up to 2000m | Under 30m recommended |
| Wire break detection | Yes (0mA = fault) | No (0V = zero or broken) |
| Common use | Process instruments | Local devices, VFD speed reference |

## Measuring Analog Signals

### With a Multimeter

- **4-20mA:** Set meter to mA DC, connect in **series** with the signal wire
- **0-10V:** Set meter to V DC, connect in **parallel** across signal terminals

### PLC Analog Input Cards

| Specification | Typical Value |
|--------------|---------------|
| Input range | 4-20mA or 0-10V (selectable) |
| Resolution | 12-bit (4096 counts) or 16-bit (65536 counts) |
| Conversion time | 1-10ms per channel |
| Accuracy | ±0.1% of full scale |

### Scaling in the PLC

Raw counts from the analog card must be scaled to engineering units:

| Raw Count | 4-20mA | Engineering Value (0-100 PSI) |
|-----------|--------|-------------------------------|
| 0 | 4 mA | 0 PSI |
| 16383 | 20 mA | 100 PSI |

## Troubleshooting Analog Signals

| Symptom | Check | Likely Cause |
|---------|-------|-------------|
| Reading 0 mA | Wire continuity | Broken wire or loose terminal |
| Reading stuck at 4 mA | Transmitter power | No power to transmitter |
| Reading stuck at 20 mA | Process value | Actual over-range or sensor fault |
| Erratic readings | Shielding, grounding | EMI interference, ground loop |
| Offset error | Calibration | Transmitter needs zero/span adjustment |

## Glossary

| Term | Definition |
|------|-----------|
| **4-20mA** | Standard industrial current signal where 4mA = 0% and 20mA = 100% |
| **Live zero** | Using 4mA (not 0mA) as the zero point to detect wire breaks |
| **Scaling** | Converting raw signal to engineering units |
| **Loop-powered** | Transmitter powered by the same 2 wires carrying the signal |
| **Ground loop** | Unwanted current path through ground connections causing signal errors |
| **Resolution** | Number of discrete steps in the analog-to-digital conversion |
`
  },
  {
    slug: 'temperature-pressure-measurement',
    title: 'Temperature & Pressure Measurement in Industrial Systems',
    orderIndex: 3,
    estimatedMinutes: 20,
    content: `# Temperature & Pressure Measurement

## Temperature Measurement

### RTDs (Resistance Temperature Detectors)

The most accurate temperature sensor for industrial use:

| Specification | PT100 | PT1000 |
|--------------|-------|--------|
| Resistance at 0°C | 100Ω | 1000Ω |
| Temperature coefficient | 0.385Ω/°C | 3.85Ω/°C |
| Range | -200°C to +850°C | -200°C to +850°C |
| Accuracy | ±0.1°C (Class A) | ±0.1°C (Class A) |
| Wire configuration | 2, 3, or 4 wire | 2 or 4 wire |

**3-Wire vs. 4-Wire RTDs:**

- **2-wire:** Cheapest, but wire resistance adds error. Only for short runs.
- **3-wire:** Compensates for wire resistance. Standard industrial choice.
- **4-wire:** Most accurate. Used for laboratory and critical process measurements.

### Thermocouples

Generate a voltage proportional to temperature difference between two junctions:

| Type | Range | Color Code | Common Use |
|------|-------|-----------|------------|
| J | -40 to 750°C | White/Red | General purpose, ovens |
| K | -200 to 1250°C | Yellow/Red | High temp, furnaces |
| T | -200 to 350°C | Blue/Red | Low temp, cryogenics |
| E | -200 to 900°C | Purple/Red | High sensitivity |

> **Field Reality:** Thermocouple extension wire MUST match the thermocouple type. Using Type K extension wire on a Type J thermocouple introduces a measurement error of 5-15°C. This is a common installation mistake.

## Pressure Measurement

### Pressure Transmitter Types

| Type | Measures | Application |
|------|----------|-------------|
| Gauge | Relative to atmosphere | Most common — pump discharge, tank pressure |
| Absolute | Relative to vacuum | Vacuum systems, altitude compensation |
| Differential | Difference between two points | Flow measurement, filter monitoring |

### Common Pressure Units

| Unit | Conversion |
|------|-----------|
| PSI | 1 PSI = 6.895 kPa |
| Bar | 1 Bar = 14.504 PSI |
| inH₂O | 1 inH₂O = 0.0361 PSI |
| mmHg | 1 mmHg = 0.0193 PSI |

### Installation Best Practices

1. **Mount transmitter below the process connection** for liquid service (prevents air pockets)
2. **Mount transmitter above the process connection** for gas/steam service (prevents condensate)
3. **Use impulse tubing** — never connect directly to a vibrating pipe
4. **Install a valve** between the process and transmitter for isolation during maintenance

## Calibration Fundamentals

### Zero and Span Adjustment

Every analog instrument has two calibration points:

| Adjustment | What It Does | When to Adjust |
|-----------|-------------|----------------|
| **Zero** | Sets the 4mA point | When reading is offset at low end |
| **Span** | Sets the 20mA point | When reading is wrong at high end |

### 5-Point Calibration Check

Apply known inputs at 0%, 25%, 50%, 75%, and 100% of range. Record the mA output at each point:

| Applied | Expected mA | Acceptable Range (±0.25%) |
|---------|------------|--------------------------|
| 0% | 4.000 mA | 3.960 - 4.040 mA |
| 25% | 8.000 mA | 7.960 - 8.040 mA |
| 50% | 12.000 mA | 11.960 - 12.040 mA |
| 75% | 16.000 mA | 15.960 - 16.040 mA |
| 100% | 20.000 mA | 19.960 - 20.040 mA |

## Glossary

| Term | Definition |
|------|-----------|
| **RTD** | Resistance Temperature Detector — measures temperature via resistance change |
| **Thermocouple** | Temperature sensor using the Seebeck effect (voltage from dissimilar metals) |
| **Cold junction compensation** | Correcting thermocouple reading for the reference junction temperature |
| **Gauge pressure** | Pressure measured relative to atmospheric pressure |
| **Differential pressure** | Difference in pressure between two points |
| **Calibration** | Adjusting an instrument to read correctly against a known standard |
`
  },
];

// ============================================================
// 3. ROBOTICS FUNDAMENTALS
// ============================================================
const roboticsLessons = [
  {
    slug: 'industrial-robot-types',
    title: 'Industrial Robot Types, Axes & Applications',
    orderIndex: 1,
    estimatedMinutes: 22,
    content: `# Industrial Robot Types, Axes & Applications

## Why Maintenance Techs Need Robot Knowledge

Industrial robots are everywhere — welding, palletizing, machine tending, painting, assembly. As a maintenance technician, you won't be programming robots from scratch, but you will:

- Troubleshoot E-stops and safety circuits that interface with robots
- Replace sensors, grippers, and end-of-arm tooling
- Diagnose communication faults between robots and PLCs
- Perform mechanical maintenance (grease, belts, gearboxes)
- Recover from faults and restart production

## Robot Types by Configuration

### 6-Axis Articulated (Most Common)

The "standard" industrial robot — a jointed arm with 6 degrees of freedom:

| Axis | Motion | Equivalent |
|------|--------|-----------|
| J1 | Base rotation | Waist twist |
| J2 | Lower arm | Shoulder |
| J3 | Upper arm | Elbow |
| J4 | Wrist rotation | Forearm roll |
| J5 | Wrist bend | Wrist up/down |
| J6 | Tool flange rotation | Hand twist |

**Common brands:** FANUC, ABB, KUKA, Yaskawa/Motoman, Universal Robots

### SCARA (Selective Compliance Assembly Robot Arm)

4-axis robot optimized for fast pick-and-place:
- Rigid in Z (vertical), compliant in X-Y (horizontal)
- Very fast cycle times (sub-second)
- Used for: Assembly, packaging, PCB insertion

### Delta (Spider) Robots

Parallel kinematic robot for ultra-high-speed picking:
- 3 or 4 axes
- Cycle times under 0.5 seconds
- Used for: Food packaging, pharmaceutical sorting

### Collaborative Robots (Cobots)

Designed to work alongside humans without safety fencing:
- Force-limited joints (stop on contact)
- Lower speed and payload than industrial robots
- Used for: Machine tending, quality inspection, light assembly

## Key Specifications

| Specification | What It Means | Typical Range |
|--------------|---------------|---------------|
| Payload | Max weight at tool flange | 3 kg (cobot) to 2300 kg (heavy-duty) |
| Reach | Maximum distance from base | 500mm to 4000mm |
| Repeatability | How precisely it returns to a point | ±0.01mm to ±0.1mm |
| Speed | Maximum joint/TCP speed | 1-12 m/s |
| IP rating | Environmental protection | IP54 to IP67 |

## Robot Safety Systems

### Safety-Rated Signals

| Signal | Purpose | Type |
|--------|---------|------|
| E-Stop | Emergency stop — removes power from drives | Dual-channel, Category 0 or 1 |
| Safety fence | Detects if fence gate is open | Interlock switch, dual-channel |
| Light curtain | Detects human entry into work envelope | Type 4 safety-rated |
| Enabling device | 3-position switch for teach mode | Deadman switch on teach pendant |

> **Field Reality:** The #1 robot safety incident cause is bypassing safety interlocks "just to test something." Never bypass a safety circuit, even temporarily. Use the teach pendant in reduced-speed mode instead.

## Maintenance Technician's Robot Checklist

| Check | Frequency | What to Look For |
|-------|-----------|-----------------|
| Grease joints | Per manufacturer schedule | Proper grease type and quantity |
| Check cables | Monthly | Wear, kinks, exposed conductors |
| Battery backup | Annually | Encoder batteries (position memory) |
| Brake test | Quarterly | Each axis holds position with servo off |
| Repeatability | Semi-annually | Teach a point, return 10 times, measure deviation |

## Glossary

| Term | Definition |
|------|-----------|
| **TCP** | Tool Center Point — the reference point at the end of the robot's tool |
| **Teach pendant** | Handheld device for jogging and programming the robot |
| **Home position** | Known reference position for all axes |
| **Singularity** | Configuration where the robot loses a degree of freedom |
| **Payload** | Maximum weight the robot can carry at the tool flange |
| **Cycle time** | Total time for one complete operation sequence |
`
  },
  {
    slug: 'robot-plc-integration',
    title: 'Robot-PLC Integration & Communication',
    orderIndex: 2,
    estimatedMinutes: 20,
    content: `# Robot-PLC Integration & Communication

## Why Robots Talk to PLCs

A robot rarely works alone. It's part of a larger automated system controlled by a PLC:

- PLC tells robot: "Part is ready, start cycle"
- Robot tells PLC: "Cycle complete, part placed"
- PLC coordinates conveyors, clamps, sensors around the robot
- Safety system connects both robot and PLC

## Communication Methods

### Digital I/O (Simplest)

Direct wiring between robot I/O and PLC I/O:

| Signal | Direction | Purpose |
|--------|-----------|---------|
| Start cycle | PLC → Robot | Trigger robot program |
| Cycle complete | Robot → PLC | Robot finished, ready for next |
| Robot ready | Robot → PLC | Robot in auto, no faults |
| Robot faulted | Robot → PLC | Robot has an active fault |
| Part present | PLC → Robot | Sensor confirms part in position |
| Gripper open/close | Robot → PLC | Pneumatic valve commands |

**Advantages:** Simple, reliable, easy to troubleshoot
**Disadvantages:** Limited data, lots of wiring, no diagnostics

### Ethernet/IP (Most Common Modern Method)

Robot and PLC communicate over the plant network:

- Robot acts as an Ethernet/IP adapter (slave)
- PLC is the scanner (master)
- Exchange I/O data at 10-100ms intervals
- Also allows parameter reads/writes via explicit messaging

**Typical data exchange:**

| PLC → Robot | Robot → PLC |
|-------------|-------------|
| Program number to run | Current program number |
| Start/stop commands | Robot status (ready, running, faulted) |
| Part type/recipe | Current position data |
| Speed override | Cycle count |

### Fieldbus Protocols

| Protocol | Robot Brands | PLC Brands |
|----------|-------------|------------|
| Ethernet/IP | FANUC, ABB, UR | Allen-Bradley, Omron |
| PROFINET | KUKA, ABB | Siemens |
| DeviceNet | FANUC, Yaskawa | Allen-Bradley |
| CC-Link | Mitsubishi | Mitsubishi |

## Troubleshooting Robot-PLC Communication

### Common Issues

| Symptom | Likely Cause | Diagnostic Step |
|---------|-------------|----------------|
| Robot won't start | Start signal not received | Check PLC output, check robot input |
| PLC doesn't see "cycle complete" | Robot output not mapped | Check robot I/O configuration |
| Intermittent comm loss | Network issue | Check Ethernet cable, switch port |
| Wrong program runs | Program number mismatch | Verify PLC sends correct value |
| Robot faults on start | Safety circuit not satisfied | Check all safety signals |

### Diagnostic Process

1. **Check the PLC first** — Is it sending the start signal? Monitor the output in the PLC program.
2. **Check the robot I/O** — On the teach pendant, view the I/O monitor. Is the signal arriving?
3. **Check the network** — If using Ethernet/IP, ping the robot from the PLC subnet.
4. **Check the robot program** — Is it waiting for the correct input signal?
5. **Check safety** — All safety signals must be satisfied before the robot will move in auto mode.

## Glossary

| Term | Definition |
|------|-----------|
| **Scanner** | The master device that initiates communication (usually the PLC) |
| **Adapter** | The slave device that responds to the scanner (usually the robot) |
| **Handshake** | Signal exchange pattern confirming both sides are ready |
| **Interlock** | Signal that must be true before an action is allowed |
| **I/O mapping** | Assigning physical I/O points to logical signals in the program |
`
  },
  {
    slug: 'robot-maintenance-troubleshooting',
    title: 'Robot Maintenance & Fault Recovery',
    orderIndex: 3,
    estimatedMinutes: 18,
    content: `# Robot Maintenance & Fault Recovery

## Preventive Maintenance Schedule

### Daily Checks (Operator Level)

| Check | Method | Action If Failed |
|-------|--------|-----------------|
| Visual inspection | Look for leaks, loose cables, damage | Report to maintenance |
| Air pressure | Check regulator gauge | Adjust to spec |
| Cycle time | Compare to baseline | Investigate if >10% slower |
| Unusual sounds | Listen during operation | Report grinding, clicking, whining |

### Monthly Checks (Maintenance Level)

| Check | Method | Spec |
|-------|--------|------|
| Cable dress-out | Inspect robot cables for wear | No exposed conductors, no kinks |
| Teach pendant | Test all buttons, E-stop | All functions operational |
| Brake test | Servo off, check each axis holds | No drift > 0.5mm |
| Repeatability | Teach point, return 10×, measure | Within ±0.1mm |
| Backup | Save programs to USB/network | Current backup available |

### Annual Checks

| Check | Method | Notes |
|-------|--------|-------|
| Grease all axes | Per manufacturer spec | Use ONLY specified grease type |
| Replace batteries | Encoder backup batteries | Loss = loss of all positions |
| Belt tension | Check timing belts on J1-J3 | Replace if cracked or stretched |
| Gearbox oil | Check level, look for metal particles | Replace if contaminated |
| Calibration | Run mastering procedure | After any mechanical work |

> **Field Reality:** The #1 cause of catastrophic robot failure is using the wrong grease. FANUC robots require specific Harmonic Drive grease. Using standard bearing grease destroys the strain wave gears within months. Always check the manual.

## Common Fault Recovery

### Overcurrent / Overload Faults

| Fault | Cause | Recovery |
|-------|-------|---------|
| Servo overload | Collision, stuck part, worn bearing | Clear fault, jog slowly to check |
| Overcurrent | Short in motor cable, drive failure | Check cables, check drive |
| Overtravel | Axis past software limit | Jog back within limits |

### Communication Faults

| Fault | Cause | Recovery |
|-------|-------|---------|
| Comm timeout | Network cable disconnected | Reconnect, clear fault |
| I/O error | Module failure, wiring issue | Check module LEDs, check wiring |
| Safety fault | E-stop, fence open, light curtain | Clear safety condition, reset |

### Position Loss / Mastering

If encoder batteries die or a motor is replaced:

1. **Mechanical mastering** — Align each axis to a known mechanical position using witness marks
2. **Software mastering** — Enter the known position values into the controller
3. **Verify** — Jog to several taught points and verify position accuracy

## Emergency Procedures

### Robot Won't Stop (Runaway)

1. Hit the E-stop on the teach pendant
2. Hit the E-stop on the cell controller
3. If neither works, disconnect power at the main disconnect
4. **Never reach into the work envelope** — the robot may restart unexpectedly

### Robot Collision Recovery

1. Switch to teach mode (reduced speed)
2. Enable the teach pendant deadman switch
3. Slowly jog the robot away from the obstruction
4. Inspect for damage: bent tooling, loose bolts, cable damage
5. Run a test cycle at reduced speed before returning to auto

## Glossary

| Term | Definition |
|------|-----------|
| **Mastering** | Calibrating the robot's joint positions to a known reference |
| **Servo overload** | Motor drawing more current than rated, usually from collision or binding |
| **Deadman switch** | 3-position enabling device on teach pendant (squeeze to enable) |
| **Brake release** | Manually releasing axis brakes for maintenance or recovery |
| **Witness marks** | Physical alignment marks on robot joints for mastering reference |
`
  },
];

// ============================================================
// 4. PRINT READING (ELECTRICAL)
// ============================================================
const printReadingLessons = [
  {
    slug: 'electrical-schematic-basics',
    title: 'Reading Electrical Schematics: Symbols, Conventions & Layout',
    orderIndex: 1,
    estimatedMinutes: 25,
    content: `# Reading Electrical Schematics

## Why Print Reading Is Non-Negotiable

You cannot troubleshoot what you cannot read. Electrical schematics are the roadmap of every machine. Without them, you're guessing — and guessing with 480V can kill you.

## Schematic vs. Wiring Diagram vs. Layout

| Type | Shows | Used For |
|------|-------|----------|
| **Schematic (ladder)** | Logical circuit connections | Understanding how the circuit works |
| **Wiring diagram** | Physical wire connections | Connecting wires at terminals |
| **Layout drawing** | Physical location of components | Finding components in the panel |

${ELECTRICAL_SCHEMATIC_SYMBOLS_SECTION}

## Reading a Ladder Diagram

### The Rules

1. **Power flows left to right** — Hot on the left rail, return on the right rail (see rail labels below)
2. **Read top to bottom** — Circuits are numbered by rung
3. **Contacts control coils** — Inputs (left side) control outputs (right side)
4. **Cross-references** — A coil on rung 5 may have contacts on rungs 12, 15, and 23
5. **Wire numbers** — Every wire has a unique number for identification

### Control circuit rails vs. three-phase power labels

On **120VAC motor control ladders** (most MCC buckets), prints typically use:

| Label on print | Meaning |
|--------------|---------|
| **L1**, **Line**, or **Wire 1** | Control hot (120VAC from the control transformer) |
| **N**, **Neutral**, or **Wire 2** | Control neutral / grounded leg (0V reference) |

On **480VAC three-phase power** single-line or power diagrams, **L1, L2, and L3 are phase conductors** — not neutral. A delta-connected 480V system has **no neutral**. Only wye systems (e.g., 480Y/277V) provide a grounded neutral conductor.

> **Field rule:** Read the drawing title and voltage note before assuming a rail label. **L2 on a control ladder is still wrong for neutral** — use **N** or **Wire 2** on 120V control prints. **L2 on a power diagram is a phase**, not the control return.

### Example: Basic Motor Start/Stop Circuit

\`\`\`
Rung 1: ─]Stop[──]Start[──────────(M)─
                    │
                   ]M[  (seal-in contact)
\`\`\`

Reading this:
- The Stop button (NC) must be closed (not pressed)
- Either the Start button (NO) OR the M seal-in contact must be closed
- When both conditions are met, the M coil energizes
- The M contact seals in, keeping the motor running after Start is released
- Pressing Stop opens the NC contact, dropping the M coil

## Cross-Referencing

When you see a coil labeled "CR5" on rung 10, you need to find all contacts labeled "CR5" throughout the print:

| Location | Type | Rung | Purpose |
|----------|------|------|---------|
| CR5 coil | Coil | 10 | Energized by safety circuit |
| CR5 | NO contact | 15 | Enables conveyor motor |
| CR5 | NO contact | 22 | Enables robot start |
| CR5 | NC contact | 30 | Alarm if safety lost |

> **Field Reality:** The fastest troubleshooters don't just read the rung with the problem — they trace every cross-reference. If motor M3 won't start, they check every contact in that rung's circuit, then check what controls each of those contacts.

## Glossary

| Term | Definition |
|------|-----------|
| **Ladder diagram** | Schematic format resembling a ladder, with power rails and rungs |
| **Rung** | One horizontal circuit in a ladder diagram |
| **Cross-reference** | Notation showing where a relay's contacts are used in other rungs |
| **NO** | Normally Open — contact is open when the device is at rest |
| **NC** | Normally Closed — contact is closed when the device is at rest |
| **Seal-in** | A contact that maintains a circuit after the initiating device releases |
| **Wire number** | Unique identifier for each wire in the system |
| **Control hot (Wire 1)** | Left rail of a 120VAC control ladder — not the same as 480V line L1 unless the print says so |
| **Control neutral (Wire 2)** | Right rail return for 120VAC control — do not label this "L2" on control prints |
`
  },
  {
    slug: 'panel-layout-wire-tracing',
    title: 'Panel Layout Drawings & Wire Tracing Techniques',
    orderIndex: 2,
    estimatedMinutes: 20,
    content: `# Panel Layout Drawings & Wire Tracing

## From Schematic to Physical Panel

A schematic tells you HOW the circuit works. A panel layout tells you WHERE the components are. You need both to troubleshoot efficiently.

## Panel Layout Drawing Elements

| Element | What It Shows |
|---------|--------------|
| Component outlines | Physical size and position of each device |
| DIN rail locations | Where components are mounted |
| Wire duct paths | Cable routing channels |
| Terminal strip locations | Where external wires connect |
| Door-mounted devices | Buttons, lights, HMI on the panel door |

## Terminal Strip Numbering

Terminal strips are the interface between the panel and the field:

| Convention | Example | Meaning |
|-----------|---------|---------|
| TB1-1 | Terminal Block 1, Terminal 1 | First terminal on first strip |
| X1:3 | Terminal strip X1, position 3 | European convention |
| 100-1 | Wire 100, terminal 1 | Wire-number based |

### Reading Terminal Drawings

Each terminal shows:
- **Wire number** coming in from the left (panel side)
- **Terminal designation** (TB1-5)
- **Wire number** going out to the right (field side)

## Wire Tracing Methodology

### Step 1: Start at the Schematic

Identify the circuit you need to trace. Note the wire numbers.

### Step 2: Find the Components

Use the panel layout to locate each component physically.

### Step 3: Trace Wire by Wire

| Wire Number | From | To | Status |
|-------------|------|-----|--------|
| 101 | L1 disconnect | Fuse F1 | 480V present ✓ |
| 102 | Fuse F1 | Contactor M1 | 480V present ✓ |
| 103 | Contactor M1 | OL relay | 0V ✗ (contactor open) |
| 104 | OL relay | Motor T1 | 0V ✗ |

### Step 4: Identify the Break

The voltage drops between wire 102 and 103 — the contactor is not pulling in. Now check the control circuit that operates the contactor.

## Common Panel Components and Their Locations

| Component | Typical Location | Why |
|-----------|-----------------|-----|
| Main disconnect | Top left, accessible | Safety requirement |
| Fuses/breakers | Top area | Heat rises, easy access |
| Contactors/relays | Middle area | Central to wiring |
| PLC | Middle, accessible | Programming access |
| Terminal strips | Bottom | Field wiring enters from bottom |
| Power supplies | Top or side | Heat dissipation |
| VFDs | Side or separate enclosure | Heat and EMI |

> **Field Reality:** The fastest way to find a component in an unfamiliar panel: look at the wire number on the schematic, then look for that wire number on the terminal strips. Follow the wire from the terminal to the component.

## Glossary

| Term | Definition |
|------|-----------|
| **DIN rail** | Standard mounting rail for industrial panel components |
| **Wire duct** | Plastic channel for routing wires in a panel |
| **Terminal strip** | Row of connection points for external wiring |
| **Panel layout** | Drawing showing physical arrangement of components |
| **Field wiring** | Wires that connect from the panel to devices in the field |
| **Door-mounted** | Components installed on the panel door (buttons, HMI, lights) |
`
  },
  {
    slug: 'three-phase-power-prints',
    title: 'Three-Phase Power Distribution Prints',
    orderIndex: 3,
    estimatedMinutes: 22,
    content: `# Three-Phase Power Distribution Prints

## Understanding Three-Phase Power Drawings

Three-phase power is the backbone of industrial facilities. Reading power distribution prints is essential for:
- Tracing power from the utility to individual motors
- Understanding transformer connections (delta vs. wye)
- Identifying overcurrent protection coordination
- Planning safe lockout/tagout procedures

## Single-Line Diagrams

A single-line diagram shows the entire power distribution system using simplified symbols:

| Symbol | Component |
|--------|-----------|
| Single line | Three-phase bus (represents all 3 phases) |
| ─/─ | Disconnect or switch |
| ─▷─ | Fuse |
| ─□─ | Circuit breaker |
| ─⊗─ | Transformer |
| ─(M)─ | Motor |

### Reading a Typical Industrial Single-Line

\`\`\`
Utility (13.8kV) → Main Transformer → Main Switchgear (480V)
                                        ├── MCC-1 (Motor Control Center)
                                        │    ├── Motor M1 (50HP)
                                        │    ├── Motor M2 (25HP)
                                        │    └── Motor M3 (10HP)
                                        ├── Panel LP-1 (Lighting, 208/120V)
                                        └── Panel PP-1 (Receptacles)
\`\`\`

## Transformer Connections

### Delta (Δ) Connection

| Property | Value |
|----------|-------|
| Line voltage | = Phase voltage |
| Line current | = Phase current × √3 |
| Neutral | Not available |
| Common use | Motor loads, 480V distribution |

### Wye (Y) Connection

| Property | Value |
|----------|-------|
| Line voltage | = Phase voltage × √3 |
| Line current | = Phase current |
| Neutral | Available (center point) |
| Common use | 208/120V distribution, lighting |

### Common Transformer Configurations

| Primary | Secondary | Application |
|---------|-----------|-------------|
| Delta 480V | Wye 208/120V | Lighting and receptacle panels |
| Delta 480V | Delta 480V | Isolation transformer |
| Wye 480/277V | — | Direct lighting at 277V |

## Motor Circuit Elements on Prints

A complete motor branch circuit includes:

| Component | Symbol | Purpose | Sizing Rule |
|-----------|--------|---------|-------------|
| Branch circuit breaker | □ | Short circuit protection | 250% of FLA |
| Disconnect | /─ | Visible isolation for LOTO | ≥ 115% of FLA |
| Contactor | ( ) | Motor switching | ≥ FLA rating |
| Overload relay | OL | Running overcurrent protection | 115-125% of FLA |

### Full Load Amperage (FLA) Reference

| HP | 208V | 230V | 460V | 575V |
|----|------|------|------|------|
| 5 | 16.7 | 15.2 | 7.6 | 6.1 |
| 10 | 32.2 | 28 | 14 | 11 |
| 25 | 74.8 | 68 | 34 | 27 |
| 50 | 143 | 130 | 65 | 52 |
| 100 | 279 | 248 | 124 | 99 |

## Glossary

| Term | Definition |
|------|-----------|
| **Single-line diagram** | Simplified drawing showing power distribution using one line per circuit |
| **MCC** | Motor Control Center — enclosure housing multiple motor starters |
| **FLA** | Full Load Amperage — rated current draw of a motor at full load |
| **Delta** | Three-phase connection with no neutral, line voltage = phase voltage |
| **Wye** | Three-phase connection with neutral, line voltage = √3 × phase voltage |
| **LOTO** | Lockout/Tagout — safety procedure for isolating energy sources |
`
  },
];

// ============================================================
// 5. SAFETY SYSTEMS
// ============================================================
const safetyLessons = [
  {
    slug: 'machine-safety-fundamentals',
    title: 'Machine Safety Fundamentals: Standards, Categories & Risk Assessment',
    orderIndex: 1,
    estimatedMinutes: 25,
    content: `# Machine Safety Fundamentals

## Why Safety Systems Are Different

Safety systems are not regular control systems with extra features. They are independently designed, independently wired, and independently monitored systems whose sole purpose is preventing injury or death.

> **Critical Understanding:** A safety system must work even when the regular control system has failed completely. This is the fundamental principle that drives every design decision.

## Key Safety Standards

| Standard | Scope | Key Requirement |
|----------|-------|-----------------|
| **OSHA 29 CFR 1910** | US workplace safety | General duty clause, machine guarding |
| **NFPA 79** | Industrial machinery electrical | Electrical safety requirements |
| **ISO 13849** | Safety-related parts of control systems | Performance Levels (PL a-e) |
| **IEC 62061** | Safety integrity of control systems | Safety Integrity Levels (SIL 1-3) |
| **ANSI/RIA 15.06** | Robot safety | Robot cell safeguarding |

## Performance Levels (ISO 13849)

| Level | Probability of Dangerous Failure/Hour | Typical Application |
|-------|---------------------------------------|---------------------|
| PL a | ≥ 10⁻⁵ | Low-risk, single-channel |
| PL b | ≥ 3 × 10⁻⁶ | Basic safety functions |
| PL c | ≥ 10⁻⁶ | Standard machine guarding |
| PL d | ≥ 10⁻⁷ | Robot cells, presses |
| PL e | ≥ 10⁻⁸ | Highest risk applications |

## Safety Categories (ISO 13849)

| Category | Architecture | Behavior on Fault |
|----------|-------------|-------------------|
| B | Single channel, basic | Fault may cause loss of safety |
| 1 | Single channel, well-tried | Better components, same architecture |
| 2 | Single channel + monitoring | Periodic self-test detects faults |
| 3 | Dual channel | Single fault doesn't cause loss of safety |
| 4 | Dual channel + monitoring | Accumulation of faults detected |

### Category 3 (Most Common Industrial)

Two independent channels, each capable of performing the safety function:

\`\`\`
Input A ──→ Logic Channel A ──→ Output A
Input B ──→ Logic Channel B ──→ Output B
                    ↕
              Cross-monitoring
\`\`\`

If Channel A fails, Channel B still stops the machine. The cross-monitoring detects the fault and prevents restart.

## Risk Assessment Process

### Step 1: Identify Hazards

| Hazard Type | Examples |
|-------------|---------|
| Mechanical | Crushing, shearing, cutting, entanglement |
| Electrical | Shock, arc flash, electrocution |
| Thermal | Burns from hot surfaces, steam, molten material |
| Chemical | Exposure to toxic substances |
| Radiation | UV, laser, ionizing radiation |

### Step 2: Estimate Risk

Risk = Severity × Frequency × Probability of Avoiding

| Factor | Low | Medium | High |
|--------|-----|--------|------|
| Severity | Bruise | Broken bone | Fatality |
| Frequency | Yearly | Daily | Continuous |
| Avoidance | Easy to avoid | Possible | Impossible |

### Step 3: Select Safeguarding

| Risk Level | Safeguarding | Example |
|-----------|-------------|---------|
| Low | Warning signs, training | "Hot Surface" label |
| Medium | Guards, interlocks | Fixed guard with interlock switch |
| High | Safety-rated controls, dual-channel | Safety PLC, light curtains, E-stop |
| Very High | Elimination or substitution | Redesign to remove hazard |

## Glossary

| Term | Definition |
|------|-----------|
| **Performance Level (PL)** | ISO 13849 rating of a safety function's reliability |
| **SIL** | Safety Integrity Level — IEC 62061 equivalent of PL |
| **Category** | Architecture classification for safety-related control systems |
| **Dual-channel** | Two independent paths for the safety signal |
| **Cross-monitoring** | Each channel checks the other for discrepancies |
| **Risk assessment** | Systematic process to identify hazards and determine required safeguards |
| **Safe state** | The condition a machine must reach when a safety function activates |
`
  },
  {
    slug: 'safety-devices-wiring',
    title: 'Safety Devices: E-Stops, Light Curtains, Interlocks & Wiring',
    orderIndex: 2,
    estimatedMinutes: 22,
    content: `# Safety Devices: E-Stops, Light Curtains & Interlocks

## Emergency Stop (E-Stop) Systems

### E-Stop Requirements (NFPA 79 / IEC 60204)

| Requirement | Specification |
|-------------|--------------|
| Color | Red mushroom head on yellow background |
| Operation | Direct opening action (NC contacts) |
| Latching | Must latch in the activated position |
| Reset | Manual reset required (no automatic restart) |
| Wiring | Dual-channel (two independent NC contacts) |

### E-Stop Categories

| Category | Action | Application |
|----------|--------|-------------|
| **Category 0** | Immediate power removal | Highest risk, fastest stop |
| **Category 1** | Controlled stop, then power removal | When sudden stop could cause hazard |
| **Category 2** | Controlled stop, power maintained | Rarely used for E-stop |

### Wiring an E-Stop Circuit

\`\`\`
E-Stop 1 (NC) ──→ Safety Relay Ch.A ──→ Contactor K1 ──→ Motor Power
E-Stop 1 (NC) ──→ Safety Relay Ch.B ──→ Contactor K2 ──→ Motor Power
                                              ↕
                                    Feedback monitoring
\`\`\`

Both contactors must open to remove power. The safety relay monitors that both contactors actually opened (via auxiliary contacts fed back).

## Light Curtains

### Types and Ratings

| Type | Resolution | Application |
|------|-----------|-------------|
| Type 2 | 30-90mm | Finger detection |
| Type 4 | 14-30mm | Finger detection (higher reliability) |
| Type 4 | 40-90mm | Hand/arm detection |

### Installation Requirements

| Parameter | Calculation |
|-----------|------------|
| Safety distance | S = (K × T) + C |
| K | Hand approach speed (1600 mm/s for Type 4) |
| T | Total system response time (light curtain + safety relay + machine stop time) |
| C | Additional distance based on resolution |

**Example:** Light curtain response = 15ms, safety relay = 10ms, machine stop = 200ms
S = 1600 × (0.225) + 48 = 408mm minimum distance from hazard

## Safety Interlock Switches

### Types

| Type | Mechanism | Application |
|------|-----------|-------------|
| Mechanical interlock | Key actuator, positive-break NC | Guard doors, access panels |
| Magnetic interlock | Coded magnet | Harsh environments, high-cycle |
| Solenoid lock | Electrically locked until safe | Prevent opening during dangerous motion |
| Tongue interlock | Tongue key, positive opening | Small guard doors |

### Guard Locking

When a machine has dangerous run-down time (spindle coasting, press ram returning):

1. Guard door is **locked** while machine is running
2. Operator presses stop
3. Machine completes stop sequence
4. Safety system confirms zero motion
5. Guard lock releases
6. Operator can open door

> **Field Reality:** Never defeat a guard lock interlock. If the lock won't release, the machine hasn't confirmed safe state. Forcing it open means entering a space where dangerous motion may still be present.

## Safety Relay Modules

### How They Work

A safety relay module is a self-contained safety logic device:

| Input | Output | Function |
|-------|--------|----------|
| Dual-channel E-stop | Safety-rated relay contacts | Monitors inputs, controls outputs |
| Dual-channel interlock | Feedback monitoring inputs | Detects welded contacts |
| Reset button | Status LEDs | Indicates fault type |

### Common Safety Relay Brands

| Brand | Model Series | Common Application |
|-------|-------------|-------------------|
| Allen-Bradley | Guardmaster | E-stop, light curtain monitoring |
| Pilz | PNOZ | Universal safety relay |
| Sick | Flexi | Configurable safety controller |
| Banner | SC26 | Compact safety controller |

## Glossary

| Term | Definition |
|------|-----------|
| **E-Stop** | Emergency Stop — immediately removes hazardous energy |
| **Light curtain** | Optical safety device detecting objects crossing a light beam array |
| **Safety distance** | Minimum distance between safeguard and hazard zone |
| **Guard locking** | Preventing guard opening until machine reaches safe state |
| **Positive-break** | Contact mechanically forced open (cannot weld shut) |
| **Feedback monitoring** | Checking that output contactors actually switched |
| **Muting** | Temporarily bypassing a safety device under controlled conditions |
`
  },
  {
    slug: 'safety-plc-programming',
    title: 'Safety PLC Basics & Troubleshooting Safety Circuits',
    orderIndex: 3,
    estimatedMinutes: 20,
    content: `# Safety PLC Basics & Troubleshooting Safety Circuits

## Safety PLCs vs. Standard PLCs

| Feature | Standard PLC | Safety PLC |
|---------|-------------|-----------|
| Architecture | Single processor | Dual/triple redundant processors |
| I/O | Standard | Safety-rated (dual-channel, diagnostics) |
| Programming | Standard languages | Certified function blocks |
| Certification | None required | SIL 3 / PL e certified |
| Diagnostics | Basic | Comprehensive fault detection |
| Cost | Lower | 2-3× standard PLC |

## Common Safety PLC Platforms

| Platform | Manufacturer | Integration |
|----------|-------------|-------------|
| GuardLogix | Allen-Bradley | Integrates with ControlLogix |
| S7-1500F | Siemens | Integrates with S7-1500 |
| SmartGuard 600 | Allen-Bradley | Standalone safety controller |
| PSS 4000 | Pilz | Dedicated safety system |

## Safety Function Blocks

Safety PLCs use pre-certified function blocks instead of custom logic:

| Function Block | Purpose | Inputs |
|---------------|---------|--------|
| E-Stop | Monitor E-stop circuit | Dual-channel NC contacts |
| Light Curtain | Monitor light curtain | OSSD outputs from curtain |
| Guard Monitor | Monitor interlock switch | Dual-channel contacts |
| Two-Hand Control | Require both hands on buttons | Two NO buttons |
| Muting | Temporarily bypass safety device | Muting sensors + logic |

### Why Certified Function Blocks?

Custom safety logic could have bugs that compromise safety. Certified function blocks are:
- Tested to SIL 3 / PL e standards
- Verified by independent certification bodies (TUV, UL)
- Documented with known failure modes
- Validated through millions of hours of field operation

## Troubleshooting Safety Circuits

### The Golden Rule

> **Never bypass a safety circuit to troubleshoot it.** Use the diagnostic tools built into the safety system.

### Diagnostic Approach

1. **Check the safety relay/PLC status LEDs**
   - Green = normal operation
   - Red = fault detected
   - Flashing = specific fault code

2. **Read the fault log**
   - Safety PLCs log every fault with timestamp
   - Shows which input caused the fault
   - Shows the sequence of events

3. **Check input status**
   - View safety I/O in the programming software
   - Each input shows: signal state, discrepancy status, wire break detection

4. **Check for discrepancy faults**
   - Dual-channel inputs must agree within a time window (typically 500ms)
   - If Channel A opens but Channel B doesn't → discrepancy fault
   - Common cause: one contact welded, one switch misadjusted

### Common Safety Circuit Faults

| Fault | Cause | Resolution |
|-------|-------|-----------|
| Discrepancy | Channels don't agree | Check both switches/contacts |
| Cross-fault | Short between channels | Check wiring, repair insulation |
| Feedback fault | Contactor didn't switch | Check contactor, replace if welded |
| Reset required | Safety event occurred | Verify safe condition, press reset |
| Configuration error | Wrong parameters | Review safety program |

### Testing Safety Systems

| Test | Frequency | Method |
|------|-----------|--------|
| E-stop function | Monthly | Press each E-stop, verify machine stops |
| Light curtain | Monthly | Break beam, verify machine stops |
| Guard interlocks | Monthly | Open each guard, verify machine stops |
| Safety relay | Annually | Force fault conditions, verify response |
| Full validation | After any modification | Complete functional test per safety plan |

## Glossary

| Term | Definition |
|------|-----------|
| **Safety PLC** | PLC with redundant processors certified for safety applications |
| **Function block** | Pre-certified safety logic module |
| **Discrepancy** | Disagreement between dual-channel safety inputs |
| **OSSD** | Output Signal Switching Device — safety-rated output from a sensor |
| **Cross-fault** | Short circuit between the two channels of a safety circuit |
| **Validation** | Formal verification that the safety system meets its safety requirements |
`
  },
];

// ============================================================
// 6. PROCESS CONTROL
// ============================================================
const processControlLessons = [
  {
    slug: 'pid-control-fundamentals',
    title: 'PID Control Fundamentals for Maintenance Technicians',
    orderIndex: 1,
    estimatedMinutes: 25,
    content: `# PID Control Fundamentals

## What Is PID Control?

PID (Proportional-Integral-Derivative) control is the most common feedback control method in industrial automation. It continuously adjusts an output to keep a process variable at a desired setpoint.

**Real-world examples:**
- Maintaining tank temperature at 150°F by adjusting a steam valve
- Keeping tank level at 75% by adjusting an inlet pump speed
- Holding line pressure at 60 PSI by adjusting a compressor

## The Three Terms

### Proportional (P)

**What it does:** Output is proportional to the error (difference between setpoint and process variable).

| Error | P Output (Kp = 2) |
|-------|-------------------|
| +10°F | 20% output |
| +5°F | 10% output |
| 0°F | 0% output |
| -5°F | -10% output |

**Problem:** Proportional-only control always has a steady-state error (offset). The output needed to maintain the setpoint isn't zero, so there's always a gap.

### Integral (I)

**What it does:** Accumulates error over time and adds correction. Eliminates the steady-state offset that proportional-only control can't fix.

- If the process is 2°F below setpoint for 10 seconds, integral action increases the output
- The longer the error persists, the more integral action builds up
- **Integral windup:** If the error can't be corrected (valve fully open), integral keeps accumulating → overshoot when the constraint clears

### Derivative (D)

**What it does:** Responds to the rate of change of error. Provides "braking" action when the process variable is approaching setpoint quickly.

- If temperature is rising fast toward setpoint, derivative reduces the output early
- Prevents overshoot on fast-responding processes
- **Noise sensitivity:** Derivative amplifies signal noise, so it's often set to zero or very low

## PID Tuning for Maintenance Technicians

### When to Tune

| Symptom | Likely Cause | Adjustment |
|---------|-------------|-----------|
| Oscillation | P too high | Reduce P |
| Slow response | P too low | Increase P |
| Offset (never reaches setpoint) | No integral action | Add/increase I |
| Overshoot | I too aggressive | Reduce I, add D |
| Erratic output | D too high or noisy signal | Reduce D, filter input |

### Simple Tuning Method (Ziegler-Nichols)

1. Set I and D to zero
2. Increase P until the process oscillates steadily
3. Record the P value (Ku) and oscillation period (Tu)
4. Calculate:

| Controller | P | I | D |
|-----------|---|---|---|
| P only | 0.5 × Ku | — | — |
| PI | 0.45 × Ku | Tu / 1.2 | — |
| PID | 0.6 × Ku | Tu / 2 | Tu / 8 |

> **Field Reality:** Most industrial PID loops use PI control only (no derivative). Derivative is useful for temperature control but causes problems with noisy flow or pressure signals. When in doubt, leave D at zero.

## Common PID Applications

| Application | Typical Response | Tuning Priority |
|-------------|-----------------|-----------------|
| Temperature | Slow (minutes) | Moderate P, moderate I, some D |
| Pressure | Fast (seconds) | Low P, moderate I, no D |
| Flow | Very fast | Low P, fast I, no D |
| Level | Slow to moderate | Low P, slow I, no D |

## Glossary

| Term | Definition |
|------|-----------|
| **PID** | Proportional-Integral-Derivative — three-term feedback controller |
| **Setpoint (SP)** | The desired value of the process variable |
| **Process Variable (PV)** | The measured value of the process being controlled |
| **Error** | Difference between setpoint and process variable (SP - PV) |
| **Output (CV)** | Control Variable — the signal sent to the final control element |
| **Integral windup** | Excessive integral accumulation when the output is saturated |
| **Deadband** | Range around setpoint where no control action is taken |
`
  },
  {
    slug: 'control-valves-actuators',
    title: 'Control Valves, Actuators & Final Control Elements',
    orderIndex: 2,
    estimatedMinutes: 20,
    content: `# Control Valves, Actuators & Final Control Elements

## What Are Final Control Elements?

The final control element is the device that actually changes the process — the valve that opens, the heater that turns on, the pump that speeds up. The PID controller calculates what to do; the final control element does it.

## Control Valve Types

| Type | Flow Characteristic | Application |
|------|-------------------|-------------|
| Globe | Linear or equal percentage | Most common, precise control |
| Ball | Quick opening | On/off or moderate control |
| Butterfly | Near-linear | Large pipe, low pressure drop |
| Diaphragm | Depends on design | Sanitary, corrosive fluids |

### Flow Characteristics

| Characteristic | Behavior | When to Use |
|---------------|----------|-------------|
| Linear | Flow proportional to valve position | Constant pressure drop |
| Equal percentage | Small change at low opening, large at high | Variable pressure drop (most common) |
| Quick opening | Large change at low opening | On/off applications |

## Actuator Types

| Type | Signal | Fail Position | Application |
|------|--------|---------------|-------------|
| Pneumatic diaphragm | 3-15 PSI | Fail-open or fail-closed | Most common, reliable |
| Pneumatic piston | 3-15 PSI | Spring return | High thrust needed |
| Electric | 4-20mA or digital | Stays in place (no spring) | No air supply available |
| Hydraulic | Hydraulic pressure | Depends on design | Very high force |

### Fail-Safe Positions

| Application | Fail Position | Reason |
|-------------|--------------|--------|
| Cooling water | Fail-OPEN | Prevent overheating |
| Steam to heater | Fail-CLOSED | Prevent overheating |
| Feed to reactor | Fail-CLOSED | Prevent overfill |
| Vent valve | Fail-OPEN | Prevent overpressure |

> **Field Reality:** The fail-safe position is determined by process safety, not convenience. A cooling water valve that fails closed could destroy equipment worth millions. Always verify the fail position matches the process safety requirements.

## Valve Positioners

A positioner is a feedback controller mounted on the valve that ensures the valve actually goes where the control signal tells it:

| Without Positioner | With Positioner |
|-------------------|-----------------|
| Signal says 50%, valve might be at 45% | Signal says 50%, valve is at 50% ±1% |
| Friction, hysteresis cause errors | Positioner compensates automatically |
| Slow response | Fast, accurate response |

### When Is a Positioner Required?

- Any control valve in a PID loop (almost always)
- Split-range applications (two valves from one signal)
- Long pneumatic signal runs (>50 feet)
- High-friction packing

## Troubleshooting Control Valves

| Symptom | Likely Cause | Check |
|---------|-------------|-------|
| Valve won't move | No air supply, stuck packing | Check air pressure, stroke manually |
| Valve oscillates | Positioner tuning, oversized valve | Check positioner, check Cv sizing |
| Valve doesn't reach full open | Low air pressure, spring issue | Check supply pressure |
| Leaks through when closed | Seat damage, erosion | Inspect seat and plug |
| Slow response | Positioner fault, air leak | Check positioner, check tubing |

## Glossary

| Term | Definition |
|------|-----------|
| **Control valve** | Valve that modulates flow based on a control signal |
| **Actuator** | Device that converts a signal into physical valve movement |
| **Positioner** | Feedback device ensuring valve position matches the control signal |
| **Cv** | Flow coefficient — measure of a valve's flow capacity |
| **Fail-safe** | The position a valve goes to on loss of signal or air |
| **Split-range** | Two valves controlled by different portions of one 4-20mA signal |
| **Packing** | Sealing material around the valve stem preventing leaks |
`
  },
  {
    slug: 'process-instrumentation-loops',
    title: 'Process Instrumentation Loops & Loop Diagrams',
    orderIndex: 3,
    estimatedMinutes: 18,
    content: `# Process Instrumentation Loops & Loop Diagrams

## What Is an Instrument Loop?

An instrument loop is the complete measurement and control chain from sensor to final control element:

\`\`\`
Sensor → Transmitter → Controller (PLC/DCS) → Output → Control Valve
  ↑                                                        ↓
  └──────────── Process (temperature, pressure, flow) ─────┘
\`\`\`

## ISA Instrument Identification

Every instrument has a tag number following ISA-5.1 standard:

| Tag | Meaning |
|-----|---------|
| TT-101 | Temperature Transmitter, Loop 101 |
| PT-205 | Pressure Transmitter, Loop 205 |
| FT-310 | Flow Transmitter, Loop 310 |
| LT-401 | Level Transmitter, Loop 401 |
| TV-101 | Temperature Valve, Loop 101 |
| TIC-101 | Temperature Indicating Controller, Loop 101 |

### First Letter (Measured Variable)

| Letter | Variable |
|--------|----------|
| T | Temperature |
| P | Pressure |
| F | Flow |
| L | Level |
| A | Analysis (pH, conductivity) |

### Subsequent Letters (Function)

| Letter | Function |
|--------|----------|
| T | Transmitter |
| I | Indicator |
| C | Controller |
| V | Valve |
| E | Element (sensor) |
| S | Switch |
| R | Recorder |
| A | Alarm |

## Loop Diagrams

A loop diagram shows every device and wire in a single instrument loop:

### What a Loop Diagram Shows

| Element | Detail |
|---------|--------|
| Field devices | Transmitter, valve, sensor with tag numbers |
| Junction boxes | Terminal numbers, wire routing |
| Control room | PLC/DCS card, channel, terminal numbers |
| Power supply | Voltage, fuse protection |
| Wire numbers | Every wire identified |
| Cable numbers | Multi-conductor cable identification |
| Grounding | Shield grounding points |

### Reading a Typical Temperature Loop

\`\`\`
TE-101 (RTD) → TT-101 (Transmitter) → JB-10 → PLC AI Card → PID → AO Card → JB-11 → TV-101 (Valve)
\`\`\`

| Device | Tag | Signal | Wire |
|--------|-----|--------|------|
| RTD sensor | TE-101 | Resistance | 3-wire to TT-101 |
| Transmitter | TT-101 | 4-20mA | Cable C-101 to JB-10 |
| Junction box | JB-10 | — | TB1:1-2 |
| PLC input | AI:3/Ch4 | 4-20mA | Wire 101-1, 101-2 |
| PLC output | AO:5/Ch2 | 4-20mA | Wire 101-3, 101-4 |
| Junction box | JB-11 | — | TB2:5-6 |
| Control valve | TV-101 | 3-15 PSI | I/P converter |

## Troubleshooting Using Loop Diagrams

### Systematic Approach

1. **Identify the loop** — What's the tag number? Find the loop diagram.
2. **Check the process variable** — Is the transmitter reading correctly?
3. **Check the signal path** — Measure 4-20mA at each junction point
4. **Check the output** — Is the controller sending the right signal?
5. **Check the final element** — Is the valve responding?

| Measurement Point | Expected | Actual | Diagnosis |
|------------------|----------|--------|-----------|
| At transmitter | 12.0 mA | 12.0 mA | Transmitter OK |
| At JB-10 | 12.0 mA | 12.0 mA | Cable OK |
| At PLC input | 12.0 mA | 4.0 mA | Wire break between JB and PLC |

## Glossary

| Term | Definition |
|------|-----------|
| **Instrument loop** | Complete measurement and control chain for one process variable |
| **Loop diagram** | Drawing showing all devices, wiring, and connections in one loop |
| **ISA-5.1** | Standard for instrument identification and symbols |
| **Tag number** | Unique identifier for each instrument (e.g., TT-101) |
| **Junction box** | Enclosure where field cables terminate before entering the control room |
| **I/P converter** | Converts 4-20mA electrical signal to 3-15 PSI pneumatic signal |
`
  },
];

// ============================================================
// 7. POWER DISTRIBUTION
// ============================================================
const powerDistributionLessons = [
  {
    slug: 'industrial-power-systems',
    title: 'Industrial Power Systems: From Utility to Machine',
    orderIndex: 1,
    estimatedMinutes: 25,
    content: `# Industrial Power Systems

## The Power Distribution Chain

Power flows from the utility through multiple transformation and protection stages before reaching your machine:

\`\`\`
Utility (13.8kV or 4.16kV)
  → Main Transformer (steps down to 480V)
    → Main Switchgear (main breaker + bus)
      → Distribution Panels / MCCs
        → Branch Circuits
          → Individual Machines
\`\`\`

## Voltage Levels in Industrial Facilities

| Voltage | System | Typical Use |
|---------|--------|-------------|
| 13,800V (13.8kV) | Medium voltage | Utility feed, large motors (>500HP) |
| 4,160V | Medium voltage | Large motors (200-500HP) |
| 480V 3Φ | Low voltage power | Motors, heaters, welders |
| 208V 3Φ | Low voltage | Small motors, equipment |
| 120V 1Φ | Control voltage | Controls, lighting, receptacles |
| 24VDC | Extra-low voltage | PLC I/O, sensors, controls |

## Transformers

### Transformer Basics

A transformer changes voltage level using electromagnetic induction:

| Specification | Description |
|--------------|-------------|
| kVA rating | Power capacity (e.g., 500 kVA) |
| Primary voltage | Input voltage (e.g., 13,800V) |
| Secondary voltage | Output voltage (e.g., 480V) |
| Impedance | Internal resistance (affects fault current) |
| Cooling | Dry type (indoor) or oil-filled (outdoor) |

### Transformer Connections

| Connection | Voltage | Neutral | Application |
|-----------|---------|---------|-------------|
| Delta-Delta | 480V | No neutral | Motor loads only |
| Delta-Wye | 480/277V | Yes (grounded) | Motors + lighting at 277V |
| Wye-Wye | 208/120V | Yes | Lighting and receptacles |

### Tap Changers

Transformers have tap connections to adjust the output voltage ±5% to compensate for utility voltage variations:

| Tap | Ratio Adjustment | When to Use |
|-----|-----------------|-------------|
| +5% | Raises secondary voltage | Utility voltage consistently low |
| +2.5% | Slight raise | Minor low voltage |
| Nominal | Standard ratio | Normal conditions |
| -2.5% | Slight reduction | Minor high voltage |
| -5% | Lowers secondary voltage | Utility voltage consistently high |

> **Field Reality:** If motors are running hot and voltage at the MCC is 505V (should be 480V), check the transformer taps before replacing motors. A tap adjustment takes 30 minutes; replacing burned-out motors takes days.

## Switchgear and Panelboards

### Main Switchgear

| Component | Function |
|-----------|----------|
| Main breaker | Primary overcurrent protection, main disconnect |
| Bus bars | Copper/aluminum bars distributing power |
| Feeder breakers | Protection for downstream panels/MCCs |
| Metering | Voltage, current, power monitoring |
| Surge protection | Protects against voltage transients |

### Motor Control Centers (MCCs)

An MCC is a standardized assembly of motor starters in a common enclosure:

| Component | Function |
|-----------|----------|
| Vertical bus | Power distribution within the MCC |
| Starter bucket | Individual motor starter (removable) |
| Combination starter | Disconnect + contactor + overload in one unit |
| VFD bucket | Variable frequency drive in MCC format |

## Power Quality Issues

| Issue | Symptom | Cause | Solution |
|-------|---------|-------|----------|
| Voltage sag | Motors slow down, lights dim | Large motor starting, utility issue | Soft starters, VFDs |
| Voltage swell | Equipment damage, blown fuses | Load rejection, tap setting wrong | Check taps, add regulation |
| Harmonics | Overheating transformers, tripping breakers | VFDs, rectifiers | Harmonic filters |
| Power factor | Utility penalty charges | Inductive loads (motors) | Capacitor banks |

## Glossary

| Term | Definition |
|------|-----------|
| **Switchgear** | Assembly of disconnect switches, breakers, and bus bars for power distribution |
| **MCC** | Motor Control Center — standardized enclosure for motor starters |
| **Bus bar** | Copper or aluminum conductor distributing power within an enclosure |
| **kVA** | Kilovolt-ampere — apparent power rating of a transformer |
| **Tap changer** | Adjustable transformer connection to modify the turns ratio |
| **Power factor** | Ratio of real power to apparent power (1.0 = ideal) |
| **Harmonics** | Distortion of the power waveform caused by non-linear loads |
`
  },
  {
    slug: 'overcurrent-protection',
    title: 'Overcurrent Protection: Fuses, Breakers & Coordination',
    orderIndex: 2,
    estimatedMinutes: 22,
    content: `# Overcurrent Protection

## Why Overcurrent Protection Matters

Every wire, every device, every connection has a maximum current rating. Exceeding that rating causes:
- **Wire insulation melting** → fire
- **Equipment damage** → expensive replacement
- **Arc flash** → severe burns or death

Overcurrent protection devices (fuses and breakers) are the last line of defense.

## Fuses

### Fuse Types

| Type | Class | Application | Interrupting Rating |
|------|-------|-------------|-------------------|
| Dual-element time-delay | RK1 | Motor circuits (handles inrush) | 200kA |
| Fast-acting | J | Semiconductor protection | 200kA |
| Current-limiting | CC | Control circuits | 200kA |
| General purpose | H, K | Lighting, heating | 10-100kA |

### Fuse Sizing for Motors

| Motor FLA | Dual-Element Fuse (175%) | Non-Time-Delay (300%) |
|-----------|--------------------------|----------------------|
| 10A | 17.5A → use 17.5A | 30A |
| 25A | 43.75A → use 45A | 75A |
| 50A | 87.5A → use 90A | 150A |

> **Field Reality:** When a fuse blows, never replace it with a larger size "to keep production running." The fuse is sized to protect the wire. A larger fuse lets the wire overheat before it blows — that's how fires start.

### Troubleshooting Blown Fuses

| Scenario | Likely Cause |
|----------|-------------|
| One fuse blown (3-phase motor) | Single-phasing, ground fault on one phase |
| All three fuses blown | Short circuit, locked rotor |
| Fuse blows on startup | Undersized fuse, mechanical jam |
| Fuse blows intermittently | Loose connection, developing short |

## Circuit Breakers

### Breaker Types

| Type | Trip Mechanism | Application |
|------|---------------|-------------|
| Thermal | Bimetallic strip (slow, heat-based) | Overload protection |
| Magnetic | Electromagnet (fast, current-based) | Short circuit protection |
| Thermal-magnetic | Both mechanisms | Most common — dual protection |
| Electronic trip | Adjustable microprocessor | Large breakers, precise settings |

### Breaker Trip Settings

| Setting | Purpose | Typical Range |
|---------|---------|---------------|
| Long-time pickup | Overload threshold | 0.5-1.0 × rating |
| Long-time delay | Time before trip on overload | 2-30 seconds |
| Short-time pickup | High overcurrent threshold | 2-10 × rating |
| Short-time delay | Time before trip on high overcurrent | 0.1-0.5 seconds |
| Instantaneous | Immediate trip on fault | 2-40 × rating |
| Ground fault | Ground fault threshold | 0.2-1.0 × rating |

## Coordination

Coordination means the protective device closest to the fault trips first, while upstream devices remain closed:

\`\`\`
Main Breaker (2000A) ← Should NOT trip
  └── Feeder Breaker (400A) ← Should NOT trip
        └── Branch Fuse (30A) ← SHOULD trip (closest to fault)
\`\`\`

### Coordination Study

| Level | Device | Trip Time at 500A |
|-------|--------|-------------------|
| Branch | 30A fuse | 0.01 seconds |
| Feeder | 400A breaker | 10 seconds |
| Main | 2000A breaker | 60 seconds |

The branch fuse clears the fault in 0.01 seconds — long before the feeder or main breaker would trip.

## Arc Flash Basics

| Category | Cal/cm² | PPE Required |
|----------|---------|-------------|
| 1 | 4 | Arc-rated shirt, pants, face shield |
| 2 | 8 | Arc-rated shirt, pants, flash suit hood |
| 3 | 25 | Full arc flash suit |
| 4 | 40 | Full arc flash suit, maximum PPE |

> **Critical Safety:** Always check the arc flash label on equipment before opening it. The label tells you the incident energy level and required PPE. Working on energized 480V equipment without proper PPE is one of the most dangerous things a maintenance technician can do.

## Glossary

| Term | Definition |
|------|-----------|
| **Overcurrent** | Current exceeding the rated capacity of a conductor or device |
| **Overload** | Moderate overcurrent sustained over time (e.g., motor running heavy) |
| **Short circuit** | Very high current from a direct connection between phases or phase-to-ground |
| **Coordination** | Ensuring the device closest to the fault trips first |
| **Arc flash** | Explosive release of energy from an electrical arc |
| **Interrupting rating** | Maximum fault current a device can safely interrupt |
| **FLA** | Full Load Amperage — rated current of a motor at full load |
`
  },
  {
    slug: 'grounding-bonding',
    title: 'Grounding, Bonding & Ground Fault Protection',
    orderIndex: 3,
    estimatedMinutes: 20,
    content: `# Grounding, Bonding & Ground Fault Protection

## Why Grounding Matters

Grounding serves two critical purposes:
1. **Safety** — Provides a low-impedance path for fault current, ensuring overcurrent devices trip quickly
2. **Equipment protection** — Limits voltage on equipment enclosures to safe levels during faults

Without proper grounding, a ground fault on a motor could energize the motor frame at 480V — and anyone touching it would be the path to ground.

## Grounding vs. Bonding

| Concept | Definition | Purpose |
|---------|-----------|---------|
| **Grounding** | Connecting to earth (ground rod, building steel) | Reference point, lightning protection |
| **Bonding** | Connecting metallic parts together | Ensures equal potential, fault current path |
| **Equipment grounding** | Green wire from equipment to panel | Fault current return path |

### The Critical Distinction

Bonding is more important than grounding for personnel safety. If all metal parts are bonded together, a fault energizes everything equally — no voltage difference, no shock. Grounding ensures the overcurrent device trips quickly.

## Grounding System Types

| System | Description | Application |
|--------|-------------|-------------|
| Solidly grounded | Neutral directly connected to ground | Most common (480Y/277V) |
| Resistance grounded | Neutral connected through resistor | Limits ground fault current |
| Ungrounded | No intentional ground connection | Older systems, process continuity |

### High-Resistance Grounding (HRG)

| Feature | Solidly Grounded | HRG |
|---------|-----------------|-----|
| First ground fault current | Thousands of amps | < 10 amps |
| First fault trips breaker? | Yes (production stops) | No (alarm only) |
| Arc flash energy | High | Very low |
| Second fault | N/A | Must be found before second fault |

> **Field Reality:** Many continuous-process plants use HRG because a single ground fault doesn't shut down production. But this requires a ground fault detection system and disciplined maintenance — the first fault must be found and repaired before a second fault occurs, which would cause a phase-to-phase short.

## Ground Fault Detection

### Ground Fault Circuit Interrupter (GFCI)

Detects current imbalance between hot and neutral (current leaking to ground through a person):

| Specification | Value |
|--------------|-------|
| Trip threshold | 5 mA (personnel protection) |
| Trip time | < 25 ms |
| Application | 120V receptacles, wet locations |

### Ground Fault Protection of Equipment (GFPE)

Detects ground faults on larger systems:

| Specification | Value |
|--------------|-------|
| Trip threshold | 30mA - 1200A (adjustable) |
| Trip time | Adjustable delay |
| Application | 480V feeders, main breakers |
| NEC requirement | Services > 1000A, 480Y/277V |

## Troubleshooting Ground Faults

### Megger Testing (Insulation Resistance)

| Reading | Condition |
|---------|-----------|
| > 100 MΩ | Excellent insulation |
| 10-100 MΩ | Good insulation |
| 1-10 MΩ | Deteriorating — schedule replacement |
| < 1 MΩ | Poor — investigate immediately |
| 0 Ω | Dead short to ground |

### Finding a Ground Fault

1. **Isolate the circuit** — Open the main disconnect
2. **Disconnect the load** — Remove motor leads at the starter
3. **Test motor insulation** — Megger each phase to ground
4. **Test cable insulation** — Megger each conductor to ground
5. **Test connections** — Check for pinched wires, damaged insulation

| Test Point | Reading | Diagnosis |
|-----------|---------|-----------|
| Motor T1-Ground | 0.5 MΩ | Motor winding fault |
| Motor T2-Ground | 150 MΩ | OK |
| Motor T3-Ground | 200 MΩ | OK |
| Cable Phase A-Ground | 500 MΩ | OK |

Result: Motor T1 winding has degraded insulation — replace motor.

## Glossary

| Term | Definition |
|------|-----------|
| **Grounding** | Connecting to earth for voltage reference and lightning protection |
| **Bonding** | Connecting metallic parts to ensure equal potential |
| **Equipment ground** | Green wire providing fault current return path |
| **HRG** | High-Resistance Grounding — limits ground fault current |
| **GFCI** | Ground Fault Circuit Interrupter — 5mA personnel protection |
| **GFPE** | Ground Fault Protection of Equipment — adjustable threshold |
| **Megger** | Insulation resistance tester applying high DC voltage |
| **Insulation resistance** | Measured in megohms, indicates condition of wire/motor insulation |
`
  },
];

// ============================================================
// MAIN EXECUTION
// ============================================================
try {
  console.log('=== Seeding 7 New Course Tracks ===\n');

  // 1. Industrial Networking
  console.log('1. Industrial Networking...');
  const networkingId = await upsertModule(
    'industrial-networking',
    'Industrial Networking',
    'Ethernet/IP, managed switches, VLANs, PLC network communications, and network troubleshooting for industrial automation systems.',
    'Network',
    'advanced',
    7
  );
  await seedLessons(networkingId, industrialNetworkingLessons);

  // 2. Sensors & Instrumentation
  console.log('\n2. Sensors & Instrumentation...');
  const sensorsId = await upsertModule(
    'sensors-instrumentation',
    'Sensors & Instrumentation',
    'Proximity sensors, photoeyes, analog signals (4-20mA, 0-10V), temperature and pressure measurement, and calibration fundamentals.',
    'Gauge',
    'foundational',
    8
  );
  await seedLessons(sensorsId, sensorsLessons);

  // 3. Robotics Fundamentals
  console.log('\n3. Robotics Fundamentals...');
  const roboticsId = await upsertModule(
    'robotics-fundamentals',
    'Robotics Fundamentals',
    'Industrial robot types, axes, PLC integration, communication protocols, maintenance procedures, and fault recovery.',
    'Bot',
    'advanced',
    9
  );
  await seedLessons(roboticsId, roboticsLessons);

  // 4. Print Reading (Electrical)
  console.log('\n4. Print Reading (Electrical)...');
  const printReadingId = await upsertModule(
    'print-reading',
    'Print Reading (Electrical)',
    'Electrical schematics, ladder diagrams, panel layouts, wire tracing, three-phase power distribution prints, and cross-referencing.',
    'FileText',
    'foundational',
    10
  );
  await seedLessons(printReadingId, printReadingLessons);

  // 5. Safety Systems
  console.log('\n5. Safety Systems...');
  const safetyId = await upsertModule(
    'safety-systems',
    'Safety Systems',
    'Machine safety standards, risk assessment, E-stops, light curtains, safety interlocks, safety PLCs, and troubleshooting safety circuits.',
    'ShieldCheck',
    'foundational',
    11
  );
  await seedLessons(safetyId, safetyLessons);

  // 6. Process Control
  console.log('\n6. Process Control...');
  const processControlId = await upsertModule(
    'process-control',
    'Process Control',
    'PID control fundamentals, control valves, actuators, process instrumentation loops, loop diagrams, and tuning methodology.',
    'Activity',
    'advanced',
    12
  );
  await seedLessons(processControlId, processControlLessons);

  // 7. Power Distribution
  console.log('\n7. Power Distribution...');
  const powerDistId = await upsertModule(
    'power-distribution',
    'Power Distribution',
    'Industrial power systems, transformers, switchgear, MCCs, overcurrent protection, grounding, bonding, and arc flash safety.',
    'Zap',
    'foundational',
    13
  );
  await seedLessons(powerDistId, powerDistributionLessons);

  console.log('\n=== All 7 course tracks seeded successfully! ===');
  console.log('Total: 7 modules, 21 lessons');
} catch (error) {
  console.error('Error seeding courses:', error);
} finally {
  await connection.end();
}
