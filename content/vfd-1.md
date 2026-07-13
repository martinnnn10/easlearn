# VFD Fundamentals & Operating Principles

## What is a Variable Frequency Drive?

A **Variable Frequency Drive (VFD)** is a power electronic device that controls the speed of an AC motor by varying the frequency and voltage supplied to it. In manufacturing, VFDs are critical for:

- Conveyor speed control
- Pump and fan regulation
- Process line synchronization
- Energy savings (often 30-50% reduction in motor energy costs)

## How a VFD Works

A VFD has three main sections:

### 1. Rectifier (Converter)
Converts incoming AC power to DC. Uses a diode bridge (6-pulse for three-phase) to produce a DC bus voltage approximately 1.414 x line voltage.

> **Example:** 480V AC input produces approximately 678V DC bus

### 2. DC Bus (Link)
Stores energy in capacitors and smooths the DC voltage. The DC bus capacitors are the most common failure point in aging VFDs.

### 3. Inverter
Uses IGBTs (Insulated Gate Bipolar Transistors) to switch the DC bus voltage on and off rapidly, creating a simulated AC output using **Pulse Width Modulation (PWM)**.

## Key Electrical Relationships

| Parameter | Formula | Notes |
|-----------|---------|-------|
| Synchronous Speed | RPM = (120 x f) / P | f = frequency, P = poles |
| Volts/Hz Ratio | V/Hz = Rated V / Rated Hz | Maintains constant torque |
| DC Bus Voltage | V_dc = V_ac x 1.414 | For 3-phase rectifier |

## V/Hz Control (Volts per Hertz)

The most common control method. The VFD maintains a constant ratio between voltage and frequency to keep motor flux (and therefore torque) constant.

**At 460V, 60Hz:**
- V/Hz ratio = 460/60 = 7.67 V/Hz
- At 30Hz: Voltage = 230V
- At 45Hz: Voltage = 345V

> **Critical:** Below about 5-6 Hz, the V/Hz ratio breaks down and the motor loses torque. This is why VFDs have a "boost" parameter for low-speed operation.

## Common VFD Applications in Manufacturing

1. **Conveyors** — Speed matching between stations, accumulation control
2. **Pumps** — Pressure regulation, flow control (affinity laws apply)
3. **Fans/Blowers** — Volume control, energy savings follow cube law
4. **Mixers** — Recipe-based speed profiles
5. **Winders/Unwinders** — Tension control with speed/torque modes

## Safety Considerations

- **DC bus capacitors retain lethal voltage** after power is removed — wait minimum 5 minutes (check with meter)
- **Output voltage is not sinusoidal** — standard meters may not read accurately on VFD output
- **Never megger a VFD** — the test voltage will destroy the IGBTs and bus capacitors
- **Ground the motor cable shield** at the VFD end only to prevent ground loops

## Key Takeaways

1. VFDs convert AC to DC to simulated AC at variable frequency
2. Speed control = frequency control (RPM = 120f/P)
3. V/Hz ratio maintains constant torque across speed range
4. DC bus voltage is always present when power is applied — respect lockout procedures
5. VFDs save significant energy on variable-torque loads (pumps, fans)
