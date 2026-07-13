/**
 * SimulatorEngineV3 — Immersive Industrial Command Center
 * 
 * Split-panel layout optimized for landscape mobile:
 * - LEFT: Machine visualization, circuit diagram, alarm indicators, process state
 * - RIGHT: Diagnostics panel (tools, measurements, communications, actions)
 * - BOTTOM (mobile): Floating tool belt with quick-access controls
 * 
 * ALL LOGIC UNCHANGED from original V3.
 */

import { useState, useEffect, useCallback, useRef, useMemo, type Dispatch, type SetStateAction } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gauge, FileText, Flashlight, Monitor, Zap, Activity,
  Clock, Timer, Target, Award, TrendingUp, X, ChevronLeft, ChevronRight,
  Lightbulb, AlertTriangle, CheckCircle2, XCircle,
  ArrowRight, RotateCcw, Info, HardHat, Wrench,
  Radio, Thermometer, Eye, Phone, MessageSquare,
  BookOpen, Shield, Skull, Volume2, Settings,
  Crosshair, Search, ChevronDown, Compass,
  Maximize2, Minimize2, ChevronUp, Layers,
  PanelLeftClose, PanelRightClose
} from "lucide-react";
import type {
  ScenarioV3, TechRole, ToolId, Tool, MeterSetting,
  MeasurementLocation, TerminalMeasurement, SimpleReading,
  SystemState, SystemAction, TimePressureEvent,
  CommunicationChannel, AnimationTrigger, AnimationType,
  FaultLogEntry, GlossaryTerm, CircuitDiagram, Fault
} from "@/data/scenariosV3";
import { METER_SETTING_LABELS } from "@/data/scenariosV3";
import InteractiveCircuitDiagramV3 from "./InteractiveCircuitDiagramV3";
import LadderLogicDiagram from "./diagrams/LadderLogicDiagram";
import { buildConveyorLadder } from "@shared/ladderProgram";
import { PLCValueStrip, PLCTagList, ProcessFlowMini } from "./LiveMachineIndicators";
import GlossaryTooltip from "./GlossaryTooltip";
import { playToolSelect, playMeterBeep, playContinuityBeep, playRelayClick, playContactorPullIn, playSuccessChime, playFaultAlarm } from "./SimulatorSounds";
import GuidedTroubleshootingOverlay from "./GuidedTroubleshootingOverlay";
import ScenarioProgressionCard from "./ScenarioProgressionCard";
import MethodologyBreakdown from "./MethodologyBreakdown";
import TutorDebrief from "./TutorDebrief";
import FreeTextDiagnosis from "./FreeTextDiagnosis";
import AnonDebriefCTA from "./AnonDebriefCTA";
import { calculateMethodologyScore } from "@/lib/scoringEngine";
import type { ScoringInput } from "@/lib/scoringEngine";
import type { LaunchConfig } from "@/components/ScenarioLauncher";
import { PLAY_MODES, DIFFICULTY_MODIFIERS, getAdjustedScoringRules, getTimeLimit, getConfigLabel } from "@/lib/scenarioModular";
import type { PlayMode, DifficultyModifier } from "@/lib/scenarioModular";
import OrientationPrompt from "./OrientationPrompt";
import { useOrientation } from "@/hooks/useOrientation";
import { useImmersiveMode } from "@/hooks/useImmersiveMode";
import { useIOSScroll } from "@/hooks/useIOSScroll";
import { ambientAudio } from "./AmbientAudio";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTutorCoach } from "@/hooks/useTutorCoach";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel
} from "@/components/ui/alert-dialog";

// === PROPS & TYPES ===

export interface SimulatorResumeState {
  phase: "role_select" | "briefing" | "active" | "debrief";
  gameState: any;
  currentScore: number;
  actionCount: number;
  elapsedSeconds: number;
}

interface SimulatorEngineV3Props {
  scenario: ScenarioV3;
  onExit: () => void;
  onComplete: (results: SimV3Results) => void;
  launchConfig?: LaunchConfig;
  /** If provided, the engine will restore from this saved state */
  resumeState?: SimulatorResumeState;
}

export interface SimV3Results {
  scenarioId: string;
  scenarioTitle: string;
  role: TechRole;
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
  totalTime: number;
  faultsFixed: number;
  totalFaults: number;
  actionsLog: ActionLogEntry[];
  cluesFound: string[];
  hintsUsed: number;
  efficiency: number;
  communicationsUsed: string[];
  consequencesBranched: string[];
}

interface ActionLogEntry {
  timestamp: number;
  type: "measurement" | "action" | "communication" | "hint" | "meter_setting";
  tool?: ToolId;
  meterSetting?: MeterSetting;
  location?: string;
  terminal?: string;
  reading?: string;
  description: string;
  wasUseful: boolean;
  animation?: AnimationType;
}

// === HELPERS ===

