

---

### Schematic Symbols — IEC 60617 / ANSI Y32.2

The following transistor symbols conform to IEC 60617 and ANSI Y32.2 standards for graphical symbols on electrical and electronic diagrams. Terminal identification follows standard convention: **B** (Base), **C** (Collector), **E** (Emitter) for BJTs; **G** (Gate), **D** (Drain), **S** (Source) for MOSFETs.

---

#### NPN Bipolar Junction Transistor

<div style="text-align:center;margin:1.5rem 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 200" width="240" height="200" style="max-width:100%;height:auto;">
  <!-- Base line (vertical) -->
  <line x1="120" y1="50" x2="120" y2="150" stroke="#22c55e" stroke-width="3"/>
  <!-- Base terminal lead -->
  <line x1="40" y1="100" x2="120" y2="100" stroke="#22c55e" stroke-width="2"/>
  <!-- Collector lead (angled up-right from base bar) -->
  <line x1="120" y1="70" x2="180" y2="30" stroke="#22c55e" stroke-width="2"/>
  <!-- Collector vertical lead -->
  <line x1="180" y1="30" x2="180" y2="10" stroke="#22c55e" stroke-width="2"/>
  <!-- Emitter lead (angled down-right from base bar) -->
  <line x1="120" y1="130" x2="180" y2="170" stroke="#22c55e" stroke-width="2"/>
  <!-- Emitter vertical lead -->
  <line x1="180" y1="170" x2="180" y2="190" stroke="#22c55e" stroke-width="2"/>
  <!-- Emitter arrow (pointing AWAY from base — defines NPN) -->
  <polygon points="165,158 180,170 170,155" fill="#22c55e"/>
  <!-- Terminal labels -->
  <text x="25" y="105" fill="#22c55e" font-family="monospace" font-size="14" font-weight="bold">B</text>
  <text x="185" y="15" fill="#22c55e" font-family="monospace" font-size="14" font-weight="bold">C</text>
  <text x="185" y="195" fill="#22c55e" font-family="monospace" font-size="14" font-weight="bold">E</text>
  <!-- Circle (package outline) -->
  <circle cx="140" cy="100" r="55" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4,2" opacity="0.4"/>
</svg>
<div style="color:#86efac;font-size:0.85rem;margin-top:0.5rem;font-family:monospace;">NPN BJT — Arrow on emitter points AWAY from base (conventional current direction out of emitter)</div>
</div>

**IEC designation:** Q (transistor) or VT  
**Key identification:** The arrow on the emitter terminal points **away from the base bar**, indicating the direction of conventional current flow (out of the emitter). In industrial schematics, NPN transistors are used for **sinking outputs** — they switch the load's connection to ground (0V).

**Industrial application:** PLC sinking output modules (1756-OB16D), NPN proximity sensor outputs (Omron E2E series), transistor output cards on Mitsubishi FX-series PLCs, low-side switching of solenoid valves and indicator lamps.

---

#### PNP Bipolar Junction Transistor

<div style="text-align:center;margin:1.5rem 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 200" width="240" height="200" style="max-width:100%;height:auto;">
  <!-- Base line (vertical) -->
  <line x1="120" y1="50" x2="120" y2="150" stroke="#22c55e" stroke-width="3"/>
  <!-- Base terminal lead -->
  <line x1="40" y1="100" x2="120" y2="100" stroke="#22c55e" stroke-width="2"/>
  <!-- Collector lead (angled down-right from base bar) -->
  <line x1="120" y1="130" x2="180" y2="170" stroke="#22c55e" stroke-width="2"/>
  <!-- Collector vertical lead -->
  <line x1="180" y1="170" x2="180" y2="190" stroke="#22c55e" stroke-width="2"/>
  <!-- Emitter lead (angled up-right from base bar) -->
  <line x1="120" y1="70" x2="180" y2="30" stroke="#22c55e" stroke-width="2"/>
  <!-- Emitter vertical lead -->
  <line x1="180" y1="30" x2="180" y2="10" stroke="#22c55e" stroke-width="2"/>
  <!-- Emitter arrow (pointing TOWARD base — defines PNP) -->
  <polygon points="135,58 120,70 132,73" fill="#22c55e"/>
  <!-- Terminal labels -->
  <text x="25" y="105" fill="#22c55e" font-family="monospace" font-size="14" font-weight="bold">B</text>
  <text x="185" y="195" fill="#22c55e" font-family="monospace" font-size="14" font-weight="bold">C</text>
  <text x="185" y="15" fill="#22c55e" font-family="monospace" font-size="14" font-weight="bold">E</text>
  <!-- Circle (package outline) -->
  <circle cx="140" cy="100" r="55" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4,2" opacity="0.4"/>
