/**
 * Candidate Assessment Page
 * Public page where candidates take their timed assessment
 * Accessed via /assessment/:token
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import SimulatorEngine from "@/components/SimulatorEngine";
import type { SimulationResults } from "@/components/SimulatorEngine";
import SimulatorEngineV2 from "@/components/SimulatorEngineV2";
import SimulatorEngineV3 from "@/components/SimulatorEngineV3";
import {
  buildAssessmentLaunchConfig,
  loadAssessmentScenario,
  mapV2ResultsToAssessmentPayload,
  mapV3ResultsToAssessmentPayload,
} from "@/lib/assessmentScenarioLoader";
import {
  Clock, AlertTriangle, CheckCircle2, XCircle, Play,
  ArrowRight, Shield, Cpu, Timer, BarChart3
} from "lucide-react";
import { pluralize } from "@/lib/pluralize";
import SEO from "@/components/SEO";

export default function Assessment() {
  const params = useParams<{ token: string }>();
  const token = params.token || "";

  const { data: assessment, isLoading, error } = trpc.assessments.getByToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const startMutation = trpc.assessments.start.useMutation();
  const submitResultMutation = trpc.assessments.submitResult.useMutation();

  const [phase, setPhase] = useState<"intro" | "active" | "complete">("intro");
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [results, setResults] = useState<SimulationResults[]>([]);
  const [overallStartTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Timer countdown
  useEffect(() => {
    if (phase !== "active" || !assessment?.timeLimitMinutes) return;
    
    const totalMs = assessment.timeLimitMinutes * 60 * 1000;
    const endTime = overallStartTime + totalMs;

    const interval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeRemaining(Math.ceil(remaining / 1000));
      
      if (remaining <= 0) {
        clearInterval(interval);
        setPhase("complete");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, assessment?.timeLimitMinutes, overallStartTime]);

  const scenarioIds = (assessment?.scenarioIds as string[]) || [];
  const currentScenarioId = scenarioIds[currentScenarioIndex];
  const loadedScenario = useMemo(
    () => (currentScenarioId ? loadAssessmentScenario(currentScenarioId) : null),
    [currentScenarioId]
  );
  const v3LaunchConfig = useMemo(
    () =>
      loadedScenario?.engineVersion === "v3"
        ? buildAssessmentLaunchConfig(loadedScenario.id)
        : null,
    [loadedScenario]
  );

  const handleStart = async () => {
    try {
      await startMutation.mutateAsync({ token });
      setPhase("active");
    } catch (err) {
      console.error("Failed to start assessment:", err);
    }
  };

  const handleScenarioComplete = useCallback(async (result: SimulationResults) => {
    setResults(prev => [...prev, result]);

    // Submit result to backend
    await submitResultMutation.mutateAsync({
      token,
      scenarioId: result.scenarioId,
      scenarioTitle: result.scenarioTitle,
      score: result.totalScore,
      maxScore: result.maxScore,
      percentage: result.percentage,
      grade: result.grade,
      timeSeconds: result.totalTime,
      decisions: result.decisions,
    });

    // Move to next scenario or complete
    if (currentScenarioIndex < scenarioIds.length - 1) {
      setCurrentScenarioIndex(prev => prev + 1);
    } else {
      setPhase("complete");
    }
  }, [token, currentScenarioIndex, scenarioIds.length, submitResultMutation]);

  const handleExitScenario = () => {
    // In assessment mode, exit means skip to next
    if (currentScenarioIndex < scenarioIds.length - 1) {
      setCurrentScenarioIndex(prev => prev + 1);
    } else {
      setPhase("complete");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[oklch(0.06_0.005_250)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[oklch(0.55_0.12_155)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[oklch(0.7_0_0)] font-['Inter']">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-[oklch(0.06_0.005_250)] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-['Oswald'] text-white mb-2">Assessment Not Found</h1>
          <p className="text-[oklch(0.6_0_0)] font-['Inter']">
            This assessment link is invalid or has expired. Please contact your administrator for a new link.
          </p>
        </div>
      </div>
    );
  }

  // Expired state
  if (assessment.status === "expired") {
    return (
      <div className="min-h-screen bg-[oklch(0.06_0.005_250)] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-['Oswald'] text-white mb-2">Assessment Expired</h1>
          <p className="text-[oklch(0.6_0_0)] font-['Inter']">
            This assessment link has expired. Please contact your administrator for a new assessment invitation.
          </p>
        </div>
      </div>
    );
  }

  // Already completed
  if (assessment.status === "completed") {
    return (
      <div className="min-h-screen bg-[oklch(0.06_0.005_250)] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <CheckCircle2 className="w-16 h-16 text-[oklch(0.55_0.12_155)] mx-auto mb-4" />
          <h1 className="text-2xl font-['Oswald'] text-white mb-2">Assessment Completed</h1>
          <p className="text-[oklch(0.6_0_0)] font-['Inter']">
            You have already completed this assessment. Your results have been submitted.
          </p>
        </div>
      </div>
    );
  }

  // Active simulation (V1 / V2 / V3 via unified registry)
  if (phase === "active") {
    if (!loadedScenario) {
      return (
        <div className="min-h-screen bg-[oklch(0.06_0.005_250)] flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-['Oswald'] text-white mb-2">Scenario Unavailable</h1>
            <p className="text-[oklch(0.6_0_0)] font-['Inter']">
              Scenario &quot;{currentScenarioId}&quot; could not be loaded. Contact your administrator.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        {timeRemaining !== null && (
          <div className="fixed top-4 right-4 z-50 bg-[oklch(0.1_0.005_250)] border border-[oklch(0.2_0_0)] rounded-lg px-4 py-2 flex items-center gap-2">
            <Timer className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
            <span className={`font-['Share_Tech_Mono'] text-sm ${timeRemaining < 300 ? "text-red-400" : "text-white"}`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        )}

        <div className="fixed top-4 left-4 z-50 bg-[oklch(0.1_0.005_250)] border border-[oklch(0.2_0_0)] rounded-lg px-4 py-2">
          <span className="font-['Share_Tech_Mono'] text-xs text-[oklch(0.6_0_0)]">
            SCENARIO {currentScenarioIndex + 1} / {scenarioIds.length}
            {" · "}
            {loadedScenario.engineVersion.toUpperCase()}
          </span>
        </div>

        {loadedScenario.engineVersion === "v1" && loadedScenario.v1 && (
          <SimulatorEngine
            scenario={loadedScenario.v1}
            onExit={handleExitScenario}
            onComplete={handleScenarioComplete}
          />
        )}
        {loadedScenario.engineVersion === "v2" && loadedScenario.v2 && (
          <SimulatorEngineV2
            scenario={loadedScenario.v2}
            onExit={handleExitScenario}
            onComplete={(r) => handleScenarioComplete(mapV2ResultsToAssessmentPayload(r))}
          />
        )}
        {loadedScenario.engineVersion === "v3" && loadedScenario.v3 && v3LaunchConfig && (
          <SimulatorEngineV3
            scenario={loadedScenario.v3}
            launchConfig={v3LaunchConfig}
            onExit={handleExitScenario}
            onComplete={(r) => handleScenarioComplete(mapV3ResultsToAssessmentPayload(r))}
          />
        )}
      </div>
    );
  }

  // Completion screen
  if (phase === "complete") {
    const totalScore = results.reduce((sum, r) => sum + r.percentage, 0);
    const avgScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;
    const totalTime = results.reduce((sum, r) => sum + r.totalTime, 0);

    return (
      <div className="min-h-screen bg-[oklch(0.06_0.005_250)] flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <CheckCircle2 className="w-16 h-16 text-[oklch(0.55_0.12_155)] mx-auto mb-4" />
            <h1 className="text-3xl font-['Oswald'] text-white mb-2">Assessment Complete</h1>
            <p className="text-[oklch(0.6_0_0)] font-['Inter']">
              Your results have been submitted. Your performance will be reviewed.
            </p>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-[oklch(0.1_0.005_250)] border border-[oklch(0.2_0_0)] rounded-lg p-4 text-center">
              <BarChart3 className="w-5 h-5 text-[oklch(0.55_0.12_155)] mx-auto mb-2" />
              <div className="text-2xl font-['Oswald'] text-white">{avgScore}%</div>
              <div className="text-xs text-[oklch(0.5_0_0)] font-['Share_Tech_Mono'] uppercase">Avg Score</div>
            </div>
            <div className="bg-[oklch(0.1_0.005_250)] border border-[oklch(0.2_0_0)] rounded-lg p-4 text-center">
              <Cpu className="w-5 h-5 text-[oklch(0.55_0.12_155)] mx-auto mb-2" />
              <div className="text-2xl font-['Oswald'] text-white">{results.length}</div>
              <div className="text-xs text-[oklch(0.5_0_0)] font-['Share_Tech_Mono'] uppercase">Completed</div>
            </div>
            <div className="bg-[oklch(0.1_0.005_250)] border border-[oklch(0.2_0_0)] rounded-lg p-4 text-center">
              <Clock className="w-5 h-5 text-[oklch(0.55_0.12_155)] mx-auto mb-2" />
              <div className="text-2xl font-['Oswald'] text-white">{formatTime(totalTime)}</div>
              <div className="text-xs text-[oklch(0.5_0_0)] font-['Share_Tech_Mono'] uppercase">Total Time</div>
            </div>
          </div>

          {/* Individual results */}
          <div className="space-y-3">
            {results.map((r, i) => (
              <div key={i} className="bg-[oklch(0.1_0.005_250)] border border-[oklch(0.2_0_0)] rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-['Inter'] text-white">{r.scenarioTitle}</div>
                  <div className="text-xs text-[oklch(0.5_0_0)] font-['Share_Tech_Mono']">
                    {formatTime(r.totalTime)} elapsed
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-['Oswald'] ${r.percentage >= 80 ? "text-[oklch(0.55_0.12_155)]" : r.percentage >= 60 ? "text-amber-400" : "text-red-400"}`}>
                    {r.percentage}%
                  </div>
                  <div className="text-xs text-[oklch(0.5_0_0)] font-['Share_Tech_Mono']">
                    Grade: {r.grade}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-[oklch(0.4_0_0)] font-['Inter']">
              Powered by Electrical Automation Services
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Intro screen
  return (
    <div className="min-h-screen bg-[oklch(0.06_0.005_250)] flex items-center justify-center px-4">
      <SEO
        title="Candidate Assessment"
        description="Complete your technical skills assessment for Electrical Automation Services. Timed troubleshooting scenarios to demonstrate your plant-floor expertise."
        path="/assessment"
      />
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-lg bg-[oklch(0.55_0.12_155/10%)] border border-[oklch(0.55_0.12_155/30%)] flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-[oklch(0.55_0.12_155)]" />
          </div>
          <h1 className="text-3xl font-['Oswald'] text-white mb-2 uppercase tracking-wide">
            Technical Assessment
          </h1>
          <p className="text-[oklch(0.6_0_0)] font-['Inter'] text-sm">
            Electrical Automation Services
          </p>
        </div>

        {/* Assessment details */}
        <div className="bg-[oklch(0.1_0.005_250)] border border-[oklch(0.2_0_0)] rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[oklch(0.15_0_0)] pb-3">
              <span className="text-[oklch(0.5_0_0)] font-['Share_Tech_Mono'] text-xs uppercase">Candidate</span>
              <span className="text-white font-['Inter'] text-sm">{assessment.candidateName}</span>
            </div>
            {assessment.position && (
              <div className="flex justify-between items-center border-b border-[oklch(0.15_0_0)] pb-3">
                <span className="text-[oklch(0.5_0_0)] font-['Share_Tech_Mono'] text-xs uppercase">Position</span>
                <span className="text-white font-['Inter'] text-sm">{assessment.position}</span>
              </div>
            )}
            {assessment.company && (
              <div className="flex justify-between items-center border-b border-[oklch(0.15_0_0)] pb-3">
                <span className="text-[oklch(0.5_0_0)] font-['Share_Tech_Mono'] text-xs uppercase">Company</span>
                <span className="text-white font-['Inter'] text-sm">{assessment.company}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-b border-[oklch(0.15_0_0)] pb-3">
              <span className="text-[oklch(0.5_0_0)] font-['Share_Tech_Mono'] text-xs uppercase">Scenarios</span>
              <span className="text-white font-['Inter'] text-sm">{pluralize(scenarioIds.length, "troubleshooting scenario")}</span>
            </div>
            {assessment.timeLimitMinutes > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-[oklch(0.5_0_0)] font-['Share_Tech_Mono'] text-xs uppercase">Time Limit</span>
                <span className="text-white font-['Inter'] text-sm">{assessment.timeLimitMinutes} minutes</span>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-[oklch(0.08_0.005_250)] border border-[oklch(0.18_0_0)] rounded-lg p-5 mb-6">
          <h3 className="text-sm font-['Oswald'] text-white uppercase tracking-wide mb-3">Instructions</h3>
          <ul className="space-y-2 text-sm text-[oklch(0.6_0_0)] font-['Inter']">
            <li className="flex items-start gap-2">
              <span className="text-[oklch(0.55_0.12_155)] mt-0.5">1.</span>
              You will be presented with industrial troubleshooting scenarios.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[oklch(0.55_0.12_155)] mt-0.5">2.</span>
              Read each situation carefully and select the best diagnostic action.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[oklch(0.55_0.12_155)] mt-0.5">3.</span>
              Use the available tools (Multimeter, Prints, Flashlight) to gather information.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[oklch(0.55_0.12_155)] mt-0.5">4.</span>
              Your score is based on correct decisions, time efficiency, and tool usage.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[oklch(0.55_0.12_155)] mt-0.5">5.</span>
              Results are automatically submitted upon completion.
            </li>
          </ul>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={startMutation.isPending}
          className="w-full btn-primary flex items-center justify-center gap-3 px-6 py-4 font-semibold text-sm tracking-wider uppercase rounded-lg"
        >
          {startMutation.isPending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Play className="w-5 h-5" />
              Begin Assessment
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-[oklch(0.4_0_0)] font-['Inter'] mt-4">
          Once started, the timer cannot be paused.
        </p>
      </div>
    </div>
  );
}
