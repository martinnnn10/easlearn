/**
 * Hydraulic clamp/press station schematic — the diagnostic surface for the
 * Hydraulic Pressure-Loss simulator. Test points are clickable; a probed point
 * reveals its reading and tones red/amber/green. Presentational only — all
 * grading lives in shared/hydraulicSim.ts.
 *
 * Layout: components sit on the flow line (mid band); gauge/observation markers
 * live in the clear top and bottom lanes with a leader line down to what they
 * measure, so a reading never overlaps a component.
 */
import type { HydraulicReading, HydraulicTestPointId } from "@shared/hydraulicSim";

const TONE: Record<HydraulicReading["tone"], string> = {
  normal: "oklch(0.68 0.15 155)",
  warning: "oklch(0.78 0.15 85)",
  critical: "oklch(0.65 0.20 25)",
};

interface Marker {
  id: HydraulicTestPointId;
  x: number; // marker (dot) center
  y: number;
  leaderTo: number; // y to draw the leader line toward (the flow line / component)
  label: string;
  band: "top" | "bottom";
}

const FLOW_Y = 210;

// Component centers on the flow line
const CX = { reservoir: 110, pump: 250, filter: 370, dcv: 470, cylinder: 585 };

const MARKERS: Marker[] = [
  { id: "pump_outlet", x: CX.pump, y: 108, leaderTo: 188, label: "P1 · pump outlet", band: "top" },
  { id: "filter_delta", x: CX.filter, y: 108, leaderTo: 188, label: "Filter ΔP", band: "top" },
  { id: "flow", x: CX.dcv, y: 108, leaderTo: 188, label: "Flow", band: "top" },
  { id: "work_port", x: CX.cylinder, y: 108, leaderTo: 188, label: "P2 · work port", band: "top" },
  { id: "sight_glass", x: 70, y: 320, leaderTo: 236, label: "Sight glass", band: "bottom" },
  { id: "reservoir_temp", x: 155, y: 320, leaderTo: 236, label: "Oil temp", band: "bottom" },
  { id: "relief_line_temp", x: 300, y: 320, leaderTo: 250, label: "Relief line", band: "bottom" },
  { id: "observe_symptom", x: CX.cylinder, y: 320, leaderTo: 236, label: "Watch clamp", band: "bottom" },
];

function Box({ cx, w, label, sub }: { cx: number; w: number; label: string; sub?: string }) {
  const x = cx - w / 2;
  return (
    <g>
      <rect x={x} y={186} width={w} height={48} rx="6" fill="oklch(0.14 0.004 250)" stroke="oklch(0.36 0.006 250)" strokeWidth="1.5" />
      <text x={cx} y={sub ? 206 : 214} textAnchor="middle" fill="oklch(0.84 0.01 250)" fontSize="12.5" fontFamily="system-ui, sans-serif" fontWeight="600">{label}</text>
      {sub && <text x={cx} y={220} textAnchor="middle" fill="oklch(0.56 0.01 250)" fontSize="9" fontFamily="system-ui, sans-serif">{sub}</text>}
    </g>
  );
}

export default function HydraulicSchematic({
  readings,
  gathered,
  onProbe,
}: {
  readings: Record<HydraulicTestPointId, HydraulicReading>;
  gathered: Set<HydraulicTestPointId>;
  onProbe: (p: HydraulicTestPointId) => void;
}) {
  return (
    <svg viewBox="0 0 660 380" className="w-full h-auto select-none" role="img" aria-label="Hydraulic clamp station schematic">
      <rect x="0" y="0" width="660" height="380" fill="oklch(0.09 0.003 250)" rx="10" />
      <text x="330" y="24" textAnchor="middle" fill="oklch(0.60 0.01 250)" fontSize="11" fontFamily="system-ui">Tap a test point — where pressure is present vs. missing tells the story</text>

      {/* main flow path (pressure side) + relief/return (dashed) */}
      <path d={`M${CX.reservoir} 234 V${FLOW_Y} H${CX.pump - 40} M${CX.pump + 40} ${FLOW_Y} H${CX.filter - 35} M${CX.filter + 35} ${FLOW_Y} H${CX.dcv - 35} M${CX.dcv + 35} ${FLOW_Y} H${CX.cylinder - 62}`}
        fill="none" stroke="oklch(0.45 0.10 155)" strokeWidth="2.5" />
      <path d={`M${CX.pump} 234 V270 H${CX.reservoir} V234`} fill="none" stroke="oklch(0.42 0.07 250)" strokeWidth="1.5" strokeDasharray="5 4" />

      {/* components */}
      <Box cx={CX.reservoir} w={150} label="Reservoir" sub="oil + strainer" />
      <Box cx={CX.pump} w={80} label="Pump" sub="makes flow" />
      <Box cx={CX.filter} w={70} label="Filter" sub="pressure" />
      <Box cx={CX.dcv} w={70} label="DCV" sub="direction" />
      <Box cx={CX.cylinder} w={120} label="Clamp cyl." sub="the work" />
      <rect x={CX.pump - 8} y={244} width={16} height={22} rx="2" fill="oklch(0.14 0.004 250)" stroke="oklch(0.36 0.06 25)" />
      <text x={CX.pump} y={259} textAnchor="middle" fill="oklch(0.60 0.06 25)" fontSize="8" fontFamily="system-ui">relief</text>

      {/* markers */}
      {MARKERS.map((m) => {
        const isOn = gathered.has(m.id);
        const r = isOn ? readings[m.id] : undefined;
        const labelY = m.band === "top" ? m.y - 15 : m.y + 40;
        const valueY = m.band === "top" ? m.y - 30 : m.y + 26;
        return (
          <g key={m.id} style={{ cursor: "pointer" }} onClick={() => onProbe(m.id)}>
            {/* leader line */}
            <line x1={m.x} y1={m.band === "top" ? m.y + 10 : m.y - 10} x2={m.x} y2={m.leaderTo}
              stroke={r ? TONE[r.tone] : "oklch(0.26 0.004 250)"} strokeWidth="1.2" strokeDasharray="2 3" />
            <circle cx={m.x} cy={m.y} r="10" fill={r ? TONE[r.tone] : "oklch(0.18 0.004 250)"} stroke="oklch(0.50 0.01 250)" strokeWidth="1.5" />
            <text x={m.x} y={m.y + 3.5} textAnchor="middle" fill={r ? "oklch(0.10 0 0)" : "oklch(0.68 0.01 250)"} fontSize="11" fontWeight="700" fontFamily="system-ui">{isOn ? "✓" : "?"}</text>
            <text x={m.x} y={labelY} textAnchor="middle" fill="oklch(0.62 0.01 250)" fontSize="9.5" fontFamily="system-ui">{m.label}</text>
            {r && <text x={m.x} y={valueY} textAnchor="middle" fill={TONE[r.tone]} fontSize="12" fontWeight="700" fontFamily="monospace">{`${r.value}${r.unit ? " " + r.unit : ""}`}</text>}
          </g>
        );
      })}
    </svg>
  );
}
