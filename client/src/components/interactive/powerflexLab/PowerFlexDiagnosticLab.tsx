import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ClipboardList, Gauge, SlidersHorizontal } from "lucide-react";
import {
  parsePowerFlexLabSearchParams,
  pickInitialPowerFlexFault,
  pickRandomPowerFlexFromScope,
  isPowerFlexFaultInScope,
  buildPowerFlexAttributionFingerprint,
  type PowerFlexLabAttribution,
} from "@shared/powerflexLabAttribution";
import { loadPowerFlexLabSession, savePowerFlexLabSession } from "@/lib/powerflexLab/sessionPersistence";
import { buildDriveTelemetry, buildParameters } from "@/lib/powerflexLab/driveState";
import { discoverEvidence } from "@/lib/powerflexLab/evidence";
import { getFaultById, ROOT_CAUSE_OPTIONS } from "@/lib/powerflexLab/faultCatalog";
import {
  deriveFirstStepFromEvents,
  getDiagnosticStepLabel,
  logFaultHistoryReview,
  logParameterBrowse,
  logReferenceReview,
  logStatusReview,
  scoreAttempt,
} from "@/lib/powerflexLab/scoring";
import type {
  DiagnosticEvent,
  DiagnosticStep,
  FaultId,
  LabMode,
  LabScore,
  MobilePanel,
} from "@/lib/powerflexLab/types";
import PowerFlexAttributionBar from "./PowerFlexAttributionBar";
import PowerFlexDebrief from "./PowerFlexDebrief";
import PowerFlexDrivePanel from "./PowerFlexDrivePanel";
import PowerFlexFaultInjector from "./PowerFlexFaultInjector";
import PowerFlexGuidedPanel from "./PowerFlexGuidedPanel";
import PowerFlexParameterPanel from "./PowerFlexParameterPanel";
import PowerFlexReferenceDrawer from "./PowerFlexReferenceDrawer";
import PowerFlexStatusPanel from "./PowerFlexStatusPanel";

