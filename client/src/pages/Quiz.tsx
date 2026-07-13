import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SEO from "@/components/SEO";
import { CheckCircle2, XCircle, Trophy, RotateCcw, ArrowLeft, Award } from "lucide-react";
import { Link } from "wouter";

export default function Quiz() {
  const [, params] = useRoute("/courses/:moduleSlug/quiz");
  const [, navigate] = useLocation();
  const { trackQuizCompleted } = useAnalytics();
  const moduleSlug = params?.moduleSlug || "";

  // Get module info
  const { data: moduleData } = trpc.courses.getModule.useQuery({ slug: moduleSlug });
  const module = moduleData?.module;

  // Get quiz questions
  const { data: questions, isLoading, error: questionsError } = trpc.quiz.getQuestions.useQuery(
    { moduleId: module?.id ?? 0 },
    { enabled: !!module?.id, retry: false }
  );

  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  const submitQuiz = trpc.quiz.submitQuiz.useMutation({
    onSuccess: (data) => {
      setQuizResult(data);
      setQuizSubmitted(true);
      trackQuizCompleted({
        moduleSlug,
        score: data.score,
        totalQuestions: data.totalQuestions,
        passed: data.passed,
      });
    },
  });

  if (isLoading || !module) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading quiz...</div>
      </div>
    );
  }

  // Handle subscription gating error
  if (questionsError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold mb-2">Access Denied</h3>
            <p className="text-muted-foreground mb-4">
              {questionsError.message.includes("subscription")
                ? "A paid subscription is required to take quizzes. Upgrade your plan to access quizzes and earn certificates."
                : "Unable to load quiz. Please try again later."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate(`/courses/${moduleSlug}`)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Module
              </Button>
              <Link href="/pricing">
                <Button>View Pricing</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No quiz questions available for this module yet.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate(`/courses/${moduleSlug}`)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Module
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSelectAnswer = (questionId: number, optionIndex: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    const answers = questions.map(q => ({
      questionId: q.id,
      selectedIndex: selectedAnswers[q.id] ?? -1,
    }));
    submitQuiz.mutate({ moduleId: module.id, answers });
  };

  const allAnswered = questions.every(q => selectedAnswers[q.id] !== undefined);

  // Results screen
  if (quizSubmitted && quizResult) {
    return (
      <div className="min-h-screen bg-background py-12">
        <SEO title={`Quiz Results - ${module.title}`} description="View your quiz results" />
        <div className="container max-w-3xl">
          {/* Score Card */}
          <Card className={`mb-8 border-2 ${quizResult.passed ? 'border-green-500/50' : 'border-red-500/50'}`}>
            <CardContent className="p-8 text-center">
              <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${quizResult.passed ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {quizResult.passed ? (
                  <Trophy className="w-10 h-10 text-green-500" />
                ) : (
                  <XCircle className="w-10 h-10 text-red-500" />
                )}
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {quizResult.passed ? "Congratulations! You Passed!" : "Not Quite — Try Again"}
              </h2>
              <p className="text-4xl font-bold mb-2">
                {quizResult.score}%
              </p>
              <p className="text-muted-foreground">
                {quizResult.correct} of {quizResult.totalQuestions} correct (75% required to pass)
              </p>
              {quizResult.passed && quizResult.certificateCode && (
                <div className="mt-6 p-4 bg-green-500/10 rounded-lg">
                  <Award className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-400">Certificate Earned!</p>
                  <Link href={`/certificate/${quizResult.certificateCode}`}>
                    <Button variant="outline" className="mt-2" size="sm">
                      View Certificate
                    </Button>
                  </Link>
                </div>
              )}
              <div className="flex gap-3 justify-center mt-6">
                {!quizResult.passed && (
                  <Button onClick={() => { setQuizSubmitted(false); setQuizResult(null); setSelectedAnswers({}); setCurrentQuestion(0); }}>
                    <RotateCcw className="w-4 h-4 mr-2" /> Retry Quiz
                  </Button>
                )}
                <Button variant="outline" onClick={() => navigate(`/courses/${moduleSlug}`)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Module
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Question Review */}
          <h3 className="text-lg font-semibold mb-4">Question Review</h3>
          <div className="space-y-4">
            {quizResult.results.map((result: any, idx: number) => {
              const question = questions[idx];
              const options = question.options as string[];
              return (
                <Card key={question.id} className={`border ${result.isCorrect ? 'border-green-500/30' : 'border-red-500/30'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2 mb-3">
                      {result.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                      )}
                      <p className="font-medium text-sm">{question.question}</p>
                    </div>
                    <div className="ml-7 space-y-1">
                      {options.map((option: string, optIdx: number) => (
                        <div
                          key={optIdx}
                          className={`text-sm px-3 py-1.5 rounded ${
                            optIdx === result.correctIndex
                              ? 'bg-green-500/20 text-green-300'
                              : optIdx === result.selectedIndex && !result.isCorrect
                              ? 'bg-red-500/20 text-red-300 line-through'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                    {result.explanation && (
                      <p className="ml-7 mt-2 text-xs text-muted-foreground italic">
                        {result.explanation}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Quiz taking screen
  const question = questions[currentQuestion];
  const options = question.options as string[];

  return (
    <div className="min-h-screen bg-background py-12">
      <SEO title={`Quiz - ${module.title}`} description={`Test your knowledge on ${module.title}`} />
      <div className="container max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/courses/${moduleSlug}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Module
          </Button>
          <h1 className="text-2xl font-bold mt-4">{module.title} — Quiz</h1>
          <p className="text-muted-foreground mt-1">
            Answer all {questions.length} questions. You need 75% to pass and earn your certificate.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all duration-300"
              style={{ width: `${(Object.keys(selectedAnswers).length / questions.length) * 100}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {Object.keys(selectedAnswers).length}/{questions.length}
          </span>
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">
              Question {currentQuestion + 1} of {questions.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium mb-6">{question.question}</p>
            <div className="space-y-3">
              {options.map((option: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(question.id, idx)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedAnswers[question.id] === idx
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
                  }`}
                >
                  <span className="font-medium mr-3 text-muted-foreground">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {option}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(prev => prev - 1)}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          <div className="flex gap-1">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-8 h-8 rounded text-xs font-medium transition-all ${
                  idx === currentQuestion
                    ? 'bg-green-600 text-white'
                    : selectedAnswers[questions[idx].id] !== undefined
                    ? 'bg-green-600/30 text-green-300'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          {currentQuestion < questions.length - 1 ? (
            <Button onClick={() => setCurrentQuestion(prev => prev + 1)}>
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmitQuiz}
              disabled={!allAnswered || submitQuiz.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitQuiz.isPending ? "Submitting..." : "Submit Quiz"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
