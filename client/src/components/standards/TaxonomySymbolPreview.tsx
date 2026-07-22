/**
 * Renders a PUBLISHED taxonomy symbol (PLC ladder instruction or functional block).
 * Only source-confirmed geometry is drawn here; hardwired NEMA/JIC symbols pending
 * licensed ICS 19 are NOT rendered (they live in PENDING_LIBRARY as records only).
 */
import {
  DiagramNOContact,
  DiagramNCContact,
  DiagramLadderCoil,
  DiagramTimerInstruction,
  DiagramFunctionalBlock,
  DiagramPhotoeye,
} from "@/lib/electricalDiagramPrimitives";

const COLOR = "oklch(0.65 0.10 155)";

export default function TaxonomySymbolPreview({ renderKey }: { renderKey: string }) {
  return (
    <svg viewBox="0 -14 88 96" className="w-full h-full electrical-diagram" preserveAspectRatio="xMidYMid meet">
      <Glyph renderKey={renderKey} />
    </svg>
  );
}

function Glyph({ renderKey }: { renderKey: string }) {
  const cx = 44;
  const cy = 34;
  switch (renderKey) {
    // PLC ladder instructions (Rockwell geometry)
    case "xic":
      return <DiagramNOContact cx={cx} cy={cy} color={COLOR} scale={1.7} />;
    case "xio":
      return <DiagramNCContact cx={cx} cy={cy} color={COLOR} scale={1.7} />;
    case "ote":
      return <DiagramLadderCoil cx={cx} cy={cy} color={COLOR} scale={1.7} />;
    case "otl":
      return <DiagramLadderCoil cx={cx} cy={cy} color={COLOR} scale={1.7} letter="L" />;
    case "otu":
      return <DiagramLadderCoil cx={cx} cy={cy} color={COLOR} scale={1.7} letter="U" />;
    case "res":
      return <DiagramLadderCoil cx={cx} cy={cy} color={COLOR} scale={1.7} letter="RES" />;
    case "ton":
      return <DiagramTimerInstruction cx={cx} cy={cy} color={COLOR} scale={1.6} mnemonic="TON" />;
    case "tof":
      return <DiagramTimerInstruction cx={cx} cy={cy} color={COLOR} scale={1.6} mnemonic="TOF" />;
    case "rto":
      return <DiagramTimerInstruction cx={cx} cy={cy} color={COLOR} scale={1.6} mnemonic="RTO" />;

    // Functional blocks (vendor geometry)
    case "safety_module":
      return (
        <DiagramFunctionalBlock
          cx={cx} cy={cy} color={COLOR} scale={1.35}
          title="SAFETY" subtitle="RELAY"
          leftTerms={["CH1", "CH2", "RST"]}
          rightTerms={["13", "23", "Y32"]}
        />
      );
    case "plc_input_module":
      return (
        <DiagramFunctionalBlock
          cx={cx} cy={cy} color={COLOR} scale={1.35}
          title="PLC" subtitle="INPUT MODULE"
          leftTerms={["I:0", "I:1", "I:2"]}
          rightTerms={["COM"]}
        />
      );
    case "plc_output_module":
      return (
        <DiagramFunctionalBlock
          cx={cx} cy={cy} color={COLOR} scale={1.35}
          title="PLC" subtitle="OUTPUT MODULE"
          leftTerms={["VDC"]}
          rightTerms={["O:0", "O:1", "O:2"]}
        />
      );
    case "vfd_relay_output":
      return (
        <DiagramFunctionalBlock
          cx={cx} cy={cy} color={COLOR} scale={1.35}
          title="VFD" subtitle="RELAY OUT · config"
          leftTerms={["R1"]}
          rightTerms={["NO", "C", "NC"]}
        />
      );
    case "photoeye":
      return <DiagramPhotoeye cx={cx} cy={cy} color={COLOR} scale={1.4} blocked={false} />;

    default:
      return (
        <text x={cx} y={cy} textAnchor="middle" fill={COLOR} style={{ fontFamily: "var(--diag-font-mono)" }}>?</text>
      );
  }
}
