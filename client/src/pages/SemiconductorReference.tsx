/**
 * Semiconductor Quick Reference — Printable reference card
 * All diode + transistor IEEE 315 / ANSI Y32.2 symbols, part numbers, and multimeter test procedures.
 * Designed for print: single-page layout, high contrast, no dark theme.
 *
 * DRAFTING STANDARDS:
 * - All symbols use outline-only line art (no filled polygons)
 * - Consistent stroke-width: 2px for wires, 2px for symbol bodies, 1.5px for arrowheads
 * - Labels positioned in dedicated spacing zones (never overlapping graphics)
 * - IEEE 315 / ANSI Y32.2 compliant geometry
 * - Proportions match professional CAD exports (Siemens/Allen-Bradley style)
 */
import { useRef } from "react";
import { Printer, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function SemiconductorReference() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Screen-only header */}
      <div className="print:hidden sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/labs#diode" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Labs
          </Link>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-sm bg-[oklch(0.45_0.12_155)] hover:bg-[oklch(0.50_0.12_155)] text-white rounded-md transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* Printable content */}
      <div ref={printRef} className="max-w-5xl mx-auto px-4 py-6 print:p-0 print:max-w-none">
        {/* Print header */}
        <div className="text-center mb-6 print:mb-4">
          <h1 className="text-2xl font-bold text-foreground print:text-black print:text-xl">Semiconductor Quick Reference</h1>
          <p className="text-sm text-muted-foreground print:text-gray-600 mt-1">IEEE 315 / ANSI Y32.2 Schematic Symbols &bull; Part Numbers &bull; Multimeter Test Procedures</p>
          <p className="text-xs text-muted-foreground/60 print:text-gray-400 mt-0.5">EAS Industrial Training Platform &bull; For field lamination</p>
        </div>

        {/* Diode Symbols Section */}
        <section className="mb-6 print:mb-4">
          <h2 className="text-lg font-semibold text-foreground print:text-black border-b border-border print:border-gray-300 pb-1 mb-3 print:text-base">Diode Types — IEEE 315 / ANSI Symbols</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 print:gap-2 print:grid-cols-3">
            {/* Standard Rectifier */}
            <DiodeCard
              name="Standard Rectifier"
              designation="D"
              partNumbers="1N4007, 1N5408, RL207"
              forwardV="0.55–0.70V"
              reverseReading="OL (>1MΩ)"
              application="DC bus rectification, power supply bridges"
              svgContent={
                <svg viewBox="0 0 120 60" className="w-full h-14 print:h-12">
                  {/* Wires */}
                  <line x1="5" y1="30" x2="40" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="80" y1="30" x2="115" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  {/* Triangle (outline only) */}
                  <path d="M40,16 L40,44 L72,30 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter"/>
                  {/* Cathode bar */}
                  <line x1="72" y1="16" x2="72" y2="44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  {/* Terminal labels — dedicated zone below */}
                  <text x="18" y="52" fontSize="9" fill="currentColor" className="print:fill-black" fontFamily="monospace">A</text>
                  <text x="98" y="52" fontSize="9" fill="currentColor" className="print:fill-black" fontFamily="monospace">K</text>
                </svg>
              }
            />
            {/* Zener */}
            <DiodeCard
              name="Zener Diode"
              designation="ZD"
              partNumbers="1N4742A (12V), 1N4733A (5.1V)"
              forwardV="0.55–0.70V"
              reverseReading="OL (until Vz)"
              application="Voltage regulation, transient clamping"
              svgContent={
                <svg viewBox="0 0 120 60" className="w-full h-14 print:h-12">
                  <line x1="5" y1="30" x2="40" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="80" y1="30" x2="115" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M40,16 L40,44 L72,30 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter"/>
                  {/* Zener cathode — bar with bent ends */}
                  <path d="M66,13 L72,16 L72,44 L78,47" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <text x="18" y="52" fontSize="9" fill="currentColor" fontFamily="monospace">A</text>
                  <text x="98" y="52" fontSize="9" fill="currentColor" fontFamily="monospace">K</text>
                </svg>
              }
            />
            {/* Schottky */}
            <DiodeCard
              name="Schottky Diode"
              designation="DS"
              partNumbers="1N5819, MBR2045, SB560"
              forwardV="0.15–0.35V"
              reverseReading="OL"
              application="High-freq rectification, OR-ing, SMPS"
              svgContent={
                <svg viewBox="0 0 120 60" className="w-full h-14 print:h-12">
                  <line x1="5" y1="30" x2="40" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="80" y1="30" x2="115" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M40,16 L40,44 L72,30 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter"/>
                  {/* Schottky cathode — S-shaped bar */}
                  <path d="M66,13 L66,17 L72,17 L72,43 L78,43 L78,47" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <text x="18" y="52" fontSize="9" fill="currentColor" fontFamily="monospace">A</text>
                  <text x="98" y="52" fontSize="9" fill="currentColor" fontFamily="monospace">K</text>
                </svg>
              }
            />
            {/* LED */}
            <DiodeCard
              name="LED"
              designation="DS (LED)"
              partNumbers="Panel indicators, status LEDs"
              forwardV="1.6–3.3V (color-dependent)"
              reverseReading="OL"
              application="Status indication, PLC output feedback"
              svgContent={
                <svg viewBox="0 0 120 60" className="w-full h-14 print:h-12">
                  <line x1="5" y1="30" x2="40" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="80" y1="30" x2="115" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M40,16 L40,44 L72,30 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter"/>
                  <line x1="72" y1="16" x2="72" y2="44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  {/* Emission arrows (pointing away) */}
                  <line x1="62" y1="14" x2="56" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M56,5 L59,7 M56,5 L58,3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="68" y1="12" x2="62" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M62,3 L65,5 M62,3 L64,1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <text x="18" y="52" fontSize="9" fill="currentColor" fontFamily="monospace">A</text>
                  <text x="98" y="52" fontSize="9" fill="currentColor" fontFamily="monospace">K</text>
                </svg>
              }
            />
            {/* Photodiode */}
            <DiodeCard
              name="Photodiode"
              designation="PD"
              partNumbers="BPW34, SFH203, optocoupler input"
              forwardV="0.4–0.6V"
              reverseReading="Varies with light"
              application="Optocouplers, light curtains, encoders"
              svgContent={
                <svg viewBox="0 0 120 60" className="w-full h-14 print:h-12">
                  <line x1="5" y1="30" x2="40" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="80" y1="30" x2="115" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M40,16 L40,44 L72,30 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter"/>
                  <line x1="72" y1="16" x2="72" y2="44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  {/* Incoming light arrows (pointing toward) */}
                  <line x1="56" y1="5" x2="62" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M56,5 L59,4 M56,5 L57,8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="62" y1="3" x2="68" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M62,3 L65,2 M62,3 L63,6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <text x="18" y="52" fontSize="9" fill="currentColor" fontFamily="monospace">A</text>
                  <text x="98" y="52" fontSize="9" fill="currentColor" fontFamily="monospace">K</text>
                </svg>
              }
            />
            {/* TVS Bidirectional */}
            <DiodeCard
              name="TVS (Bidirectional)"
              designation="D (TVS)"
              partNumbers="P6KE36CA, SMBJ24CA, 1.5KE400CA"
              forwardV="0.6–0.8V"
              reverseReading="OL (until clamp)"
              application="PLC I/O protection, VFD bus clamping"
              svgContent={
                <svg viewBox="0 0 140 60" className="w-full h-14 print:h-12">
                  <line x1="5" y1="30" x2="38" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="102" y1="30" x2="135" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  {/* Left triangle (outline) */}
                  <path d="M38,16 L38,44 L60,30 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter"/>
                  {/* Center cathode bar with Zener bends */}
                  <path d="M56,13 L60,16 L60,44 L64,47" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Right triangle (outline, reversed) */}
                  <path d="M82,16 L82,44 L60,30 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter"/>
                  <text x="18" y="52" fontSize="9" fill="currentColor" fontFamily="monospace">A</text>
                  <text x="115" y="52" fontSize="9" fill="currentColor" fontFamily="monospace">K</text>
                </svg>
              }
            />
            {/* Fast Recovery */}
            <DiodeCard
              name="Fast Recovery"
              designation="D (FR)"
              partNumbers="UF4007, MUR860, RHRP8120"
              forwardV="0.7–1.1V"
              reverseReading="OL"
              application="SMPS freewheeling, VFD DC bus"
              svgContent={
                <svg viewBox="0 0 120 60" className="w-full h-14 print:h-12">
                  <line x1="5" y1="30" x2="40" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="80" y1="30" x2="115" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M40,16 L40,44 L72,30 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter"/>
                  <line x1="72" y1="16" x2="72" y2="44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  {/* FR designation in dedicated zone below symbol */}
                  <text x="52" y="54" fontSize="8" fill="currentColor" fontStyle="italic" fontFamily="monospace">FR</text>
                  <text x="18" y="52" fontSize="9" fill="currentColor" fontFamily="monospace">A</text>
                  <text x="98" y="52" fontSize="9" fill="currentColor" fontFamily="monospace">K</text>
                </svg>
              }
            />
            {/* Bridge Rectifier */}
            <DiodeCard
              name="Bridge Rectifier"
              designation="B"
              partNumbers="KBPC3510, GBJ2510, DB107"
              forwardV="0.55–0.70V per diode"
              reverseReading="OL per diode pair"
              application="VFD input rectifier, DC power supplies"
              svgContent={
                <svg viewBox="0 0 120 90" className="w-full h-16 print:h-14">
                  {/* Diamond outline */}
                  <path d="M60,5 L100,45 L60,85 L20,45 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter"/>
                  {/* Diode arrows (outline triangles inside diamond) */}
                  {/* Top-left: anode at top-left, cathode toward top */}
                  <path d="M38,27 L50,35 L42,39" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter"/>
                  {/* Top-right: anode at top, cathode toward top-right */}
                  <path d="M72,27 L68,39 L80,35" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter"/>
                  {/* Bottom-left: anode at bottom-left, cathode toward bottom */}
                  <path d="M38,63 L42,51 L50,55" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter"/>
                  {/* Bottom-right: anode at bottom, cathode toward bottom-right */}
                  <path d="M72,63 L80,55 L68,51" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter"/>
                  {/* Terminal labels — in dedicated zones outside diamond */}
                  <text x="56" y="3" fontSize="8" fill="currentColor" fontFamily="monospace">+</text>
                  <text x="55" y="96" fontSize="8" fill="currentColor" fontFamily="monospace">−</text>
                  <text x="2" y="48" fontSize="8" fill="currentColor" fontFamily="monospace">AC</text>
                  <text x="103" y="48" fontSize="8" fill="currentColor" fontFamily="monospace">AC</text>
                </svg>
              }
            />
            {/* Flyback / Freewheeling */}
            <DiodeCard
              name="Flyback / Freewheeling"
              designation="D (FW)"
              partNumbers="1N4007, FR107 (across coil)"
              forwardV="0.55–0.70V"
              reverseReading="OL"
              application="Relay/contactor coil suppression, solenoid protection"
              svgContent={
                <svg viewBox="0 0 140 80" className="w-full h-16 print:h-14">
                  {/* Coil (rectangle with diagonal) */}
                  <rect x="30" y="10" width="50" height="24" fill="none" stroke="currentColor" strokeWidth="2" rx="1"/>
                  <line x1="30" y1="34" x2="80" y2="10" stroke="currentColor" strokeWidth="1.5"/>
                  {/* Coil terminals */}
                  <line x1="30" y1="22" x2="20" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="80" y1="22" x2="90" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  {/* Diode across coil (below) */}
                  <line x1="20" y1="22" x2="20" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="90" y1="22" x2="90" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="20" y1="60" x2="42" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="68" y1="60" x2="90" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  {/* Diode triangle (outline) */}
                  <path d="M42,50 L42,70 L62,60 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter"/>
                  {/* Diode cathode bar */}
                  <line x1="62" y1="50" x2="62" y2="70" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  {/* Labels in dedicated zones */}
                  <text x="45" y="7" fontSize="8" fill="currentColor" fontFamily="monospace">COIL</text>
                  <text x="42" y="78" fontSize="8" fill="currentColor" fontFamily="monospace" fontStyle="italic">D(FW)</text>
                </svg>
              }
            />
          </div>
        </section>

        {/* Transistor Symbols Section */}
        <section className="mb-6 print:mb-4">
          <h2 className="text-lg font-semibold text-foreground print:text-black border-b border-border print:border-gray-300 pb-1 mb-3 print:text-base">Transistor Types — IEEE 315 / ANSI Symbols</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:gap-2 print:grid-cols-4">
            {/* NPN BJT */}
            <TransistorCard
              name="NPN BJT"
              designation="Q (NPN)"
              partNumbers="2N2222, TIP31, BD139"
              testProcedure="Diode mode: B→E = 0.6V, B→C = 0.6V, E→B = OL, C→B = OL"
              svgContent={
                <svg viewBox="0 0 100 90" className="w-full h-18 print:h-16">
                  {/* Base lead */}
                  <line x1="5" y1="45" x2="35" y2="45" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  {/* Emitter region (vertical bar) */}
                  <line x1="35" y1="20" x2="35" y2="70" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  {/* Collector lead */}
                  <line x1="35" y1="30" x2="70" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  {/* Emitter lead */}
                  <line x1="35" y1="60" x2="70" y2="78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  {/* Emitter arrow (outline, pointing away from base) */}
                  <path d="M58,70 L70,78 L62,66" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" strokeLinecap="round"/>
                  {/* Terminal labels — dedicated spacing */}
                  <text x="2" y="42" fontSize="9" fill="currentColor" fontFamily="monospace">B</text>
                  <text x="74" y="16" fontSize="9" fill="currentColor" fontFamily="monospace">C</text>
                  <text x="74" y="82" fontSize="9" fill="currentColor" fontFamily="monospace">E</text>
                </svg>
              }
            />
            {/* PNP BJT */}
            <TransistorCard
              name="PNP BJT"
              designation="Q (PNP)"
              partNumbers="2N2907, TIP32, BD140"
              testProcedure="Diode mode: E→B = 0.6V, C→B = 0.6V, B→E = OL, B→C = OL"
              svgContent={
                <svg viewBox="0 0 100 90" className="w-full h-18 print:h-16">
                  <line x1="5" y1="45" x2="35" y2="45" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="35" y1="20" x2="35" y2="70" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="35" y1="30" x2="70" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="35" y1="60" x2="70" y2="78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  {/* Emitter arrow (outline, pointing TOWARD base) */}
                  <path d="M47,52 L35,60 L43,64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" strokeLinecap="round"/>
                  <text x="2" y="42" fontSize="9" fill="currentColor" fontFamily="monospace">B</text>
                  <text x="74" y="16" fontSize="9" fill="currentColor" fontFamily="monospace">C</text>
                  <text x="74" y="82" fontSize="9" fill="currentColor" fontFamily="monospace">E</text>
                </svg>
              }
            />
            {/* N-Channel MOSFET */}
            <TransistorCard
              name="N-Ch MOSFET"
              designation="Q (NMOS)"
              partNumbers="IRF540N, IRFZ44N, 2N7000"
              testProcedure="Diode mode: S→D = 0.4–0.7V (body diode), D→S = OL. Gate isolated (OL all)."
              svgContent={
                <svg viewBox="0 0 100 90" className="w-full h-18 print:h-16">
                  {/* Gate lead */}
                  <line x1="5" y1="45" x2="30" y2="45" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  {/* Gate plate (insulated) */}
                  <line x1="30" y1="20" x2="30" y2="70" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  {/* Channel (3 segments showing enhancement mode) */}
                  <line x1="37" y1="20" x2="37" y2="33" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="37" y1="38" x2="37" y2="52" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="37" y1="57" x2="37" y2="70" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  {/* Drain */}
                  <line x1="37" y1="26" x2="70" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="70" y1="10" x2="70" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  {/* Source */}
                  <line x1="37" y1="64" x2="70" y2="64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="70" y1="64" x2="70" y2="80" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  {/* Body connection */}
                  <line x1="37" y1="45" x2="55" y2="45" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="55" y1="26" x2="55" y2="64" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  {/* Body arrow (inward — N-channel) */}
                  <path d="M45,45 L55,45 M51,41 L55,45 L51,49" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="miter"/>
                  {/* Labels */}
                  <text x="2" y="42" fontSize="9" fill="currentColor" fontFamily="monospace">G</text>
                  <text x="74" y="14" fontSize="9" fill="currentColor" fontFamily="monospace">D</text>
                  <text x="74" y="78" fontSize="9" fill="currentColor" fontFamily="monospace">S</text>
                </svg>
              }
            />
            {/* IGBT */}
            <TransistorCard
              name="IGBT"
              designation="Q (IGBT)"
              partNumbers="FGH40N60, IRG4PC50U"
              testProcedure="Diode mode: E→C = 0.4–0.6V (body diode), C→E = OL. Gate isolated."
              svgContent={
                <svg viewBox="0 0 100 90" className="w-full h-18 print:h-16">
                  {/* Gate lead */}
                  <line x1="5" y1="45" x2="30" y2="45" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  {/* Gate plate */}
                  <line x1="30" y1="20" x2="30" y2="70" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  {/* Channel bar (solid — IGBT is enhancement mode) */}
                  <line x1="37" y1="20" x2="37" y2="70" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  {/* Collector */}
                  <line x1="37" y1="30" x2="70" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="70" y1="5" x2="70" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  {/* Emitter */}
                  <line x1="37" y1="60" x2="70" y2="78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="70" y1="78" x2="70" y2="85" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  {/* Emitter arrow (outline, pointing away — like NPN) */}
                  <path d="M55,70 L70,78 L60,66" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" strokeLinecap="round"/>
                  {/* Labels */}
                  <text x="2" y="42" fontSize="9" fill="currentColor" fontFamily="monospace">G</text>
                  <text x="74" y="10" fontSize="9" fill="currentColor" fontFamily="monospace">C</text>
                  <text x="74" y="84" fontSize="9" fill="currentColor" fontFamily="monospace">E</text>
                </svg>
              }
            />
          </div>
        </section>

        {/* Multimeter Test Procedures Table */}
        <section className="mb-4 print:mb-2">
          <h2 className="text-lg font-semibold text-foreground print:text-black border-b border-border print:border-gray-300 pb-1 mb-3 print:text-base">Multimeter Diode Test Quick Procedure</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs print:text-[9px] border-collapse">
              <thead>
                <tr className="bg-muted/30 print:bg-gray-100">
                  <th className="border border-border print:border-gray-300 px-2 py-1.5 text-left font-semibold">Component</th>
                  <th className="border border-border print:border-gray-300 px-2 py-1.5 text-left font-semibold">Healthy Forward</th>
                  <th className="border border-border print:border-gray-300 px-2 py-1.5 text-left font-semibold">Healthy Reverse</th>
                  <th className="border border-border print:border-gray-300 px-2 py-1.5 text-left font-semibold">Shorted</th>
                  <th className="border border-border print:border-gray-300 px-2 py-1.5 text-left font-semibold">Open</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                <tr><td className="border border-border print:border-gray-300 px-2 py-1">Standard Rectifier</td><td className="border border-border print:border-gray-300 px-2 py-1">0.55–0.70V</td><td className="border border-border print:border-gray-300 px-2 py-1">OL</td><td className="border border-border print:border-gray-300 px-2 py-1">0.00V both</td><td className="border border-border print:border-gray-300 px-2 py-1">OL both</td></tr>
                <tr><td className="border border-border print:border-gray-300 px-2 py-1">Zener</td><td className="border border-border print:border-gray-300 px-2 py-1">0.55–0.70V</td><td className="border border-border print:border-gray-300 px-2 py-1">OL (below Vz)</td><td className="border border-border print:border-gray-300 px-2 py-1">0.00V both</td><td className="border border-border print:border-gray-300 px-2 py-1">OL both</td></tr>
                <tr><td className="border border-border print:border-gray-300 px-2 py-1">Schottky</td><td className="border border-border print:border-gray-300 px-2 py-1">0.15–0.35V</td><td className="border border-border print:border-gray-300 px-2 py-1">OL</td><td className="border border-border print:border-gray-300 px-2 py-1">0.00V both</td><td className="border border-border print:border-gray-300 px-2 py-1">OL both</td></tr>
                <tr><td className="border border-border print:border-gray-300 px-2 py-1">LED (Red)</td><td className="border border-border print:border-gray-300 px-2 py-1">1.6–2.0V</td><td className="border border-border print:border-gray-300 px-2 py-1">OL</td><td className="border border-border print:border-gray-300 px-2 py-1">0.00V both</td><td className="border border-border print:border-gray-300 px-2 py-1">OL both</td></tr>
                <tr><td className="border border-border print:border-gray-300 px-2 py-1">LED (Green/Blue)</td><td className="border border-border print:border-gray-300 px-2 py-1">2.8–3.3V</td><td className="border border-border print:border-gray-300 px-2 py-1">OL</td><td className="border border-border print:border-gray-300 px-2 py-1">0.00V both</td><td className="border border-border print:border-gray-300 px-2 py-1">OL both</td></tr>
                <tr><td className="border border-border print:border-gray-300 px-2 py-1">Photodiode</td><td className="border border-border print:border-gray-300 px-2 py-1">0.4–0.6V</td><td className="border border-border print:border-gray-300 px-2 py-1">Varies w/ light</td><td className="border border-border print:border-gray-300 px-2 py-1">0.00V both</td><td className="border border-border print:border-gray-300 px-2 py-1">OL both</td></tr>
                <tr><td className="border border-border print:border-gray-300 px-2 py-1">TVS (Bidirectional)</td><td className="border border-border print:border-gray-300 px-2 py-1">0.6–0.8V</td><td className="border border-border print:border-gray-300 px-2 py-1">0.6–0.8V</td><td className="border border-border print:border-gray-300 px-2 py-1">0.00V both</td><td className="border border-border print:border-gray-300 px-2 py-1">OL both</td></tr>
                <tr><td className="border border-border print:border-gray-300 px-2 py-1">Fast Recovery</td><td className="border border-border print:border-gray-300 px-2 py-1">0.7–1.1V</td><td className="border border-border print:border-gray-300 px-2 py-1">OL</td><td className="border border-border print:border-gray-300 px-2 py-1">0.00V both</td><td className="border border-border print:border-gray-300 px-2 py-1">OL both</td></tr>
                <tr><td className="border border-border print:border-gray-300 px-2 py-1">Bridge (per diode)</td><td className="border border-border print:border-gray-300 px-2 py-1">0.55–0.70V</td><td className="border border-border print:border-gray-300 px-2 py-1">OL</td><td className="border border-border print:border-gray-300 px-2 py-1">0.00V both</td><td className="border border-border print:border-gray-300 px-2 py-1">OL both</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-[10px] text-muted-foreground/50 print:text-gray-400 border-t border-border/30 print:border-gray-200 pt-2 mt-4">
          <p>EAS Industrial Training Platform &bull; Semiconductor Quick Reference v2.0 &bull; For educational and field reference use</p>
          <p>Always verify with manufacturer datasheets. De-energize and LOTO before testing in-circuit.</p>
        </div>
      </div>
    </div>
  );
}

