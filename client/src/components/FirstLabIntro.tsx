/**
 * FirstLabIntro — a short, skippable guided introduction for beginners
 * entering their first interactive lab. Explains:
 * - What the machine is doing
 * - What the learner is trying to determine
 * - Where to find the schematic
 * - How to select a tool
 * - How to place meter leads
 * - How to record a hypothesis
 * - That guessing is different from proving a fault
 *
 * Shows once per user (localStorage). Replayable via a help button.
 */
import { useState, useEffect } from "react";
import { X, ArrowRight, ArrowLeft, Wrench, FileText, Gauge, Brain, Target, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "eas_first_lab_intro_v1";

const STEPS = [
  {
    icon: Target,
    title: "What you're doing",
    text: "A machine has stopped. Your job is to find the real fault — not guess, but prove it with evidence from readings and logic.",
  },
  {
    icon: FileText,
    title: "Find the schematic",
    text: "Look for the circuit diagram panel. It shows the wiring between components. Tap any component to see its current state.",
  },
  {
    icon: Wrench,
    title: "Select a tool",
    text: "Use the tool bar to pick your multimeter, flashlight, or prints viewer. Each tool reveals different information about the circuit.",
  },
  {
    icon: Gauge,
    title: "Take a reading",
    text: "With the multimeter selected, tap two test points to measure voltage or continuity. The reading tells you if power is present or a wire is broken.",
  },
  {
    icon: Brain,
    title: "Build your case",
    text: "Each reading is evidence. Before you commit to a diagnosis, gather enough readings to prove your hypothesis — don't just guess the first thing that seems wrong.",
  },
  {
    icon: ShieldAlert,
    title: "Guessing vs. proving",
    text: "In a real plant, replacing the wrong part costs time and money. Here, you're scored on method — the sequence of logical steps that leads to the correct root cause.",
  },
];

interface FirstLabIntroProps {
  show?: boolean;
  onClose?: () => void;
}

export default function FirstLabIntro({ show = true, onClose }: FirstLabIntroProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!show) return;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [show]);

  const close = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    setOpen(false);
    onClose?.();
  };

  if (!open) return null;

  const currentStep = STEPS[step];
  const Icon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] uppercase tracking-wider text-[oklch(0.55_0.12_155)] font-mono">
            Quick Guide · {step + 1}/{STEPS.length}
          </span>
          <button onClick={close} className="text-zinc-500 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-[oklch(0.55_0.12_155/12%)] border border-[oklch(0.55_0.12_155/25%)] flex items-center justify-center shrink-0">
            <Icon className="w-4.5 h-4.5 text-[oklch(0.55_0.12_155)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">{currentStep.title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{currentStep.text}</p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === step ? "bg-[oklch(0.55_0.12_155)]" : i < step ? "bg-zinc-600" : "bg-zinc-800"
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="text-zinc-500 text-xs"
          >
            <ArrowLeft className="w-3 h-3 mr-1" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setStep(s => s + 1)}
              className="bg-[oklch(0.55_0.12_155)] hover:bg-[oklch(0.50_0.12_155)] text-white text-xs"
            >
              Next <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={close}
              className="bg-[oklch(0.55_0.12_155)] hover:bg-[oklch(0.50_0.12_155)] text-white text-xs"
            >
              Got it — start diagnosing
            </Button>
          )}
        </div>

        {/* Skip */}
        <button
          onClick={close}
          className="w-full mt-3 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors text-center"
        >
          Skip introduction
        </button>
      </div>
    </div>
  );
}

/** Utility to reset the intro (for "replay" button) */
export function resetFirstLabIntro() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
