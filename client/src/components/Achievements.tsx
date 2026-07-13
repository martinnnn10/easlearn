/**
 * Achievements — Shows earned and locked achievement badges on the Dashboard.
 * Pulls from lesson completions, certifications, and simulator scores.
 */
import { motion } from "framer-motion";
import {
  Zap, BookOpen, Award, Target, Cpu, Shield, Flame,
  Trophy, Star, Lock
} from "lucide-react";

interface AchievementsProps {
  completedLessons: number;
  totalXP: number;
  certCount: number;
  simulatorRuns: number;
}

const achievements = [
  {
    id: "first-lesson",
    icon: BookOpen,
    title: "First Steps",
    description: "Complete your first lesson",
    condition: (p: AchievementsProps) => p.completedLessons >= 1,
  },
  {
    id: "five-lessons",
    icon: Zap,
    title: "Getting Wired",
    description: "Complete 5 lessons",
    condition: (p: AchievementsProps) => p.completedLessons >= 5,
  },
  {
    id: "ten-lessons",
    icon: Flame,
    title: "On Fire",
    description: "Complete 10 lessons",
    condition: (p: AchievementsProps) => p.completedLessons >= 10,
  },
  {
    id: "twenty-five-lessons",
    icon: Star,
    title: "Dedicated Learner",
    description: "Complete 25 lessons",
    condition: (p: AchievementsProps) => p.completedLessons >= 25,
  },
  {
    id: "first-cert",
    icon: Award,
    title: "Certified",
    description: "Earn your first certification",
    condition: (p: AchievementsProps) => p.certCount >= 1,
  },
  {
    id: "three-certs",
    icon: Trophy,
    title: "Triple Threat",
    description: "Earn 3 certifications",
    condition: (p: AchievementsProps) => p.certCount >= 3,
  },
  {
    id: "first-sim",
    icon: Target,
    title: "Troubleshooter",
    description: "Complete a simulator scenario",
    condition: (p: AchievementsProps) => p.simulatorRuns >= 1,
  },
  {
    id: "xp-500",
    icon: Cpu,
    title: "Journeyman",
    description: "Earn 500 XP",
    condition: (p: AchievementsProps) => p.totalXP >= 500,
  },
  {
    id: "xp-2000",
    icon: Shield,
    title: "Master Tech",
    description: "Earn 2,000 XP",
    condition: (p: AchievementsProps) => p.totalXP >= 2000,
  },
];

export default function Achievements(props: AchievementsProps) {
  const earned = achievements.filter((a) => a.condition(props));
  const locked = achievements.filter((a) => !a.condition(props));

  if (earned.length === 0 && props.completedLessons === 0) return null;

  return (
    <div className="card-panel p-5 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-heading text-white tracking-wide flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
          Achievements
        </h3>
        <span className="text-[10px] font-mono text-[oklch(0.45_0.006_250)]">
          {earned.length}/{achievements.length} unlocked
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {earned.map((a, i) => {
          const Icon = a.icon;
          return (
            <motion.div
              key={a.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="group relative flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-[oklch(0.55_0.12_155/6%)] border border-[oklch(0.55_0.12_155/18%)] hover:border-[oklch(0.55_0.12_155/35%)] transition-colors"
              title={`${a.title}: ${a.description}`}
            >
              <Icon className="w-5 h-5 text-[oklch(0.55_0.12_155)]" />
              <span className="text-[9px] font-medium text-white text-center leading-tight">{a.title}</span>
            </motion.div>
          );
        })}
        {locked.slice(0, 4).map((a) => (
          <div
            key={a.id}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-[oklch(0.08_0.003_250)] border border-[oklch(0.14_0.004_250)] opacity-40"
            title={`Locked: ${a.description}`}
          >
            <Lock className="w-5 h-5 text-[oklch(0.35_0.006_250)]" />
            <span className="text-[9px] font-medium text-[oklch(0.35_0.006_250)] text-center leading-tight">???</span>
          </div>
        ))}
      </div>
    </div>
  );
}
