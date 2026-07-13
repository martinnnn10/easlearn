/**
 * VirtualMultimeterLab — Interactive multimeter simulation
 * Users select meter setting, click test points on a schematic, and read measurements.
 * Teaches proper meter usage: VAC, VDC, Ohms, Continuity, Amps
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

type MeterSetting = "vac" | "vdc" | "ohms" | "continuity" | "amps_dc";

interface TestPoint {
  id: string;
  label: string;
  x: number; // percentage position on schematic
  y: number;
  color: string;
}

interface MeasurementResult {
  from: string;
  to: string;
  setting: MeterSetting;
  reading: string;
  unit: string;
  explanation: string;
  isCorrectSetting: boolean;
}

// Circuit test points on a motor starter schematic
const testPoints: TestPoint[] = [
  { id: "L1", label: "L1 Input", x: 10, y: 15, color: "oklch(0.65 0.15 30)" },
  { id: "L2", label: "L2 Input", x: 30, y: 15, color: "oklch(0.65 0.15 30)" },
  { id: "L3", label: "L3 Input", x: 50, y: 15, color: "oklch(0.65 0.15 30)" },
  { id: "T1", label: "T1 Motor", x: 10, y: 75, color: "oklch(0.55 0.12 155)" },
  { id: "T2", label: "T2 Motor", x: 30, y: 75, color: "oklch(0.55 0.12 155)" },
  { id: "T3", label: "T3 Motor", x: 50, y: 75, color: "oklch(0.55 0.12 155)" },
  { id: "GND", label: "Ground", x: 70, y: 75, color: "oklch(0.55 0.15 90)" },
  { id: "OL", label: "OL Relay", x: 70, y: 45, color: "oklch(0.55 0.12 250)" },
  { id: "CTRL", label: "Control 120V", x: 85, y: 15, color: "oklch(0.65 0.12 50)" },
  { id: "NEUT", label: "Neutral", x: 85, y: 75, color: "oklch(0.50 0.008 250)" },
];

// Measurement lookup table
const measurements: MeasurementResult[] = [
  // Phase-to-phase voltages (correct: VAC)
  { from: "L1", to: "L2", setting: "vac", reading: "480", unit: "V AC", explanation: "Line-to-line voltage between Phase A and Phase B. Normal for a 480V 3-phase system.", isCorrectSetting: true },
  { from: "L1", to: "L3", setting: "vac", reading: "478", unit: "V AC", explanation: "Line-to-line voltage between Phase A and Phase C. Slightly lower but within acceptable 2% tolerance.", isCorrectSetting: true },
  { from: "L2", to: "L3", setting: "vac", reading: "481", unit: "V AC", explanation: "Line-to-line voltage between Phase B and Phase C. Normal.", isCorrectSetting: true },
  // Phase-to-ground (correct: VAC)
  { from: "L1", to: "GND", setting: "vac", reading: "277", unit: "V AC", explanation: "Phase-to-ground voltage. 480V / √3 ≈ 277V. This confirms a wye-connected source.", isCorrectSetting: true },
  { from: "L2", to: "GND", setting: "vac", reading: "276", unit: "V AC", explanation: "Phase B to ground. Normal for 480Y/277V system.", isCorrectSetting: true },
  { from: "L3", to: "GND", setting: "vac", reading: "278", unit: "V AC", explanation: "Phase C to ground. Normal.", isCorrectSetting: true },
  // Motor terminals (contactor open — should read 0V)
  { from: "T1", to: "T2", setting: "vac", reading: "0.0", unit: "V AC", explanation: "No voltage at motor terminals — contactor is open. This is expected when the motor is stopped.", isCorrectSetting: true },
  { from: "T1", to: "GND", setting: "vac", reading: "0.0", unit: "V AC", explanation: "No voltage to ground at motor terminal. Contactor is open.", isCorrectSetting: true },
  // Motor winding resistance (correct: Ohms)
  { from: "T1", to: "T2", setting: "ohms", reading: "2.3", unit: "Ω", explanation: "Winding resistance T1-T2. For a 5HP motor, 1.5-3.5Ω is typical. Balanced windings are key.", isCorrectSetting: true },
  { from: "T1", to: "T3", setting: "ohms", reading: "2.4", unit: "Ω", explanation: "Winding resistance T1-T3. Within 5% of T1-T2 reading — windings are balanced.", isCorrectSetting: true },
  { from: "T2", to: "T3", setting: "ohms", reading: "2.3", unit: "Ω", explanation: "Winding resistance T2-T3. All three readings within tolerance — healthy motor.", isCorrectSetting: true },
  // Motor insulation to ground (correct: Ohms — simplified megger)
  { from: "T1", to: "GND", setting: "ohms", reading: "OL", unit: "MΩ", explanation: "Infinite resistance from winding to ground = good insulation. A reading below 1MΩ would indicate insulation breakdown.", isCorrectSetting: true },
  { from: "T2", to: "GND", setting: "ohms", reading: "OL", unit: "MΩ", explanation: "Good insulation resistance to ground on T2.", isCorrectSetting: true },
  { from: "T3", to: "GND", setting: "ohms", reading: "OL", unit: "MΩ", explanation: "Good insulation resistance to ground on T3. All phases check out.", isCorrectSetting: true },
  // Continuity checks
  { from: "T1", to: "T2", setting: "continuity", reading: "BEEP", unit: "", explanation: "Continuity confirmed between T1-T2. The winding is intact.", isCorrectSetting: true },
  { from: "T1", to: "GND", setting: "continuity", reading: "NO TONE", unit: "", explanation: "No continuity from winding to ground — insulation is good. If you heard a beep here, the motor has a ground fault.", isCorrectSetting: true },
  { from: "OL", to: "GND", setting: "continuity", reading: "BEEP", unit: "", explanation: "Overload relay contacts are closed (not tripped). If no beep, the OL has tripped or contacts are open.", isCorrectSetting: true },
  // Control circuit
  { from: "CTRL", to: "NEUT", setting: "vac", reading: "120", unit: "V AC", explanation: "Control transformer secondary voltage. 120V AC is standard for US industrial control circuits.", isCorrectSetting: true },
  // Wrong settings — educational moments
  { from: "L1", to: "L2", setting: "ohms", reading: "---", unit: "", explanation: "⚠️ WRONG SETTING! Never measure resistance on a live circuit. You could damage the meter or get a false reading. Use V AC for live voltage measurements.", isCorrectSetting: false },
  { from: "L1", to: "L2", setting: "vdc", reading: "0.2", unit: "V DC", explanation: "⚠️ WRONG SETTING! This is an AC circuit — use V AC, not V DC. DC mode won't read AC voltage correctly. You'll get a near-zero or erratic reading.", isCorrectSetting: false },
  { from: "L1", to: "L2", setting: "amps_dc", reading: "---", unit: "", explanation: "⚠️ DANGER! Never connect ammeter leads across a voltage source! This creates a short circuit through the meter's low-impedance current path. In real life, this blows the meter fuse or causes an arc flash.", isCorrectSetting: false },
  { from: "L1", to: "L2", setting: "continuity", reading: "---", unit: "", explanation: "⚠️ WRONG SETTING! Never use continuity mode on a live circuit. The meter injects a small test current — live voltage can damage the meter.", isCorrectSetting: false },
  { from: "T1", to: "T2", setting: "amps_dc", reading: "---", unit: "", explanation: "⚠️ Ammeter must be connected in SERIES with the load, not across it. To measure motor current, clamp around a single conductor.", isCorrectSetting: false },
  { from: "CTRL", to: "NEUT", setting: "vdc", reading: "0.1", unit: "V DC", explanation: "⚠️ WRONG SETTING! Control circuit is AC. Use V AC to read 120V control voltage.", isCorrectSetting: false },
];

const METER_SETTINGS: { id: MeterSetting; label: string; symbol: string }[] = [
  { id: "vac", label: "V AC", symbol: "V~" },
  { id: "vdc", label: "V DC", symbol: "V⎓" },
  { id: "ohms", label: "Resistance", symbol: "Ω" },
  { id: "continuity", label: "Continuity", symbol: "🔊" },
  { id: "amps_dc", label: "Amps DC", symbol: "A⎓" },
];

function getMeasurement(from: string, to: string, setting: MeterSetting): MeasurementResult | null {
  // Check both directions
  return measurements.find(
    (m) => m.setting === setting && ((m.from === from && m.to === to) || (m.from === to && m.to === from))
  ) || null;
}

export default function VirtualMultimeterLab() {
  const [meterSetting, setMeterSetting] = useState<MeterSetting>("vac");
  const [probe1, setProbe1] = useState<string | null>(null);
  const [probe2, setProbe2] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<MeasurementResult | null>(null);
  const [measurementHistory, setMeasurementHistory] = useState<MeasurementResult[]>([]);

  const handleTestPointClick = (pointId: string) => {
    if (!probe1) {
      setProbe1(pointId);
      setProbe2(null);
      setLastResult(null);
    } else if (!probe2 && pointId !== probe1) {
      setProbe2(pointId);
      const result = getMeasurement(probe1, pointId, meterSetting);
      if (result) {
        setLastResult(result);
        setMeasurementHistory((prev) => [result, ...prev].slice(0, 10));
      } else {
        setLastResult({
          from: probe1,
          to: pointId,
          setting: meterSetting,
          reading: "---",
          unit: "",
          explanation: "No measurement data for this combination. Try a different pair of test points or meter setting.",
          isCorrectSetting: true,
        });
      }
    } else {
      // Reset and start new measurement
      setProbe1(pointId);
      setProbe2(null);
      setLastResult(null);
    }
  };

  const resetProbes = () => {
    setProbe1(null);
    setProbe2(null);
    setLastResult(null);
  };

  return (
    <div className="card-panel p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-heading text-white tracking-wide">Virtual Multimeter Lab</h3>
          <p className="text-xs text-[oklch(0.50_0.008_250)] mt-1">
            Select a meter setting, then click two test points to take a measurement
          </p>
        </div>
        <button
          onClick={resetProbes}
          className="px-3 py-1.5 text-xs font-mono rounded border border-[oklch(0.20_0.004_250)] text-[oklch(0.55_0.008_250)] hover:border-[oklch(0.30_0.006_250)] transition-colors"
        >
          Reset Probes
        </button>
      </div>

      {/* Meter Setting Selector */}
      <div className="mb-6 p-4 bg-[oklch(0.06_0.003_250)] rounded-lg border border-[oklch(0.14_0.004_250)]">
        <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] mb-3 uppercase tracking-wider">
          Meter Setting — Rotary Dial
        </div>
        <div className="flex flex-wrap gap-2">
          {METER_SETTINGS.map((s) => (
            <button
              key={s.id}
              onClick={() => { setMeterSetting(s.id); resetProbes(); }}
              className={`px-4 py-2.5 rounded-lg border text-xs font-mono transition-all duration-200 ${
                meterSetting === s.id
                  ? "bg-[oklch(0.20_0.06_155)] border-[oklch(0.55_0.12_155)] text-[oklch(0.75_0.12_155)] shadow-[0_0_8px_oklch(0.55_0.12_155/30%)]"
                  : "bg-[oklch(0.10_0.003_250)] border-[oklch(0.20_0.004_250)] text-[oklch(0.50_0.006_250)] hover:border-[oklch(0.30_0.006_250)]"
              }`}
            >
              <div className="text-lg mb-0.5">{s.symbol}</div>
              <div className="text-[9px]">{s.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Schematic with Test Points */}
      <div className="mb-6 relative bg-[oklch(0.04_0.003_250)] rounded-lg border border-[oklch(0.14_0.004_250)] overflow-hidden" style={{ minHeight: "320px" }}>
        {/* Schematic background labels */}
        <div className="absolute inset-0 p-4">
          {/* Title */}
          <div className="text-[10px] font-mono text-[oklch(0.30_0.006_250)] absolute top-2 left-3">
            MOTOR STARTER — 480V 3-PHASE
          </div>
          {/* Section labels */}
          <div className="text-[9px] font-mono text-[oklch(0.25_0.006_250)] absolute top-[8%] left-[5%]">
            LINE SIDE (INCOMING POWER)
          </div>
          <div className="text-[9px] font-mono text-[oklch(0.25_0.006_250)] absolute top-[40%] left-[5%]">
            CONTACTOR (OPEN)
          </div>
          <div className="text-[9px] font-mono text-[oklch(0.25_0.006_250)] absolute top-[65%] left-[5%]">
            LOAD SIDE (MOTOR)
          </div>
          <div className="text-[9px] font-mono text-[oklch(0.25_0.006_250)] absolute top-[35%] right-[5%]">
            CONTROL CIRCUIT
          </div>

          {/* Wire lines (SVG) */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Vertical wires from L to T */}
            <line x1="10" y1="20" x2="10" y2="70" stroke="oklch(0.20 0.006 250)" strokeWidth="0.3" strokeDasharray="1,1" />
            <line x1="30" y1="20" x2="30" y2="70" stroke="oklch(0.20 0.006 250)" strokeWidth="0.3" strokeDasharray="1,1" />
            <line x1="50" y1="20" x2="50" y2="70" stroke="oklch(0.20 0.006 250)" strokeWidth="0.3" strokeDasharray="1,1" />
            {/* Contactor symbol */}
            <rect x="7" y="42" width="6" height="6" rx="1" fill="none" stroke="oklch(0.25 0.006 250)" strokeWidth="0.3" />
            <rect x="27" y="42" width="6" height="6" rx="1" fill="none" stroke="oklch(0.25 0.006 250)" strokeWidth="0.3" />
            <rect x="47" y="42" width="6" height="6" rx="1" fill="none" stroke="oklch(0.25 0.006 250)" strokeWidth="0.3" />
            {/* OL connection */}
            <line x1="50" y1="55" x2="70" y2="45" stroke="oklch(0.20 0.006 250)" strokeWidth="0.3" strokeDasharray="1,1" />
            {/* Control circuit */}
            <line x1="85" y1="20" x2="85" y2="70" stroke="oklch(0.20 0.006 250)" strokeWidth="0.3" strokeDasharray="1,1" />
            {/* Ground bus */}
            <line x1="65" y1="75" x2="75" y2="75" stroke="oklch(0.30 0.12 90)" strokeWidth="0.3" />
            <line x1="66" y1="78" x2="74" y2="78" stroke="oklch(0.30 0.12 90)" strokeWidth="0.2" />
            <line x1="67" y1="81" x2="73" y2="81" stroke="oklch(0.30 0.12 90)" strokeWidth="0.15" />
          </svg>
        </div>

        {/* Test Points */}
        {testPoints.map((point) => {
          const isProbe1 = probe1 === point.id;
          const isProbe2 = probe2 === point.id;
          const isSelected = isProbe1 || isProbe2;

          return (
            <motion.button
              key={point.id}
              onClick={() => handleTestPointClick(point.id)}
              className="absolute z-10 group"
              style={{ left: `${point.x}%`, top: `${point.y}%`, transform: "translate(-50%, -50%)" }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Probe indicator */}
              <div
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-200 diag-touch-target ${
                  isProbe1
                    ? "bg-[oklch(0.65_0.15_30/30%)] border-[oklch(0.65_0.15_30)] shadow-[0_0_12px_oklch(0.65_0.15_30/50%)]"
                    : isProbe2
                    ? "bg-[oklch(0.15_0.08_250)] border-[oklch(0.55_0.12_250)] shadow-[0_0_12px_oklch(0.55_0.12_250/50%)]"
                    : `bg-[oklch(0.10_0.003_250)] border-[${point.color}] hover:shadow-[0_0_8px_${point.color}]`
                }`}
                style={{ borderColor: isSelected ? undefined : point.color }}
              >
                <span className="text-[10px] font-mono font-bold text-white">{point.id}</span>
              </div>
              {/* Label */}
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono text-[oklch(0.45_0.006_250)] group-hover:text-white transition-colors">
                {point.label}
              </div>
              {/* Probe label */}
              {isProbe1 && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-[oklch(0.65_0.15_30)]">
                  RED
                </div>
              )}
              {isProbe2 && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-[oklch(0.55_0.12_250)]">
                  BLACK
                </div>
              )}
            </motion.button>
          );
        })}

        {/* Probe status bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-[oklch(0.06_0.003_250/90%)] backdrop-blur-sm border-t border-[oklch(0.14_0.004_250)]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono">
            <span className="text-[oklch(0.45_0.006_250)]">
              RED: <span className={probe1 ? "text-[oklch(0.65_0.15_30)]" : "text-[oklch(0.35_0.006_250)]"}>{probe1 || "Click a test point"}</span>
            </span>
            <span className="text-[oklch(0.45_0.006_250)]">
              BLACK: <span className={probe2 ? "text-[oklch(0.55_0.12_250)]" : "text-[oklch(0.35_0.006_250)]"}>{probe2 || "Click second point"}</span>
            </span>
            <span className="text-[oklch(0.45_0.006_250)]">
              Setting: <span className="text-[oklch(0.55_0.12_155)]">{METER_SETTINGS.find(s => s.id === meterSetting)?.label}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Meter Display */}
      <AnimatePresence mode="wait">
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-6 p-5 rounded-lg border ${
              !lastResult.isCorrectSetting
                ? "bg-[oklch(0.10_0.04_30)] border-[oklch(0.50_0.15_30/40%)]"
                : "bg-[oklch(0.06_0.02_155)] border-[oklch(0.55_0.12_155/30%)]"
            }`}
          >
            {/* Digital display */}
            <div className="text-center mb-4">
              <div className="inline-block px-8 py-4 bg-[oklch(0.04_0.003_250)] rounded-lg border border-[oklch(0.14_0.004_250)]">
                <div className="text-[10px] font-mono text-[oklch(0.40_0.006_250)] mb-1">
                  {lastResult.from} → {lastResult.to} [{METER_SETTINGS.find(s => s.id === lastResult.setting)?.label}]
                </div>
                <div className={`text-3xl font-mono font-bold ${
                  !lastResult.isCorrectSetting
                    ? "text-[oklch(0.65_0.15_30)]"
                    : lastResult.reading === "BEEP"
                    ? "text-[oklch(0.55_0.12_155)]"
                    : "text-white"
                }`}>
                  {lastResult.reading}
                  {lastResult.unit && <span className="text-lg ml-1 text-[oklch(0.50_0.008_250)]">{lastResult.unit}</span>}
                </div>
              </div>
            </div>
            {/* Explanation */}
            <p className={`text-xs leading-relaxed ${
              !lastResult.isCorrectSetting ? "text-[oklch(0.65_0.12_30)]" : "text-[oklch(0.60_0.008_250)]"
            }`}>
              {lastResult.explanation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Measurement History */}
      {measurementHistory.length > 0 && (
        <div className="p-4 bg-[oklch(0.06_0.003_250)] rounded-lg border border-[oklch(0.14_0.004_250)]">
          <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] mb-3 uppercase tracking-wider">
            Measurement Log
          </div>
          <div className="space-y-1">
            {measurementHistory.map((m, i) => (
              <div key={i} className={`flex items-center gap-3 text-[10px] font-mono py-1 ${
                !m.isCorrectSetting ? "text-[oklch(0.55_0.12_30)]" : "text-[oklch(0.50_0.008_250)]"
              }`}>
                <span className="w-16">{m.from}→{m.to}</span>
                <span className="w-12 text-[oklch(0.45_0.006_250)]">{METER_SETTINGS.find(s => s.id === m.setting)?.label}</span>
                <span className={`font-bold ${!m.isCorrectSetting ? "text-[oklch(0.55_0.12_30)]" : "text-white"}`}>
                  {m.reading} {m.unit}
                </span>
                {!m.isCorrectSetting && <span className="text-[oklch(0.55_0.12_30)]">⚠️</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 bg-[oklch(0.06_0.003_250)] rounded-lg border border-[oklch(0.14_0.004_250)]">
        <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] mb-2 uppercase tracking-wider">
          Quick Reference
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-[oklch(0.50_0.008_250)]">
          <div>• <strong className="text-white">V AC</strong> — Measure live AC voltage between two points</div>
          <div>• <strong className="text-white">V DC</strong> — Measure DC voltage (batteries, power supplies)</div>
          <div>• <strong className="text-white">Ω Ohms</strong> — Measure resistance (POWER OFF only!)</div>
          <div>• <strong className="text-white">Continuity</strong> — Check if a path exists (POWER OFF only!)</div>
          <div>• <strong className="text-white">Amps</strong> — Must be in SERIES, never across a source</div>
          <div>• <strong className="text-[oklch(0.55_0.12_30)]">Red = danger</strong> — Wrong setting warnings teach safety</div>
        </div>
      </div>
    </div>
  );
}