</svg>
<div style="color:#86efac;font-size:0.85rem;margin-top:0.5rem;font-family:monospace;">PNP BJT — Arrow on emitter points TOWARD base (conventional current direction into emitter)</div>
</div>

**IEC designation:** Q (transistor) or VT  
**Key identification:** The arrow on the emitter terminal points **toward the base bar**, indicating conventional current flows into the emitter. In industrial schematics, PNP transistors are used for **sourcing outputs** — they switch the load's connection to the positive supply (+24VDC).

**Industrial application:** PLC sourcing output modules (1756-OB16E), PNP proximity sensor outputs (Siemens 3RG series, IFM, Balluff), European-standard sensor wiring, high-side switching of 24VDC loads in Siemens S7 and Allen-Bradley systems.

---

#### N-Channel Enhancement MOSFET

<div style="text-align:center;margin:1.5rem 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 200" width="260" height="200" style="max-width:100%;height:auto;">
  <!-- Gate terminal lead -->
  <line x1="40" y1="100" x2="90" y2="100" stroke="#22c55e" stroke-width="2"/>
  <!-- Gate insulation plate (vertical line, separated from channel) -->
  <line x1="90" y1="50" x2="90" y2="150" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Channel (three dashes indicating enhancement mode - normally OFF) -->
  <line x1="110" y1="50" x2="110" y2="75" stroke="#22c55e" stroke-width="3"/>
  <line x1="110" y1="88" x2="110" y2="112" stroke="#22c55e" stroke-width="3"/>
  <line x1="110" y1="125" x2="110" y2="150" stroke="#22c55e" stroke-width="3"/>
  <!-- Drain lead (from top of channel, right) -->
  <line x1="110" y1="62" x2="180" y2="62" stroke="#22c55e" stroke-width="2"/>
  <line x1="180" y1="62" x2="180" y2="15" stroke="#22c55e" stroke-width="2"/>
  <!-- Source lead (from bottom of channel, right) -->
  <line x1="110" y1="138" x2="180" y2="138" stroke="#22c55e" stroke-width="2"/>
  <line x1="180" y1="138" x2="180" y2="185" stroke="#22c55e" stroke-width="2"/>
  <!-- Body connection (middle of channel to source) -->
  <line x1="110" y1="100" x2="145" y2="100" stroke="#22c55e" stroke-width="1.5"/>
  <line x1="145" y1="100" x2="145" y2="138" stroke="#22c55e" stroke-width="1.5"/>
  <!-- Arrow on body diode (pointing from source toward drain = N-channel) -->
  <polygon points="138,100 148,93 148,107" fill="#22c55e"/>
  <!-- Terminal labels -->
  <text x="25" y="105" fill="#22c55e" font-family="monospace" font-size="14" font-weight="bold">G</text>
  <text x="185" y="20" fill="#22c55e" font-family="monospace" font-size="14" font-weight="bold">D</text>
  <text x="185" y="185" fill="#22c55e" font-family="monospace" font-size="14" font-weight="bold">S</text>
  <!-- Gate insulation gap indicator -->
  <text x="72" y="168" fill="#86efac" font-family="monospace" font-size="10" opacity="0.7">oxide</text>
</svg>
<div style="color:#86efac;font-size:0.85rem;margin-top:0.5rem;font-family:monospace;">N-Channel Enhancement MOSFET — Gate insulated (oxide layer), broken channel = normally OFF</div>
</div>

**IEC designation:** Q or VT (with MOSFET type notation)  
**Key identification:** The gate terminal is separated from the channel by a **gap** representing the silicon dioxide insulation layer. The channel is drawn as **three broken segments** (indicating enhancement mode — the device is normally OFF and requires positive gate voltage to conduct). The body arrow points **from source toward drain** (into the channel), identifying N-channel type.

