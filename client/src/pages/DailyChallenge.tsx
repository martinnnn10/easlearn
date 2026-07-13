/**
 * Fault of the Day — the free, viral daily challenge hub.
 *
 * Flow: see today's fault → solve it in the simulator → come back to a shareable
 * Wordle-style score card + leaderboard + a nudge to build a Skills Passport
 * (the job bridge). Free to play; results/leaderboard for signed-in users.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Zap, Trophy, Share2, Image as ImageIcon, Flame, ArrowRight, Users } from "lucide-react";
import SEO from "@/components/SEO";
import { buildShareText } from "@shared/dailyChallenge";
import { generateDailyShareCard, shareOrDownloadCard } from "@/lib/shareCard";

export default function DailyChallenge() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);

  const today = trpc.daily.getToday.useQuery();
  const myResult = trpc.daily.myResult.useQuery(undefined, { enabled: isAuthenticated });
  const leaderboard = trpc.daily.leaderboard.useQuery({ limit: 10 });

  const challenge = today.data;
  const result = myResult.data;

  const share = async () => {
    if (!result?.solved) return;
    const text = buildShareText({
      dateKey: result.dateKey,
      methodologyPercent: result.methodologyPercent ?? 0,
      percentile: result.percentile ?? null,
      tier: result.tier ?? "Rookie",
    });
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Result copied — paste it anywhere");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user cancelled share */
    }
  };

  const shareImage = async () => {
    if (!result?.solved || !challenge) return;
    try {
      const blob = await generateDailyShareCard({
        dateKey: result.dateKey,
        methodologyPercent: result.methodologyPercent ?? 0,
        tier: result.tier ?? "Rookie",
        percentile: result.percentile ?? null,
        faultTitle: challenge.title,
      });
      const how = await shareOrDownloadCard(blob, result.dateKey);
      if (how === "downloaded") toast.success("Card downloaded — post it anywhere");
    } catch {
      toast.error("Couldn't generate the image card");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white">
      <SEO title="Fault of the Day" description="One free industrial troubleshooting challenge a day. Everyone gets the same fault. Can you fix it?" path="/daily" />
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 text-emerald-300 text-xs px-3 py-1 border border-emerald-500/30 mb-3">
            <Zap className="w-3.5 h-3.5" /> Fault of the Day
          </div>
          <h1 className="text-3xl font-bold">{challenge?.dateKey ?? "Today's challenge"}</h1>
          {challenge && (
            <p className="text-gray-500 text-sm mt-1 flex items-center justify-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> {challenge.solversToday} solved today
            </p>
          )}
        </div>

        {/* The challenge / result card */}
        {challenge ? (
          result?.solved ? (
            <div className="rounded-xl border border-emerald-500/30 bg-[#0d120d] p-6 text-center">
              <p className="text-emerald-400 text-xs uppercase tracking-widest mb-2">Solved</p>
              <div className="text-5xl font-bold text-white mb-1">{result.methodologyPercent}%</div>
              <p className="text-gray-400 text-sm mb-1">Diagnosed like a <span className="text-emerald-300">{result.tier}</span></p>
              {result.percentile != null && (
                <p className="text-gray-500 text-xs mb-4">Top {100 - result.percentile}% of today's solvers</p>
              )}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button onClick={shareImage} className="inline-flex items-center gap-2 rounded bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-sm font-semibold">
                  <ImageIcon className="w-4 h-4" /> Share image card
                </button>
                <button onClick={share} className="inline-flex items-center gap-2 rounded border border-gray-700 hover:bg-gray-800 px-5 py-2.5 text-sm font-semibold">
                  {copied ? "Copied!" : <><Share2 className="w-4 h-4" /> Copy text</>}
                </button>
              </div>
              <div className="mt-6 pt-5 border-t border-gray-800">
                <p className="text-gray-400 text-sm mb-2">Turn streaks into a job.</p>
                <button onClick={() => navigate("/skills-passport")} className="inline-flex items-center gap-1.5 text-emerald-400 text-sm hover:underline">
                  Build your Skills Passport <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-800 bg-[#0d120d] p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 uppercase tracking-wide">{challenge.difficulty} · {challenge.duration}</span>
                <span className="text-xs text-gray-500">{challenge.equipmentType}</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">{challenge.title}</h2>
              <p className="text-gray-400 text-sm mb-5">A real machine is down. Diagnose the fault with the right method — measured, not guessed. Same fault for everyone today.</p>
              <button
                onClick={() => navigate(challenge.route)}
                className="w-full inline-flex items-center justify-center gap-2 rounded bg-emerald-600 hover:bg-emerald-700 px-5 py-3 text-sm font-semibold"
              >
                <Zap className="w-4 h-4" /> Solve today's fault
              </button>
              {!isAuthenticated && (
                <p className="text-gray-600 text-xs text-center mt-3">Free to play. Sign in to save your streak and rank.</p>
              )}
            </div>
          )
        ) : (
          <p className="text-gray-500 text-center">No challenge available right now.</p>
        )}

        {/* Leaderboard */}
        {(leaderboard.data?.length ?? 0) > 0 && (
          <div className="mt-8 rounded-xl border border-gray-800 bg-[#0d120d] p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /> Today's top diagnosticians</h3>
            <div className="space-y-1.5">
              {leaderboard.data!.map(r => (
                <div key={r.rank} className="flex items-center gap-3 text-sm">
                  <span className={`w-5 text-center font-bold ${r.rank === 1 ? "text-amber-400" : "text-gray-500"}`}>{r.rank}</span>
                  <span className="text-gray-200 flex-1 truncate">{r.name}</span>
                  <span className="text-emerald-400 font-mono">{r.methodologyPercent}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-gray-600 text-xs mt-8 flex items-center justify-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-orange-400" /> Come back tomorrow for a new fault. Keep your streak alive.
        </p>
      </div>
    </div>
  );
}
