/**
 * InteractiveCircuitDiagram — SVG-based electrical prints
 * 
 * Renders ladder logic / safety circuits as proper diagrams with:
 * - Tappable components showing state and function
 * - Color-coded states (energized, de-energized, faulted)
 * - Connection wires between components (normal, broken, highlighted)
 * - Mobile-responsive layout with horizontal scroll
 * - Role-aware explanations
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info } from "lucide-react";
import type { CircuitDiagram, CircuitComponent, CircuitRung, TechRole } from "@/data/scenariosV2";
import {
  DiagramNOContact,
  DiagramNCContact,
  DiagramCoil,
  DiagramFuse,
  DiagramMotor,
  DiagramOverloadHeater,
  DiagramEStop,
  DiagramTerminal,
  DiagramPLCInput,
  DiagramPLCOutput,
  DiagramContactorPole,
} from "@/lib/electricalDiagramPrimitives";

interface InteractiveCircuitDiagramProps {
  diagram: CircuitDiagram;
  role: TechRole;
  phaseUpdates?: Record<string, Partial<CircuitComponent>>;
}

// Component visual dimensions
const CELL_W = 130;
const CELL_H = 70;
const COMPONENT_W = 90;
const COMPONENT_H = 40;
const RAIL_X_LEFT = 40;
const RAIL_X_RIGHT_OFFSET = 40;
const RUNG_START_Y = 60;
const WIRE_Y_OFFSET = CELL_H / 2;

function getStateColor(state: CircuitComponent["state"]): string {
  switch (state) {
    case "energized": return "#22c55e";
    case "closed": return "#22c55e";
    case "de-energized": return "#6b7280";
    case "open": return "#eab308";
    case "faulted": return "#ef4444";
    case "tripped": return "#ef4444";
    default: return "#6b7280";
  }
}

function getStateBg(state: CircuitComponent["state"]): string {
  switch (state) {
    case "energized": return "#052e16";
    case "closed": return "#052e16";
    case "de-energized": return "#1f2937";
    case "open": return "#422006";
    case "faulted": return "#450a0a";
    case "tripped": return "#450a0a";
    default: return "#1f2937";
  }
}

/** Renders proper JIC/NEMA SVG symbol inline at given center point */
function ComponentSymbolSVG({ type, cx, cy, color }: { type: CircuitComponent["type"]; cx: number; cy: number; color: string }) {
  const sc = 0.45; // scale to fit inside 90x40 component box
  switch (type) {
    case "contact_no":
    case "switch":
      return <DiagramNOContact cx={cx} cy={cy} color={color} scale={sc} />;
    case "contact_nc":
      return <DiagramNCContact cx={cx} cy={cy} color={color} scale={sc} />;
    case "coil":
    case "relay":
      return <DiagramCoil cx={cx} cy={cy} color={color} scale={sc} />;
    case "fuse":
      return <DiagramFuse cx={cx} cy={cy} color={color} scale={sc} />;
    case "motor":
      return <DiagramMotor cx={cx} cy={cy} color={color} scale={sc} />;
    case "estop":
      return <DiagramEStop cx={cx} cy={cy} color={color} scale={sc * 0.9} />;
    case "terminal":
      return <DiagramTerminal cx={cx} cy={cy} color={color} scale={sc} />;
    case "power_supply":
      return (
        <g stroke={color} strokeWidth={1} fill="none">
          <line x1={cx - 6} y1={cy} x2={cx + 6} y2={cy} />
          <line x1={cx - 4} y1={cy + 4} x2={cx + 4} y2={cy + 4} />
          <line x1={cx - 2} y1={cy + 8} x2={cx + 2} y2={cy + 8} />
        </g>
      );
    case "plc_input":
      return <DiagramPLCInput cx={cx} cy={cy} color={color} scale={sc} />;
    case "plc_output":
      return <DiagramPLCOutput cx={cx} cy={cy} color={color} scale={sc} />;
    case "overload":
      return <DiagramOverloadHeater cx={cx} cy={cy} color={color} scale={sc} />;
    case "contactor":
      return <DiagramContactorPole cx={cx} cy={cy} color={color} scale={sc} />;
    default:
      return (
        <text x={cx} y={cy + 4} textAnchor="middle" fill={color} fontSize="10" style={{ fontFamily: "var(--diag-font-mono)" }}>?</text>
      );
  }
}