export default function PowerFlexDiagnosticLab() {
  const [attribution, setAttribution] = useState<PowerFlexLabAttribution>(() =>
    typeof window !== "undefined" ? parsePowerFlexLabSearchParams(window.location.search) : {}
  );
  const [faultScope, setFaultScope] = useState<FaultId[] | undefined>(() => attribution.faultScope);
  const [mode, setMode] = useState<LabMode>("learn");
  const [activeFault, setActiveFault] = useState<FaultId>("normal");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("drive");
  const [guidedStep, setGuidedStep] = useState(1);
  const [showHint, setShowHint] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [rootCauseGuess, setRootCauseGuess] = useState<FaultId | "">("");
  const [debriefOpen, setDebriefOpen] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [recordedFirstStep, setRecordedFirstStep] = useState<DiagnosticStep | null>(null);
  const [submittedScore, setSubmittedScore] = useState<LabScore | null>(null);
  const [events, setEvents] = useState<DiagnosticEvent[]>([]);
  const [discoveredEvidence, setDiscoveredEvidence] = useState<string[]>([]);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [driveRunning, setDriveRunning] = useState(false);

  const initDone = useRef(false);
  const faultHistoryLogged = useRef(false);
  const persistReady = useRef(false);

  const faultDef = useMemo(() => getFaultById(activeFault), [activeFault]);
  const telemetry = useMemo(
    () => buildDriveTelemetry(activeFault, driveRunning && activeFault === "normal"),
    [activeFault, driveRunning]
  );
  const parameters = useMemo(() => buildParameters(activeFault), [activeFault]);
  const faultLog = faultDef?.faultLog ?? [];

  const detectedFirstStep = useMemo(() => deriveFirstStepFromEvents(events), [events]);

  useEffect(() => {
    if (activeFault !== "normal") {
      setDriveRunning(false);
    }
  }, [activeFault]);

  const symptomText =
    activeFault === "normal"
      ? "Drive ready — inject a fault or press START to simulate running at 45 Hz."
      : mode === "learn" && faultDef
        ? faultDef.symptom
        : undefined;

  const operatorReport = mode !== "learn" && faultDef ? faultDef.operatorReport : undefined;

  const resetLab = useCallback(
    (fault: FaultId, nextMode?: LabMode, scopeOverride?: FaultId[]) => {
      const scope = scopeOverride ?? faultScope;
      const resolvedFault =
        fault === "normal" && (nextMode === "practice" || nextMode === "guided")
          ? pickRandomPowerFlexFromScope(scope)
          : fault;

      setActiveFault(resolvedFault);
      if (nextMode) setMode(nextMode);
      setDriveRunning(resolvedFault === "normal");
      setGuidedStep(1);
      setShowHint(false);
      setRootCauseGuess("");
      setDebriefOpen(false);
      setElapsedSec(0);
      setRecordedFirstStep(null);
      setSubmittedScore(null);
      setEvents([]);
      setDiscoveredEvidence([]);
      setHintsUsed(0);
      faultHistoryLogged.current = false;
    },
    [faultScope]
  );

  const startPractice = () => resetLab("normal", "practice");

  const handleSelectFault = (id: FaultId) => {
    if (!isPowerFlexFaultInScope(id, faultScope)) return;
    resetLab(id, mode);
  };

  const handleRandomFault = () => resetLab("normal", mode);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const attr = parsePowerFlexLabSearchParams(window.location.search);
    const fingerprint = buildPowerFlexAttributionFingerprint(attr);
    const saved = loadPowerFlexLabSession();

    if (saved && saved.fingerprint === fingerprint) {
      setAttribution(saved.attribution);
      setFaultScope(saved.faultScope);
      setMode(saved.mode);
      setActiveFault(saved.activeFault);
      setGuidedStep(saved.guidedStep);
      setShowHint(saved.showHint);
      setHintsUsed(saved.hintsUsed);
      setRootCauseGuess(saved.rootCauseGuess as FaultId | "");
      setDebriefOpen(saved.debriefOpen);
      setElapsedSec(saved.elapsedSec);
      setRecordedFirstStep(saved.recordedFirstStep);
      setSubmittedScore(saved.submittedScore);
      setEvents(saved.events);
      setDiscoveredEvidence(saved.discoveredEvidence);
      setMobilePanel(saved.mobilePanel);
      setDriveRunning(saved.driveRunning);
      setReferenceOpen(saved.referenceOpen);
      faultHistoryLogged.current = saved.events.some((e) =>
        e.description.toLowerCase().includes("fault history")
      );
    } else {
      setAttribution(attr);
      setFaultScope(attr.faultScope);
      const initMode = attr.mode ?? "learn";
      const initFault = pickInitialPowerFlexFault(initMode, attr.faultScope);
      setMode(initMode);
      setActiveFault(initFault);
      setDriveRunning(initFault === "normal");
    }

    persistReady.current = true;
  }, []);

  useEffect(() => {
    if (!persistReady.current) return;
    savePowerFlexLabSession({
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
      recordedFirstStep,
      mobilePanel,
      debriefOpen,
      submittedScore,
      showHint,
      driveRunning,
      referenceOpen,
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
    recordedFirstStep,
    mobilePanel,
    debriefOpen,
    submittedScore,
    showHint,
    driveRunning,
    referenceOpen,
  ]);

  useEffect(() => {
    if (debriefOpen || activeFault === "normal") return;
    const t = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [debriefOpen, activeFault]);

  useEffect(() => {
    if (activeFault === "normal") return;
    setDiscoveredEvidence((prev) =>
      discoverEvidence(activeFault, telemetry, parameters, prev)
    );
  }, [activeFault, telemetry, parameters]);

  useEffect(() => {
    if (!faultHistoryLogged.current && activeFault !== "normal") {
      faultHistoryLogged.current = true;
      setEvents((prev) => logFaultHistoryReview(prev));
    }
  }, [activeFault]);

  const appendEvent = (event: DiagnosticEvent) => setEvents((prev) => [...prev, event]);

  const onSubmitDiagnosis = () => {
    if (!faultDef || activeFault === "normal") return;
    const step = deriveFirstStepFromEvents(events) ?? recordedFirstStep;
    setSubmittedScore(
      scoreAttempt({
        fault: faultDef,
        firstStep: step,
        rootCauseId: rootCauseGuess || null,
        timeSeconds: elapsedSec,
        events,
        hintsUsed,
        mode,
        discoveredEvidence,
      })
    );
    setDebriefOpen(true);
  };

  const diagnosisForm = (
    <div className="space-y-3">
      <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase">Submit diagnosis</div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <span className="text-[10px] font-mono text-[oklch(0.50_0.006_250)]">First check (from event log)</span>
          <div className="mt-1 px-3 py-2 rounded-md bg-[oklch(0.08_0.003_250)] border border-[oklch(0.20_0.004_250)] text-xs text-white">
            {detectedFirstStep
              ? getDiagnosticStepLabel(detectedFirstStep)
              : "No diagnostic action logged — review fault display, status, or parameters."}
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
        className="px-4 py-2 text-xs font-mono rounded-md border border-[oklch(0.55_0.12_250/50%)] bg-[oklch(0.12_0.04_250)] text-[oklch(0.75_0.12_250)] disabled:opacity-40"
      >
        Submit diagnosis
      </button>
    </div>
  );

  const mobileTabs: { id: MobilePanel; label: string; icon: typeof Gauge }[] = [
    { id: "drive", label: "Drive", icon: Gauge },
    { id: "parameters", label: "Params", icon: SlidersHorizontal },
    { id: "status", label: "Status", icon: ClipboardList },
    { id: "actions", label: "Actions", icon: BookOpen },
  ];

  return (
    <div className="powerflex-lab -mx-4 sm:mx-0">
      <PowerFlexReferenceDrawer
        open={referenceOpen}
        onClose={() => setReferenceOpen(false)}
        onReviewed={() => setEvents((prev) => logReferenceReview(prev))}
      />

      <div className="card-panel p-4 sm:p-6">
        <PowerFlexAttributionBar attribution={attribution} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-heading text-white tracking-wide">PowerFlex Diagnostic Lab</h3>
              <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded border border-[oklch(0.55_0.12_250/35%)] text-[oklch(0.60_0.10_250)]">
                Beta
              </span>
            </div>
            <p className="text-xs text-[oklch(0.50_0.008_250)]">
              PowerFlex 525 benchmark scaffold — fault display, parameters, status monitor, process scoring
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
                    ? "border-[oklch(0.55_0.12_250)] text-[oklch(0.75_0.12_250)] bg-[oklch(0.12_0.04_250)]"
                    : "border-[oklch(0.20_0.004_250)] text-[oklch(0.50_0.006_250)]"
                }`}
              >
                {m}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setReferenceOpen(true)}
              className="lab-mode-btn px-3 py-2 min-h-[2.75rem] text-xs font-mono rounded border border-[oklch(0.25_0.006_250)] text-[oklch(0.55_0.008_250)] inline-flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3" />
              Reference
            </button>
            {activeFault === "normal" && (
              <button
                type="button"
                onClick={() => setDriveRunning((r) => !r)}
                className={`lab-mode-btn px-3 py-2 min-h-[2.75rem] text-xs font-mono rounded border ${
                  driveRunning
                    ? "border-[oklch(0.55_0.12_250)] text-[oklch(0.55_0.12_250)]"
                    : "border-[oklch(0.25_0.004_250)] text-[oklch(0.50_0.006_250)]"
                }`}
              >
                {driveRunning ? "■ STOP" : "▶ START"}
              </button>
            )}
          </div>
        </div>

        {mode === "guided" && !debriefOpen && (
          <div className="mb-4">
            <PowerFlexGuidedPanel
              currentStep={guidedStep}
              onAdvance={() => setGuidedStep((s) => s + 1)}
              onRecordStep={(step) => setRecordedFirstStep((prev) => prev ?? step)}
              showHint={showHint}
              onToggleHint={() => {
                setShowHint((h) => !h);
                if (!showHint) setHintsUsed((n) => n + 1);
              }}
            />
          </div>
        )}

        {mode !== "practice" || !debriefOpen ? (
          <div className="mb-4">
            <PowerFlexFaultInjector
              mode={mode}
              activeFault={activeFault}
              faultScope={faultScope}
              onSelectFault={handleSelectFault}
              onRandomFault={handleRandomFault}
            />
          </div>
        ) : null}

        <div className="hidden xl:grid xl:grid-cols-3 gap-3 min-h-[420px]">
          <div className="powerflex-lab-panel-wrap rounded-lg border border-[oklch(0.14_0.004_250)] overflow-hidden">
            <PowerFlexDrivePanel
              telemetry={telemetry}
              activeFault={activeFault}
              symptom={symptomText}
              operatorReport={operatorReport}
              onViewFaultHistory={() => {
                setEvents((prev) => logFaultHistoryReview(prev));
                appendEvent({
                  id: `fd-${Date.now()}`,
                  timestamp: Date.now(),
                  type: "observation",
                  description: "Read fault display / HIM",
                });
              }}
            />
          </div>
          <div className="powerflex-lab-panel-wrap rounded-lg border border-[oklch(0.14_0.004_250)] overflow-hidden">
            <PowerFlexParameterPanel
              parameters={parameters}
              onBrowse={() => setEvents((prev) => logParameterBrowse(prev))}
            />
          </div>
          <div className="powerflex-lab-panel-wrap rounded-lg border border-[oklch(0.14_0.004_250)] overflow-hidden">
            <PowerFlexStatusPanel
              telemetry={telemetry}
              faultLog={faultLog}
              discoveredEvidence={discoveredEvidence}
              elapsedSec={elapsedSec}
              onReviewStatus={() => setEvents((prev) => logStatusReview(prev))}
              onReviewHistory={() => setEvents((prev) => logFaultHistoryReview(prev))}
            />
          </div>
        </div>

        <div className="xl:hidden powerflex-lab-mobile">
          <div className="flex gap-1 overflow-x-auto mb-3 pb-1 scrollbar-hide">
            {mobileTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMobilePanel(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono whitespace-nowrap shrink-0 min-h-[2.75rem] ${
                    mobilePanel === tab.id
                      ? "bg-[oklch(0.55_0.12_250/15%)] text-[oklch(0.75_0.12_250)] border border-[oklch(0.55_0.12_250/30%)]"
                      : "text-[oklch(0.55_0.008_250)] border border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="powerflex-lab-panel-wrap rounded-lg border border-[oklch(0.14_0.004_250)] overflow-hidden min-h-[360px]">
            {mobilePanel === "drive" && (
              <PowerFlexDrivePanel
                telemetry={telemetry}
                activeFault={activeFault}
                symptom={symptomText}
                operatorReport={operatorReport}
                onViewFaultHistory={() => setEvents((prev) => logFaultHistoryReview(prev))}
              />
            )}
            {mobilePanel === "parameters" && (
              <PowerFlexParameterPanel parameters={parameters} onBrowse={() => setEvents((prev) => logParameterBrowse(prev))} />
            )}
            {mobilePanel === "status" && (
              <PowerFlexStatusPanel
                telemetry={telemetry}
                faultLog={faultLog}
                discoveredEvidence={discoveredEvidence}
                elapsedSec={elapsedSec}
                onReviewStatus={() => setEvents((prev) => logStatusReview(prev))}
                onReviewHistory={() => setEvents((prev) => logFaultHistoryReview(prev))}
              />
            )}
            {mobilePanel === "actions" && (
              <div className="p-4 space-y-4">
                <PowerFlexFaultInjector
                  mode={mode}
                  activeFault={activeFault}
                  faultScope={faultScope}
                  onSelectFault={handleSelectFault}
                  onRandomFault={handleRandomFault}
                />
                {activeFault !== "normal" && !debriefOpen && diagnosisForm}
              </div>
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
            <PowerFlexDebrief
              fault={faultDef}
              score={submittedScore}
              onRetry={() => resetLab(activeFault, mode)}
              onNextFault={() => {
                if (mode === "practice" || mode === "guided") resetLab("normal", mode);
                else handleRandomFault();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
