/**
 * Registry-governed wiring diagram SVG — print-ready, zoomable.
 */
import { useCallback, useMemo, useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { WiringDiagramSpec } from "@shared/wiringDiagramSpec";
import { layoutWiringDiagram, getWireStrokeColor } from "@shared/wiringDiagramLayout";
import type { SymbolPrimitiveId } from "@shared/electricalSymbolRegistry";
import { renderDiagramSymbol } from "@/lib/renderDiagramSymbol";

export interface WiringDiagramSvgProps {
  spec: WiringDiagramSpec;
  className?: string;
  showTerminalLabels?: boolean;
  interactive?: boolean;
}

const ZOOM_STEPS = [0.75, 1, 1.25, 1.5, 2];

export default function WiringDiagramSvg({
  spec,
  className = "",
  showTerminalLabels = true,
  interactive = true,
}: WiringDiagramSvgProps) {
  const layout = useMemo(() => layoutWiringDiagram(spec), [spec]);
  const [zoomIdx, setZoomIdx] = useState(1);

  const zoom = ZOOM_STEPS[zoomIdx];
  const zoomIn = useCallback(() => setZoomIdx((i) => Math.min(i + 1, ZOOM_STEPS.length - 1)), []);
  const zoomOut = useCallback(() => setZoomIdx((i) => Math.max(i - 1, 0)), []);
  const resetZoom = useCallback(() => setZoomIdx(1), []);

  return (
    <div className={`wiring-diagram-wrap ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h5 className="text-xs font-semibold text-white truncate">{spec.title}</h5>
          {spec.subtitle && (
            <p className="text-[10px] font-mono text-[oklch(0.50_0.008_250)] truncate">{spec.subtitle}</p>
          )}
        </div>
        {interactive && (
          <div className="flex items-center gap-1 shrink-0 print:hidden">
            <button
              type="button"
              onClick={zoomOut}
              disabled={zoomIdx === 0}
              className="min-h-11 min-w-11 inline-flex items-center justify-center p-2 rounded border border-[oklch(0.20_0.004_250)] text-[oklch(0.55_0.008_250)] hover:text-white disabled:opacity-40"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={zoomIn}
              disabled={zoomIdx === ZOOM_STEPS.length - 1}
              className="min-h-11 min-w-11 inline-flex items-center justify-center p-2 rounded border border-[oklch(0.20_0.004_250)] text-[oklch(0.55_0.008_250)] hover:text-white disabled:opacity-40"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={resetZoom}
              className="min-h-11 min-w-11 inline-flex items-center justify-center p-2 rounded border border-[oklch(0.20_0.004_250)] text-[oklch(0.55_0.008_250)] hover:text-white"
              aria-label="Reset zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="wiring-diagram-scroll overflow-auto rounded-lg border border-[oklch(0.14_0.004_250)] bg-[oklch(0.05_0.003_250)]">
        <div
          className="wiring-diagram-zoom origin-top-left transition-transform duration-150"
          style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }}
        >
          <svg
            viewBox={layout.viewBox}
            className="wiring-diagram-svg electrical-diagram w-full min-w-[640px]"
            role="img"
            aria-label={spec.title}
          >
            {/* Zone backgrounds */}
            <rect
              x={layout.width * 0.02}
              y={layout.height * 0.04}
              width={layout.width * 0.96}
              height={layout.height * 0.38}
              rx={6}
              fill="oklch(0.08 0.02 155 / 0.25)"
              stroke="oklch(0.55 0.12 155 / 15%)"
              strokeWidth={1}
            />
            <rect
              x={layout.width * 0.02}
              y={layout.height * 0.72}
              width={layout.width * 0.96}
              height={layout.height * 0.22}
              rx={6}
              fill="oklch(0.08 0.02 35 / 0.2)"
              stroke="oklch(0.55 0.15 35 / 15%)"
              strokeWidth={1}
            />

            {/* Wires */}
            {layout.wires.map((wire) => (
              <g key={wire.id}>
                <path
                  d={wire.pathD}
                  fill="none"
                  stroke={getWireStrokeColor(wire.wireType)}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {wire.label && (
                  <text
                    x={wire.labelPoint.x}
                    y={wire.labelPoint.y}
                    textAnchor="middle"
                    className="diag-text-xs"
                    fill="oklch(0.55 0.08 250)"
                    style={{ fontFamily: "var(--diag-font-mono)" }}
                  >
                    {wire.label}
                  </text>
                )}
              </g>
            ))}

            {/* Symbols + labels */}
            {layout.nodes.map((node) => (
              <g key={node.id}>
                {renderDiagramSymbol({
                  symbolId: node.symbolId as SymbolPrimitiveId,
                  cx: node.cx,
                  cy: node.cy,
                  scale: node.scale,
                })}
                <text
                  x={node.cx}
                  y={node.cy + 28}
                  textAnchor="middle"
                  className="diag-text-xs font-bold"
                  fill="oklch(0.75 0.008 250)"
                  style={{ fontFamily: "var(--diag-font-mono)" }}
                >
                  {node.label}
                </text>
                {showTerminalLabels && node.metadata?.note && (
                  <text
                    x={node.cx}
                    y={node.cy + 40}
                    textAnchor="middle"
                    className="diag-text-xs"
                    fill="oklch(0.50 0.006 250)"
                    style={{ fontFamily: "var(--diag-font-mono)" }}
                  >
                    {node.metadata.note}
                  </text>
                )}
                {showTerminalLabels && node.metadata?.device && (
                  <text
                    x={node.cx}
                    y={node.cy - 32}
                    textAnchor="middle"
                    className="diag-text-xs"
                    fill="oklch(0.50 0.006 250)"
                    style={{ fontFamily: "var(--diag-font-mono)" }}
                  >
                    ← {node.metadata.device}
                  </text>
                )}
                {interactive && (
                  <a href={`/reference/electrical/${node.symbolId}`}>
                    <text
                      x={node.cx}
                      y={node.cy + (node.metadata?.device ? 52 : 40)}
                      textAnchor="middle"
                      className="diag-text-xs"
                      fill="oklch(0.55 0.12 155)"
                      style={{ fontFamily: "var(--diag-font-mono)", cursor: "pointer" }}
                    >
                      [std]
                    </text>
                  </a>
                )}
              </g>
            ))}

            {/* Annotations */}
            {layout.annotations.map((ann, i) => (
              <text
                key={i}
                x={ann.x}
                y={ann.y}
                className={ann.className}
                fill="oklch(0.55 0.008 250)"
                style={{ fontFamily: "var(--diag-font-mono)" }}
              >
                {ann.text}
              </text>
            ))}
          </svg>
        </div>
      </div>

      <p className="mt-2 text-[10px] font-mono text-[oklch(0.40_0.006_250)] print:text-black">
        Sheet {spec.sheetId} · {spec.pageSize} {spec.orientation} · symbols per electricalSymbolRegistry
      </p>
    </div>
  );
}
