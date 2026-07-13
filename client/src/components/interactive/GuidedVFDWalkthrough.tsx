/**
 * GuidedVFDWalkthrough — Step-by-Step Interactive VFD Learning
 * 
 * Replaces text-heavy explanations with a tap-through guided sequence.
 * Each step: user taps a component → animated response → brief explanation.
 * Progressive reveal: next step only shows after completing current interaction.
 * 
 * Flow: AC Input → Rectifier → DC Bus → Inverter → Motor
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, RotateCcw, Zap, CheckCircle2, Play } from "lucide-react";

// === STEP DATA ===

interface WalkthroughStep {
  id: number;
  label: string;
  instruction: string;
  explanation: string;
  voltageLabel: string;
  waveformType: "sine" | "pulsating_dc" | "smooth_dc" | "pwm" | "rotation";
  color: string;
}

const STEPS: WalkthroughStep[] = [
  {
    id: 1,
    label: "AC Line Input",
    instruction: "Tap the AC source to energize the system",
    explanation: "3-phase 480V AC enters from plant distribution. 60Hz sine wave.",
    voltageLabel: "480V AC @ 60Hz",
    waveformType: "sine",
    color: "#22c55e",
  },
  {
    id: 2,
    label: "Rectifier",
    instruction: "Tap the rectifier to convert AC → DC",
    explanation: "6-pulse diode bridge converts AC to pulsating DC. V_dc = V_ac × 1.414",
    voltageLabel: "678V DC (pulsating)",
    waveformType: "pulsating_dc",
    color: "#f59e0b",
  },
  {
    id: 3,
    label: "DC Bus Capacitors",
    instruction: "Tap the capacitors to smooth the ripple",
    explanation: "Large electrolytic capacitors smooth pulsating DC into clean DC bus voltage.",
    voltageLabel: "678V DC (smooth)",
    waveformType: "smooth_dc",
    color: "#3b82f6",
  },
  {
    id: 4,
    label: "Inverter (IGBTs)",
    instruction: "Tap the inverter to create PWM output",
    explanation: "6 IGBTs switch at 4-16kHz, creating PWM that simulates a sine wave.",
    voltageLabel: "0-480V AC (PWM)",
    waveformType: "pwm",
    color: "#a855f7",
  },
  {
    id: 5,
    label: "Motor Output",
    instruction: "Tap the motor to see it spin",
    explanation: "Motor speed = (120 × frequency) / poles. VFD controls speed by changing frequency.",
    voltageLabel: "1750 RPM",
    waveformType: "rotation",
    color: "#ef4444",
  },
];

// === WAVEFORM ANIMATIONS ===

function SineWave({ active, color }: { active: boolean; color: string }) {
  return (
    <svg viewBox="0 0 200 60" className="w-full h-16">
      <defs>
        <linearGradient id="sine-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="20%" stopColor={color} stopOpacity="1" />
          <stop offset="80%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      <line x1="0" y1="30" x2="200" y2="30" stroke="#374151" strokeWidth="0.5" strokeDasharray="2,2" />
      {active && (
        <motion.path
          d="M 0,30 Q 12.5,5 25,30 Q 37.5,55 50,30 Q 62.5,5 75,30 Q 87.5,55 100,30 Q 112.5,5 125,30 Q 137.5,55 150,30 Q 162.5,5 175,30 Q 187.5,55 200,30"
          fill="none"
          stroke="url(#sine-grad)"
          strokeWidth="2.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      )}
    </svg>
  );
}

function PulsatingDC({ active, color }: { active: boolean; color: string }) {
  return (
    <svg viewBox="0 0 200 60" className="w-full h-16">
      <line x1="0" y1="50" x2="200" y2="50" stroke="#374151" strokeWidth="0.5" strokeDasharray="2,2" />
      {active && (
        <motion.path
          d="M 0,50 Q 8,10 16,50 Q 24,10 33,50 Q 41,10 50,50 Q 58,10 66,50 Q 74,10 83,50 Q 91,10 100,50 Q 108,10 116,50 Q 124,10 133,50 Q 141,10 150,50 Q 158,10 166,50 Q 174,10 183,50 Q 191,10 200,50"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      )}
    </svg>
  );
}

function SmoothDC({ active, color }: { active: boolean; color: string }) {
  return (
    <svg viewBox="0 0 200 60" className="w-full h-16">
      <line x1="0" y1="50" x2="200" y2="50" stroke="#374151" strokeWidth="0.5" strokeDasharray="2,2" />
      {active && (
        <>
          <motion.line
            x1="0" y1="15" x2="200" y2="15"
            stroke={color}
            strokeWidth="2.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          {/* Tiny ripple to show it's not perfect */}
          <motion.path
            d="M 0,15 Q 25,13 50,15 Q 75,17 100,15 Q 125,13 150,15 Q 175,17 200,15"
            fill="none"
            stroke={color}
            strokeWidth="1"
            strokeOpacity="0.4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          />
        </>
      )}
    </svg>
  );
}

