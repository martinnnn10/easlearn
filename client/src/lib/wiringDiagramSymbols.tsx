/**
 * Wiring diagram symbol renderers — uses audited primitives (registry-governed).
 */
import type { ReactNode } from "react";
import {
  DiagramBreaker,
  DiagramContactorPole,
  DiagramDisconnect,
  DiagramFuse,
  DiagramMotor,
  DiagramOverloadHeater,
} from "@/lib/electricalDiagramPrimitives";

type Props = { x: number; y: number; color?: string; scale?: number };

const DEFAULT = "currentColor";

export function WiringBreaker({ x, y, color = DEFAULT, scale = 1.1 }: Props): ReactNode {
  return <DiagramBreaker cx={x} cy={y} color={color} scale={scale} />;
}

export function WiringContactor({ x, y, color = DEFAULT, scale = 1.1 }: Props): ReactNode {
  return <DiagramContactorPole cx={x} cy={y} color={color} scale={scale} closed />;
}

export function WiringOverload({ x, y, color = DEFAULT, scale = 1.1 }: Props): ReactNode {
  return <DiagramOverloadHeater cx={x} cy={y} color={color} scale={scale} />;
}

export function WiringFuse({ x, y, color = DEFAULT, scale = 1.1 }: Props): ReactNode {
  return <DiagramFuse cx={x} cy={y} color={color} scale={scale} />;
}

export function WiringDisconnect({ x, y, color = DEFAULT, scale = 1.1 }: Props): ReactNode {
  return <DiagramDisconnect cx={x} cy={y} color={color} energized={false} scale={scale} />;
}

export function WiringMotor({ x, y, color = DEFAULT, scale = 1.1, hpLabel }: Props & { hpLabel?: string }): ReactNode {
  return (
    <g>
      <DiagramMotor cx={x} cy={y} color={color} scale={scale} />
      {hpLabel && (
        <text
          x={x}
          y={y + 22}
          textAnchor="middle"
          className="diag-text-secondary"
          fill={color}
          style={{ fontFamily: "var(--diag-font-mono)" }}
        >
          {hpLabel}
        </text>
      )}
    </g>
  );
}

export function WiringDeviceLabel({
  x,
  y,
  lines,
  color = DEFAULT,
}: {
  x: number;
  y: number;
  lines: string[];
  color?: string;
}): ReactNode {
  return (
    <>
      {lines.map((line, i) => (
        <text
          key={i}
          x={x}
          y={y + i * 13}
          className="diag-text-secondary"
          fill={color}
          style={{ fontFamily: "var(--diag-font-mono)" }}
        >
          {line}
        </text>
      ))}
    </>
  );
}