function getWireColor(style?: "normal" | "broken" | "highlighted"): string {
  switch (style) {
    case "broken": return "#ef4444";
    case "highlighted": return "#22c55e";
    default: return "#4b5563";
  }
}

function getWireDash(style?: "normal" | "broken" | "highlighted"): string | undefined {
  if (style === "broken") return "6 3";
  return undefined;
}

export default function InteractiveCircuitDiagram({ diagram, role, phaseUpdates }: InteractiveCircuitDiagramProps) {
  const [selectedComponent, setSelectedComponent] = useState<CircuitComponent | null>(null);

  // Apply phase updates to components
  const getComponent = (comp: CircuitComponent): CircuitComponent => {
    if (phaseUpdates && phaseUpdates[comp.id]) {
      return { ...comp, ...phaseUpdates[comp.id] } as CircuitComponent;
    }
    return comp;
  };

  // Calculate SVG dimensions
  const maxCols = Math.max(...diagram.rungs.flatMap(r => r.components.map(c => c.position.col + (c.position.span || 1))));
  const totalRungs = diagram.rungs.length;
  const svgWidth = Math.max(650, RAIL_X_LEFT + (maxCols + 1) * CELL_W + RAIL_X_RIGHT_OFFSET);
  const svgHeight = RUNG_START_Y + totalRungs * CELL_H + 50;
  const railXRight = svgWidth - RAIL_X_RIGHT_OFFSET;

  // Build a lookup map of component positions for connection rendering
  const componentPositions: Record<string, { cx: number; cy: number; rungIdx: number }> = {};
  diagram.rungs.forEach((rung, rungIdx) => {
    rung.components.forEach(rawComp => {
      const comp = getComponent(rawComp);
      const span = comp.position.span || 1;
      const width = COMPONENT_W * span + (span - 1) * (CELL_W - COMPONENT_W);
      const x = RAIL_X_LEFT + comp.position.col * CELL_W;
      const cx = x + width / 2;
      const cy = RUNG_START_Y + rungIdx * CELL_H + WIRE_Y_OFFSET;
      componentPositions[comp.id] = { cx, cy, rungIdx };
    });
  });

  return (
    <div className="relative">
      {/* Diagram title */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-['Share_Tech_Mono'] text-xs text-gray-400 uppercase">
          {diagram.title}
        </h4>
        <span className="text-[10px] text-gray-600 font-['Share_Tech_Mono']">
          TAP COMPONENTS TO INSPECT
        </span>
      </div>

      {/* SVG Diagram — scrollable on mobile */}
      <div className="overflow-x-auto -mx-2 px-2 pb-2 touch-pan-x">
        <div className="bg-[#080808] rounded-lg border border-gray-800 p-3 min-w-0">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="electrical-diagram w-full"
            style={{ height: `${Math.min(svgHeight, 420)}px` }}
            role="img"
            aria-label={`Electrical diagram: ${diagram.title}`}
          >
            {/* Power rails */}
            <line
              x1={RAIL_X_LEFT} y1={RUNG_START_Y - 20}
              x2={RAIL_X_LEFT} y2={svgHeight - 20}
              stroke="#4ade80" strokeWidth="3"
            />
            <line
              x1={railXRight} y1={RUNG_START_Y - 20}
              x2={railXRight} y2={svgHeight - 20}
              stroke="#4ade80" strokeWidth="3"
            />
            
            {/* Rail labels */}
            <text x={RAIL_X_LEFT} y={RUNG_START_Y - 28} textAnchor="middle" fill="#4ade80" fontSize="11" style={{ fontFamily: "var(--diag-font-mono)" }}>
              {diagram.rails.left}
            </text>
            <text x={railXRight} y={RUNG_START_Y - 28} textAnchor="middle" fill="#4ade80" fontSize="11" style={{ fontFamily: "var(--diag-font-mono)" }}>
              {diagram.rails.right}
            </text>

            {/* Rungs */}
            {diagram.rungs.map((rung, rungIdx) => {
              const rungY = RUNG_START_Y + rungIdx * CELL_H;
              const wireY = rungY + WIRE_Y_OFFSET;
              
              return (
                <g key={rung.id}>
                  {/* Rung label */}
                  {rung.label && (
                    <text x={8} y={wireY + 4} fill="#6b7280" fontSize="10" style={{ fontFamily: "var(--diag-font-mono)" }}>
                      {rung.label}
                    </text>
                  )}
                  
                  {/* Wire from left rail to first component */}
                  <line
                    x1={RAIL_X_LEFT} y1={wireY}
                    x2={RAIL_X_LEFT + CELL_W * rung.components[0]?.position.col} y2={wireY}
                    stroke="#4b5563" strokeWidth="1.5"
                  />

                  {/* Connection wires between components (using connections array) */}
                  {rung.connections.map((conn, connIdx) => {
                    const fromPos = componentPositions[conn.from];
                    const toPos = componentPositions[conn.to];
                    if (!fromPos || !toPos) return null;

                    // Find the actual components to get their widths
                    const fromComp = rung.components.find(c => c.id === conn.from);
                    const toComp = rung.components.find(c => c.id === conn.to);
                    if (!fromComp || !toComp) return null;

                    const fromSpan = fromComp.position.span || 1;
                    const fromWidth = COMPONENT_W * fromSpan + (fromSpan - 1) * (CELL_W - COMPONENT_W);
                    const fromX = RAIL_X_LEFT + fromComp.position.col * CELL_W;
                    const fromRight = fromX + fromWidth;

                    const toX = RAIL_X_LEFT + toComp.position.col * CELL_W;

                    return (
                      <line
                        key={`conn-${connIdx}`}
                        x1={fromRight}
                        y1={wireY}
                        x2={toX}
                        y2={wireY}
                        stroke={getWireColor(conn.style)}
                        strokeWidth={conn.style === "broken" ? 2 : 1.5}
                        strokeDasharray={getWireDash(conn.style)}
                      />
                    );
                  })}

                  {/* Fallback: if no connections defined, draw sequential wires */}
                  {rung.connections.length === 0 && rung.components.length > 1 && (
                    rung.components.slice(0, -1).map((rawComp, idx) => {
                      const comp = getComponent(rawComp);
                      const nextComp = getComponent(rung.components[idx + 1]);
                      const span = comp.position.span || 1;
                      const width = COMPONENT_W * span + (span - 1) * (CELL_W - COMPONENT_W);
                      const fromX = RAIL_X_LEFT + comp.position.col * CELL_W + width;
                      const toX = RAIL_X_LEFT + nextComp.position.col * CELL_W;
                      return (
                        <line
                          key={`fallback-${idx}`}
                          x1={fromX} y1={wireY}
                          x2={toX} y2={wireY}
                          stroke="#4b5563" strokeWidth="1.5"
                        />
                      );
                    })
                  )}

                  {/* Components */}
                  {rung.components.map(rawComp => {
                    const comp = getComponent(rawComp);
                    const x = RAIL_X_LEFT + comp.position.col * CELL_W;
                    const y = rungY + (CELL_H - COMPONENT_H) / 2;
                    const color = getStateColor(comp.state);
                    const bgColor = getStateBg(comp.state);
                    const span = comp.position.span || 1;
                    const width = COMPONENT_W * span + (span - 1) * (CELL_W - COMPONENT_W);

                    return (
                      <g
                        key={comp.id}
                        onClick={() => setSelectedComponent(comp)}
                        className="cursor-pointer"
                        role="button"
                        tabIndex={0}
                        aria-label={`${comp.label} — ${comp.tapInfo.currentState}`}
                      >
                        {/* Tap target (larger invisible rect for mobile) */}
                        <rect
                          x={x - 5} y={y - 5}
                          width={width + 10} height={COMPONENT_H + 10}
                          fill="transparent"
                        />
                        
                        {/* Component body */}
                        <rect
                          x={x} y={y}
                          width={width} height={COMPONENT_H}
                          rx={4}
                          fill={bgColor}
                          stroke={color}
                          strokeWidth={comp.isFaultSource ? 2.5 : 1.5}
                          strokeDasharray={comp.isFaultSource ? "4 2" : undefined}
                        />
                        
                        {/* Component symbol — proper JIC/NEMA SVG primitive */}
                        <ComponentSymbolSVG
                          type={comp.type}
                          cx={x + width / 2}
                          cy={y + COMPONENT_H / 2 - 2}
                          color={color}
                        />
                        
                        {/* Component label */}
                        <text
                          x={x + width / 2} y={y + COMPONENT_H - 6}
                          textAnchor="middle" fill="#d1d5db"
                          fontSize="10" style={{ fontFamily: "var(--diag-font-mono)" }}
                        >
                          {comp.label}
                        </text>

                        {/* Fault indicator pulse */}
                        {comp.isFaultSource && (
                          <circle
                            cx={x + width - 4} cy={y + 4}
                            r={5} fill="#ef4444"
                          >
                            <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
                          </circle>
                        )}
                      </g>
                    );
                  })}

                  {/* Wire from last component to right rail */}
                  {rung.components.length > 0 && (() => {
                    const lastComp = rung.components[rung.components.length - 1];
                    const span = lastComp.position.span || 1;
                    const width = COMPONENT_W * span + (span - 1) * (CELL_W - COMPONENT_W);
                    const lastX = RAIL_X_LEFT + lastComp.position.col * CELL_W + width;
                    return (
                      <line
                        x1={lastX} y1={wireY}
                        x2={railXRight} y2={wireY}
                        stroke="#4b5563" strokeWidth="1.5"
                      />
                    );
                  })()}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 text-[10px] font-['Share_Tech_Mono'] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#22c55e]" /> Energized/Closed
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#6b7280]" /> De-energized
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#eab308]" /> Open
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#ef4444]" /> Faulted/Tripped
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 border-t-2 border-dashed border-red-500" /> Broken Wire
        </span>
      </div>

      {/* Component info panel (on tap) — fixed at bottom for mobile */}
      <AnimatePresence>
        {selectedComponent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed inset-x-4 bottom-4 md:absolute md:inset-x-0 md:bottom-0 bg-[#111] border border-gray-700 rounded-lg p-4 shadow-2xl z-20"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: getStateColor(selectedComponent.state) }}
                />
                <h4 className="font-['Share_Tech_Mono'] text-white text-sm">
                  {selectedComponent.label}
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                  {selectedComponent.type.replace(/_/g, " ")}
                </span>
              </div>
              <button
                onClick={() => setSelectedComponent(null)}
                className="text-gray-500 hover:text-white p-1"
                aria-label="Close component info"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-gray-400 shrink-0">Function:</span>
                <span className="text-gray-200 text-right">{selectedComponent.tapInfo.function}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-400 shrink-0">Current State:</span>
                <span style={{ color: getStateColor(selectedComponent.state) }} className="text-right">
                  {selectedComponent.tapInfo.currentState}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-400 shrink-0">Normal State:</span>
                <span className="text-gray-300 text-right">{selectedComponent.tapInfo.normalState}</span>
              </div>
              
              {/* New Tech explanation */}
              {role === "new" && selectedComponent.tapInfo.explanation && (
                <div className="mt-2 p-2 bg-blue-950/30 border border-blue-800/30 rounded text-blue-200">
                  <Info className="w-3 h-3 inline mr-1" />
                  {selectedComponent.tapInfo.explanation}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
