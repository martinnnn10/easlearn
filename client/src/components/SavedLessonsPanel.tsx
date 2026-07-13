/**
 * SavedLessonsPanel - Shows bookmarked lessons on the Dashboard
 */
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Bookmark, BookOpen, ArrowRight } from "lucide-react";

export default function SavedLessonsPanel() {
  const { data: bookmarks, isLoading } = trpc.bookmarks.list.useQuery();

  if (isLoading) {
    return (
      <div className="bg-[oklch(0.09_0.003_250)] rounded-lg border border-[oklch(0.15_0.004_250)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bookmark className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-heading text-white tracking-wide">SAVED LESSONS</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-[oklch(0.12_0.003_250)] rounded" />
          <div className="h-10 bg-[oklch(0.12_0.003_250)] rounded" />
        </div>
      </div>
    );
  }

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="bg-[oklch(0.09_0.003_250)] rounded-lg border border-[oklch(0.15_0.004_250)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bookmark className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-heading text-white tracking-wide">SAVED LESSONS</h3>
        </div>
        <div className="text-center py-4">
          <BookOpen className="w-8 h-8 text-[oklch(0.25_0.006_250)] mx-auto mb-2" />
          <p className="text-xs text-[oklch(0.45_0.006_250)]">
            No saved lessons yet. Bookmark lessons to revisit them later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[oklch(0.09_0.003_250)] rounded-lg border border-[oklch(0.15_0.004_250)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-heading text-white tracking-wide">SAVED LESSONS</h3>
        </div>
        <span className="text-[11px] text-[oklch(0.45_0.006_250)]">{bookmarks.length} saved</span>
      </div>

      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
        {bookmarks.map((bm) => (
          <Link
            key={bm.id}
            href={`/courses/${bm.moduleSlug}/${bm.lessonSlug}`}
            className="flex items-center gap-3 p-2.5 rounded-md bg-[oklch(0.07_0.003_250)] border border-[oklch(0.13_0.004_250)] hover:border-[oklch(0.25_0.004_250)] transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-white truncate group-hover:text-[oklch(0.75_0.12_155)] transition-colors">
                {bm.lessonTitle}
              </p>
              <p className="text-[11px] text-[oklch(0.4_0.006_250)] truncate">
                {bm.moduleTitle}
              </p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[oklch(0.3_0.006_250)] group-hover:text-[oklch(0.55_0.12_155)] transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
