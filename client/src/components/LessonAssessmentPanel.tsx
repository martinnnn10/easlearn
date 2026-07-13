/**
 * In-lesson formative (knowledge check) + summative (lesson quiz) assessments.
 * Gates progression per accreditation requirements.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Brain, GraduationCap, Lock, RotateCcw, Wrench, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  KNOWLEDGE_CHECK_PASS_PERCENT,
  LESSON_QUIZ_PASS_PERCENT,
} from "@shared/assessment";

type Question = {
  id: number;
  question: string;
  options: unknown;
  sortOrder: number;
};

function normalizeOptions(options: unknown): string[] {
  if (Array.isArray(options)) return options.map(String);
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return [];
    }
  }
  return [];
}

type Props = {
  lessonId: number;
  moduleId: number;
  knowledgeCheckQuestions: Question[];
  lessonQuizQuestions: Question[];
  initialStatus: {
    knowledgeCheckPassed: boolean;
    lessonQuizPassed: boolean;
    scenarioRequired?: boolean;
    scenarioPassed?: boolean;
    scenarioSlug?: string | null;
    lessonQuizAttemptsRemaining: number;
    lessonQuizCooldownEndsAt: string | null;
  };
  isAuthenticated: boolean;
  onLessonComplete: () => void;
  isLessonCompleted: boolean;
  /** Legacy lessons: show Mark Complete button. Card lessons: completion is summary-driven. */
  requireExplicitMarkComplete?: boolean;
};

type Phase = "knowledge_check" | "lesson_quiz" | "done";

