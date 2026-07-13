/**
 * Lesson Page - Individual lesson viewer with markdown content
 * Supports inline interactive components via <!-- INTERACTIVE: ComponentName --> markers
 */
import { useMemo, useEffect, useState, useCallback } from "react";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { LessonReadingProgressBar } from "@/components/lessons/LessonReadingProgressBar";
import { motion } from "framer-motion";
import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, CheckCircle, Clock, BookOpen, Bookmark, BookmarkCheck, Lock, Printer } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useAnalytics } from "@/hooks/useAnalytics";
import SEO from "@/components/SEO";
import { Streamdown } from "streamdown";
import { useLastLesson } from "@/hooks/useLastLesson";
import VFDArchitectureDiagram from "@/components/VFDArchitectureDiagram";
import PlantFloorCallout from "@/components/PlantFloorCallout";
import {
  GuidedVFDWalkthrough,
  OhmsLawCalculator,
  PLCLogicVisualizer,
  RelaySimulator,
  CircuitFlowAnimator,
} from "@/components/interactive";
import LessonAssessmentPanel from "@/components/LessonAssessmentPanel";
import LessonIluStrip from "@/components/LessonIluStrip";
import LessonCardPlayer from "@/components/lessons/LessonCardPlayer";
import LessonLoggedOutPreview from "@/components/lessons/LessonLoggedOutPreview";
import { getLessonIluStripData, buildIluCtaHref } from "@shared/iluLinks";
import { getLessonCardDeck, isCardFormatLesson } from "@shared/lessonCardContent";
import { LESSON_CARD_ASSESS_NOTE, LESSON_PROGRESSION_NAV_HINT } from "@shared/progressionCopy";
import { getLessonIluLinks, getLearningPathBySlug, getModuleHubId } from "@shared/lessonPracticeMap";
import { isLocalQaFullDeck } from "@shared/lessonCardNav";
import { getLegacyQaLesson } from "@shared/legacyQaContent";
import type { SummaryLabCta } from "@/components/lessons/LearningCardView";

function buildSummaryLabCtas(moduleSlug: string, lessonSlug: string): SummaryLabCta[] {
  if (!isCardFormatLesson(moduleSlug, lessonSlug)) return [];
  const hubId = getModuleHubId(moduleSlug);
  const links = getLessonIluLinks(moduleSlug, lessonSlug, "A");
  const ctas: SummaryLabCta[] = [];
  const practice = links.find((l) => l.stage === "practice");
  const troubleshoot = links.find((l) => l.stage === "troubleshoot");
  if (practice) {
    ctas.push({
      label: "Open Multimeter Lab",
      href: buildIluCtaHref({ link: practice, moduleSlug, lessonSlug, hubId }),
      variant: "practice",
    });
  }
  if (troubleshoot) {
    ctas.push({
      label: "Open Conveyor Lab",
      href: buildIluCtaHref({ link: troubleshoot, moduleSlug, lessonSlug, hubId }),
      variant: "troubleshoot",
    });
  }
  return ctas;
}

/** Map of interactive component names to React components */
const INTERACTIVE_COMPONENTS: Record<string, React.ComponentType> = {
  OhmsLawCalculator,
  PLCLogicVisualizer,
  RelaySimulator,
  CircuitFlowAnimator,
};

/**
 * Split lesson markdown content at <!-- INTERACTIVE: Name --> markers
 * and return alternating text/component segments for rendering.
 */
function useLessonSegments(content: string) {
  return useMemo(() => {
    const pattern = /<!--\s*INTERACTIVE:\s*(\w+)\s*-->/g;
    const segments: Array<{ type: "text"; value: string } | { type: "component"; name: string }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(content)) !== null) {
      // Text before the marker
      if (match.index > lastIndex) {
        segments.push({ type: "text", value: content.slice(lastIndex, match.index) });
      }
      segments.push({ type: "component", name: match[1] });
      lastIndex = match.index + match[0].length;
    }

    // Remaining text after last marker
    if (lastIndex < content.length) {
      segments.push({ type: "text", value: content.slice(lastIndex) });
    }

    return segments;
  }, [content]);
}

