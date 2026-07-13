import { useState } from "react";
import { Minus, Plus, Hand } from "lucide-react";
import type { LessonCardVisual } from "@shared/learningCardTypes";
import MotorStarterInteractive from "./interactive/MotorStarterInteractive";

function IoTerminalDiagram() {
  return (
    <svg viewBox="0 0 320 120" className="w-full h-auto" aria-hidden>
      <rect x="8" y="16" width="120" height="88" rx="4" fill="oklch(0.12 0.003 250)" stroke="oklch(0.28 0.004 250)" />
      <text x="20" y="36" fill="oklch(0.55 0.008 250)" fontSize="10" fontFamily="monospace">
        INPUT MODULE I:0
      </text>
      <text x="20" y="56" fill="oklch(0.72 0.008 250)" fontSize="10" fontFamily="monospace">
        I:0/0 E-stop NC
      </text>
      <text x="20" y="72" fill="oklch(0.72 0.008 250)" fontSize="10" fontFamily="monospace">
        I:0/1 Photoeye
      </text>
      <text x="20" y="88" fill="oklch(0.72 0.008 250)" fontSize="10" fontFamily="monospace">
        I:0/2 Overload
      </text>
      <rect x="192" y="16" width="120" height="88" rx="4" fill="oklch(0.12 0.003 250)" stroke="oklch(0.28 0.004 250)" />
      <text x="204" y="36" fill="oklch(0.55 0.008 250)" fontSize="10" fontFamily="monospace">
        OUTPUT O:2
      </text>
      <text x="204" y="56" fill="oklch(0.72 0.008 250)" fontSize="10" fontFamily="monospace">
        O:2/0 Motor
      </text>
      <path d="M140 60 H170" stroke="oklch(0.45 0.10 155)" strokeWidth="2" markerEnd="url(#arrow)" />
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="oklch(0.45 0.10 155)" />
        </marker>
      </defs>
    </svg>
  );
}

function NcChainDiagram() {
  return (
    <svg viewBox="0 0 320 80" className="w-full h-auto" aria-hidden>
      <line x1="24" y1="40" x2="296" y2="40" stroke="oklch(0.35 0.004 250)" strokeWidth="2" />
      <rect x="40" y="24" width="56" height="32" rx="4" fill="oklch(0.14 0.003 250)" stroke="oklch(0.40 0.08 25)" />
      <text x="52" y="44" fill="oklch(0.72 0.008 250)" fontSize="9" fontFamily="monospace">
        E-stop NC
      </text>
      <rect x="132" y="24" width="56" height="32" rx="4" fill="oklch(0.14 0.003 250)" stroke="oklch(0.40 0.08 25)" />
      <text x="144" y="44" fill="oklch(0.72 0.008 250)" fontSize="9" fontFamily="monospace">
        OL NC
      </text>
      <rect x="224" y="24" width="72" height="32" rx="4" fill="oklch(0.14 0.003 250)" stroke="oklch(0.45 0.10 155)" />
      <text x="236" y="44" fill="oklch(0.72 0.008 250)" fontSize="9" fontFamily="monospace">
        PLC input
      </text>
    </svg>
  );
}

function PhotoeyeLoopDiagram() {
  return (
    <svg viewBox="0 0 320 100" className="w-full h-auto" aria-hidden>
      <rect x="20" y="40" width="80" height="24" rx="2" fill="oklch(0.18 0.04 250)" />
      <text x="32" y="56" fill="oklch(0.75 0.10 250)" fontSize="9">
        Product
      </text>
      <circle cx="160" cy="52" r="10" fill="oklch(0.55 0.12 155)" />
      <text x="200" y="48" fill="oklch(0.55 0.008 250)" fontSize="9" fontFamily="monospace">
        Beam blocked
      </text>
      <text x="200" y="64" fill="oklch(0.72 0.008 250)" fontSize="9" fontFamily="monospace">
        I:0/1 = ON
      </text>
    </svg>
  );
}

