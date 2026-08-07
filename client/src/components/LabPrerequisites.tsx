/**
 * LabPrerequisites — shows recommended prerequisite courses for a lab.
 * Displays status: "Recommended prerequisite", "Ready to start", "Advanced practice".
 * Does NOT hard-lock content — only provides guidance.
 */
import { BookOpen, CheckCircle2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// Prerequisite mapping: which courses should be completed before each lab
const LAB_PREREQUISITES: Record<string, { slug: string; title: string }[]> = {
  "conveyor-troubleshoot": [
    { slug: "electrical-fundamentals", title: "Electrical Fundamentals" },
    { slug: "plc-fundamentals", title: "PLC Fundamentals" },
  ],
  "powerflex-diagnostic": [
    { slug: "electrical-fundamentals", title: "Electrical Fundamentals" },
    { slug: "powerflex-vfd", title: "PowerFlex VFD" },
  ],
  "ladder": [
    { slug: "plc-fundamentals", title: "PLC Fundamentals" },
  ],
  "multimeter": [
    { slug: "electrical-fundamentals", title: "Electrical Fundamentals" },
  ],
  "relay": [
    { slug: "electrical-fundamentals", title: "Electrical Fundamentals" },
    { slug: "motors-controls", title: "Motors & Motor Controls" },
  ],
  "plc": [
    { slug: "plc-fundamentals", title: "PLC Fundamentals" },
  ],
  "vfd": [
    { slug: "powerflex-vfd", title: "PowerFlex VFD" },
  ],
  "motor-starter": [
    { slug: "motors-controls", title: "Motors & Motor Controls" },
  ],
  "wiring-diagram": [
    { slug: "print-reading", title: "Print Reading (Electrical)" },
  ],
};

// Labs that are beginner-friendly (no prerequisites needed)
const BEGINNER_LABS = ["circuit", "ohms", "diode", "transistor", "thyristor", "component-id"];

interface LabPrerequisitesProps {
  labId: string;
  compact?: boolean;
}

export default function LabPrerequisites({ labId, compact = false }: LabPrerequisitesProps) {
  const { isAuthenticated } = useAuth();
  const prerequisites = LAB_PREREQUISITES[labId];

  // If no prerequisites defined, it's beginner-friendly
  if (!prerequisites || BEGINNER_LABS.includes(labId)) {
    if (compact) return null;
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-400/80">
        <CheckCircle2 className="w-3 h-3" />
        <span>Ready to start — no prerequisites</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-400/70 mt-1">
        <AlertCircle className="w-3 h-3" />
        <span>Recommended: {prerequisites.map(p => p.title).join(", ")}</span>
      </div>
    );
  }

  return (
    <div className="mt-2 p-2.5 rounded-lg bg-zinc-800/40 border border-zinc-700/40">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono mb-1.5">
        Recommended before starting
      </p>
      <div className="space-y-1">
        {prerequisites.map(p => (
          <div key={p.slug} className="flex items-center gap-1.5 text-xs text-zinc-400">
            <BookOpen className="w-3 h-3 text-zinc-500" />
            <span>{p.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { LAB_PREREQUISITES, BEGINNER_LABS };
