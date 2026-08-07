/**
 * Renders registry-governed symbol preview for Standards Library cards.
 * Motor Controls category uses hardwired (diagonal blade) geometry.
 * PLC category uses ladder (vertical bar) geometry.
 *
 * The card container is w-24 (96px). We use a tight viewBox so symbols
 * appear large and clearly identifiable at card size.
 */
import type { SymbolPrimitiveId } from "@shared/electricalSymbolRegistry";
import {
  DiagramBreaker,
  DiagramCoil,
  DiagramContactorAux,
  DiagramContactorPole,
  DiagramDisconnect,
  DiagramFuse,
  DiagramGuardSwitch,
  DiagramLimitSwitch,
  DiagramMotor,
  DiagramNCContact,
  DiagramNOContact,
  DiagramOverloadHeater,
  DiagramPushbuttonNC,
  DiagramPushbuttonNO,
  DiagramSafetyRelay,
  DiagramSelectorSwitchHW,
  DiagramEStop,
  DiagramPLCInput,
  DiagramPLCOutput,
  DiagramPhotoeye,
  DiagramTerminal,
  DiagramTransformer,
} from "@/lib/electricalDiagramPrimitives";

const COLOR = "oklch(0.65 0.10 155)";

export default function StandardsSymbolPreview({ symbolId }: { symbolId: SymbolPrimitiveId }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full electrical-diagram" preserveAspectRatio="xMidYMid meet">
      <SymbolGraphic id={symbolId} />
    </svg>
  );
}

function SymbolGraphic({ id }: { id: SymbolPrimitiveId }) {
  const cx = 40;
  const cy = 40;
  // Scale factors tuned so symbols fill ~70-80% of the 80x80 viewBox
  switch (id) {
    // === Motor Controls / Ladder & Relay Symbols ===
    case "contact_no":
      return <DiagramNOContact cx={cx} cy={cy} color={COLOR} scale={1.7} />;
    case "contact_nc":
      return <DiagramNCContact cx={cx} cy={cy} color={COLOR} scale={1.7} />;
    case "coil":
      return <DiagramCoil cx={cx} cy={cy} color={COLOR} scale={2.0} />;
    case "overload_heater":
      return <DiagramOverloadHeater cx={cx} cy={cy} color={COLOR} scale={2.0} />;
    case "overload_nc":
      return (
        <g>
          <DiagramNCContact cx={cx} cy={cy} color={COLOR} scale={1.7} />
          <text x={cx} y={cy - 24} textAnchor="middle" fill={COLOR} stroke="none"
            style={{ fontFamily: "var(--diag-font-mono)", fontSize: "12px", fontWeight: 600 }}>OL</text>
        </g>
      );
    case "contactor_aux":
      return <DiagramContactorAux cx={cx} cy={cy + 8} color={COLOR} scale={1.5} />;
    case "selector_switch":
      return <DiagramSelectorSwitchHW cx={cx} cy={cy + 6} color={COLOR} scale={1.5} />;
    case "contactor_power":
      return <DiagramContactorPole cx={cx} cy={cy} color={COLOR} closed={false} scale={2.2} />;
    case "motor":
      return <DiagramMotor cx={cx} cy={cy} color={COLOR} scale={2.0} />;
    case "pb_no":
      return <DiagramPushbuttonNO cx={cx} cy={cy + 4} color={COLOR} scale={1.5} />;
    case "pb_nc":
      return <DiagramPushbuttonNC cx={cx} cy={cy + 4} color={COLOR} scale={1.5} />;

    // === Electrical Symbols ===
    case "fuse":
      return <DiagramFuse cx={cx} cy={cy} color={COLOR} scale={2.0} />;
    case "breaker":
      return <DiagramBreaker cx={cx} cy={cy} color={COLOR} scale={2.0} />;
    case "disconnect":
      return <DiagramDisconnect cx={cx} cy={cy} color={COLOR} energized={false} scale={1.8} />;
    case "transformer":
      return <DiagramTransformer cx={cx} cy={cy} color={COLOR} scale={1.8} />;
    case "terminal":
      return <DiagramTerminal cx={cx} cy={cy} color={COLOR} scale={2.0} />;

    // === Safety Circuits ===
    case "guard_switch":
      return <DiagramGuardSwitch cx={cx} cy={cy + 4} color={COLOR} scale={1.5} />;
    case "safety_relay":
      return <DiagramSafetyRelay cx={cx} cy={cy + 8} color={COLOR} scale={1.6} />;
    case "estop":
      return <DiagramEStop cx={cx} cy={cy + 4} color={COLOR} scale={1.4} energized={false} />;

    // === Limit / Field Devices ===
    case "limit_switch":
      return <DiagramLimitSwitch cx={cx} cy={cy + 4} color={COLOR} scale={1.5} />;

    // === PLC Symbols (use ladder-style vertical bars here) ===
    case "plc_input":
      return <DiagramPLCInput cx={cx} cy={cy} color={COLOR} scale={1.4} />;
    case "plc_output":
      return <DiagramPLCOutput cx={cx} cy={cy} color={COLOR} scale={1.4} />;
    case "timer_contact":
      // BLOCKED: custom timer glyph removed per ELECTRICAL_SYMBOL_SOURCE_OF_TRUTH.md
      // Electromechanical timer-relay contacts remain PENDING until ICS 19 licensed geometry
      return (
        <g>
          <text x={cx} y={cy - 6} textAnchor="middle" fill={COLOR} stroke="none"
            style={{ fontFamily: "var(--diag-font-mono)", fontSize: "9px", fontWeight: 600 }}>TR</text>
          <text x={cx} y={cy + 8} textAnchor="middle" fill="oklch(0.45 0.006 250)" stroke="none"
            style={{ fontFamily: "var(--diag-font-mono)", fontSize: "7px" }}>PENDING</text>
        </g>
      );

    // === VFD / Instrumentation ===
    // The library entry is the drive's FAULT CONTACT (its fault-relay output), not the
    // whole drive — so it is drawn as a contact with a VFD-FLT tag, not the drive block.
    case "vfd":
      return (
        <g>
          <DiagramNOContact cx={cx} cy={cy} color={COLOR} scale={1.7} />
          <text
            x={cx}
            y={cy - 24}
            textAnchor="middle"
            fill={COLOR}
            stroke="none"
            style={{ fontFamily: "var(--diag-font-mono)", fontSize: "11px", fontWeight: 600 }}
          >
            VFD FLT
          </text>
        </g>
      );
    case "photoeye":
      return <DiagramPhotoeye cx={cx} cy={cy} color={COLOR} scale={1.4} blocked={false} />;

    default:
      return (
        <text x={cx} y={cy} textAnchor="middle" className="diag-text-secondary" fill={COLOR}>
          ?
        </text>
      );
  }
}
