/**
 * Physical / pictorial plant-floor device icons for the Conveyor Machine Twin.
 *
 * CONTEXT RULE (see docs/SYMBOL_QA.md): the Machine Twin shows what the devices
 * LOOK LIKE on the floor — a motor, a red mushroom E-stop, a guard door, an
 * overload relay — with live running/stopped/open/tripped state. Schematic NC/NO
 * contact symbols belong ONLY in the Ladder tab and the Standards Library.
 * A physical device drawn as a contact fails QA.
 *
 * These are intentionally NOT the electrical symbols. For the schematic contacts,
 * see ConveyorLadderSymbol.tsx (Ladder) and electricalDiagramPrimitives.tsx.
 */

const STEEL = "oklch(0.34 0.012 250)";
const STEEL_LT = "oklch(0.46 0.016 250)";
const STEEL_HI = "oklch(0.58 0.02 250)";
const EDGE = "oklch(0.62 0.02 250)";
const GREEN = "oklch(0.68 0.16 155)";
const GREEN_DIM = "oklch(0.30 0.05 155)";
const RED = "oklch(0.60 0.21 27)";
const RED_DIM = "oklch(0.30 0.07 27)";
const ESTOP_RED = "oklch(0.55 0.22 27)";
const ESTOP_RED_HI = "oklch(0.66 0.22 27)";
const YELLOW = "oklch(0.82 0.16 95)";
const AMBER = "oklch(0.74 0.16 72)";
const LABEL_OFF = "oklch(0.34 0.01 250)";

const W = 72;
const H = 60;

/** Three-phase motor / load — the physical driven machine. Never a contact. */
export function MotorDevice({ running }: { running: boolean }) {
  const accent = running ? GREEN : STEEL_LT;
  return (
    <svg width={W} height={H} viewBox="0 0 72 60" className="shrink-0" role="img" aria-label={running ? "Motor running" : "Motor stopped"}>
      {running && <ellipse cx={30} cy={32} rx={26} ry={18} fill={GREEN} opacity={0.10} />}
      {/* conduit / terminal box */}
      <rect x={22} y={10} width={16} height={9} rx={1.5} fill={STEEL} stroke={STEEL_LT} strokeWidth={1} />
      {/* motor body with cooling fins */}
      <rect x={10} y={18} width={34} height={24} rx={4} fill={STEEL} stroke={EDGE} strokeWidth={1.4} />
      {[15, 19, 23, 27, 31, 35, 39].map((x) => (
        <line key={x} x1={x} y1={20} x2={x} y2={40} stroke={STEEL_HI} strokeWidth={0.9} />
      ))}
      {/* drive-end bell */}
      <rect x={43} y={16} width={9} height={28} rx={3} fill={STEEL_LT} stroke={EDGE} strokeWidth={1.4} />
      {/* output shaft */}
      <rect x={52} y={27} width={11} height={6} rx={1} fill={STEEL_HI} stroke={EDGE} strokeWidth={1} />
      {/* mounting feet */}
      <rect x={14} y={42} width={8} height={5} rx={1} fill={STEEL_LT} />
      <rect x={32} y={42} width={8} height={5} rx={1} fill={STEEL_LT} />
      {/* nameplate */}
      <rect x={18} y={26} width={18} height={9} rx={1} fill="oklch(0.14 0.006 250)" stroke={accent} strokeWidth={1} />
      <text x={27} y={33} textAnchor="middle" fontFamily="var(--diag-font-mono, monospace)" fontSize={7} fontWeight={700} fill={running ? GREEN : STEEL_HI}>M</text>
      {/* rotation indicator when running */}
      {running && (
        <g stroke={GREEN} strokeWidth={1.6} fill="none" strokeLinecap="round">
          <path d="M55 20 a7 7 0 0 1 6 6" />
          <path d="M61 24 l0.4 3 l-3 -0.6" />
        </g>
      )}
    </svg>
  );
}

