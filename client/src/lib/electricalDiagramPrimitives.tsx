/**
 * NEMA / JIC (US industrial, NFPA 79) ladder symbol primitives for simulator diagrams.
 * Geometry aligned with server/content/electrical-schematic-symbols.mjs (lesson 90010 audit).
 */

import type { ReactNode } from "react";

type GProps = { cx: number; cy: number; color: string; scale?: number };

function s(scale: number | undefined, n: number) {
  return n * (scale ?? 1);
}

/** PLC Ladder NO contact (XIC) — vertical bars with gap (Allen-Bradley / RSLogix style).
 *  Use ONLY in PLC ladder logic contexts. For hardwired schematics use HW_NOContact. */
export function DiagramNOContact({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  const w = s(scale, 1.5);
  const half = s(scale, 14);
  const bar = s(scale, 16);
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      <line x1={cx - half} y1={cy - bar} x2={cx - half} y2={cy + bar} />
      <line x1={cx + half} y1={cy - bar} x2={cx + half} y2={cy + bar} />
      <line x1={cx - half - s(scale, 8)} y1={cy} x2={cx - half} y2={cy} />
      <line x1={cx + half} y1={cy} x2={cx + half + s(scale, 8)} y2={cy} />
    </g>
  );
}

/** PLC Ladder NC contact (XIO) — vertical bars + diagonal slash (Allen-Bradley / RSLogix style).
 *  Use ONLY in PLC ladder logic contexts. For hardwired schematics use HW_NCContact. */
export function DiagramNCContact({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  const w = s(scale, 1.5);
  const half = s(scale, 14);
  const bar = s(scale, 16);
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      <line x1={cx - half} y1={cy - bar} x2={cx - half} y2={cy + bar} />
      <line x1={cx + half} y1={cy - bar} x2={cx + half} y2={cy + bar} />
      <line x1={cx - half + s(scale, 2)} y1={cy + bar} x2={cx + half - s(scale, 2)} y2={cy - bar} />
      <line x1={cx - half - s(scale, 8)} y1={cy} x2={cx - half} y2={cy} />
      <line x1={cx + half} y1={cy} x2={cx + half + s(scale, 8)} y2={cy} />
    </g>
  );
}

// ─── HARDWIRED SCHEMATIC CONTACT PRIMITIVES (JIC EGP-1 / NEMA ICS 1) ───────────
// These draw the correct diagonal-blade geometry for elementary wiring diagrams.
// Terminal dots on a horizontal wire with a diagonal blade between them.

/** Hardwired NO contact — terminal dots + diagonal blade (open gap).
 *  Per JIC EGP-1: two terminal dots on horizontal wire, diagonal blade angled up from
 *  left terminal, NOT touching right terminal (circuit open). */
