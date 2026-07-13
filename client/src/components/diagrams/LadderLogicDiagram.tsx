/**
 * LadderLogicDiagram — true RSLogix / Studio-5000-style ladder rendering.
 * Left/right power rails, numbered rungs, XIC -| |- / XIO -|/|- contacts,
 * OTE/OTL/OTU coils, optional seal-in branch, nicknames above + addresses below,
 * green when energized (rung condition true), and an END rung. Matches the
 * customer's ladder reference.
 */
import type { LadderProgram, LadderContact, LadderCoil, LadderBox } from "@shared/ladderProgram";

const RAIL_L = 48;
const RAIL_R = 712;
const RUNG_H = 118;
const TOP = 44;
const ON = "#22c55e";
const OFF = "#64748b";
const RAIL = "#94a3b8";
const NICK = "#fbbf24";
const ADDR = "#94a3b8";

function Contact({ x, cy, c }: { x: number; cy: number; c: LadderContact }) {
  const col = c.energized ? ON : OFF;
  const w = c.energized ? 3 : 1.6;
  return (
    <g>
      {/* highlight bar behind an energized contact, like the online monitor */}
      {c.energized && <rect x={x - 16} y={cy - 5} width={32} height={10} fill={ON} opacity={0.18} />}
      <line x1={x - 7} y1={cy - 13} x2={x - 7} y2={cy + 13} stroke={col} strokeWidth={w} />
      <line x1={x + 7} y1={cy - 13} x2={x + 7} y2={cy + 13} stroke={col} strokeWidth={w} />
      {c.type === "XIO" && <line x1={x - 9} y1={cy + 13} x2={x + 9} y2={cy - 13} stroke={col} strokeWidth={w} />}
      {c.nickname && (
        <text x={x} y={cy - 24} textAnchor="middle" fill={NICK} style={{ fontSize: 10, fontFamily: "var(--diag-font-mono, monospace)" }}>{c.nickname}</text>
      )}
      <text x={x} y={cy + 26} textAnchor="middle" fill={ADDR} style={{ fontSize: 10, fontFamily: "var(--diag-font-mono, monospace)" }}>{c.address}</text>
    </g>
  );
}

function Coil({ x, cy, c }: { x: number; cy: number; c: LadderCoil }) {
  const col = c.energized ? ON : OFF;
  const w = c.energized ? 3 : 1.6;
  const letter = c.type === "OTL" ? "L" : c.type === "OTU" ? "U" : "";
  return (
    <g>
      <path d={`M ${x - 14} ${cy - 14} A 16 16 0 0 0 ${x - 14} ${cy + 14}`} fill="none" stroke={col} strokeWidth={w} />
      <path d={`M ${x + 14} ${cy - 14} A 16 16 0 0 1 ${x + 14} ${cy + 14}`} fill="none" stroke={col} strokeWidth={w} />
      {letter && <text x={x} y={cy + 5} textAnchor="middle" fill={col} style={{ fontSize: 13, fontWeight: 700 }}>{letter}</text>}
      {c.nickname && (
        <text x={x} y={cy - 24} textAnchor="middle" fill={NICK} style={{ fontSize: 10, fontFamily: "var(--diag-font-mono, monospace)" }}>{c.nickname}</text>
      )}
      <text x={x} y={cy + 26} textAnchor="middle" fill={ADDR} style={{ fontSize: 10, fontFamily: "var(--diag-font-mono, monospace)" }}>{c.address}</text>
    </g>
  );
}

const BOX_W = 150;

/** Height an instruction box needs, so rung spacing / vertical centering can account for it. */
function boxHeight(box: LadderBox) {
  return 20 + (box.title ? 14 : 0) + box.operands.length * 14 + 10;
}

/**
 * Instruction box — TON/CTU timers/counters, LES/EQU compares, XOR/MOV math.
 * Header holds the mnemonic; an optional title, then label/value operand rows.
 * OUTPUT boxes (with `legs`) carry EN/DN/TT status bits on the right edge and
 * pass power through to the right rail; COMPARE boxes have no legs and simply
 * conduct when true, sitting inline in the condition path.
 */