/** Red mushroom emergency-stop pushbutton. */
export function EStopDevice({ pressed }: { pressed: boolean }) {
  const capY = pressed ? 27 : 22;
  const capRy = pressed ? 8 : 11;
  return (
    <svg width={W} height={H} viewBox="0 0 72 60" className="shrink-0" role="img" aria-label={pressed ? "E-stop pressed" : "E-stop released"}>
      {pressed && <circle cx={36} cy={30} r={24} fill={ESTOP_RED} opacity={0.14} />}
      {/* yellow housing / legend plate */}
      <rect x={16} y={38} width={40} height={13} rx={3} fill={YELLOW} stroke="oklch(0.62 0.14 95)" strokeWidth={1} />
      <text x={36} y={48} textAnchor="middle" fontFamily="var(--diag-font-mono, monospace)" fontSize={6} fontWeight={700} fill="oklch(0.25 0.05 95)">E-STOP</text>
      {/* mounting collar */}
      <ellipse cx={36} cy={37} rx={17} ry={5} fill="oklch(0.70 0.14 95)" stroke="oklch(0.60 0.14 95)" strokeWidth={1} />
      {/* red mushroom cap */}
      <ellipse cx={36} cy={capY + capRy} rx={17} ry={4} fill={RED_DIM} />
      <ellipse cx={36} cy={capY} rx={17} ry={capRy} fill={ESTOP_RED} stroke={ESTOP_RED_HI} strokeWidth={1.2} />
      <ellipse cx={31} cy={capY - capRy * 0.35} rx={6} ry={capRy * 0.4} fill={ESTOP_RED_HI} opacity={0.7} />
      {pressed && (
        <text x={36} y={capY + 2} textAnchor="middle" fontFamily="var(--diag-font-mono, monospace)" fontSize={5.5} fontWeight={700} fill="oklch(0.95 0.02 27)">PRESSED</text>
      )}
    </svg>
  );
}

/** Machine guard door with an interlock switch. */
export function GuardDevice({ open }: { open: boolean }) {
  const switchColor = open ? RED : GREEN;
  return (
    <svg width={W} height={H} viewBox="0 0 72 60" className="shrink-0" role="img" aria-label={open ? "Guard open" : "Guard closed"}>
      {/* guard opening / frame */}
      <rect x={12} y={10} width={40} height={40} rx={2} fill="oklch(0.09 0.004 250)" stroke={STEEL_LT} strokeWidth={1.4} />
      {/* hinge posts */}
      <circle cx={14} cy={16} r={1.6} fill={EDGE} />
      <circle cx={14} cy={44} r={1.6} fill={EDGE} />
      {/* guard door (mesh panel), hinged on the left; swings open */}
      <g transform={open ? "rotate(-32 14 30)" : "rotate(0 14 30)"} style={{ transition: "transform 0.3s" }}>
        <rect x={14} y={12} width={34} height={36} rx={1.5} fill={STEEL} stroke={EDGE} strokeWidth={1.4} opacity={0.96} />
        {/* mesh */}
        {[19, 24, 29, 34, 39, 44].map((x) => (
          <line key={`v${x}`} x1={x} y1={13} x2={x} y2={47} stroke={STEEL_HI} strokeWidth={0.7} opacity={0.7} />
        ))}
        {[18, 24, 30, 36, 42].map((y) => (
          <line key={`h${y}`} x1={15} y1={y} x2={47} y2={y} stroke={STEEL_HI} strokeWidth={0.7} opacity={0.7} />
        ))}
      </g>
      {/* interlock switch box on the latch side */}
      <rect x={50} y={24} width={12} height={13} rx={1.5} fill={STEEL_LT} stroke={EDGE} strokeWidth={1.2} />
      <circle cx={56} cy={30.5} r={3} fill={switchColor} stroke="oklch(0.12 0.006 250)" strokeWidth={0.8} />
      {open && <circle cx={56} cy={30.5} r={5.5} fill={RED} opacity={0.22} />}
      {open && (
        <text x={32} y={57} textAnchor="middle" fontFamily="var(--diag-font-mono, monospace)" fontSize={6} fontWeight={700} fill={AMBER}>OPEN</text>
      )}
    </svg>
  );
}