function RefrigerationCycleDiagram() {
  const highSide = "var(--color-diagram-high-side)";
  const highDim = "var(--color-diagram-high-side-dim)";
  const lowSide = "var(--color-diagram-low-side)";
  const lowDim = "var(--color-diagram-low-side-dim)";
  const textMain = "var(--color-diagram-neutral)";
  const textBody = "oklch(0.72 0.008 250)";

  const boxes = [
    {
      y: 8,
      label: "Compressor",
      subtitle: "raises pressure + temperature",
      stroke: highSide,
      fill: highDim,
      side: "high",
    },
    {
      y: 62,
      label: "Condenser",
      subtitle: "rejects heat to ambient",
      stroke: highSide,
      fill: highDim,
      side: "high",
    },
    {
      y: 116,
      label: "Expansion Valve",
      subtitle: "drops pressure + temperature",
      stroke: lowSide,
      fill: lowDim,
      side: "low" as const,
      dashed: true as const,
    },
    {
      y: 170,
      label: "Evaporator",
      subtitle: "absorbs heat from load",
      stroke: lowSide,
      fill: lowDim,
      side: "low",
    },
  ] as const;

  return (
    <svg viewBox="0 0 320 232" className="w-full h-auto" aria-hidden role="img">
      <title>Refrigeration cycle flow</title>
      <defs>
        <marker id="ref-flow-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--color-eas-green)" />
        </marker>
        <marker id="ref-return-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--color-diagram-low-side)" />
        </marker>
      </defs>
      <text x="8" y="228" fill={textMain} fontSize="13" fontFamily="system-ui, sans-serif">
        High side (warm)
      </text>
      <rect x="108" y="216" width="10" height="12" fill={highSide} rx="1" />
      <text x="168" y="228" fill={textMain} fontSize="13" fontFamily="system-ui, sans-serif">
        Low side (cool)
      </text>
      <rect x="268" y="216" width="10" height="12" fill={lowSide} rx="1" />

      {boxes.map((box, i) => (
        <g key={box.label}>
          <rect
            x="16"
            y={box.y}
            width="288"
            height="46"
            rx="6"
            fill={box.fill}
            stroke={box.stroke}
            strokeWidth="2"
            strokeDasharray={"dashed" in box && box.dashed ? "6 4" : undefined}
          />
          <text x="28" y={box.y + 20} fill={textBody} fontSize="13" fontWeight="600" fontFamily="system-ui, sans-serif">
            {box.label}
          </text>
          <text x="28" y={box.y + 38} fill={textMain} fontSize="13" fontFamily="system-ui, sans-serif">
            {box.subtitle}
          </text>
          {i < boxes.length - 1 && (
            <path
              d={`M160 ${box.y + 46} V${boxes[i + 1].y - 4}`}
              stroke="var(--color-eas-green)"
              strokeWidth="2"
              markerEnd="url(#ref-flow-arrow)"
            />
          )}
        </g>
      ))}
      <path
        d="M304 192 Q312 228 160 228 Q8 228 16 192"
        fill="none"
        stroke="var(--color-diagram-low-side)"
        strokeWidth="2"
        strokeDasharray="5 4"
        markerEnd="url(#ref-return-arrow)"
      />
      <text x="160" y="224" fill={textMain} fontSize="13" textAnchor="middle" fontFamily="system-ui, sans-serif">
        low-pressure gas return
      </text>
    </svg>
  );
}

