/**
 * WiringDiagramSpec — registry-governed print wiring diagram data model (A4).
 * Layout: shared/wiringDiagramLayout.ts
 * Render: client/src/components/diagrams/WiringDiagramSvg.tsx
 */

import { getSymbolById } from "./electricalSymbolRegistry";
import type { SymbolPrimitiveId } from "./electricalSymbolRegistry";

export type WiringPageSize = "letter" | "a4";
export type WiringOrientation = "landscape" | "portrait";
export type WiringWireType = "power" | "signal" | "ground" | "motor" | "control";
export type WiringPathStyle = "orthogonal" | "direct";

export interface WiringTerminalRef {
  nodeId: string;
  terminalId?: string;
  anchor?: "left" | "right" | "top" | "bottom";
}

export interface WiringNode {
  id: string;
  symbolId: SymbolPrimitiveId;
  label: string;
  /** Grid column (0-based) */
  x: number;
  /** Grid row (0-based) */
  y: number;
  rotation?: 0 | 90 | 180 | 270;
  metadata?: Record<string, string>;
}

export interface WiringEdge {
  id: string;
  from: WiringTerminalRef;
  to: WiringTerminalRef;
  wireType: WiringWireType;
  label?: string;
  path?: WiringPathStyle;
}

export interface WiringAnnotation {
  text: string;
  x: number;
  y: number;
  className?: "diag-text-xs" | "diag-text-secondary";
}

export interface WiringDiagramSpec {
  sheetId: string;
  title: string;
  subtitle?: string;
  pageSize: WiringPageSize;
  orientation: WiringOrientation;
  gridCols: number;
  gridRows: number;
  nodes: WiringNode[];
  edges: WiringEdge[];
  annotations: WiringAnnotation[];
}

export interface PrintPackageDefinition {
  id: string;
  title: string;
  version: string;
  wiringDiagram?: WiringDiagramSpec;
}

export interface WiringValidationIssue {
  path: string;
  message: string;
}

export interface WiringValidationResult {
  valid: boolean;
  errors: WiringValidationIssue[];
  warnings: WiringValidationIssue[];
}

export function validateWiringDiagramSpec(spec: WiringDiagramSpec): WiringValidationResult {
  const errors: WiringValidationIssue[] = [];
  const warnings: WiringValidationIssue[] = [];
  const nodeIds = new Set(spec.nodes.map((n) => n.id));

  if (!spec.sheetId.trim()) {
    errors.push({ path: "sheetId", message: "sheetId is required" });
  }

  for (const node of spec.nodes) {
    if (!getSymbolById(node.symbolId)) {
      errors.push({
        path: `nodes.${node.id}`,
        message: `symbolId "${node.symbolId}" not found in electricalSymbolRegistry`,
      });
    }
    if (node.x < 0 || node.x >= spec.gridCols) {
      errors.push({
        path: `nodes.${node.id}.x`,
        message: `x=${node.x} outside gridCols=${spec.gridCols}`,
      });
    }
    if (node.y < 0 || node.y >= spec.gridRows) {
      errors.push({
        path: `nodes.${node.id}.y`,
        message: `y=${node.y} outside gridRows=${spec.gridRows}`,
      });
    }
  }

  const edgeIds = new Set<string>();
  for (const edge of spec.edges) {
    if (edgeIds.has(edge.id)) {
      errors.push({ path: `edges.${edge.id}`, message: "duplicate edge id" });
    }
    edgeIds.add(edge.id);

    if (!nodeIds.has(edge.from.nodeId)) {
      errors.push({
        path: `edges.${edge.id}.from`,
        message: `unknown node "${edge.from.nodeId}"`,
      });
    }
    if (!nodeIds.has(edge.to.nodeId)) {
      errors.push({
        path: `edges.${edge.id}.to`,
        message: `unknown node "${edge.to.nodeId}"`,
      });
    }
  }

  const connected = new Set<string>();
  for (const edge of spec.edges) {
    connected.add(edge.from.nodeId);
    connected.add(edge.to.nodeId);
  }
  for (const node of spec.nodes) {
    if (!connected.has(node.id)) {
      warnings.push({
        path: `nodes.${node.id}`,
        message: "node has no connected edges",
      });
    }
  }

  for (const ann of spec.annotations) {
    if (!ann.className || ann.className === "diag-text-xs") {
      // Constitution: minimum 10px via diag-text-xs token — enforced at render/CSS
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function assertWiringDiagramValid(spec: WiringDiagramSpec): void {
  const result = validateWiringDiagramSpec(spec);
  if (!result.valid) {
    const detail = result.errors.map((e) => `${e.path}: ${e.message}`).join("\n");
    throw new Error(`Wiring diagram validation failed:\n${detail}`);
  }
}