function PWMWave({ active, color }: { active: boolean; color: string }) {
  return (
    <svg viewBox="0 0 200 60" className="w-full h-16">
      <line x1="0" y1="30" x2="200" y2="30" stroke="#374151" strokeWidth="0.5" strokeDasharray="2,2" />
      {active && (
        <motion.path
          d="M 0,30 L 0,10 L 5,10 L 5,50 L 10,50 L 10,10 L 20,10 L 20,50 L 25,50 L 25,10 L 35,10 L 35,50 L 38,50 L 38,10 L 50,10 L 50,50 L 52,50 L 52,10 L 66,10 L 66,50 L 68,50 L 68,10 L 80,10 L 80,50 L 83,50 L 83,10 L 95,10 L 95,50 L 100,50 L 100,10 L 110,10 L 110,50 L 115,50 L 115,10 L 125,10 L 125,50 L 132,50 L 132,10 L 140,10 L 140,50 L 148,50 L 148,10 L 155,10 L 155,50 L 163,50 L 163,10 L 168,10 L 168,50 L 178,50 L 178,10 L 182,10 L 182,50 L 192,50 L 192,10 L 195,10 L 195,50 L 200,50"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      )}
      {/* Envelope sine wave overlay */}
      {active && (
        <motion.path
          d="M 0,30 Q 25,10 50,30 Q 75,50 100,30 Q 125,10 150,30 Q 175,50 200,30"
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeDasharray="3,3"
          strokeOpacity="0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        />
      )}
    </svg>
  );
}

function MotorRotation({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="w-full h-16 flex items-center justify-center">
      {active && (
        <motion.div
          className="relative w-14 h-14"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="0 0 60 60" className="w-full h-full">
            <circle cx="30" cy="30" r="26" fill="none" stroke={color} strokeWidth="3" opacity="0.3" />
            <circle cx="30" cy="30" r="26" fill="none" stroke={color} strokeWidth="3" strokeDasharray="20,60" />
            <circle cx="30" cy="30" r="4" fill={color} />
            {/* Shaft lines */}
            <line x1="30" y1="4" x2="30" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <line x1="30" y1="45" x2="30" y2="56" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <line x1="4" y1="30" x2="15" y2="30" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <line x1="45" y1="30" x2="56" y2="30" stroke={color} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </motion.div>
      )}
    </div>
  );
}

function WaveformDisplay({ type, active, color }: { type: WalkthroughStep["waveformType"]; active: boolean; color: string }) {
  switch (type) {
    case "sine": return <SineWave active={active} color={color} />;
    case "pulsating_dc": return <PulsatingDC active={active} color={color} />;
    case "smooth_dc": return <SmoothDC active={active} color={color} />;
    case "pwm": return <PWMWave active={active} color={color} />;
    case "rotation": return <MotorRotation active={active} color={color} />;
  }
}

// === MAIN COMPONENT ===

