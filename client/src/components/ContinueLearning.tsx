/**
 * ContinueLearning — Shows "Continue where you left off" card on Dashboard
 * Uses localStorage to track the last lesson the user was viewing
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Play } from "lucide-react";
import { useLastLesson } from "@/hooks/useLastLesson";

export default function ContinueLearning() {
  const { lastLesson } = useLastLesson();

  if (!lastLesson) return null;

  // Don't show if it's been more than 30 days
  const daysSince = (Date.now() - lastLesson.timestamp) / (1000 * 60 * 60 * 24);
  if (daysSince > 30) return null;

  const timeAgo = daysSince < 1
    ? "Today"
    : daysSince < 2
    ? "Yesterday"
    : `${Math.floor(daysSince)} days ago`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      <Link
        href={`/courses/${lastLesson.moduleSlug}/${lastLesson.lessonSlug}`}
        className="block group"
      >
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[oklch(0.55_0.12_155/8%)] to-[oklch(0.12_0.003_250)] border border-[oklch(0.55_0.12_155/20%)] p-5 hover:border-[oklch(0.55_0.12_155/40%)] transition-all duration-300">
          <div className="flex items-center gap-4">
            {/* Play icon */}
            <div className="w-12 h-12 rounded-xl bg-[oklch(0.55_0.12_155/15%)] border border-[oklch(0.55_0.12_155/30%)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Play className="w-5 h-5 text-[oklch(0.55_0.12_155)] ml-0.5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[oklch(0.50_0.008_250)] mb-0.5 flex items-center gap-2">
                <BookOpen className="w-3 h-3" />
                Continue where you left off · {timeAgo}
              </p>
              <p className="text-sm font-medium text-white truncate">
                {lastLesson.lessonTitle}
              </p>
              <p className="text-xs text-[oklch(0.45_0.008_250)] mt-0.5">
                {lastLesson.moduleTitle} · Lesson {lastLesson.lessonIndex + 1}/{lastLesson.totalLessons}
              </p>
            </div>

            {/* Arrow */}
            <ArrowRight className="w-5 h-5 text-[oklch(0.55_0.12_155)] shrink-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
