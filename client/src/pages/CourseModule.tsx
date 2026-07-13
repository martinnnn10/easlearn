/**
 * CourseModule Page - Premium lesson list with visual hierarchy
 */
import { motion } from "framer-motion";
import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle, Clock, Lock, GraduationCap } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import SEO from "@/components/SEO";
import { pluralize } from "@/lib/pluralize";
import { isCardFormatLesson } from "@shared/lessonCardContent";


export default function CourseModule() {
  const { moduleSlug } = useParams<{ moduleSlug: string }>();
  const { isAuthenticated } = useAuth();
  const { data: moduleData, isLoading } = trpc.courses.getModule.useQuery({ slug: moduleSlug! });
  const { data: subscription } = trpc.stripe.getSubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: progress } = trpc.courses.getProgress.useQuery(
    { moduleId: moduleData?.module?.id ?? 0 },
    { enabled: isAuthenticated && !!moduleData?.module?.id }
  );

  const hasPaidAccess = subscription?.tier === "pro" || subscription?.tier === "team";

  if (isLoading) {
    return (
      <div className="py-20">
        <div className="container max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-[oklch(0.15_0.003_250)] rounded w-1/3" />
            <div className="h-5 bg-[oklch(0.15_0.003_250)] rounded w-2/3" />
            <div className="space-y-3 mt-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-[oklch(0.12_0.003_250)] rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!moduleData?.module) {
    return (
      <div className="py-20 text-center">
        <p className="text-[oklch(0.55_0.008_250)]">Module not found.</p>
        <Link href="/courses" className="text-[oklch(0.55_0.12_155)] mt-4 inline-block">
          Back to courses
        </Link>
      </div>
    );
  }

  const { module, lessons } = moduleData;
  const quizQuestionCount = moduleData.quizQuestionCount ?? 0;
  const hasQuiz = quizQuestionCount > 0;
  const completedLessons = progress?.completedLessonIds ?? [];
  const lessonGates = progress?.lessonGates ?? [];
  const gateByLessonId = new Map(lessonGates.map((g) => [g.lessonId, g]));
  const progressPercent = lessons.length > 0 ? Math.round((completedLessons.length / lessons.length) * 100) : 0;
  const allLessonsAssessed = completedLessons.length >= lessons.length && lessons.length > 0;


  return (
    <div>
      <SEO
        title={module.title}
        description={module.description}
        path={`/courses/${module.slug}`}
      />

      {/* Header — layered with gradient */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.12_0.02_155/6%)] via-transparent to-transparent" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[oklch(0.55_0.12_155/25%)] to-transparent" />
        
        <div className="container max-w-4xl relative">
          <Link href="/courses" className="inline-flex items-center gap-2 text-sm text-[oklch(0.55_0.12_155)] mb-6 hover:gap-3 transition-all">
            <ArrowLeft className="w-4 h-4" />
            All Courses
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl font-heading text-white tracking-wide mb-4">
              {module.title}
            </h1>
            <p className="text-[oklch(0.65_0.008_250)] leading-relaxed mb-6">
              {module.description}
            </p>



            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-[oklch(0.50_0.008_250)]">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
                {pluralize(lessons.length, "lesson")}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
                ~{module.estimatedHours}h total
              </span>
            </div>

            {/* Progress bar — visible on all viewports when authenticated */}
            {isAuthenticated && hasPaidAccess && (
              <div className="mt-6 p-4 rounded-lg bg-[oklch(0.08_0.003_250)] border border-[oklch(0.15_0.004_250)]">
                <div className="flex items-center justify-between text-xs text-[oklch(0.50_0.008_250)] mb-2.5">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-[oklch(0.55_0.12_155)]" />
                    {completedLessons.length} of {lessons.length} complete
                  </span>
                  <span className="font-mono text-[oklch(0.55_0.12_155)]">{progressPercent}%</span>
                </div>
                <div className="h-2 bg-[oklch(0.12_0.003_250)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-[oklch(0.45_0.12_155)] to-[oklch(0.55_0.12_155)] rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Course Completion Milestone Badge */}
            {isAuthenticated && progressPercent === 100 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="mt-6 p-5 rounded-xl bg-gradient-to-r from-[oklch(0.12_0.04_155)] to-[oklch(0.10_0.02_80)] border border-[oklch(0.55_0.12_155/30%)] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.06]">
                  <GraduationCap className="w-full h-full text-[oklch(0.55_0.12_155)]" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[oklch(0.55_0.12_155/15%)] border border-[oklch(0.55_0.12_155/30%)] flex items-center justify-center shrink-0">
                    <GraduationCap className="w-6 h-6 text-[oklch(0.65_0.14_155)]" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.12em] font-bold text-[oklch(0.55_0.12_155)] mb-1">
                      Lessons Complete
                    </div>
                    <div className="text-sm font-heading text-white tracking-wide">
                      {module.title}
                    </div>
                    <div className="text-xs text-[oklch(0.50_0.008_250)] mt-1">
                      All {pluralize(lessons.length, "lesson")} completed • +{lessons.length * 50} XP earned
                      {hasQuiz ? " — pass the module quiz to earn your certificate." : ""}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[oklch(0.20_0.004_250)] to-transparent" />
      </section>

      {/* Lessons List — premium cards */}
      <section className="py-12">
        <div className="container max-w-4xl">
          <div className="space-y-2">
            {lessons.map((lesson, i) => {
              const isCompleted = completedLessons.includes(lesson.id);
              const gate = gateByLessonId.get(lesson.id);
              const isUnlocked = isAuthenticated ? (gate?.unlocked ?? i === 0) : i === 0;
              const isAccessible = (hasPaidAccess || i === 0) && isUnlocked;
              const needsPriorAssessment = isAuthenticated && hasPaidAccess && !isUnlocked;
              const isCardLesson = isCardFormatLesson(module.slug, lesson.slug);

              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                >
                  {isAccessible ? (
                    <Link
                      href={`/courses/${module.slug}/${lesson.slug}`}
                      className="flex items-center gap-4 p-4 rounded-lg border border-[oklch(0.15_0.004_250)] bg-[oklch(0.09_0.003_250)] hover:border-[oklch(0.55_0.12_155/30%)] hover:bg-[oklch(0.10_0.003_250)] hover:shadow-[0_0_15px_oklch(0.55_0.12_155/5%)] transition-all group"
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 bg-[oklch(0.12_0.003_250)] border border-[oklch(0.18_0.004_250)] group-hover:border-[oklch(0.55_0.12_155/30%)] transition-colors">
                        {isCompleted ? (
                          <CheckCircle className="w-4.5 h-4.5 text-[oklch(0.55_0.12_155)]" />
                        ) : (
                          <span className="text-xs font-mono text-[oklch(0.45_0.006_250)] group-hover:text-[oklch(0.55_0.12_155)] transition-colors">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-sm sm:text-base font-medium text-white group-hover:text-[oklch(0.55_0.12_155)] transition-colors break-words">
                            {lesson.title}
                          </h3>
                          {isCardLesson && (
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border border-[oklch(0.60_0.12_80/30%)] text-[oklch(0.70_0.10_80)] shrink-0">
                              Slide Format
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-[oklch(0.45_0.006_250)]">
                            <Clock className="w-3 h-3 inline mr-1" />{lesson.estimatedMinutes} min
                          </span>
                          <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                            i < Math.ceil(lessons.length * 0.33)
                              ? "border border-[oklch(0.55_0.12_155/30%)] text-[oklch(0.55_0.12_155)]"
                              : i < Math.ceil(lessons.length * 0.66)
                                ? "border border-[oklch(0.60_0.12_80/30%)] text-[oklch(0.70_0.10_80)]"
                                : "border border-[oklch(0.55_0.12_30/30%)] text-[oklch(0.70_0.10_30)]"
                          }`}>
                            {i < Math.ceil(lessons.length * 0.33) ? "Beginner" : i < Math.ceil(lessons.length * 0.66) ? "Intermediate" : "Advanced"}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[oklch(0.35_0.006_250)] group-hover:text-[oklch(0.55_0.12_155)] transition-colors shrink-0" />
                    </Link>
                  ) : (
                    <div className="flex items-center gap-4 p-4 rounded-lg border border-[oklch(0.12_0.004_250)] bg-[oklch(0.07_0.003_250)] opacity-60">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 bg-[oklch(0.10_0.003_250)] border border-[oklch(0.14_0.004_250)]">
                        <Lock className="w-3.5 h-3.5 text-[oklch(0.35_0.006_250)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-sm sm:text-base font-medium text-[oklch(0.55_0.008_250)] break-words">
                            {lesson.title}
                          </h3>
                          {isCardFormatLesson(module.slug, lesson.slug) && (
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border border-[oklch(0.60_0.12_80/30%)] text-[oklch(0.55_0.10_80)] shrink-0">
                              Slide Format
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-[oklch(0.40_0.006_250)]">
                            {needsPriorAssessment
                              ? "Complete previous lesson assessments to unlock"
                              : !hasPaidAccess && i > 0
                                ? "Subscribe to unlock"
                                : `${lesson.estimatedMinutes} min`}
                          </span>
                          <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                            i < Math.ceil(lessons.length * 0.33)
                              ? "border border-[oklch(0.55_0.12_155/20%)] text-[oklch(0.45_0.08_155)]"
                              : i < Math.ceil(lessons.length * 0.66)
                                ? "border border-[oklch(0.60_0.12_80/20%)] text-[oklch(0.55_0.08_80)]"
                                : "border border-[oklch(0.55_0.12_30/20%)] text-[oklch(0.55_0.08_30)]"
                          }`}>
                            {i < Math.ceil(lessons.length * 0.33) ? "Beginner" : i < Math.ceil(lessons.length * 0.66) ? "Intermediate" : "Advanced"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Take Quiz button — all lessons + lesson quizzes required */}
          {hasPaidAccess && hasQuiz && allLessonsAssessed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center p-6 card-panel border-[oklch(0.55_0.12_155/30%)] bg-[oklch(0.10_0.02_155/10%)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.55_0.12_155/8%)] to-transparent" />
              <div className="relative">
                <GraduationCap className="w-8 h-8 text-[oklch(0.55_0.12_155)] mx-auto mb-3" />
                <h3 className="text-lg font-heading text-white tracking-wide mb-2">
                  Ready for the Quiz?
                </h3>
                <p className="text-sm text-[oklch(0.55_0.008_250)] mb-4">
                  You've passed all lesson quizzes. Take the module capstone assessment to earn your certificate.
                  You need 75% to pass.
                </p>
                <Link
                  href={`/courses/${module.slug}/quiz`}
                  className="inline-flex items-center gap-2 px-6 py-3 btn-primary text-sm font-medium rounded"
                >
                  <GraduationCap className="w-4 h-4" />
                  Take Module Quiz
                </Link>
              </div>
            </motion.div>
          )}

          {/* Progress toward module quiz */}
          {hasPaidAccess && hasQuiz && progressPercent > 0 && !allLessonsAssessed && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-8 text-center p-4 card-panel"
            >
              <p className="text-sm text-[oklch(0.50_0.008_250)]">
                Module capstone unlocks after all {lessons.length} lesson quizzes are passed ({completedLessons.length}/{lessons.length} complete).
              </p>
            </motion.div>
          )}

          {/* All lessons done but no quiz seeded yet */}
          {hasPaidAccess && !hasQuiz && progressPercent === 100 && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-8 text-center p-6 card-panel border-[oklch(0.75_0.12_75/20%)]"
            >
              <GraduationCap className="w-6 h-6 text-[oklch(0.75_0.12_75)] mx-auto mb-2" />
              <p className="text-sm text-[oklch(0.55_0.008_250)]">
                You have finished all lessons. The module assessment is being prepared — check back soon for your certificate quiz.
              </p>
            </motion.div>
          )}

          {/* Subscribe CTA if locked */}
          {!hasPaidAccess && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-8 text-center p-6 card-panel border-[oklch(0.55_0.12_155/20%)] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.55_0.12_155/5%)] to-transparent" />
              <div className="relative">
                <Lock className="w-6 h-6 text-[oklch(0.45_0.006_250)] mx-auto mb-3" />
                <h3 className="text-lg font-heading text-white tracking-wide mb-2">
                  Subscribe to Unlock All Lessons
                </h3>
                <p className="text-sm text-[oklch(0.55_0.008_250)] mb-4">
                  The first lesson is free to preview. Subscribe to access the full course.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 btn-primary text-sm font-medium rounded"
                >
                  View Pricing
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
