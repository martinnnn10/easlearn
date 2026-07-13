/**
 * SimulatorOnboarding — a short, skippable orientation overlay for first-time
 * users of the troubleshooting simulator. The sim is powerful but dense; a VP
 * demo or a brand-new operator should understand what they're looking at in ~15
 * seconds. Shows once (localStorage), and can be reopened from a help affordance.
 */
import { useEffect, useState } from "react";
import { Cpu, Activity, Zap, Gauge, FileCheck, Target, X, ArrowRight } from "lucide-react";

const STORAGE_KEY = "eas_sim_onboarding_v1";

const STEPS = [
  { icon: Target, t: "Your goal", d: "A machine is down. Find the real fault and prove it — you're scored on your method, not luck." },
  { icon: Cpu, t: "Machine twin", d: "A live model of the equipment. Statuses and faults react to what you do." },
  { icon: Activity, t: "Ladder logic", d: "The running PLC program. Rungs turn green as conditions make — read it like a tech does online." },
  { icon: Zap, t: "I/O panel", d: "Inputs & outputs with real addresses (I:1/2, O:2/0). Trace the signal to isolate the break." },
  { icon: Gauge, t: "Multimeter", d: "Take voltage & continuity readings across the circuit and interpret what they mean." },
  { icon: FileCheck, t: "Evidence", d: "Gather readings and prints to build your case before you commit to a diagnosis." },
];

export default function SimulatorOnboarding({ show = true }: { show?: boolean }) {
  const [open, setOpen] = useState(false);

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
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Simulator orientation">
      <div className="relative w-full max-w-lg rounded-2xl border border-emerald-500/25 bg-[#0a0f0a] p-6 shadow-2xl">
        <button onClick={close} aria-label="Skip orientation" className="absolute top-3 right-3 text-gray-500 hover:text-white p-1">
          <X className="w-4 h-4" />
        </button>
        <div className="text-emerald-400 text-[11px] font-semibold tracking-widest uppercase mb-1">Before you start</div>
        <h2 className="text-xl font-bold text-white mb-1">What you're looking at</h2>
        <p className="text-gray-500 text-sm mb-5">30 seconds and you'll know how to work the sim. You can reopen this anytime from the “?” help.</p>

        <div className="space-y-2.5 mb-6">
          {STEPS.map((s) => (
            <div key={s.t} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
                <s.icon className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-white text-sm font-semibold">{s.t}</div>
                <div className="text-gray-500 text-xs leading-relaxed">{s.d}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button onClick={close} className="text-xs text-gray-500 hover:text-gray-300">Skip</button>
          <button onClick={close} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white">
            Start diagnosing <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