function Box({ x, cy, box }: { x: number; cy: number; box: LadderBox }) {
  const col = box.energized ? ON : OFF;
  const w = box.energized ? 2.2 : 1.4;
  const bh = boxHeight(box);
  const headerH = 20;
  const titleH = box.title ? 14 : 0;
  const top = cy - bh / 2;
  const left = x - BOX_W / 2;
  const right = x + BOX_W / 2;
  const rowY0 = top + headerH + titleH + 12;
  return (
    <g style={{ fontFamily: "var(--diag-font-mono, monospace)" }}>
      <rect x={left} y={top} width={BOX_W} height={bh} rx={2} fill="#0d1117" stroke={col} strokeWidth={w} />
      <line x1={left} y1={top + headerH} x2={right} y2={top + headerH} stroke={col} strokeWidth={1} />
      <text x={x} y={top + 14} textAnchor="middle" fill={col} style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>{box.instr}</text>
      {box.title && <text x={x} y={top + headerH + 11} textAnchor="middle" fill={ADDR} style={{ fontSize: 8.5 }}>{box.title}</text>}
      {box.operands.map((op, i) => (
        <g key={i}>
          <text x={left + 8} y={rowY0 + i * 14} fill={ADDR} style={{ fontSize: 9 }}>{op.label}</text>
          <text x={right - 8} y={rowY0 + i * 14} textAnchor="end" fill="#e2e8f0" style={{ fontSize: 9 }}>{op.value}</text>
        </g>
      ))}
      {/* EN/DN/TT status legs on the right edge of an output box, stacked around center */}
      {box.legs?.map((leg, i) => {
        const n = box.legs!.length;
        const ly = cy + (i - (n - 1) / 2) * 16;
        return (
          <g key={leg}>
            <circle cx={right} cy={ly} r={4} fill="none" stroke={col} strokeWidth={1.4} />
            <text x={right - 7} y={ly + 3} textAnchor="end" fill={col} style={{ fontSize: 8 }}>{`(${leg})`}</text>
          </g>
        );
      })}
    </g>
  );
}

