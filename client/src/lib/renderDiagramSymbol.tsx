/**
 * Registry-governed symbol renderer for wiring diagrams.
 * Wiring diagrams are hardwired elementary diagrams — use HW contact primitives.
 */
import type { ReactNode } from "react";
import type { SymbolPrimitiveId } from "@shared/electricalSymbolRegistry";
import {
  DiagramBreaker,
  DiagramCoil,
  DiagramContactorPole,
  DiagramEStop,
  DiagramFuse,
  DiagramGuardSwitch,
  DiagramLimitSwitch,
  DiagramMotor,
  DiagramOverloadHeater,
  DiagramPhotoeye,
  DiagramPLCInput,
  DiagramPLCOutput,
  DiagramPushbuttonNC,
  DiagramPushbuttonNO,
  DiagramSelectorSwitchHW,
  DiagramTerminal,
  HW_NCContact,
  HW_NOContact,
} from "@/lib/electricalDiagramPrimitives";

const DEFAULT_COLOR = "oklch(0.72 0.10 155)";

export interface DiagramSymbolProps {
  symbolId: SymbolPrimitiveId | string;
  cx: number;
  cy: number;
  color?: string;
  scale?: number;
}

export function renderDiagramSymbol({
  symbolId,
  cx,
  cy,
  color = DEFAULT_COLOR,
  scale = 0.9,
}: DiagramSymbolProps): ReactNode {
  switch (symbolId) {
    case "fuse":
      return <DiagramFuse cx={cx} cy={cy} color={color} scale={scale} />;
    case "breaker":
      return <DiagramBreaker cx={cx} cy={cy} color={color} scale={scale} />;
    case "terminal":
      return <DiagramTerminal cx={cx} cy={cy} color={color} scale={scale} />;
    case "estop":
      return <DiagramEStop cx={cx} cy={cy} color={color} scale={scale} energized={false} />;
    case "pb_no":
      return <DiagramPushbuttonNO cx={cx} cy={cy} color={color} scale={scale} />;
    case "pb_nc":
      return <DiagramPushbuttonNC cx={cx} cy={cy} color={color} scale={scale} />;
    case "photoeye":
      return <DiagramPhotoeye cx={cx} cy={cy} color={color} scale={scale} blocked={false} />;
    case "overload_heater":
      return <DiagramOverloadHeater cx={cx} cy={cy} color={color} scale={scale} />;
    case "overload_nc":
      return <HW_NCContact cx={cx} cy={cy} color={color} scale={scale} />;
    case "guard_switch":
      return <DiagramGuardSwitch cx={cx} cy={cy} color={color} scale={scale} />;
    case "selector_switch":
      return <DiagramSelectorSwitchHW cx={cx} cy={cy} color={color} scale={scale} />;
    case "limit_switch":
      return <DiagramLimitSwitch cx={cx} cy={cy} color={color} scale={scale} />;
    case "plc_input":
      return <DiagramPLCInput cx={cx} cy={cy} color={color} scale={scale} energized />;
    case "plc_output":
      return <DiagramPLCOutput cx={cx} cy={cy} color={color} scale={scale} energized={false} />;
    case "contactor_power":
      return <DiagramContactorPole cx={cx} cy={cy} color={color} scale={scale} closed />;
    case "coil":
      return <DiagramCoil cx={cx} cy={cy} color={color} scale={scale} />;
    case "motor":
      return <DiagramMotor cx={cx} cy={cy} color={color} scale={scale} label="M" />;
    case "contact_no":
      return <HW_NOContact cx={cx} cy={cy} color={color} scale={scale} />;
    case "contact_nc":
      return <HW_NCContact cx={cx} cy={cy} color={color} scale={scale} />;
    default:
      return (
        <g>
          <rect
            x={cx - 20}
            y={cy - 12}
            width={40}
            height={24}
            rx={3}
            stroke={color}
            strokeWidth={1.5}
            fill="oklch(0.10 0.01 240 / 0.5)"
          />
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            className="diag-text-xs"
            fill={color}
            style={{ fontFamily: "var(--diag-font-mono)" }}
          >
            ?
          </text>
        </g>
      );
  }
}