export default function Lesson() {
  const { moduleSlug, lessonSlug } = useParams<{ moduleSlug: string; lessonSlug: string }>();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: lessonData, isLoading } = trpc.courses.getLesson.useQuery({
    moduleSlug: moduleSlug!,
    lessonSlug: lessonSlug!,
  });
  const { data: subscription, isLoading: subLoading } = trpc.stripe.getSubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: progress } = trpc.courses.getProgress.useQuery(
    { moduleId: lessonData?.lesson?.moduleId ?? 0 },
    { enabled: isAuthenticated && !!lessonData?.lesson?.moduleId }
  );

  const utils = trpc.useUtils();
  const { trackLessonCompleted, trackCourseStarted } = useAnalytics();
  const recordStreak = trpc.streaks.recordActivity.useMutation({
    onSuccess: () => utils.streaks.getMyStreak.invalidate(),
  });
  // Track course_started when user views first lesson in a module (no prior progress)
  useEffect(() => {
    if (lessonData?.module && progress && isAuthenticated) {
      const completedCount = progress.completedLessonIds?.length ?? 0;
      if (completedCount === 0) {
        trackCourseStarted({
          moduleSlug: moduleSlug!,
          moduleTitle: lessonData.module.title,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonData?.module?.id, progress?.completedLessonIds?.length, isAuthenticated]);

  // Bookmark state
  const { data: bookmarkData } = trpc.bookmarks.isBookmarked.useQuery(
    { lessonId: lessonData?.lesson?.id ?? 0 },
    { enabled: isAuthenticated && !!lessonData?.lesson?.id }
  );
  const toggleBookmark = trpc.bookmarks.toggle.useMutation({
    onSuccess: () => {
      utils.bookmarks.isBookmarked.invalidate();
      utils.bookmarks.list.invalidate();
    },
  });

  const hasPaidAccess = subscription?.hasActiveSubscription ?? false;

  // BUG FIX: Wait for BOTH auth AND subscription data before making gating decisions
  // Race condition: isAuthenticated starts false while auth.me loads, causing subscription query
  // to never fire (enabled: false), making subscriptionResolved = true prematurely.
  // We must wait for auth to resolve first, THEN wait for subscription if authenticated.
  const subscriptionResolved = !authLoading && (!isAuthenticated || !subLoading);

  // Track last viewed lesson for resume functionality
  const { saveLastLesson } = useLastLesson();
  useEffect(() => {
    if (lessonData?.lesson && lessonData?.module) {
      saveLastLesson({
        moduleSlug: moduleSlug!,
        lessonSlug: lessonSlug!,
        moduleTitle: lessonData.module.title,
        lessonTitle: lessonData.lesson.title,
        lessonIndex: lessonData.lessonIndex,
        totalLessons: lessonData.totalLessons,
      });
    }
  }, [lessonData?.lesson?.id]);

  const isCardLessonRoute =
    Boolean(moduleSlug && lessonSlug && isCardFormatLesson(moduleSlug, lessonSlug));
  const activeLessonId = lessonData?.lesson?.id;
  const activeModuleId = lessonData?.lesson?.moduleId;
  const lessonCompletedInDb =
    activeLessonId != null &&
    (progress?.completedLessonIds?.includes(activeLessonId) ?? false);

  const [summaryReached, setSummaryReached] = useState(false);
  useEffect(() => {
    setSummaryReached(false);
  }, [activeLessonId]);

  const markLessonCompleteMut = trpc.courses.markLessonComplete.useMutation({
    onSuccess: () => {
      utils.courses.getProgress.invalidate();
      utils.courses.getLesson.invalidate();
      recordStreak.mutate();
      if (lessonData?.lesson && lessonData?.module && moduleSlug && lessonSlug) {
        trackLessonCompleted({ moduleSlug, lessonSlug });
      }
    },
  });

  const cardAssessmentsSatisfied = useMemo(() => {
    const kcCount = lessonData?.knowledgeCheckQuestions?.length ?? 0;
    const quizCount = lessonData?.lessonQuizQuestions?.length ?? 0;
    const gate = lessonData?.gateStatus;
    if (kcCount === 0 && quizCount === 0 && !gate?.scenarioRequired) return true;
    if (!gate) return false;
    return (
      (kcCount === 0 || gate.knowledgeCheckPassed) &&
      (quizCount === 0 || gate.lessonQuizPassed) &&
      (!gate.scenarioRequired || gate.scenarioPassed)
    );
  }, [lessonData?.gateStatus, lessonData?.knowledgeCheckQuestions, lessonData?.lessonQuizQuestions]);

  const tryMarkCardLessonComplete = useCallback(() => {
    if (
      !isCardLessonRoute ||
      !isAuthenticated ||
      !activeLessonId ||
      !activeModuleId ||
      lessonCompletedInDb ||
      !summaryReached ||
      !cardAssessmentsSatisfied ||
      markLessonCompleteMut.isPending ||
      markLessonCompleteMut.isSuccess
    ) {
      return;
    }
    markLessonCompleteMut.mutate({ lessonId: activeLessonId, moduleId: activeModuleId });
  }, [
    isCardLessonRoute,
    isAuthenticated,
    activeLessonId,
    activeModuleId,
    lessonCompletedInDb,
    summaryReached,
    cardAssessmentsSatisfied,
    markLessonCompleteMut.isPending,
    markLessonCompleteMut.isSuccess,
    markLessonCompleteMut.mutate,
  ]);

  useEffect(() => {
    tryMarkCardLessonComplete();
  }, [tryMarkCardLessonComplete]);

  // Parse content segments (must be called unconditionally for hooks rules)
  // Strip leading H1 from markdown content to avoid duplicate title (page header already shows lesson.title)
  const qaLegacyLesson =
    moduleSlug && lessonSlug && isLocalQaFullDeck() ? getLegacyQaLesson(moduleSlug, lessonSlug) : undefined;
  const rawContent = lessonData?.lesson?.content ?? qaLegacyLesson?.content ?? "";
  const strippedContent = rawContent.replace(/^#\s+[^\n]+\n*/, "");
  const segments = useLessonSegments(strippedContent);
  const scrollState = useScrollProgress();

  // MUST be called unconditionally (before any early returns) to satisfy React hooks rules
  const summaryLabCtas = useMemo(
    () => (moduleSlug && lessonSlug ? buildSummaryLabCtas(moduleSlug, lessonSlug) : []),
    [moduleSlug, lessonSlug]
  );

  if (isLoading) {
    const loadingDeck =
      moduleSlug && lessonSlug ? getLessonCardDeck(moduleSlug, lessonSlug) : undefined;
    if (loadingDeck && moduleSlug && lessonSlug && isCardFormatLesson(moduleSlug, lessonSlug)) {
      const pathMeta = getLearningPathBySlug(moduleSlug);
      const loadingSummaryCtas = buildSummaryLabCtas(moduleSlug, lessonSlug);
      if (isLocalQaFullDeck()) {
        return (
          <div>
            <SEO
              title={loadingDeck.title}
              description={loadingDeck.whatYoullLearn[0]}
              path={`/courses/${moduleSlug}/${lessonSlug}`}
            />
            <section className="py-10 border-b border-[oklch(0.15_0.004_250)]">
              <div className="container max-w-3xl">
                <Link
                  href={`/courses/${moduleSlug}`}
                  className="inline-flex items-center gap-2 text-sm text-[oklch(0.55_0.12_155)] mb-4 hover:gap-3 transition-all"
                >
                  {pathMeta?.pathTitle ?? moduleSlug}
                </Link>
                <h1 className="text-2xl sm:text-3xl font-heading text-white tracking-wide">{loadingDeck.title}</h1>
              </div>
            </section>
            <section className="py-10">
              <div className="container max-w-3xl">
                <LessonIluStrip moduleSlug={moduleSlug} lessonSlug={lessonSlug} />
                <LessonCardPlayer deck={loadingDeck} summaryCtas={loadingSummaryCtas} />
                <p className="mt-6 text-xs text-[oklch(0.50_0.008_250)] leading-relaxed rounded-lg border border-[oklch(0.16_0.004_250)] bg-[oklch(0.08_0.003_250)] px-4 py-3">
                  {LESSON_CARD_ASSESS_NOTE}
                </p>
              </div>
            </section>
          </div>
        );
      }
      // BUG FIX: If user is authenticated (or auth is still loading), show a loading skeleton
      // instead of the logged-out preview. The previous code always showed the paywall preview
      // during the lesson data loading phase, even for authenticated users with active subscriptions.
      if (isAuthenticated || authLoading) {
        return (
          <div className="py-20">
            <div className="container max-w-3xl">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-[oklch(0.15_0.003_250)] rounded w-1/4" />
                <div className="h-8 bg-[oklch(0.15_0.003_250)] rounded w-2/3" />
                <div className="h-4 bg-[oklch(0.15_0.003_250)] rounded w-full mt-8" />
                <div className="h-4 bg-[oklch(0.15_0.003_250)] rounded w-5/6" />
                <div className="h-4 bg-[oklch(0.15_0.003_250)] rounded w-4/5" />
              </div>
            </div>
          </div>
        );
      }
      return (
        <div>
          <SEO
            title={loadingDeck.title}
            description={loadingDeck.whatYoullLearn[0]}
            path={`/courses/${moduleSlug}/${lessonSlug}`}
          />
          <LessonLoggedOutPreview
            deck={loadingDeck}
            moduleTitle={pathMeta?.pathTitle ?? moduleSlug}
            moduleSlug={moduleSlug}
          />
        </div>
      );
    }
    if (loadingDeck) {
      return (
        <div className="py-20">
          <div className="container max-w-3xl">
            <p className="text-sm text-[oklch(0.55_0.008_250)]">{loadingDeck.title}</p>
            <p className="text-xs text-[oklch(0.45_0.006_250)] mt-4">Loading lesson…</p>
          </div>
        </div>
      );
    }
    return (
      <div className="py-20">
        <div className="container max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-[oklch(0.15_0.003_250)] rounded w-1/4" />
            <div className="h-10 bg-[oklch(0.15_0.003_250)] rounded w-2/3" />
            <div className="h-4 bg-[oklch(0.15_0.003_250)] rounded w-full mt-8" />
            <div className="h-4 bg-[oklch(0.15_0.003_250)] rounded w-5/6" />
            <div className="h-4 bg-[oklch(0.15_0.003_250)] rounded w-4/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!lessonData?.lesson) {
    const orphanDeck =
      moduleSlug && lessonSlug ? getLessonCardDeck(moduleSlug, lessonSlug) : undefined;
    if (orphanDeck) {
      const pathMeta = getLearningPathBySlug(moduleSlug!);
      if (!isLocalQaFullDeck()) {
        return (
          <div>
            <SEO
              title={orphanDeck.title}
              description={orphanDeck.whatYoullLearn[0]}
              path={`/courses/${moduleSlug}/${lessonSlug}`}
            />
            <LessonLoggedOutPreview
              deck={orphanDeck}
              moduleTitle={pathMeta?.pathTitle ?? moduleSlug!}
              moduleSlug={moduleSlug!}
            />
          </div>
        );
      }
      const orphanSummaryCtas = buildSummaryLabCtas(moduleSlug!, lessonSlug!);
      return (
        <div>
          <SEO
            title={orphanDeck.title}
            description={orphanDeck.whatYoullLearn[0]}
            path={`/courses/${moduleSlug}/${lessonSlug}`}
          />
          <section className="py-10 border-b border-[oklch(0.15_0.004_250)]">
            <div className="container max-w-3xl">
              <Link
                href={`/courses/${moduleSlug}`}
                className="inline-flex items-center gap-2 text-sm text-[oklch(0.55_0.12_155)] mb-4 hover:gap-3 transition-all"
              >
                {pathMeta?.pathTitle ?? moduleSlug}
              </Link>
              <h1 className="text-2xl sm:text-3xl font-heading text-white tracking-wide">{orphanDeck.title}</h1>
            </div>
          </section>
          <section className="py-10">
            <div className="container max-w-3xl">
              <LessonIluStrip moduleSlug={moduleSlug!} lessonSlug={lessonSlug!} />
              <LessonCardPlayer deck={orphanDeck} summaryCtas={orphanSummaryCtas} />
              <p className="mt-6 text-xs text-[oklch(0.50_0.008_250)] leading-relaxed rounded-lg border border-[oklch(0.16_0.004_250)] bg-[oklch(0.08_0.003_250)] px-4 py-3">
                {LESSON_CARD_ASSESS_NOTE}
              </p>
            </div>
          </section>
        </div>
      );
    }
    if (qaLegacyLesson && moduleSlug && lessonSlug) {
      const qaProseClasses = `prose prose-invert prose-sm max-w-none
        prose-headings:font-heading prose-headings:tracking-wide
        prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4
        prose-p:text-[oklch(0.72_0.008_250)] prose-p:leading-relaxed
        prose-strong:text-white`;
      return (
        <div>
          <SEO
            title={qaLegacyLesson.title}
            description={qaLegacyLesson.moduleTitle}
            path={`/courses/${moduleSlug}/${lessonSlug}`}
          />
          {!isCardFormatLesson(moduleSlug, lessonSlug) && (
            <LessonReadingProgressBar state={scrollState} />
          )}
          <section className="py-10 border-b border-[oklch(0.15_0.004_250)]">
            <div className="container max-w-3xl">
              <h1 className="text-2xl sm:text-3xl font-heading text-white tracking-wide">{qaLegacyLesson.title}</h1>
            </div>
          </section>
          <section className="py-10">
            <div className="container max-w-3xl">
              {segments.map((segment, idx) =>
                segment.type === "text" ? (
                  <div key={`qa-text-${idx}`} className={qaProseClasses}>
                    <Streamdown parseIncompleteMarkdown={false}>{segment.value}</Streamdown>
                  </div>
                ) : null
              )}
            </div>
          </section>
        </div>
      );
    }
    return (
      <div className="py-20 text-center">
        <p className="text-[oklch(0.55_0.008_250)]">Lesson not found.</p>
        <Link href="/courses" className="text-[oklch(0.55_0.12_155)] mt-4 inline-block">
          Back to courses
        </Link>
      </div>
    );
  }

  const {
    lesson,
    module,
    prevLesson,
    nextLesson,
    lessonIndex,
    totalLessons,
    knowledgeCheckQuestions = [],
    lessonQuizQuestions = [],
    gateStatus,
  } = lessonData;
  const isCompleted = progress?.completedLessonIds?.includes(lesson.id) ?? false;
  const isUnlocked = gateStatus?.unlocked ?? lessonIndex === 0;
  const canProceedToNext = gateStatus?.canProceedToNext ?? isCompleted;

  const hasAssessments =
    (knowledgeCheckQuestions?.length ?? 0) > 0 || (lessonQuizQuestions?.length ?? 0) > 0;

  const iluStripData = getLessonIluStripData(moduleSlug!, lessonSlug!, {
    isOnLessonPage: true,
    lessonCompleted: isCompleted,
    knowledgeCheckPassed: gateStatus?.knowledgeCheckPassed ?? false,
    lessonQuizPassed: gateStatus?.lessonQuizPassed ?? false,
    scenarioPassed: gateStatus?.scenarioPassed ?? false,
  });
  const hideLegacyPracticeScenario =
    iluStripData.mapped && iluStripData.items.some((i) => i.stage === "troubleshoot");

  const isCardLesson = isCardFormatLesson(moduleSlug!, lessonSlug!);
  const cardDeck = getLessonCardDeck(moduleSlug!, lessonSlug!);

  const qaFullDeck = isLocalQaFullDeck();

  // Check access: first lesson in each module is free, rest require subscription
  const isFirstLesson = lessonIndex === 0;
  const hasAccess = hasPaidAccess || isFirstLesson || (isCardLesson && qaFullDeck);

  if (isCardLesson && cardDeck && !hasAccess) {
    if (isAuthenticated && !subscriptionResolved) {
      return (
        <div className="py-20">
          <div className="container max-w-3xl">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-[oklch(0.15_0.003_250)] rounded w-1/4" />
              <div className="h-10 bg-[oklch(0.15_0.003_250)] rounded w-2/3" />
              <div className="h-4 bg-[oklch(0.15_0.003_250)] rounded w-full mt-8" />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div>
        <SEO
          title={`${lesson.title} | ${module.title}`}
          description={cardDeck.whatYoullLearn[0]}
          path={`/courses/${moduleSlug}/${lessonSlug}`}
        />
        <LessonLoggedOutPreview
          deck={cardDeck}
          moduleTitle={module.title}
          moduleSlug={moduleSlug!}
          isAuthenticated={isAuthenticated}
        />
      </div>
    );
  }

  // Show loading skeleton while subscription status is being checked for authenticated users
  if (!subscriptionResolved && !isFirstLesson && !isCardLesson) {
    return (
      <div className="py-20">
        <div className="container max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-[oklch(0.15_0.003_250)] rounded w-1/4" />
            <div className="h-10 bg-[oklch(0.15_0.003_250)] rounded w-2/3" />
            <div className="h-4 bg-[oklch(0.15_0.003_250)] rounded w-full mt-8" />
            <div className="h-4 bg-[oklch(0.15_0.003_250)] rounded w-5/6" />
            <div className="h-4 bg-[oklch(0.15_0.003_250)] rounded w-4/5" />
          </div>
        </div>
      </div>
    );
  }

  if (hasAccess && isAuthenticated && !isUnlocked) {
    return (
      <div className="py-20">
        <div className="container max-w-3xl text-center">
          <SEO title={lesson.title} description="Complete the previous lesson to unlock." path={`/courses/${moduleSlug}/${lessonSlug}`} />
          <Lock className="w-12 h-12 text-[oklch(0.35_0.006_250)] mx-auto mb-4" />
          <h1 className="text-2xl font-heading text-white tracking-wide mb-3">{lesson.title}</h1>
          <p className="text-[oklch(0.55_0.008_250)] mb-6">
            This lesson is locked. Pass the knowledge check and lesson quiz on the previous lesson to continue.
          </p>
          {prevLesson && (
            <Link
              href={`/courses/${moduleSlug}/${prevLesson.slug}`}
              className="inline-flex items-center gap-2 px-6 py-3 btn-primary text-sm font-medium rounded"
            >
              <ArrowLeft className="w-4 h-4" /> Back to {prevLesson.title}
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="py-20">
        <div className="container max-w-3xl text-center">
          <SEO title={lesson.title} description="Subscribe to access this lesson." path={`/courses/${moduleSlug}/${lessonSlug}`} />
          <BookOpen className="w-12 h-12 text-[oklch(0.35_0.006_250)] mx-auto mb-4" />
          <h1 className="text-2xl font-heading text-white tracking-wide mb-3">{lesson.title}</h1>
          <p className="text-[oklch(0.55_0.008_250)] mb-6">
            This lesson requires a paid subscription. Subscribe to access all course content.
          </p>
          <Link href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 btn-primary text-sm font-medium rounded">
            View Pricing <ArrowRight className="w-4 h-4" />
          </Link>
          {!isAuthenticated && (
            <p className="mt-4 text-xs text-[oklch(0.45_0.006_250)]">
              Already subscribed?{" "}
              <Link href="/login" className="text-[oklch(0.55_0.12_155)] hover:text-white">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    );
  }

  /** Shared prose classes for markdown rendering */
  const proseClasses = `prose prose-invert prose-sm max-w-none
    prose-headings:font-heading prose-headings:tracking-wide
    prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4
    prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
    prose-p:text-[oklch(0.72_0.008_250)] prose-p:leading-relaxed
    prose-li:text-[oklch(0.72_0.008_250)]
    prose-strong:text-white
    prose-code:text-[oklch(0.75_0.06_155)] prose-code:bg-[oklch(0.12_0.003_250)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
    prose-pre:bg-[oklch(0.08_0.003_250)] prose-pre:border prose-pre:border-[oklch(0.15_0.004_250)]
    prose-blockquote:border-l-[oklch(0.55_0.12_155)] prose-blockquote:text-[oklch(0.65_0.008_250)]
  `;

  return (
    <div>
      <SEO
        title={`${lesson.title} | ${module.title}`}
        description={`Lesson ${lessonIndex + 1} of ${totalLessons} in ${module.title}`}
        path={`/courses/${moduleSlug}/${lessonSlug}`}
      />

      {/* Module progress — card lessons */}
      {isCardLesson && (
        <div className="fixed top-16 lg:top-[68px] left-0 right-0 z-40 h-0.5 bg-[oklch(0.10_0.003_250)]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((lessonIndex + (isCompleted ? 1 : 0)) / totalLessons) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-[oklch(0.45_0.10_155)] to-[oklch(0.60_0.14_155)]"
          />
        </div>
      )}

      {!isCardLesson && <LessonReadingProgressBar state={scrollState} />}

      {/* Lesson Header */}
      <section className="py-10 border-b border-[oklch(0.15_0.004_250)]">
        <div className="container max-w-3xl">
          <Link
            href={`/courses/${moduleSlug}`}
            className="inline-flex items-center gap-2 text-sm text-[oklch(0.55_0.12_155)] mb-4 hover:gap-3 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            {module.title}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3 text-xs text-[oklch(0.45_0.006_250)] mb-3">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[oklch(0.55_0.12_155/8%)] text-[oklch(0.55_0.12_155)] font-mono">
                {lessonIndex + 1}/{totalLessons}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                ~{lesson.estimatedMinutes} min
              </span>
              {isCompleted && (
                <span className="flex items-center gap-1 text-[oklch(0.55_0.12_155)]">
                  <CheckCircle className="w-3 h-3" />
                  Completed
                </span>
              )}
            </div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-heading text-white tracking-wide">
                {lesson.title}
              </h1>
              <div className="flex items-center gap-2 shrink-0 mt-1">
                {isCardLesson && (
                  <Link
                    href={`/courses/${moduleSlug}/${lessonSlug}/print`}
                    className="p-2 rounded-lg text-[oklch(0.45_0.006_250)] hover:text-white hover:bg-[oklch(0.20_0.004_250)] transition-colors"
                    title="Print-friendly version"
                  >
                    <Printer className="w-5 h-5" />
                  </Link>
                )}
                {isAuthenticated && (
                  <button
                    onClick={() => toggleBookmark.mutate({ lessonId: lesson.id })}
                    className={`p-2 rounded-lg transition-colors ${
                      bookmarkData?.bookmarked
                        ? "text-amber-400 bg-amber-400/10 hover:bg-amber-400/20"
                        : "text-[oklch(0.45_0.006_250)] hover:text-amber-400 hover:bg-amber-400/10"
                    }`}
                    title={bookmarkData?.bookmarked ? "Remove bookmark" : "Save for later"}
                  >
                    {bookmarkData?.bookmarked ? (
                      <BookmarkCheck className="w-5 h-5" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lesson Content */}
      <section className="py-10">
        <div className="container max-w-3xl">
          <LessonIluStrip
            moduleSlug={moduleSlug!}
            lessonSlug={lessonSlug!}
            lessonCompleted={isCompleted}
            knowledgeCheckPassed={gateStatus?.knowledgeCheckPassed ?? false}
            lessonQuizPassed={gateStatus?.lessonQuizPassed ?? false}
            scenarioPassed={gateStatus?.scenarioPassed ?? false}
          />

          {isCardLesson && cardDeck ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mb-8"
            >
              <LessonCardPlayer
                deck={cardDeck}
                summaryCtas={summaryLabCtas}
                onSummaryReached={() => setSummaryReached(true)}
              />
            </motion.div>
          ) : (
            <>
          {/* Guided VFD Walkthrough — step-by-step interactive (VFD module only) */}
          {lessonSlug === "vfd-fundamentals" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8 p-5 rounded-xl bg-zinc-900/60 border border-zinc-800"
            >
              <GuidedVFDWalkthrough />
            </motion.div>
          )}

          {/* Interactive VFD Diagram — shown on VFD fundamentals lesson */}
          {lessonSlug === "vfd-fundamentals" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-8"
            >
              <VFDArchitectureDiagram />
            </motion.div>
          )}

          {/* Plant Floor Callouts — shown on VFD fundamentals lesson */}
          {lessonSlug === "vfd-fundamentals" && (
            <div className="mb-8 space-y-0">
              <PlantFloorCallout variant="warning">
                DC bus capacitors retain <strong className="text-white">lethal voltage (678V DC)</strong> after power is removed. Wait minimum 5 minutes and verify with a meter before touching any internal VFD components. This is the #1 cause of electrical injuries during VFD service.
              </PlantFloorCallout>

              <PlantFloorCallout variant="common_failure" title="DC Bus Capacitor Degradation" collapsible>
                Most VFD failures in plants with drives over 7 years old are DC bus capacitor related. Symptoms: nuisance undervoltage trips under load, visible bulging on capacitor tops, or reduced capacitance measured during PM. Replace capacitors proactively at 7-10 year intervals.
              </PlantFloorCallout>

              <PlantFloorCallout variant="tech_tip">
                Standard multimeters cannot accurately read VFD output voltage — the PWM waveform gives false readings. Use the VFD's built-in display parameters (output voltage, current, frequency) or a true-RMS meter rated for inverter duty.
              </PlantFloorCallout>

              <PlantFloorCallout variant="mistake" title="Meggering Through a VFD" collapsible>
                Never megger (insulation resistance test) motor cables with the VFD connected. The 500V or 1000V DC test voltage will destroy the IGBT modules and DC bus capacitors instantly. Always disconnect motor leads at the VFD terminal block before meggering.
              </PlantFloorCallout>

              <PlantFloorCallout variant="field_note">
                A 2% voltage imbalance between phases at the VFD input causes approximately 20% current imbalance in the motor. Always check all three phases are present and balanced before troubleshooting overcurrent or overload faults.
              </PlantFloorCallout>

              <PlantFloorCallout variant="plant_example" title="Real Scenario: Intermittent Undervoltage Trips" collapsible>
                A packaging line VFD was tripping on DC bus undervoltage every 2-3 hours during peak production. Root cause: 15-year-old DC bus capacitors had lost 40% of their capacitance. The bus couldn't sustain voltage during acceleration ramps. Fix: replaced capacitor bank — $800 in parts vs. $12,000 for a new drive.
              </PlantFloorCallout>
            </div>
          )}

          {/* Render content segments with inline interactive components */}
          {segments.map((segment, idx) => {
            if (segment.type === "component") {
              const Component = INTERACTIVE_COMPONENTS[segment.name];
              if (!Component) return null;
              return (
                <motion.div
                  key={`interactive-${idx}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="my-8 p-5 rounded-xl bg-zinc-900/60 border border-zinc-800"
                >
                  <Component />
                </motion.div>
              );
            }

            // Text segment — render as markdown
            return (
              <motion.div
                key={`text-${idx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={proseClasses}
                ref={(el) => {
                  if (!el) return;
                  // Wrap tables in scrollable containers for mobile
                  const tables = el.querySelectorAll('table:not(.table-wrapped)');
                  tables.forEach((table) => {
                    table.classList.add('table-wrapped');
                    const wrapper = document.createElement('div');
                    wrapper.className = 'table-wrapper';
                    if (table.scrollWidth > table.clientWidth) {
                      wrapper.classList.add('has-overflow');
                    }
                    table.parentNode?.insertBefore(wrapper, table);
                    wrapper.appendChild(table);
                  });
                }}
              >
                <Streamdown parseIncompleteMarkdown={false}>{segment.value}</Streamdown>
              </motion.div>
            );
          })}
            </>
          )}

          {/* Linked Simulator Scenario — legacy DB link when ILU map has no troubleshoot */}
          {lessonData?.practiceScenario?.hasPracticeScenario &&
            lessonData.practiceScenario.simulatorScenarioId &&
            !hideLegacyPracticeScenario && (
            <div className="mt-10 p-6 card-panel border-[oklch(0.55_0.12_155/20%)]">
              <h3 className="text-sm font-heading text-white tracking-wide mb-2">
                Practice Scenario Available
              </h3>
              <p className="text-sm text-[oklch(0.55_0.008_250)] mb-4">
                {lessonData.practiceScenario.scenarioTitle
                  ? `Apply this lesson in "${lessonData.practiceScenario.scenarioTitle}" — a hands-on troubleshooting scenario.`
                  : "Apply what you learned in this lesson with a hands-on troubleshooting scenario."}
              </p>
              <Link
                href={`/simulator?scenario=${encodeURIComponent(lessonData.practiceScenario.simulatorScenarioId)}`}
                className="inline-flex items-center gap-2 text-sm text-[oklch(0.55_0.12_155)] font-medium hover:gap-3 transition-all"
              >
                Open Practice Scenario <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          <div id="ilu-assess" className="scroll-mt-28" />

          {isCardLesson && hasAssessments ? (
            <>
              <p className="mt-6 text-xs text-[oklch(0.50_0.008_250)] leading-relaxed rounded-lg border border-[oklch(0.16_0.004_250)] bg-[oklch(0.08_0.003_250)] px-4 py-3">
                {LESSON_CARD_ASSESS_NOTE}
              </p>
              <LessonAssessmentPanel
                lessonId={lesson.id}
                moduleId={lesson.moduleId}
                knowledgeCheckQuestions={(knowledgeCheckQuestions as Array<{ id: number; question: string; options: string[]; sortOrder: number }>)}
                lessonQuizQuestions={(lessonQuizQuestions as Array<{ id: number; question: string; options: string[]; sortOrder: number }>)}
                initialStatus={{
                  knowledgeCheckPassed: gateStatus?.knowledgeCheckPassed ?? false,
                  lessonQuizPassed: gateStatus?.lessonQuizPassed ?? false,
                  scenarioRequired: gateStatus?.scenarioRequired ?? false,
                  scenarioPassed: gateStatus?.scenarioPassed ?? false,
                  scenarioSlug: gateStatus?.scenarioSlug ?? null,
                  lessonQuizAttemptsRemaining: gateStatus?.lessonQuizAttemptsRemaining ?? 3,
                  lessonQuizCooldownEndsAt: gateStatus?.lessonQuizCooldownEndsAt ?? null,
                }}
                isAuthenticated={isAuthenticated}
                isLessonCompleted={isCompleted}
                requireExplicitMarkComplete={false}
                onLessonComplete={() => {
                  utils.courses.getProgress.invalidate();
                  utils.courses.getLesson.invalidate();
                }}
              />
            </>
          ) : isCardLesson ? (
            <p className="mt-6 text-xs text-[oklch(0.50_0.008_250)] leading-relaxed rounded-lg border border-[oklch(0.16_0.004_250)] bg-[oklch(0.08_0.003_250)] px-4 py-3">
              {LESSON_CARD_ASSESS_NOTE}
            </p>
          ) : (
            <LessonAssessmentPanel
              lessonId={lesson.id}
              moduleId={lesson.moduleId}
              knowledgeCheckQuestions={(knowledgeCheckQuestions as Array<{ id: number; question: string; options: string[]; sortOrder: number }>)}
              lessonQuizQuestions={(lessonQuizQuestions as Array<{ id: number; question: string; options: string[]; sortOrder: number }>)}
              initialStatus={{
                knowledgeCheckPassed: gateStatus?.knowledgeCheckPassed ?? false,
                lessonQuizPassed: gateStatus?.lessonQuizPassed ?? false,
                scenarioRequired: gateStatus?.scenarioRequired ?? false,
                scenarioPassed: gateStatus?.scenarioPassed ?? false,
                scenarioSlug: gateStatus?.scenarioSlug ?? null,
                lessonQuizAttemptsRemaining: gateStatus?.lessonQuizAttemptsRemaining ?? 3,
                lessonQuizCooldownEndsAt: gateStatus?.lessonQuizCooldownEndsAt ?? null,
              }}
              isAuthenticated={isAuthenticated}
              isLessonCompleted={isCompleted}
              requireExplicitMarkComplete
              onLessonComplete={() => {
                utils.courses.getProgress.invalidate();
                utils.courses.getLesson.invalidate();
                recordStreak.mutate();
                if (lessonData?.lesson && lessonData?.module) {
                  trackLessonCompleted({ moduleSlug: moduleSlug!, lessonSlug: lessonSlug! });
                }
              }}
            />
          )}

          {/* Navigation */}
          <div className="mt-8 pt-8 border-t border-[oklch(0.15_0.004_250)]">
            <div className="flex items-center justify-between">
              {prevLesson ? (
                <Link
                  href={`/courses/${moduleSlug}/${prevLesson.slug}`}
                  className="flex items-center gap-2 text-sm text-[oklch(0.55_0.008_250)] hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Link>
              ) : (
                <div />
              )}
              {nextLesson ? (
                canProceedToNext ? (
                  <Link
                    href={`/courses/${moduleSlug}/${nextLesson.slug}`}
                    className="flex items-center gap-2 text-sm text-[oklch(0.55_0.12_155)] hover:gap-3 transition-all"
                  >
                    Next Lesson
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <span className="flex items-center gap-2 text-sm text-[oklch(0.40_0.006_250)]">
                    <Lock className="w-3.5 h-3.5" />
                    {LESSON_PROGRESSION_NAV_HINT}
                  </span>
                )
              ) : (
                <Link
                  href={`/courses/${moduleSlug}`}
                  className="flex items-center gap-2 text-sm text-[oklch(0.55_0.12_155)] hover:gap-3 transition-all"
                >
                  Back to Module
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
