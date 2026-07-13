import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { LessonCard, LessonCardDeck } from "@shared/learningCardTypes";
import { collectGlossaryHighlights } from "@shared/lessonGlossary";
import { clampCardIndex } from "@shared/lessonCardNav";
import { GlossaryHighlightProvider } from "./GlossaryTerm";
import LearningCardView, { type SummaryLabCta, type LessonInteractionOutcome } from "./LearningCardView";
import MaintenanceMentor from "./MaintenanceMentor";
import LessonReflection from "./LessonReflection";
import LessonOperatorRoleplay from "./LessonOperatorRoleplay";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { skillDomainForModule } from "@shared/competencyMatrix";
import { closeoutFor } from "@shared/lessonCloseouts";

export interface LessonCardPlayerProps {
  deck: LessonCardDeck;
  maxCardIndex?: number;
  previewMode?: boolean;
  summaryCtas?: SummaryLabCta[];
  onIndexChange?: (index: number) => void;
  /** Fires once when the user navigates to the summary card (not on mount). */
  onSummaryReached?: () => void;
}

function cardTextFields(card: LessonCardDeck["cards"][number]): string[] {
  const texts = [card.heading, card.body, card.takeaway ?? ""];
  if (card.interaction?.prompt) texts.push(card.interaction.prompt);
  if (card.interaction?.revealBody) texts.push(card.interaction.revealBody);
  if (card.interaction?.choices) {
    texts.push(...card.interaction.choices.map((c) => c.label));
  }
  return texts;
}

function isKnowledgeCheck(card: LessonCard): boolean {
  return card.interaction?.type === "choice";
}

function slideTypeLabel(card: LessonCard): string {
  if (card.kind === "summary") return "Summary";
  if (isKnowledgeCheck(card)) return "Check";
  if (card.visual?.type === "diagram") return "Diagram";
  if (card.visual?.type === "callout") return "Concept";
  return "Lesson";
}