/** Overload relay / motor starter protection block. */
export function OverloadDevice({ tripped }: { tripped: boolean }) {
  const flag = tripped ? RED : GREEN;
  return (
    <svg width={W} height={H} viewBox="0 0 72 60" className="shrink-0" role="img" aria-label={tripped ? "Overload tripped" : "Overload healthy"}>
      {tripped && <rect x={16} y={6} width={40} height={46} rx={4} fill={RED} opacity={0.10} />}
      {/* relay body */}
      <rect x={20} y={8} width={32} height={40} rx={3} fill={STEEL} stroke={EDGE} strokeWidth={1.4} />
      {/* FLA adjustment dial */}
      <circle cx={36} cy={19} r={6} fill="oklch(0.16 0.006 250)" stroke={STEEL_HI} strokeWidth={1.2} />
      <line x1={36} y1={19} x2={39.5} y2={16} stroke={EDGE} strokeWidth={1.4} strokeLinecap="round" />
      {/* RESET + TEST buttons */}
      <rect x={23} y={29} width={10} height={6} rx={1} fill="oklch(0.30 0.06 150)" stroke={STEEL_HI} strokeWidth={0.8} />
      <rect x={39} y={29} width={10} height={6} rx={1} fill="oklch(0.30 0.05 60)" stroke={STEEL_HI} strokeWidth={0.8} />
      {/* trip status window */}
      <rect x={25} y={38} width={22} height={7} rx={1} fill="oklch(0.10 0.006 250)" stroke={flag} strokeWidth={1.1} />
      <text x={36} y={43.6} textAnchor="middle" fontFamily="var(--diag-font-mono, monospace)" fontSize={5.5} fontWeight={700} fill={flag}>{tripped ? "TRIP" : "OK"}</text>
      {/* control terminals (95-96, 97-98) */}
      {[26, 32, 40, 46].map((x) => (
        <line key={x} x1={x} y1={48} x2={x} y2={52} stroke={EDGE} strokeWidth={1.4} strokeLinecap="round" />
      ))}
    </svg>
  );
}

/** Photo-eye / diffuse sensor with beam. */
export function PhotoeyeDevice({ blocked }: { blocked: boolean }) {
  const lens = blocked ? AMBER : GREEN;
  return (
    <svg width={44} height={W} viewBox="0 0 44 72" className="shrink-0" role="img" aria-label={blocked ? "Photo-eye blocked" : "Photo-eye clear"}>
      {/* sensor housing */}
      <rect x={6} y={22} width={16} height={28} rx={3} fill={STEEL} stroke={EDGE} strokeWidth={1.4} />
      {/* lens */}
      <circle cx={22} cy={36} r={4} fill={lens} stroke="oklch(0.12 0.006 250)" strokeWidth={0.8} />
      {/* status LED */}
      <circle cx={11} cy={27} r={1.8} fill={blocked ? AMBER : GREEN} />
      {/* beam */}
      <line x1={26} y1={36} x2={42} y2={36} stroke={lens} strokeWidth={1.4} strokeDasharray="2 2" opacity={blocked ? 0.4 : 0.9} />
      {/* reflector */}
      <rect x={40} y={30} width={3} height={12} rx={1} fill={STEEL_LT} stroke={EDGE} strokeWidth={0.8} />
    </svg>
  );
}

/** Two-stage stack light (status tower). */
export function StackLight({ run, fault }: { run: boolean; fault: boolean }) {
  return (
    <svg width={34} height={W} viewBox="0 0 34 72" className="shrink-0" role="img" aria-label="Stack light">
      {/* red lamp (top) */}
      <ellipse cx={17} cy={14} rx={12} ry={4} fill={fault ? RED : RED_DIM} />
      <path d="M5 14 a12 10 0 0 1 24 0 Z" fill={fault ? RED : RED_DIM} stroke="oklch(0.12 0.006 250)" strokeWidth={0.8} />
      {fault && <ellipse cx={17} cy={14} rx={16} ry={7} fill={RED} opacity={0.18} />}
      {/* green lamp (bottom) */}
      <ellipse cx={17} cy={34} rx={12} ry={4} fill={run ? GREEN : GREEN_DIM} />
      <path d="M5 34 a12 10 0 0 1 24 0 Z" fill={run ? GREEN : GREEN_DIM} stroke="oklch(0.12 0.006 250)" strokeWidth={0.8} />
      {run && <ellipse cx={17} cy={34} rx={16} ry={7} fill={GREEN} opacity={0.18} />}
      {/* pole + base */}
      <rect x={14} y={40} width={6} height={20} fill={STEEL_LT} />
      <rect x={8} y={58} width={18} height={6} rx={1.5} fill={STEEL} stroke={EDGE} strokeWidth={1} />
    </svg>
  );
}
