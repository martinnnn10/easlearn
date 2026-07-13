/**
 * Animated Ladder Logic SVG - decorative component
 * Shows a simplified relay logic diagram with animated signal flow
 */
import { motion } from "framer-motion";

export default function LadderLogicSVG({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 200"
      className={`w-full h-auto ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Power Rails */}
      <line x1="40" y1="20" x2="40" y2="180" stroke="oklch(0.78 0.22 135 / 40%)" strokeWidth="2" />
      <line x1="360" y1="20" x2="360" y2="180" stroke="oklch(0.78 0.22 135 / 40%)" strokeWidth="2" />

      {/* Rung 1 */}
      <line x1="40" y1="50" x2="100" y2="50" stroke="oklch(0.78 0.22 135 / 30%)" strokeWidth="1.5" />
      {/* NO Contact */}
      <line x1="100" y1="40" x2="100" y2="60" stroke="oklch(0.78 0.22 135 / 50%)" strokeWidth="1.5" />
      <line x1="130" y1="40" x2="130" y2="60" stroke="oklch(0.78 0.22 135 / 50%)" strokeWidth="1.5" />
      <motion.line
        x1="130" y1="50" x2="200" y2="50"
        stroke="oklch(0.78 0.22 135)"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      />
      {/* NC Contact */}
      <line x1="200" y1="40" x2="200" y2="60" stroke="oklch(0.78 0.22 135 / 50%)" strokeWidth="1.5" />
      <line x1="230" y1="40" x2="230" y2="60" stroke="oklch(0.78 0.22 135 / 50%)" strokeWidth="1.5" />
      <line x1="195" y1="35" x2="235" y2="65" stroke="oklch(0.78 0.22 135 / 40%)" strokeWidth="1" />
      <line x1="230" y1="50" x2="320" y2="50" stroke="oklch(0.78 0.22 135 / 30%)" strokeWidth="1.5" />
      {/* Coil */}
      <circle cx="340" cy="50" r="12" stroke="oklch(0.78 0.22 135 / 50%)" strokeWidth="1.5" />
      <line x1="340" y1="50" x2="360" y2="50" stroke="oklch(0.78 0.22 135 / 30%)" strokeWidth="1.5" />
      <text x="335" y="54" fontSize="8" fill="oklch(0.78 0.22 135 / 70%)" textAnchor="middle">K1</text>

      {/* Rung 2 */}
      <line x1="40" y1="100" x2="100" y2="100" stroke="oklch(0.78 0.22 135 / 30%)" strokeWidth="1.5" />
      <line x1="100" y1="90" x2="100" y2="110" stroke="oklch(0.78 0.22 135 / 50%)" strokeWidth="1.5" />
      <line x1="130" y1="90" x2="130" y2="110" stroke="oklch(0.78 0.22 135 / 50%)" strokeWidth="1.5" />
      <motion.line
        x1="130" y1="100" x2="320" y2="100"
        stroke="oklch(0.78 0.22 135)"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, delay: 1, repeat: Infinity, repeatDelay: 3 }}
      />
      <circle cx="340" cy="100" r="12" stroke="oklch(0.78 0.22 135 / 50%)" strokeWidth="1.5" />
      <line x1="340" y1="100" x2="360" y2="100" stroke="oklch(0.78 0.22 135 / 30%)" strokeWidth="1.5" />
      <text x="335" y="104" fontSize="8" fill="oklch(0.78 0.22 135 / 70%)" textAnchor="middle">M1</text>

      {/* Rung 3 */}
      <line x1="40" y1="150" x2="100" y2="150" stroke="oklch(0.78 0.22 135 / 30%)" strokeWidth="1.5" />
      <line x1="100" y1="140" x2="100" y2="160" stroke="oklch(0.78 0.22 135 / 50%)" strokeWidth="1.5" />
      <line x1="130" y1="140" x2="130" y2="160" stroke="oklch(0.78 0.22 135 / 50%)" strokeWidth="1.5" />
      <line x1="130" y1="150" x2="180" y2="150" stroke="oklch(0.78 0.22 135 / 30%)" strokeWidth="1.5" />
      <line x1="180" y1="140" x2="180" y2="160" stroke="oklch(0.78 0.22 135 / 50%)" strokeWidth="1.5" />
      <line x1="210" y1="140" x2="210" y2="160" stroke="oklch(0.78 0.22 135 / 50%)" strokeWidth="1.5" />
      <motion.line
        x1="210" y1="150" x2="320" y2="150"
        stroke="oklch(0.78 0.22 135)"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, delay: 2, repeat: Infinity, repeatDelay: 3 }}
      />
      <circle cx="340" cy="150" r="12" stroke="oklch(0.78 0.22 135 / 50%)" strokeWidth="1.5" />
      <line x1="340" y1="150" x2="360" y2="150" stroke="oklch(0.78 0.22 135 / 30%)" strokeWidth="1.5" />
      <text x="335" y="154" fontSize="8" fill="oklch(0.78 0.22 135 / 70%)" textAnchor="middle">H1</text>

      {/* Labels */}
      <text x="40" y="15" fontSize="9" fill="oklch(0.78 0.22 135 / 50%)">L1</text>
      <text x="355" y="15" fontSize="9" fill="oklch(0.78 0.22 135 / 50%)">L2</text>
      <text x="108" y="38" fontSize="7" fill="oklch(0.5 0.01 250)">S0.0</text>
      <text x="200" y="38" fontSize="7" fill="oklch(0.5 0.01 250)">OL</text>
      <text x="108" y="88" fontSize="7" fill="oklch(0.5 0.01 250)">K1</text>
      <text x="108" y="138" fontSize="7" fill="oklch(0.5 0.01 250)">K1</text>
      <text x="180" y="138" fontSize="7" fill="oklch(0.5 0.01 250)">OL</text>

      {/* Animated signal pulse */}
      <motion.circle
        cx="40"
        cy="50"
        r="3"
        fill="oklch(0.78 0.22 135)"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0], cx: [40, 200, 360] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
      />
    </svg>
  );
}
