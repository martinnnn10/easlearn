/**
 * VFD Sandbox / Lab Mode
 * 
 * Dedicated experimentation environment where users can:
 * - Adjust frequency/speed with sliders
 * - Control acceleration/deceleration ramps
 * - Inject faults and see live system response
 * - Watch telemetry values change in real-time
 * - See motor speed, DC bus voltage, current, and system status react
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { 
  Zap, AlertTriangle, RotateCcw, Activity, Gauge, Thermometer, 
  Wind, Power, CircleSlash, Play, Pause, Volume2, VolumeX, Lock, ArrowRight
} from "lucide-react";
import SEO from "@/components/SEO";
import { ambientAudio } from "@/components/AmbientAudio";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

// === SYSTEM STATE MODEL ===

interface SystemState {
  running: boolean;
  targetFrequency: number;    // Hz (0-60)
  actualFrequency: number;    // Hz (ramps toward target)
  dcBusVoltage: number;       // V DC
  outputVoltage: number;      // V AC
  motorCurrent: number;       // A
  motorRPM: number;           // RPM
  motorTemp: number;          // °C
  heatsinkTemp: number;       // °C
  loadPercent: number;        // %
  accelTime: number;          // seconds
  decelTime: number;          // seconds
  activeFaults: string[];
  eventLog: string[];
  tripped: boolean;
}

interface FaultDefinition {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  effect: (state: SystemState) => Partial<SystemState>;
}

const FAULTS: FaultDefinition[] = [
  {
    id: "phase_loss",
    label: "Phase Loss",
    icon: "⚡",
    color: "#ef4444",
    description: "Lose one input phase — DC bus drops, ripple increases",
    effect: (state) => ({
      dcBusVoltage: state.dcBusVoltage * 0.82,
      motorCurrent: state.motorCurrent * 1.3,
      eventLog: [...state.eventLog, `[FAULT] Input phase loss detected — DC bus dropping`],
    }),
  },
  {
    id: "overvoltage",
    label: "Bus Overvoltage",
    icon: "📈",
    color: "#f59e0b",
    description: "Rapid decel causes regeneration — bus voltage spikes",
    effect: (state) => ({
      dcBusVoltage: 835,
      tripped: true,
      running: false,
      eventLog: [...state.eventLog, `[TRIP] F05 DC Bus Overvoltage — 835V exceeds 820V limit`],
    }),
  },
  {
    id: "ground_fault",
    label: "Ground Fault",
    icon: "🔌",
    color: "#a855f7",
    description: "Motor winding insulation breakdown to frame",
    effect: (state) => ({
      motorCurrent: state.motorCurrent * 2.5,
      tripped: true,
      running: false,
      eventLog: [...state.eventLog, `[TRIP] F06 Ground Fault — Current imbalance >50% detected`],
    }),
  },
  {
    id: "overload",
    label: "Motor Overload",
    icon: "🏋️",
    color: "#f97316",
    description: "Excessive mechanical load — current rises, motor heats",
    effect: (state) => ({
      motorCurrent: state.motorCurrent * 1.8,
      motorTemp: state.motorTemp + 25,
      loadPercent: 150,
      eventLog: [...state.eventLog, `[WARN] Motor overload — current at 180% FLA, thermal accumulating`],
    }),
  },
  {
    id: "capacitor_aging",
    label: "Capacitor Aging",
    icon: "🔋",
    color: "#6366f1",
    description: "DC bus caps degraded — ripple increases, sags under load",
    effect: (state) => ({
      dcBusVoltage: state.dcBusVoltage - 80,
      eventLog: [...state.eventLog, `[WARN] DC bus ripple excessive — capacitor ESR elevated`],
    }),
  },
  {
    id: "cooling_fan",
    label: "Fan Failure",
    icon: "🌡️",
    color: "#ec4899",
    description: "Heatsink cooling fan stops — temperature rises",
    effect: (state) => ({
      heatsinkTemp: state.heatsinkTemp + 35,
      eventLog: [...state.eventLog, `[ALARM] Cooling fan failure — heatsink temp rising rapidly`],
    }),
  },
];

// === HELPER FUNCTIONS ===

function calculateMotorRPM(frequency: number, poles: number = 4): number {
  if (frequency === 0) return 0;
  const syncSpeed = (120 * frequency) / poles;
  const slip = 0.03; // 3% slip at load
  return Math.round(syncSpeed * (1 - slip));
}

function calculateOutputVoltage(frequency: number, baseVoltage: number = 480): number {
  // V/Hz ratio: voltage proportional to frequency up to base speed
  return Math.round((frequency / 60) * baseVoltage);
}

function calculateMotorCurrent(frequency: number, loadPercent: number, fla: number = 15): number {
  if (frequency === 0) return 0;
  const loadFactor = loadPercent / 100;
  const freqFactor = Math.max(0.3, frequency / 60); // Minimum magnetizing current
  return +(fla * loadFactor * freqFactor).toFixed(1);
}

// === MAIN COMPONENT ===

export default function VFDSandbox() {
  const { isAuthenticated } = useAuth();
  const { hasAccess, isLoading: subLoading } = useSubscription();

  // Gate: VFD Sandbox requires paid subscription
  if (!subLoading && isAuthenticated && !hasAccess) {
    return (
      <div>
        <SEO title="VFD Sandbox" description="Interactive VFD experimentation environment" path="/vfd-sandbox" />
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-14 h-14 rounded-2xl bg-[oklch(0.55_0.12_155/8%)] border border-[oklch(0.55_0.12_155/20%)] flex items-center justify-center mx-auto mb-5">
              <Lock className="w-7 h-7 text-[oklch(0.55_0.12_155)]" />
            </div>
            <h2 className="text-2xl font-heading text-white mb-3">Subscribe to Unlock</h2>
            <p className="text-[oklch(0.55_0.008_250)] mb-6 leading-relaxed">
              The VFD Sandbox is a premium interactive lab. Subscribe to experiment with variable frequency drives, inject faults, and see live system response.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 btn-primary font-semibold rounded-lg shadow-lg shadow-[oklch(0.55_0.12_155/15%)]"
              >
                <Zap className="w-4 h-4" />
                View Plans
              </Link>
              <Link
                href="/labs"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-[oklch(0.60_0.005_250)] border border-[oklch(0.20_0.004_250)] rounded-lg hover:border-[oklch(0.30_0.004_250)] transition-colors"
              >
                Try Free Labs
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [state, setState] = useState<SystemState>({
    running: false,
    targetFrequency: 60,
    actualFrequency: 0,
    dcBusVoltage: 678,
    outputVoltage: 0,
    motorCurrent: 0,
    motorRPM: 0,
    motorTemp: 35,
    heatsinkTemp: 42,
    loadPercent: 75,
    accelTime: 10,
    decelTime: 8,
    activeFaults: [],
    eventLog: ["[SYS] VFD Sandbox initialized — ready for operation"],
    tripped: false,
  });

  const [soundEnabled, setSoundEnabled] = useState(false);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(Date.now());
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll event log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.eventLog.length]);

  // Physics simulation loop
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const dt = (now - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = now;

      setState(prev => {
        if (prev.tripped) return prev;

        let { actualFrequency, targetFrequency, running, accelTime, decelTime } = prev;
        const target = running ? targetFrequency : 0;
        
        // Ramp frequency toward target
        if (actualFrequency < target) {
          const rampRate = targetFrequency / accelTime;
          actualFrequency = Math.min(target, actualFrequency + rampRate * dt);
        } else if (actualFrequency > target) {
          const rampRate = targetFrequency / decelTime;
          actualFrequency = Math.max(target, actualFrequency - rampRate * dt);
        }

        // Calculate derived values
        const motorRPM = calculateMotorRPM(actualFrequency);
        const outputVoltage = calculateOutputVoltage(actualFrequency);
        const motorCurrent = calculateMotorCurrent(actualFrequency, prev.loadPercent);
        
        // Temperature drift
        const motorTemp = running 
          ? Math.min(120, prev.motorTemp + (prev.loadPercent > 100 ? 0.05 : 0.002) * dt)
          : Math.max(25, prev.motorTemp - 0.01 * dt);
        const heatsinkTemp = running
          ? Math.min(95, prev.heatsinkTemp + (prev.activeFaults.includes("cooling_fan") ? 0.08 : 0.003) * dt)
          : Math.max(25, prev.heatsinkTemp - 0.015 * dt);

        // DC bus voltage (affected by faults)
        let dcBusVoltage = prev.dcBusVoltage;
        if (!prev.activeFaults.includes("phase_loss") && !prev.activeFaults.includes("capacitor_aging")) {
          dcBusVoltage = 678; // Normal
        }

        // Trip conditions
        let tripped = false;
        const newEvents: string[] = [];
        if (heatsinkTemp > 90 && !prev.tripped) {
          tripped = true;
          newEvents.push("[TRIP] F07 Heatsink Overtemperature — 90°C exceeded");
        }
        if (motorTemp > 110 && !prev.tripped) {
          tripped = true;
          newEvents.push("[TRIP] Motor thermal overload — winding temp >110°C");
        }

        return {
          ...prev,
          actualFrequency,
          motorRPM,
          outputVoltage,
          motorCurrent,
          motorTemp,
          heatsinkTemp,
          dcBusVoltage,
          tripped,
          running: tripped ? false : prev.running,
          eventLog: newEvents.length > 0 ? [...prev.eventLog, ...newEvents] : prev.eventLog,
        };
      });

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const handleStart = useCallback(() => {
    if (soundEnabled) {
      ambientAudio.enable();
      ambientAudio.startVFDHum(state.targetFrequency);
      ambientAudio.playMotorStartup(state.accelTime);
      ambientAudio.startAmbient();
    }
    setState(prev => ({
      ...prev,
      running: true,
      eventLog: [...prev.eventLog, `[CMD] RUN command — accelerating to ${prev.targetFrequency}Hz`],
    }));
  }, [soundEnabled, state.targetFrequency, state.accelTime]);

  const handleStop = useCallback(() => {
    if (soundEnabled) {
      ambientAudio.playCoastDown(state.decelTime);
      ambientAudio.stopVFDHum();
      ambientAudio.stopAmbient();
    }
    setState(prev => ({
      ...prev,
      running: false,
      eventLog: [...prev.eventLog, `[CMD] STOP command — decelerating to 0Hz`],
    }));
  }, [soundEnabled, state.decelTime]);

  const handleReset = useCallback(() => {
    setState(prev => ({
      ...prev,
      running: false,
      tripped: false,
      actualFrequency: 0,
      dcBusVoltage: 678,
      motorCurrent: 0,
      motorRPM: 0,
      motorTemp: 35,
      heatsinkTemp: 42,
      loadPercent: 75,
      activeFaults: [],
      eventLog: [...prev.eventLog, "[CMD] FAULT RESET — drive cleared, ready for operation"],
    }));
  }, []);

  const handleInjectFault = useCallback((fault: FaultDefinition) => {
    if (soundEnabled) {
      ambientAudio.playAlarm();
    }
    setState(prev => {
      if (prev.activeFaults.includes(fault.id)) return prev;
      const effects = fault.effect(prev);
      return {
        ...prev,
        ...effects,
        activeFaults: [...prev.activeFaults, fault.id],
        eventLog: effects.eventLog || prev.eventLog,
      };
    });
  }, [soundEnabled]);

  const handleClearFaults = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeFaults: [],
      dcBusVoltage: 678,
      loadPercent: 75,
      eventLog: [...prev.eventLog, "[CMD] All faults cleared — system nominal"],
    }));
  }, []);

  // Telemetry gauge helper
  const TelemetryGauge = ({ label, value, unit, min, max, warning, danger, icon: Icon }: {
    label: string; value: number; unit: string; min: number; max: number; 
    warning: number; danger: number; icon: any;
  }) => {
    const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
    const isDanger = value >= danger;
    const isWarning = value >= warning;
    const color = isDanger ? "#ef4444" : isWarning ? "#f59e0b" : "#22c55e";

    return (
      <div className="bg-black/40 rounded-lg border border-zinc-800 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-3.5 h-3.5" style={{ color }} />
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">{label}</span>
        </div>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-xl font-bold font-mono" style={{ color }}>
            {typeof value === "number" ? value.toFixed(value < 10 ? 1 : 0) : value}
          </span>
          <span className="text-[10px] text-zinc-500">{unit}</span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[oklch(0.08_0.003_250)] pt-20 pb-12">
      <SEO title="VFD Sandbox Lab | EAS Platform" description="Interactive VFD experimentation environment" />
      
      <div className="container max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
              VFD Sandbox Lab
            </h1>
            <p className="text-sm text-zinc-500 mt-1 ml-[52px]">Experiment with drive parameters and inject faults to see real-time system response</p>
          </div>
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) { ambientAudio.enable(); } else { ambientAudio.disable(); }
            }}
            className="p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* LEFT: Controls */}
          <div className="space-y-4">
            {/* Run/Stop Controls */}
            <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Drive Control</h3>
              <div className="flex gap-2 mb-4">
                {!state.running && !state.tripped && (
                  <button
                    onClick={handleStart}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors"
                  >
                    <Play className="w-4 h-4" /> RUN
                  </button>
                )}
                {state.running && (
                  <button
                    onClick={handleStop}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors"
                  >
                    <Pause className="w-4 h-4" /> STOP
                  </button>
                )}
                {state.tripped && (
                  <button
                    onClick={handleReset}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" /> RESET
                  </button>
                )}
              </div>

              {/* Status indicator */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${
                state.tripped ? "bg-red-950/30 border-red-500/30 text-red-400" :
                state.running ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-400" :
                "bg-zinc-800/50 border-zinc-700/50 text-zinc-400"
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  state.tripped ? "bg-red-500 animate-pulse" :
                  state.running ? "bg-emerald-500" :
                  "bg-zinc-600"
                }`} />
                {state.tripped ? "FAULTED" : state.running ? "RUNNING" : "STOPPED"}
              </div>
            </div>

            {/* Frequency Control */}
            <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Speed Reference</h3>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-zinc-500">Target Frequency</span>
                  <span className="text-sm font-mono font-bold text-white">{state.targetFrequency} Hz</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="1"
                  value={state.targetFrequency}
                  onChange={(e) => setState(prev => ({ ...prev, targetFrequency: +e.target.value }))}
                  className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[9px] text-zinc-600 mt-1">
                  <span>0 Hz</span>
                  <span>30 Hz</span>
                  <span>60 Hz</span>
                  <span>90 Hz</span>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-zinc-500">Accel Time</span>
                  <span className="text-xs font-mono text-zinc-300">{state.accelTime}s</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={state.accelTime}
                  onChange={(e) => setState(prev => ({ ...prev, accelTime: +e.target.value }))}
                  className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-zinc-500">Decel Time</span>
                  <span className="text-xs font-mono text-zinc-300">{state.decelTime}s</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={state.decelTime}
                  onChange={(e) => setState(prev => ({ ...prev, decelTime: +e.target.value }))}
                  className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            {/* Load Control */}
            <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Mechanical Load</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-zinc-500">Load Percent</span>
                <span className="text-sm font-mono font-bold text-white">{state.loadPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="5"
                value={state.loadPercent}
                onChange={(e) => setState(prev => ({ ...prev, loadPercent: +e.target.value }))}
                className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[9px] text-zinc-600 mt-1">
                <span>No Load</span>
                <span>100% FLA</span>
                <span>200%</span>
              </div>
            </div>
          </div>

          {/* CENTER: Visualization + Telemetry */}
          <div className="space-y-4">
            {/* Motor Visualization */}
            <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-5">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Motor Output</h3>
              <div className="flex items-center justify-center py-6">
                <div className="relative">
                  {/* Motor body */}
                  <motion.div
                    animate={{ rotate: state.running && !state.tripped ? 360 : 0 }}
                    transition={{ 
                      duration: state.actualFrequency > 0 ? 60 / state.actualFrequency : 100, 
                      repeat: Infinity, 
                      ease: "linear" 
                    }}
                    className="w-32 h-32 relative"
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {/* Outer ring */}
                      <circle cx="50" cy="50" r="45" fill="none" stroke={state.tripped ? "#ef4444" : state.running ? "#22c55e" : "#3f3f46"} strokeWidth="4" opacity="0.5" />
                      <circle cx="50" cy="50" r="45" fill="none" stroke={state.tripped ? "#ef4444" : state.running ? "#22c55e" : "#3f3f46"} strokeWidth="4" strokeDasharray="15,70" />
                      {/* Shaft spokes */}
                      <line x1="50" y1="10" x2="50" y2="35" stroke={state.running ? "#22c55e" : "#52525b"} strokeWidth="3" strokeLinecap="round" />
                      <line x1="50" y1="65" x2="50" y2="90" stroke={state.running ? "#22c55e" : "#52525b"} strokeWidth="3" strokeLinecap="round" />
                      <line x1="10" y1="50" x2="35" y2="50" stroke={state.running ? "#22c55e" : "#52525b"} strokeWidth="3" strokeLinecap="round" />
                      <line x1="65" y1="50" x2="90" y2="50" stroke={state.running ? "#22c55e" : "#52525b"} strokeWidth="3" strokeLinecap="round" />
                      {/* Center hub */}
                      <circle cx="50" cy="50" r="8" fill={state.tripped ? "#ef4444" : state.running ? "#22c55e" : "#52525b"} />
                    </svg>
                  </motion.div>
                  {/* RPM display */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center bg-black/60 rounded-lg px-3 py-1.5">
                      <div className="text-lg font-bold font-mono text-white">{state.motorRPM}</div>
                      <div className="text-[9px] text-zinc-500">RPM</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Frequency display */}
              <div className="flex items-center justify-center gap-6 mt-2">
                <div className="text-center">
                  <div className="text-xs text-zinc-500">Actual</div>
                  <div className="text-lg font-mono font-bold text-emerald-400">{state.actualFrequency.toFixed(1)} Hz</div>
                </div>
                <div className="w-px h-8 bg-zinc-800" />
                <div className="text-center">
                  <div className="text-xs text-zinc-500">Target</div>
                  <div className="text-lg font-mono font-bold text-zinc-300">{state.targetFrequency} Hz</div>
                </div>
              </div>
            </div>

            {/* Telemetry Gauges */}
            <div className="grid grid-cols-2 gap-2">
              <TelemetryGauge label="DC Bus" value={state.dcBusVoltage} unit="V DC" min={0} max={900} warning={750} danger={820} icon={Zap} />
              <TelemetryGauge label="Output V" value={state.outputVoltage} unit="V AC" min={0} max={480} warning={500} danger={600} icon={Activity} />
              <TelemetryGauge label="Current" value={state.motorCurrent} unit="A" min={0} max={30} warning={20} danger={25} icon={Gauge} />
              <TelemetryGauge label="Motor Temp" value={state.motorTemp} unit="°C" min={0} max={150} warning={90} danger={110} icon={Thermometer} />
              <TelemetryGauge label="Heatsink" value={state.heatsinkTemp} unit="°C" min={0} max={100} warning={75} danger={90} icon={Wind} />
              <TelemetryGauge label="Load" value={state.loadPercent} unit="%" min={0} max={200} warning={100} danger={150} icon={Power} />
            </div>
          </div>

          {/* RIGHT: Fault Injection + Event Log */}
          <div className="space-y-4">
            {/* Fault Injection Panel */}
            <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Fault Injection
                </h3>
                {state.activeFaults.length > 0 && (
                  <button
                    onClick={handleClearFaults}
                    className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear All
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {FAULTS.map(fault => {
                  const isActive = state.activeFaults.includes(fault.id);
                  return (
                    <button
                      key={fault.id}
                      onClick={() => handleInjectFault(fault)}
                      disabled={isActive}
                      className={`text-left p-2.5 rounded-lg border transition-all ${
                        isActive 
                          ? "bg-red-950/30 border-red-500/30 opacity-60 cursor-not-allowed"
                          : "bg-zinc-800/30 border-zinc-700/40 hover:border-zinc-600 hover:bg-zinc-800/60 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">{fault.icon}</span>
                        <span className="text-[10px] font-semibold text-zinc-300">{fault.label}</span>
                      </div>
                      <p className="text-[9px] text-zinc-500 leading-tight">{fault.description}</p>
                      {isActive && (
                        <div className="mt-1.5 text-[9px] font-medium text-red-400 flex items-center gap-1">
                          <CircleSlash className="w-2.5 h-2.5" /> Active
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Event Log */}
            <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Event Log</h3>
              <div className="h-64 overflow-y-auto rounded-lg bg-black/60 border border-zinc-800/50 p-3 font-mono text-[10px] space-y-1">
                {state.eventLog.map((entry, i) => (
                  <div
                    key={i}
                    className={`leading-relaxed ${
                      entry.includes("[TRIP]") ? "text-red-400" :
                      entry.includes("[FAULT]") || entry.includes("[ALARM]") ? "text-amber-400" :
                      entry.includes("[WARN]") ? "text-yellow-400" :
                      entry.includes("[CMD]") ? "text-emerald-400" :
                      "text-zinc-500"
                    }`}
                  >
                    {entry}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
