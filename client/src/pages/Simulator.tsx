/**
 * EAS Simulator Page
 * Design: Premium industrial controls interface
 * Typography: Oswald (headings), Inter (body), Share Tech Mono (labels)
 */
import { motion } from "framer-motion";
import { Link, useLocation, useSearch } from "wouter";
import { useState, useCallback, useEffect, useRef } from "react";
import { useOrientation } from "@/hooks/useOrientation";
import OrientationPrompt from "@/components/OrientationPrompt";
import {
  Zap, Activity, Cpu, Play, ArrowRight, AlertTriangle,
  CheckCircle2, XCircle, Timer, BarChart3, Gauge,
  CircuitBoard, Monitor, Wrench, ChevronRight, Lock, RotateCcw
} from "lucide-react";
import SimulatorEngine from "@/components/SimulatorEngine";
import type { SimulationResults } from "@/components/SimulatorEngine";
import SimulatorEngineV2 from "@/components/SimulatorEngineV2";
import type { SimV2Results } from "@/components/SimulatorEngineV2";
import SimulatorEngineV3 from "@/components/SimulatorEngineV3";
import SimulatorOnboarding from "@/components/SimulatorOnboarding";
import { scenarioDatabase } from "@/data/scenarios";
import { useProgress } from "@/hooks/useProgress";
import RequestAccessForm from "@/components/RequestAccessForm";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useAnalytics } from "@/hooks/useAnalytics";
import SEO from "@/components/SEO";
import { pluralNoun } from "@/lib/pluralize";
import ContentProtection from "@/components/ContentProtection";
import ErrorBoundary from "@/components/ErrorBoundary";
import ScenarioProgressionCard from "@/components/ScenarioProgressionCard";
import ScenarioDifficultyProgression from "@/components/ScenarioDifficultyProgression";
import ScenarioLauncher from "@/components/ScenarioLauncher";
import type { LaunchConfig } from "@/components/ScenarioLauncher";
import type { SimulatorResumeState } from "@/components/SimulatorEngineV3";
import { resolveSimulatorScenarioId } from "@shared/scenarioLinking";
import {
  getCatalogEntry,
  getBrowsableCatalog,
  type SimulatorCatalogEntry,
} from "@shared/simulatorCatalog";
import {
  getRuntimeScenario,
  getDefaultScenarioId,
  resolveScenarioIdFromUrl,
  type RuntimeScenarioItem,
} from "@/lib/simulatorRuntime";
import SimulatorScenarioBrowse from "@/components/simulator/SimulatorScenarioBrowse";
import type { ScenarioV3 } from "@/data/scenariosV3";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

const difficultyColors: Record<string, string> = {
  Beginner: "text-[oklch(0.55_0.12_155)]",
  Intermediate: "text-[oklch(0.75_0.12_75)]",
  Advanced: "text-[oklch(0.65_0.18_25)]",
  Adaptive: "text-[oklch(0.55_0.12_155)]",
};

const difficultyBorders: Record<string, string> = {
  Beginner: "border-[oklch(0.55_0.12_155/35%)]",
  Intermediate: "border-[oklch(0.75_0.12_75/35%)]",
  Advanced: "border-[oklch(0.65_0.18_25/35%)]",
  Adaptive: "border-[oklch(0.55_0.12_155/35%)]",
};

// First 2 paid engine scenarios are free; labs always free
const FREE_SCENARIO_LIMIT = 2;

const BROWSABLE_SCENARIO_COUNT = getBrowsableCatalog().filter(
  (e) => e.clickable && e.engine !== "lab"
).length;

function getInitialScenarioId(): string {
  if (typeof window === "undefined") return getDefaultScenarioId();
  const params = new URLSearchParams(window.location.search);
  return resolveScenarioIdFromUrl(params.get("scenario"), resolveSimulatorScenarioId);
}

function scenarioDataDescription(item: RuntimeScenarioItem): string | undefined {
  const data = item.data as { description?: string } | null;
  return data?.description;
}

function scenarioDataTools(item: RuntimeScenarioItem): { name: string; seniorOnly: boolean }[] {
  if (item.isV3 && item.data) {
    const v3 = item.data as ScenarioV3;
    return v3.tools.map((t) => ({
      name: t.name,
      seniorOnly: !!(t.availableFor && t.availableFor.length === 1 && t.availableFor[0] === "senior"),
    }));
  }
  if (!item.isV2 && !item.isV3 && item.data) {
    const v1 = item.data as { equipment?: string[] };
    return (v1.equipment ?? []).map((name) => ({ name, seniorOnly: false }));
  }
  const catalog = getCatalogEntry(item.id);
  return (catalog?.tools ?? []).map((name) => ({ name, seniorOnly: false }));
}

