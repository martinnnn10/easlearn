// Ladder-tab PLC instruction symbols only. Uses Allen-Bradley naming:
//   XIC (Examine If Closed) — passes when bit = TRUE — symbol: --] [--
//   XIO (Examine If Open)   — passes when bit = FALSE — symbol: --]/[--
//
// RSLogix 500/Studio 5000 Online Monitor Color Rules:
//   - Element PASSING (continuity TRUE): bright green (#22c55e equivalent)
//   - Element NOT PASSING (continuity FALSE): dim gray
//
// The Machine Twin's PHYSICAL device icons (motor, E-stop, guard, overload)
// live in ConveyorPhysicalDevices.tsx — do not draw physical devices as
// contacts here. See docs/SYMBOL_QA.md.

const SIZE = 36;

// RSLogix color constants
const RSLOGIX_GREEN = "oklch(0.62 0.17 145)";   // Passing / energized
const RSLOGIX_GRAY = "oklch(0.30 0.006 250)";   // Not passing / de-energized

interface LadderSymbolProps {
  kind: "XIC" | "XIO" | "coil" | "timer";
  active: boolean;
}

export function ConveyorLadderSymbol({ kind, active }: LadderSymbolProps) {
  const color = active ? RSLOGIX_GREEN : RSLOGIX_GRAY;
  const strokeW = active ? 2 : 1.5;
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
      {/* RSLogix-style green highlight bar behind passing elements */}
      {active && (kind === "XIC" || kind === "XIO") && (
        <rect
          x={cx - 12}
          y={cy - 5}
          width={24}
          height={10}
          fill={RSLOGIX_GREEN}
          opacity={0.15}
          rx={2}
        />
      )}
      {kind === "XIC" && (
        <g stroke={color} strokeWidth={strokeW} fill="none">
          {/* Two vertical bars (contact plates) — --] [-- */}
          <line x1={cx - 7.7} y1={cy - 8.8} x2={cx - 7.7} y2={cy + 8.8} />
          <line x1={cx + 7.7} y1={cy - 8.8} x2={cx + 7.7} y2={cy + 8.8} />
          {/* Horizontal leads (wire connections) */}
          <line x1={cx - 7.7 - 4.4} y1={cy} x2={cx - 7.7} y2={cy} />
          <line x1={cx + 7.7} y1={cy} x2={cx + 7.7 + 4.4} y2={cy} />
        </g>
      )}
      {kind === "XIO" && (
        <g stroke={color} strokeWidth={strokeW} fill="none">
          {/* Two vertical bars (contact plates) — --]/[-- */}
          <line x1={cx - 7.7} y1={cy - 8.8} x2={cx - 7.7} y2={cy + 8.8} />
          <line x1={cx + 7.7} y1={cy - 8.8} x2={cx + 7.7} y2={cy + 8.8} />
          {/* Diagonal slash (distinguishes XIO from XIC) */}
          <line x1={cx - 8.8} y1={cy + 8.8} x2={cx + 8.8} y2={cy - 8.8} />
          {/* Horizontal leads (wire connections) */}
          <line x1={cx - 7.7 - 4.4} y1={cy} x2={cx - 7.7} y2={cy} />
          <line x1={cx + 7.7} y1={cy} x2={cx + 7.7 + 4.4} y2={cy} />
        </g>
      )}
      {kind === "coil" && (
        <g stroke={color} strokeWidth={strokeW} fill="none">
          {/* RSLogix green highlight behind energized coil */}
          {active && (
            <circle cx={cx} cy={cy} r={10} fill={RSLOGIX_GREEN} opacity={0.12} stroke="none" />
          )}
          {/* Parentheses-style coil symbol — ( ) */}
          <path d={`M ${cx - 8} ${cy - 8} Q ${cx - 12} ${cy} ${cx - 8} ${cy + 8}`} />
          <path d={`M ${cx + 8} ${cy - 8} Q ${cx + 12} ${cy} ${cx + 8} ${cy + 8}`} />
          {/* Horizontal leads */}
          <line x1={cx - 8 - 4.4} y1={cy} x2={cx - 8} y2={cy} />
          <line x1={cx + 8} y1={cy} x2={cx + 8 + 4.4} y2={cy} />
        </g>
      )}
      {kind === "timer" && (
        <g>
          {active && (
            <rect
              x={4}
              y={10}
              width={28}
              height={16}
              rx={2}
              fill={RSLOGIX_GREEN}
              opacity={0.12}
            />
          )}
          <rect
            x={4}
            y={10}
            width={28}
            height={16}
            rx={2}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
          />
          <text x={cx} y={cy + 3} textAnchor="middle" className="diag-text-xs" fill={color}>
            TON
          </text>
        </g>
      )}
    </svg>
  );
}
