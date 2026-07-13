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

/** Control transformer — coupled inductors */
export function DiagramTransformer({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  const w = s(scale, 2);
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      <path d={`M${cx - s(scale, 10)},${cy - s(scale, 6)} C${cx - s(scale, 6)},${cy - s(scale, 6)} ${cx - s(scale, 6)},${cy} ${cx - s(scale, 10)},${cy} C${cx - s(scale, 6)},${cy} ${cx - s(scale, 6)},${cy + s(scale, 6)} ${cx - s(scale, 10)},${cy + s(scale, 6)}`} />
      <line x1={cx} y1={cy - s(scale, 10)} x2={cx} y2={cy + s(scale, 10)} />
      <path d={`M${cx + s(scale, 10)},${cy - s(scale, 6)} C${cx + s(scale, 6)},${cy - s(scale, 6)} ${cx + s(scale, 6)},${cy} ${cx + s(scale, 10)},${cy} C${cx + s(scale, 6)},${cy} ${cx + s(scale, 6)},${cy + s(scale, 6)} ${cx + s(scale, 10)},${cy + s(scale, 6)}`} />
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

/** Motor — circle with M (NEMA / JIC) */
export function DiagramMotor({ cx, cy, color, scale = 1, label = "M" }: GProps & { label?: string }): ReactNode {
  const r = s(scale, 14);
  const w = s(scale, 2);
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      <circle cx={cx} cy={cy} r={r} />
      <text
        x={cx}
        y={cy + s(scale, 4)}
        textAnchor="middle"
        className="diag-text-primary"
        fill={color}
        style={{ fontFamily: "var(--diag-font-mono)" }}
      >
        {label}
      </text>
      <line x1={cx - r - s(scale, 10)} y1={cy} x2={cx - r} y2={cy} />
      <line x1={cx + r} y1={cy} x2={cx + r + s(scale, 10)} y2={cy} />
    </g>
  );
}

/** Contactor power pole — blade contact (distinct from breaker X). Enlarged for legibility. */
export function DiagramContactorPole({ cx, cy, color, closed = true, scale = 1 }: GProps & { closed?: boolean }): ReactNode {
  const w = s(scale, 2.5);
  const bladeY = closed ? cy + s(scale, 10) : cy - s(scale, 14);
  return (
    <g stroke={color} strokeWidth={w} fill={color}>
      <line x1={cx - s(scale, 20)} y1={cy} x2={cx - s(scale, 8)} y2={cy} />
      <circle cx={cx - s(scale, 6)} cy={cy} r={s(scale, 3.5)} />
      <line x1={cx - s(scale, 6)} y1={cy} x2={cx + s(scale, 10)} y2={bladeY} strokeWidth={s(scale, 2.5)} />
      <circle cx={cx + s(scale, 12)} cy={cy} r={s(scale, 3.5)} />
      <line x1={cx + s(scale, 14)} y1={cy} x2={cx + s(scale, 22)} y2={cy} />
    </g>
  );
}

/** Hardwired selector switch — JIC 2-position rotary selector.
 *  Per JIC EGP-1: NO contact (diagonal blade) + vertical actuator stem + arc with position detents. */
export function DiagramSelectorSwitchHW({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  const w = s(scale, 1.8);
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      {/* Hardwired NO contact base */}
      <HW_NOContact cx={cx} cy={cy + s(scale, 8)} color={color} scale={scale * 0.8} />
      {/* Actuator stem from contact up */}
      <line x1={cx} y1={cy - s(scale, 2)} x2={cx} y2={cy - s(scale, 14)} />
      {/* Knob arc with position detents */}
      <path d={`M${cx - s(scale, 10)},${cy - s(scale, 16)} A${s(scale, 10)},${s(scale, 10)} 0 0,1 ${cx + s(scale, 10)},${cy - s(scale, 16)}`} />
      {/* Position marks (1 and 2) */}
      <line x1={cx - s(scale, 7)} y1={cy - s(scale, 23)} x2={cx - s(scale, 7)} y2={cy - s(scale, 18)} />
      <line x1={cx + s(scale, 7)} y1={cy - s(scale, 23)} x2={cx + s(scale, 7)} y2={cy - s(scale, 18)} />
      {/* Position labels */}
      <text x={cx - s(scale, 7)} y={cy - s(scale, 26)} textAnchor="middle" fill={color} stroke="none"
        style={{ fontFamily: "var(--diag-font-mono)", fontSize: `${s(scale, 7)}px` }}>1</text>
      <text x={cx + s(scale, 7)} y={cy - s(scale, 26)} textAnchor="middle" fill={color} stroke="none"
        style={{ fontFamily: "var(--diag-font-mono)", fontSize: `${s(scale, 7)}px` }}>2</text>
    </g>
  );
}

/** Hardwired guard/interlock switch — NC contact (diagonal blade + bridge) + roller lever actuator.
 *  Per JIC EGP-1 / NEMA ICS 5: NC contact with roller-lever actuator arm. */
export function DiagramGuardSwitch({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  return (
    <g stroke={color} fill="none">
      {/* Hardwired NC contact base */}
      <HW_NCContact cx={cx} cy={cy + s(scale, 6)} color={color} scale={scale * 0.75} />
      {/* Actuator arm with roller */}
      <line x1={cx} y1={cy - s(scale, 4)} x2={cx} y2={cy - s(scale, 1)} stroke={color} strokeWidth={s(scale, 1.5)} />
      <line x1={cx} y1={cy - s(scale, 4)} x2={cx + s(scale, 12)} y2={cy - s(scale, 12)} stroke={color} strokeWidth={s(scale, 1.5)} />
      <circle cx={cx + s(scale, 14)} cy={cy - s(scale, 13)} r={s(scale, 3.5)} stroke={color} strokeWidth={s(scale, 1.5)} />
      {/* Guard interlock label */}
      <text x={cx - s(scale, 10)} y={cy - s(scale, 16)} textAnchor="middle" fill={color} stroke="none"
        style={{ fontFamily: "var(--diag-font-mono)", fontSize: `${s(scale, 8)}px` }}>GS</text>
    </g>
  );
}

/** Pushbutton NO — hardwired: diagonal blade NO contact + vertical stem + button cap.
 *  Per JIC EGP-1: NO contact with pushbutton actuator above. */
export function DiagramPushbuttonNO({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  const w = s(scale, 1.8);
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      <HW_NOContact cx={cx} cy={cy + s(scale, 4)} color={color} scale={scale * 0.8} />
      {/* Actuator stem */}
      <line x1={cx} y1={cy - s(scale, 6)} x2={cx} y2={cy - s(scale, 16)} />
      {/* Button cap */}
      <line x1={cx - s(scale, 8)} y1={cy - s(scale, 16)} x2={cx + s(scale, 8)} y2={cy - s(scale, 16)} />
    </g>
  );
}

/** Pushbutton NC — hardwired: diagonal blade NC contact + vertical stem + button cap.
 *  Per JIC EGP-1: NC contact with pushbutton actuator above. */
export function DiagramPushbuttonNC({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  const w = s(scale, 1.8);
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      <HW_NCContact cx={cx} cy={cy + s(scale, 4)} color={color} scale={scale * 0.8} />
      {/* Actuator stem */}
      <line x1={cx} y1={cy - s(scale, 6)} x2={cx} y2={cy - s(scale, 16)} />
      {/* Button cap */}
      <line x1={cx - s(scale, 8)} y1={cy - s(scale, 16)} x2={cx + s(scale, 8)} y2={cy - s(scale, 16)} />
    </g>
  );
}

/** Limit switch — hardwired NO contact + roller lever actuator.
 *  Per JIC EGP-1 / NEMA ICS 5: NO contact with angled actuator arm + roller at tip. */
export function DiagramLimitSwitch({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  return (
    <g stroke={color} fill="none">
      <HW_NOContact cx={cx} cy={cy + s(scale, 6)} color={color} scale={scale * 0.75} />
      {/* Actuator arm with roller */}
      <line x1={cx} y1={cy - s(scale, 4)} x2={cx} y2={cy - s(scale, 1)} stroke={color} strokeWidth={s(scale, 1.5)} />
      <line x1={cx} y1={cy - s(scale, 4)} x2={cx + s(scale, 12)} y2={cy - s(scale, 12)} stroke={color} strokeWidth={s(scale, 1.5)} />
      <circle cx={cx + s(scale, 14)} cy={cy - s(scale, 13)} r={s(scale, 3.5)} stroke={color} strokeWidth={s(scale, 1.5)} />
    </g>
  );
}

/** E-stop — mushroom head + hardwired NC contact (NFPA 79 safety chain).
 *  Per JIC EGP-1: NC contact with mushroom-head pushbutton actuator. */
export function DiagramEStop({ cx, cy, color, scale = 1, energized = false }: GProps & { energized?: boolean }): ReactNode {
  const w = s(scale, 1.8);
  const headY = cy - s(scale, 18);
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      {/* Mushroom head */}
      <rect
        x={cx - s(scale, 10)}
        y={headY - s(scale, 6)}
        width={s(scale, 20)}
        height={s(scale, 8)}
        rx={s(scale, 4)}
        fill={energized ? color : "none"}
        opacity={energized ? 0.25 : 1}
      />
      {/* Stem */}
      <line x1={cx} y1={headY + s(scale, 2)} x2={cx} y2={cy - s(scale, 6)} />
      {/* Hardwired NC contact */}
      <HW_NCContact cx={cx} cy={cy + s(scale, 6)} color={color} scale={scale * 0.75} />
    </g>
  );
}

/** PLC digital input module — IN badge on I/O block */
export function DiagramPLCInput({ cx, cy, color, scale = 1, energized = true }: GProps & { energized?: boolean }): ReactNode {
  const w = s(scale, 1.2);
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      <rect x={cx - s(scale, 20)} y={cy - s(scale, 15)} width={s(scale, 40)} height={s(scale, 32)} rx={s(scale, 4)} fill="oklch(0.15 0.01 240 / 0.7)" strokeDasharray={energized ? "none" : "2,1"} />
      <rect x={cx - s(scale, 18)} y={cy - s(scale, 13)} width={s(scale, 16)} height={s(scale, 10)} rx={s(scale, 2)} fill="oklch(0.45 0.12 250 / 0.8)" />
      <text x={cx - s(scale, 10)} y={cy - s(scale, 5)} textAnchor="middle" className="diag-text-state font-bold" fill="white" style={{ fontFamily: "var(--diag-font-mono)" }}>
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
      <rect x={cx + s(scale, 2)} y={cy - s(scale, 13)} width={s(scale, 16)} height={s(scale, 10)} rx={s(scale, 2)} fill="oklch(0.45 0.12 155 / 0.8)" />
      <text x={cx + s(scale, 10)} y={cy - s(scale, 5)} textAnchor="middle" className="diag-text-state font-bold" fill="white" style={{ fontFamily: "var(--diag-font-mono)" }}>
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
      <text x={cx} y={cy - s(scale, 2)} textAnchor="middle" className="diag-text-state" fill={color} style={{ fontFamily: "var(--diag-font-mono)" }}>
        VFD
      </text>
      <text
        x={cx}
        y={cy + s(scale, 10)}
        textAnchor="middle"
        className="diag-text-state"
        fill={energized ? "oklch(0.55 0.12 155)" : "oklch(0.55 0.18 25)"}
        style={{ fontFamily: "var(--diag-font-mono)" }}
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
        y={cy + s(scale, 2)}
        textAnchor="middle"
        className="diag-text-xs font-bold"
        fill={color}
        style={{ fontFamily: "var(--diag-font-mono)" }}
      >
        PE
      </text>
      <text
        x={cx}
        y={cy + s(scale, 12)}
        textAnchor="middle"
        className="diag-text-xs"
        fill={color}
        style={{ fontFamily: "var(--diag-font-mono)" }}
      >
        + 0 Sig
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

/** Contactor auxiliary contact — hardwired NO contact, tagged M (seal-in / interlock).
 *  For the Standards Library (Motor Controls category), renders with diagonal blade geometry. */
export function DiagramContactorAux({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  return (
    <g>
      <HW_NOContact cx={cx} cy={cy} color={color} scale={scale} />
      <ContactTag cx={cx} cy={cy} color={color} scale={scale} tag="M" dy={22} />
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
      <ContactTag cx={cx} cy={cy} color={color} scale={scale} tag="SR" dy={20} />
    </g>
  );
}

/** Timer contact — hardwired NO contact with timing arc indicator.
 *  Per JIC EGP-1: NO contact + small timing arc near blade. */
export function DiagramTimerContact({ cx, cy, color, scale = 1 }: GProps): ReactNode {
  return (
    <g>
      <HW_NOContact cx={cx} cy={cy + s(scale, 4)} color={color} scale={scale} />
      {/* Timing arc indicator */}
      <path d={`M${cx - s(scale, 6)},${cy - s(scale, 14)} A${s(scale, 6)},${s(scale, 6)} 0 0,1 ${cx + s(scale, 6)},${cy - s(scale, 14)}`}
        stroke={color} strokeWidth={s(scale, 1.5)} fill="none" />
      {/* Arrow on timing arc */}
      <polyline points={`${cx + s(scale, 4)},${cy - s(scale, 17)} ${cx + s(scale, 6)},${cy - s(scale, 14)} ${cx + s(scale, 9)},${cy - s(scale, 15)}`}
        stroke={color} strokeWidth={s(scale, 1.2)} fill="none" />
      <ContactTag cx={cx} cy={cy} color={color} scale={scale} tag="TMR" dy={26} />
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