export default function Simulator() {
  const [activeScenarioId, setActiveScenarioId] = useState(getInitialScenarioId);
  const [simulatorActive, setSimulatorActive] = useState(false);
  const [location, navigate] = useLocation();
  const search = useSearch();

  const scenarioDetailRef = useRef<HTMLDivElement>(null);
  const scenarioListRef = useRef<HTMLDivElement>(null);

  const activeItem = getRuntimeScenario(activeScenarioId) ?? getRuntimeScenario(getDefaultScenarioId())!;
  const activeCatalog = getCatalogEntry(activeScenarioId);

  const handleSelectScenario = useCallback((id: string) => {
    const entry = getCatalogEntry(id);
    if (entry?.engine === "lab" && entry.route) {
      navigate(entry.route);
      return;
    }
    setActiveScenarioId(id);
    navigate(`/simulator?scenario=${encodeURIComponent(id)}`, { replace: true });
    requestAnimationFrame(() => {
      const stacked = typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches;
      if (stacked) {
        scenarioDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const id = resolveScenarioIdFromUrl(params.get("scenario"), resolveSimulatorScenarioId);
    if (id !== activeScenarioId) {
      setActiveScenarioId(id);
      setTimeout(() => {
        scenarioDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, search]);
  const { orientation, isMobile, isTablet } = useOrientation();
  const isPortraitMobile = (isMobile || isTablet) && orientation === "portrait";
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data: subscription, isLoading: subLoading } = trpc.stripe.getSubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const hasPaidAccess = subscription?.hasActiveSubscription || false;
  const subscriptionResolved = !authLoading && (!isAuthenticated || !subLoading);

  const isScenarioLocked = (entry: SimulatorCatalogEntry, indexAmongPaid: number) => {
    if (!subscriptionResolved) return false;
    if (entry.engine === "lab") return false;
    if (indexAmongPaid < FREE_SCENARIO_LIMIT) return false;
    return !hasPaidAccess;
  };

  const getPaidLockIndex = (id: string) => {
    const paid = getBrowsableCatalog().filter((e) => e.clickable && e.engine !== "lab");
    return paid.findIndex((e) => e.id === id);
  };

  const isActiveLocked = () => {
    const entry = getCatalogEntry(activeScenarioId);
    if (!entry) return false;
    const idx = getPaidLockIndex(activeScenarioId);
    return isScenarioLocked(entry, idx >= 0 ? idx : 0);
  };
  const [lastResults, setLastResults] = useState<SimulationResults | null>(null);
  const { progress, recordCompletion, getScenarioRecord } = useProgress();
  const recordStreak = trpc.streaks.recordActivity.useMutation();
  const { trackSimulatorLaunched, trackSimulatorCompleted } = useAnalytics();
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [showRotateOverlay, setShowRotateOverlay] = useState(false);
  const [showLauncher, setShowLauncher] = useState(false);
  const [launchConfig, setLaunchConfig] = useState<LaunchConfig | null>(null);
  const [resumeState, setResumeState] = useState<SimulatorResumeState | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [pendingResumeData, setPendingResumeData] = useState<any>(null);

  // Auto-dismiss rotate overlay when user rotates to landscape (V1/V2 only)
  // V3 scenarios don't use this overlay — they handle orientation internally
  useEffect(() => {
    if (!isPortraitMobile && showRotateOverlay) {
      setShowRotateOverlay(false);
      if (!activeItem.isV3) {
        setSimulatorActive(true);
      }
    }
  }, [isPortraitMobile, showRotateOverlay, activeItem.isV3]);

  const selectedScenarioItem = activeItem;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: savedSession } = (trpc as any).simulatorSession.get.useQuery(
    { scenarioId: selectedScenarioItem?.id || "" },
    { enabled: isAuthenticated && !!selectedScenarioItem?.isV3 }
  );

  const handleStartScenario = () => {
    if (activeItem.isLab && activeItem.labRoute) {
      navigate(activeItem.labRoute);
      return;
    }
    if (!activeItem.isV3 && isPortraitMobile) {
      setShowRotateOverlay(true);
      return;
    }
    if (activeItem.isV3) {
      if (savedSession && savedSession.phase === "active") {
        setPendingResumeData(savedSession);
        setShowResumePrompt(true);
        return;
      }
      try {
        const localData = localStorage.getItem(`eas-sim-session-${activeItem.id}`);
        if (localData) {
          const parsed = JSON.parse(localData);
          const isRecent = Date.now() - (parsed.savedAt || 0) < 24 * 60 * 60 * 1000;
          if (isRecent && parsed.phase === "active" && parsed.actionCount > 0) {
            setPendingResumeData(parsed);
            setShowResumePrompt(true);
            return;
          } else {
            localStorage.removeItem(`eas-sim-session-${activeItem.id}`);
          }
        }
      } catch { /* localStorage unavailable */ }
      setShowLauncher(true);
      return;
    }
    setSimulatorActive(true);
  };

  const handleLaunch = (config: LaunchConfig) => {
    setLaunchConfig(config);
    setShowLauncher(false);
    setSimulatorActive(true);
    trackSimulatorLaunched({
      scenarioId: activeItem.id,
      scenarioTitle: activeItem.title,
      playMode: config.mode,
      difficulty: config.modifier,
    });
  };

  // Store the entry point when the simulator engine activates
  // so the X button can return users to where they came from
  // BUG FIX: document.referrer is empty for SPA navigation (wouter Link).
  // We capture the referrer on page mount AND check history state for SPA nav.
  const entryPointRef = useRef<string | null>(null);
  useEffect(() => {
    // On mount, capture where the user came from (works for both full page loads and SPA nav)
    const referrer = document.referrer;
    const currentOrigin = window.location.origin;
    if (referrer && referrer.startsWith(currentOrigin) && !referrer.includes('/simulator')) {
      entryPointRef.current = new URL(referrer).pathname + new URL(referrer).search;
    }
  }, []);

  useEffect(() => {
    if (simulatorActive) {
      // Only store if not already set (don't overwrite on re-renders)
      if (!sessionStorage.getItem('simulator_entry_point')) {
        if (entryPointRef.current) {
          sessionStorage.setItem('simulator_entry_point', entryPointRef.current);
        }
      }
    } else {
      // Clean up when simulator deactivates
      sessionStorage.removeItem('simulator_entry_point');
    }
  }, [simulatorActive]);

  const handleExitSimulator = () => {
    setSimulatorActive(false);
    // Navigate back to entry point if available, otherwise explicitly go to /simulator
    const entryPoint = sessionStorage.getItem('simulator_entry_point');
    sessionStorage.removeItem('simulator_entry_point');
    // Always navigate — fallback to /simulator scenario list if no entry point
    navigate(entryPoint || '/simulator');
  };

  const handleSimulationComplete = useCallback((results: SimulationResults) => {
    setLastResults(results);
    recordCompletion({
      scenarioId: results.scenarioId,
      scenarioTitle: results.scenarioTitle,
      score: results.totalScore,
      percentage: results.percentage,
      grade: results.grade,
      timeSeconds: results.totalTime,
    });
    if (isAuthenticated) recordStreak.mutate(); // Tie streak to scenario completion (auth only)
    trackSimulatorCompleted({
      scenarioId: results.scenarioId,
      scenarioTitle: results.scenarioTitle,
      score: results.totalScore,
      maxScore: results.maxScore || 100,
      timeSeconds: results.totalTime,
    });
  }, [recordCompletion, recordStreak, trackSimulatorCompleted]);

  const handleV2Complete = useCallback((results: SimV2Results) => {
    setLastResults({
      scenarioId: results.scenarioId,
      scenarioTitle: results.scenarioTitle,
      totalScore: results.totalScore,
      maxScore: results.maxScore,
      percentage: results.percentage,
      grade: results.grade,
      totalTime: results.totalTime,
      hintsUsed: results.hintsUsed,
      perfectPath: results.efficiency >= 90,
      decisions: results.actionsLog.map(a => ({
        stepTitle: a.location,
        chosenOption: `${a.tool}: ${a.reading}`,
        wasCorrect: a.wasUseful,
        scoreImpact: a.wasUseful ? 15 : -3,
        timeSpent: a.timestamp,
      })),
    });
    recordCompletion({
      scenarioId: results.scenarioId,
      scenarioTitle: results.scenarioTitle,
      score: results.totalScore,
      percentage: results.percentage,
      grade: results.grade,
      timeSeconds: results.totalTime,
    });
    if (isAuthenticated) recordStreak.mutate(); // Tie streak to scenario completion (auth only)
    trackSimulatorCompleted({
      scenarioId: results.scenarioId,
      scenarioTitle: results.scenarioTitle,
      score: results.totalScore,
      maxScore: results.maxScore,
      timeSeconds: results.totalTime,
    });
  }, [recordCompletion, recordStreak, trackSimulatorCompleted]);

  // NON-DESTRUCTIVE: When user rotates to portrait during V1/V2, show an overlay
  // instead of destroying the simulator. This preserves all state, timers, and progress.
  // V3 has its own blocking overlay inside the engine.
  const showV1V2PortraitOverlay = simulatorActive && isPortraitMobile && !activeItem.isV3;

  if (simulatorActive) {
    if (activeItem.isV3 && activeItem.data) {
      return (
        <>
        <SimulatorOnboarding show />
        <ErrorBoundary fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060a06] p-6">
            <div className="text-center max-w-sm">
              <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: "'Oswald', sans-serif" }}>Simulator Error</h2>
              <p className="text-sm text-gray-400 mb-5">The simulator encountered an issue. This may be due to a temporary glitch.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Retry
                </button>
                <button onClick={() => { setSimulatorActive(false); }} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/10 transition-colors">
                  Back to Scenarios
                </button>
              </div>
            </div>
          </div>
        }>
        <SimulatorEngineV3
          key={`v3-${activeScenarioId}-${JSON.stringify(launchConfig)}-${resumeState ? 'resume' : 'fresh'}`}
          scenario={activeItem.data as ScenarioV3}
          onExit={() => { setResumeState(null); handleExitSimulator(); }}
          launchConfig={launchConfig || undefined}
          resumeState={resumeState || undefined}
          onComplete={(results: any) => {
            setLastResults({
              scenarioId: results.scenarioId,
              scenarioTitle: results.scenarioTitle,
              totalScore: results.totalScore,
              maxScore: results.maxScore,
              percentage: results.percentage,
              grade: results.grade,
              totalTime: results.totalTime,
              hintsUsed: results.hintsUsed || 0,
              perfectPath: results.efficiency >= 90,
              decisions: results.actionsLog?.map((a: any) => ({
                stepTitle: a.location || a.action,
                chosenOption: a.reading || a.result,
                wasCorrect: a.wasUseful || a.isCorrect,
                scoreImpact: a.scoreImpact || 0,
                timeSpent: a.timestamp || '0:00',
              })) || [],
            });
            recordCompletion({
              scenarioId: results.scenarioId,
              scenarioTitle: results.scenarioTitle,
              score: results.totalScore,
              percentage: results.percentage,
              grade: results.grade,
              timeSeconds: results.totalTime,
            });
          }}
        />
        </ErrorBoundary>
        </>
      );
    }
    if (activeItem.isV2 && activeItem.data) {
      return (
        <>
          {showV1V2PortraitOverlay && (
            <OrientationPrompt show={true} onDismiss={() => { /* overlay auto-dismisses when landscape detected */ }} />
          )}
          <ErrorBoundary fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060a06] p-6">
              <div className="text-center max-w-sm">
                <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-amber-400" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: "'Oswald', sans-serif" }}>Simulator Error</h2>
                <p className="text-sm text-gray-400 mb-5">The simulator encountered an issue. Please try again.</p>
                <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Retry
                </button>
              </div>
            </div>
          }>
          <SimulatorEngineV2
            key={`v2-${activeScenarioId}`}
            scenario={activeItem.data as Parameters<typeof SimulatorEngineV2>[0]["scenario"]}
            onExit={handleExitSimulator}
            onComplete={handleV2Complete}
          />
          </ErrorBoundary>
        </>
      );
    }
    const scenarioData = activeItem.data
      ? (activeItem.data as Parameters<typeof SimulatorEngine>[0]["scenario"])
      : scenarioDatabase.find(s => s.id === activeItem.id);
    if (scenarioData) {
      return (
        <>
          {showV1V2PortraitOverlay && (
            <OrientationPrompt show={true} onDismiss={() => { /* overlay auto-dismisses when landscape detected */ }} />
          )}
          <ErrorBoundary fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060a06] p-6">
              <div className="text-center max-w-sm">
                <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-amber-400" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: "'Oswald', sans-serif" }}>Simulator Error</h2>
                <p className="text-sm text-gray-400 mb-5">The simulator encountered an issue. Please try again.</p>
                <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" /> Retry
                </button>
              </div>
            </div>
          }>
          <SimulatorEngine
            key={`v1-${activeScenarioId}`}
            scenario={scenarioData}
            onExit={handleExitSimulator}
            onComplete={handleSimulationComplete}
          />
          </ErrorBoundary>
        </>
      );
    }
  }

  const activeDescription = scenarioDataDescription(activeItem);
  const activeTools = scenarioDataTools(activeItem);

  return (
    <ContentProtection>
      {/* Rotate overlay - shown when user taps a scenario in portrait mode */}
      {showRotateOverlay && isPortraitMobile && (
        <OrientationPrompt show={true}         onDismiss={() => {
          setShowRotateOverlay(false);
          if (activeItem.isV3) {
            setShowLauncher(true);
          } else {
            setSimulatorActive(true);
          }
        }} />
      )}
      {showLauncher && activeItem.isV3 && activeItem.data != null ? (
        <ScenarioLauncher
          scenario={activeItem.data as ScenarioV3}
          onLaunch={handleLaunch}
          onCancel={() => setShowLauncher(false)}
        />
      ) : null}
      <SEO
        title="Troubleshooting Simulator"
        description="Interactive plant-floor troubleshooting simulator with real-world scenarios. Practice diagnosing conveyor faults, VFD trips, motor starter issues, and safety circuit problems."
        path="/simulator"
      />
      {/* Hero */}
      <section className="py-20 sm:py-28 border-b border-[oklch(0.18_0.004_250)]">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <h1 className="text-4xl sm:text-5xl font-heading text-white tracking-wide mb-5">
              Troubleshooting Simulator
            </h1>
            <p className="text-lg text-[oklch(0.65_0.008_250)] leading-relaxed mb-4">
              Interactive fault scenarios with branching decision trees and consequence-based scoring. Think like a tech, not a textbook.
            </p>
            <p className="text-sm text-[oklch(0.50_0.008_250)] italic">
              Built from real industrial troubleshooting experience, not textbook theory.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Progress Stats Banner */}
      {progress.totalCompleted > 0 && (
        <section className="py-4 bg-[oklch(0.06_0.003_250)] border-y border-[oklch(0.55_0.12_155/10%)]">
          <div className="container">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[oklch(0.55_0.12_155/8%)] border border-[oklch(0.55_0.12_155/20%)] flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
                </div>
                <div>
                  <span className="font-mono-industrial text-[9px] text-[oklch(0.55_0.12_155)] tracking-wider">YOUR PROGRESS</span>
                  <p className="text-[12px] text-[oklch(0.6_0.008_250)]">{progress.totalCompleted} of {BROWSABLE_SCENARIO_COUNT} {pluralNoun(BROWSABLE_SCENARIO_COUNT, "scenario")} completed</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-sm font-mono-industrial text-white">{progress.averageScore}%</div>
                  <div className="font-mono-industrial text-[9px] text-[oklch(0.4_0.006_250)]">AVG SCORE</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-mono-industrial text-white">{progress.totalAttempts}</div>
                  <div className="font-mono-industrial text-[9px] text-[oklch(0.4_0.006_250)]">ATTEMPTS</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-mono-industrial text-white">{progress.averageTime > 60 ? `${Math.floor(progress.averageTime / 60)}m` : `${progress.averageTime}s`}</div>
                  <div className="font-mono-industrial text-[9px] text-[oklch(0.4_0.006_250)]">AVG TIME</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Interactive Demo Section */}
      <section className="py-12 lg:py-16 bg-[oklch(0.07_0.003_250)]">
        <div className="container">
          <motion.div {...fadeInUp} className="mb-8">
            <span className="font-mono-industrial text-[11px] text-[oklch(0.55_0.12_155)] tracking-wider block mb-2">
              LIVE FAULT ENVIRONMENT
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading text-white tracking-wide">
              SCENARIO SELECTION
            </h2>
          </motion.div>

          {/* Recommended Next Scenario */}
          <div className="mb-6">
            <ScenarioProgressionCard />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2">
              <style>{`
                .scrollbar-industrial::-webkit-scrollbar { width: 4px; }
                .scrollbar-industrial::-webkit-scrollbar-track { background: oklch(0.10 0.003 250); border-radius: 2px; }
                .scrollbar-industrial::-webkit-scrollbar-thumb { background: oklch(0.25 0.006 250); border-radius: 2px; }
                .scrollbar-industrial::-webkit-scrollbar-thumb:hover { background: oklch(0.35 0.008 250); }
              `}</style>
              <SimulatorScenarioBrowse
                activeId={activeScenarioId}
                isScenarioLocked={isScenarioLocked}
                getBestScore={(id) => getScenarioRecord(id)?.bestPercentage}
                onSelect={handleSelectScenario}
                listRef={scenarioListRef}
              />
            </div>

            {/* Scenario Detail */}
            <div ref={scenarioDetailRef} className="lg:col-span-3 card-panel p-5 lg:p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <span className="font-mono-industrial text-[10px] text-[oklch(0.55_0.12_155)] tracking-wider block mb-1">
                    {activeItem.isLab ? "INTERACTIVE LAB" : "ACTIVE SCENARIO"}
                  </span>
                  <h3 className="text-lg font-semibold text-white leading-tight">
                    {activeItem.title}
                  </h3>
                </div>
                <span className={`px-2.5 py-1 rounded text-[10px] font-mono-industrial border ${difficultyBorders[activeItem.difficulty] ?? difficultyBorders.Adaptive} ${difficultyColors[activeItem.difficulty] ?? difficultyColors.Adaptive}`}>
                  {activeItem.difficulty.toUpperCase()}
                </span>
              </div>

              {(activeDescription || activeCatalog?.equipmentType) && (
                <div className="mb-5 p-3.5 bg-[oklch(0.08_0.003_250)] rounded border border-[oklch(0.18_0.004_250)]">
                  <p className="text-[13px] text-[oklch(0.6_0.008_250)] leading-relaxed">
                    {activeDescription ?? activeCatalog?.equipmentType}
                  </p>
                </div>
              )}

              {/* Fault List */}
              <div className="mb-5">
                <span className="font-mono-industrial text-[10px] text-[oklch(0.45_0.006_250)] tracking-wider block mb-2.5">POSSIBLE FAULTS</span>
                <div className="space-y-1.5">
                  {activeItem.faults.map((fault, i) => (
                    <div key={i} className="fault-card flex items-center gap-3 px-3 py-2.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[oklch(0.75_0.12_75)] shrink-0" />
                      <span className="text-[13px] text-[oklch(0.65_0.008_250)]">{fault}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipment Needed */}
              {activeTools.length > 0 && (
                <div className="mb-5">
                  <span className="font-mono-industrial text-[10px] text-[oklch(0.45_0.006_250)] tracking-wider block mb-2.5">EQUIPMENT</span>
                  <div className="flex flex-wrap gap-2">
                    {activeTools.map((item, i) => (
                      <span key={i} className={`tool-btn text-[12px] font-mono-industrial py-1.5 px-3 ${item.seniorOnly ? "text-[oklch(0.45_0.08_250)] border-dashed" : "text-[oklch(0.55_0.12_155)]"}`} title={item.seniorOnly ? "Senior Tech role only" : ""}>
                        {item.name}{item.seniorOnly && <span className="ml-1 text-[9px] opacity-60">★</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!activeItem.isLab && (
                <div className="p-3.5 bg-[oklch(0.08_0.003_250)] rounded border border-[oklch(0.18_0.004_250)] mb-5">
                  <span className="font-mono-industrial text-[10px] text-[oklch(0.55_0.12_155)] tracking-wider block mb-3">DIAGNOSTIC DECISION TREE</span>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[oklch(0.55_0.12_155)]" />
                      <span className="text-[12px] text-[oklch(0.55_0.008_250)] font-mono-industrial">Control power present? → <span className="text-[oklch(0.55_0.12_155)]">120VAC confirmed</span></span>
                    </div>
                    <div className="flex items-center gap-2.5 pl-5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[oklch(0.55_0.12_155)]" />
                      <span className="text-[12px] text-[oklch(0.55_0.008_250)] font-mono-industrial">Safety circuit closed? → <span className="text-[oklch(0.55_0.12_155)]">YES</span></span>
                    </div>
                    <div className="flex items-center gap-2.5 pl-10">
                      <XCircle className="w-3.5 h-3.5 text-[oklch(0.75_0.12_75)]" />
                      <span className="text-[12px] text-[oklch(0.55_0.008_250)] font-mono-industrial">Contactor pulling in? → <span className="text-[oklch(0.75_0.12_75)]">NO — investigating</span></span>
                    </div>
                    <div className="flex items-center gap-2.5 pl-14">
                      <span className="w-3.5 h-3.5 rounded-full border border-[oklch(0.3_0.004_250)] flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.75_0.12_75)] animate-pulse" />
                      </span>
                      <span className="text-[12px] text-[oklch(0.45_0.006_250)] font-mono-industrial">Measure coil voltage... <span className="text-[oklch(0.75_0.12_75)]">awaiting input</span></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Start Button - gated by subscription */}
              <div className="pb-28 lg:pb-0" style={{ paddingBottom: 'max(7rem, calc(5rem + env(safe-area-inset-bottom)))' }}>
              {activeItem.isLab ? (
                <button
                  onClick={handleStartScenario}
                  className="w-full btn-primary flex items-center justify-center gap-3 px-6 py-3.5 font-semibold text-[13px] tracking-wider uppercase rounded"
                >
                  <Play className="w-4 h-4" />
                  Open Lab
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : isActiveLocked() ? (
                <Link href="/pricing">
                  <div className="w-full flex items-center justify-center gap-3 px-6 py-3.5 font-semibold text-[13px] tracking-wider uppercase rounded bg-[oklch(0.75_0.12_75/12%)] border border-[oklch(0.75_0.12_75/30%)] text-[oklch(0.75_0.12_75)] cursor-pointer hover:bg-[oklch(0.75_0.12_75/18%)] transition-colors">
                    <Lock className="w-4 h-4" />
                    Upgrade to Pro to Unlock
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ) : isPortraitMobile && !activeItem.isV3 ? (
                <div className="w-full flex flex-col items-center gap-2">
                  <button
                    onClick={() => setShowRotateOverlay(true)}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3.5 font-semibold text-[13px] tracking-wider uppercase rounded bg-[oklch(0.18_0.004_250)] border border-[oklch(0.25_0.004_250)] text-[oklch(0.45_0.006_250)] hover:bg-[oklch(0.22_0.004_250)] transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Rotate to Landscape to Start
                  </button>
                  <span className="text-[11px] text-[oklch(0.40_0.006_250)] font-mono-industrial">Tap to see instructions</span>
                </div>
              ) : (
                <button
                  onClick={handleStartScenario}
                  className="w-full btn-primary flex items-center justify-center gap-3 px-6 py-3.5 font-semibold text-[13px] tracking-wider uppercase rounded"
                >
                  <Play className="w-4 h-4" />
                  Start This Scenario
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Last Results Banner */}
      {lastResults && (
        <section className="py-6 bg-[oklch(0.08_0.003_250)] border-y border-[oklch(0.55_0.12_155/12%)]">
          <div className="container">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-[oklch(0.55_0.12_155/8%)] border border-[oklch(0.55_0.12_155/20%)] flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
                </div>
                <div>
                  <span className="font-mono-industrial text-[10px] text-[oklch(0.55_0.12_155)] block">LAST RESULT</span>
                  <span className="text-[13px] font-semibold text-white">{lastResults.scenarioTitle}</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-base font-mono-industrial text-white">{lastResults.percentage}%</div>
                  <div className="font-mono-industrial text-[9px] text-[oklch(0.45_0.006_250)]">SCORE</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-mono-industrial text-white">{lastResults.grade}</div>
                  <div className="font-mono-industrial text-[9px] text-[oklch(0.45_0.006_250)]">GRADE</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-mono-industrial text-white">{Math.floor(lastResults.totalTime / 60)}m</div>
                  <div className="font-mono-industrial text-[9px] text-[oklch(0.45_0.006_250)]">TIME</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Difficulty Progression */}
      {isAuthenticated && (
        <section className="py-12 lg:py-16">
          <div className="container max-w-4xl">
            <ScenarioDifficultyProgression />
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16 lg:py-20">
        <div className="container">
          <motion.div {...fadeInUp} className="mb-12">
            <span className="font-mono-industrial text-[11px] text-[oklch(0.55_0.12_155)] tracking-wider block mb-2">
              SIMULATOR CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading text-white tracking-wide">
              CONTROLS DIAGNOSTIC ENGINE
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: CircuitBoard,
                title: "Ladder Logic Tracing",
                desc: "Step through relay logic rung-by-rung. Identify open circuits, failed coils, and incorrect sequencing in real control schematics.",
              },
              {
                icon: Gauge,
                title: "Live Multimeter Simulation",
                desc: "Virtual DMM with realistic readings. Test voltage, continuity, and resistance at actual test points in the circuit.",
              },
              {
                icon: Monitor,
                title: "HMI & SCADA Integration",
                desc: "Read fault codes, interpret alarm logs, and navigate operator interfaces to gather diagnostic information.",
              },
              {
                icon: Activity,
                title: "Dynamic Fault Generation",
                desc: "No two scenarios play the same. Fault combinations create unique troubleshooting challenges every session.",
              },
              {
                icon: Timer,
                title: "Timed Challenges",
                desc: "Race against realistic downtime clocks. Practice making efficient diagnostic decisions under production pressure.",
              },
              {
                icon: BarChart3,
                title: "Tech Scoring System",
                desc: "Scored on methodology, efficiency, and accuracy. Track progression from apprentice to master troubleshooter.",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card-panel p-5 flex gap-4 group"
              >
                <div className="w-10 h-10 rounded bg-[oklch(0.55_0.12_155/8%)] border border-[oklch(0.55_0.12_155/15%)] flex items-center justify-center shrink-0 group-hover:border-[oklch(0.55_0.12_155/30%)] transition-colors">
                  <feature.icon className="w-5 h-5 text-[oklch(0.55_0.12_155)]" />
                </div>
                <div>
                  <h4 className="text-[14px] font-semibold text-white mb-1.5">{feature.title}</h4>
                  <p className="text-[13px] text-[oklch(0.5_0.008_250)] leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Progression System */}
      <section className="py-16 lg:py-20 bg-[oklch(0.07_0.003_250)]">
        <div className="container">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <span className="font-mono-industrial text-[11px] text-[oklch(0.55_0.12_155)] tracking-wider block mb-2">
              PROGRESSION SYSTEM
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading text-white tracking-wide mb-3">
              STRUCTURED SKILL DEVELOPMENT
            </h2>
            <p className="text-[14px] text-[oklch(0.5_0.008_250)] max-w-lg mx-auto">
              From basic electrical to advanced controls diagnostics — a clear path forward.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { level: "01", title: "APPRENTICE", desc: "Basic electrical safety, meter usage, simple circuit faults", color: "oklch(0.55_0.12_155)" },
              { level: "02", title: "JOURNEYMAN", desc: "Motor control circuits, relay logic, PLC I/O troubleshooting", color: "oklch(0.55_0.12_155)" },
              { level: "03", title: "SPECIALIST", desc: "VFD diagnostics, network faults, SCADA alarm management", color: "oklch(0.75_0.12_75)" },
              { level: "04", title: "MASTER", desc: "Complex multi-system failures, root cause analysis, mentoring", color: "oklch(0.65_0.18_25)" },
            ].map((level, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-panel p-5 text-center"
              >
                <div className="text-3xl font-heading mb-1.5" style={{ color: level.color }}>{level.level}</div>
                <h4 className="text-[11px] font-mono-industrial text-white mb-2.5 tracking-wider">{level.title}</h4>
                <p className="text-[12px] text-[oklch(0.45_0.006_250)] leading-relaxed">{level.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20">
        <div className="container text-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl sm:text-4xl font-heading text-white tracking-wide mb-4">
              READY TO <span className="text-[oklch(0.55_0.12_155)]">BEGIN?</span>
            </h2>
            <p className="text-[14px] text-[oklch(0.5_0.008_250)] max-w-md mx-auto mb-6">
              Get full access for your maintenance team. All scenarios, progress tracking, and custom scenario development.
            </p>
            <button
              onClick={() => setShowAccessForm(true)}
              className="btn-primary inline-flex items-center gap-3 px-7 py-3.5 font-semibold text-[13px] tracking-wider uppercase rounded"
            >
              Request Full Access
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Lead Capture Form Modal */}
      {showAccessForm && (
        <RequestAccessForm onClose={() => setShowAccessForm(false)} />
      )}

      {/* Resume Session Prompt */}
      <AlertDialog open={showResumePrompt} onOpenChange={setShowResumePrompt}>
        <AlertDialogContent className="bg-[oklch(0.1_0.003_250)] border-[oklch(0.2_0.004_250)] text-white max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-lg tracking-wide text-white">
              RESUME SESSION?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[oklch(0.55_0.008_250)] text-sm leading-relaxed">
              You have an in-progress session for this scenario.
              {pendingResumeData && (
                <span className="block mt-2 text-[oklch(0.6_0.08_155)] font-mono text-xs">
                  {pendingResumeData.actionCount} actions taken &middot; {Math.floor((pendingResumeData.elapsedSeconds || 0) / 60)}:{String((pendingResumeData.elapsedSeconds || 0) % 60).padStart(2, '0')} elapsed
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel
              className="bg-transparent border-[oklch(0.25_0.004_250)] text-[oklch(0.6_0.008_250)] hover:bg-[oklch(0.15_0.003_250)] hover:text-white"
              onClick={() => {
                setShowResumePrompt(false);
                setPendingResumeData(null);
                setResumeState(null);
                // Clear localStorage crash recovery data
                try { localStorage.removeItem(`eas-sim-session-${activeScenarioId}`); } catch {}
                setShowLauncher(true);
              }}
            >
              Start Fresh
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-[oklch(0.45_0.12_155)] hover:bg-[oklch(0.5_0.12_155)] text-white font-semibold"
              onClick={() => {
                if (pendingResumeData) {
                  setResumeState({
                    phase: pendingResumeData.phase,
                    gameState: pendingResumeData.gameState,
                    currentScore: pendingResumeData.currentScore || 0,
                    actionCount: pendingResumeData.actionCount || 0,
                    elapsedSeconds: pendingResumeData.elapsedSeconds || 0,
                  });
                  // Set launch config from saved session
                  setLaunchConfig({
                    mode: pendingResumeData.playMode || 'standard',
                    modifier: pendingResumeData.difficulty || 'standard',
                    variant: null,
                    scenarioId: pendingResumeData.scenarioId,
                  });
                }
                setShowResumePrompt(false);
                setPendingResumeData(null);
                setSimulatorActive(true);
              }}
            >
              Resume
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ContentProtection>
  );
}
