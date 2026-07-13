/**
 * VerifySkillsPassport — public, employer-facing verification of a technician's
 * competency. The viral object: every hiring manager who opens a shared link
 * lands here and sees the platform.
 */
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, ShieldOff } from "lucide-react";
import SEO from "@/components/SEO";
import CompetencyProfileView from "@/components/CompetencyProfileView";

export default function VerifySkillsPassport() {
  const [, params] = useRoute("/verify/skills/:code");
  const code = params?.code ?? "";
  const query = trpc.competency.publicProfile.useQuery({ code }, { enabled: !!code });

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white">
      <SEO title="Verify Skills Passport" description="Employer-verifiable industrial competency" path={`/verify/skills/${code}`} />
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
          <p className="text-emerald-400 text-xs uppercase tracking-widest">EASLearn · Verified Competency</p>
        </div>

        {query.isLoading ? (
          <div className="flex items-center gap-2 text-gray-500 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</div>
        ) : query.data ? (
          <>
            <CompetencyProfileView profile={query.data} verified />
            <p className="text-center text-gray-600 text-xs mt-8">
              This profile is generated from measured performance on industrial troubleshooting
              simulations and AI-graded reasoning assessments. Verified by EASLearn.
            </p>
          </>
        ) : (
          <div className="text-center py-16">
            <ShieldOff className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No verified profile found for this code.</p>
          </div>
        )}
      </div>
    </div>
  );
}
