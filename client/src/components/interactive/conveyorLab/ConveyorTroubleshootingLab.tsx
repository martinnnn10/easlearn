import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ClipboardList, Cpu, Monitor, SlidersHorizontal } from "lucide-react";
import { createInitialPlcState } from "@/lib/conveyorLab/conveyorProgram";
import { discoverEvidence } from "@/lib/conveyorLab/evidenceDiscovery";
import {
  applyOperatorReset,
  createNormalFieldState,
  fieldStateToPlcInputs,
  type FieldDeviceState,
} from "@/lib/conveyorLab/fieldDeviceModel";
import {
  getFaultById,
  ROOT_CAUSE_OPTIONS,
} from "@/lib/conveyorLab/faultCatalog";
import {
  parseConveyorLabSearchParams,
  pickInitialFault,
  pickRandomFromScope,
  isFaultInScope,
  buildAttributionFingerprint,
  isHomepageLabEntry,
  type ConveyorLabAttribution,
} from "@shared/conveyorLabAttribution";
import { loadConveyorLabSession, saveConveyorLabSession } from "@/lib/conveyorLab/sessionPersistence";
import ConveyorAttributionBar from "./ConveyorAttributionBar";
import { injectFault } from "@/lib/conveyorLab/faultInjectionEngine";
import {
  deriveFirstStepFromEvents,
  getDiagnosticStepLabel,
  logIoPanelReview,
  logMeterReading,
  logPrintReview,
  scoreConveyorAttempt,
} from "@/lib/conveyorLab/flagshipScoring";
import { deriveMachineTwin } from "@/lib/conveyorLab/machineTwinModel";
import { runScanCycle } from "@/lib/conveyorLab/plcScanEngine";
import type {
  DiagnosticEvent,
  DiagnosticStep,
  FaultId,
  FlagshipLabScore,
  LabMode,
  MeterMode,
  MeterProbeId,
  MobilePanel,
  PlcState,
} from "@/lib/conveyorLab/types";
import ConveyorDebrief from "./ConveyorDebrief";
import ConveyorPersonalBest from "./ConveyorPersonalBest";
import { recordAttempt } from "@/lib/conveyorLab/personalBest";
import ConveyorDiagnosticsPanel, { computeMeterReading } from "./ConveyorDiagnosticsPanel";
import ConveyorFaultInjector from "./ConveyorFaultInjector";
import ConveyorGuidedPanel from "./ConveyorGuidedPanel";
import ConveyorLadderPanel from "./ConveyorLadderPanel";
import ConveyorMachineView from "./ConveyorMachineView";
import ConveyorPrintDrawer from "./ConveyorPrintDrawer";
import ConveyorMissionBriefing from "./ConveyorMissionBriefing";
import ConveyorFirstTimeGuide from "./ConveyorFirstTimeGuide";
import {
  isGuideComplete,
  markBriefingComplete,
  markGuideComplete,
  patchFteMetrics,
  recordBriefingDismissed,
  recordFirstAction,
  recordFirstDiagnosisAttempt,
  shouldShowBriefing,
  shouldShowGuide,
  startFteSession,
} from "@/lib/conveyorLab/conveyorOrientation";

const SCAN_MS = 200;
const START_PULSE_MS = 350;

function buildFieldState(faultId: FaultId) {
  return injectFault({
    faultId,
    productAtPhotoeye: false,
    field: createNormalFieldState(),
  });
}