export default function GuidedVFDWalkthrough() {
  const [currentStep, setCurrentStep] = useState(0); // 0 = not started
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [animatingStep, setAnimatingStep] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isStarted = currentStep > 0;
  const isComplete = completedSteps.size === STEPS.length;

  const handleStepTap = useCallback((stepId: number) => {
    if (stepId !== currentStep) return; // Can only tap the current step
    
    setAnimatingStep(stepId);
    
    // After animation plays, mark complete and advance
    setTimeout(() => {
      setCompletedSteps(prev => { const next = new Set(Array.from(prev)); next.add(stepId); return next; });
      setAnimatingStep(null);
      if (stepId < STEPS.length) {
        setCurrentStep(stepId + 1);
      }
    }, 1500);
  }, [currentStep]);

  const handleStart = useCallback(() => {
    setCurrentStep(1);
    setCompletedSteps(new Set());
  }, []);

  const handleReset = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setAnimatingStep(null);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">How a VFD Works</h3>
            <p className="text-[11px] text-zinc-500">Tap each section to see the power conversion</p>
          </div>
        </div>
        {isStarted && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600 transition-all"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center gap-1 mb-2">
          {STEPS.map((step) => (
            <div key={step.id} className="flex-1 flex items-center gap-1">
              <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                completedSteps.has(step.id) ? "bg-emerald-500" :
                animatingStep === step.id ? "bg-amber-500 animate-pulse" :
                currentStep === step.id ? "bg-zinc-600" :
                "bg-zinc-800"
              }`} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
          <span>AC IN</span>
          <span>RECT</span>
          <span>DC BUS</span>
          <span>INV</span>
          <span>MOTOR</span>
        </div>
      </div>

      {/* Start State */}
      {!isStarted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 bg-zinc-900/50 rounded-xl border border-zinc-800 cursor-pointer hover:border-emerald-500/30 transition-all"
          onClick={handleStart}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mb-4"
          >
            <Play className="w-7 h-7 text-emerald-400 ml-1" />
          </motion.div>
          <p className="text-sm font-medium text-white mb-1">Start Interactive Walkthrough</p>
          <p className="text-xs text-zinc-500">Tap through each VFD section to see how power flows</p>
        </motion.div>
      )}

      {/* Step Cards */}
      {isStarted && (
        <div className="space-y-3">
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = completedSteps.has(step.id);
            const isAnimating = animatingStep === step.id;
            const isLocked = step.id > currentStep;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isLocked ? 0.4 : 1, y: 0 }}
                transition={{ delay: step.id * 0.05 }}
                className={`relative rounded-xl border overflow-hidden transition-all ${
                  isActive && !isAnimating ? "border-zinc-600 bg-zinc-900/80 cursor-pointer hover:border-emerald-500/50" :
                  isAnimating ? "border-emerald-500/50 bg-emerald-950/20" :
                  isCompleted ? "border-zinc-800 bg-zinc-900/30" :
                  "border-zinc-800/50 bg-zinc-950/30"
                }`}
                onClick={() => isActive && !isAnimating && handleStepTap(step.id)}
              >
                <div className="p-4">
                  {/* Step header */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                      isCompleted ? "bg-emerald-500 text-black" :
                      isActive ? "bg-zinc-700 text-white border border-zinc-600" :
                      "bg-zinc-800 text-zinc-600"
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{step.label}</span>
                        {isActive && !isAnimating && (
                          <motion.span
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          >
                            TAP
                          </motion.span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {isActive && !isAnimating ? step.instruction : isCompleted ? step.explanation : ""}
                      </p>
                    </div>
                    {isCompleted && (
                      <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                        {step.voltageLabel}
                      </span>
                    )}
                  </div>

                  {/* Waveform Animation Area */}
                  <AnimatePresence>
                    {(isAnimating || isCompleted) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 p-3 rounded-lg bg-black/40 border border-zinc-800/50">
                          <WaveformDisplay type={step.waveformType} active={true} color={step.color} />
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] font-mono text-zinc-500">{step.voltageLabel}</span>
                            {isAnimating && (
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-[10px] text-emerald-400"
                              >
                                Converting...
                              </motion.span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Active step glow */}
                {isActive && !isAnimating && (
                  <motion.div
                    className="absolute inset-0 border-2 border-emerald-500/20 rounded-xl pointer-events-none"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Completion State */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-3"
            >
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </motion.div>
            <h4 className="text-sm font-bold text-white mb-1">Power Flow Complete</h4>
            <p className="text-xs text-zinc-400 mb-4">
              You've traced the full power path: AC → DC → Variable AC → Mechanical rotation
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-300 border border-zinc-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Try Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
