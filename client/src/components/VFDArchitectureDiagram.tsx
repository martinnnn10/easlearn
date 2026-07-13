/**
 * VFD Architecture Diagram — Interactive Animated Power Flow
 * 
 * Shows: AC Line Input → Rectifier → DC Bus → Inverter → Motor Output
 * Features:
 * - Animated current/power flow particles
 * - Clickable sections with inline detail expansion (accordion, collapse-others)
 * - Fault simulation mode
 * - Live state indicators (voltage, current direction)
 * - Premium industrial styling
 * - Mobile: detail expands directly below tapped card with auto-scroll
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, AlertTriangle, RotateCcw, Info, Activity, ChevronDown } from "lucide-react";

// === SECTION DATA ===

interface VFDSection {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  technicalDetails: string[];
  voltageIn: string;
  voltageOut: string;
  keyComponents: string[];
  commonFailures: string[];
  fieldNote: string;
}

const VFD_SECTIONS: VFDSection[] = [
  {
    id: "ac_input",
    label: "AC Line Input",
    shortLabel: "AC IN",
    description: "Three-phase AC power from the plant distribution system. Typically 480V in US industrial applications.",
    technicalDetails: [
      "3-phase, 60Hz (US) or 50Hz (EU)",
      "Voltage: 208V, 480V, or 600V typical",
      "Line reactor recommended for harmonic mitigation",
      "Fused disconnect required upstream",
    ],
    voltageIn: "480V AC",
    voltageOut: "480V AC",
    keyComponents: ["Fused disconnect", "Line reactor", "Input contactor", "MOV surge protection"],
    commonFailures: ["Phase loss", "Voltage sag/swell", "Harmonic distortion", "Loose connections"],
    fieldNote: "Always verify all three phases are present and balanced before troubleshooting VFD faults. A 2% voltage imbalance causes 20% current imbalance.",
  },
  {
    id: "rectifier",
    label: "Rectifier (Converter)",
    shortLabel: "RECT",
    description: "Converts AC to DC using a 6-pulse diode bridge. No active switching — just rectification.",
    technicalDetails: [
      "6-pulse diode bridge (3-phase full-wave)",
      "Output: V_dc = V_ac × 1.414",
      "480V AC → ~678V DC",
      "No speed control happens here",
      "SCR-based on regenerative drives",
    ],
    voltageIn: "480V AC",
    voltageOut: "678V DC",
    keyComponents: ["6 power diodes", "Input fuses", "Pre-charge circuit", "Inrush current limiter"],
    commonFailures: ["Blown diode (shorted)", "Open diode (phase loss on DC)", "Pre-charge relay failure", "Input fuse blown"],
    fieldNote: "A shorted rectifier diode will blow the input fuse immediately on power-up. Check diodes with meter on diode-test mode — forward drop should be 0.4-0.7V.",
  },
  {
    id: "dc_bus",
    label: "DC Bus (Link)",
    shortLabel: "DC BUS",
    description: "Energy storage section. Large electrolytic capacitors smooth the rectified DC and provide energy during transients.",
    technicalDetails: [
      "Nominal: 678V DC (from 480V input)",
      "Capacitor bank: 1000-4700µF typical",
      "Stores energy for dynamic braking",
      "Bus voltage monitored continuously",
      "Overvoltage trip: ~820V, Undervoltage trip: ~400V",
    ],
    voltageIn: "678V DC (ripple)",
    voltageOut: "678V DC (smooth)",
    keyComponents: ["Electrolytic capacitors", "Bleeder resistors", "Bus voltage sensor", "Dynamic brake chopper", "Pre-charge resistor"],
    commonFailures: ["Capacitor aging/drying", "Capacitor ESR increase", "Bus overvoltage on decel", "Bus undervoltage on accel", "Charge circuit failure"],
    fieldNote: "DC bus capacitors retain LETHAL voltage after power removal. Wait minimum 5 minutes and verify with meter before touching anything. Capacitors are the #1 failure point in VFDs over 7 years old.",
  },
  {
    id: "inverter",
    label: "Inverter (Output)",
    shortLabel: "INV",
    description: "Converts DC bus voltage back to variable-frequency AC using IGBTs switching at 2-16 kHz (PWM).",
    technicalDetails: [
      "6 IGBTs (Insulated Gate Bipolar Transistors)",
      "Switching frequency: 2-16 kHz (carrier freq)",
      "PWM creates simulated sinusoidal output",
      "Output voltage: 0-480V AC variable",
      "Output frequency: 0-120Hz+ variable",
    ],
    voltageIn: "678V DC",
    voltageOut: "0–480V AC (PWM)",
    keyComponents: ["6 IGBT modules", "Gate driver boards", "Current sensors (CTs)", "Snubber circuits", "Output filter (optional)"],
    commonFailures: ["IGBT short circuit", "Gate driver failure", "Overcurrent trip", "Ground fault", "Output phase loss"],
    fieldNote: "Never megger a VFD — the 500V or 1000V test voltage will destroy IGBTs instantly. Disconnect motor leads at the VFD before meggering motor cables.",
  },
  {
    id: "motor",
    label: "Motor Output",
    shortLabel: "MOTOR",
    description: "Three-phase induction motor driven by the VFD's PWM output. Speed = frequency × 120 / poles.",
    technicalDetails: [
      "Speed = (120 × f) / P",
      "Torque maintained by V/Hz ratio",
      "Motor current monitored for overload",
      "Shaft encoder for closed-loop (optional)",
      "Motor thermistor input for protection",
    ],
    voltageIn: "0–480V AC (PWM)",
    voltageOut: "Mechanical rotation",
    keyComponents: ["Stator windings", "Rotor (squirrel cage)", "Bearings", "Cooling fan", "Terminal box", "Shaft encoder"],
    commonFailures: ["Winding insulation breakdown", "Bearing failure", "Overheating (blocked cooling)", "Shaft misalignment", "Coupling failure"],
    fieldNote: "Standard multimeters cannot accurately read VFD output voltage — the PWM waveform gives false readings. Use a true-RMS meter rated for VFD output, or measure at the VFD display parameters.",
  },
];

// === FAULT MODES ===

interface FaultMode {
  id: string;
  label: string;
  affectedSection: string;
  symptom: string;
  dcBusEffect: string;
  motorEffect: string;
  alarmCode: string;
}

const FAULT_MODES: FaultMode[] = [
  {
    id: "phase_loss",
    label: "Input Phase Loss",
    affectedSection: "ac_input",
    symptom: "DC bus voltage drops to ~585V, drive may trip on undervoltage",
    dcBusEffect: "Reduced & rippled",
    motorEffect: "Reduced torque capacity, possible trip on load",
    alarmCode: "F14 — Phase Loss",
  },
  {
    id: "dc_bus_overvoltage",
    label: "DC Bus Overvoltage",
    affectedSection: "dc_bus",
    symptom: "Bus exceeds 820V during rapid deceleration, drive trips",
    dcBusEffect: "Overvoltage >820V",
    motorEffect: "Coast to stop (drive trips)",
    alarmCode: "F05 — DC Bus OV",
  },
  {
    id: "igbt_failure",
    label: "IGBT Short Circuit",
    affectedSection: "inverter",
    symptom: "Immediate overcurrent trip, possible blown fuse, output phase loss",
    dcBusEffect: "May drop if fuse blows",
    motorEffect: "Immediate stop, possible single-phasing",
    alarmCode: "F03 — Overcurrent",
  },
  {
    id: "ground_fault",
    label: "Output Ground Fault",
    affectedSection: "motor",
    symptom: "Current imbalance detected, drive trips on ground fault",
    dcBusEffect: "Normal until trip",
    motorEffect: "Erratic operation then stop",
    alarmCode: "F06 — Ground Fault",
  },
  {
    id: "capacitor_aging",
    label: "DC Bus Capacitor Aging",
    affectedSection: "dc_bus",
    symptom: "Increased ripple, nuisance undervoltage trips under load",
    dcBusEffect: "Excessive ripple, sags under load",
    motorEffect: "Torque pulsation, intermittent trips",
    alarmCode: "F04 — DC Bus UV (intermittent)",
  },
];

// === INLINE DETAIL PANEL (renders directly below tapped card) ===

function SectionDetailInline({ section, onClose }: { section: VFDSection; onClose: () => void }) {
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll the expanded detail into view after render
    const timer = setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      ref={detailRef}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="overflow-hidden"
    >
      <div className="mt-2 bg-[#0a0e0a]/95 backdrop-blur-xl rounded-lg border border-gray-700/50 p-4 shadow-2xl">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="text-xs font-semibold text-white">{section.label}</h4>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{section.description}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-gray-500 hover:text-white transition-colors p-1 -mt-1 -mr-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {/* Technical Details */}
          <div>
            <h5 className="text-[9px] uppercase tracking-wider text-emerald-400 font-semibold mb-1.5">Technical Details</h5>
            <ul className="space-y-1">
              {section.technicalDetails.map((detail, i) => (
                <li key={i} className="text-[10px] text-gray-300 flex items-start gap-1.5">
                  <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                  <span className="font-mono">{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Key Components */}
          <div>
            <h5 className="text-[9px] uppercase tracking-wider text-blue-400 font-semibold mb-1.5">Key Components</h5>
            <ul className="space-y-1">
              {section.keyComponents.map((comp, i) => (
                <li key={i} className="text-[10px] text-gray-300 flex items-start gap-1.5">
                  <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                  {comp}
                </li>
              ))}
            </ul>
          </div>

          {/* Common Failures */}
          <div>
            <h5 className="text-[9px] uppercase tracking-wider text-red-400 font-semibold mb-1.5">Common Failures</h5>
            <ul className="space-y-1">
              {section.commonFailures.map((fail, i) => (
                <li key={i} className="text-[10px] text-gray-300 flex items-start gap-1.5">
                  <span className="text-red-500 mt-0.5 shrink-0">•</span>
                  {fail}
                </li>
              ))}
            </ul>
          </div>

          {/* Voltage Info */}
          <div>
            <h5 className="text-[9px] uppercase tracking-wider text-amber-400 font-semibold mb-1.5">Voltage Levels</h5>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 p-1.5 rounded-md bg-gray-900/50 border border-gray-800/40">
                <Zap className="w-2.5 h-2.5 text-emerald-400" />
                <span className="text-[9px] text-gray-500">In:</span>
                <span className="text-[10px] font-mono text-emerald-300">{section.voltageIn}</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-md bg-gray-900/50 border border-gray-800/40">
                <Zap className="w-2.5 h-2.5 text-blue-400" />
                <span className="text-[9px] text-gray-500">Out:</span>
                <span className="text-[10px] font-mono text-blue-300">{section.voltageOut}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Field Note */}
        <div className="mt-3 p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/20">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[9px] uppercase tracking-wider font-bold text-amber-400">Field Note</span>
          </div>
          <p className="text-[10px] text-amber-200/80 leading-relaxed">{section.fieldNote}</p>
        </div>
      </div>
    </motion.div>
  );
}