export default function ConveyorTroubleshootingLab() {
  const [attribution, setAttribution] = useState<ConveyorLabAttribution>(() =>
    typeof window !== "undefined" ? parseConveyorLabSearchParams(window.location.search) : {}
  );
  const [faultScope, setFaultScope] = useState<FaultId[] | undefined>(() => attribution.faultScope);
  const [mode, setMode] = useState<LabMode>("learn");
  const [activeFault, setActiveFault] = useState<FaultId>("normal");
  const [plc, setPlc] = useState<PlcState>(createInitialPlcState);
  const [isRunning, setIsRunning] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("machine");
  const [guidedStep, setGuidedStep] = useState(1);
  const [showHint, setShowHint] = useState(false);
  const [stepTimestamps, setStepTimestamps] = useState<number[]>([Date.now()]);
  const [stepHints, setStepHints] = useState<boolean[]>([]);
  const [showProduct, setShowProduct] = useState(false);
  const [rootCauseGuess, setRootCauseGuess] = useState<FaultId | "">("");
  const [debriefOpen, setDebriefOpen] = useState(false);
  const [replayHighlightRung, setReplayHighlightRung] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [recordedFirstStep, setRecordedFirstStep] = useState<DiagnosticStep | null>(null);
  const [safetyViolations, setSafetyViolations] = useState<string[]>([]);
  const [submittedScore, setSubmittedScore] = useState<FlagshipLabScore | null>(null);
  const [personalBestResult, setPersonalBestResult] = useState<{ isNewBestTime: boolean; isNewBestScore: boolean } | null>(null);
  const [events, setEvents] = useState<DiagnosticEvent[]>([]);
  const [discoveredEvidence, setDiscoveredEvidence] = useState<string[]>([]);
  const [selectedProbe, setSelectedProbe] = useState<MeterProbeId>("estop_nc");
  const [meterMode, setMeterMode] = useState<MeterMode>("continuity");
  const [meterReading, setMeterReading] = useState<string | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [fieldOverrides, setFieldOverrides] = useState<Partial<FieldDeviceState>>({});
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [guideActive, setGuideActive] = useState(false);
  const [guideStep, setGuideStep] = useState(0);

  const trackAction = useCallback(() => {
    recordFirstAction();
  }, []);

  const operatorInputs = useRef<Record<string, boolean>>({});
  const startPulseUntil = useRef(0);
  const ioLogged = useRef(false);
  const initDone = useRef(false);
  const persistReady = useRef(false);

  const faultDef = useMemo(() => getFaultById(activeFault), [activeFault]);

  const fieldState = useMemo(() => {
    const injected = buildFieldState(activeFault);
    if (activeFault !== "normal") return injected;
    return { ...injected, ...fieldOverrides };
  }, [activeFault, fieldOverrides, plc.scanCount]);

  const machine = useMemo(
    () => deriveMachineTwin(plc, fieldState, activeFault, showProduct),
    [plc, fieldState, activeFault, showProduct]
  );

  const detectedFirstStep = useMemo(() => deriveFirstStepFromEvents(events), [events]);

  const symptomText = useMemo(() => {
    if (activeFault === "normal") {
      return "Normal operation — press START and wait 3s for motor output.";
    }
    if (mode === "learn" && faultDef) return faultDef.symptom;
    if ((mode === "practice" || mode === "guided") && faultDef) {
      return faultDef.operatorReport;
    }
    return undefined;
  }, [mode, activeFault, faultDef]);

  const operatorReport = mode !== "learn" && faultDef ? faultDef.operatorReport : undefined;

  const resetLab = useCallback(
    (fault: FaultId, nextMode?: LabMode, scopeOverride?: FaultId[]) => {
      const scope = scopeOverride ?? faultScope;
      const resolvedFault =
        fault === "normal" && (nextMode === "practice" || nextMode === "guided")
          ? pickRandomFromScope(scope)
          : fault;

      setPlc(createInitialPlcState());
      operatorInputs.current = {};
      startPulseUntil.current = 0;
      setShowProduct(false);
      setActiveFault(resolvedFault);
      if (nextMode) setMode(nextMode);
      setGuidedStep(1);
      setShowHint(false);
      setStepTimestamps([Date.now()]);
      setStepHints([]);
      setRootCauseGuess("");
      setDebriefOpen(false);
      setElapsedSec(0);
      setRecordedFirstStep(null);
      setSafetyViolations([]);
      setSubmittedScore(null);
      setEvents([]);
      setDiscoveredEvidence([]);
      setMeterReading(null);
      setHintsUsed(0);
      setFieldOverrides({});
      ioLogged.current = false;
    },
    [faultScope]
  );

  const startPractice = () => resetLab("normal", "practice");

  const handleSelectFault = (id: FaultId) => {
    if (!isFaultInScope(id, faultScope)) return;
    resetLab(id, mode);
  };

  const handleRandomFault = () => resetLab("normal", mode);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const attr = parseConveyorLabSearchParams(window.location.search);
    const fingerprint = buildAttributionFingerprint(attr);
    const saved = loadConveyorLabSession();
    const homeEntry = isHomepageLabEntry(attr);
    startFteSession();

    if (saved && saved.fingerprint === fingerprint) {
      setAttribution(saved.attribution);
      setFaultScope(saved.faultScope);
      setMode(saved.mode);
      setActiveFault(saved.activeFault);
      setGuidedStep(saved.guidedStep);
      setShowHint(saved.showHint);
      setRootCauseGuess(saved.rootCauseGuess as FaultId | "");
      setDebriefOpen(saved.debriefOpen);
      setElapsedSec(saved.elapsedSec);
      setSafetyViolations(saved.safetyViolations);
      setSubmittedScore(saved.submittedScore);
      setEvents(saved.events);
      setDiscoveredEvidence(saved.discoveredEvidence);
      setMeterReading(saved.meterReading);
      setHintsUsed(saved.hintsUsed);
      setSelectedProbe(saved.selectedProbe);
      setMeterMode(saved.meterMode);
      setMobilePanel(saved.mobilePanel);
      setIsRunning(saved.isRunning);
      operatorInputs.current = saved.operatorInputs ?? {};
      ioLogged.current = saved.events.some((e) => e.description.includes("Reviewed PLC I/O"));
      setBriefingOpen(false);
      setGuideActive(false);
    } else {
      setAttribution(attr);
      setFaultScope(attr.faultScope);
      const initMode = homeEntry ? "practice" : (attr.mode ?? "learn");
      const initFault = pickInitialFault(initMode, attr.faultScope);
      setMode(initMode);
      setActiveFault(initFault);
      if (initMode !== "learn" || initFault !== "normal") {
        ioLogged.current = false;
      }
      const showBriefing = shouldShowBriefing({
        homeEntry,
        restoredSession: false,
        midSession: false,
      });
      setBriefingOpen(showBriefing);
      setIsRunning(!showBriefing);
      if (!showBriefing && shouldShowGuide({ briefingOpen: false, restoredSession: false })) {
        setGuideActive(true);
        setGuideStep(0);
      }
    }

    persistReady.current = true;
  }, []);

  useEffect(() => {
    if (!persistReady.current) return;
    saveConveyorLabSession({
      attribution,
      faultScope,
      mode,
      activeFault,
      elapsedSec,
      guidedStep,
      hintsUsed,
      rootCauseGuess,
      events,
      discoveredEvidence,
      safetyViolations,
      selectedProbe,
      meterMode,
      meterReading,
      mobilePanel,
      debriefOpen,
      submittedScore,
      operatorInputs: operatorInputs.current,
      showHint,
      isRunning,
    });
  }, [
    attribution,
    faultScope,
    mode,
    activeFault,
    elapsedSec,
    guidedStep,
    hintsUsed,
    rootCauseGuess,
    events,
    discoveredEvidence,
    safetyViolations,
    selectedProbe,
    meterMode,
    meterReading,
    mobilePanel,
    debriefOpen,
    submittedScore,
    showHint,
    isRunning,
  ]);

  useEffect(() => {
    if (debriefOpen || activeFault === "normal") return;
    const t = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [debriefOpen, activeFault]);

  useEffect(() => {
    if (activeFault !== "normal") {
      setShowProduct(false);
      return;
    }
    if (machine.beltRunning) {
      const t = setTimeout(() => setShowProduct(true), 2500);
      return () => clearTimeout(t);
    }
    setShowProduct(false);
  }, [machine.beltRunning, activeFault]);

  useEffect(() => {
    if (!ioLogged.current && activeFault !== "normal" && mobilePanel === "diagnostics") {
      ioLogged.current = true;
      setEvents((prev) => logIoPanelReview(prev));
    }
  }, [activeFault, mobilePanel]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setPlc((prev) => {
        const now = Date.now();
        const op = { ...operatorInputs.current };
        op["I:1/1"] = now < startPulseUntil.current;

        const injected = buildFieldState(activeFault);
        const field =
          activeFault !== "normal" ? injected : { ...injected, ...fieldOverrides };
        const mergedInputs = fieldStateToPlcInputs(field, op);
        return runScanCycle({ ...prev, inputs: mergedInputs });
      });
    }, SCAN_MS);

    return () => clearInterval(interval);
  }, [isRunning, activeFault, fieldOverrides]);

  useEffect(() => {
    if (activeFault === "normal") return;
    if (events.length === 0) return;
    setDiscoveredEvidence((prev) => discoverEvidence(activeFault, plc, machine, prev));
  }, [activeFault, plc, machine, events]);

  const appendEvent = (event: DiagnosticEvent) => {
    setEvents((prev) => [...prev, event]);
  };

  const onPulseStart = () => {
    trackAction();
    if (!plc.inputs["I:1/2"] && activeFault === "estop_open") {
      setSafetyViolations((v) =>
        v.includes("Started without resetting E-stop") ? v : [...v, "Started without resetting E-stop"]
      );
      appendEvent({
        id: `safety-${Date.now()}`,
        timestamp: Date.now(),
        type: "safety",
        description: "START pressed with E-stop active",
      });
    }
    startPulseUntil.current = Date.now() + START_PULSE_MS;
    appendEvent({
      id: `action-${Date.now()}`,
      timestamp: Date.now(),
      type: "action",
      description: "Pressed START",
    });
  };

  const onPressStop = () => {
    const next = !(operatorInputs.current["I:1/0"] ?? false);
    setInput("I:1/0", next);
    appendEvent({
      id: `action-${Date.now()}`,
      timestamp: Date.now(),
      type: "action",
      description: next ? "Pressed STOP" : "Released STOP",
    });
  };

  const setInput = (addr: string, value: boolean) => {
    operatorInputs.current = { ...operatorInputs.current, [addr]: value };
    setPlc((prev) => ({
      ...prev,
      inputs: { ...prev.inputs, [addr]: value },
    }));
  };

  const onResetEstop = () => {
    const { faultCleared } = applyOperatorReset(fieldState, activeFault, "estop");
    if (faultCleared) setActiveFault("normal");
    setFieldOverrides((o) => ({ ...o, estopNcClosed: true }));
    setInput("I:1/2", false);
    appendEvent({
      id: `action-${Date.now()}`,
      timestamp: Date.now(),
      type: "action",
      description: "Reset E-stop",
    });
  };

  const onActuateEstop = () => {
    if (activeFault !== "normal") return;
    setFieldOverrides((o) => ({ ...o, estopNcClosed: false }));
    appendEvent({
      id: `action-${Date.now()}`,
      timestamp: Date.now(),
      type: "action",
      description: "Actuated E-stop",
    });
  };

  const onToggleGuard = () => {
    if (activeFault !== "normal") return;
    setFieldOverrides((o) => {
      const closed = o.guardClosed ?? true;
      return { ...o, guardClosed: !closed };
    });
    appendEvent({
      id: `action-${Date.now()}`,
      timestamp: Date.now(),
      type: "action",
      description: "Toggled guard switch",
    });
  };

  const onTripOverload = () => {
    if (activeFault !== "normal") return;
    setFieldOverrides((o) => ({ ...o, overloadNcClosed: false }));
    appendEvent({
      id: `action-${Date.now()}`,
      timestamp: Date.now(),
      type: "action",
      description: "Tripped overload",
    });
  };

  const onResetOverload = () => {
    const { faultCleared } = applyOperatorReset(fieldState, activeFault, "overload");
    if (faultCleared) setActiveFault("normal");
    setFieldOverrides((o) => ({ ...o, overloadNcClosed: true }));
    setInput("I:1/4", false);
    appendEvent({
      id: `action-${Date.now()}`,
      timestamp: Date.now(),
      type: "action",
      description: "Reset overload",
    });
  };

  const onTakeReading = () => {
    trackAction();
    const mechanicalFault = activeFault === "output_on_motor_dead" && (plc.outputs["O:2/0"] ?? false);
    const reading = computeMeterReading(selectedProbe, meterMode, plc, mechanicalFault);
    setMeterReading(reading);
    setEvents((prev) => logMeterReading(prev, selectedProbe, meterMode, reading));
  };

  const onOpenPrints = () => {
    trackAction();
    setPrintOpen(true);
    setEvents((prev) => logPrintReview(prev));
  };

  const onSubmitDiagnosis = () => {
    if (!faultDef || activeFault === "normal") return;
    recordFirstDiagnosisAttempt();
    trackAction();

    const step = deriveFirstStepFromEvents(events) ?? recordedFirstStep;
    const computedScore = scoreConveyorAttempt({
      fault: faultDef,
      firstStep: step,
      rootCauseId: rootCauseGuess || null,
      timeSeconds: elapsedSec,
      safetyViolations,
      events,
      hintsUsed,
      mode,
      discoveredEvidence,
    });
    setSubmittedScore(computedScore);
    // Record personal best
    const pbResult = recordAttempt(
      activeFault as FaultId,
      elapsedSec,
      computedScore.totalPercent,
      computedScore.rootCauseCorrect
    );
    setPersonalBestResult(pbResult);
    setDebriefOpen(true);
  };
  const handleBriefingStart = () => {
    markBriefingComplete();
    recordBriefingDismissed();
    setBriefingOpen(false);
    setIsRunning(true);
    if (mode !== "practice" || activeFault === "normal") {
      startPractice();
    }
    if (shouldShowGuide({ briefingOpen: false, restoredSession: false })) {
      setGuideActive(true);
      setGuideStep(0);
    }
  };

  const handleGuideSkip = () => {
    markGuideComplete();
    patchFteMetrics({ guideSkipped: true });
    setGuideActive(false);
  };

  const handleGuideComplete = () => {
    markGuideComplete();
    patchFteMetrics({ guideCompleted: true });
    setGuideActive(false);
  };

  const diagnosisForm = (
    <div className="space-y-3" data-conveyor-guide="submit-diagnosis">
      <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase">
        Submit diagnosis
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="block">
          <span className="text-[10px] font-mono text-[oklch(0.50_0.006_250)]">First check (from event log)</span>
          <div className="mt-1 px-3 py-2 rounded-md bg-[oklch(0.08_0.003_250)] border border-[oklch(0.20_0.004_250)] text-xs text-white">
            {detectedFirstStep
              ? getDiagnosticStepLabel(detectedFirstStep)
              : "No diagnostic action logged yet — review I/O, prints, or take a meter reading."}
          </div>
        </div>
        <label className="block">
          <span className="text-[10px] font-mono text-[oklch(0.50_0.006_250)]">Root cause</span>
          <select
            value={rootCauseGuess}
            onChange={(e) => setRootCauseGuess(e.target.value as FaultId)}
            className="mt-1 w-full px-3 py-2 rounded-md bg-[oklch(0.08_0.003_250)] border border-[oklch(0.20_0.004_250)] text-xs text-white"
          >
            <option value="">Select…</option>
            {(faultScope?.length
              ? ROOT_CAUSE_OPTIONS.filter((o) => faultScope.includes(o.id))
              : ROOT_CAUSE_OPTIONS
            ).map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="button"
        disabled={!rootCauseGuess}
        onClick={onSubmitDiagnosis}
        className="px-4 py-2 text-xs font-mono rounded-md border border-[oklch(0.55_0.12_155/50%)] bg-[oklch(0.12_0.04_155)] text-[oklch(0.75_0.12_155)] disabled:opacity-40"
      >
        Submit diagnosis
      </button>
    </div>
  );

  const mobileTabs: { id: MobilePanel; label: string; icon: typeof Monitor }[] = [
    { id: "machine", label: "Machine", icon: Monitor },
    { id: "ladder", label: "Ladder", icon: Cpu },
    { id: "diagnostics", label: "Diag", icon: SlidersHorizontal },
    { id: "actions", label: "Actions", icon: ClipboardList },
  ];

  return (
    <div className="conveyor-lab -mx-4 sm:mx-0">
      {briefingOpen && <ConveyorMissionBriefing onStart={handleBriefingStart} />}
      {guideActive && !briefingOpen && (
        <ConveyorFirstTimeGuide
          stepIndex={guideStep}
          onStepChange={setGuideStep}
          onPanelChange={setMobilePanel}
          onSkip={handleGuideSkip}
          onComplete={handleGuideComplete}
        />
      )}

      <ConveyorPrintDrawer
        open={printOpen}
        onClose={() => setPrintOpen(false)}
      />

      <div className={`card-panel p-4 sm:p-6 ${activeFault !== "normal" && !debriefOpen ? "pb-44 xl:pb-6" : ""}`}>
        <ConveyorAttributionBar attribution={attribution} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-heading text-white tracking-wide">
              Conveyor PLC Diagnostic Lab
            </h3>
            <p className="text-xs text-[oklch(0.50_0.008_250)] mt-1">
              Packaging Line 4 — machine twin, fault engine, process scoring, standards & prints
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["learn", "practice", "guided"] as LabMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  if (m === "practice") startPractice();
                  else if (m === "guided") resetLab("normal", "guided");
                  else resetLab("normal", "learn");
                }}
                className={`lab-mode-btn px-3 py-2 min-h-[2.75rem] text-xs font-mono rounded border capitalize ${
                  mode === m
                    ? "border-[oklch(0.55_0.12_155)] text-[oklch(0.75_0.12_155)] bg-[oklch(0.12_0.04_155)]"
                    : "border-[oklch(0.20_0.004_250)] text-[oklch(0.50_0.006_250)]"
                }`}
              >
                {m}
              </button>
            ))}
            <button
              type="button"
              onClick={onOpenPrints}
              className="lab-mode-btn px-3 py-2 min-h-[2.75rem] text-xs font-mono rounded border border-[oklch(0.25_0.006_250)] text-[oklch(0.55_0.008_250)] hover:border-[oklch(0.40_0.006_250)] inline-flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" />
              Prints
            </button>
            <button
              type="button"
              onClick={() => setIsRunning(!isRunning)}
              className={`lab-mode-btn px-3 py-2 min-h-[2.75rem] text-xs font-mono rounded border ${
                isRunning
                  ? "border-[oklch(0.55_0.12_155)] text-[oklch(0.55_0.12_155)]"
                  : "border-[oklch(0.50_0.15_30)] text-[oklch(0.50_0.15_30)]"
              }`}
            >
              {isRunning ? "● SCAN" : "■ HOLD"}
            </button>
          </div>
        </div>

        {mode === "guided" && !debriefOpen && (
          <div className="mb-4">
            <ConveyorGuidedPanel
              currentStep={guidedStep}
              activeFault={activeFault}
              onAdvance={() => {
                setStepTimestamps((ts) => [...ts, Date.now()]);
                setStepHints((h) => [...h, showHint]);
                setGuidedStep((s) => s + 1);
              }}
              onRecordStep={(step) => setRecordedFirstStep((prev) => prev ?? step)}
              showHint={showHint}
              onToggleHint={() => {
                setShowHint((h) => !h);
                if (!showHint) setHintsUsed((n) => n + 1);
              }}
            />
          </div>
        )}

        {mode !== "practice" && (
          <div className="mb-4">
            <ConveyorFaultInjector
              mode={mode}
              activeFault={activeFault}
              faultScope={faultScope}
              onSelectFault={handleSelectFault}
              onRandomFault={handleRandomFault}
            />
          </div>
        )}

        <div className="hidden xl:grid xl:grid-cols-3 gap-3 min-h-[480px]">
          <div className="conveyor-lab-panel-wrap rounded-lg border border-[oklch(0.14_0.004_250)] overflow-hidden">
            <ConveyorLadderPanel plc={plc} highlightRung={replayHighlightRung || (mode === "guided" ? "rung-2" : null)} />
          </div>
          <div className="conveyor-lab-panel-wrap rounded-lg border border-[oklch(0.14_0.004_250)] overflow-hidden">
            <ConveyorMachineView
              machine={machine}
              symptom={symptomText}
              operatorReport={operatorReport}
            />
          </div>
          <div className="conveyor-lab-panel-wrap rounded-lg border border-[oklch(0.14_0.004_250)] overflow-hidden">
            <ConveyorDiagnosticsPanel
              plc={plc}
              activeFault={activeFault}
              events={events}
              discoveredEvidence={discoveredEvidence}
              selectedProbe={selectedProbe}
              meterMode={meterMode}
              meterReading={meterReading}
              onSelectProbe={(id) => {
                setSelectedProbe(id);
                setMeterReading(null);
              }}
              onSetMeterMode={(mode) => {
                setMeterMode(mode);
                setMeterReading(null);
              }}
              onTakeReading={onTakeReading}
              onPulseStart={onPulseStart}
              onPressStop={onPressStop}
              onResetEstop={onResetEstop}
              onResetOverload={onResetOverload}
              onActuateEstop={onActuateEstop}
              onToggleGuard={onToggleGuard}
              onTripOverload={onTripOverload}
              showFieldControls={activeFault === "normal"}
              elapsedSec={elapsedSec}
              hintsUsed={hintsUsed}
            />
          </div>
        </div>

        <div className="xl:hidden conveyor-lab-mobile">
          <div className="conveyor-mobile-tabs sticky top-0 z-10 -mx-1 px-1 py-2 mb-3 bg-[oklch(0.08_0.003_250/95%)] backdrop-blur-sm border-b border-[oklch(0.14_0.004_250)]">
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {mobileTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMobilePanel(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 min-h-[2.75rem] rounded-lg text-sm font-mono whitespace-nowrap shrink-0 ${
                    mobilePanel === tab.id
                      ? "bg-[oklch(0.55_0.12_155/15%)] text-[oklch(0.75_0.12_155)] border border-[oklch(0.55_0.12_155/30%)]"
                      : "text-[oklch(0.55_0.008_250)] border border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
            </div>
          </div>
          <div className="conveyor-lab-panel-wrap rounded-lg border border-[oklch(0.14_0.004_250)] overflow-hidden min-h-[360px]">
            {mobilePanel === "machine" && (
              <ConveyorMachineView
                machine={machine}
                symptom={symptomText}
                operatorReport={operatorReport}
              />
            )}
            {mobilePanel === "ladder" && (
              <ConveyorLadderPanel plc={plc} highlightRung={replayHighlightRung || (mode === "guided" ? "rung-2" : null)} />
            )}
            {mobilePanel === "diagnostics" && (
              <ConveyorDiagnosticsPanel
                plc={plc}
                activeFault={activeFault}
                events={events}
                discoveredEvidence={discoveredEvidence}
                selectedProbe={selectedProbe}
                meterMode={meterMode}
                meterReading={meterReading}
                onSelectProbe={(id) => {
                  setSelectedProbe(id);
                  setMeterReading(null);
                }}
                onSetMeterMode={(mode) => {
                  setMeterMode(mode);
                  setMeterReading(null);
                }}
                onTakeReading={onTakeReading}
                onPulseStart={onPulseStart}
                onPressStop={onPressStop}
                onResetEstop={onResetEstop}
                onResetOverload={onResetOverload}
                onActuateEstop={onActuateEstop}
                onToggleGuard={onToggleGuard}
                onTripOverload={onTripOverload}
                showFieldControls={activeFault === "normal"}
                elapsedSec={elapsedSec}
                hintsUsed={hintsUsed}
              />
            )}
            {mobilePanel === "actions" && activeFault !== "normal" && !debriefOpen && (
              <div className="p-4">{diagnosisForm}</div>
            )}
          </div>
        </div>

        {activeFault !== "normal" && !debriefOpen && (
          <div className="hidden xl:block mt-4 p-4 rounded-lg border border-[oklch(0.14_0.004_250)] bg-[oklch(0.06_0.003_250)]">
            {diagnosisForm}
          </div>
        )}

        {debriefOpen && faultDef && submittedScore && (
          <div className="mt-4">
            <ConveyorPersonalBest
              newRecordFault={personalBestResult ? activeFault : null}
              isNewBestTime={personalBestResult?.isNewBestTime}
              isNewBestScore={personalBestResult?.isNewBestScore}
            />
            <ConveyorDebrief
              fault={faultDef}
              score={submittedScore}
              mode={mode}
              stepTimestamps={stepTimestamps}
              stepHints={stepHints}
              activeFault={activeFault}
              onRetry={() => resetLab(activeFault, mode)}
              onNextFault={() => {
                if (mode === "practice" || mode === "guided") resetLab("normal", mode);
                else handleRandomFault();
              }}
              onHighlightRung={setReplayHighlightRung}
            />
          </div>
        )}

        {activeFault !== "normal" && !debriefOpen && (
          <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[oklch(0.14_0.004_250)] bg-[oklch(0.06_0.003_250/98%)] backdrop-blur-sm p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_24px_oklch(0_0_0/35%)]">
            {diagnosisForm}
          </div>
        )}
      </div>
    </div>
  );
}
