/**
 * Wiring diagram layout engine — grid units → SVG coordinates (pure, testable).
 */

import type {
  WiringDiagramSpec,
  WiringEdge,
  WiringNode,
  WiringWireType,
} from "./wiringDiagramSpec";

export const WIRING_GRID_PX = 56;
export const WIRING_PADDING_PX = 48;
export const WIRING_MIN_FONT_PX = 10;

export interface LayoutPoint {
  x: number;
  y: number;
}

export interface LayoutNode {
  id: string;
  symbolId: string;
  label: string;
  cx: number;
  cy: number;
  scale: number;
  metadata?: Record<string, string>;
}

export interface LayoutWire {
  id: string;
  wireType: WiringWireType;
  label?: string;
  pathD: string;
  labelPoint: LayoutPoint;
}

export interface LayoutAnnotation {
  text: string;
  x: number;
  y: number;
  className: string;
}

export interface LayoutResult {
  viewBox: string;
  width: number;
  height: number;
  nodes: LayoutNode[];
  wires: LayoutWire[];
  annotations: LayoutAnnotation[];
}

type Anchor = "left" | "right" | "top" | "bottom";

const SYMBOL_HALF_W: Record<string, number> = {
  fuse: 18,
  breaker: 18,
  terminal: 14,
  estop: 22,
  pb_no: 18,
  pb_nc: 18,
  photoeye: 26,
  overload_heater: 22,
  plc_input: 24,
  plc_output: 24,
  contactor_power: 16,
  coil: 14,
  motor: 18,
};

const WIRE_STROKE: Record<WiringWireType, string> = {
  power: "oklch(0.70 0.14 85)",
  signal: "oklch(0.65 0.12 155)",
  ground: "oklch(0.50 0.006 250)",
  motor: "oklch(0.65 0.15 35)",
  control: "oklch(0.60 0.12 250)",
};

export function getWireStrokeColor(wireType: WiringWireType): string {
  return WIRE_STROKE[wireType];
}

function gridToPixel(gx: number, gy: number): LayoutPoint {
  return {
    x: WIRING_PADDING_PX + gx * WIRING_GRID_PX + WIRING_GRID_PX / 2,
    y: WIRING_PADDING_PX + gy * WIRING_GRID_PX + WIRING_GRID_PX / 2,
  };
}

function nodeAnchor(node: WiringNode, anchor: Anchor = "right"): LayoutPoint {
  const center = gridToPixel(node.x, node.y);
  const half = SYMBOL_HALF_W[node.symbolId] ?? 16;
  switch (anchor) {
    case "left":
      return { x: center.x - half, y: center.y };
    case "right":
      return { x: center.x + half, y: center.y };
    case "top":
      return { x: center.x, y: center.y - half };
    case "bottom":
      return { x: center.x, y: center.y + half };
    default:
      return center;
  }
}

function resolveAnchor(nodeMap: Map<string, WiringNode>, ref: WiringEdge["from"]): LayoutPoint {
  const node = nodeMap.get(ref.nodeId);
  if (!node) return { x: 0, y: 0 };
  return nodeAnchor(node, ref.anchor ?? "right");
}

function routeOrthogonal(from: LayoutPoint, to: LayoutPoint): string {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  if (dx < 4 || dy < 4) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }
  const midY = from.y + (to.y - from.y) * 0.5;
  return `M ${from.x} ${from.y} V ${midY} H ${to.x} V ${to.y}`;
}

function routeDirect(from: LayoutPoint, to: LayoutPoint): string {
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
}

export function layoutWiringDiagram(spec: WiringDiagramSpec): LayoutResult {
  const nodeMap = new Map(spec.nodes.map((n) => [n.id, n]));
  const width = WIRING_PADDING_PX * 2 + spec.gridCols * WIRING_GRID_PX;
  const height = WIRING_PADDING_PX * 2 + spec.gridRows * WIRING_GRID_PX;

  const nodes: LayoutNode[] = spec.nodes.map((n) => {
    const pt = gridToPixel(n.x, n.y);
    return {
      id: n.id,
      symbolId: n.symbolId,
      label: n.label,
      cx: pt.x,
      cy: pt.y,
      scale: 0.9,
      metadata: n.metadata,
    };
  });

  const wires: LayoutWire[] = spec.edges.map((edge) => {
    const from = resolveAnchor(nodeMap, edge.from);
    const to = resolveAnchor(nodeMap, edge.to);
    const pathD =
      edge.path === "direct" ? routeDirect(from, to) : routeOrthogonal(from, to);
    const labelPoint = {
      x: (from.x + to.x) / 2,
      y: (from.y + to.y) / 2 - 6,
    };
    return {
      id: edge.id,
      wireType: edge.wireType,
      label: edge.label,
      pathD,
      labelPoint,
    };
  });

  const annotations: LayoutAnnotation[] = spec.annotations.map((a) => {
    const pt = gridToPixel(a.x, a.y);
    return {
      text: a.text,
      x: pt.x,
      y: pt.y,
      className: a.className ?? "diag-text-xs",
    };
  });

  return {
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    nodes,
    wires,
    annotations,
  };
}

export function getLayoutBounds(layout: LayoutResult): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  return {
    minX: 0,
    minY: 0,
    maxX: layout.width,
    maxY: layout.height,
  };
}
