import { useRef, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, ExternalLink, FlaskConical, Lightbulb, Wrench, Check, X, ArrowUp, ArrowDown, ListChecks, Eye, RotateCcw, Brain } from "lucide-react";
import type { LessonCard, LessonCardInteraction, LessonCardSequenceStep } from "@shared/learningCardTypes";
import { GlossaryText } from "./GlossaryTerm";
import { LessonCardVisualBlock } from "./LessonCardVisual";

/** Deterministic reorder so a sequence card doesn't reshuffle on every render,
 *  but never presents the steps already in the correct order. */
function shuffleSteps(steps: LessonCardSequenceStep[]): LessonCardSequenceStep[] {
  if (steps.length < 2) return [...steps];
  const arr = [...steps].reverse();
  if (arr.length > 2) arr.push(arr.shift()!);
  // guard: if reversal happened to match source (palindromic ids), rotate once
  if (arr.every((s, i) => s.id === steps[i].id)) arr.push(arr.shift()!);
  return arr;
}

function SequenceInteraction({
  interaction,
  onAnswered,
  onOutcome,
}: {
  interaction: LessonCardInteraction;
  onAnswered?: () => void;
  onOutcome?: (o: LessonInteractionOutcome) => void;
}) {
  const steps = interaction.steps ?? [];
  const [order, setOrder] = useState(() => shuffleSteps(steps));
  const [checked, setChecked] = useState(false);
  const fired = useRef(false);
  if (steps.length === 0) return null;

  const isCorrect = order.every((s, i) => s.id === steps[i].id);
  const move = (i: number, dir: -1 | 1) => {
    if (checked && isCorrect) return;
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
    setChecked(false);
  };

  return (
    <div className="lesson-kc-block rounded-lg border border-[oklch(0.22_0.004_250)] bg-[oklch(0.10_0.003_250)] p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-mono uppercase text-[oklch(0.55_0.12_155)]">
        <ListChecks className="w-3.5 h-3.5" /> Put it in order
      </div>
      <p className="text-lg font-medium text-white leading-snug">{interaction.prompt}</p>
      <ol className="space-y-2">
        {order.map((s, i) => {
          const placedRight = checked && s.id === steps[i].id;
          return (
            <li
              key={s.id}
              className={`flex items-center gap-3 rounded-md border px-3 py-2.5 ${
                checked
                  ? placedRight
                    ? "border-[oklch(0.55_0.12_155/50%)] bg-[oklch(0.55_0.12_155/8%)]"
                    : "border-[oklch(0.55_0.12_25/40%)] bg-[oklch(0.55_0.12_25/6%)]"
                  : "border-[oklch(0.20_0.004_250)]"
              }`}
            >
              <span className="w-6 h-6 shrink-0 rounded-full bg-[oklch(0.16_0.004_250)] text-[oklch(0.70_0.008_250)] text-xs font-mono flex items-center justify-center">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <span className="text-base text-[oklch(0.80_0.008_250)]"><GlossaryText text={s.label} /></span>
                {checked && isCorrect && s.because && (
                  <span className="block text-xs text-[oklch(0.58_0.008_250)] mt-0.5">{s.because}</span>
                )}
              </div>
              {!(checked && isCorrect) && (
                <span className="flex flex-col shrink-0">
                  <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="p-1 text-[oklch(0.55_0.008_250)] hover:text-white disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                  <button type="button" aria-label="Move down" disabled={i === order.length - 1} onClick={() => move(i, 1)} className="p-1 text-[oklch(0.55_0.008_250)] hover:text-white disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {!(checked && isCorrect) && (
        <button
          type="button"
          onClick={() => {
            setChecked(true);
            const right = order.every((s, i) => s.id === steps[i].id);
            if (right) onAnswered?.();
            if (!fired.current) { fired.current = true; onOutcome?.({ interaction: "sequence", correct: right }); }
          }}
          className="w-full rounded-md border border-[oklch(0.55_0.12_155/45%)] bg-[oklch(0.55_0.12_155/12%)] text-[oklch(0.80_0.12_155)] hover:text-white py-3 text-sm font-medium min-h-11"
        >
          Check the order
        </button>
      )}

      {checked && (
        <div className={`rounded-md border-l-4 px-4 py-3 ${isCorrect ? "border-l-[oklch(0.55_0.12_155)] bg-[oklch(0.55_0.12_155/8%)]" : "border-l-[oklch(0.55_0.12_25)] bg-[oklch(0.55_0.12_25/8%)]"}`} role="status">
          <div className="flex items-start gap-2 mb-1">
            {isCorrect ? <Check className="w-5 h-5 text-[oklch(0.55_0.12_155)] shrink-0 mt-0.5" /> : <X className="w-5 h-5 text-[oklch(0.65_0.12_25)] shrink-0 mt-0.5" />}
            <p className={`text-base font-medium ${isCorrect ? "text-[oklch(0.75_0.12_155)]" : "text-[oklch(0.72_0.10_25)]"}`}>{isCorrect ? "That's the sequence" : "Not the order a tech would work it"}</p>
          </div>
          <p className="text-base leading-relaxed text-[oklch(0.72_0.008_250)]">{isCorrect ? interaction.feedbackCorrect : interaction.feedbackIncorrect}</p>
          {!isCorrect && (
            <button type="button" onClick={() => setChecked(false)} className="inline-flex items-center gap-1.5 mt-2 text-sm text-[oklch(0.70_0.12_155)] hover:text-white">
              <RotateCcw className="w-3.5 h-3.5" /> Rearrange and try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export interface SummaryLabCta {
  label: string;
  href: string;
  variant: "practice" | "troubleshoot";
}

/** Emitted when a learner resolves an interaction — the Assessment Spine turns
 *  this into a competency EvidenceEvent (see shared/assessmentSpine.ts). */
export interface LessonInteractionOutcome {
  interaction: "reasoned" | "choice" | "predict" | "sequence";
  correct: boolean;
  reasoningQuality?: "sound" | "weak" | "flawed" | "none";
  cardId?: string;
  mechanicId?: string;
}

const KIND_LABELS: Record<LessonCard["kind"], string> = {
  concept: "Concept",
  example: "Example",
  interaction: "Try it",
  summary: "Summary",
};

/**
 * ReasonedInteraction — the apprenticeship core. Commit to an action, then the
 * mentor asks "what made you think that?" BEFORE any verdict. Feedback branches
 * on (action × reasoning): a right action with weak reasoning is coached, not
 * congratulated — because a tech who's right by luck isn't yet a tech.
 */
function ReasonedInteraction({
  interaction,
  onAnswered,
  onOutcome,
}: {
  interaction: LessonCardInteraction;
  onAnswered?: () => void;
  onOutcome?: (o: LessonInteractionOutcome) => void;
}) {
  const [stage, setStage] = useState<"action" | "reason" | "verdict">("action");
  const [action, setAction] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const fired = useRef(false);

  const actionRight = action === interaction.correctChoiceId;
  const reasonRight = reason === interaction.correctReasonId;
  const chosenAction = interaction.choices?.find((c) => c.id === action);

  const pickAction = (id: string) => {
    setAction(id);
    setStage("reason");
    if (!fired.current) { fired.current = true; onAnswered?.(); }
  };
  const pickReason = (id: string) => {
    setReason(id);
    setStage("verdict");
    const aRight = action === interaction.correctChoiceId;
    const rRight = id === interaction.correctReasonId;
    onOutcome?.({ interaction: "reasoned", correct: aRight, reasoningQuality: aRight ? (rRight ? "sound" : "weak") : "flawed" });
  };
  const restart = () => { setAction(null); setReason(null); setStage("action"); };

  return (
    <div className="lesson-kc-block rounded-lg border border-[oklch(0.22_0.004_250)] bg-[oklch(0.10_0.003_250)] p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-mono uppercase text-[oklch(0.55_0.12_155)]">
        <Brain className="w-3.5 h-3.5" /> Reason it out
      </div>
      <p className="text-lg font-medium text-white leading-snug">{interaction.prompt}</p>

      {/* Stage 1 — commit to an action (no verdict yet) */}
      <div className="space-y-2">
        {interaction.choices?.map((c) => (
          <button
            key={c.id}
            type="button"
            disabled={stage !== "action"}
            onClick={() => pickAction(c.id)}
            className={`block w-full text-left rounded-md border px-4 py-3 text-base transition-colors min-h-11 ${
              action === c.id ? "border-[oklch(0.45_0.10_250/50%)] bg-[oklch(0.45_0.10_250/8%)] text-white" : "border-[oklch(0.20_0.004_250)] text-[oklch(0.72_0.008_250)] hover:border-[oklch(0.35_0.006_250)]"
            } ${stage !== "action" && action !== c.id ? "opacity-50" : ""}`}
          >
            <GlossaryText text={c.label} />
          </button>
        ))}
      </div>

      {/* Stage 2 — the mentor asks for reasoning BEFORE any verdict */}
      {(stage === "reason" || stage === "verdict") && (
        <div className="rounded-md border border-[oklch(0.22_0.004_250)] bg-[oklch(0.08_0.003_250)] p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-[oklch(0.75_0.10_155)]">
            <Wrench className="w-4 h-4" /> The tech doesn't say if you're right. He asks: <span className="font-medium text-white">{interaction.reasonPrompt}</span>
          </div>
          {interaction.reasons?.map((r) => (
            <button
              key={r.id}
              type="button"
              disabled={stage !== "reason"}
              onClick={() => pickReason(r.id)}
              className={`block w-full text-left rounded-md border px-4 py-2.5 text-base transition-colors min-h-11 ${
                reason === r.id ? "border-[oklch(0.45_0.10_250/50%)] bg-[oklch(0.45_0.10_250/8%)] text-white" : "border-[oklch(0.20_0.004_250)] text-[oklch(0.72_0.008_250)] hover:border-[oklch(0.35_0.006_250)]"
              } ${stage !== "reason" && reason !== r.id ? "opacity-50" : ""}`}
            >
              <GlossaryText text={r.label} />
            </button>
          ))}
        </div>
      )}

      {/* Stage 3 — verdict keyed to BOTH the action and the reasoning */}
      {stage === "verdict" && (
        <div
          className={`rounded-md border-l-4 px-4 py-3 ${
            actionRight && reasonRight
              ? "border-l-[oklch(0.55_0.12_155)] bg-[oklch(0.55_0.12_155/8%)]"
              : actionRight
                ? "border-l-[oklch(0.55_0.12_60)] bg-[oklch(0.55_0.12_60/8%)]"
                : "border-l-[oklch(0.55_0.12_25)] bg-[oklch(0.55_0.12_25/8%)]"
          }`}
          role="status"
        >
          <div className="flex items-start gap-2 mb-2">
            {actionRight && reasonRight ? <Check className="w-5 h-5 text-[oklch(0.55_0.12_155)] shrink-0 mt-0.5" />
              : actionRight ? <Wrench className="w-5 h-5 text-[oklch(0.70_0.10_60)] shrink-0 mt-0.5" />
                : <X className="w-5 h-5 text-[oklch(0.65_0.12_25)] shrink-0 mt-0.5" />}
            <p className={`text-base font-medium ${actionRight && reasonRight ? "text-[oklch(0.75_0.12_155)]" : actionRight ? "text-[oklch(0.78_0.10_60)]" : "text-[oklch(0.72_0.10_25)]"}`}>
              {actionRight && reasonRight ? "Right call — and right reason" : actionRight ? "Right call — but not for the reason you think" : "Not quite"}
            </p>
          </div>
          <p className="text-base leading-relaxed text-[oklch(0.72_0.008_250)]">
            {actionRight && reasonRight ? interaction.feedbackRightReason
              : actionRight ? interaction.feedbackWeakReason
                : interaction.feedbackIncorrect}
          </p>
          {!actionRight && (
            <button type="button" onClick={restart} className="inline-flex items-center gap-1.5 mt-2 text-sm text-[oklch(0.70_0.12_155)] hover:text-white">
              <RotateCcw className="w-3.5 h-3.5" /> Think it through again
            </button>
          )}
          {actionRight && !reasonRight && chosenAction && (
            <p className="text-sm text-[oklch(0.58_0.008_250)] mt-2 pt-2 border-t border-[oklch(0.20_0.004_250)]">You had the right move. Now you know why it works — so next time it's judgment, not luck.</p>
          )}
        </div>
      )}
    </div>
  );
}

function CardInteraction({
  interaction,
  onAnswered,
  onOutcome,
}: {
  interaction: LessonCardInteraction;
  onAnswered?: () => void;
  onOutcome?: (o: LessonInteractionOutcome) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [choice, setChoice] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const firedRef = useRef(false);
  const outcomeFired = useRef(false);
  const isMcqOnly = interaction.type === "choice" && !interaction.prompt.includes("?");

  if (interaction.type === "reasoned") {
    return <ReasonedInteraction interaction={interaction} onAnswered={onAnswered} onOutcome={onOutcome} />;
  }

  if (interaction.type === "sequence") {
    return <SequenceInteraction interaction={interaction} onAnswered={onAnswered} onOutcome={onOutcome} />;
  }

  if (interaction.type === "reveal") {
    return (
      <div className="mt-3 rounded-lg border border-[oklch(0.22_0.004_250)] bg-[oklch(0.10_0.003_250)] p-3">
        {!revealed ? (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="w-full text-left text-base font-medium text-[oklch(0.75_0.12_155)] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.55_0.12_155)] rounded px-2 py-3 min-h-11"
          >
            {interaction.prompt}
          </button>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-[oklch(0.55_0.12_155)] mb-2">
              <Lightbulb className="w-3.5 h-3.5" />
              {interaction.revealTitle}
            </div>
            <p className="text-base leading-relaxed text-[oklch(0.72_0.008_250)]">
              <GlossaryText text={interaction.revealBody ?? ""} />
            </p>
          </div>
        )}
      </div>
    );
  }

  // Master-tech mode: choices carry their own reaction, so a wrong pick shows the
  // master's response and the learner tries again (productive failure) instead of
  // the card locking on the first answer.
  const hasResponses = !!interaction.choices?.some((c) => c.response);
  const answered = choice !== null;
  const isRightPick = choice === interaction.correctChoiceId;
  const correct = hasResponses ? solved : answered && isRightPick;
  const locked = hasResponses ? solved : answered;
  const correctChoice = interaction.choices?.find((c) => c.id === interaction.correctChoiceId);
  const pickedChoice = interaction.choices?.find((c) => c.id === choice);
  const isPredict = interaction.type === "predict";
  const masterReacting = hasResponses && answered && !solved; // showing a reaction to a wrong move

  const pick = (id: string) => {
    const right = id === interaction.correctChoiceId;
    setChoice(id);
    if (hasResponses && right) setSolved(true);
    if (!firedRef.current) { firedRef.current = true; onAnswered?.(); }
    if (!outcomeFired.current) { outcomeFired.current = true; onOutcome?.({ interaction: isPredict ? "predict" : "choice", correct: right }); }
  };

  return (
    <div className={`lesson-kc-block rounded-lg border border-[oklch(0.22_0.004_250)] bg-[oklch(0.10_0.003_250)] p-4 space-y-3 ${isMcqOnly ? "" : "mt-3"}`}>
      {isPredict && (
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-[oklch(0.55_0.12_155)]">
          <Eye className="w-3.5 h-3.5" /> Predict first
        </div>
      )}
      <p className="text-lg font-medium text-white leading-snug">{interaction.prompt}</p>
      <div className="space-y-2">
        {interaction.choices?.map((c) => {
          const showCorrect = locked && c.id === interaction.correctChoiceId;
          const showWrong = c.id === choice && c.id !== interaction.correctChoiceId;
          return (
            <button
              key={c.id}
              type="button"
              disabled={locked}
              onClick={() => pick(c.id)}
              className={`block w-full text-left rounded-md border px-4 py-3 text-base transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.55_0.12_155)] min-h-11 ${
                showCorrect
                  ? "border-[oklch(0.55_0.12_155/50%)] bg-[oklch(0.55_0.12_155/10%)] text-white"
                  : showWrong
                    ? "border-[oklch(0.55_0.12_25/40%)] bg-[oklch(0.55_0.12_25/8%)] text-[oklch(0.72_0.008_250)]"
                    : "border-[oklch(0.20_0.004_250)] text-[oklch(0.72_0.008_250)] hover:border-[oklch(0.35_0.006_250)]"
              }`}
            >
              <GlossaryText text={c.label} />
            </button>
          );
        })}
      </div>

      {/* Master reacting to a wrong move — the apprenticeship moment, not a red X */}
      {masterReacting && pickedChoice?.response && (
        <div className="rounded-md border-l-4 border-l-[oklch(0.55_0.12_60)] bg-[oklch(0.55_0.12_60/8%)] px-4 py-3" role="status">
          <div className="flex items-center gap-2 mb-1 text-xs font-mono uppercase text-[oklch(0.70_0.10_60)]">
            <Wrench className="w-3.5 h-3.5" /> The tech watches you
          </div>
          <p className="text-base leading-relaxed text-[oklch(0.74_0.008_250)]"><GlossaryText text={pickedChoice.response} /></p>
          <p className="text-sm text-[oklch(0.58_0.008_250)] mt-1">Go on — try again.</p>
        </div>
      )}

      {locked && (
        <div
          className={`rounded-md border-l-4 px-4 py-3 ${
            correct
              ? "border-l-[oklch(0.55_0.12_155)] bg-[oklch(0.55_0.12_155/8%)]"
              : "border-l-[oklch(0.55_0.12_25)] bg-[oklch(0.55_0.12_25/8%)]"
          }`}
          role="status"
        >
          <div className="flex items-start gap-2 mb-2">
            {correct ? (
              <Check className="w-5 h-5 text-[oklch(0.55_0.12_155)] shrink-0 mt-0.5" />
            ) : (
              <X className="w-5 h-5 text-[oklch(0.65_0.12_25)] shrink-0 mt-0.5" />
            )}
            <p className={`text-base font-medium ${correct ? "text-[oklch(0.75_0.12_155)]" : "text-[oklch(0.72_0.10_25)]"}`}>
              {correct ? "That's it" : "Not quite"}
            </p>
          </div>
          <p className="text-base leading-relaxed text-[oklch(0.72_0.008_250)]">
            {correct ? interaction.feedbackCorrect : interaction.feedbackIncorrect}
          </p>
          {!correct && !hasResponses && correctChoice && (
            <p className="text-sm leading-relaxed text-[oklch(0.60_0.008_250)] mt-2 pt-2 border-t border-[oklch(0.20_0.004_250)]">
              <span className="font-medium text-[oklch(0.70_0.008_250)]">Correct answer: </span>
              <GlossaryText text={correctChoice.label} />
            </p>
          )}
          {isPredict && interaction.outcomeBody && (
            <div className="mt-3 pt-3 border-t border-[oklch(0.20_0.004_250)]">
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-[oklch(0.55_0.12_155)] mb-1">
                <Lightbulb className="w-3.5 h-3.5" /> {interaction.outcomeTitle ?? "What actually happens"}
              </div>
              <p className="text-base leading-relaxed text-[oklch(0.72_0.008_250)]">
                <GlossaryText text={interaction.outcomeBody} />
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryLabButtons({ ctas }: { ctas: SummaryLabCta[] }) {
  if (!ctas.length) return null;
  return (
    <div className="mt-4 flex flex-col sm:flex-row gap-2">
      {ctas.map((cta) => {
        const Icon = cta.variant === "practice" ? FlaskConical : Wrench;
        return (
          <Link
            key={cta.href}
            href={cta.href}
            className="inline-flex items-center justify-center gap-2 flex-1 px-4 py-3 text-xs sm:text-sm font-mono rounded-md border border-[oklch(0.55_0.12_155/45%)] bg-[oklch(0.55_0.12_155/12%)] text-[oklch(0.78_0.12_155)] hover:text-white hover:border-[oklch(0.55_0.12_155/70%)] min-h-[2.75rem]"
          >
            <Icon className="w-4 h-4 shrink-0" />
            {cta.label}
            <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
          </Link>
        );
      })}
    </div>
  );
}

export default function LearningCardView({
  card,
  summaryCtas,
  onKnowledgeCheckAnswered,
  onOutcome,
  onSkipIntro,
}: {
  card: LessonCard;
  summaryCtas?: SummaryLabCta[];
  onKnowledgeCheckAnswered?: () => void;
  onOutcome?: (o: LessonInteractionOutcome) => void;
  onSkipIntro?: () => void;
}) {
  const isMcqCard = card.interaction?.type === "choice" && !card.body.trim();
  const hasDiagram = card.visual?.type === "diagram";
  const hasTextImage = card.body.trim() && card.visual?.type === "diagram";

  return (
    <article
      className={`lesson-card-view flex flex-col justify-between h-full ${
        isMcqCard ? "min-h-[240px]" : "min-h-[280px]"
      }`}
      aria-labelledby={`card-heading-${card.id}`}
    >
      <div
        className={`space-y-3 overflow-y-auto min-h-0 flex-1 ${
          hasTextImage ? "lesson-slide-text-image" : ""
        }`}
      >
        <div className="flex items-center gap-2 justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[oklch(0.50_0.10_155)] px-2 py-0.5 rounded border border-[oklch(0.55_0.12_155/25%)]">
            {KIND_LABELS[card.kind]}
          </span>
          {card.heading === "New to this?" && onSkipIntro && (
            <button
              type="button"
              onClick={onSkipIntro}
              className="text-xs font-mono text-[oklch(0.55_0.12_155)] hover:text-white transition-colors"
            >
              I know these →
            </button>
          )}
        </div>
        <h2 id={`card-heading-${card.id}`} className="text-xl sm:text-2xl font-heading text-white tracking-wide leading-snug">
          <GlossaryText text={card.heading} />
        </h2>
        {hasTextImage ? (
          <div className="lesson-slide-split">
            <p className="text-base leading-relaxed text-[oklch(0.72_0.008_250)] lesson-slide-split-text">
              <GlossaryText text={card.body} />
            </p>
            <LessonCardVisualBlock visual={card.visual} showZoom={hasDiagram} />
          </div>
        ) : (
          <>
            {card.body.trim() ? (
              <p className="text-base leading-relaxed text-[oklch(0.72_0.008_250)]">
                <GlossaryText text={card.body} />
              </p>
            ) : null}
            <LessonCardVisualBlock visual={card.visual} showZoom={hasDiagram} />
          </>
        )}
        {card.interaction && (
          <CardInteraction
            interaction={card.interaction}
            onAnswered={onKnowledgeCheckAnswered}
            onOutcome={onOutcome ? (o) => onOutcome({ ...o, cardId: card.id, mechanicId: card.mechanicId }) : undefined}
          />
        )}
        {card.kind === "summary" && summaryCtas && <SummaryLabButtons ctas={summaryCtas} />}
      </div>
      {card.takeaway && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-[oklch(0.22_0.004_250)] bg-[oklch(0.09_0.003_250)] px-3 py-2 shrink-0">
          <CheckCircle2 className="w-4 h-4 text-[oklch(0.55_0.12_155)] shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-[oklch(0.65_0.008_250)]">
            <GlossaryText text={card.takeaway} />
          </p>
        </div>
      )}
    </article>
  );
}
