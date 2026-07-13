/**
 * Motor Starter 120VAC 3-wire control ladder — registry-governed primitives.
 */
import {
  DiagramCoil,
  DiagramFuse,
  DiagramNCContact,
  DiagramNOContact,
  DiagramOverloadHeater,
  DiagramPushbuttonNC,
  DiagramPushbuttonNO,
} from "@/lib/electricalDiagramPrimitives";

const COLOR = "currentColor";

export function MotorStarterLadderSvg() {
  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full electrical-diagram text-[oklch(0.60_0.008_250)]">
      {/* Rails */}
      <line x1="24" y1="8" x2="24" y2="192" stroke={COLOR} strokeWidth="2" strokeLinecap="round" />
      <line x1="176" y1="8" x2="176" y2="192" stroke={COLOR} strokeWidth="2" strokeLinecap="round" />
      <text x="24" y="6" textAnchor="middle" className="diag-text-primary" fill={COLOR} fontWeight="bold">
        L1
      </text>
      <text x="176" y="6" textAnchor="middle" className="diag-text-primary" fill={COLOR} fontWeight="bold">
        N
      </text>

      {/* F1 vertical segment */}
      <line x1="24" y1="8" x2="24" y2="28" stroke={COLOR} strokeWidth="1.5" />
      <DiagramFuse cx={24} cy={36} color={COLOR} scale={0.65} />
      <text x="38" y="40" className="diag-text-secondary" fill={COLOR}>
        F1
      </text>
      <line x1="24" y1="44" x2="24" y2="52" stroke={COLOR} strokeWidth="1.5" />

      {/* STOP NC */}
      <line x1="24" y1="52" x2="24" y2="58" stroke={COLOR} strokeWidth="1.5" />
      <DiagramPushbuttonNC cx={24} cy={68} color={COLOR} scale={0.55} />
      <text x="38" y="72" className="diag-text-secondary" fill={COLOR}>
        STOP
      </text>
      <line x1="24" y1="78" x2="24" y2="86" stroke={COLOR} strokeWidth="1.5" />

      {/* Junction */}
      <circle cx="24" cy="90" r="2.5" fill={COLOR} />

      {/* START NO branch */}
      <line x1="24" y1="90" x2="24" y2="98" stroke={COLOR} strokeWidth="1.5" />
      <DiagramPushbuttonNO cx={24} cy={108} color={COLOR} scale={0.55} />
      <text x="38" y="112" className="diag-text-secondary" fill={COLOR}>
        START
      </text>
      <line x1="24" y1="118" x2="70" y2="118" stroke={COLOR} strokeWidth="1.5" />

      {/* Seal-in M (NO) parallel */}
      <line x1="24" y1="90" x2="24" y2="128" stroke={COLOR} strokeWidth="1.5" />
      <DiagramNOContact cx={24} cy={138} color={COLOR} scale={0.55} />
      <text x="38" y="142" className="diag-text-secondary" fill={COLOR}>
        M
      </text>
      <line x1="24" y1="148" x2="70" y2="148" stroke={COLOR} strokeWidth="1.5" />

      {/* Right junction */}
      <circle cx="70" cy="133" r="2.5" fill={COLOR} />
      <line x1="70" y1="118" x2="70" y2="148" stroke={COLOR} strokeWidth="1.5" />

      {/* OL NC 95-96 */}
      <line x1="70" y1="133" x2="70" y2="152" stroke={COLOR} strokeWidth="1.5" />
      <DiagramNCContact cx={70} cy={162} color={COLOR} scale={0.55} />
      <text x="84" y="158" className="diag-text-secondary" fill={COLOR}>
        OL
      </text>
      <text x="84" y="170" className="diag-text-xs" fill={COLOR} opacity={0.7}>
        95-96
      </text>
      <line x1="70" y1="172" x2="70" y2="178" stroke={COLOR} strokeWidth="1.5" />

      {/* Coil M */}
      <line x1="70" y1="178" x2="118" y2="178" stroke={COLOR} strokeWidth="1.5" />
      <DiagramCoil cx={130} cy={178} color={COLOR} scale={0.6} />
      <text x="130" y="196" textAnchor="middle" className="diag-text-secondary" fill={COLOR}>
        M
      </text>
      <line x1="142" y1="178" x2="176" y2="178" stroke={COLOR} strokeWidth="1.5" />

      {/* Wire numbers */}
      <text x="8" y="100" className="diag-text-xs" fill={COLOR} opacity={0.55}>
        1
      </text>
      <text x="48" y="122" className="diag-text-xs" fill={COLOR} opacity={0.55}>
        3
      </text>
      <text x="48" y="152" className="diag-text-xs" fill={COLOR} opacity={0.55}>
        2
      </text>
    </svg>
  );
}