export function HW_NOContact({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  const w = s(scale, 2);
  const half = s(scale, 16); // half-width between terminals
  const dotR = s(scale, 3);
  const bladeRise = s(scale, 14); // how far blade rises above centerline
  return (
    <g stroke={color} strokeWidth={w} fill={color}>
      {/* Horizontal wire stubs */}
      <line x1={cx - half - s(scale, 10)} y1={cy} x2={cx - half} y2={cy} />
      <line x1={cx + half} y1={cy} x2={cx + half + s(scale, 10)} y2={cy} />
      {/* Terminal dots */}
      <circle cx={cx - half} cy={cy} r={dotR} stroke="none" />
      <circle cx={cx + half} cy={cy} r={dotR} stroke="none" />
      {/* Diagonal blade — from left terminal going up-right, stops short of right terminal */}
      <line x1={cx - half} y1={cy} x2={cx + half - s(scale, 4)} y2={cy - bladeRise} fill="none" />
    </g>
  );
}

/** Hardwired NC contact — terminal dots + diagonal blade + bridge bar (closed).
 *  Per JIC EGP-1: same as NO but with a horizontal bridge bar across the gap,
 *  indicating the contact is normally making (circuit closed). */
export function HW_NCContact({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  const w = s(scale, 2);
  const half = s(scale, 16);
  const dotR = s(scale, 3);
  const bladeRise = s(scale, 14);
  const barY = cy - s(scale, 6); // bridge bar height
  return (
    <g stroke={color} strokeWidth={w} fill={color}>
      {/* Horizontal wire stubs */}
      <line x1={cx - half - s(scale, 10)} y1={cy} x2={cx - half} y2={cy} />
      <line x1={cx + half} y1={cy} x2={cx + half + s(scale, 10)} y2={cy} />
      {/* Terminal dots */}
      <circle cx={cx - half} cy={cy} r={dotR} stroke="none" />
      <circle cx={cx + half} cy={cy} r={dotR} stroke="none" />
      {/* Diagonal blade — from left terminal going up-right toward right terminal */}
      <line x1={cx - half} y1={cy} x2={cx + half - s(scale, 4)} y2={cy - bladeRise} fill="none" />
      {/* Bridge bar — horizontal bar indicating closed contact */}
      <line x1={cx - s(scale, 10)} y1={barY} x2={cx + s(scale, 10)} y2={barY} fill="none" />
    </g>
  );
}

/** NEMA coil — circle */
export function DiagramCoil({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  const r = s(scale, 12);
  const w = s(scale, 2);
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      <circle cx={cx} cy={cy} r={r} />
      <line x1={cx - r - s(scale, 10)} y1={cy} x2={cx - r} y2={cy} />
      <line x1={cx + r} y1={cy} x2={cx + r + s(scale, 10)} y2={cy} />
    </g>
  );
}

/** Fuse — rounded rectangle */
export function DiagramFuse({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  const w = s(scale, 2);
  const hw = s(scale, 12);
  const hh = s(scale, 6);
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      <rect x={cx - hw} y={cy - hh} width={hw * 2} height={hh * 2} rx={s(scale, 3)} />
      <line x1={cx - hw} y1={cy} x2={cx + hw} y2={cy} strokeWidth={1} />
      <line x1={cx - hw - s(scale, 8)} y1={cy} x2={cx - hw} y2={cy} />
      <line x1={cx + hw} y1={cy} x2={cx + hw + s(scale, 8)} y2={cy} />
    </g>
  );
}

/** Terminal — junction dot */
export function DiagramTerminal({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  const r = s(scale, 4);
  return (
    <g fill={color}>
      <circle cx={cx} cy={cy} r={r} />
      <line x1={cx - s(scale, 12)} y1={cy} x2={cx - r} y2={cy} stroke={color} strokeWidth={s(scale, 2)} />
      <line x1={cx + r} y1={cy} x2={cx + s(scale, 12)} y2={cy} stroke={color} strokeWidth={s(scale, 2)} />
    </g>
  );
}

/** Circuit breaker — rectangle + X */
export function DiagramBreaker({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  const w = s(scale, 2);
  const hw = s(scale, 12);
  const hh = s(scale, 8);
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      <rect x={cx - hw} y={cy - hh} width={hw * 2} height={hh * 2} />
      <line x1={cx - hw} y1={cy - hh} x2={cx + hw} y2={cy + hh} strokeWidth={s(scale, 1.5)} />
      <line x1={cx + hw} y1={cy - hh} x2={cx - hw} y2={cy + hh} strokeWidth={s(scale, 1.5)} />
    </g>
  );
}

/** Disconnect — pivots + angled blade */
export function DiagramDisconnect({ cx, cy, color, energized, scale = 1 }: GProps & { energized?: boolean }): ReactNode {
  const w = s(scale, 2);
  const bladeY = energized ? cy + s(scale, 4) : cy - s(scale, 8);
  return (
    <g stroke={color} strokeWidth={w} fill={color}>
      <line x1={cx - s(scale, 14)} y1={cy} x2={cx - s(scale, 6)} y2={cy} />
      <circle cx={cx - s(scale, 4)} cy={cy} r={s(scale, 2)} />
      <line x1={cx - s(scale, 4)} y1={cy} x2={cx + s(scale, 6)} y2={bladeY} />
      <circle cx={cx + s(scale, 8)} cy={cy} r={s(scale, 2)} />
      <line x1={cx + s(scale, 10)} y1={cy} x2={cx + s(scale, 14)} y2={cy} />
    </g>
  );
}

/** Control transformer — two windings (three bumps each) flanking a laminated iron
 *  core (two vertical lines). Primary on the left, secondary on the right, per
 *  NEMA / IEEE 315. Bumps bulge toward the core. */
export function DiagramTransformer({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  const w = s(scale, 2);
  const bump = s(scale, 3.2);
  const backL = cx - s(scale, 6);
  const backR = cx + s(scale, 6);
  const topY = cy - s(scale, 9.6);
  // Three arcs down each winding backbone; left bumps to the right (sweep 1), right to the left (sweep 0).
  const winding = (x: number, sweep: 0 | 1) =>
    `M${x},${topY} ` +
    `a${bump},${bump} 0 0 ${sweep} 0,${bump * 2} ` +
    `a${bump},${bump} 0 0 ${sweep} 0,${bump * 2} ` +
    `a${bump},${bump} 0 0 ${sweep} 0,${bump * 2}`;
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      {/* leads */}
      <line x1={backL - s(scale, 12)} y1={cy} x2={backL} y2={cy} />
      <line x1={backR} y1={cy} x2={backR + s(scale, 12)} y2={cy} />
      {/* windings */}
      <path d={winding(backL, 1)} />
      <path d={winding(backR, 0)} />
      {/* laminated core */}
      <line x1={cx - s(scale, 1.4)} y1={cy - s(scale, 11)} x2={cx - s(scale, 1.4)} y2={cy + s(scale, 11)} strokeWidth={s(scale, 1.4)} />
      <line x1={cx + s(scale, 1.4)} y1={cy - s(scale, 11)} x2={cx + s(scale, 1.4)} y2={cy + s(scale, 11)} strokeWidth={s(scale, 1.4)} />
    </g>
  );
}

/** Overload heater — zigzag only (no OL text inside symbol) */
export function DiagramOverloadHeater({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  const w = s(scale, 2);
  const y = cy;
  const x0 = cx - s(scale, 14);
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      <line x1={x0 - s(scale, 6)} y1={y} x2={x0} y2={y} />
      <polyline
        points={`${x0},${y} ${x0 + s(scale, 4)},${y - s(scale, 6)} ${x0 + s(scale, 8)},${y + s(scale, 6)} ${x0 + s(scale, 12)},${y - s(scale, 6)} ${x0 + s(scale, 16)},${y + s(scale, 6)} ${x0 + s(scale, 20)},${y - s(scale, 6)} ${x0 + s(scale, 24)},${y}`}
      />
      <line x1={x0 + s(scale, 24)} y1={y} x2={x0 + s(scale, 30)} y2={y} />
    </g>
  );
}

/** Motor — circle with M (NEMA / JIC): a plain circle with the device letter centered.
 *  The label sets stroke="none" so it is not outlined by the group's stroke. */
export function DiagramMotor({ cx, cy, color, scale = 1, label = "M" }: GProps & { label?: string }): ReactNode {
  const r = s(scale, 14);
  const w = s(scale, 2);
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      <circle cx={cx} cy={cy} r={r} />
      <line x1={cx - r - s(scale, 10)} y1={cy} x2={cx - r} y2={cy} />
      <line x1={cx + r} y1={cy} x2={cx + r + s(scale, 10)} y2={cy} />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        stroke="none"
        style={{ fontFamily: "var(--diag-font-mono)", fontSize: `${s(scale, 13)}px`, fontWeight: 700 }}
      >
        {label}
      </text>
    </g>
  );
}

/** Contactor power pole — a NO power contact whose movable blade pivots at the left
 *  terminal: closed rests on the right terminal, open lifts away. Heavier line weight
 *  than a control contact marks it as a main (power) pole. */
export function DiagramContactorPole({ cx, cy, color, closed = true, scale = 1 }: GProps & { closed?: boolean }): ReactNode {
  const w = s(scale, 2.4);
  const dotR = s(scale, 2.6);
  const leftDotX = cx - s(scale, 10);
  const rightDotX = cx + s(scale, 10);
  const tipX = closed ? rightDotX : cx + s(scale, 4);
  const tipY = closed ? cy : cy - s(scale, 13);
  return (
    <g stroke={color} strokeWidth={w} fill={color}>
      {/* leads */}
      <line x1={leftDotX - s(scale, 12)} y1={cy} x2={leftDotX} y2={cy} />
      <line x1={rightDotX} y1={cy} x2={rightDotX + s(scale, 12)} y2={cy} />
      {/* terminals */}
      <circle cx={leftDotX} cy={cy} r={dotR} stroke="none" />
      <circle cx={rightDotX} cy={cy} r={dotR} stroke="none" />
      {/* movable blade */}
      <line x1={leftDotX} y1={cy} x2={tipX} y2={tipY} fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Hardwired selector switch — JIC 2-position rotary selector.
 *  Per JIC EGP-1: NO contact (diagonal blade) + vertical actuator stem + arc with position detents. */
export function DiagramSelectorSwitchHW({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  const w = s(scale, 1.8);
  const dotR = s(scale, 2.2);
  const leftDotX = cx - s(scale, 13);
  const rightDotX = cx + s(scale, 13);
  return (
    <g stroke={color} strokeWidth={w} fill={color}>
      {/* leads + terminals */}
      <line x1={leftDotX - s(scale, 8)} y1={cy} x2={leftDotX} y2={cy} />
      <line x1={rightDotX} y1={cy} x2={rightDotX + s(scale, 8)} y2={cy} />
      <circle cx={leftDotX} cy={cy} r={dotR} stroke="none" />
      <circle cx={rightDotX} cy={cy} r={dotR} stroke="none" />
      {/* movable blade pivoting at the left terminal (shown selected toward position 2) */}
      <line x1={leftDotX} y1={cy} x2={cx + s(scale, 6)} y2={cy - s(scale, 11)} fill="none" strokeLinecap="round" />
      {/* knob shaft up to a detent arc */}
      <line x1={cx} y1={cy - s(scale, 6)} x2={cx} y2={cy - s(scale, 15)} fill="none" />
      <path d={`M${cx - s(scale, 9)},${cy - s(scale, 15)} A${s(scale, 9)},${s(scale, 9)} 0 0 1 ${cx + s(scale, 9)},${cy - s(scale, 15)}`} fill="none" />
      {/* position detents + labels */}
      <line x1={cx - s(scale, 6)} y1={cy - s(scale, 22)} x2={cx - s(scale, 6)} y2={cy - s(scale, 17)} fill="none" />
      <line x1={cx + s(scale, 6)} y1={cy - s(scale, 22)} x2={cx + s(scale, 6)} y2={cy - s(scale, 17)} fill="none" />
      <text x={cx - s(scale, 6)} y={cy - s(scale, 25)} textAnchor="middle" fill={color} stroke="none"
        style={{ fontFamily: "var(--diag-font-mono)", fontSize: `${s(scale, 7)}px` }}>1</text>
      <text x={cx + s(scale, 6)} y={cy - s(scale, 25)} textAnchor="middle" fill={color} stroke="none"
        style={{ fontFamily: "var(--diag-font-mono)", fontSize: `${s(scale, 7)}px` }}>2</text>
    </g>
  );
}

/** Guard / interlock switch — an NC contact in the safety string, tagged GS.
 *  A guarded door / gate interlock opens (breaks the string) when the guard is moved,
 *  so its schematic element is a normally-closed contact. */
export function DiagramGuardSwitch({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  return (
    <g>
      <DiagramNCContact cx={cx} cy={cy} color={color} scale={scale * 0.9} />
      <text x={cx} y={cy - s(scale, 20)} textAnchor="middle" fill={color} stroke="none"
        style={{ fontFamily: "var(--diag-font-mono)", fontSize: `${s(scale, 9)}px`, fontWeight: 600 }}>GS</text>
    </g>
  );
}

/** Pushbutton NO (momentary) — NEMA form: two fixed contacts with a movable contact
 *  bar held ABOVE them (open), a plunger stem, and a button cap. Pressing lowers the
 *  bar to bridge the contacts. */
export function DiagramPushbuttonNO({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  const w = s(scale, 1.8);
  const dotR = s(scale, 2.2);
  const leftX = cx - s(scale, 11);
  const rightX = cx + s(scale, 11);
  return (
    <g stroke={color} strokeWidth={w} fill={color}>
      {/* leads + fixed contacts */}
      <line x1={leftX - s(scale, 9)} y1={cy} x2={leftX} y2={cy} />
      <line x1={rightX} y1={cy} x2={rightX + s(scale, 9)} y2={cy} />
      <circle cx={leftX} cy={cy} r={dotR} stroke="none" />
      <circle cx={rightX} cy={cy} r={dotR} stroke="none" />
      {/* fixed contact tips reaching up toward the movable bar */}
      <line x1={leftX} y1={cy} x2={leftX} y2={cy - s(scale, 2)} fill="none" />
      <line x1={rightX} y1={cy} x2={rightX} y2={cy - s(scale, 2)} fill="none" />
      {/* movable contact bar, held raised (open) */}
      <line x1={leftX} y1={cy - s(scale, 5)} x2={rightX} y2={cy - s(scale, 5)} fill="none" />
      {/* plunger + button cap */}
      <line x1={cx} y1={cy - s(scale, 5)} x2={cx} y2={cy - s(scale, 15)} fill="none" />
      <line x1={cx - s(scale, 7)} y1={cy - s(scale, 15)} x2={cx + s(scale, 7)} y2={cy - s(scale, 15)} fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Pushbutton NC (momentary) — NEMA form: the movable contact bar bridges the two
 *  fixed contacts (closed); a plunger + button cap sits above. Pressing lifts the bar
 *  to break the circuit. */
export function DiagramPushbuttonNC({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  const w = s(scale, 1.8);
  const dotR = s(scale, 2.2);
  const leftX = cx - s(scale, 11);
  const rightX = cx + s(scale, 11);
  const barY = cy - s(scale, 3);
  return (
    <g stroke={color} strokeWidth={w} fill={color}>
      {/* leads + fixed contacts */}
      <line x1={leftX - s(scale, 9)} y1={cy} x2={leftX} y2={cy} />
      <line x1={rightX} y1={cy} x2={rightX + s(scale, 9)} y2={cy} />
      <circle cx={leftX} cy={cy} r={dotR} stroke="none" />
      <circle cx={rightX} cy={cy} r={dotR} stroke="none" />
      {/* movable bar bridging both contacts (closed) */}
      <line x1={leftX} y1={barY} x2={rightX} y2={barY} fill="none" />
      <line x1={leftX} y1={cy} x2={leftX} y2={barY} fill="none" />
      <line x1={rightX} y1={cy} x2={rightX} y2={barY} fill="none" />
      {/* plunger + button cap */}
      <line x1={cx} y1={barY} x2={cx} y2={cy - s(scale, 15)} fill="none" />
      <line x1={cx - s(scale, 7)} y1={cy - s(scale, 15)} x2={cx + s(scale, 7)} y2={cy - s(scale, 15)} fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Limit switch (NO) — a switch whose movable blade pivots at the left terminal and
 *  carries a roller-lever actuator; the roller is a FILLED circle at the lever tip
 *  (NEMA ICS 1 / ANSI Y32.2). Drawn held-open. */
export function DiagramLimitSwitch({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  const w = s(scale, 1.8);
  const dotR = s(scale, 2.4);
  const leftDotX = cx - s(scale, 13);
  const rightDotX = cx + s(scale, 13);
  return (
    <g stroke={color} strokeWidth={w} fill={color}>
      {/* leads + terminals */}
      <line x1={leftDotX - s(scale, 9)} y1={cy} x2={leftDotX} y2={cy} />
      <line x1={rightDotX} y1={cy} x2={rightDotX + s(scale, 9)} y2={cy} />
      <circle cx={leftDotX} cy={cy} r={dotR} stroke="none" />
      <circle cx={rightDotX} cy={cy} r={dotR} stroke="none" />
      {/* movable blade / operating lever (held open), pivoting at the left terminal */}
      <line x1={leftDotX} y1={cy} x2={cx + s(scale, 9)} y2={cy - s(scale, 16)} fill="none" strokeLinecap="round" />
      {/* roller at the lever tip — filled */}
      <circle cx={cx + s(scale, 11)} cy={cy - s(scale, 17)} r={s(scale, 3)} fill={color} stroke={color} strokeWidth={s(scale, 1)} />
    </g>
  );
}

/** E-stop — mushroom head + hardwired NC contact (NFPA 79 safety chain).
 *  Per JIC EGP-1: NC contact with mushroom-head pushbutton actuator. */
export function DiagramEStop({ cx, cy, color, scale = 1, energized = false }: GProps & { energized?: boolean }): ReactNode {
  const w = s(scale, 1.8);
  const dotR = s(scale, 2.2);
  const leftX = cx - s(scale, 11);
  const rightX = cx + s(scale, 11);
  const barY = cy - s(scale, 3);
  const capY = cy - s(scale, 15);
  return (
    <g stroke={color} strokeWidth={w} fill={color}>
      {/* leads + fixed contacts */}
      <line x1={leftX - s(scale, 9)} y1={cy} x2={leftX} y2={cy} />
      <line x1={rightX} y1={cy} x2={rightX + s(scale, 9)} y2={cy} />
      <circle cx={leftX} cy={cy} r={dotR} stroke="none" />
      <circle cx={rightX} cy={cy} r={dotR} stroke="none" />
      {/* movable bar bridging the contacts (NC, maintained closed until pressed) */}
      <line x1={leftX} y1={barY} x2={rightX} y2={barY} fill="none" />
      <line x1={leftX} y1={cy} x2={leftX} y2={barY} fill="none" />
      <line x1={rightX} y1={cy} x2={rightX} y2={barY} fill="none" />
      {/* plunger */}
      <line x1={cx} y1={barY} x2={cx} y2={capY} fill="none" />
      {/* mushroom head — wide shallow dome */}
      <path
        d={`M${cx - s(scale, 10)},${capY} Q${cx},${capY - s(scale, 9)} ${cx + s(scale, 10)},${capY}`}
        fill={energized ? color : "none"}
        opacity={energized ? 0.25 : 1}
      />
      <line x1={cx - s(scale, 10)} y1={capY} x2={cx + s(scale, 10)} y2={capY} fill="none" />
    </g>
  );
}

/** PLC digital input module — IN badge on I/O block */
export function DiagramPLCInput({ cx, cy, color, scale = 1, energized = true }: GProps & { energized?: boolean }): ReactNode {
  const w = s(scale, 1.2);
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      <rect x={cx - s(scale, 20)} y={cy - s(scale, 15)} width={s(scale, 40)} height={s(scale, 32)} rx={s(scale, 4)} fill="oklch(0.15 0.01 240 / 0.7)" strokeDasharray={energized ? "none" : "2,1"} />
      <rect x={cx - s(scale, 18)} y={cy - s(scale, 13)} width={s(scale, 16)} height={s(scale, 10)} rx={s(scale, 2)} fill="oklch(0.45 0.12 250 / 0.85)" stroke="none" />
      <text x={cx - s(scale, 10)} y={cy - s(scale, 8)} textAnchor="middle" dominantBaseline="central" fill="white" stroke="none" style={{ fontFamily: "var(--diag-font-mono)", fontSize: `${s(scale, 7)}px`, fontWeight: 700 }}>
        IN
      </text>
      <line x1={cx - s(scale, 20)} y1={cy} x2={cx - s(scale, 28)} y2={cy} />
      <line x1={cx + s(scale, 20)} y1={cy} x2={cx + s(scale, 28)} y2={cy} />
    </g>
  );
}

/** PLC digital output module — OUT badge on I/O block */
export function DiagramPLCOutput({ cx, cy, color, scale = 1, energized = true }: GProps & { energized?: boolean }): ReactNode {
  const w = s(scale, 1.2);
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      <rect x={cx - s(scale, 20)} y={cy - s(scale, 15)} width={s(scale, 40)} height={s(scale, 32)} rx={s(scale, 4)} fill="oklch(0.15 0.01 240 / 0.7)" strokeDasharray={energized ? "none" : "2,1"} />
      <rect x={cx + s(scale, 2)} y={cy - s(scale, 13)} width={s(scale, 16)} height={s(scale, 10)} rx={s(scale, 2)} fill="oklch(0.45 0.12 155 / 0.85)" stroke="none" />
      <text x={cx + s(scale, 10)} y={cy - s(scale, 8)} textAnchor="middle" dominantBaseline="central" fill="white" stroke="none" style={{ fontFamily: "var(--diag-font-mono)", fontSize: `${s(scale, 7)}px`, fontWeight: 700 }}>
        OUT
      </text>
      <line x1={cx - s(scale, 20)} y1={cy} x2={cx - s(scale, 28)} y2={cy} />
      <line x1={cx + s(scale, 20)} y1={cy} x2={cx + s(scale, 28)} y2={cy} />
    </g>
  );
}

/** VFD — power block with status line (simplified) */
export function DiagramVFD({
  cx,
  cy,
  color,
  scale = 1,
  energized = false,
  statusLabel,
}: GProps & { energized?: boolean; statusLabel?: string }): ReactNode {
  const w = s(scale, 1.5);
  const label = statusLabel ?? (energized ? "RUN" : "FAULT");
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      <rect x={cx - s(scale, 18)} y={cy - s(scale, 14)} width={s(scale, 36)} height={s(scale, 28)} rx={s(scale, 3)} />
      <text x={cx} y={cy - s(scale, 2)} textAnchor="middle" fill={color} stroke="none" style={{ fontFamily: "var(--diag-font-mono)", fontSize: `${s(scale, 9)}px`, fontWeight: 600 }}>
        VFD
      </text>
      <text
        x={cx}
        y={cy + s(scale, 10)}
        textAnchor="middle"
        fill={energized ? "oklch(0.6 0.14 155)" : "oklch(0.6 0.19 25)"}
        stroke="none"
        style={{ fontFamily: "var(--diag-font-mono)", fontSize: `${s(scale, 8)}px`, fontWeight: 600 }}
      >
        {label}
      </text>
      <line x1={cx - s(scale, 18)} y1={cy} x2={cx - s(scale, 26)} y2={cy} />
      <line x1={cx + s(scale, 18)} y1={cy} x2={cx + s(scale, 26)} y2={cy} />
    </g>
  );
}

/** Photoelectric sensor — housing, lens, beam arrow, 3-wire terminals */
export function DiagramPhotoeye({
  cx,
  cy,
  color,
  scale = 1,
  blocked = false,
}: GProps & { blocked?: boolean }): ReactNode {
  const w = s(scale, 1.2);
  const lensCx = cx - s(scale, 8);
  const lensCy = cy - s(scale, 4);
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      <rect
        x={cx - s(scale, 22)}
        y={cy - s(scale, 18)}
        width={s(scale, 44)}
        height={s(scale, 36)}
        rx={s(scale, 3)}
        fill="oklch(0.12 0.01 240 / 0.6)"
      />
      <circle
        cx={lensCx}
        cy={lensCy}
        r={s(scale, 5)}
        fill={blocked ? color : "none"}
        opacity={blocked ? 0.4 : 1}
      />
      <line x1={lensCx + s(scale, 6)} y1={lensCy} x2={cx + s(scale, 14)} y2={lensCy} />
      <polyline
        points={`${cx + s(scale, 14)},${lensCy} ${cx + s(scale, 18)},${lensCy - s(scale, 3)} ${cx + s(scale, 18)},${lensCy + s(scale, 3)}`}
        fill={color}
        stroke="none"
      />
      <text
        x={cx}
        y={cy + s(scale, 10)}
        textAnchor="middle"
        fill={color}
        stroke="none"
        style={{ fontFamily: "var(--diag-font-mono)", fontSize: `${s(scale, 9)}px`, fontWeight: 700 }}
      >
        PE
      </text>
      <line x1={cx - s(scale, 22)} y1={cy} x2={cx - s(scale, 30)} y2={cy} />
      <line x1={cx + s(scale, 22)} y1={cy} x2={cx + s(scale, 30)} y2={cy} />
    </g>
  );
}

// Ladder symbols. In PLC ladder every device is a plain XIC/XIO contact (or a
// coil); the TAG above it identifies the device (M, SS, TMR, SR). Device
// actuators — pushbutton caps, roller levers, timing arcs, selector knobs —
// belong ONLY on the hardwired elementary diagram, never on a ladder contact.

/** Small device tag rendered above a ladder contact/coil (e.g. START_1, M1, T4:0/DN). */
function ContactTag({ cx, cy, color, scale = 1, tag, dy = 24 }: GProps & { tag: string; dy?: number }): ReactNode {
  return (
    <text x={cx} y={cy - s(scale, dy)} textAnchor="middle" fill={color} stroke="none"
      style={{ fontFamily: "var(--diag-font-mono)", fontSize: `${s(scale, 9)}px` }}>{tag}</text>
  );
}

/** Contactor auxiliary contact — a NO control contact tagged M (seal-in / interlock).
 *  Drawn with the standard ladder contact geometry (-| |-). */
export function DiagramContactorAux({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  return (
    <g>
      <DiagramNOContact cx={cx} cy={cy} color={color} scale={scale} />
      <ContactTag cx={cx} cy={cy} color={color} scale={scale} tag="M" dy={28} />
    </g>
  );
}

/** Selector switch (ladder context) — a plain XIC contact, tagged SS.
 *  Used only in PLC ladder views. For hardwired schematic use DiagramSelectorSwitchHW. */
export function DiagramSelectorSwitch({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  return (
    <g>
      <DiagramNOContact cx={cx} cy={cy} color={color} scale={scale} />
      <ContactTag cx={cx} cy={cy} color={color} scale={scale} tag="SS" />
    </g>
  );
}

/** Safety relay coil — circle coil symbol, tagged SR.
 *  The coil symbol is the same in both ladder and hardwired contexts (circle). */
export function DiagramSafetyRelay({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  return (
    <g>
      <DiagramCoil cx={cx} cy={cy} color={color} scale={scale} />
      <ContactTag cx={cx} cy={cy} color={color} scale={scale} tag="SR" dy={26} />
    </g>
  );
}

/** Timer contact — on-delay normally-open, timed-closed (NOTC): a NO contact with a
 *  NEMA on-delay timing indicator (vertical stem + rightward arrow indicating delay
 *  direction). Tagged TR. Per NEMA ICS 1 / JIC EGP-1 time-delay contact notation. */
export function DiagramTimerContact({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  const w = s(scale, 1.8);
  const half = s(scale, 8);
  const bar = s(scale, 11);
  const arrowY = cy + bar + s(scale, 5); // arrow sits below the contact
  const arrowLen = s(scale, 10);
  const arrowHead = s(scale, 3.5);
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      {/* NO contact — vertical bars */}
      <line x1={cx - half} y1={cy - bar} x2={cx - half} y2={cy + bar} />
      <line x1={cx + half} y1={cy - bar} x2={cx + half} y2={cy + bar} />
      <line x1={cx - half - s(scale, 10)} y1={cy} x2={cx - half} y2={cy} />
      <line x1={cx + half} y1={cy} x2={cx + half + s(scale, 10)} y2={cy} />
      {/* On-delay timing indicator: vertical stem from contact + horizontal arrow pointing right */}
      <line x1={cx} y1={cy + bar} x2={cx} y2={arrowY} strokeWidth={s(scale, 1.2)} />
      <line x1={cx - s(scale, 2)} y1={arrowY} x2={cx + arrowLen} y2={arrowY} strokeWidth={s(scale, 1.5)} />
      {/* Arrowhead */}
      <polyline
        points={`${cx + arrowLen - arrowHead},${arrowY - arrowHead} ${cx + arrowLen},${arrowY} ${cx + arrowLen - arrowHead},${arrowY + arrowHead}`}
        strokeWidth={s(scale, 1.5)}
        strokeLinejoin="miter"
        fill="none"
      />
      {/* TR tag — positioned above with adequate clearance */}
      <text x={cx} y={cy - s(scale, 19)} textAnchor="middle" fill={color} stroke="none"
        style={{ fontFamily: "var(--diag-font-mono)", fontSize: `${s(scale, 9)}px`, fontWeight: 600 }}>TR</text>
    </g>
  );
}

// ─── PLC LADDER COIL (Rockwell form — parentheses with optional letter) ───
/** PLC ladder coil instruction. Parentheses form with optional letter (L/U/RES). */
export function DiagramLadderCoil({ cx, cy, color, scale = 1, letter }: GProps & { letter?: string }): ReactNode {
  const w = s(scale, 2);
  const r = s(scale, 12);
  const rr = s(scale, 15);
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      <line x1={cx - r - s(scale, 12)} y1={cy} x2={cx - r} y2={cy} />
      <line x1={cx + r} y1={cy} x2={cx + r + s(scale, 12)} y2={cy} />
      <path d={`M ${cx - r} ${cy - r} A ${rr} ${rr} 0 0 0 ${cx - r} ${cy + r}`} />
      <path d={`M ${cx + r} ${cy - r} A ${rr} ${rr} 0 0 1 ${cx + r} ${cy + r}`} />
      {letter && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill={color} stroke="none"
          style={{ fontFamily: "var(--diag-font-mono)", fontSize: `${s(scale, letter.length > 1 ? 7 : 12)}px`, fontWeight: 700 }}>{letter}</text>
      )}
    </g>
  );
}

// ─── PLC TIMER/COUNTER INSTRUCTION (Rockwell form — mnemonic header + block) ───
/** PLC timer/counter instruction box (TON/TOF/RTO) — mnemonic header + block. Rockwell form. */
export function DiagramTimerInstruction({ cx, cy, color, scale = 1, mnemonic = "TON" }: GProps & { mnemonic?: string }): ReactNode {
  const w = s(scale, 1.6);
  const hw = s(scale, 19);
  const hh = s(scale, 14);
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      <rect x={cx - hw} y={cy - hh} width={hw * 2} height={hh * 2} rx={s(scale, 2)} />
      <line x1={cx - hw} y1={cy - hh + s(scale, 10)} x2={cx + hw} y2={cy - hh + s(scale, 10)} strokeWidth={s(scale, 1)} />
      <text x={cx} y={cy - hh + s(scale, 5)} textAnchor="middle" dominantBaseline="central" fill={color} stroke="none"
        style={{ fontFamily: "var(--diag-font-mono)", fontSize: `${s(scale, 8)}px`, fontWeight: 700 }}>{mnemonic}</text>
      <text x={cx} y={cy + s(scale, 4)} textAnchor="middle" dominantBaseline="central" fill={color} stroke="none"
        style={{ fontFamily: "var(--diag-font-mono)", fontSize: `${s(scale, 6)}px` }}>TIMER</text>
      <line x1={cx - hw - s(scale, 8)} y1={cy} x2={cx - hw} y2={cy} />
      <line x1={cx + hw} y1={cy} x2={cx + hw + s(scale, 8)} y2={cy} />
    </g>
  );
}

// ─── FUNCTIONAL BLOCKS (vendor geometry — labeled blocks with terminals) ───
/** Generic functional block — a labeled rectangle with named terminal stubs on each side.
 *  Used for safety monitoring modules, PLC I/O hardware, and configurable drive relay outputs. */
export function DiagramFunctionalBlock({
  cx, cy, color, scale = 1, title, subtitle, leftTerms = [], rightTerms = [],
}: GProps & { title: string; subtitle?: string; leftTerms?: string[]; rightTerms?: string[] }): ReactNode {
  const w = s(scale, 1.4);
  const hw = s(scale, 26);
  const hh = s(scale, 20);
  const rows = Math.max(leftTerms.length, rightTerms.length, 1);
  const top = cy - hh + s(scale, 16);
  const gap = (hh * 2 - s(scale, 20)) / (rows + 1);
  const termFont = { fontFamily: "var(--diag-font-mono)", fontSize: `${s(scale, 5)}px` } as const;
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      <rect x={cx - hw} y={cy - hh} width={hw * 2} height={hh * 2} rx={s(scale, 3)} />
      <text x={cx} y={cy - hh + s(scale, 7)} textAnchor="middle" dominantBaseline="central" fill={color} stroke="none"
        style={{ fontFamily: "var(--diag-font-mono)", fontSize: `${s(scale, 7)}px`, fontWeight: 700 }}>{title}</text>
      {subtitle && (
        <text x={cx} y={cy - hh + s(scale, 13.5)} textAnchor="middle" dominantBaseline="central" fill={color} stroke="none"
          style={{ fontFamily: "var(--diag-font-mono)", fontSize: `${s(scale, 5)}px` }}>{subtitle}</text>
      )}
      {leftTerms.map((t, i) => {
        const y = top + gap * (i + 1);
        return (
          <g key={`l${i}`}>
            <line x1={cx - hw - s(scale, 8)} y1={y} x2={cx - hw} y2={y} />
            <text x={cx - hw + s(scale, 3)} y={y} dominantBaseline="central" fill={color} stroke="none" style={termFont}>{t}</text>
          </g>
        );
      })}
      {rightTerms.map((t, i) => {
        const y = top + gap * (i + 1);
        return (
          <g key={`r${i}`}>
            <line x1={cx + hw} y1={y} x2={cx + hw + s(scale, 8)} y2={y} />
            <text x={cx + hw - s(scale, 3)} y={y} textAnchor="end" dominantBaseline="central" fill={color} stroke="none" style={termFont}>{t}</text>
          </g>
        );
      })}
    </g>
  );
}

/** Registry lookup — maps symbol ID to primitive component name */
export const SYMBOL_PRIMITIVE_MAP = {
  contact_no: "DiagramNOContact",
  contact_nc: "DiagramNCContact",
  coil: "DiagramCoil",
  fuse: "DiagramFuse",
  breaker: "DiagramBreaker",
  disconnect: "DiagramDisconnect",
  transformer: "DiagramTransformer",
  overload_heater: "DiagramOverloadHeater",
  overload_nc: "DiagramNCContact",
  motor: "DiagramMotor",
  contactor_power: "DiagramContactorPole",
  contactor_aux: "DiagramContactorAux",
  pb_no: "DiagramPushbuttonNO",
  pb_nc: "DiagramPushbuttonNC",
  guard_switch: "DiagramGuardSwitch",
  terminal: "DiagramTerminal",
  limit_switch: "DiagramLimitSwitch",
  selector_switch: "DiagramSelectorSwitchHW",
  estop: "DiagramEStop",
  safety_relay: "DiagramSafetyRelay",
  plc_input: "DiagramPLCInput",
  plc_output: "DiagramPLCOutput",
  vfd: "DiagramVFD",
  timer_contact: "DiagramTimerContact",
  photoeye: "DiagramPhotoeye",
} as const;
