/**
 * InviteFriends — the viral invite widget. Shows the user's referral link, a
 * one-tap share/copy, and progress toward the "Recruiter" milestone.
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { UserPlus, Copy, Share2, Award } from "lucide-react";

const MILESTONES = [1, 3, 10, 25];

export default function InviteFriends() {
  const { isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);
  const codeQuery = trpc.referral.myCode.useQuery(undefined, { enabled: isAuthenticated });

  if (!isAuthenticated || !codeQuery.data) return null;
  const { code, qualified } = codeQuery.data;
  const link = `${window.location.origin}/daily?ref=${code}`;
  const nextMilestone = MILESTONES.find(m => m > qualified) ?? null;

  const share = async () => {
    const text = `I'm getting hire-ready on EASLearn — try today's Fault of the Day. ${link}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        toast.success("Invite link copied");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className="rounded-lg border border-emerald-500/20 bg-[#0d120d] p-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-1 flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-emerald-400" /> Invite a friend
      </h3>
      <p className="text-gray-500 text-xs mb-3">
        {qualified > 0 ? `${qualified} joined through you.` : "Bring someone onto the floor with you."}
        {nextMilestone && ` ${nextMilestone - qualified} more to your next badge.`}
      </p>

      <div className="flex items-center gap-2 mb-3">
        <input
          readOnly
          value={link}
          onFocus={e => e.currentTarget.select()}
          className="flex-1 bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300"
        />
        <button onClick={share} className="inline-flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-sm px-3 py-1.5">
          {copied ? "Copied!" : <><Share2 className="w-4 h-4" /> Invite</>}
        </button>
      </div>

      <div className="flex items-center gap-3">
        {MILESTONES.map(m => (
          <div key={m} className={`flex items-center gap-1 text-[11px] ${qualified >= m ? "text-emerald-400" : "text-gray-600"}`}>
            <Award className="w-3.5 h-3.5" /> {m}
          </div>
        ))}
      </div>
    </div>
  );
}