export default function LessonCardPlayer({
  deck,
  maxCardIndex,
  previewMode = false,
  summaryCtas,
  onIndexChange,
  onSummaryReached,
}: LessonCardPlayerProps) {
  const total = maxCardIndex != null ? Math.min(maxCardIndex + 1, deck.cards.length) : deck.cards.length;
  const [index, setIndex] = useState(0);
  const summaryReachedRef = useRef(false);
  const [answeredKc, setAnsweredKc] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const touchStartX = useRef<number | null>(null);
  const seenGlossary = useRef(new Set<string>());
  const highlightCache = useRef(new Map<number, Set<string>>());

  const progressPct = Math.round(((index + 1) / total) * 100);

  // Assessment Spine seam: each resolved interaction emits a competency EvidenceEvent.
  // Fire-and-forget, only for signed-in learners in a real lesson (never in preview).
  const { isAuthenticated } = useAuth();
  const recordEvidence = trpc.assessment.recordEvidence.useMutation();
  const emitOutcome = useCallback(
    (o: LessonInteractionOutcome) => {
      if (previewMode || !isAuthenticated) return;
      recordEvidence.mutate({
        sourceType: "lesson",
        evidenceType:
          o.interaction === "reasoned" ? "reasoned_answer"
            : o.interaction === "predict" ? "prediction"
              : o.interaction === "sequence" ? "ordering"
                : "action_choice",
        mechanicId: o.mechanicId,
        domain: skillDomainForModule(deck.moduleSlug),
        lessonId: deck.lessonSlug,
        courseId: deck.moduleSlug,
        correctness: o.correct ? "correct" : "incorrect",
        reasoningQuality: o.reasoningQuality,
      });
    },
    [previewMode, isAuthenticated, recordEvidence, deck.moduleSlug, deck.lessonSlug],
  );

  const go = useCallback(
    (next: number) => {
      const clamped = clampCardIndex(next, total);
      setIndex(clamped);
      setVisited((prev) => new Set(prev).add(clamped));
      onIndexChange?.(clamped);
      const card = deck.cards[clamped];
      if (
        card?.kind === "summary" &&
        clamped >= total - 1 &&
        !summaryReachedRef.current
      ) {
        summaryReachedRef.current = true;
        onSummaryReached?.();
      }
    },
    [total, onIndexChange, onSummaryReached, deck.cards]
  );

  const card = deck.cards[index];
  const kcBlocked = isKnowledgeCheck(card) && !answeredKc[card.id];
  const atStart = index === 0;
  const atEnd = index >= total - 1;

  const tryNext = useCallback(() => {
    if (kcBlocked) return;
    go(index + 1);
  }, [kcBlocked, go, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        tryNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(index - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tryNext, go, index]);

  const glossaryHighlights = useMemo(() => {
    if (highlightCache.current.has(index)) {
      return highlightCache.current.get(index)!;
    }
    const picked = collectGlossaryHighlights(cardTextFields(card), seenGlossary.current);
    highlightCache.current.set(index, picked);
    return picked;
  }, [index, card]);

  const handleKcAnswered = useCallback((cardId: string) => {
    setAnsweredKc((prev) => ({ ...prev, [cardId]: true }));
  }, []);

  const outline = (
    <div className="lesson-outline-inner">
      <p className="text-xs font-mono uppercase tracking-wider text-[oklch(0.45_0.006_250)] mb-3 px-1">
        {deck.title}
      </p>
      <ul className="space-y-1">
        {deck.cards.slice(0, total).map((c, i) => {
          const done = visited.has(i) && i < index;
          const current = i === index;
          const kc = isKnowledgeCheck(c);
          const kcDone = !kc || answeredKc[c.id];
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  if (i > index) {
                    for (let j = index; j < i; j++) {
                      const slide = deck.cards[j];
                      if (isKnowledgeCheck(slide) && !answeredKc[slide.id]) return;
                    }
                  }
                  go(i);
                }}
                className={`w-full text-left px-3 py-2.5 min-h-11 rounded-md text-sm transition-colors flex items-start gap-2 ${
                  current
                    ? "bg-[oklch(0.55_0.12_155/12%)] border border-[oklch(0.55_0.12_155/30%)] text-white"
                    : "text-[oklch(0.60_0.008_250)] hover:bg-[oklch(0.12_0.003_250)] hover:text-white"
                }`}
              >
                <span className="shrink-0 mt-0.5 w-4 h-4 flex items-center justify-center">
                  {done && kcDone ? (
                    <Check className="w-3.5 h-3.5 text-[oklch(0.55_0.12_155)]" />
                  ) : (
                    <span className="text-[10px] font-mono opacity-50">{i + 1}</span>
                  )}
                </span>
                <span className="flex-1 leading-snug">
                  <span className="block text-[10px] font-mono uppercase opacity-60 mb-0.5">
                    {slideTypeLabel(c)}
                  </span>
                  {c.heading}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div className="lesson-card-player lesson-rise-layout" aria-roledescription="carousel" aria-label="Lesson slides">
      {/* Top bar */}
      <div className="lesson-rise-topbar">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-base sm:text-lg font-heading text-white flex-1 min-w-0 break-words">{deck.title}</h2>
          <span className="text-sm font-mono text-[oklch(0.55_0.12_155)] shrink-0">{progressPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-[oklch(0.14_0.004_250)] overflow-hidden">
          <div
            className="h-full bg-[oklch(0.55_0.12_155)] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="lg:hidden mt-2 text-sm font-mono text-[oklch(0.55_0.008_250)]" aria-live="polite">
          Slide {index + 1} / {total}
        </p>
      </div>

      <div className="lesson-rise-body">
        {/* Desktop sidebar */}
        <aside className="lesson-rise-sidebar hidden lg:block" aria-label="Lesson outline">
          {outline}
        </aside>

        {/* Main slide area */}
        <div className="lesson-rise-main">
          <GlossaryHighlightProvider terms={glossaryHighlights}>
            <div
              className={`lesson-card-stage lesson-rise-stage rounded-xl border border-[oklch(0.18_0.004_250)] bg-[oklch(0.08_0.003_250)] p-4 sm:p-6 touch-pan-y ${
                card.interaction?.type === "choice" && !card.visual ? "lesson-card-stage--mcq" : ""
              }`}
              onTouchStart={(e) => {
                touchStartX.current = e.changedTouches[0]?.clientX ?? null;
              }}
              onTouchEnd={(e) => {
                if (kcBlocked) return;
                if (card.interaction?.type === "choice") return;
                if (touchStartX.current == null) return;
                const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
                if (dx < -48) tryNext();
                else if (dx > 48) go(index - 1);
                touchStartX.current = null;
              }}
            >
              <LearningCardView
                card={card}
                summaryCtas={card.kind === "summary" ? summaryCtas : undefined}
                onKnowledgeCheckAnswered={() => handleKcAnswered(card.id)}
                onOutcome={emitOutcome}
                onSkipIntro={index === 0 && card.heading === "New to this?" ? () => go(1) : undefined}
              />
              {/* In-lesson AI Maintenance Mentor — on interaction cards, for signed-in learners */}
              {!previewMode && isAuthenticated && card.interaction && card.interaction.type !== "reveal" && (
                <MaintenanceMentor
                  lessonTitle={deck.title}
                  cardHeading={card.heading}
                  mechanicId={card.mechanicId}
                  domain={skillDomainForModule(deck.moduleSlug)}
                  learnerAction={card.interaction.prompt || undefined}
                />
              )}
              {/* Closeout: reflection + operator/work-order/handoff + role-play, on the summary
                  card. Requires BOTH deck.reflection AND a scenario-specific closeout config —
                  a deck without real scenario context gets no generic reflection chat. */}
              {!previewMode && isAuthenticated && card.kind === "summary" && deck.reflection && (() => {
                const closeout = closeoutFor(deck.moduleSlug, deck.lessonSlug);
                if (!closeout) return null;
                const domain = skillDomainForModule(deck.moduleSlug);
                return (
                  <>
                    <LessonReflection lessonTitle={deck.title} domain={domain} closeout={closeout} />
                    <LessonOperatorRoleplay lessonTitle={deck.title} domain={domain} closeout={closeout} />
                  </>
                );
              })()}
            </div>
          </GlossaryHighlightProvider>

          {kcBlocked && (
            <p className="mt-2 text-sm text-[oklch(0.65_0.10_80)]" role="status">
              Answer the question to continue.
            </p>
          )}

          <div className="lesson-rise-nav mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => go(index - 1)}
              disabled={atStart}
              aria-label="Previous slide"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 text-base rounded-md border border-[oklch(0.22_0.004_250)] text-[oklch(0.72_0.008_250)] disabled:opacity-35 hover:text-white min-h-11 w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="hidden lg:inline text-xs font-mono text-[oklch(0.45_0.006_250)] text-center" aria-live="polite">
              {previewMode ? `Preview ${index + 1} of ${total}` : `${index + 1} of ${total}`}
            </span>
            <button
              type="button"
              onClick={tryNext}
              disabled={atEnd || kcBlocked}
              aria-label="Next slide"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-base rounded-md border border-[oklch(0.55_0.12_155/40%)] bg-[oklch(0.55_0.12_155/10%)] text-[oklch(0.78_0.12_155)] disabled:opacity-35 hover:text-white min-h-11 w-full sm:w-auto"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
