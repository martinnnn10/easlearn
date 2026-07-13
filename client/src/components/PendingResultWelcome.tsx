/**
 * PendingResultWelcome — keeps the promise made on the anonymous simulator debrief.
 *
 * When a logged-out visitor diagnoses a fault, AnonDebriefCTA stashes their result
 * and says "create an account to save it." After they sign up and land here, this
 * reads that stash, welcomes them with the result they earned, then clears it.
 * Without this, the first thing a brand-new user sees is a cold dashboard.
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Trophy, X, ArrowRight } from "lucide-react";

const PENDING_KEY = "eas_pending_result";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface Pending {
  scenarioTitle: string;
  methodologyPercent: number;
  tier: string;
  grade: string;
  at: number;
}

export default function PendingResultWelcome() {
  const [, navigate] = useLocation();
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as Pending;
      // Only surface a fresh result; clear it either way so it shows once.
      if (p && typeof p.methodologyPercent === "number" && Date.now() - (p.at ?? 0) < MAX_AGE_MS) {
        setPending(p);
      }
      localStorage.removeItem(PENDING_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  if (!pending) return null;

  return (
    <div className="mb-6 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-transparent p-5">
      <div className="flex items-start gap-3">
        <Trophy className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-white font-semibold">Welcome — your result is saved.</p>
          <p className="text-gray-400 text-sm mt-0.5">
            You diagnosed <span className="text-gray-200">{pending.scenarioTitle}</span> like a{" "}
            <span className="text-emerald-300 font-medium">{pending.tier}</span> ({pending.methodologyPercent}%). That's now the start of your competency graph.
          </p>
          <button onClick={() => navigate("/become-a-tech")} className="mt-3 inline-flex items-center gap-1.5 text-emerald-400 text-sm hover:underline">
            Keep going — follow the path to tech <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <button onClick={() => setPending(null)} className="text-gray-600 hover:text-gray-400" aria-label="Dismiss"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