// === COMPONENT ===

interface VFDArchitectureDiagramProps {
  className?: string;
  showFaultMode?: boolean;
}

export default function VFDArchitectureDiagram({ className = "", showFaultMode = true }: VFDArchitectureDiagramProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [activeFault, setActiveFault] = useState<string | null>(null);
  const [isFlowing, setIsFlowing] = useState(true);

  const activeFaultData = FAULT_MODES.find(f => f.id === activeFault);

  const handleSectionClick = useCallback((sectionId: string) => {
    setSelectedSection(prev => prev === sectionId ? null : sectionId);
  }, []);

  const handleFaultSelect = useCallback((faultId: string) => {
    setActiveFault(prev => prev === faultId ? null : faultId);
  }, []);

  const isSectionFaulted = (sectionId: string) => {
    return activeFaultData?.affectedSection === sectionId;
  };

  const getSectionColor = (sectionId: string) => {
    if (isSectionFaulted(sectionId)) return "from-red-900/40 to-red-950/60 border-red-500/50";
    if (selectedSection === sectionId) return "from-emerald-900/30 to-emerald-950/50 border-emerald-500/50";
    return "from-[#0f1a0f]/80 to-[#0a120a]/90 border-gray-700/40";
  };

  return (
    <div className={`relative ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">VFD Power Architecture</h3>
            <p className="text-[11px] text-gray-500">Tap any section for technical details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFlowing(!isFlowing)}
            className={`px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all ${
              isFlowing 
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" 
                : "bg-gray-800/50 text-gray-500 border border-gray-700/40"
            }`}
          >
            {isFlowing ? "⚡ Live" : "⏸ Paused"}
          </button>
        </div>
      </div>

      {/* Main Diagram */}
      <div className="relative bg-[#060a06]/80 rounded-xl border border-gray-800/50 p-3 md:p-6 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle, oklch(0.55 0.12 155) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }} />

        {/* Power flow sections — on mobile, vertical list with inline expansion */}
        <div className="relative grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-3">
          {VFD_SECTIONS.map((section, index) => (
            <div key={section.id} className="relative">
              {/* Flow arrow between sections (desktop) */}
              {index > 0 && (
                <div className="hidden md:block absolute -left-3 top-1/2 -translate-y-1/2 z-10">
                  <motion.div
                    animate={isFlowing && !activeFault ? { opacity: [0.4, 1, 0.4] } : { opacity: 0.3 }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.3 }}
                    className="text-emerald-500 text-lg"
                  >
                    ›
                  </motion.div>
                </div>
              )}

              {/* Section card */}
              <button
                onClick={() => handleSectionClick(section.id)}
                className={`w-full text-left p-3 md:p-4 rounded-lg border backdrop-blur-sm bg-gradient-to-b transition-all duration-300 hover:scale-[1.02] group ${getSectionColor(section.id)}`}
              >
                {/* Fault indicator */}
                {isSectionFaulted(section.id) && (
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="absolute top-2 right-2"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  </motion.div>
                )}

                {/* Section label */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-medium">
                      {section.shortLabel}
                    </div>
                    <div className="text-xs font-semibold text-white leading-tight">
                      {section.label}
                    </div>
                  </div>
                  {/* Expand indicator on mobile */}
                  <motion.div
                    animate={{ rotate: selectedSection === section.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="md:hidden text-gray-500"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </div>

                {/* Voltage indicators */}
                <div className="space-y-1 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isSectionFaulted(section.id) ? "bg-red-400 animate-pulse" : "bg-emerald-400"}`} />
                    <span className="text-[10px] font-mono text-gray-400">{section.voltageIn}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isSectionFaulted(section.id) ? "bg-red-400 animate-pulse" : "bg-blue-400"}`} />
                    <span className="text-[10px] font-mono text-gray-400">{section.voltageOut}</span>
                  </div>
                </div>

                {/* Animated flow line */}
                {isFlowing && !isSectionFaulted(section.id) && (
                  <div className="mt-2 h-0.5 rounded-full overflow-hidden bg-gray-800/50">
                    <motion.div
                      className="h-full w-1/3 bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full"
                      animate={{ x: ["-100%", "400%"] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.4, ease: "linear" }}
                    />
                  </div>
                )}

                {/* Fault flow line */}
                {isSectionFaulted(section.id) && (
                  <div className="mt-2 h-0.5 rounded-full overflow-hidden bg-red-900/50">
                    <motion.div
                      className="h-full w-full bg-red-500/60"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                  </div>
                )}

                {/* Click hint — only show when not expanded */}
                {selectedSection !== section.id && (
                  <div className="mt-2 text-[9px] text-gray-600 group-hover:text-gray-400 transition-colors flex items-center gap-1">
                    <Info className="w-2.5 h-2.5" /> Tap for details
                  </div>
                )}
              </button>

              {/* INLINE detail expansion — renders directly below the tapped card */}
              <AnimatePresence>
                {selectedSection === section.id && (
                  <SectionDetailInline
                    section={section}
                    onClose={() => setSelectedSection(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Overall flow animation bar (desktop) */}
        <div className="hidden md:block mt-4">
          <div className="h-1 rounded-full overflow-hidden bg-gray-900/80 border border-gray-800/30">
            {isFlowing && !activeFault ? (
              <motion.div
                className="h-full w-1/6 bg-gradient-to-r from-emerald-500/0 via-emerald-400 to-emerald-500/0 rounded-full"
                animate={{ x: ["-100%", "700%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            ) : activeFault ? (
              <motion.div
                className="h-full bg-red-500/40"
                animate={{ opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            ) : null}
          </div>
          <div className="flex justify-between mt-1.5 px-1">
            <span className="text-[9px] text-gray-600">AC SUPPLY</span>
            <span className="text-[9px] text-gray-600">POWER CONVERSION</span>
            <span className="text-[9px] text-gray-600">MECHANICAL OUTPUT</span>
          </div>
        </div>
      </div>

      {/* Fault Simulation Panel */}
      {showFaultMode && (
        <div className="mt-4 bg-[#0a0e0a]/80 rounded-xl border border-gray-800/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Fault Simulation
            </h4>
            {activeFault && (
              <button
                onClick={() => setActiveFault(null)}
                className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FAULT_MODES.map(fault => (
              <button
                key={fault.id}
                onClick={() => handleFaultSelect(fault.id)}
                className={`px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all border ${
                  activeFault === fault.id
                    ? "bg-red-500/15 text-red-400 border-red-500/40"
                    : "bg-gray-900/50 text-gray-400 border-gray-700/40 hover:border-gray-600/60 hover:text-gray-300"
                }`}
              >
                {fault.label}
              </button>
            ))}
          </div>

          {/* Active fault details */}
          <AnimatePresence>
            {activeFaultData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-3 rounded-lg bg-red-950/30 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-xs font-semibold text-red-300">{activeFaultData.label}</span>
                    <span className="ml-auto text-[10px] font-mono text-red-400/70">{activeFaultData.alarmCode}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mb-2">{activeFaultData.symptom}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-[10px]">
                      <span className="text-gray-500">DC Bus:</span>{" "}
                      <span className="text-amber-400 font-mono">{activeFaultData.dcBusEffect}</span>
                    </div>
                    <div className="text-[10px]">
                      <span className="text-gray-500">Motor:</span>{" "}
                      <span className="text-amber-400 font-mono">{activeFaultData.motorEffect}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
