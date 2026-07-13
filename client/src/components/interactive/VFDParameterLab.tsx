/**
 * VFDParameterLab — Interactive VFD parameter configuration simulator
 * Navigate a simulated PowerFlex parameter tree, configure a basic motor application.
 * Teaches parameter groups, motor nameplate entry, and common configuration mistakes.
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Parameter {
  number: string;
  name: string;
  group: string;
  value: number | string;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: number | string; label: string }[];
  description: string;
  tip: string;
  isCorrect: (val: number | string) => boolean;
  correctValue: string;
}

interface ParameterGroup {
  id: string;
  label: string;
  icon: string;
  description: string;
}

const GROUPS: ParameterGroup[] = [
  { id: "motor", label: "Motor Data", icon: "⚡", description: "Motor nameplate parameters" },
  { id: "speed", label: "Speed Reference", icon: "🔄", description: "Speed control settings" },
  { id: "accel", label: "Accel/Decel", icon: "📈", description: "Ramp time configuration" },
  { id: "protection", label: "Protection", icon: "🛡️", description: "Motor protection settings" },
  { id: "io", label: "Digital I/O", icon: "🔌", description: "Input/output configuration" },
  { id: "comm", label: "Communication", icon: "📡", description: "Network settings" },
];

// Target: Configure a 5HP 480V 3-phase motor at 60Hz, 7.6 FLA
const PARAMETERS: Parameter[] = [
  // Motor Data
  {
    number: "P041",
    name: "Motor NP Volts",
    group: "motor",
    value: 0,
    unit: "V",
    min: 0,
    max: 600,
    step: 1,
    description: "Motor nameplate voltage. Must match the motor nameplate exactly.",
    tip: "For a 480V motor on a 480V supply, enter 460V (nameplate rating, not supply voltage).",
    isCorrect: (v) => v === 460,
    correctValue: "460",
  },
  {
    number: "P042",
    name: "Motor NP FLA",
    group: "motor",
    value: 0,
    unit: "A",
    min: 0,
    max: 50,
    step: 0.1,
    description: "Motor nameplate full load amps. Used for thermal overload protection.",
    tip: "A 5HP 460V motor typically draws 7.6A FLA. Always use the nameplate value.",
    isCorrect: (v) => v === 7.6,
    correctValue: "7.6",
  },
  {
    number: "P043",
    name: "Motor NP Hz",
    group: "motor",
    value: 0,
    unit: "Hz",
    min: 0,
    max: 400,
    step: 1,
    description: "Motor nameplate frequency. Determines the base speed of the motor.",
    tip: "Standard US motors are 60Hz. European motors are 50Hz.",
    isCorrect: (v) => v === 60,
    correctValue: "60",
  },
  {
    number: "P044",
    name: "Motor NP RPM",
    group: "motor",
    value: 0,
    unit: "RPM",
    min: 0,
    max: 5000,
    step: 1,
    description: "Motor nameplate speed. Used to calculate slip compensation.",
    tip: "A 4-pole motor at 60Hz has a synchronous speed of 1800 RPM. Nameplate is typically 1750-1770 RPM.",
    isCorrect: (v) => Number(v) >= 1740 && Number(v) <= 1780,
    correctValue: "1760",
  },
  {
    number: "P045",
    name: "Motor NP Power",
    group: "motor",
    value: 0,
    unit: "HP",
    min: 0,
    max: 100,
    step: 0.5,
    description: "Motor nameplate horsepower rating.",
    tip: "Enter the HP from the motor nameplate. This drive is rated for 5HP.",
    isCorrect: (v) => v === 5,
    correctValue: "5",
  },
  // Speed Reference
  {
    number: "P046",
    name: "Speed Reference",
    group: "speed",
    value: 0,
    unit: "",
    options: [
      { value: 0, label: "0 - Keypad" },
      { value: 1, label: "1 - Analog Input (4-20mA)" },
      { value: 2, label: "2 - Preset Speeds" },
      { value: 4, label: "4 - Network (EtherNet/IP)" },
    ],
    description: "Selects the source for the speed command.",
    tip: "For a conveyor controlled by analog signal from PLC, select '1 - Analog Input'.",
    isCorrect: (v) => v === 1,
    correctValue: "1 - Analog Input",
  },
  {
    number: "P047",
    name: "Maximum Speed",
    group: "speed",
    value: 0,
    unit: "Hz",
    min: 0,
    max: 130,
    step: 1,
    description: "Maximum output frequency. Limits the top speed of the motor.",
    tip: "For most applications, set to 60Hz (base speed). Going above 60Hz enters the field weakening region.",
    isCorrect: (v) => v === 60,
    correctValue: "60",
  },
  {
    number: "P048",
    name: "Minimum Speed",
    group: "speed",
    value: 0,
    unit: "Hz",
    min: 0,
    max: 60,
    step: 1,
    description: "Minimum output frequency. Motor won't run below this speed.",
    tip: "Set to 0Hz for full range, or 5-10Hz if the motor needs minimum cooling airflow.",
    isCorrect: (v) => Number(v) >= 0 && Number(v) <= 10,
    correctValue: "0-10",
  },
  // Accel/Decel
  {
    number: "P049",
    name: "Accel Time 1",
    group: "accel",
    value: 0,
    unit: "sec",
    min: 0,
    max: 600,
    step: 0.1,
    description: "Time to ramp from 0 to maximum speed. Too fast causes overcurrent trips.",
    tip: "For a conveyor with moderate inertia, 10-15 seconds is typical. Factory default of 10s is often fine.",
    isCorrect: (v) => Number(v) >= 8 && Number(v) <= 20,
    correctValue: "10-15",
  },
  {
    number: "P050",
    name: "Decel Time 1",
    group: "accel",
    value: 0,
    unit: "sec",
    min: 0,
    max: 600,
    step: 0.1,
    description: "Time to ramp from maximum speed to 0. Too fast causes overvoltage trips.",
    tip: "Should be equal to or longer than accel time. 10-15 seconds for a conveyor.",
    isCorrect: (v) => Number(v) >= 8 && Number(v) <= 20,
    correctValue: "10-15",
  },
  // Protection
  {
    number: "P051",
    name: "Motor OL Mode",
    group: "protection",
    value: 0,
    unit: "",
    options: [
      { value: 0, label: "0 - Disabled" },
      { value: 1, label: "1 - Fault on OL" },
      { value: 2, label: "2 - Warning on OL" },
      { value: 3, label: "3 - Fault + Auto Reset" },
    ],
    description: "Motor overload protection mode. Uses I²t thermal model based on Motor NP FLA.",
    tip: "Always enable overload protection (option 1). Disabling it removes thermal protection from the motor.",
    isCorrect: (v) => v === 1,
    correctValue: "1 - Fault on OL",
  },
  {
    number: "P052",
    name: "Stall Fault",
    group: "protection",
    value: 0,
    unit: "",
    options: [
      { value: 0, label: "0 - Disabled" },
      { value: 1, label: "1 - Fault on Stall" },
      { value: 2, label: "2 - Warning on Stall" },
    ],
    description: "Detects motor stall condition (high current, low speed).",
    tip: "Enable for conveyors where product jams are possible. Protects the motor from overheating.",
    isCorrect: (v) => v === 1,
    correctValue: "1 - Fault on Stall",
  },
  // Digital I/O
  {
    number: "P053",
    name: "Digital In 1 Func",
    group: "io",
    value: 0,
    unit: "",
    options: [
      { value: 0, label: "0 - Not Used" },
      { value: 1, label: "1 - Start/Stop" },
      { value: 2, label: "2 - Run Forward" },
      { value: 3, label: "3 - Run Reverse" },
      { value: 7, label: "7 - Fault Reset" },
    ],
    description: "Function assigned to digital input terminal 1.",
    tip: "For 2-wire control from PLC, set DI1 to 'Run Forward'. The PLC output energizes to run.",
    isCorrect: (v) => v === 2,
    correctValue: "2 - Run Forward",
  },
  {
    number: "P054",
    name: "Digital In 2 Func",
    group: "io",
    value: 0,
    unit: "",
    options: [
      { value: 0, label: "0 - Not Used" },
      { value: 1, label: "1 - Start/Stop" },
      { value: 7, label: "7 - Fault Reset" },
      { value: 8, label: "8 - Speed Select 1" },
      { value: 11, label: "11 - External Fault" },
    ],
    description: "Function assigned to digital input terminal 2.",
    tip: "Assign to 'Fault Reset' so the PLC can remotely clear drive faults.",
    isCorrect: (v) => v === 7,
    correctValue: "7 - Fault Reset",
  },
  // Communication
  {
    number: "P055",
    name: "Comm Format",
    group: "comm",
    value: 0,
    unit: "",
    options: [
      { value: 0, label: "0 - None" },
      { value: 1, label: "1 - EtherNet/IP" },
      { value: 2, label: "2 - DeviceNet" },
      { value: 3, label: "3 - Modbus RTU" },
    ],
    description: "Communication protocol for network control.",
    tip: "EtherNet/IP is the standard for Allen-Bradley PLCs. DeviceNet is legacy.",
    isCorrect: (v) => v === 1,
    correctValue: "1 - EtherNet/IP",
  },
];

export default function VFDParameterLab() {
  const [activeGroup, setActiveGroup] = useState("motor");
  const [paramValues, setParamValues] = useState<Record<string, number | string>>(() => {
    const initial: Record<string, number | string> = {};
    PARAMETERS.forEach((p) => { initial[p.number] = p.value; });
    return initial;
  });
  const [submitted, setSubmitted] = useState(false);
  const [showTips, setShowTips] = useState(true);

  const groupParams = useMemo(
    () => PARAMETERS.filter((p) => p.group === activeGroup),
    [activeGroup]
  );

  const updateParam = (paramNum: string, value: number | string) => {
    setParamValues((prev) => ({ ...prev, [paramNum]: value }));
    setSubmitted(false);
  };

  const score = useMemo(() => {
    if (!submitted) return null;
    let correct = 0;
    PARAMETERS.forEach((p) => {
      if (p.isCorrect(paramValues[p.number])) correct++;
    });
    return { correct, total: PARAMETERS.length, pct: Math.round((correct / PARAMETERS.length) * 100) };
  }, [submitted, paramValues]);

  const resetAll = () => {
    const initial: Record<string, number | string> = {};
    PARAMETERS.forEach((p) => { initial[p.number] = p.value; });
    setParamValues(initial);
    setSubmitted(false);
  };

  return (
    <div className="card-panel p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-heading text-white tracking-wide">VFD Parameter Configuration</h3>
          <p className="text-xs text-[oklch(0.50_0.008_250)] mt-1">
            Configure a PowerFlex 525 for a 5HP 460V conveyor motor controlled by PLC analog output
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTips(!showTips)}
            className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
              showTips
                ? "border-[oklch(0.55_0.12_155)] text-[oklch(0.55_0.12_155)]"
                : "border-[oklch(0.20_0.004_250)] text-[oklch(0.45_0.006_250)]"
            }`}
          >
            {showTips ? "Tips ON" : "Tips OFF"}
          </button>
          <button
            onClick={resetAll}
            className="px-3 py-1.5 text-xs font-mono rounded border border-[oklch(0.20_0.004_250)] text-[oklch(0.55_0.008_250)] hover:border-[oklch(0.30_0.006_250)] transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Task Brief */}
      <div className="mb-6 p-4 bg-[oklch(0.06_0.02_250)] rounded-lg border border-[oklch(0.20_0.04_250)]">
        <div className="text-[10px] font-mono text-[oklch(0.55_0.12_250)] mb-2 uppercase tracking-wider">
          Work Order
        </div>
        <p className="text-xs text-[oklch(0.60_0.008_250)] leading-relaxed">
          Configure the PowerFlex 525 VFD on Conveyor C-12. Motor nameplate: <strong className="text-white">5HP, 460V, 60Hz, 1760 RPM, 7.6 FLA</strong>. 
          Speed controlled by <strong className="text-white">4-20mA analog signal</strong> from CompactLogix PLC. 
          Digital inputs: <strong className="text-white">DI1 = Run Forward, DI2 = Fault Reset</strong>. 
          Communication via <strong className="text-white">EtherNet/IP</strong>. Enable motor overload and stall protection.
        </p>
      </div>

      {/* Parameter Group Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto pb-2">
        {GROUPS.map((g) => {
          const groupCorrect = submitted
            ? PARAMETERS.filter((p) => p.group === g.id && p.isCorrect(paramValues[p.number])).length
            : null;
          const groupTotal = PARAMETERS.filter((p) => p.group === g.id).length;

          return (
            <button
              key={g.id}
              onClick={() => setActiveGroup(g.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                activeGroup === g.id
                  ? "bg-[oklch(0.55_0.12_155/15%)] text-[oklch(0.75_0.12_155)] border border-[oklch(0.55_0.12_155/30%)]"
                  : "text-[oklch(0.50_0.008_250)] hover:text-white hover:bg-[oklch(0.12_0.003_250)] border border-transparent"
              }`}
            >
              <span>{g.icon}</span>
              <span>{g.label}</span>
              {submitted && groupCorrect !== null && (
                <span className={`text-[9px] ml-1 ${
                  groupCorrect === groupTotal ? "text-[oklch(0.55_0.12_155)]" : "text-[oklch(0.55_0.15_30)]"
                }`}>
                  {groupCorrect}/{groupTotal}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Parameters */}
      <div className="space-y-3 mb-6">
        {groupParams.map((param) => {
          const currentVal = paramValues[param.number];
          const isCorrectVal = submitted && param.isCorrect(currentVal);
          const isWrongVal = submitted && !param.isCorrect(currentVal);

          return (
            <div
              key={param.number}
              className={`p-4 rounded-lg border transition-all ${
                isCorrectVal
                  ? "bg-[oklch(0.08_0.02_155)] border-[oklch(0.55_0.12_155/30%)]"
                  : isWrongVal
                  ? "bg-[oklch(0.08_0.02_30)] border-[oklch(0.50_0.15_30/30%)]"
                  : "bg-[oklch(0.06_0.003_250)] border-[oklch(0.14_0.004_250)]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-[oklch(0.55_0.12_155)] font-bold">{param.number}</span>
                    <span className="text-xs font-medium text-white">{param.name}</span>
                    {param.unit && <span className="text-[10px] text-[oklch(0.45_0.006_250)]">({param.unit})</span>}
                    {isCorrectVal && <span className="text-[10px] text-[oklch(0.55_0.12_155)]">✓ Correct</span>}
                    {isWrongVal && <span className="text-[10px] text-[oklch(0.55_0.15_30)]">✗ Expected: {param.correctValue}</span>}
                  </div>
                  <p className="text-[10px] text-[oklch(0.45_0.006_250)] mb-2">{param.description}</p>
                  {showTips && (
                    <p className="text-[10px] text-[oklch(0.55_0.10_200)] italic">💡 {param.tip}</p>
                  )}
                </div>

                {/* Input */}
                <div className="w-48 shrink-0">
                  {param.options ? (
                    <select
                      value={currentVal}
                      onChange={(e) => updateParam(param.number, Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[oklch(0.10_0.003_250)] border border-[oklch(0.20_0.004_250)] rounded text-xs font-mono text-white focus:border-[oklch(0.55_0.12_155)] focus:outline-none"
                    >
                      {param.options.map((opt) => (
                        <option key={String(opt.value)} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      value={currentVal}
                      onChange={(e) => updateParam(param.number, Number(e.target.value))}
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      className="w-full px-3 py-2 bg-[oklch(0.10_0.003_250)] border border-[oklch(0.20_0.004_250)] rounded text-xs font-mono text-white focus:border-[oklch(0.55_0.12_155)] focus:outline-none text-right"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit / Score */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSubmitted(true);
              // Calculate score immediately for toast feedback
              let correct = 0;
              PARAMETERS.forEach((p) => {
                if (p.isCorrect(paramValues[p.number])) correct++;
              });
              const pct = Math.round((correct / PARAMETERS.length) * 100);
              if (pct === 100) {
                toast.success("Perfect configuration! All parameters correct.", { description: "Drive is ready for commissioning." });
              } else if (pct >= 80) {
                toast.warning(`${correct}/${PARAMETERS.length} parameters correct (${pct}%)`, { description: "Close! Review the highlighted parameters." });
              } else {
                toast.error(`${correct}/${PARAMETERS.length} parameters correct (${pct}%)`, { description: "Review the work order and check each parameter." });
              }
            }}
            className="px-6 py-3 bg-[oklch(0.55_0.12_155)] text-white text-sm font-semibold rounded-lg hover:bg-[oklch(0.50_0.12_155)] transition-colors shadow-lg shadow-[oklch(0.55_0.12_155/20%)]">
            Submit Configuration
          </button>
          {submitted && (
            <button
              onClick={resetAll}
              className="px-4 py-3 bg-[oklch(0.12_0.003_250)] border border-[oklch(0.20_0.004_250)] text-[oklch(0.65_0.008_250)] text-sm rounded-lg hover:bg-[oklch(0.15_0.003_250)] transition-colors"
            >
              Reset & Try Again
            </button>
          )}
        </div>

        {/* Full-width results banner — clearly visible on all screen sizes */}
        <AnimatePresence>
          {score && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className={`w-full rounded-xl border p-5 ${
                score.pct === 100
                  ? "bg-[oklch(0.08_0.03_155)] border-[oklch(0.55_0.12_155/40%)]"
                  : score.pct >= 80
                  ? "bg-[oklch(0.08_0.02_80)] border-[oklch(0.60_0.12_80/40%)]"
                  : "bg-[oklch(0.08_0.02_30)] border-[oklch(0.50_0.15_30/40%)]"
              }`}
            >
              <div className="flex items-center gap-4 mb-3">
                <div className={`text-3xl font-mono font-bold ${
                  score.pct === 100 ? "text-[oklch(0.65_0.15_155)]" :
                  score.pct >= 80 ? "text-[oklch(0.65_0.12_80)]" :
                  "text-[oklch(0.60_0.15_30)]"
                }`}>
                  {score.pct}%
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    {score.correct}/{score.total} parameters configured correctly
                  </div>
                  <div className={`text-xs mt-0.5 ${
                    score.pct === 100 ? "text-[oklch(0.55_0.12_155)]" :
                    score.pct >= 80 ? "text-[oklch(0.60_0.10_80)]" :
                    "text-[oklch(0.55_0.12_30)]"
                  }`}>
                    {score.pct === 100 && "🏆 Perfect! Drive is ready for commissioning."}
                    {score.pct < 100 && score.pct >= 80 && "Close! Review the red-highlighted parameters above and try again."}
                    {score.pct < 80 && "Review the work order carefully. Incorrect parameters are highlighted in red above."}
                  </div>
                </div>
              </div>

              {/* Per-group breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-[oklch(0.20_0.004_250)]">
                {GROUPS.map((group) => {
                  const groupP = PARAMETERS.filter(p => p.group === group.id);
                  const groupCorrect = groupP.filter(p => p.isCorrect(paramValues[p.number])).length;
                  const allCorrect = groupCorrect === groupP.length;
                  return (
                    <div key={group.id} className={`text-[10px] font-mono px-2 py-1.5 rounded ${
                      allCorrect ? "bg-[oklch(0.12_0.02_155)] text-[oklch(0.65_0.12_155)]" : "bg-[oklch(0.10_0.01_30)] text-[oklch(0.60_0.12_30)]"
                    }`}>
                      {group.icon} {group.label}: {groupCorrect}/{groupP.length}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