function DiodeCard({ name, designation, partNumbers, forwardV, reverseReading, application, svgContent }: {
  name: string;
  designation: string;
  partNumbers: string;
  forwardV: string;
  reverseReading: string;
  application: string;
  svgContent: React.ReactNode;
}) {
  return (
    <div className="border border-border/40 print:border-gray-300 rounded-md p-2.5 print:p-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground print:text-black">{name}</span>
        <span className="text-[10px] font-mono text-muted-foreground print:text-gray-500">{designation}</span>
      </div>
      {/* Symbol in dedicated zone with padding */}
      <div className="flex justify-center py-2 px-1 text-foreground print:text-black border-y border-border/20 print:border-gray-200">{svgContent}</div>
      <div className="space-y-0.5 text-[10px] print:text-[8px] pt-1">
        <p className="text-muted-foreground print:text-gray-600"><span className="font-semibold">Parts:</span> {partNumbers}</p>
        <p className="text-muted-foreground print:text-gray-600"><span className="font-semibold">Fwd:</span> {forwardV} &bull; <span className="font-semibold">Rev:</span> {reverseReading}</p>
        <p className="text-muted-foreground/80 print:text-gray-500 italic">{application}</p>
      </div>
    </div>
  );
}

function TransistorCard({ name, designation, partNumbers, testProcedure, svgContent }: {
  name: string;
  designation: string;
  partNumbers: string;
  testProcedure: string;
  svgContent: React.ReactNode;
}) {
  return (
    <div className="border border-border/40 print:border-gray-300 rounded-md p-2.5 print:p-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground print:text-black">{name}</span>
        <span className="text-[10px] font-mono text-muted-foreground print:text-gray-500">{designation}</span>
      </div>
      {/* Symbol in dedicated zone with padding */}
      <div className="flex justify-center py-2 px-1 text-foreground print:text-black border-y border-border/20 print:border-gray-200">{svgContent}</div>
      <div className="space-y-0.5 text-[10px] print:text-[8px] pt-1">
        <p className="text-muted-foreground print:text-gray-600"><span className="font-semibold">Parts:</span> {partNumbers}</p>
        <p className="text-muted-foreground print:text-gray-600"><span className="font-semibold">Test:</span> {testProcedure}</p>
      </div>
    </div>
  );
}