function getGrade(pct: number): string {
  if (pct >= 95) return "MASTER";
  if (pct >= 85) return "SPECIALIST";
  if (pct >= 70) return "JOURNEYMAN";
  if (pct >= 50) return "APPRENTICE";
  return "TRAINEE";
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case "MASTER": return "#22c55e";
    case "SPECIALIST": return "#10b981";
    case "JOURNEYMAN": return "#eab308";
    case "APPRENTICE": return "#f97316";
    default: return "#ef4444";
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const TOOL_ICONS: Record<string, any> = {
  multimeter: Gauge,
  prints: FileText,
  flashlight: Eye,
  plc_terminal: Monitor,
  megger: Zap,
  thermal_camera: Thermometer,
  vibration_pen: Activity,
  screwdriver: Wrench,
  wire_tracer: Radio,
};

// === ANIMATION COMPONENTS ===

function MeterNeedleAnimation({ reading, maxReading = 600 }: { reading: number; maxReading?: number }) {
  const angle = Math.min((reading / maxReading) * 180 - 90, 90);
  return (
    <div className="relative w-36 h-[4.5rem] mx-auto mb-4">
      <div className="absolute inset-0 rounded-t-full overflow-hidden sim-meter-display p-px">
        <div className="absolute inset-0 rounded-t-full bg-gradient-to-b from-[#0a0f0a] to-[#060806]">
          <svg viewBox="0 0 144 72" className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="meter-arc" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                <stop offset="60%" stopColor="#eab308" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <path d="M 16 64 A 56 56 0 0 1 128 64" fill="none" stroke="url(#meter-arc)" strokeWidth="2" />
            {[...Array(11)].map((_, i) => {
              const a = Math.PI - (i / 10) * Math.PI;
              const x1 = 72 + Math.cos(a) * 50;
              const y1 = 64 - Math.sin(a) * 50;
              const x2 = 72 + Math.cos(a) * 56;
              const y2 = 64 - Math.sin(a) * 56;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4b5563" strokeWidth="1" />;
            })}
          </svg>
          <motion.div
            className="absolute bottom-0 left-1/2 w-[2px] h-[3rem] origin-bottom"
            style={{ background: "linear-gradient(to top, #ef4444, #f87171)" }}
            initial={{ rotate: -90 }}
            animate={{ rotate: angle }}
            transition={{ duration: 1.2, type: "spring", stiffness: 40, damping: 12 }}
          />
          <div className="absolute bottom-0 left-1/2 -ml-2 -mb-2 w-4 h-4 rounded-full bg-gradient-to-b from-gray-500 to-gray-700 border border-gray-600" />
        </div>
      </div>
    </div>
  );
}

function LEDBlinkAnimation({ pattern = "fault", color = "red" }: { pattern?: string; color?: string }) {
  const colors: Record<string, string> = {
    red: "bg-red-500",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
  };
  return (
    <motion.div
      className={`w-2 h-2 rounded-full ${colors[color] || colors.red}`}
      animate={{ opacity: pattern === "fault" ? [1, 0, 1, 0, 1] : [1, 0.3, 1] }}
      transition={{ duration: pattern === "fault" ? 1 : 2, repeat: Infinity }}
    />
  );
}

// === MOBILE PANEL TABS ===
type MobileTab = "machine" | "diagnostics" | "tools";

// === MAIN COMPONENT ===

export default function SimulatorEngineV3({ scenario: rawScenario, onExit, onComplete, launchConfig, resumeState }: SimulatorEngineV3Props) {
  // Apply difficulty modifier to scenario
  const playMode: PlayMode = launchConfig?.mode || "standard";
  const difficultyMod: DifficultyModifier = launchConfig?.modifier || "standard";
  const modeConfig = PLAY_MODES[playMode];
  const scenario = useMemo(() => {
    const modified = DIFFICULTY_MODIFIERS[difficultyMod].apply(rawScenario);
    return {
      ...modified,
      scoring: getAdjustedScoringRules(modified.scoring, playMode, difficultyMod),
    };
  }, [rawScenario, playMode, difficultyMod]);
  // === STATE (with resume support) ===
  const rs = resumeState?.gameState;
  const [phase, setPhase] = useState<"role_select" | "briefing" | "active" | "debrief">(resumeState?.phase || "role_select");
  const [role, setRole] = useState<TechRole | null>(rs?.role || null);
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(rs?.currentPhaseIdx || 0);
  const [currentSystemStateId, setCurrentSystemStateId] = useState<string>(rs?.currentSystemStateId || "");
  const [selectedTool, setSelectedTool] = useState<ToolId | null>(null);
  const [selectedMeterSetting, setSelectedMeterSetting] = useState<MeterSetting | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<MeasurementLocation | null>(null);
  const [actionsLog, setActionsLog] = useState<ActionLogEntry[]>(rs?.actionsLog || []);
  // Grounded AI tutor — coaches on wrong moves using the scenario's known answer key.
  const tutorCoach = useTutorCoach();
  // Schematic ⇄ ladder-logic view toggle (ladder available for PLC/conveyor scenarios).
  const [ladderView, setLadderView] = useState(false);
  const [discoveredClues, setDiscoveredClues] = useState<Set<string>>(new Set(rs?.discoveredClues || []));
  const [revealedMeasurements, setRevealedMeasurements] = useState<Map<string, string>>(new Map(Object.entries(rs?.revealedMeasurements || {})));
  const [hintsUsed, setHintsUsed] = useState(rs?.hintsUsed || 0);
  const [showHint, setShowHint] = useState(false);
  const [showPrints, setShowPrints] = useState(false);
  const [showFaultLog, setShowFaultLog] = useState(false);
  const [showComms, setShowComms] = useState(false);
  const [timer, setTimer] = useState(resumeState?.elapsedSeconds || 0);
  const [seniorAnswer, setSeniorAnswer] = useState<string | null>(null);
  const [seniorFeedback, setSeniorFeedback] = useState<string | null>(null);
  const [checkpointScore, setCheckpointScore] = useState(0);
  const [phaseTransition, setPhaseTransition] = useState<string | null>(null);
  const [activeAnimations, setActiveAnimations] = useState<AnimationTrigger[]>([]);
  const [timePressureMessages, setTimePressureMessages] = useState<TimePressureEvent[]>([]);
  const [showTimePressure, setShowTimePressure] = useState<TimePressureEvent | null>(null);
  const [communicationsUsed, setCommunicationsUsed] = useState<Set<string>>(new Set());
  const [consequenceLog, setConsequenceLog] = useState<string[]>([]);
  const [faultsFixed, setFaultsFixed] = useState(rs?.faultsFixed || 0);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const accordionToggleRef = useRef<number>(0);
  const [showMeterDisplay, setShowMeterDisplay] = useState(false);
  const [lastReading, setLastReading] = useState<{ value: string; unit: string; numeric?: number } | null>(null);
  const [wrongSettingFeedback, setWrongSettingFeedback] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ text: string; type: "positive" | "negative" | "neutral" } | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);
  const [guidedMode, setGuidedMode] = useState(false);
  const [completionRecorded, setCompletionRecorded] = useState(false);
  const [pendingSafetyAction, setPendingSafetyAction] = useState<SystemAction | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timePressureRef = useRef<Set<number>>(new Set());

  // === AUTH (moved up for auto-save) ===
  const { isAuthenticated } = useAuth();

  // === AUTO-SAVE SESSION ===
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saveSession = (trpc as any).simulatorSession.save.useMutation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clearSession = (trpc as any).simulatorSession.clear.useMutation();
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doAutoSave = useCallback(() => {
    if (!isAuthenticated || phase === "debrief" || phase === "role_select") return;
    saveSession.mutate({
      scenarioId: rawScenario.id,
      playMode,
      difficulty: difficultyMod,
      phase,
      gameState: {
        role,
        currentPhaseIdx,
        currentSystemStateId,
        actionsLog,
        discoveredClues: Array.from(discoveredClues),
        revealedMeasurements: Object.fromEntries(revealedMeasurements),
        hintsUsed,
        faultsFixed,
        communicationsUsed: Array.from(communicationsUsed),
        consequenceLog,
        checkpointScore,
      },
      currentScore: checkpointScore,
      actionCount: actionsLog.length,
      elapsedSeconds: timer,
    });
  }, [isAuthenticated, phase, rawScenario.id, playMode, difficultyMod, role, currentPhaseIdx, currentSystemStateId, actionsLog, discoveredClues, revealedMeasurements, hintsUsed, faultsFixed, communicationsUsed, consequenceLog, checkpointScore, timer, saveSession]);

  // Auto-save every 30 seconds during active phase
  useEffect(() => {
    if (phase === "active" && isAuthenticated) {
      autoSaveRef.current = setInterval(() => {
        doAutoSave();
      }, 30_000);
    }
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [phase, isAuthenticated, doAutoSave]);

  // === CRASH RECOVERY: localStorage fallback ===
  // Save to localStorage alongside server saves for crash recovery
  const saveToLocalStorage = useCallback(() => {
    if (phase === "debrief" || phase === "role_select") return;
    try {
      const sessionData = {
        scenarioId: rawScenario.id,
        playMode,
        difficulty: difficultyMod,
        phase,
        gameState: {
          role,
          currentPhaseIdx,
          currentSystemStateId,
          actionsLog,
          discoveredClues: Array.from(discoveredClues),
          revealedMeasurements: Object.fromEntries(revealedMeasurements),
          hintsUsed,
          faultsFixed,
          communicationsUsed: Array.from(communicationsUsed),
          consequenceLog,
          checkpointScore,
        },
        currentScore: checkpointScore,
        actionCount: actionsLog.length,
        elapsedSeconds: timer,
        savedAt: Date.now(),
      };
      localStorage.setItem(`eas-sim-session-${rawScenario.id}`, JSON.stringify(sessionData));
    } catch { /* localStorage full or unavailable */ }
  }, [phase, rawScenario.id, playMode, difficultyMod, role, currentPhaseIdx, currentSystemStateId, actionsLog, discoveredClues, revealedMeasurements, hintsUsed, faultsFixed, communicationsUsed, consequenceLog, checkpointScore, timer]);

  // Save to localStorage on every autosave cycle
  useEffect(() => {
    if (phase === "active") {
      saveToLocalStorage();
    }
  }, [actionsLog.length, timer, phase, saveToLocalStorage]);

  // === BEFOREUNLOAD + VISIBILITYCHANGE: Flush state on tab close/switch ===
  useEffect(() => {
    if (phase !== "active") return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Save to localStorage immediately (synchronous)
      saveToLocalStorage();
      // Also attempt server save via sendBeacon
      if (isAuthenticated && navigator.sendBeacon) {
        const payload = JSON.stringify({
          scenarioId: rawScenario.id,
          playMode,
          difficulty: difficultyMod,
          phase,
          gameState: {
            role,
            currentPhaseIdx,
            currentSystemStateId,
            actionsLog,
            discoveredClues: Array.from(discoveredClues),
            revealedMeasurements: Object.fromEntries(revealedMeasurements),
            hintsUsed,
            faultsFixed,
            communicationsUsed: Array.from(communicationsUsed),
            consequenceLog,
            checkpointScore,
          },
          currentScore: checkpointScore,
          actionCount: actionsLog.length,
          elapsedSeconds: timer,
        });
        navigator.sendBeacon('/api/simulator-session/save', payload);
      }
      // Show browser "Leave page?" prompt
      e.preventDefault();
      e.returnValue = 'You have an active simulation in progress. Are you sure you want to leave?';
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveToLocalStorage();
        // Trigger server save
        doAutoSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [phase, isAuthenticated, rawScenario.id, playMode, difficultyMod, role, currentPhaseIdx, currentSystemStateId, actionsLog, discoveredClues, revealedMeasurements, hintsUsed, faultsFixed, communicationsUsed, consequenceLog, checkpointScore, timer, saveToLocalStorage, doAutoSave]);

  // Clear session on completion (server + localStorage)
  useEffect(() => {
    if (phase === "debrief") {
      if (isAuthenticated) {
        clearSession.mutate({ scenarioId: rawScenario.id });
      }
      try { localStorage.removeItem(`eas-sim-session-${rawScenario.id}`); } catch {}
    }
  }, [phase, isAuthenticated, rawScenario.id, clearSession]);

  // === AUDIO STATE ===
  const [audioEnabled, setAudioEnabled] = useState(false);

  // === IMMERSIVE MODE STATE ===
  const [mobileTab, setMobileTab] = useState<MobileTab>("machine");
  const [orientationBypassed, setOrientationBypassed] = useState(false);
  const [stablePortrait, setStablePortrait] = useState(false);
  const [pendingActiveTransition, setPendingActiveTransition] = useState(false);
  const portraitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mobileToolDrawer, setMobileToolDrawer] = useState(false);

  const { orientation, isMobile, isTablet } = useOrientation();
  const { isImmersive, enterImmersive, exitImmersive, toggleImmersive } = useImmersiveMode();
  const isCompact = isMobile || isTablet;
  const isLandscapeMobile = isCompact && orientation === "landscape";

  // iOS Safari scroll fix — attach JS touch handlers to force scroll on iOS
  const { ref: diagnosticsScrollRef, suppressRestoreFor: suppressDiagnosticsScrollRestore } = useIOSScroll<HTMLDivElement>();
  const { ref: toolsScrollRef } = useIOSScroll<HTMLDivElement>();
  const desktopDiagnosticsScrollRef = useRef<HTMLDivElement>(null);

  const toggleAccordion = useCallback((setter: Dispatch<SetStateAction<boolean>>) => {
    const now = Date.now();
    if (now - accordionToggleRef.current < 300) return;
    accordionToggleRef.current = now;
    suppressDiagnosticsScrollRestore(1500);
    setter(prev => !prev);
  }, [suppressDiagnosticsScrollRestore]);

  // FIX 4: Stability guard — only show overlay after orientation has been
  // portrait for 400ms+ (prevents flash during transient portrait detection)
  useEffect(() => {
    if (orientation === "portrait" && isCompact) {
      portraitTimerRef.current = setTimeout(() => {
        setStablePortrait(true);
      }, 400);
    } else {
      if (portraitTimerRef.current) clearTimeout(portraitTimerRef.current);
      setStablePortrait(false);
    }
    return () => {
      if (portraitTimerRef.current) clearTimeout(portraitTimerRef.current);
    };
  }, [orientation, isCompact]);

  // FIX 5: Reset dismissed state when returning to landscape
  // So the prompt can show again on future rotations
  useEffect(() => {
    if (orientation === "landscape") {
      setOrientationBypassed(false); // Reset so it shows again next time
    }
  }, [orientation]);

  // Auto-transition to active phase when user rotates to landscape
  // after clicking "Begin Troubleshooting" in portrait mode
  useEffect(() => {
    if (pendingActiveTransition && orientation === "landscape") {
      setPendingActiveTransition(false);
      setPhase("active");
    }
  }, [pendingActiveTransition, orientation]);

  // Progression tracking
  const recordCompletion = trpc.scenarioProgression.recordCompletion.useMutation();

  const currentScenarioPhase = scenario.phases[currentPhaseIdx];
  const currentSystemState = currentSystemStateId ? scenario.systemStates[currentSystemStateId] : null;

  // === TIMED MODE: Calculate time limit ===
  const timeLimit = useMemo(() => {
    if (!role) return null;
    return getTimeLimit(scenario, role, playMode);
  }, [scenario, role, playMode]);
  const [timedExpired, setTimedExpired] = useState(false);

  // === TIMER ===
  useEffect(() => {
    if (phase === "active") {
      timerRef.current = setInterval(() => setTimer(t => {
        const next = t + 1;
        // Check timed mode expiration
        if (timeLimit && next >= timeLimit && !timedExpired) {
          setTimedExpired(true);
        }
        return next;
      }), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, timeLimit, timedExpired]);

  // === TIME PRESSURE (unchanged) ===
  useEffect(() => {
    if (phase !== "active") return;
    const minutes = timer / 60;
    
    for (const event of scenario.timePressure) {
      if (minutes >= event.triggerMinutes && !timePressureRef.current.has(event.triggerMinutes)) {
        timePressureRef.current.add(event.triggerMinutes);
        setTimePressureMessages(prev => [...prev, event]);
        setShowTimePressure(event);
        setTimeout(() => setShowTimePressure(null), 8000);
      }
    }
  }, [timer, phase, scenario.timePressure]);

  // === AMBIENT ANIMATIONS (unchanged) ===
  useEffect(() => {
    if (phase === "active") {
      setActiveAnimations(scenario.ambientAnimations);
    }
  }, [phase, scenario.ambientAnimations]);

  // === AMBIENT AUDIO LIFECYCLE ===
  useEffect(() => {
    if (phase === "active" && audioEnabled) {
      ambientAudio.enable();
      ambientAudio.startAmbient();
    }
    return () => {
      ambientAudio.stopAll();
    };
  }, [phase, audioEnabled]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      ambientAudio.disable();
    };
  }, []);

  // Lock body scroll when simulator is mounted, unlock on unmount
  // Only lock body scroll during active simulation phase — role_select and briefing
  // need native scrolling on iOS Safari
  useEffect(() => {
    if (phase === "active" || phase === "debrief") {
      const timer = setTimeout(() => {
        document.body.classList.add('sim-body-locked');
      }, 200);
      return () => {
        clearTimeout(timer);
        document.body.classList.remove('sim-body-locked');
      };
    } else {
      // Ensure body is unlocked during role_select and briefing
      document.body.classList.remove('sim-body-locked');
    }
  }, [phase]);

  // Safari minimal UI trigger — forces address bar + tab bar to collapse
  // Key insight: Safari becomes "immune" to the same scroll trick within a session.
  // Fix: Destroy and recreate the scrollable DOM element on EACH rotation attempt,
  // which forces Safari to re-evaluate scrollability from scratch. Also use an
  // iframe-based approach as a secondary trigger — navigating an iframe forces
  // Safari to recalculate viewport geometry.
  useEffect(() => {
    if (phase !== "active" && phase !== "debrief") return;
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone;
    
    if (!isIOS || isStandalone) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let resizeDebounce: ReturnType<typeof setTimeout> | null = null;
    let lastWidth = window.innerWidth;
    let cleanupElements: HTMLElement[] = [];
    
    const triggerMinimalUI = () => {
      // Remove any previous scroll helpers (fresh DOM = Safari can't ignore it)
      cleanupElements.forEach(el => {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
      cleanupElements = [];
      
      // Step 1: Remove body lock temporarily
      document.body.classList.remove('sim-body-locked');
      
      // Step 2: Create a FRESH full-page scrollable wrapper
      // Safari treats new DOM elements as new scrollable contexts
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow-y: scroll;
        -webkit-overflow-scrolling: touch;
        z-index: 99999;
        pointer-events: none;
      `;
      const spacer = document.createElement('div');
      // Use a unique height each time to prevent caching
      spacer.style.height = `${window.innerHeight * 3 + Math.random() * 100}px`;
      wrapper.appendChild(spacer);
      document.body.appendChild(wrapper);
      cleanupElements.push(wrapper);
      
      // Step 3: Also make the body itself scrollable with unique content height
      const prevOverflow = document.body.style.overflow;
      const prevHeight = document.body.style.height;
      const prevMinHeight = document.body.style.minHeight;
      const prevPosition = document.body.style.position;
      
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
      document.body.style.minHeight = `${window.innerHeight + 200 + Math.random() * 50}px`;
      
      // Step 4: Perform the scroll in the next frame
      requestAnimationFrame(() => {
        // Scroll both the wrapper and the window
        wrapper.scrollTop = Math.floor(Math.random() * 10) + 1;
        window.scrollTo(0, Math.floor(Math.random() * 5) + 1);
        
        // Step 5: Wait for Safari to process, then clean up
        setTimeout(() => {
          window.scrollTo(0, 0);
          document.body.style.overflow = prevOverflow;
          document.body.style.height = prevHeight;
          document.body.style.minHeight = prevMinHeight;
          document.body.style.position = prevPosition;
          document.body.classList.add('sim-body-locked');
          
          // Remove the wrapper after a brief delay
          setTimeout(() => {
            if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
            cleanupElements = cleanupElements.filter(el => el !== wrapper);
          }, 100);
        }, 200);
      });
    };

    // Trigger on phase entry
    const entryTimer = setTimeout(triggerMinimalUI, 400);
    
    // Trigger on orientation change — must fire EVERY time
    const handleOrientationChange = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      // Wait for Safari to finish rotation animation
      debounceTimer = setTimeout(triggerMinimalUI, 700);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Resize fallback — only on actual width change (rotation)
    const handleResize = () => {
      if (Math.abs(window.innerWidth - lastWidth) > 50) {
        lastWidth = window.innerWidth;
        if (resizeDebounce) clearTimeout(resizeDebounce);
        resizeDebounce = setTimeout(triggerMinimalUI, 900);
      }
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(entryTimer);
      if (debounceTimer) clearTimeout(debounceTimer);
      if (resizeDebounce) clearTimeout(resizeDebounce);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
      cleanupElements.forEach(el => {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
    };
  }, [phase]);

  // Escape key handler — exit simulator (with confirmation if active)
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Don't intercept if a dialog/modal is open
        if (pendingSafetyAction) return;
        if (phase === "active" && actionsLog.length > 0) {
          setShowExitConfirm(true);
        } else {
          onExit();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, actionsLog.length, onExit, pendingSafetyAction]);

  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => {
      if (!prev) {
        ambientAudio.enable();
        if (phase === "active") ambientAudio.startAmbient();
      } else {
        ambientAudio.disable();
      }
      return !prev;
    });
  }, [phase]);

  // === INITIALIZE SYSTEM STATE (unchanged) ===
  useEffect(() => {
    if (phase === "active" && currentScenarioPhase) {
      setCurrentSystemStateId(currentScenarioPhase.initialStateId);
    }
  }, [phase, currentPhaseIdx]);

  const availableTools = useMemo(() => {
    if (!role) return [];
    return scenario.tools.filter(t => t.availableFor.includes(role));
  }, [role, scenario.tools]);

  const canAdvance = useMemo(() => {
    if (!currentScenarioPhase) return false;
    return currentScenarioPhase.advanceConditions.some(cond => {
      const cluesMet = cond.requiredClues.every(clue => discoveredClues.has(clue));
      const actionMet = !cond.requiredAction || consequenceLog.includes(cond.requiredAction);
      return cluesMet && actionMet;
    });
  }, [currentScenarioPhase, discoveredClues, consequenceLog]);

  // === HANDLERS (logic unchanged) ===

  const showFeedback = (text: string, type: "positive" | "negative" | "neutral") => {
    setActionFeedback({ text, type });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleToolSelect = (toolId: ToolId) => {
    playToolSelect();
    if (toolId === "prints") {
      setShowPrints(true);
      setSelectedTool(null);
      setSelectedMeterSetting(null);
      setSelectedLocation(null);
    } else {
      setSelectedTool(toolId);
      setSelectedLocation(null);
      setShowPrints(false);
      const tool = availableTools.find(t => t.id === toolId);
      if (!tool?.meterSettings) {
        setSelectedMeterSetting(null);
      }
    }
    // On mobile, switch to diagnostics tab when selecting a tool
    if (isCompact && toolId !== "prints") {
      setMobileTab("diagnostics");
      setMobileToolDrawer(false);
    }
  };

  const handleMeterSettingSelect = (setting: MeterSetting) => {
    setSelectedMeterSetting(setting);
    setActionsLog(prev => [...prev, {
      timestamp: timer,
      type: "meter_setting",
      tool: selectedTool!,
      meterSetting: setting,
      description: `Set meter to ${METER_SETTING_LABELS[setting]}`,
      wasUseful: true,
    }]);
  };

  const handleLocationSelect = (location: MeasurementLocation) => {
    if (!selectedTool) return;
    setSelectedLocation(location);
    
    const tool = availableTools.find(t => t.id === selectedTool);
    if (!tool?.meterSettings && location.simpleReadings?.[selectedTool]) {
      const reading = location.simpleReadings[selectedTool];
      processSimpleReading(location, reading);
    }
  };

  const handleTerminalMeasurement = (measurement: TerminalMeasurement) => {
    if (!selectedTool || !selectedLocation) return;
    
    if (selectedMeterSetting !== measurement.requiredSetting) {
      setWrongSettingFeedback(measurement.wrongSettingResult || "No valid reading — check your meter setting.");
      setActionsLog(prev => [...prev, {
        timestamp: timer,
        type: "measurement",
        tool: selectedTool,
        meterSetting: selectedMeterSetting || undefined,
        location: selectedLocation.label,
        terminal: `${measurement.fromTerminal} → ${measurement.toTerminal}`,
        reading: "INVALID",
        description: `Wrong meter setting (${selectedMeterSetting ? METER_SETTING_LABELS[selectedMeterSetting] : "none"}) at ${selectedLocation.label}`,
        wasUseful: false,
      }]);
      showFeedback("Wrong meter setting for this measurement. Check your dial position.", "negative");
      setTimeout(() => setWrongSettingFeedback(null), 3000);
      return;
    }
    
    if (selectedMeterSetting === "continuity") {
      playContinuityBeep();
    } else {
      playMeterBeep();
    }
    
    const readingKey = `${selectedLocation.id}:${measurement.fromTerminal}:${measurement.toTerminal}:${measurement.requiredSetting}`;
    setRevealedMeasurements(prev => new Map(prev).set(readingKey, `${measurement.reading} ${measurement.unit}`));
    
    const numericReading = parseFloat(measurement.reading.replace(/[^\d.-]/g, ""));
    setLastReading({ value: measurement.reading, unit: measurement.unit, numeric: isNaN(numericReading) ? undefined : numericReading });
    setShowMeterDisplay(true);
    setTimeout(() => setShowMeterDisplay(false), 3000);
    
    if (measurement.animation) {
      setActiveAnimations(prev => [...prev, measurement.animation!]);
      setTimeout(() => {
        setActiveAnimations(prev => prev.filter(a => a !== measurement.animation));
      }, measurement.animation.duration);
    }
    
    setActionsLog(prev => [...prev, {
      timestamp: timer,
      type: "measurement",
      tool: selectedTool,
      meterSetting: selectedMeterSetting || undefined,
      location: selectedLocation.label,
      terminal: `${measurement.fromTerminal} → ${measurement.toTerminal}`,
      reading: `${measurement.reading} ${measurement.unit}`,
      description: `Measured ${measurement.fromTerminal}-${measurement.toTerminal} at ${selectedLocation.label}: ${measurement.reading} ${measurement.unit}`,
      wasUseful: measurement.isKeyClue,
      animation: measurement.animation?.type,
    }]);
    
    if (measurement.isKeyClue) {
      // Add both location-level and terminal-level clue keys for compatibility with both formats
      const terminalClueKey = `${measurement.fromTerminal}:${measurement.toTerminal}:${measurement.requiredSetting}`;
      setDiscoveredClues(prev => {
        const next = new Set(prev);
        next.add(selectedLocation.id);
        next.add(terminalClueKey);
        return next;
      });
      playSuccessChime();
      showFeedback("Key evidence found — this reading is significant.", "positive");
    } else {
      showFeedback("Reading recorded. Normal value — not directly related to the fault.", "neutral");
    }
  };

  const processSimpleReading = (location: MeasurementLocation, reading: SimpleReading) => {
    const readingKey = `${location.id}:${selectedTool}:simple`;
    setRevealedMeasurements(prev => new Map(prev).set(readingKey, `${reading.value} ${reading.unit}`));
    
    if (reading.animation) {
      setActiveAnimations(prev => [...prev, reading.animation!]);
      setTimeout(() => {
        setActiveAnimations(prev => prev.filter(a => a !== reading.animation));
      }, reading.animation!.duration);
    }
    
    setActionsLog(prev => [...prev, {
      timestamp: timer,
      type: "measurement",
      tool: selectedTool!,
      location: location.label,
      reading: `${reading.value} ${reading.unit}`,
      description: `${availableTools.find(t => t.id === selectedTool)?.name} at ${location.label}: ${reading.value} ${reading.unit}`,
      wasUseful: reading.isKeyClue,
    }]);
    
    if (reading.isKeyClue) {
      setDiscoveredClues(prev => new Set(prev).add(location.id));
      showFeedback("Key evidence found — this observation is significant.", "positive");
    } else {
      showFeedback("Observation recorded.", "neutral");
    }
    
    setSelectedTool(null);
    setSelectedLocation(null);
  };

  const handleSystemAction = (action: SystemAction) => {
    if (action.safetyWarning) {
      setPendingSafetyAction(action);
      return;
    }
    executeSystemAction(action);
  };

  const executeSystemAction = (action: SystemAction) => {
    
    if (action.category === "replace" || action.category === "reset") {
      playContactorPullIn();
    } else {
      playRelayClick();
    }
    setCurrentSystemStateId(action.resultStateId);
    setConsequenceLog(prev => [...prev, action.id]);
    setActionsLog(prev => [...prev, {
      timestamp: timer,
      type: "action",
      description: `${action.label}: ${action.consequence}`,
      wasUseful: action.isCorrect,
    }]);
    
    if (action.animation) {
      setActiveAnimations(prev => [...prev, action.animation!]);
      setTimeout(() => {
        setActiveAnimations(prev => prev.filter(a => a !== action.animation));
      }, action.animation.duration);
    }
    
    if (action.isCorrect) {
      setFaultsFixed((prev: number) => prev + 1);
      playSuccessChime();
      showFeedback(`Correct action — ${action.consequence}`, "positive");
    } else {
      playFaultAlarm();
      showFeedback(`${action.consequence}`, "negative");
      // Fire grounded coaching (logged-in only — the procedure is protected).
      // The correct action for this state is ground truth from the scenario data.
      const correct = currentSystemState?.availableActions.find(a => a.isCorrect) ?? null;
      if (isAuthenticated) void tutorCoach.coachWrongMove({
        scenarioTitle: scenario.title,
        plantContext: {
          plantName: scenario.plantContext.plantName,
          lineName: scenario.plantContext.lineName,
          costPerMinute: scenario.plantContext.costPerMinute,
        },
        chosenAction: {
          label: action.label,
          consequence: action.consequence,
          category: action.category,
        },
        correctAction: correct
          ? { label: correct.label, consequence: correct.consequence }
          : null,
        recentActions: actionsLog.slice(-5).map(a => ({
          type: a.type,
          description: a.description,
          wasUseful: a.wasUseful,
        })),
        cluesFound: Array.from(discoveredClues),
      });
    }

    setCheckpointScore(prev => prev + action.scoreImpact);
    setShowActionPanel(false);
  };

  const handleCommunication = (channel: CommunicationChannel) => {
    setCommunicationsUsed(prev => new Set(prev).add(channel.id));
    
    if (channel.clueId) {
      setDiscoveredClues(prev => new Set(prev).add(channel.clueId!));
    }
    
    setActionsLog(prev => [...prev, {
      timestamp: timer,
      type: "communication",
      description: `${channel.type === "radio" ? "📻" : "📞"} ${channel.contact}: "${channel.response}"`,
      wasUseful: channel.isUseful,
    }]);

    if (channel.isUseful) {
      showFeedback("Useful intel received from this contact.", "positive");
    }
  };

  const handleAdvancePhase = () => {
    const condition = currentScenarioPhase.advanceConditions.find(cond => {
      const cluesMet = cond.requiredClues.every(clue => discoveredClues.has(clue));
      const actionMet = !cond.requiredAction || consequenceLog.includes(cond.requiredAction);
      return cluesMet && actionMet;
    });
    
    if (!condition) return;
    setPhaseTransition(condition.transitionText);
    
    if (condition.transitionAnimation) {
      setActiveAnimations(prev => [...prev, condition.transitionAnimation!]);
    }
    
    setTimeout(() => {
      if (condition.nextPhaseId === "complete") {
        handleComplete();
      } else {
        const nextIdx = scenario.phases.findIndex(p => p.id === condition.nextPhaseId);
        if (nextIdx >= 0) {
          setCurrentPhaseIdx(nextIdx);
          setSelectedTool(null);
          setSelectedMeterSetting(null);
          setSelectedLocation(null);
          setShowPrints(false);
          setSeniorAnswer(null);
          setSeniorFeedback(null);
          setPhaseTransition(null);
        }
      }
    }, 3000);
  };

  const handleComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("debrief");
    
    const score = calculateScore();
    const pct = Math.round((score / scenario.scoring.maxScore) * 100);
    const usefulActions = actionsLog.filter(a => a.wasUseful).length;
    
    onComplete({
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      role: role!,
      totalScore: score,
      maxScore: scenario.scoring.maxScore,
      percentage: pct,
      grade: getGrade(pct),
      totalTime: timer,
      faultsFixed,
      totalFaults: scenario.faults.length,
      actionsLog,
      cluesFound: Array.from(discoveredClues),
      hintsUsed,
      efficiency: actionsLog.length > 0 ? Math.round((usefulActions / actionsLog.length) * 100) : 100,
      communicationsUsed: Array.from(communicationsUsed),
      consequencesBranched: consequenceLog,
    });
  };

  const calculateScore = useCallback(() => {
    const s = scenario.scoring;
    let score = 0;
    score += discoveredClues.size * s.clueDiscovery;
    const usefulActions = actionsLog.filter(a => a.wasUseful).length;
    const totalActions = actionsLog.filter(a => a.type === "measurement").length;
    if (totalActions > 0 && (usefulActions / totalActions) >= 0.7) score += s.efficiencyBonus;
    const unnecessaryCount = totalActions - usefulActions;
    score -= unnecessaryCount * Math.abs(s.unnecessaryMeasurementPenalty);
    score += checkpointScore;
    score -= hintsUsed * Math.abs(s.hintPenalty);
    score += communicationsUsed.size > 0 ? s.communicationBonus : 0;
    if (faultsFixed === scenario.faults.length) score += s.optimalOrderBonus;
    const minutes = timer / 60;
    for (const tb of s.timeBonuses) {
      if (minutes <= tb.underMinutes) { score += tb.bonus; break; }
    }
    return Math.max(0, Math.min(score, s.maxScore));
  }, [discoveredClues, actionsLog, checkpointScore, hintsUsed, timer, communicationsUsed, faultsFixed, scenario]);

  // === TIMED MODE: Auto-complete on expiration ===
  useEffect(() => {
    if (timedExpired && phase === "active") {
      // Give 3 seconds for the overlay to show, then auto-complete
      const timeout = setTimeout(() => {
        handleComplete();
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [timedExpired, phase]);

  // Stable methodology score for the debrief — computed once per debrief entry,
  // not on every render (prevents flicker when async debrief children resolve).
  const debriefMethodology = useMemo(() => {
    if (phase !== "debrief" || !role) return null;
    return calculateMethodologyScore({
      actions: actionsLog as any,
      discoveredClues: Array.from(discoveredClues),
      hintsUsed,
      timeSeconds: timer,
      faultsFixed,
      totalFaults: scenario.faults.length,
      role,
      scenario,
      consequenceLog,
      communicationsUsed: Array.from(communicationsUsed),
    });
    // Intentionally excludes live-updating deps: the debrief is a frozen snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Record completion ONCE when the debrief opens — as an effect, never in render.
  // (Calling setState/mutations during render caused the submit glitch.)
  useEffect(() => {
    if (phase !== "debrief" || completionRecorded || !isAuthenticated || !debriefMethodology) return;
    setCompletionRecorded(true);
    const score = calculateScore();
    const difficulty = scenario.faults.length > 1 ? "advanced" : (scenario.phases.length > 4 ? "intermediate" : "beginner");
    recordCompletion.mutate({
      scenarioSlug: scenario.id,
      scenarioTitle: scenario.title,
      difficulty,
      score,
      maxScore: scenario.scoring.maxScore,
      timeSeconds: timer,
      hintsUsed,
      methodologyScore: debriefMethodology.overallPercentage,
      methodologyGrade: debriefMethodology.overallGrade,
      methodologyDimensions: debriefMethodology.dimensions.map(d => ({
        id: d.id, label: d.label, score: d.score, maxScore: d.maxScore, percentage: d.percentage, grade: d.grade,
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, completionRecorded, isAuthenticated, debriefMethodology]);

  // CRITICAL: useMemo MUST be called unconditionally (before any early returns)
  // to prevent "Rendered more hooks than during the previous render" error.
  // Returns JSX directly (not a component function) to preserve InteractiveCircuitDiagramV3's pan/zoom state.
  const machinePanel = useMemo(() => {
    const isFaulted = currentSystemState?.description?.toLowerCase().includes("fault") || currentSystemState?.description?.toLowerCase().includes("tripped");
    const isPartial = faultsFixed > 0 && faultsFixed < scenario.faults.length;
    const isResolved = faultsFixed === scenario.faults.length;
    const statusColor = isResolved ? "#22c55e" : isPartial ? "#eab308" : "#ef4444";
    const statusLabel = isResolved ? "SYSTEM OK" : isPartial ? "PARTIAL FAULT" : "FAULT ACTIVE";

    return (
      <div className={isLandscapeMobile ? "flex flex-col" : "h-full flex flex-col"}>
        {/* SCADA-style panel header */}
        <div className="shrink-0 bg-[#040604] border-b border-gray-800/60">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}60` }}>
                {!isResolved && (
                  <motion.div
                    className="w-full h-full rounded-sm"
                    style={{ backgroundColor: statusColor }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: isFaulted ? 0.6 : 1.5, repeat: Infinity }}
                  />
                )}
              </div>
              <span className="text-[10px] font-mono-industrial uppercase tracking-[0.15em]" style={{ color: statusColor }}>{statusLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              {scenario.faults.map((_, i) => (
                <div key={i} className="relative">
                  <div className={`w-1.5 h-3 rounded-[1px] transition-colors duration-500 ${
                    i < faultsFixed ? "bg-emerald-500" : "bg-red-500/50"
                  }`} />
                  {i < faultsFixed && (
                    <motion.div
                      className="absolute inset-0 rounded-[1px] bg-emerald-400"
                      initial={{ opacity: 0.8 }}
                      animate={{ opacity: [0.8, 0.3, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* Live process indicators */}
          <div className="flex items-center gap-px px-2 pb-1">
            <div className="flex-1 h-[2px] rounded-full bg-gray-800 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: statusColor }}
                initial={{ width: "0%" }}
                animate={{ width: `${(faultsFixed / Math.max(scenario.faults.length, 1)) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="text-[9px] font-mono-industrial text-gray-600 ml-1.5 shrink-0">
              {faultsFixed}/{scenario.faults.length}
            </span>
          </div>
        </div>

        {/* Process Flow Mini-Diagram — hidden in landscape mobile to maximize diagram space */}
        {!isLandscapeMobile && (
          <div className="shrink-0 border-b border-gray-800/40 bg-[#050805]/60">
            <ProcessFlowMini
              currentSystemState={currentSystemState ?? undefined}
              faultsFixed={faultsFixed}
              totalFaults={scenario.faults.length}
            />
          </div>
        )}

        {/* Schematic ⇄ Ladder toggle — only for scenarios with a ladder program */}
        {scenario.id.includes("conveyor") && (
          <div className="shrink-0 flex items-center gap-1 px-2 py-1 bg-[#040604] border-b border-gray-800/60">
            <button
              onClick={() => setLadderView(false)}
              className={`text-[11px] px-2 py-0.5 rounded ${!ladderView ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white"}`}
            >Schematic</button>
            <button
              onClick={() => setLadderView(true)}
              className={`text-[11px] px-2 py-0.5 rounded ${ladderView ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white"}`}
            >Ladder Logic</button>
          </div>
        )}

        {/* Circuit Diagram / Machine Visualization */}
        <div className={isLandscapeMobile ? "sim-machine-viewport" : "flex-1 sim-machine-viewport"} style={isLandscapeMobile ? { height: "70vh", minHeight: "250px" } : undefined}>
          {ladderView && scenario.id.includes("conveyor") ? (
            <div className="h-full overflow-auto p-2">
              <LadderLogicDiagram program={buildConveyorLadder(!isFaulted, !isFaulted)} />
            </div>
          ) : (
            <InteractiveCircuitDiagramV3
              diagram={scenario.diagram}
              role={role!}
              systemState={currentSystemState}
              activeAnimations={activeAnimations}
              disablePanZoom={isLandscapeMobile}
              hideMobileControls={isCompact}
            />
          )}
        </div>



        {/* Live PLC Value Strip — hidden in landscape mobile to maximize diagram space */}
        {!isLandscapeMobile && (
          <div className="shrink-0 bg-[#030503] border-t border-gray-800/40">
            <PLCValueStrip
              scenario={scenario}
              currentSystemState={currentSystemState ?? undefined}
              faultsFixed={faultsFixed}
              timer={timer}
              discoveredClues={discoveredClues}
            />
          </div>
        )}

        {/* Alarm strip — compact industrial style */}
        <div className="shrink-0 bg-[#040604] border-t border-gray-800/60 px-2 py-0.5">
          <div className="flex items-center gap-2 overflow-x-auto">
            {(currentSystemState?.visibleFaults || scenario.faultLog).slice(0, 5).map((entry, i) => (
              <div key={i} className="flex items-center gap-1 shrink-0">
                <LEDBlinkAnimation
                  color={entry.severity === "critical" ? "red" : entry.severity === "warning" ? "amber" : "green"}
                  pattern={entry.severity === "critical" ? "fault" : "normal"}
                />
                <span className={`text-[10px] font-mono-industrial ${
                  entry.severity === "critical" ? "text-red-400" : entry.severity === "warning" ? "text-amber-400" : "text-gray-600"
                }`}>{entry.code}</span>
              </div>
            ))}
            {currentSystemState?.description && (
              <span className="text-[10px] text-gray-600 font-mono-industrial ml-auto shrink-0 truncate max-w-[100px]">
                {currentSystemState.description}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSystemState, faultsFixed, scenario, role, activeAnimations, discoveredClues, timer, isCompact, orientation, isLandscapeMobile, ladderView]);

  // === RENDER: ROLE SELECT ===
  if (phase === "role_select") {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-[#080c08] via-[#0a0f0a] to-[#060a06] flex items-start justify-center p-4 py-8 pb-24 font-sim" style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" as any }}>
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="max-w-3xl w-full">
          <div className="text-center mb-10">
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 mb-5"
            >
              <HardHat className="w-8 h-8 text-emerald-400" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl text-white font-semibold tracking-tight mb-3" style={{ fontFamily: "var(--font-sim-body)", textTransform: "none" }}>
              Advanced Troubleshooting
            </h1>
            <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
              Multi-fault scenario with dynamic system response. Select your experience level to calibrate difficulty.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 sim-chip sim-chip-amber">
              <AlertTriangle className="w-3 h-3" />
              <span>{scenario.faults.length} faults to identify and resolve</span>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            {([
              {
                role: "new" as TechRole,
                title: "New Tech",
                subtitle: "0–2 years",
                description: "Full guidance, visual state diagrams, simplified terminal selection. More hints, fewer tools.",
                gradient: "from-blue-500/10 to-blue-500/5",
                borderColor: "border-blue-500/30 hover:border-blue-400/50",
                chipClass: "sim-chip-blue",
                accentColor: "text-blue-400",
                est: scenario.estimatedMinutes.new,
              },
              {
                role: "experienced" as TechRole,
                title: "Experienced Tech",
                subtitle: "3–7 years",
                description: "Standard toolset, meter setting selection required, moderate hints. Must identify correct terminals.",
                gradient: "from-amber-500/10 to-amber-500/5",
                borderColor: "border-amber-500/30 hover:border-amber-400/50",
                chipClass: "sim-chip-amber",
                accentColor: "text-amber-400",
                est: scenario.estimatedMinutes.experienced,
              },
              {
                role: "senior" as TechRole,
                title: "Senior Tech",
                subtitle: "8+ years",
                description: "Full toolset, reasoning checkpoints, minimal hints. Diagnostic decision-making evaluated.",
                gradient: "from-emerald-500/10 to-emerald-500/5",
                borderColor: "border-emerald-500/30 hover:border-emerald-400/50",
                chipClass: "sim-chip-green",
                accentColor: "text-emerald-400",
                est: scenario.estimatedMinutes.senior,
              },
            ]).map(opt => (
              <motion.button
                key={opt.role}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setRole(opt.role); setPhase("briefing"); }}
                className={`sim-glass-elevated p-6 text-left ${opt.borderColor} transition-all duration-200 bg-gradient-to-b ${opt.gradient}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <HardHat className={`w-5 h-5 ${opt.accentColor}`} />
                  <span className="text-white font-semibold text-lg" style={{ fontFamily: "var(--font-sim-body)", textTransform: "none" }}>{opt.title}</span>
                </div>
                <span className={`sim-chip ${opt.chipClass} mb-3`}>{opt.subtitle}</span>
                <p className="text-gray-400 text-xs leading-relaxed mb-4">{opt.description}</p>
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>~{opt.est} min</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // === RENDER: BRIEFING ===
  if (phase === "briefing") {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-[#080c08] via-[#0a0f0a] to-[#060a06] flex items-start justify-center p-4 py-8 pb-24 font-sim" style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" as any }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl w-full">
          {/* Back to difficulty selection */}
          <button
            onClick={() => setPhase("role_select")}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 py-2 px-3 -ml-3 rounded-lg hover:bg-white/5 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Difficulty Selection</span>
          </button>
          {/* Plant context */}
          <div className="sim-glass-elevated p-6 mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-amber-500/20 to-amber-500/5 border border-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-white text-xl font-semibold" style={{ fontFamily: "var(--font-sim-body)", textTransform: "none" }}>{scenario.title}</h2>
                <p className="text-gray-500 text-xs">{scenario.plantContext.lineName} — {scenario.plantContext.shift}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="sim-glass-panel p-3">
                <span className="text-gray-500 text-[10px] uppercase tracking-wider block mb-1">Equipment</span>
                <span className="text-white text-sm">{scenario.plantContext.lineNumber}</span>
              </div>
              <div className="sim-glass-panel p-3">
                <span className="text-gray-500 text-[10px] uppercase tracking-wider block mb-1">Impact</span>
                <span className="text-white text-sm">{scenario.plantContext.downstreamImpact}</span>
              </div>
            </div>
            <div className="sim-glass-panel p-4">
              <span className="text-gray-500 text-[10px] uppercase tracking-wider block mb-2">Initial Report</span>
              <p className="text-gray-200 text-sm leading-relaxed">{scenario.plantContext.waitingOn}</p>
            </div>
          </div>

          {/* Play mode / modifier badges */}
          {(playMode !== "standard" || difficultyMod !== "standard") && (
            <div className="flex flex-wrap gap-2 mb-5">
              {playMode !== "standard" && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                  playMode === "timed" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                  playMode === "guided" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                  "bg-purple-500/10 border-purple-500/20 text-purple-400"
                }`}>
                  {playMode === "timed" ? <Timer className="w-3.5 h-3.5" /> : playMode === "guided" ? <BookOpen className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                  {modeConfig.resultBadge}
                  {timeLimit && <span className="text-[10px] opacity-70 ml-1">({Math.round(timeLimit / 60)} min limit)</span>}
                </div>
              )}
              {difficultyMod !== "standard" && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-orange-500/10 border-orange-500/20 text-orange-400 text-xs font-semibold">
                  <Zap className="w-3.5 h-3.5" />
                  {DIFFICULTY_MODIFIERS[difficultyMod].label}
                </div>
              )}
              {launchConfig?.variant && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-cyan-500/10 border-cyan-500/20 text-cyan-400 text-xs font-semibold">
                  <Layers className="w-3.5 h-3.5" />
                  {launchConfig.variant.label}
                </div>
              )}
            </div>
          )}

          {/* Fault log */}
          <div className="sim-glass-panel p-5 mb-5">
            <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
              <Monitor className="w-3.5 h-3.5 text-emerald-400" />
              PLC Fault Log
            </h3>
            <div className="font-mono-industrial text-[11px] space-y-1 max-h-40 overflow-y-auto pr-1">
              {scenario.faultLog.map((entry, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className={`flex gap-3 py-1 px-2 rounded ${
                    entry.severity === "critical" ? "text-red-400 bg-red-500/5" :
                    entry.severity === "warning" ? "text-amber-400 bg-amber-500/5" : "text-gray-500"
                  }`}
                >
                  <span className="text-gray-600 shrink-0">{entry.timestamp}</span>
                  <span className="shrink-0 w-16">[{entry.source}]</span>
                  <span className="shrink-0 w-12 font-bold">{entry.code}</span>
                  <span className="truncate">{entry.description}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Orientation prompt — shown when user clicks Begin Troubleshooting in portrait */}
          {pendingActiveTransition && isCompact && orientation === "portrait" && (
            <OrientationPrompt show={true} onDismiss={() => {
              // User dismissed the prompt — let them proceed anyway
              setPendingActiveTransition(false);
              setPhase("active");
            }} />
          )}

          {/* Start button */}
          <motion.button
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => {
              // If in portrait on mobile, show orientation prompt first
              if (isCompact && orientation === "portrait") {
                setPendingActiveTransition(true);
                return;
              }
              setPhase("active");
            }}
            className="w-full sim-action-btn text-lg flex items-center justify-center gap-3 py-4"
          >
            <Wrench className="w-5 h-5" />
            {playMode === "timed" ? "Begin Timed Challenge" : playMode === "guided" ? "Begin Guided Session" : playMode === "minimal_hints" ? "Begin Expert Challenge" : "Begin Troubleshooting"}
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // === RENDER: ACTIVE SIMULATION — IMMERSIVE SPLIT-PANEL ===
  if (phase === "active" && currentScenarioPhase) {
    const currentTool = availableTools.find(t => t.id === selectedTool);
    const needsMeterSetting = currentTool?.meterSettings && !selectedMeterSetting;

    // === SHARED SUB-COMPONENTS ===

    // machinePanel is defined above (before early returns) to maintain consistent hook count

    // Diagnostics Panel — SCADA-style diagnostic workstation
    const DiagnosticsPanel = ({ mobile = false }: { mobile?: boolean }) => (
      <div className={mobile ? "flex flex-col" : "h-full flex flex-col overflow-hidden"} style={{ touchAction: "pan-y" }}>
        {/* SCADA-style panel header */}
        <div className="shrink-0 bg-[#040604] border-b border-gray-800/60">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-1.5">
              <Crosshair className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-mono-industrial text-emerald-400 uppercase tracking-[0.15em]">DIAGNOSTICS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono-industrial text-gray-500">
                {scenario.faults.length - faultsFixed} FAULT{scenario.faults.length - faultsFixed !== 1 ? "S" : ""}
              </span>
              <span className="text-[10px] font-mono-industrial text-emerald-500">
                {discoveredClues.size} CLUE{discoveredClues.size !== 1 ? "S" : ""}
              </span>
            </div>
          </div>
          {/* Objective strip */}
          <div className="px-2 pb-1.5">
            <p className="text-white text-[11px] font-medium leading-snug truncate">{currentScenarioPhase.title}</p>
          </div>
        </div>

        {/* Scrollable diagnostics content */}
        <div
          ref={mobile ? undefined : desktopDiagnosticsScrollRef}
          className={mobile ? "p-2 space-y-2" : "flex-1 overflow-y-auto p-2 space-y-2 sim-diagnostics-scroll"}
          style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch", overflowAnchor: "none" }}
        >
          {/* Narrative */}
          <div className="sim-glass-panel p-3">
            <div className="text-gray-200 text-xs leading-relaxed">
              <GlossaryTooltip text={currentScenarioPhase.narrative} glossary={scenario.glossary} role={role!} />
            </div>
          </div>

          {/* Action feedback toast */}
          <AnimatePresence>
            {actionFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className={`sim-feedback text-xs ${
                  actionFeedback.type === "positive" ? "sim-feedback-positive" :
                  actionFeedback.type === "negative" ? "sim-feedback-negative" : "sim-feedback-neutral"
                } flex items-start gap-2`}
              >
                {actionFeedback.type === "positive" ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /> :
                 actionFeedback.type === "negative" ? <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> :
                 <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                <span>{actionFeedback.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Time pressure popup */}
          <AnimatePresence>
            {showTimePressure && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className={`sim-glass-elevated p-3 border-l-4 ${
                  showTimePressure.urgency === "critical" ? "border-l-red-500" :
                  showTimePressure.urgency === "high" ? "border-l-amber-500" : "border-l-blue-500"
                }`}
              >
                <div className="flex items-start gap-2">
                  <Phone className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                    showTimePressure.urgency === "critical" ? "text-red-400" :
                    showTimePressure.urgency === "high" ? "text-amber-400" : "text-blue-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-white text-xs font-semibold">{showTimePressure.from}</span>
                    <p className="text-gray-300 text-[11px] italic leading-relaxed">"{showTimePressure.message}"</p>
                  </div>
                  <button onClick={() => setShowTimePressure(null)} className="text-gray-500 hover:text-white p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase transition */}
          <AnimatePresence>
            {phaseTransition && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="sim-glass-elevated p-4 border-l-4 border-l-emerald-500"
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">Phase Complete</span>
                </div>
                <p className="text-emerald-100 text-xs leading-relaxed">{phaseTransition}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Meter setting selector */}
          {selectedTool && needsMeterSetting && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="sim-glass-panel p-3">
                <h3 className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                  <Settings className="w-3 h-3 text-emerald-400" />
                  Meter Setting — {currentTool?.name}
                </h3>
                <div className="grid grid-cols-3 gap-1.5">
                  {currentTool?.meterSettings?.map(setting => (
                    <button
                      key={setting}
                      onClick={() => handleMeterSettingSelect(setting)}
                      className={`p-2 rounded-lg border text-[10px] text-center transition-all font-medium ${
                        selectedMeterSetting === setting
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                          : "border-gray-700/50 bg-white/[2%] text-gray-300 hover:border-gray-600"
                      }`}
                    >
                      <span className="font-mono-industrial">{METER_SETTING_LABELS[setting]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Meter display animation */}
          <AnimatePresence>
            {showMeterDisplay && lastReading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="sim-meter-display p-4"
              >
                {lastReading.numeric !== undefined && (
                  <MeterNeedleAnimation reading={lastReading.numeric} />
                )}
                <div className="text-center font-mono-industrial">
                  <span className="text-2xl text-emerald-400 font-semibold">{lastReading.value}</span>
                  <span className="text-sm text-emerald-300/60 ml-2">{lastReading.unit}</span>
                </div>
                <div className="text-center mt-1">
                  <span className="text-gray-500 text-[9px] uppercase tracking-wider">Live Reading</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Wrong setting feedback */}
          <AnimatePresence>
            {wrongSettingFeedback && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="sim-feedback sim-feedback-negative text-xs flex items-start gap-2"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{wrongSettingFeedback}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Measurement locations */}
          {selectedTool && selectedTool !== "prints" && !needsMeterSetting && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h3 className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                <Crosshair className="w-3 h-3 text-emerald-400" />
                Measurement Points
              </h3>
              <div className="space-y-1.5">
                {currentScenarioPhase.locations
                  .filter(loc => {
                    if (selectedTool === "multimeter") return loc.terminalMeasurements && loc.terminalMeasurements.length > 0;
                    return loc.simpleReadings?.[selectedTool!];
                  })
                  .map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => handleLocationSelect(loc)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                        selectedLocation?.id === loc.id
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                          : "border-gray-700/40 bg-white/[2%] text-gray-300 hover:border-gray-500/50 hover:bg-white/[4%]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                          selectedLocation?.id === loc.id ? "bg-emerald-500/20" : "bg-gray-800/60"
                        }`}>
                          <Target className="w-3 h-3" />
                        </div>
                        <span className="font-medium">{loc.label}</span>
                      </div>
                      {loc.description && (
                        <p className="text-gray-500 text-[10px] mt-1 ml-7">{loc.description}</p>
                      )}
                    </button>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Terminal measurements */}
          {selectedLocation && selectedLocation.terminalMeasurements && selectedTool === "multimeter" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="sim-glass-panel p-3">
                <h3 className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">
                  Terminals — {selectedLocation.label}
                </h3>
                <div className="space-y-1.5">
                  {selectedLocation.terminalMeasurements!.map((tm: TerminalMeasurement, i: number) => {
                    const readingKey = `${selectedLocation.id}:${tm.fromTerminal}:${tm.toTerminal}:${tm.requiredSetting}`;
                    const revealed = revealedMeasurements.get(readingKey);
                    return (
                      <button
                        key={i}
                        onClick={() => !revealed && handleTerminalMeasurement(tm)}
                        disabled={!!revealed}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                          revealed
                            ? tm.isKeyClue
                              ? "border-emerald-500/30 bg-emerald-500/5"
                              : "border-gray-700/30 bg-white/[1%] opacity-60"
                            : "border-gray-700/40 bg-white/[2%] hover:border-gray-500/50 hover:bg-white/[4%] cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-industrial text-[10px] bg-gray-800/80 px-1.5 py-0.5 rounded text-gray-200 border border-gray-700/50">
                              {tm.fromTerminal}
                            </span>
                            <span className="text-gray-600 text-[10px]">→</span>
                            <span className="font-mono-industrial text-[10px] bg-gray-800/80 px-1.5 py-0.5 rounded text-gray-200 border border-gray-700/50">
                              {tm.toTerminal}
                            </span>
                          </div>
                          {revealed ? (
                            <span className={`font-mono-industrial text-xs font-semibold ${tm.isKeyClue ? "text-emerald-400" : "text-gray-400"}`}>
                              {revealed} {tm.isKeyClue && <span className="text-emerald-300">★</span>}
                            </span>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center">
                              <Target className="w-2.5 h-2.5 text-gray-600" />
                            </div>
                          )}
                        </div>
                        {revealed && role === "new" && tm.newTechExplanation && (
                          <p className="text-blue-300/80 text-[10px] mt-1.5 pl-1 leading-relaxed">ℹ️ {tm.newTechExplanation}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* System Actions */}
          {currentSystemState && currentSystemState.availableActions.length > 0 && (
            <div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAccordion(setShowActionPanel);
                }}
                className="w-full p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs flex items-center justify-between hover:bg-amber-500/10 transition-all select-none touch-manipulation"
              >
                <span className="flex items-center gap-2 font-medium">
                  <Wrench className="w-3.5 h-3.5" />
                  Take Action ({currentSystemState.availableActions.filter(a => !a.availableFor || a.availableFor.includes(role!)).length})
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showActionPanel ? "rotate-180" : ""}`} />
              </button>

              {showActionPanel && (
                <div className="pt-2 space-y-1.5">
                  {currentSystemState.availableActions
                    .filter(a => !a.availableFor || a.availableFor.includes(role!))
                    .map(action => (
                      <button
                        key={action.id}
                        onClick={() => handleSystemAction(action)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          action.category === "bypass" || action.category === "disconnect"
                            ? "border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
                            : action.category === "reset" || action.category === "replace"
                            ? "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
                            : "border-gray-700/40 bg-white/[2%] hover:bg-white/[4%]"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          {action.category === "bypass" && <Skull className="w-3 h-3 text-red-400" />}
                          {action.category === "reset" && <RotateCcw className="w-3 h-3 text-emerald-400" />}
                          {action.category === "replace" && <Wrench className="w-3 h-3 text-emerald-400" />}
                          {action.category === "lockout" && <Shield className="w-3 h-3 text-amber-400" />}
                          <span className="text-white text-xs font-medium">{action.label}</span>
                        </div>
                        <span className="text-gray-400 text-[10px] leading-relaxed">{action.description}</span>
                        {action.safetyWarning && (
                          <span className="text-red-400/80 text-[10px] block mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> {action.safetyWarning}
                          </span>
                        )}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Evidence Collected */}
          {revealedMeasurements.size > 0 && !selectedLocation && (
            <div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAccordion(setShowEvidence);
                }}
                className="w-full flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5 py-1 select-none touch-manipulation"
              >
                <span className="flex items-center gap-1.5">
                  <Search className="w-3 h-3 text-emerald-400" />
                  Evidence ({revealedMeasurements.size})
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showEvidence ? "rotate-180" : ""}`} />
              </button>
              {showEvidence && (
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {Array.from(revealedMeasurements.entries()).map(([key, reading]) => {
                    const parts = key.split(":");
                    const locId = parts[0];
                    const loc = currentScenarioPhase.locations.find(l => l.id === locId);
                    const isClue = discoveredClues.has(locId);
                    return (
                      <div key={key} className={`sim-evidence-item ${isClue ? "key-clue" : ""} flex items-center justify-between`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isClue ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-gray-700 shrink-0" />
                          )}
                          <span className="text-gray-300 text-[10px] truncate">{loc?.label || locId}</span>
                        </div>
                        <span className={`font-mono-industrial text-[10px] font-medium shrink-0 ml-2 ${isClue ? "text-emerald-300" : "text-gray-400"}`}>
                          {reading}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Senior checkpoint */}
          {role === "senior" && currentScenarioPhase.seniorCheckpoint && (
            <div className="sim-glass-elevated p-4 border-l-4 border-l-amber-500">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold">Reasoning Checkpoint</span>
              </div>
              <p className="text-white text-xs mb-3 leading-relaxed">{currentScenarioPhase.seniorCheckpoint.question}</p>
              <div className="space-y-1.5">
                {currentScenarioPhase.seniorCheckpoint.options.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      if (!seniorAnswer) {
                        setSeniorAnswer(opt.id);
                        setSeniorFeedback(opt.feedback);
                        setCheckpointScore(prev => prev + opt.scoreImpact);
                      }
                    }}
                    disabled={!!seniorAnswer}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                      seniorAnswer
                        ? opt.id === seniorAnswer
                          ? opt.isCorrect ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-red-500/40 bg-red-500/10 text-red-200"
                          : opt.isCorrect ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300/60" : "border-gray-800/30 text-gray-600"
                        : "border-gray-700/40 bg-white/[2%] text-gray-300 hover:border-gray-500/50 hover:bg-white/[4%] cursor-pointer"
                    }`}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
              {seniorFeedback && (
                <div className="mt-2 p-2.5 rounded-xl bg-black/20 border border-gray-800/30 text-gray-300 text-[10px] leading-relaxed">{seniorFeedback}</div>
              )}
            </div>
          )}

          {/* Communications */}
          {(currentScenarioPhase.communications || scenario.communications).length > 0 && (
            <>
              <h3 className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-emerald-400" />
                Communications
              </h3>
              <div className="space-y-1.5">
                {(currentScenarioPhase.communications || scenario.communications).map(ch => {
                  const used = communicationsUsed.has(ch.id);
                  return (
                    <button
                      key={ch.id}
                      onClick={() => !used && handleCommunication(ch)}
                      disabled={used}
                      className={`w-full text-left p-2.5 rounded-xl border text-[11px] transition-all ${
                        used
                          ? ch.isUseful ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300/70" : "border-gray-800/30 bg-white/[1%] text-gray-600"
                          : "border-gray-700/40 bg-white/[2%] hover:border-gray-600/50 hover:bg-white/[4%] text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {ch.type === "radio" ? <Radio className="w-3 h-3" /> :
                         ch.type === "phone" ? <Phone className="w-3 h-3" /> :
                         ch.type === "maintenance_log" ? <BookOpen className="w-3 h-3" /> :
                         <MessageSquare className="w-3 h-3" />}
                        <span className="font-medium">{ch.label}</span>
                      </div>
                      {used && (
                        <p className="text-[10px] mt-1 italic text-gray-400/80 leading-relaxed">"{ch.response}"</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Advance button */}
          {canAdvance && !phaseTransition && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <button
                onClick={handleAdvancePhase}
                className="w-full sim-action-btn flex items-center justify-center gap-2 text-sm"
              >
                {currentPhaseIdx < scenario.phases.length - 1 ? "Continue Investigation" : "Complete Scenario"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Event Log */}
          {actionsLog.length > 0 && (
            <div className="pt-3 border-t border-gray-800/40">
              <h3 className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1.5">
                <Monitor className="w-3 h-3 text-emerald-400" />
                Event Log
              </h3>
              <div className="bg-[#040604] rounded-lg border border-gray-800/30 p-2 max-h-32 overflow-y-auto font-mono-industrial text-[9px] leading-relaxed space-y-0.5">
                {actionsLog.slice(-15).map((entry, i) => (
                  <div key={i} className={`py-0.5 flex gap-1.5 ${
                    entry.wasUseful ? "text-emerald-400/70" : entry.type === "measurement" ? "text-gray-500" : "text-amber-400/70"
                  }`}>
                    <span className="text-gray-600 shrink-0">[{formatTime(entry.timestamp)}]</span>
                    <span className="truncate">{entry.description}</span>
                    {entry.reading && entry.reading !== "INVALID" && (
                      <span className="text-emerald-300/80 shrink-0 ml-auto">→ {entry.reading}</span>
                    )}
                  </div>
                ))}
                <div className="text-gray-700 animate-pulse">▌</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );

    // Tools Panel — Industrial tool rack
    const ToolsPanel = ({ compact = false }: { compact?: boolean }) => (
      <div className={compact ? "space-y-2" : "h-full flex flex-col overflow-hidden"}>
        {/* SCADA-style panel header (desktop only) */}
        {!compact && (
          <div className="shrink-0 bg-[#040604] border-b border-gray-800/60 px-2 py-1">
            <div className="flex items-center gap-1.5">
              <Wrench className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-mono-industrial text-emerald-400 uppercase tracking-[0.15em]">TOOL RACK</span>
            </div>
          </div>
        )}
        <div className={compact ? "" : "flex-1 overflow-y-auto p-2 space-y-2"}>
          {/* Tool Belt */}
          <div>
            {compact && (
              <h3 className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1.5">
                <Wrench className="w-3 h-3 text-emerald-400" />
                Tools
              </h3>
            )}
            <div className={`grid ${compact ? "grid-cols-5" : "grid-cols-2"} gap-1.5`}>
              {availableTools.map(tool => {
                const Icon = TOOL_ICONS[tool.id] || Wrench;
                const isSelected = selectedTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    className={`sim-tool-btn ${isSelected ? "selected" : ""} text-left relative ${compact ? "!p-2 !min-h-0" : ""}`}
                  >
                    <Icon className={`${compact ? "w-4 h-4 mx-auto" : "w-4 h-4 mb-1"} transition-colors ${isSelected ? "text-emerald-400" : "text-gray-400"}`} />
                    <span className={`${compact ? "text-[10px] text-center block mt-0.5" : "text-[10px] block leading-tight"} font-medium transition-colors ${isSelected ? "text-emerald-300" : "text-gray-300"}`}>
                      {compact ? tool.name.split(" ")[0] : tool.name}
                    </span>
                    {tool.meterSettings && (
                      <span className={`absolute ${compact ? "top-1 right-1" : "top-2 right-2"} w-1.5 h-1.5 bg-amber-400 rounded-full`} />
                    )}
                    {isSelected && (
                      <motion.div
                        layoutId="tool-indicator"
                        className="absolute inset-0 rounded-[0.625rem] border-2 border-emerald-500/40 pointer-events-none"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hint — gated by play mode */}
          {modeConfig.hintsEnabled ? (
            <button
              onClick={() => { setShowHint(!showHint); if (!showHint) setHintsUsed((h: number) => h + 1); }}
              className="w-full p-2 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-[10px] flex items-center gap-2 hover:bg-amber-500/10 transition-all font-medium"
            >
              <Lightbulb className="w-3 h-3" />
              {showHint ? "Hide Hint" : playMode === "guided" ? "Show Guidance (reduced penalty)" : `Hint (−${Math.abs(scenario.scoring.hintPenalty)} pts)`}
            </button>
          ) : (
            <div className="w-full p-2 rounded-xl border border-gray-700/20 bg-gray-800/30 text-gray-600 text-[10px] flex items-center gap-2 font-medium cursor-not-allowed">
              <Shield className="w-3 h-3" />
              Expert Mode — No Hints
            </div>
          )}
          {showHint && currentScenarioPhase.hints[role!] && (
            <div className="sim-feedback sim-feedback-neutral text-[10px] leading-relaxed">
              {currentScenarioPhase.hints[role!]}
            </div>
          )}

          {/* Fault Log */}
          <button
            onClick={() => setShowFaultLog(!showFaultLog)}
            className="w-full p-2 rounded-xl border border-gray-700/40 bg-white/[2%] text-gray-300 text-[10px] flex items-center gap-2 hover:bg-white/[4%] transition-all font-medium"
          >
            <AlertTriangle className="w-3 h-3" />
            {showFaultLog ? "Hide Fault Log" : "PLC Fault Log"}
          </button>
          {showFaultLog && (
            <div className="sim-glass-panel p-2 font-mono-industrial text-[9px] space-y-0.5 max-h-28 overflow-y-auto">
              {(currentSystemState?.visibleFaults || scenario.faultLog).map((entry, i) => (
                <div key={i} className={`py-0.5 ${
                  entry.severity === "critical" ? "text-red-400" :
                  entry.severity === "warning" ? "text-amber-400" : "text-gray-500"
                }`}>
                  {entry.timestamp} | {entry.code} | {entry.description}
                </div>
              ))}
            </div>
          )}

          {/* Live PLC Tags — vertical detail view */}
          <div className="sim-glass-panel p-2">
            <PLCTagList
              scenario={scenario}
              currentSystemState={currentSystemState ?? undefined}
              faultsFixed={faultsFixed}
              timer={timer}
              discoveredClues={discoveredClues}
            />
          </div>

          {/* Consequence log */}
          {consequenceLog.length > 0 && (
            <div>
              <h3 className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-emerald-400" />
                Actions Taken
              </h3>
              <div className="space-y-1">
                {actionsLog.filter(a => a.type === "action").map((a, i) => (
                  <div key={i} className={`text-[10px] p-2 rounded-lg leading-relaxed ${
                    a.wasUseful ? "text-emerald-300/80 bg-emerald-500/5 border border-emerald-500/10" : "text-red-300/80 bg-red-500/5 border border-red-500/10"
                  }`}>
                    {a.description}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );

    // === LAYOUT RENDERING ===
    return (
      <div className={`sim-immersive-container font-sim ${isImmersive ? "sim-fullscreen" : ""}`}>
        {/* Orientation prompt — BLOCKS all interaction in portrait on mobile */}
        {/* FIX 4: Uses stablePortrait (400ms stability guard) instead of raw orientation */}
        {isCompact && stablePortrait && !orientationBypassed && (
          <OrientationPrompt show={true} onDismiss={() => setOrientationBypassed(true)} />
        )}

        {/* Timed mode expired overlay */}
        {timedExpired && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center p-8"
            >
              <Timer className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-sim-body)" }}>Time Expired</h2>
              <p className="text-gray-400 text-sm">Moving to debrief...</p>
            </motion.div>
          </motion.div>
        )}

        {/* === STATUS BAR — Industrial control strip === */}
        <div className="sim-status-bar">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { exitImmersive(); onExit(); }}
              className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
              title="Exit simulator"
              aria-label="Exit simulator"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                // Back navigates to previous simulator screen
                if (phase === "active") {
                  setPhase("briefing");
                } else if (phase === "briefing") {
                  setPhase("role_select");
                }
              }}
              className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-gray-700/40"
              title="Back to previous screen"
              aria-label="Back to previous screen"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[10px] font-medium hidden sm:inline">Back</span>
            </button>
            <div className="h-3 w-px bg-gray-800 hidden md:block" />
            <span className="text-gray-300 text-[9px] md:text-[10px] font-mono-industrial truncate max-w-[100px] md:max-w-[200px]">{scenario.plantContext.lineName}</span>
            <span className="text-gray-700 hidden md:inline">•</span>
            <span className="text-gray-500 text-[9px] font-mono-industrial hidden md:inline truncate max-w-[150px]">{currentScenarioPhase.title}</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Live telemetry chips */}
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/8 border border-emerald-500/15">
              <Search className="w-2.5 h-2.5 text-emerald-500" />
              <span className="text-[10px] font-mono-industrial text-emerald-400">{discoveredClues.size}</span>
            </div>
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/8 border border-amber-500/15">
              <Target className="w-2.5 h-2.5 text-amber-500" />
              <span className="text-[10px] font-mono-industrial text-amber-400">{faultsFixed}/{scenario.faults.length}</span>
            </div>
            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded border ${
              timeLimit 
                ? (timedExpired ? "bg-red-500/15 border-red-500/30 animate-pulse" : (timeLimit - timer < 60 ? "bg-red-500/8 border-red-500/15" : "bg-amber-500/8 border-amber-500/15"))
                : (timer > 600 ? "bg-red-500/8 border-red-500/15" : timer > 300 ? "bg-amber-500/8 border-amber-500/15" : "bg-gray-500/8 border-gray-700/30")
            }`}>
              {timeLimit ? <Timer className="w-2.5 h-2.5 text-amber-400" /> : <Clock className={`w-2.5 h-2.5 ${timer > 600 ? "text-red-500" : timer > 300 ? "text-amber-500" : "text-gray-500"}`} />}
              <span className={`text-[10px] font-mono-industrial ${
                timeLimit
                  ? (timedExpired ? "text-red-400" : (timeLimit - timer < 60 ? "text-red-400" : "text-amber-400"))
                  : (timer > 600 ? "text-red-400" : timer > 300 ? "text-amber-400" : "text-gray-400")
              }`}>
                {timeLimit ? `${formatTime(Math.max(0, timeLimit - timer))} left` : formatTime(timer)}
              </span>
            </div>
            {/* Play mode badge */}
            {playMode !== "standard" && (
              <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9px] font-semibold uppercase tracking-wider ${
                playMode === "timed" ? "bg-amber-500/8 border-amber-500/15 text-amber-400" :
                playMode === "guided" ? "bg-blue-500/8 border-blue-500/15 text-blue-400" :
                "bg-purple-500/8 border-purple-500/15 text-purple-400"
              }`}>
                {modeConfig.resultBadge}
              </div>
            )}
            <div className="h-3 w-px bg-gray-800 mx-0.5 hidden md:block" />
            {/* Control buttons */}
            <button
              onClick={() => setGuidedMode(g => !g)}
              className={`p-1 rounded transition-all ${
                guidedMode ? "bg-blue-500/15 text-blue-400" : "text-gray-600 hover:text-gray-300 hover:bg-white/5"
              }`}
              title="Toggle guided mode"
            >
              <Compass className="w-3 h-3" />
            </button>
            <button
              onClick={toggleAudio}
              className={`p-1 rounded transition-all ${
                audioEnabled ? "bg-blue-500/15 text-blue-400" : "text-gray-600 hover:text-gray-300 hover:bg-white/5"
              }`}
              title={audioEnabled ? "Mute audio" : "Enable audio"}
            >
              <Volume2 className="w-3 h-3" />
            </button>
            <button
              onClick={toggleImmersive}
              className="p-1 rounded text-gray-600 hover:text-emerald-400 hover:bg-white/5 transition-all"
              title={isImmersive ? "Exit immersive" : "Enter immersive"}
            >
              {isImmersive ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* === MAIN CONTENT: SPLIT PANEL === */}
        {isCompact ? (
          /* MOBILE / TABLET LAYOUT */
          <div className="sim-mobile-workspace">
            {/* Tab content — each tab gets its own persistent scroll container.
                Using display:none/block instead of conditional rendering prevents
                iOS Safari from losing scroll capability when DOM is remounted. */}
            <div className="flex-1 relative">
              {/* Machine tab — allow both axes for wide SVG diagram panning */}
              <div
                className="absolute inset-0 overflow-auto"
                style={{ WebkitOverflowScrolling: "touch" as any, overscrollBehavior: "contain", touchAction: "pan-x pan-y", display: mobileTab === "machine" ? "block" : "none" }}
              >
                {machinePanel}
              </div>
              {/* Diagnostics tab */}
              <div
                ref={diagnosticsScrollRef}
                className="absolute inset-0 overflow-y-auto overflow-x-hidden"
                style={{ WebkitOverflowScrolling: "touch" as any, overscrollBehavior: "contain", overflowAnchor: "none", display: mobileTab === "diagnostics" ? "block" : "none" }}
              >
                <DiagnosticsPanel mobile />
              </div>
              {/* Tools tab */}
              <div
                ref={toolsScrollRef}
                className="absolute inset-0 overflow-y-auto overflow-x-hidden"
                style={{ WebkitOverflowScrolling: "touch" as any, overscrollBehavior: "contain", display: mobileTab === "tools" ? "block" : "none" }}
              >
                <div className="p-3">
                  <ToolsPanel compact />
                </div>
              </div>
            </div>

            {/* Mobile tab bar */}
            <div className="sim-mobile-tabbar">
              {([
                { id: "machine" as MobileTab, icon: Layers, label: "Machine" },
                { id: "diagnostics" as MobileTab, icon: Search, label: "Diagnose" },
                { id: "tools" as MobileTab, icon: Wrench, label: "Tools" },
              ]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setMobileTab(tab.id)}
                  className={`sim-mobile-tab ${mobileTab === tab.id ? "active" : ""}`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="text-[9px] mt-0.5">{tab.label}</span>
                  {tab.id === "diagnostics" && discoveredClues.size > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* DESKTOP LAYOUT — Split panel */
          <div className="sim-desktop-workspace">
            {/* Left: Machine Visualization */}
            <div className="sim-panel-left">
              {machinePanel}
            </div>

            {/* Center: Diagnostics */}
            <div className="sim-panel-center">
              <DiagnosticsPanel />
            </div>

            {/* Right: Tools sidebar */}
            <div className="sim-panel-right">
              <ToolsPanel />
            </div>
          </div>
        )}

        {/* Guided Troubleshooting Overlay */}
        <AnimatePresence>
          {guidedMode && (
            <GuidedTroubleshootingOverlay
              scenario={scenario}
              currentPhase={currentScenarioPhase}
              role={role!}
              discoveredClues={discoveredClues}
              revealedMeasurements={revealedMeasurements}
              communicationsUsed={communicationsUsed}
              selectedTool={selectedTool}
              faultsFixed={faultsFixed}
              currentSystemState={currentSystemState}
              consequenceLog={consequenceLog}
              onClose={() => setGuidedMode(false)}
            />
          )}
        </AnimatePresence>

        {/* Prints overlay */}
        <AnimatePresence>
          {showPrints && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 md:p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="max-w-5xl w-full max-h-[90vh] overflow-auto sim-glass-elevated p-3 md:p-5"
                style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" } as React.CSSProperties}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-sm md:text-lg flex items-center gap-2" style={{ fontFamily: "var(--font-sim-body)", textTransform: "none" }}>
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Electrical Prints — {scenario.diagram.title}
                  </h3>
                  <button onClick={() => setShowPrints(false)} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <InteractiveCircuitDiagramV3
                  diagram={scenario.diagram}
                  role={role!}
                  systemState={currentSystemState}
                  activeAnimations={activeAnimations}
                  disablePanZoom={isCompact}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Safety Warning Confirmation Dialog (replaces blocking window.confirm) */}
        <AlertDialog open={!!pendingSafetyAction} onOpenChange={(open) => { if (!open) setPendingSafetyAction(null); }}>
          <AlertDialogContent className="bg-[#1a1f1a] border-amber-500/30 text-white max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                Safety Warning
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300 text-sm leading-relaxed">
                {pendingSafetyAction?.safetyWarning}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                onClick={() => setPendingSafetyAction(null)}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-amber-600 hover:bg-amber-700 text-white border-0"
                onClick={() => {
                  if (pendingSafetyAction) {
                    executeSystemAction(pendingSafetyAction);
                    setPendingSafetyAction(null);
                  }
                }}
              >
                Proceed Anyway
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Grounded AI tutor coaching — appears after a wrong move, dismissable. */}
        {(tutorCoach.isLoading || tutorCoach.coaching) && (
          <div className="fixed bottom-4 right-4 z-[60] max-w-sm rounded-lg border border-emerald-500/30 bg-[#11160f]/95 p-4 shadow-xl backdrop-blur">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                <Lightbulb className="h-3.5 w-3.5" /> Instructor
              </span>
              <button
                onClick={tutorCoach.clear}
                className="text-gray-500 hover:text-gray-300"
                aria-label="Dismiss coaching"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {tutorCoach.isLoading ? (
              <p className="text-sm text-gray-400">Thinking through your move…</p>
            ) : (
              <p className="text-sm leading-relaxed text-gray-200">{tutorCoach.coaching}</p>
            )}
          </div>
        )}

        {/* Exit confirmation dialog (Escape key during active session) */}
        <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
          <AlertDialogContent className="bg-[#1a1f1a] border-gray-600/50 text-white max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-gray-200">
                Exit Scenario?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400 text-sm leading-relaxed">
                Your progress will be saved and you can resume later from where you left off.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                onClick={() => setShowExitConfirm(false)}
              >
                Continue Scenario
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600/80 hover:bg-red-700 text-white border-0"
                onClick={() => { setShowExitConfirm(false); onExit(); }}
              >
                Exit
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // === RENDER: DEBRIEF ===
  if (phase === "debrief") {
    const score = calculateScore();
    const pct = Math.round((score / scenario.scoring.maxScore) * 100);
    const grade = getGrade(pct);
    const usefulActions = actionsLog.filter(a => a.wasUseful).length;
    const efficiency = actionsLog.length > 0 ? Math.round((usefulActions / actionsLog.length) * 100) : 100;

    // Stable snapshot computed in a useMemo above — never recomputed mid-debrief.
    const methodologyScore = debriefMethodology ?? calculateMethodologyScore({
      actions: actionsLog as any,
      discoveredClues: Array.from(discoveredClues),
      hintsUsed,
      timeSeconds: timer,
      faultsFixed,
      totalFaults: scenario.faults.length,
      role: role!,
      scenario,
      consequenceLog,
      communicationsUsed: Array.from(communicationsUsed),
    });

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-[#080c08] via-[#0a0f0a] to-[#060a06] p-4 md:p-8 pb-20 font-sim" style={{ touchAction: "pan-y", overscrollBehavior: "contain", paddingBottom: "max(2rem, calc(env(safe-area-inset-bottom) + 1.5rem))" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          {/* Grade */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5"
              style={{ background: `linear-gradient(135deg, ${getGradeColor(grade)}20, ${getGradeColor(grade)}05)`, border: `2px solid ${getGradeColor(grade)}30` }}
            >
              <Award className="w-10 h-10" style={{ color: getGradeColor(grade) }} />
            </motion.div>
            <h1 className="text-4xl text-white font-bold mb-2" style={{ fontFamily: "var(--font-sim-body)", textTransform: "none", color: getGradeColor(grade) }}>{grade}</h1>
            <p className="text-gray-400 font-mono-industrial text-sm">{pct}% — {score}/{scenario.scoring.maxScore} pts</p>
            <p className="text-gray-500 text-xs mt-1">
              {faultsFixed}/{scenario.faults.length} faults resolved in {formatTime(timer)}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {[
              { label: "Time", value: formatTime(timer), icon: Clock },
              { label: "Actions", value: actionsLog.length.toString(), icon: Target },
              { label: "Efficiency", value: `${efficiency}%`, icon: TrendingUp },
              { label: "Clues", value: discoveredClues.size.toString(), icon: CheckCircle2 },
              { label: "Comms", value: communicationsUsed.size.toString(), icon: Radio },
            ].map(stat => (
              <div key={stat.label} className="sim-glass-panel p-4 text-center">
                <stat.icon className="w-4 h-4 text-gray-500 mx-auto mb-2" />
                <div className="font-mono-industrial text-white text-xl font-semibold">{stat.value}</div>
                <div className="text-gray-500 text-[10px] uppercase tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Faults breakdown */}
          <div className="sim-glass-elevated p-6 mb-6">
            <h3 className="text-white font-semibold text-lg mb-5" style={{ fontFamily: "var(--font-sim-body)", textTransform: "none" }}>Fault Analysis</h3>
            {scenario.faults.map((fault, i) => (
              <div key={fault.id} className="mb-5 last:mb-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    i < faultsFixed ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-red-500/15 text-red-400 border border-red-500/20"
                  }`}>
                    {i + 1}
                  </span>
                  <span className="text-white text-sm font-semibold">{fault.name}</span>
                  {i < faultsFixed && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-gray-400 text-xs ml-10 mb-1 leading-relaxed">{fault.rootCause}</p>
                <p className="text-gray-500 text-[11px] ml-10 leading-relaxed">{fault.technicalDetail}</p>
              </div>
            ))}
          </div>

          {/* Activation capture — anonymous players get the signup CTA at peak dopamine */}
          {!isAuthenticated && (
            <AnonDebriefCTA
              scenarioTitle={scenario.title}
              methodologyPercent={methodologyScore.overallPercentage}
              tier={methodologyScore.methodologyTier}
              grade={grade}
            />
          )}

          {/* Methodology Assessment */}
          <MethodologyBreakdown score={methodologyScore} />

          {/* Logged-in-only: AI debrief + open-response (both call protected procedures) */}
          {isAuthenticated && (
            <>
              <TutorDebrief scenarioTitle={scenario.title} methodologyScore={methodologyScore} />
              {scenario.faults[0] && (
                <FreeTextDiagnosis
                  faultName={scenario.faults[0].name}
                  correctRootCause={scenario.faults[0].rootCause}
                  scenarioSlug={scenario.id}
                />
              )}
            </>
          )}

          {/* Prevention */}
          <div className="sim-glass-panel p-6 mb-6">
            <h3 className="text-white font-semibold text-lg mb-4" style={{ fontFamily: "var(--font-sim-body)", textTransform: "none" }}>Prevention Steps</h3>
            <ul className="text-gray-300 text-xs space-y-2">
              {scenario.faults.flatMap(f => f.preventionSteps).map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action log */}
          <div className="sim-glass-panel p-6 mb-6">
            <h3 className="text-white font-semibold text-lg mb-4" style={{ fontFamily: "var(--font-sim-body)", textTransform: "none" }}>Full Action Log</h3>
            <div className="space-y-1 font-mono-industrial text-[10px] max-h-48 overflow-y-auto pr-1">
              {actionsLog.map((action, i) => (
                <div key={i} className={`flex items-start gap-2 p-1.5 rounded-lg ${
                  action.wasUseful ? "text-emerald-300/80" : action.type === "action" && !action.wasUseful ? "text-red-300/80" : "text-gray-500"
                }`}>
                  <span className="text-gray-600 w-10 shrink-0">{formatTime(action.timestamp)}</span>
                  <span className="flex-1">{action.description}</span>
                  {action.wasUseful && <span className="text-emerald-400">★</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Next */}
          <div className="mb-6">
            <ScenarioProgressionCard compact />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onExit}
              className="flex-1 py-3.5 rounded-xl border border-gray-700/40 bg-white/[3%] text-white font-semibold hover:bg-white/[6%] transition-all"
              style={{ fontFamily: "var(--font-sim-body)" }}
            >
              Back to Scenarios
            </button>
            <button
              onClick={() => {
                setPhase("role_select");
                setRole(null);
                setCurrentPhaseIdx(0);
                setCurrentSystemStateId("");
                setSelectedTool(null);
                setSelectedMeterSetting(null);
                setSelectedLocation(null);
                setActionsLog([]);
                setDiscoveredClues(new Set());
                setRevealedMeasurements(new Map());
                setHintsUsed(0);
                setShowHint(false);
                setGuidedMode(false);
                setShowPrints(false);
                setShowFaultLog(false);
                setShowComms(false);
                setTimer(0);
                setSeniorAnswer(null);
                setSeniorFeedback(null);
                setCheckpointScore(0);
                setPhaseTransition(null);
                setActiveAnimations([]);
                setTimePressureMessages([]);
                setShowTimePressure(null);
                setCommunicationsUsed(new Set());
                setConsequenceLog([]);
                setFaultsFixed(0);
                setShowActionPanel(false);
                setShowMeterDisplay(false);
                setLastReading(null);
                setWrongSettingFeedback(null);
                setActionFeedback(null);
                setShowEvidence(false);
                timePressureRef.current = new Set();
                setCompletionRecorded(false);
              }}
              className="flex-1 sim-action-btn flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