export default function LadderLogicDiagram({ program }: { program: LadderProgram }) {
  const height = TOP + program.rungs.length * RUNG_H + 70;
  const coilX = RAIL_R - 60;

  return (
    <svg viewBox={`0 0 760 ${height}`} width="100%" role="img" aria-label="Ladder logic program" style={{ background: "var(--diag-bg, #0a0f0a)" }}>
      {program.rungs.map((rung, i) => {
        const cy = TOP + i * RUNG_H + 40;
        // Contacts packed on the LEFT at a fixed pitch; the coil sits at the right
        // rail with a clear horizontal run between the last contact and the coil.
        const CONTACT_GAP = 104;
        const firstX = RAIL_L + 66;
        const xs = rung.series.map((_, k) => firstX + k * CONTACT_GAP);
        const railToFirst = xs[0];
        const lastRight = xs[xs.length - 1] + 7;

        // Terminal element: an output box (sits left of the rail with its legs)
        // or a coil at the right rail.
        const hasOutBox = !!rung.outputBox;
        const termCenter = hasOutBox ? RAIL_R - 110 : coilX;
        const termLeft = hasOutBox ? termCenter - BOX_W / 2 : coilX - 16;
        const termRight = hasOutBox ? termCenter + BOX_W / 2 : coilX + 16;
        const termOn = hasOutBox ? !!rung.outputBox?.energized : !!rung.coil?.energized;

        // Optional compare box, centered between the last contact and the terminal.
        const hasCmp = !!rung.compare;
        const cmpCenter = hasCmp ? (lastRight + termLeft) / 2 : 0;
        const cmpLeft = cmpCenter - BOX_W / 2;
        const cmpRight = cmpCenter + BOX_W / 2;
        const condEnd = hasCmp ? cmpLeft : termLeft; // where the series contacts run to

        return (
          <g key={rung.number}>
            {/* rung number */}
            <text x={10} y={cy + 4} fill={ADDR} style={{ fontSize: 11, fontFamily: "var(--diag-font-mono, monospace)" }}>{String(rung.number).padStart(4, "0")}</text>
            {/* comment */}
            {rung.comment && (
              <text x={RAIL_L + 6} y={cy - 42} fill="#a7f3d0" style={{ fontSize: 10 }}>{rung.comment}</text>
            )}
            {/* rails */}
            <line x1={RAIL_L} y1={cy - 30} x2={RAIL_L} y2={cy + 46} stroke={RAIL} strokeWidth={2} />
            <line x1={RAIL_R} y1={cy - 30} x2={RAIL_R} y2={cy + 46} stroke={RAIL} strokeWidth={2} />

            {/* main line segments */}
            <line x1={RAIL_L} y1={cy} x2={railToFirst - 7} y2={cy} stroke={RAIL} strokeWidth={1.6} />
            {xs.map((x, k) => {
              const nextX = k < xs.length - 1 ? xs[k + 1] - 7 : condEnd;
              const seg = rung.series[k].energized ? ON : RAIL;
              return <line key={k} x1={x + 7} y1={cy} x2={nextX} y2={cy} stroke={seg} strokeWidth={rung.series[k].energized ? 2.4 : 1.6} />;
            })}
            {/* compare box in the condition path + its run to the terminal */}
            {rung.compare && (
              <>
                <line x1={cmpRight} y1={cy} x2={termLeft} y2={cy} stroke={rung.compare.energized ? ON : RAIL} strokeWidth={rung.compare.energized ? 2.4 : 1.6} />
                <Box x={cmpCenter} cy={cy} box={rung.compare} />
              </>
            )}
            {/* terminal run to the right rail */}
            <line x1={termRight} y1={cy} x2={RAIL_R} y2={cy} stroke={termOn ? ON : RAIL} strokeWidth={termOn ? 2.4 : 1.6} />

            {/* seal-in parallel branch around the first contact — taps before it, rejoins after it */}
            {rung.sealIn && (() => {
              const bL = xs[0] - 34;                       // junction before the first contact
              const bR = xs[0] + 34;                       // junction after the first contact
              const bY = cy + 38;                          // branch depth
              const col = rung.sealIn.energized ? ON : RAIL;
              const w = rung.sealIn.energized ? 2.4 : 1.6;
              return (
                <g>
                  {/* drop-downs from the main line at the tap points */}
                  <line x1={bL} y1={cy} x2={bL} y2={bY} stroke={RAIL} strokeWidth={1.6} />
                  <line x1={bR} y1={cy} x2={bR} y2={bY} stroke={col} strokeWidth={w} />
                  {/* horizontal branch through the seal-in contact */}
                  <line x1={bL} y1={bY} x2={xs[0] - 7} y2={bY} stroke={col} strokeWidth={w} />
                  <line x1={xs[0] + 7} y1={bY} x2={bR} y2={bY} stroke={col} strokeWidth={w} />
                  <Contact x={xs[0]} cy={bY} c={rung.sealIn} />
                </g>
              );
            })()}

            {/* contacts + terminal (coil or output box) */}
            {xs.map((x, k) => <Contact key={k} x={x} cy={cy} c={rung.series[k]} />)}
            {rung.outputBox ? <Box x={termCenter} cy={cy} box={rung.outputBox} /> : rung.coil ? <Coil x={coilX} cy={cy} c={rung.coil} /> : null}
          </g>
        );
      })}

      {/* END rung */}
      <g>
        <text x={10} y={TOP + program.rungs.length * RUNG_H + 24} fill={ADDR} style={{ fontSize: 11, fontFamily: "var(--diag-font-mono, monospace)" }}>{String(program.rungs.length).padStart(4, "0")}</text>
        <line x1={RAIL_L} y1={TOP + program.rungs.length * RUNG_H + 20} x2={RAIL_R} y2={TOP + program.rungs.length * RUNG_H + 20} stroke={RAIL} strokeWidth={1.6} />
        <text x={(RAIL_L + RAIL_R) / 2} y={TOP + program.rungs.length * RUNG_H + 24} textAnchor="middle" fill={ADDR} style={{ fontSize: 11, letterSpacing: 2 }}>( END )</text>
      </g>
    </svg>
  );
}
