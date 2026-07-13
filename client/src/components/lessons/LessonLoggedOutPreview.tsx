import { Link } from "wouter";
import { ArrowRight, BookOpen, Lock } from "lucide-react";
import type { LessonCardDeck } from "@shared/learningCardTypes";
import { GlossaryText } from "./GlossaryTerm";
import LessonCardPlayer from "./LessonCardPlayer";
import LearningCardView from "./LearningCardView";
import LessonIluStrip from "@/components/LessonIluStrip";

export interface LessonLoggedOutPreviewProps {
  deck: LessonCardDeck;
  moduleTitle: string;
  moduleSlug: string;
  /** Signed-in free user — show upgrade CTA, not sign-in. */
  isAuthenticated?: boolean;
}

export default function LessonLoggedOutPreview({
  deck,
  moduleTitle,
  moduleSlug,
  isAuthenticated = false,
}: LessonLoggedOutPreviewProps) {
  // Give a free user a real "aha": always preview THROUGH the first interactive
  // knowledge-check card so they get to answer a question and see feedback before
  // the paywall — not stop one slide short of it. Never previews less than the
  // deck's own previewCardCount, and never the whole deck.
  const firstInteractionIdx = deck.cards.findIndex((c) => c.kind === "interaction");
  const previewCount = Math.min(
    deck.cards.length - 1,
    Math.max(deck.previewCardCount, firstInteractionIdx >= 0 ? firstInteractionIdx + 1 : 0),
  );
  const gatedCard = deck.cards[previewCount];
  const remaining = deck.cards.length - previewCount;

  return (
    <div>
      <section className="py-10 border-b border-[oklch(0.15_0.004_250)]">
        <div className="container max-w-3xl">
          <Link
            href={`/courses/${moduleSlug}`}
            className="inline-flex items-center gap-2 text-sm text-[oklch(0.55_0.12_155)] mb-4 hover:gap-3 transition-all"
          >
            {moduleTitle}
          </Link>
          <div className="flex items-center gap-2 text-xs text-[oklch(0.45_0.006_250)] mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Slide lesson preview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading text-white tracking-wide mb-4">{deck.title}</h1>
          <div className="rounded-lg border border-[oklch(0.18_0.004_250)] bg-[oklch(0.09_0.003_250)] p-4">
            <p className="text-[11px] font-mono uppercase tracking-wider text-[oklch(0.50_0.008_250)] mb-2">
              What you&apos;ll learn
            </p>
            <ul className="space-y-1.5 text-sm text-[oklch(0.72_0.008_250)]">
              {deck.whatYoullLearn.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-[oklch(0.55_0.12_155)]">•</span>
                  <span>
                    <GlossaryText text={item} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container max-w-3xl space-y-6">
          <LessonIluStrip moduleSlug={moduleSlug} lessonSlug={deck.lessonSlug} />

          <LessonCardPlayer
            deck={deck}
            maxCardIndex={previewCount - 1}
            previewMode
          />

          {gatedCard && (
            <div className="relative rounded-xl border border-[oklch(0.18_0.004_250)] overflow-hidden">
              <div className="blur-sm opacity-60 pointer-events-none select-none p-4 sm:p-6 max-h-[220px] overflow-hidden">
                <LearningCardView card={gatedCard} />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-[oklch(0.06_0.003_250/95%)] via-[oklch(0.06_0.003_250/75%)] to-transparent px-6 text-center">
                <Lock className="w-8 h-8 text-[oklch(0.45_0.006_250)] mb-3" />
                <p className="text-sm text-[oklch(0.72_0.008_250)] mb-4 max-w-sm">
                  {isAuthenticated
                    ? `Upgrade to unlock ${remaining} more slides, practice labs, and troubleshooting scenarios.`
                    : `Subscribe to continue — ${remaining} more slides, practice labs, and troubleshooting scenarios.`}
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 btn-primary text-sm font-medium rounded"
                >
                  {isAuthenticated ? "View pricing & upgrade" : "Subscribe to continue"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {!isAuthenticated && (
            <p className="text-center text-xs text-[oklch(0.45_0.006_250)]">
              Already subscribed?{" "}
              <Link href="/login" className="text-[oklch(0.55_0.12_155)] hover:text-white">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