**Industrial application:** VFD inverter output stage (PowerFlex 525 uses 6 N-channel MOSFETs in a three-phase bridge), DC-DC converters in 24VDC power supplies, solid-state relay output stages (Crydom CX series), high-frequency PWM switching in servo amplifiers, battery disconnect switches in UPS systems.

**Critical maintenance note:** The gate oxide is only ~100nm thick. Static discharge from a technician's body (3,000V–10,000V) will permanently destroy the gate. Always ground yourself before handling MOSFET-based boards. Use ESD wrist straps when working on VFD power boards or servo drive modules.

---

#### P-Channel Enhancement MOSFET

<div style="text-align:center;margin:1.5rem 0;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 200" width="260" height="200" style="max-width:100%;height:auto;">
  <!-- Gate terminal lead -->
  <line x1="40" y1="100" x2="90" y2="100" stroke="#22c55e" stroke-width="2"/>
  <!-- Gate insulation plate (vertical line, separated from channel) -->
  <line x1="90" y1="50" x2="90" y2="150" stroke="#22c55e" stroke-width="2.5"/>
  <!-- Channel (three dashes indicating enhancement mode - normally OFF) -->
  <line x1="110" y1="50" x2="110" y2="75" stroke="#22c55e" stroke-width="3"/>
  <line x1="110" y1="88" x2="110" y2="112" stroke="#22c55e" stroke-width="3"/>
  <line x1="110" y1="125" x2="110" y2="150" stroke="#22c55e" stroke-width="3"/>
  <!-- Drain lead (from bottom of channel, right) -->
  <line x1="110" y1="138" x2="180" y2="138" stroke="#22c55e" stroke-width="2"/>
  <line x1="180" y1="138" x2="180" y2="185" stroke="#22c55e" stroke-width="2"/>
  <!-- Source lead (from top of channel, right) -->
  <line x1="110" y1="62" x2="180" y2="62" stroke="#22c55e" stroke-width="2"/>
  <line x1="180" y1="62" x2="180" y2="15" stroke="#22c55e" stroke-width="2"/>
  <!-- Body connection (middle of channel to source) -->
  <line x1="110" y1="100" x2="145" y2="100" stroke="#22c55e" stroke-width="1.5"/>
  <line x1="145" y1="100" x2="145" y2="62" stroke="#22c55e" stroke-width="1.5"/>
  <!-- Arrow on body diode (pointing from drain toward source = P-channel) -->
  <polygon points="152,100 142,93 142,107" fill="#22c55e"/>
  <!-- Terminal labels -->
  <text x="25" y="105" fill="#22c55e" font-family="monospace" font-size="14" font-weight="bold">G</text>
  <text x="185" y="185" fill="#22c55e" font-family="monospace" font-size="14" font-weight="bold">D</text>
  <text x="185" y="20" fill="#22c55e" font-family="monospace" font-size="14" font-weight="bold">S</text>
  <!-- Gate insulation gap indicator -->
  <text x="72" y="168" fill="#86efac" font-family="monospace" font-size="10" opacity="0.7">oxide</text>
</svg>
<div style="color:#86efac;font-size:0.85rem;margin-top:0.5rem;font-family:monospace;">P-Channel Enhancement MOSFET — Arrow points AWAY from channel (from drain toward source)</div>
</div>

**IEC designation:** Q or VT (with MOSFET type notation)  
**Key identification:** Same gate insulation and broken channel structure as N-channel, but the body arrow points **from drain toward source** (away from the channel), identifying P-channel type. P-channel MOSFETs require a **negative** gate-to-source voltage to conduct.

**Industrial application:** High-side load switching where simplicity is needed (reverse polarity protection circuits), battery management systems, power supply OR-ing circuits in redundant 24VDC systems, level shifting in mixed-voltage control circuits.

**Comparison to N-channel:** P-channel MOSFETs have approximately 2-3x higher on-resistance than equivalent N-channel devices at the same die size, making them less efficient for high-current applications. This is why VFD inverter stages exclusively use N-channel MOSFETs (or IGBTs for higher voltage ratings).

---

