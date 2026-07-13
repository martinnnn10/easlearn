import type { ScrollProgressState } from "@/hooks/useScrollProgress";

export function LessonReadingProgressBar({ state }: { state: ScrollProgressState }) {
  if (!state.visible) return null;

  return (
    <div
      className="lesson-reading-progress fixed top-16 lg:top-[68px] left-0 right-0 z-40 h-1 pointer-events-none"
      role="progressbar"
      aria-valuenow={Math.round(state.progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Lesson reading progress"
      style={{ opacity: state.opacity }}
    >
      <div
        className="lesson-reading-progress__fill h-full"
        style={{ width: `${state.progress * 100}%` }}
      />
    </div>
  );
}