function AssessmentRunner({
  type,
  title,
  icon: Icon,
  passPercent,
  questions,
  lessonId,
  onPassed,
  continueLabel,
  attemptsRemaining,
  cooldownEndsAt,
}: {
  type: "knowledge_check" | "lesson_quiz";
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  passPercent: number;
  questions: Question[];
  lessonId: number;
  onPassed: () => void;
  continueLabel: string;
  attemptsRemaining?: number;
  cooldownEndsAt?: string | null;
}) {
  const utils = trpc.useUtils();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    results: Array<{ isCorrect: boolean; explanation: string; correctIndex: number; selectedIndex: number }>;
    lessonQuizAttemptsRemaining?: number;
  } | null>(null);

  const submit = trpc.lessonAssessment.submit.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setSubmitted(true);
      setSubmitError(null);
      utils.courses.getLesson.invalidate();
      utils.courses.getProgress.invalidate();
    },
    onError: (err) => {
      setSubmitError(err.message || "Could not submit — try again.");
    },
  });

  const resetAttempt = () => {
    setSubmitted(false);
    setResult(null);
    setSubmitError(null);
    setCurrent(0);
    setAnswers({});
  };

  if (questions.length === 0) return null;

  const inCooldown =
    type === "lesson_quiz" &&
    cooldownEndsAt &&
    new Date(cooldownEndsAt).getTime() > Date.now();

  if (inCooldown) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-6 text-center">
          <Lock className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <p className="text-sm text-[oklch(0.65_0.008_250)]">
            Maximum attempts reached. Retry available after{" "}
            {new Date(cooldownEndsAt!).toLocaleString()}.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (type === "lesson_quiz" && attemptsRemaining === 0) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-6 text-center">
          <Lock className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <p className="text-sm text-[oklch(0.65_0.008_250)]">No quiz attempts remaining in this window.</p>
        </CardContent>
      </Card>
    );
  }

  if (submitted && result) {
    return (
      <Card className={result.passed ? "border-[oklch(0.55_0.12_155/40%)]" : "border-red-500/30"}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-heading tracking-wide">
            {result.passed ? (
              <CheckCircle2 className="w-5 h-5 text-[oklch(0.55_0.12_155)]" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
            {result.passed ? `${title} Passed` : `${title} — Not Passed`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className={`text-sm ${result.passed ? "text-[oklch(0.65_0.12_155)]" : "text-red-300/90"}`}>
            Score: <strong className="text-white">{result.score}%</strong> — you need {passPercent}% to pass.
            {!result.passed && " Review the feedback below and try again."}
          </p>
          <div className="space-y-3">
            {questions.map((q, i) => {
              const r = result.results[i];
              const opts = normalizeOptions(q.options);
              if (!r) return null;
              return (
                <div
                  key={q.id}
                  className={`p-3 rounded-lg text-sm border ${
                    r.isCorrect
                      ? "bg-[oklch(0.55_0.12_155/8%)] border-[oklch(0.55_0.12_155/25%)]"
                      : "bg-red-500/10 border-red-500/25"
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {r.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-[oklch(0.55_0.12_155)] shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <p className="text-white">{q.question}</p>
                  </div>
                  <div className="ml-6 space-y-1">
                    {opts.map((opt, optIdx) => {
                      const isSelected = r.selectedIndex === optIdx;
                      const isCorrect = r.correctIndex === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`text-sm px-2 py-2 rounded break-words ${
                            isCorrect
                              ? "bg-[oklch(0.55_0.12_155/15%)] text-[oklch(0.75_0.12_155)]"
                              : isSelected
                              ? "bg-red-500/20 text-red-200 line-through"
                              : "text-[oklch(0.50_0.008_250)]"
                          }`}
                        >
                          {opt}
                          {isCorrect && " ✓"}
                          {isSelected && !isCorrect && " (your answer)"}
                        </div>
                      );
                    })}
                  </div>
                  {r.explanation && (
                    <p className="text-[oklch(0.55_0.008_250)] text-sm leading-relaxed mt-2 ml-6 break-words">{r.explanation}</p>
                  )}
                </div>
              );
            })}
          </div>
          {result.passed ? (
            <Button className="w-full btn-primary" onClick={onPassed}>
              {continueLabel} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button variant="outline" className="w-full" onClick={resetAttempt}>
              <RotateCcw className="w-4 h-4 mr-2" /> Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const q = questions[current];
  const qOptions = normalizeOptions(q.options);
  const allAnswered = questions.every((question) => answers[question.id] !== undefined);

  return (
    <Card className="border-[oklch(0.18_0.004_250)]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-heading tracking-wide text-white">
          <Icon className="w-5 h-5 text-[oklch(0.55_0.12_155)]" />
          {title}
        </CardTitle>
        <p className="text-xs text-[oklch(0.50_0.008_250)]">
          Question {current + 1} of {questions.length} · {passPercent}% required to pass
          {type === "lesson_quiz" && attemptsRemaining != null && (
            <> · {attemptsRemaining} attempt{attemptsRemaining !== 1 ? "s" : ""} left</>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-white text-sm leading-relaxed">{q.question}</p>
        <div className="space-y-2">
          {qOptions.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: idx }))}
              className={`w-full text-left p-3 min-h-[2.75rem] rounded-lg border text-sm transition-colors break-words ${
                answers[q.id] === idx
                  ? "border-[oklch(0.55_0.12_155/50%)] bg-[oklch(0.55_0.12_155/10%)] text-white"
                  : "border-[oklch(0.15_0.004_250)] text-[oklch(0.70_0.008_250)] hover:border-[oklch(0.25_0.004_250)]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {submitError && (
          <p className="text-xs text-red-400">{submitError}</p>
        )}
        <div className="flex gap-2">
          {current > 0 && (
            <Button variant="outline" onClick={() => setCurrent((c) => c - 1)}>
              Back
            </Button>
          )}
          {current < questions.length - 1 ? (
            <Button
              className="flex-1 btn-primary"
              disabled={answers[q.id] === undefined}
              onClick={() => setCurrent((c) => c + 1)}
            >
              Next
            </Button>
          ) : (
            <Button
              className="flex-1 btn-primary"
              disabled={!allAnswered || submit.isPending}
              onClick={() =>
                submit.mutate({
                  lessonId,
                  type,
                  answers: questions.map((question) => ({
                    questionId: question.id,
                    selectedIndex: answers[question.id],
                  })),
                })
              }
            >
              {submit.isPending ? "Submitting..." : "Submit"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LessonAssessmentPanel({
  lessonId,
  moduleId,
  knowledgeCheckQuestions,
  lessonQuizQuestions,
  initialStatus,
  isAuthenticated,
  onLessonComplete,
  isLessonCompleted,
  requireExplicitMarkComplete = true,
}: Props) {
  const [kcPassed, setKcPassed] = useState(initialStatus.knowledgeCheckPassed);
  const [quizPassed, setQuizPassed] = useState(initialStatus.lessonQuizPassed);
  const [attemptsRemaining, setAttemptsRemaining] = useState(initialStatus.lessonQuizAttemptsRemaining);

  const scenarioRequired = initialStatus.scenarioRequired ?? false;
  const scenarioPassed = initialStatus.scenarioPassed ?? false;
  const scenarioSlug = initialStatus.scenarioSlug;

  const markComplete = trpc.courses.markLessonComplete.useMutation({
    onSuccess: () => onLessonComplete(),
  });

  const hasAssessments =
    knowledgeCheckQuestions.length > 0 || lessonQuizQuestions.length > 0;

  if (!hasAssessments) return null;

  const needsKc = knowledgeCheckQuestions.length > 0 && !kcPassed;
  const needsQuiz = lessonQuizQuestions.length > 0 && !quizPassed;
  const needsScenario = scenarioRequired && !scenarioPassed && !needsKc && !needsQuiz;

  const phase: Phase = needsKc
    ? "knowledge_check"
    : needsQuiz || needsScenario
      ? "lesson_quiz"
      : "done";

  const showScenarioGate = needsScenario && scenarioSlug;
  const showCompleteButton =
    requireExplicitMarkComplete &&
    !needsKc &&
    !needsQuiz &&
    !needsScenario &&
    !isLessonCompleted;

  if (!isAuthenticated) {
    return (
      <div className="mt-10 p-6 card-panel border-[oklch(0.55_0.12_155/20%)]">
        <Brain className="w-6 h-6 text-[oklch(0.55_0.12_155)] mx-auto mb-2" />
        <p className="text-sm text-center text-[oklch(0.55_0.008_250)]">
          Sign in to complete knowledge checks and lesson quizzes — required for progression and certificates.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-12 space-y-6 lesson-assess-panel">
      <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-[oklch(0.45_0.006_250)]">
        <span className={kcPassed ? "text-[oklch(0.55_0.12_155)]" : phase === "knowledge_check" ? "text-white" : ""}>
          1 · Knowledge Check
        </span>
        <span>→</span>
        <span className={quizPassed ? "text-[oklch(0.55_0.12_155)]" : phase === "lesson_quiz" && needsQuiz ? "text-white" : ""}>
          2 · Lesson Quiz
        </span>
        {scenarioRequired && (
          <>
            <span>→</span>
            <span className={scenarioPassed ? "text-[oklch(0.55_0.12_155)]" : showScenarioGate ? "text-white" : ""}>
              3 · Troubleshooting
            </span>
          </>
        )}
        <span>→</span>
        <span className={isLessonCompleted ? "text-[oklch(0.55_0.12_155)]" : ""}>
          {scenarioRequired ? "4" : "3"} · Complete
        </span>
      </div>

      <AnimatePresence mode="wait">
        {phase === "knowledge_check" && (
          <motion.div key="kc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <AssessmentRunner
              type="knowledge_check"
              title="Knowledge Check"
              icon={Brain}
              passPercent={KNOWLEDGE_CHECK_PASS_PERCENT}
              questions={knowledgeCheckQuestions}
              lessonId={lessonId}
              continueLabel="Continue to Lesson Quiz"
              onPassed={() => setKcPassed(true)}
            />
            <p className="text-xs text-[oklch(0.45_0.006_250)] mt-3 text-center">
              Pass this check to unlock the lesson quiz and continue.
            </p>
          </motion.div>
        )}

        {phase === "lesson_quiz" && needsQuiz && (
          <motion.div key="quiz" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <AssessmentRunner
              type="lesson_quiz"
              title="Lesson Quiz"
              icon={GraduationCap}
              passPercent={LESSON_QUIZ_PASS_PERCENT}
              questions={lessonQuizQuestions}
              lessonId={lessonId}
              attemptsRemaining={attemptsRemaining}
              cooldownEndsAt={initialStatus.lessonQuizCooldownEndsAt}
              continueLabel={scenarioRequired ? "Continue to Troubleshooting" : "Continue"}
              onPassed={() => {
                setQuizPassed(true);
                setAttemptsRemaining((n) => Math.max(0, n));
              }}
            />
          </motion.div>
        )}

        {showScenarioGate && (
          <motion.div key="scenario" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-6 text-center space-y-4">
                <Wrench className="w-10 h-10 text-primary mx-auto" />
                <p className="font-medium">Troubleshooting Challenge Required</p>
                <p className="text-sm text-muted-foreground">
                  Complete the linked simulator scenario before marking this lesson done.
                </p>
                <Link href={`/simulator?scenario=${encodeURIComponent(scenarioSlug!)}`}>
                  <Button className="btn-primary">Open Troubleshooting Scenario</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {showCompleteButton && (
          <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Button
              className="btn-primary"
              disabled={markComplete.isPending}
              onClick={() => markComplete.mutate({ lessonId, moduleId })}
            >
              {markComplete.isPending ? "Saving..." : "Mark Lesson Complete"}
            </Button>
          </motion.div>
        )}

        {isLessonCompleted && !needsKc && !needsQuiz && !needsScenario && (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 text-sm text-[oklch(0.55_0.12_155)] p-4 rounded-lg bg-[oklch(0.55_0.12_155/8%)] border border-[oklch(0.55_0.12_155/25%)]"
          >
            <CheckCircle2 className="w-4 h-4" />
            Assessments passed — lesson complete
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
