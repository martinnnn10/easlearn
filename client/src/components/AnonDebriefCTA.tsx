/**
 * AnonDebriefCTA — the activation capture. Shown on the scenario debrief to a
 * NOT-logged-in user at peak dopamine (right after they nailed a real fault).
 *
 * This is the single highest-leverage conversion surface in the product: it asks
 * for signup only after value is delivered, and it stores the just-earned result
 * so it can be claimed onto the new account.
 */
import { useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Trophy, Lock } from "lucide-react";

interface AnonDebriefCTAProps {
  scenarioTitle: string;
  methodologyPercent: number;
  tier: string;
  grade: string;
}

const PENDING_KEY = "eas_pending_result";

export default function AnonDebriefCTA({ scenarioTitle, methodologyPercent, tier, grade }: AnonDebriefCTAProps) {
  const [, navigate] = useLocation();

  // Stash the result so it can be claimed onto the account after signup.
  useEffect(() => {
    try {
      localStorage.setItem(
        PENDING_KEY,
        JSON.stringify({ scenarioTitle, methodologyPercent, tier, grade, at: Date.now() }),
      );
    } catch {
      /* ignore */
    }
  }, [scenarioTitle, methodologyPercent, tier, grade]);

  return (
    <div className="sim-glass-elevated p-6 mb-6 border border-emerald-500/30 text-center">
      <Trophy className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
      <h3 className="text-white font-bold text-lg mb-1" style={{ fontFamily: "var(--font-sim-body)", textTransform: "none" }}>
        You diagnosed like a {tier}.
      </h3>
      <p className="text-gray-400 text-sm mb-4">
        Create a free account to save this score, unlock your full methodology breakdown and AI debrief,
        and start your verifiable Skills Passport.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
        <button
          onClick={() => navigate("/signup")}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-sm font-semibold text-white"
        >
          Save my result — free <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate("/login")}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded border border-gray-700 hover:bg-gray-800 px-6 py-3 text-sm font-semibold text-gray-300"
        >
          <Lock className="w-4 h-4" /> Log in
        </button>
      </div>
      <p className="text-gray-600 text-[11px] mt-3">No credit card. Keep practicing for free.</p>
    </div>
  );
}