function RefrigerationPtTableDiagram() {
  const rows = [
    { pressure: "118 psig", temp: "40°F", state: "Saturated (evap typical)", side: "low" as const },
    { pressure: "195 psig", temp: "70°F", state: "Saturated", side: "low" as const },
    { pressure: "280 psig", temp: "100°F", state: "Saturated (cond typical)", side: "high" as const },
    { pressure: "400 psig", temp: "130°F", state: "High side limit", side: "high" as const },
  ];

  const colX = [8, 108, 198];
  const rowH = 36;
  const headerY = 28;

  return (
    <svg viewBox="0 0 320 200" className="w-full h-auto" aria-hidden role="img">
      <title>R-410A pressure-temperature reference</title>
      <rect x="0" y="0" width="320" height="200" fill="oklch(0.08 0.003 250)" rx="6" />
      <text x="160" y="18" fill="oklch(0.72 0.008 250)" fontSize="13" fontWeight="600" textAnchor="middle" fontFamily="system-ui, sans-serif">
        R-410A P-T Reference
      </text>
      {["Pressure (psig)", "Sat. Temp °F", "State"].map((label, i) => (
        <text
          key={label}
          x={colX[i] + (i === 2 ? 40 : 44)}
          y={headerY}
          fill="var(--color-diagram-neutral)"
          fontSize="13"
          fontWeight="600"
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
        >
          {label}
        </text>
      ))}
      <line x1="8" y1="34" x2="312" y2="34" stroke="oklch(0.22 0.004 250)" strokeWidth="1" />
      {rows.map((row, i) => {
        const y = 42 + i * rowH;
        const bg =
          row.side === "low" ? "var(--color-diagram-low-side-dim)" : "var(--color-diagram-high-side-dim)";
        const border =
          row.side === "low" ? "var(--color-diagram-low-side)" : "var(--color-diagram-high-side)";
        return (
          <g key={row.pressure}>
            <rect x="8" y={y} width="304" height={rowH - 4} rx="4" fill={bg} stroke={border} strokeWidth="1" />
            <text x={colX[0] + 44} y={y + 22} fill="oklch(0.78 0.008 250)" fontSize="13" textAnchor="middle" fontFamily="monospace">
              {row.pressure}
            </text>
            <text x={colX[1] + 44} y={y + 22} fill="oklch(0.78 0.008 250)" fontSize="13" textAnchor="middle" fontFamily="monospace">
              {row.temp}
            </text>
            <text x={colX[2] + 52} y={y + 22} fill="oklch(0.72 0.008 250)" fontSize="13" textAnchor="middle" fontFamily="system-ui, sans-serif">
              {row.state}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function VfdStagesDiagram() {
  return (
    <svg viewBox="0 0 320 80" className="w-full h-auto" aria-hidden>
      <defs>
        <marker id="vfd-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="oklch(0.45 0.10 155)" />
        </marker>
      </defs>
      <rect x="12" y="20" width="80" height="40" rx="4" fill="oklch(0.12 0.003 250)" stroke="oklch(0.35 0.004 250)" />
      <text x="52" y="44" fill="oklch(0.72 0.008 250)" fontSize="9" textAnchor="middle" fontFamily="monospace">
        Rectifier
      </text>
      <rect x="120" y="20" width="80" height="40" rx="4" fill="oklch(0.12 0.003 250)" stroke="oklch(0.55 0.12 155)" />
      <text x="160" y="44" fill="oklch(0.72 0.008 250)" fontSize="9" textAnchor="middle" fontFamily="monospace">
        DC Bus
      </text>
      <rect x="228" y="20" width="80" height="40" rx="4" fill="oklch(0.12 0.003 250)" stroke="oklch(0.35 0.004 250)" />
      <text x="268" y="44" fill="oklch(0.72 0.008 250)" fontSize="9" textAnchor="middle" fontFamily="monospace">
        Inverter
      </text>
      <path d="M92 40 H120 M200 40 H228" stroke="oklch(0.45 0.10 155)" strokeWidth="2" markerEnd="url(#vfd-arrow)" />
      <text x="52" y="72" fill="oklch(0.50 0.008 250)" fontSize="8" textAnchor="middle">
        AC in
      </text>
      <text x="268" y="72" fill="oklch(0.50 0.008 250)" fontSize="8" textAnchor="middle">
        PWM AC out
      </text>
    </svg>
  );
}

function ScanCycleDiagram() {
  return (
    <svg viewBox="0 0 320 120" className="w-full h-auto" aria-hidden>
      <defs>
        <marker id="scan-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="oklch(0.45 0.10 155)" />
        </marker>
      </defs>
      {[
        { y: 16, label: "1. Input scan → image table" },
        { y: 44, label: "2. Program execution (logic solve)" },
        { y: 72, label: "3. Output scan → field devices" },
        { y: 100, label: "4. Housekeeping & comms" },
      ].map((step, i) => (
        <g key={step.label}>
          <rect x="24" y={step.y} width="272" height="22" rx="3" fill="oklch(0.12 0.003 250)" stroke="oklch(0.30 0.004 250)" />
          <text x="36" y={step.y + 15} fill="oklch(0.72 0.008 250)" fontSize="9" fontFamily="monospace">
            {step.label}
          </text>
          {i < 3 && (
            <path d={`M160 ${step.y + 22} V${step.y + 28}`} stroke="oklch(0.45 0.10 155)" strokeWidth="1.5" markerEnd="url(#scan-arrow)" />
          )}
        </g>
      ))}
      <path d="M296 100 Q312 60 296 16" fill="none" stroke="oklch(0.45 0.10 155)" strokeWidth="1.5" strokeDasharray="3 3" />
      <text x="304" y="60" fill="oklch(0.50 0.008 250)" fontSize="7" transform="rotate(90 304 60)">
        repeat
      </text>
    </svg>
  );
}

function MotorStarterChainDiagram() {
  return (
    <svg viewBox="0 0 320 64" className="w-full h-auto" aria-hidden>
      <line x1="16" y1="32" x2="304" y2="32" stroke="oklch(0.35 0.004 250)" strokeWidth="2" />
      {[
        { x: 24, w: 40, label: "Fuse" },
        { x: 72, w: 44, label: "E-stop NC" },
        { x: 124, w: 36, label: "OL NC" },
        { x: 168, w: 40, label: "Stop NC" },
        { x: 216, w: 44, label: "Start NO" },
        { x: 268, w: 40, label: "Coil" },
      ].map((box) => (
        <g key={box.label}>
          <rect x={box.x} y="16" width={box.w} height="32" rx="3" fill="oklch(0.14 0.003 250)" stroke="oklch(0.40 0.08 25)" />
          <text x={box.x + box.w / 2} y="36" fill="oklch(0.72 0.008 250)" fontSize="7" textAnchor="middle" fontFamily="monospace">
            {box.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function LadderSealInDiagram() {
  return (
    <svg viewBox="0 0 360 140" className="w-full h-auto" aria-hidden>
      <text x="16" y="24" fill="var(--color-diagram-neutral)" fontSize="13" fontFamily="monospace">
        ControlLogix rung — MTR_RUN seal-in
      </text>
      <line x1="16" y1="48" x2="344" y2="48" stroke="var(--color-diagram-neutral)" strokeWidth="2" />
      {[
        { x: 24, sym: "]/", label: "ESTOP_OK\nXIC" },
        { x: 88, sym: "]/", label: "START_PB\nXIC" },
        { x: 152, sym: "]/", label: "MTR_RUN\nXIC aux" },
      ].map((c) => (
        <g key={c.label}>
          <line x1={c.x} y1="48" x2={c.x} y2="72" stroke="var(--color-diagram-safety)" strokeWidth="2" />
          <text x={c.x + 4} y="68" fill="var(--color-diagram-safety)" fontSize="13" fontFamily="monospace">
            {c.sym}
          </text>
          <text x={c.x} y="96" fill="var(--color-diagram-neutral)" fontSize="11" fontFamily="monospace">
            {c.label.split("\n").map((line, i) => (
              <tspan key={line} x={c.x} dy={i === 0 ? 0 : 14}>
                {line}
              </tspan>
            ))}
          </text>
        </g>
      ))}
      <line x1="152" y1="72" x2="152" y2="108" stroke="var(--color-diagram-low-side)" strokeWidth="2" strokeDasharray="4 3" />
      <line x1="152" y1="108" x2="88" y2="108" stroke="var(--color-diagram-low-side)" strokeWidth="2" strokeDasharray="4 3" />
      <line x1="88" y1="108" x2="88" y2="72" stroke="var(--color-diagram-low-side)" strokeWidth="2" strokeDasharray="4 3" />
      <text x="170" y="118" fill="var(--color-diagram-low-side)" fontSize="11" fontFamily="monospace">
        parallel seal-in branch
      </text>
      <circle cx="280" cy="48" r="14" fill="var(--color-diagram-high-side-dim)" stroke="var(--color-diagram-high-side)" strokeWidth="2" />
      <text x="280" y="53" fill="var(--color-diagram-high-side)" fontSize="13" textAnchor="middle" fontFamily="monospace">
        ( )
      </text>
      <text x="256" y="96" fill="var(--color-diagram-neutral)" fontSize="11" fontFamily="monospace">
        MTR_RUN
      </text>
      <text x="256" y="112" fill="var(--color-diagram-neutral)" fontSize="11" fontFamily="monospace">
        OTE coil
      </text>
    </svg>
  );
}

function TimerTonBlockDiagram() {
  return (
    <svg viewBox="0 0 360 120" className="w-full h-auto" aria-hidden>
      <text x="16" y="22" fill="var(--color-diagram-neutral)" fontSize="13" fontFamily="monospace">
        TON FillDelay — CompactLogix timer block
      </text>
      <rect x="16" y="32" width="328" height="72" rx="4" fill="var(--color-diagram-low-side-dim)" stroke="var(--color-diagram-low-side)" />
      <text x="28" y="54" fill="var(--color-diagram-neutral)" fontSize="13" fontFamily="monospace">
        EN ← SAFE_RUN permissive
      </text>
      <text x="28" y="74" fill="var(--color-diagram-neutral)" fontSize="13" fontFamily="monospace">
        PRE = 2500 ms (2.5 s fill)
      </text>
      <text x="28" y="94" fill="var(--color-diagram-neutral)" fontSize="13" fontFamily="monospace">
        ACC → climbs while EN true · .DN when ACC ≥ PRE
      </text>
      <text x="220" y="74" fill="var(--color-diagram-high-side)" fontSize="13" fontFamily="monospace">
        .DN → SOL_OPEN
      </text>
    </svg>
  );
}

function EthernetIpTopologyDiagram() {
  return (
    <svg viewBox="0 0 360 130" className="w-full h-auto" aria-hidden>
      {[
        { x: 8, w: 88, label: "ControlLogix\n5069-L310ER", sub: "192.168.1.10" },
        { x: 136, w: 72, label: "Stratix\n5700", sub: "managed switch" },
        { x: 228, w: 56, label: "1734-AENT", sub: ".20" },
        { x: 296, w: 56, label: "PF525", sub: ".30" },
      ].map((box, i, arr) => (
        <g key={box.label}>
          <rect x={box.x} y="36" width={box.w} height="52" rx="4" fill="var(--color-diagram-low-side-dim)" stroke="var(--color-diagram-low-side)" />
          <text x={box.x + box.w / 2} y="56" fill="var(--color-diagram-neutral)" fontSize="11" textAnchor="middle" fontFamily="monospace">
            {box.label.split("\n").map((line, j) => (
              <tspan key={line} x={box.x + box.w / 2} dy={j === 0 ? 0 : 13}>
                {line}
              </tspan>
            ))}
          </text>
          <text x={box.x + box.w / 2} y="78" fill="var(--color-diagram-neutral)" fontSize="11" textAnchor="middle" fontFamily="monospace">
            {box.sub}
          </text>
          {i < arr.length - 1 && (
            <line
              x1={box.x + box.w}
              y1="62"
              x2={arr[i + 1].x}
              y2="62"
              stroke="var(--color-eas-green)"
              strokeWidth="2"
              markerEnd="url(#eip-arrow)"
            />
          )}
        </g>
      ))}
      <defs>
        <marker id="eip-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--color-eas-green)" />
        </marker>
      </defs>
      <text x="16" y="22" fill="var(--color-diagram-neutral)" fontSize="13" fontFamily="monospace">
        EtherNet/IP — check link LED on each hop
      </text>
      <text x="16" y="112" fill="var(--color-diagram-safety)" fontSize="11" fontFamily="monospace">
        Duplicate .30 IP = comm flapping — verify unique addresses in I/O tree
      </text>
    </svg>
  );
}

function NpnPnpWiringDiagram() {
  const labelFill = "var(--color-diagram-neutral)";
  const accent = "var(--color-eas-green)";
  const warn = "var(--color-diagram-safety)";
  const boxFill = "oklch(0.12 0.003 250)";
  const boxStroke = "oklch(0.28 0.004 250)";

  return (
    <svg viewBox="0 0 360 200" className="w-full h-auto" aria-hidden role="img">
      <title>NPN and PNP sensor wiring to PLC discrete inputs</title>
      <text x="90" y="18" fill={labelFill} fontSize="13" fontWeight="600" textAnchor="middle" fontFamily="system-ui, sans-serif">
        PNP → sinking input
      </text>
      <text x="270" y="18" fill={labelFill} fontSize="13" fontWeight="600" textAnchor="middle" fontFamily="system-ui, sans-serif">
        NPN → sourcing input
      </text>
      {/* PNP side */}
      <rect x="8" y="28" width="72" height="56" rx="4" fill={boxFill} stroke={accent} strokeWidth="1.5" />
      <text x="44" y="48" fill={labelFill} fontSize="13" textAnchor="middle" fontFamily="monospace">Sensor</text>
      <text x="44" y="66" fill={labelFill} fontSize="11" textAnchor="middle" fontFamily="monospace">PNP output</text>
      <rect x="108" y="28" width="72" height="56" rx="4" fill={boxFill} stroke={boxStroke} />
      <text x="144" y="52" fill={labelFill} fontSize="13" textAnchor="middle" fontFamily="monospace">PLC IN</text>
      <text x="144" y="68" fill={labelFill} fontSize="11" textAnchor="middle" fontFamily="monospace">COM → 0V</text>
      <line x1="80" y1="56" x2="108" y2="56" stroke={accent} strokeWidth="2" />
      <text x="44" y="92" fill={labelFill} fontSize="11" textAnchor="middle" fontFamily="monospace">OUT sources +24V</text>
      <text x="144" y="92" fill={labelFill} fontSize="11" textAnchor="middle" fontFamily="monospace">Sinking card</text>
      {/* NPN side */}
      <rect x="188" y="28" width="72" height="56" rx="4" fill={boxFill} stroke={warn} strokeWidth="1.5" />
      <text x="224" y="48" fill={labelFill} fontSize="13" textAnchor="middle" fontFamily="monospace">Sensor</text>
      <text x="224" y="66" fill={labelFill} fontSize="11" textAnchor="middle" fontFamily="monospace">NPN output</text>
      <rect x="288" y="28" width="72" height="56" rx="4" fill={boxFill} stroke={boxStroke} />
      <text x="324" y="52" fill={labelFill} fontSize="13" textAnchor="middle" fontFamily="monospace">PLC IN</text>
      <text x="324" y="68" fill={labelFill} fontSize="11" textAnchor="middle" fontFamily="monospace">COM → +24V</text>
      <line x1="260" y1="56" x2="288" y2="56" stroke={warn} strokeWidth="2" />
      <text x="224" y="92" fill={labelFill} fontSize="11" textAnchor="middle" fontFamily="monospace">OUT sinks to 0V</text>
      <text x="324" y="92" fill={labelFill} fontSize="11" textAnchor="middle" fontFamily="monospace">Sourcing card</text>
      {/* Wire legend */}
      <rect x="8" y="108" width="344" height="88" rx="4" fill="oklch(0.08 0.003 250)" stroke="oklch(0.22 0.004 250)" />
      <text x="20" y="130" fill={labelFill} fontSize="13" fontFamily="monospace">Brown +24V · Blue 0V · Black = signal</text>
      <text x="20" y="152" fill={labelFill} fontSize="13" fontFamily="system-ui, sans-serif">
        Meter between black and COM — not black to ground guess
      </text>
      <text x="20" y="172" fill={warn} fontSize="13" fontFamily="system-ui, sans-serif">
        Mismatch = dead or inverted input LED
      </text>
    </svg>
  );
}

function PowerFlexFaultTableDiagram() {
  const rows = [
    { code: "F004", name: "DC bus undervoltage", check: "Meter 3-phase input under load", tone: "supply" as const },
    { code: "F006", name: "Phase loss", check: "All legs at drive line terminals", tone: "supply" as const },
    { code: "F012", name: "Overcurrent", check: "Output amps vs FLA, mechanical drag", tone: "load" as const },
    { code: "F080", name: "Heatsink overtemperature", check: "Fan RPM, heatsink temp trend", tone: "thermal" as const },
  ];
  const colX = [8, 72, 198];
  const rowH = 36;
  const headerY = 28;

  return (
    <svg viewBox="0 0 360 210" className="w-full h-auto" aria-hidden role="img">
      <title>PowerFlex common fault codes field reference</title>
      <rect x="0" y="0" width="360" height="210" fill="oklch(0.08 0.003 250)" rx="6" />
      <text x="180" y="18" fill="oklch(0.72 0.008 250)" fontSize="13" fontWeight="600" textAnchor="middle" fontFamily="system-ui, sans-serif">
        PowerFlex Fault Quick Reference
      </text>
      {["Code", "Fault", "First field check"].map((label, i) => (
        <text
          key={label}
          x={colX[i] + (i === 0 ? 28 : i === 1 ? 52 : 78)}
          y={headerY}
          fill="var(--color-diagram-neutral)"
          fontSize="13"
          fontWeight="600"
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
        >
          {label}
        </text>
      ))}
      <line x1="8" y1="34" x2="352" y2="34" stroke="oklch(0.22 0.004 250)" strokeWidth="1" />
      {rows.map((row, i) => {
        const y = 42 + i * rowH;
        const bg =
          row.tone === "supply"
            ? "var(--color-diagram-low-side-dim)"
            : row.tone === "thermal"
              ? "var(--color-diagram-high-side-dim)"
              : "oklch(0.12 0.003 250)";
        const border =
          row.tone === "supply"
            ? "var(--color-diagram-low-side)"
            : row.tone === "thermal"
              ? "var(--color-diagram-high-side)"
              : "var(--color-diagram-safety)";
        return (
          <g key={`${row.code}-${i}`}>
            <rect x="8" y={y} width="344" height={rowH - 4} rx="4" fill={bg} stroke={border} strokeWidth="1" />
            <text x={colX[0] + 28} y={y + 22} fill="oklch(0.78 0.008 250)" fontSize="13" textAnchor="middle" fontFamily="monospace">
              {row.code}
            </text>
            <text x={colX[1] + 52} y={y + 22} fill="oklch(0.78 0.008 250)" fontSize="13" textAnchor="middle" fontFamily="system-ui, sans-serif">
              {row.name}
            </text>
            <text x={colX[2] + 78} y={y + 22} fill="oklch(0.72 0.008 250)" fontSize="13" textAnchor="middle" fontFamily="system-ui, sans-serif">
              {row.check}
            </text>
          </g>
        );
      })}
      <text x="180" y="198" fill="oklch(0.50 0.008 250)" fontSize="11" textAnchor="middle" fontFamily="system-ui, sans-serif">
        Record fault queue before reset — same code may map to different root causes
      </text>
    </svg>
  );
}

function LotoStepsDiagram() {
  return (
    <svg viewBox="0 0 320 100" className="w-full h-auto" aria-hidden>
      {["Notify", "Shut down", "Isolate", "Lock & tag", "Verify", "Release energy"].map((step, i) => (
        <g key={step}>
          <rect x={8 + (i % 3) * 104} y={8 + Math.floor(i / 3) * 44} width="96" height="32" rx="3" fill="oklch(0.12 0.003 250)" stroke="oklch(0.35 0.004 250)" />
          <text x={56 + (i % 3) * 104} y={28 + Math.floor(i / 3) * 44} fill="oklch(0.72 0.008 250)" fontSize="8" textAnchor="middle" fontFamily="monospace">
            {i + 1}. {step}
          </text>
        </g>
      ))}
    </svg>
  );
}

function WireNumberingConventionDiagram() {
  return (
    <svg viewBox="0 0 360 180" className="w-full h-auto" aria-hidden role="img">
      <title>Wire numbering and terminal strip convention</title>
      <rect x="0" y="0" width="360" height="180" fill="oklch(0.08 0.003 250)" rx="6" />
      <text x="180" y="18" fill="var(--color-diagram-neutral)" fontSize="13" fontWeight="600" textAnchor="middle" fontFamily="system-ui, sans-serif">
        Wire Number Trace — TB4 Example
      </text>
      <rect x="16" y="32" width="120" height="56" rx="4" fill="oklch(0.12 0.003 250)" stroke="var(--color-eas-green)" />
      <text x="76" y="52" fill="var(--color-diagram-neutral)" fontSize="13" textAnchor="middle" fontFamily="monospace">Schematic</text>
      <text x="76" y="72" fill="var(--color-diagram-neutral)" fontSize="13" textAnchor="middle" fontFamily="monospace">Wire 115</text>
      <rect x="220" y="32" width="120" height="56" rx="4" fill="oklch(0.12 0.003 250)" stroke="var(--color-diagram-neutral)" />
      <text x="280" y="52" fill="var(--color-diagram-neutral)" fontSize="13" textAnchor="middle" fontFamily="monospace">Panel TB4</text>
      <text x="280" y="72" fill="var(--color-diagram-neutral)" fontSize="13" textAnchor="middle" fontFamily="monospace">TB4-7 = 115</text>
      <path d="M136 60 H220" stroke="var(--color-eas-green)" strokeWidth="2" markerEnd="url(#wire-arrow)" />
      <defs>
        <marker id="wire-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="var(--color-eas-green)" />
        </marker>
      </defs>
      <text x="180" y="108" fill="var(--color-diagram-neutral)" fontSize="13" textAnchor="middle" fontFamily="system-ui, sans-serif">
        TB4-7 means terminal block 4, point 7 — same wire number on every sheet
      </text>
      <text x="180" y="132" fill="var(--color-diagram-safety)" fontSize="13" textAnchor="middle" fontFamily="system-ui, sans-serif">
        Meter at TB4-7 before trusting panel layout memory
      </text>
    </svg>
  );
}

function PidSymbolTableDiagram() {
  const rows = [
    { symbol: "FT", tag: "FT-101", meaning: "Flow transmitter" },
    { symbol: "LT", tag: "LT-204", meaning: "Level transmitter" },
    { symbol: "FCV", tag: "FCV-101", meaning: "Flow control valve" },
    { symbol: "PSV", tag: "PSV-12", meaning: "Pressure safety valve" },
  ];
  return (
    <svg viewBox="0 0 360 200" className="w-full h-auto" aria-hidden role="img">
      <title>P&amp;ID symbol quick reference</title>
      <rect x="0" y="0" width="360" height="200" fill="oklch(0.08 0.003 250)" rx="6" />
      <text x="180" y="18" fill="var(--color-diagram-neutral)" fontSize="13" fontWeight="600" textAnchor="middle" fontFamily="system-ui, sans-serif">
        P&amp;ID Tag Reference
      </text>
      {["Symbol", "Example tag", "Function"].map((label, i) => (
        <text key={label} x={[52, 148, 278][i]} y={34} fill="var(--color-diagram-neutral)" fontSize="13" fontWeight="600" textAnchor="middle" fontFamily="system-ui, sans-serif">
          {label}
        </text>
      ))}
      <line x1="8" y1="38" x2="352" y2="38" stroke="oklch(0.22 0.004 250)" />
      {rows.map((row, i) => {
        const y = 46 + i * 36;
        return (
          <g key={row.tag}>
            <rect x="8" y={y} width="344" height="32" rx="4" fill="var(--color-diagram-low-side-dim)" stroke="var(--color-diagram-low-side)" />
            <text x="52" y={y + 21} fill="oklch(0.78 0.008 250)" fontSize="13" textAnchor="middle" fontFamily="monospace">{row.symbol}</text>
            <text x="148" y={y + 21} fill="oklch(0.78 0.008 250)" fontSize="13" textAnchor="middle" fontFamily="monospace">{row.tag}</text>
            <text x="278" y={y + 21} fill="oklch(0.72 0.008 250)" fontSize="13" textAnchor="middle" fontFamily="system-ui, sans-serif">{row.meaning}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function LessonCardVisualBlock({
  visual,
  showZoom = false,
}: {
  visual?: LessonCardVisual;
  showZoom?: boolean;
}) {
  const [zoom, setZoom] = useState(1);
  if (!visual || visual.type === "none") return null;

  if (visual.type === "callout") {
    const toneClass =
      visual.tone === "warning"
        ? "border-l-4 border-[oklch(0.55_0.12_25)] bg-[oklch(0.55_0.12_25/8%)]"
        : visual.tone === "tip"
          ? "border-l-4 border-[oklch(0.55_0.12_155)] bg-[oklch(0.55_0.12_155/6%)]"
          : "border-l-4 border-[oklch(0.45_0.10_250)] bg-[oklch(0.11_0.003_250)]";
    return (
      <div className={`rounded-lg border border-[oklch(0.20_0.004_250)] px-4 py-3 text-base text-[oklch(0.65_0.008_250)] ${toneClass}`}>
        {visual.text}
      </div>
    );
  }

  if (visual.type === "interactive") {
    return (
      <figure className="lesson-diagram-block">
        <div className="flex items-center gap-1.5 mb-2 text-xs font-mono uppercase tracking-wider text-[oklch(0.55_0.12_155)]">
          <Hand className="w-3.5 h-3.5" /> Work the circuit
        </div>
        {visual.sim === "motor-starter-seal-in" && <MotorStarterInteractive />}
        <figcaption className="mt-2 text-xs text-[oklch(0.50_0.008_250)] text-center">
          Press and hold START, then release — the seal-in holds the coil. Trip the overload to see the fail-safe.
        </figcaption>
      </figure>
    );
  }

  if (visual.type === "diagram") {
    return (
      <figure className="lesson-diagram-block">
        <div className="flex items-center justify-end gap-1 mb-2">
          {showZoom && (
            <>
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
                className="min-h-11 min-w-11 inline-flex items-center justify-center rounded border border-[oklch(0.22_0.004_250)] text-[oklch(0.65_0.008_250)]"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
                className="min-h-11 min-w-11 inline-flex items-center justify-center rounded border border-[oklch(0.22_0.004_250)] text-[oklch(0.65_0.008_250)]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        <div className="rounded-lg border border-[oklch(0.18_0.004_250)] bg-[oklch(0.08_0.003_250)] p-3 overflow-auto">
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
            {visual.variant === "io-terminal" && <IoTerminalDiagram />}
            {visual.variant === "nc-chain" && <NcChainDiagram />}
            {visual.variant === "photoeye-loop" && <PhotoeyeLoopDiagram />}
            {visual.variant === "refrigeration-cycle" && <RefrigerationCycleDiagram />}
            {visual.variant === "refrigeration-pt-table" && <RefrigerationPtTableDiagram />}
            {visual.variant === "vfd-stages" && <VfdStagesDiagram />}
            {visual.variant === "scan-cycle" && <ScanCycleDiagram />}
            {visual.variant === "motor-starter-chain" && <MotorStarterChainDiagram />}
            {visual.variant === "loto-steps" && <LotoStepsDiagram />}
            {visual.variant === "ladder-seal-in" && <LadderSealInDiagram />}
            {visual.variant === "timer-ton-block" && <TimerTonBlockDiagram />}
            {visual.variant === "ethernet-ip-topology" && <EthernetIpTopologyDiagram />}
            {visual.variant === "npn-pnp-wiring" && <NpnPnpWiringDiagram />}
            {visual.variant === "powerflex-fault-table" && <PowerFlexFaultTableDiagram />}
            {visual.variant === "wire-numbering-convention" && <WireNumberingConventionDiagram />}
            {visual.variant === "pid-symbol-table" && <PidSymbolTableDiagram />}
          </div>
        </div>
        <figcaption className="mt-2 text-xs text-[oklch(0.50_0.008_250)] text-center">
          {visual.variant === "refrigeration-pt-table"
            ? "Use this table with your manifold gauges"
            : visual.variant === "ladder-seal-in"
              ? "In Studio 5000: verify parallel aux contact matches field contactor wiring"
              : visual.variant === "timer-ton-block"
                ? "Compare ACC to PRE in timer monitor before blaming the fill valve"
                : visual.variant === "ethernet-ip-topology"
                  ? "Ping each node and confirm link LEDs before editing ladder logic"
                  : visual.variant === "npn-pnp-wiring"
                    ? "Confirm sensor output type matches PLC input card commoning before swapping hardware"
                    : visual.variant === "powerflex-fault-table"
                      ? "Record active and queued codes on the drive keypad before reset"
                      : visual.variant === "wire-numbering-convention"
                        ? "Trace by wire number across schematic, terminal strip, and field device"
                        : visual.variant === "pid-symbol-table"
                          ? "Match tag first letters to loop sheets before calibration or bypass"
                          : "Tap +/- to zoom schematic"}
        </figcaption>
      </figure>
    );
  }

  return null;
}
