/**
 * Onboarding — 3-step wizard for first-time users.
 * Step 1: What best describes you? (persona)
 * Step 2: How much electrical experience? (experience level)
 * Step 3: What are you working toward? (goal)
 * → Assigns a deterministic path and launches the first lesson.
 *
 * Mobile-first: one decision group per screen, large touch targets,
 * visible Back/Continue controls, no horizontal scrolling.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, Zap, Wrench, Cpu, Shield, Briefcase, HardHat } from "lucide-react";
import SEO from "@/components/SEO";

// ─── Step Data ──────────────────────────────────────────────────────────────────

const PERSONAS = [
  { id: "operator", label: "Machine operator or production employee", description: "I work on the floor but haven't done electrical maintenance", icon: HardHat },
  { id: "new_tech", label: "New maintenance technician", description: "I'm in a maintenance role but still building skills", icon: Wrench },
  { id: "experienced_tech", label: "Experienced maintenance technician", description: "I troubleshoot independently most of the time", icon: Zap },
  { id: "controls_tech", label: "Controls or electrical technician", description: "I work with PLCs, drives, and control systems daily", icon: Cpu },
  { id: "leader", label: "Maintenance leader", description: "I manage or evaluate a maintenance team", icon: Briefcase },
] as const;

const EXPERIENCE_LEVELS = [
  { id: "none", label: "None yet", description: "I haven't worked with industrial electrical systems" },
  { id: "basic", label: "Basic — I recognize common components", description: "I know what a motor starter and breaker look like" },
  { id: "developing", label: "Developing — I can perform some troubleshooting", description: "I can use a meter and follow basic procedures" },
  { id: "experienced", label: "Experienced — I troubleshoot independently", description: "I diagnose and repair most faults without help" },
] as const;

const GOALS = [
  { id: "move_to_maintenance", label: "Move from operations into maintenance", description: "I want to become a maintenance technician" },
  { id: "build_troubleshooting", label: "Build electrical troubleshooting skills", description: "I want to get better at finding and fixing faults" },
  { id: "improve_plc", label: "Improve PLC troubleshooting", description: "I want to read ladder logic and trace faults in programs" },
  { id: "improve_vfd", label: "Improve VFD troubleshooting", description: "I want to diagnose drive faults and parameter issues" },
  { id: "more_responsibility", label: "Prepare for more responsibility", description: "I want to grow into a lead or specialist role" },
  { id: "manage_team", label: "Evaluate or manage a maintenance team", description: "I need to track and develop my team's skills" },
] as const;

type Persona = typeof PERSONAS[number]["id"];
type Experience = typeof EXPERIENCE_LEVELS[number]["id"];
type Goal = typeof GOALS[number]["id"];

// ─── Component ──────────────────────────────────────────────────────────────────

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [experience, setExperience] = useState<Experience | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);

  const completeMutation = trpc.onboarding.complete.useMutation();
  const trackEvent = trpc.onboarding.trackEvent.useMutation();

  const handleComplete = async () => {
    if (!persona || !experience || !goal) return;

    const result = await completeMutation.mutateAsync({ persona, experience, goal });

    // Track analytics
    trackEvent.mutate({ event: "onboarding_completed", meta: { persona, experience, goal, pathId: result.path?.id } });

    if (result.redirectTo) {
      // Leader → manager portal
      navigate(result.redirectTo);
    } else if (result.path) {
      // Everyone else → first lesson launch page
      navigate(`/onboarding/start?path=${result.path.id}`);
    } else {
      navigate("/dashboard");
    }
  };

  const canContinue = step === 1 ? !!persona : step === 2 ? !!experience : !!goal;

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white flex flex-col">
      <SEO title="Get Started — EASLearn" description="Tell us about yourself so we can build your training path." path="/onboarding" />

      {/* Progress bar */}
      <div className="w-full h-1 bg-zinc-800">
        <div
          className="h-full bg-[oklch(0.55_0.12_155)] transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-wider text-[oklch(0.55_0.12_155)] font-mono mb-2">
            Step {step} of 3
          </p>
          <h1 className="text-xl sm:text-2xl font-bold">
            {step === 1 && "What best describes you?"}
            {step === 2 && "How much industrial electrical experience do you have?"}
            {step === 3 && "What are you working toward?"}
          </h1>
        </div>

        {/* Options */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full space-y-3"
          >
            {step === 1 && PERSONAS.map(p => (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  persona === p.id
                    ? "border-[oklch(0.55_0.12_155)] bg-[oklch(0.55_0.12_155/8%)]"
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <p.icon className={`w-5 h-5 shrink-0 ${persona === p.id ? "text-[oklch(0.55_0.12_155)]" : "text-zinc-500"}`} />
                  <div>
                    <p className="font-medium text-sm">{p.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{p.description}</p>
                  </div>
                </div>
              </button>
            ))}

            {step === 2 && EXPERIENCE_LEVELS.map(e => (
              <button
                key={e.id}
                onClick={() => setExperience(e.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  experience === e.id
                    ? "border-[oklch(0.55_0.12_155)] bg-[oklch(0.55_0.12_155/8%)]"
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                }`}
              >
                <p className="font-medium text-sm">{e.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{e.description}</p>
              </button>
            ))}

            {step === 3 && GOALS.map(g => (
              <button
                key={g.id}
                onClick={() => setGoal(g.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  goal === g.id
                    ? "border-[oklch(0.55_0.12_155)] bg-[oklch(0.55_0.12_155/8%)]"
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                }`}
              >
                <p className="font-medium text-sm">{g.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{g.description}</p>
              </button>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between w-full mt-8 gap-4">
          <Button
            variant="ghost"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="text-zinc-400"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          {step < 3 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canContinue}
              className="bg-[oklch(0.55_0.12_155)] hover:bg-[oklch(0.50_0.12_155)] text-white px-6"
            >
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!canContinue || completeMutation.isPending}
              className="bg-[oklch(0.55_0.12_155)] hover:bg-[oklch(0.50_0.12_155)] text-white px-6"
            >
              {completeMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Building your path...</>
              ) : (
                <>Get Started <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          )}
        </div>

        {/* Skip option */}
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-6 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Skip for now — I'll explore on my own
        </button>
      </div>
    </div>
  );
}
