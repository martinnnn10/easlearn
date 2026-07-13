/**
 * Badge Display Component
 * Shows earned lab badges on the user's account page.
 * Queries the lab_scores table for badge eligibility.
 */
import { motion } from "framer-motion";
import { Award, Zap, Cpu, Shield, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

// Badge definitions — maps labId to display info
const BADGE_DEFINITIONS: Record<string, {
  name: string;
  description: string;
  icon: typeof Award;
  color: string;
  bgColor: string;
  borderColor: string;
  labUrl: string;
}> = {
  "diode-testing": {
    name: "Diode Diagnostics",
    description: "Mastered all 9 diode types in the testing lab",
    icon: Zap,
    color: "oklch(0.70_0.15_155)",
    bgColor: "oklch(0.15_0.06_155/25%)",
    borderColor: "oklch(0.35_0.12_155/40%)",
    labUrl: "/labs#diode",
  },
  "transistor-testing": {
    name: "Transistor Expert",
    description: "Mastered all transistor types: BJTs, MOSFETs, Darlington, IGBT",
    icon: Cpu,
    color: "oklch(0.70_0.15_250)",
    bgColor: "oklch(0.15_0.06_250/25%)",
    borderColor: "oklch(0.35_0.12_250/40%)",
    labUrl: "/labs#transistor",
  },
  "thyristor-testing": {
    name: "Thyristor Specialist",
    description: "Mastered all thyristor types: SCR, TRIAC, DIAC, GTO",
    icon: Shield,
    color: "oklch(0.70_0.15_30)",
    bgColor: "oklch(0.15_0.06_30/25%)",
    borderColor: "oklch(0.35_0.12_30/40%)",
    labUrl: "/labs#thyristor",
  },
};

// All possible badges (for showing locked ones)
const ALL_BADGE_IDS = ["diode-testing", "transistor-testing", "thyristor-testing"];

export function BadgeDisplay() {
  const { data, isLoading } = trpc.labs.getMyBadges.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Award className="w-5 h-5 text-[oklch(0.55_0.12_85)]" />
          <h3 className="text-base font-semibold text-white">Lab Badges</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-lg bg-[oklch(0.06_0.003_250)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const earnedBadgeIds = new Set(data?.badges.map(b => b.labId) || []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Award className="w-5 h-5 text-[oklch(0.55_0.12_85)]" />
        <h3 className="text-base font-semibold text-white">Lab Badges</h3>
        <span className="text-xs text-[oklch(0.45_0.008_250)]">
          {earnedBadgeIds.size}/{ALL_BADGE_IDS.length} earned
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ALL_BADGE_IDS.map((badgeId, index) => {
          const def = BADGE_DEFINITIONS[badgeId];
          const earned = earnedBadgeIds.has(badgeId);
          const badgeData = data?.badges.find(b => b.labId === badgeId);
          const Icon = def.icon;

          return (
            <motion.div
              key={badgeId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {earned ? (
                <Link href={def.labUrl}>
                  <div
                    className="relative p-4 rounded-lg border cursor-pointer hover:scale-[1.02] transition-transform"
                    style={{
                      backgroundColor: def.bgColor,
                      borderColor: def.borderColor,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5" style={{ color: def.color }} />
                      <span className="text-sm font-semibold text-white">{def.name}</span>
                    </div>
                    <p className="text-[10px] text-[oklch(0.55_0.008_250)] leading-tight">{def.description}</p>
                    {badgeData?.earnedAt && (
                      <p className="text-[9px] text-[oklch(0.40_0.008_250)] mt-2">
                        Earned {new Date(badgeData.earnedAt).toLocaleDateString()}
                      </p>
                    )}
                    {/* Earned indicator */}
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: def.color }} />
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="relative p-4 rounded-lg border border-[oklch(0.12_0.004_250)] bg-[oklch(0.06_0.003_250)] opacity-60">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-[oklch(0.35_0.006_250)]" />
                    <span className="text-sm font-medium text-[oklch(0.40_0.006_250)]">{def.name}</span>
                  </div>
                  <p className="text-[10px] text-[oklch(0.35_0.006_250)] leading-tight">{def.description}</p>
                  <Link href={def.labUrl}>
                    <span className="text-[10px] text-[oklch(0.45_0.10_155)] hover:text-[oklch(0.55_0.12_155)] mt-2 inline-block">
                      Start lab →
                    </span>
                  </Link>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
