/**
 * Workstation Prototype — Technician Troubleshooting Workstation
 *
 * Layout:
 *   Desktop: LEFT (Machine View) | CENTER (Print/Schematic) | RIGHT (Diagnostic Bench) + BOTTOM DRAWER
 *   Mobile: Tabbed (Machine | Print | Meter | Diagnosis | Closeout) + persistent context bar
 *
 * Scenario-driven: adapts to any configured fault via workstationScenarios.ts
 * Does NOT alter the fault engine, Assessment Spine, scoring, or evidence model.
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Shield, ChevronUp, ChevronDown, CheckCircle2, XCircle, Cpu, AlertTriangle, Eye, EyeOff,
  Clock, MessageSquare, Star,
} from "lucide-react";
import { CONVEYOR_RUNGS, createInitialPlcState } from "@/lib/conveyorLab/conveyorProgram";
import { runScanCycle } from "@/lib/conveyorLab/plcScanEngine";
import { createNormalFieldState, fieldStateToPlcInputs, type FieldDeviceState } from "@/lib/conveyorLab/fieldDeviceModel";
import { injectFault } from "@/lib/conveyorLab/faultInjectionEngine";
import { deriveMachineTwin } from "@/lib/conveyorLab/machineTwinModel";
import { getFaultById } from "@/lib/conveyorLab/faultCatalog";
import { computeMeterReading } from "@/components/interactive/conveyorLab/ConveyorDiagnosticsPanel";
import type { PlcState, MachineState, MeterProbeId, MeterMode } from "@/lib/conveyorLab/types";
import {
  getScenario, SCENARIO_IDS,
  type WorkstationScenario, type Hypothesis, type HypothesisStatus, type PlcIoLiveState,
} from "@/lib/workstationScenarios";

// ─── Constants ──────────────────────────────────────────────────────────────
const SCAN_MS = 100;

type MobileTab = "machine" | "print" | "meter" | "diagnosis" | "closeout" | "replay";

interface TestRecord {
  id: string;
  probe: MeterProbeId;
  probeLabel: string;
  mode: MeterMode;
  reading: string;
  timestamp: number;
  interpretation: string;
}

// Probe definitions for meter lead placement
const PROBE_DEFS: { id: MeterProbeId; component: string; terminals: string; label: string }[] = [
  { id: "estop_nc", component: "ES1", terminals: "NC contacts", label: "E-Stop NC" },
  { id: "guard_nc", component: "GS1", terminals: "NC contacts", label: "Guard Switch NC" },
  { id: "stop_nc", component: "PB1", terminals: "NC contacts", label: "Stop PB NC" },
  { id: "overload_nc", component: "OL1", terminals: "95–96", label: "Overload NC" },
  { id: "photoeye_signal", component: "PE1", terminals: "signal", label: "Photoeye Signal" },
  { id: "motor_coil", component: "K1", terminals: "A1–A2", label: "Contactor Coil K1" },
  { id: "contactor_aux", component: "K1", terminals: "13–14", label: "Contactor Aux K1" },
  { id: "output_terminal", component: "PLC", terminals: "O:2/0 terminal", label: "PLC Output Terminal" },
];

// Address labels for PLC elements
const INPUT_LABELS: Record<string, string> = {
  "I:1/0": "STOP", "I:1/1": "START", "I:1/2": "ES", "I:1/3": "GS",
  "I:1/4": "OL", "I:1/5": "PE", "O:2/0": "MTR", "O:2/1": "GRN", "O:2/2": "RED",
  "B3:0/0": "RUN", "B3:0/1": "SAFE",
};

// Component-to-address mapping for cross-highlighting
const COMPONENT_TO_ADDRESS: Record<string, string[]> = {
  "ES1": ["I:1/2"], "GS1": ["I:1/3"], "PB1": ["I:1/1"], "PB2": ["I:1/0"],
  "OL1": ["I:1/4"], "PE1": ["I:1/5"], "M1": ["O:2/0"], "K1": ["O:2/0"],
};

// ─── Component: Machine View (LEFT) ────────────────────────────────────────
function MachineViewPanel({
  machine, selectedComponent, onSelectComponent, scenario,
}: {
  machine: MachineState;
  selectedComponent: string | null;
  onSelectComponent: (id: string) => void;
  scenario: WorkstationScenario;
}) {
  const devices = [
    { id: "M1", label: "Motor", status: machine.beltRunning ? "RUNNING" : "STOPPED", color: machine.beltRunning ? "emerald" : "red" },
    { id: "K1", label: "Contactor", status: machine.contactorPulled ? "PULLED IN" : "DROPPED OUT", color: machine.contactorPulled ? "emerald" : "amber" },
    { id: "OL1", label: "Overload Relay", status: machine.overloadTripped ? "TRIPPED" : "OK", color: machine.overloadTripped ? "red" : "emerald" },
    { id: "ES1", label: "E-Stop", status: machine.estopPressed ? "PRESSED" : "RELEASED", color: machine.estopPressed ? "red" : "emerald" },
    { id: "GS1", label: "Guard Switch", status: machine.guardOpen ? "OPEN" : "CLOSED", color: machine.guardOpen ? "red" : "emerald" },
    { id: "PB2", label: "Stop Button", status: "READY", color: "zinc" },
    { id: "PB1", label: "Start Button", status: "READY", color: "zinc" },
    { id: "PE1", label: "Photoeye", status: machine.photoeyeBlocked ? "BLOCKED" : "CLEAR", color: machine.photoeyeBlocked ? "amber" : "emerald" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-zinc-700/50 flex items-center gap-2">
        <Cpu className="w-4 h-4 text-sky-400" />
        <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Machine View</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {devices.map((d) => (
          <button
            key={d.id}
            onClick={() => onSelectComponent(d.id)}
            className={`w-full text-left px-2.5 py-2 rounded-md border transition-all ${
              selectedComponent === d.id
                ? "border-sky-500/50 bg-sky-950/20 ring-1 ring-sky-500/20"
                : "border-zinc-700/30 bg-zinc-800/20 hover:border-zinc-600/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold text-zinc-300">{d.id}</span>
              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                d.color === "emerald" ? "bg-emerald-900/40 text-emerald-400" :
                d.color === "red" ? "bg-red-900/40 text-red-400" :
                d.color === "amber" ? "bg-amber-900/40 text-amber-400" :
                "bg-zinc-800/40 text-zinc-400"
              }`}>
                {d.status}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5">{d.label}</p>
          </button>
        ))}
      </div>
      {/* Indicators */}
      <div className="px-3 py-2 border-t border-zinc-700/50 flex gap-2">
        <div className={`flex items-center gap-1 text-[9px] ${machine.greenLight ? "text-emerald-400" : "text-zinc-600"}`}>
          <div className={`w-2.5 h-2.5 rounded-full ${machine.greenLight ? "bg-emerald-500" : "bg-zinc-700"}`} />
          RUN
        </div>
        <div className={`flex items-center gap-1 text-[9px] ${machine.redLight ? "text-red-400" : "text-zinc-600"}`}>
          <div className={`w-2.5 h-2.5 rounded-full ${machine.redLight ? "bg-red-500" : "bg-zinc-700"}`} />
          FAULT
        </div>
        <div className="ml-auto text-[9px] text-zinc-500">{machine.fpm} FPM</div>
      </div>
    </div>
  );
}

// ─── Component: Print Panel (CENTER) ────────────────────────────────────────
function PrintPanel({
  plc, selectedComponent, onSelectComponent, highlightedRung,
}: {
  plc: PlcState;
  selectedComponent: string | null;
  onSelectComponent: (id: string) => void;
  highlightedRung: string | null;
}) {
  const highlightedAddresses = useMemo(() => {
    if (!selectedComponent) return [];
    return COMPONENT_TO_ADDRESS[selectedComponent] || [];
  }, [selectedComponent]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-zinc-700/50">
        <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">PLC Ladder Logic</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {CONVEYOR_RUNGS.map((rung) => {
          const isHighlighted = highlightedRung === rung.id;
          const hasHighlightedElement = rung.elements.some((e) => highlightedAddresses.includes(e.address)) ||
            (rung.output && highlightedAddresses.includes(rung.output.address));

          return (
            <div
              key={rung.id}
              className={`px-2.5 py-2 rounded-md border transition-all ${
                isHighlighted || hasHighlightedElement
                  ? "border-sky-500/50 bg-sky-950/20 ring-1 ring-sky-500/20"
                  : "border-zinc-700/30 bg-zinc-800/20"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold text-zinc-400">{rung.id}</span>
                <span className="text-[9px] text-zinc-600">{rung.description}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {rung.elements.map((el, i) => {
                  const isActive = plc.inputs[el.address] ?? plc.internals[el.address] ?? false;
                  const isElementHighlighted = highlightedAddresses.includes(el.address);
                  const componentId = Object.entries(COMPONENT_TO_ADDRESS).find(
                    ([, addrs]) => addrs.includes(el.address)
                  )?.[0];

                  return (
                    <button
                      key={i}
                      onClick={() => componentId && onSelectComponent(componentId)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono border transition-all ${
                        isElementHighlighted
                          ? "border-sky-400/60 bg-sky-900/30 text-sky-300"
                          : isActive
                          ? "border-emerald-700/40 bg-emerald-950/20 text-emerald-400"
                          : "border-zinc-700/30 bg-zinc-800/30 text-zinc-500"
                      } ${componentId ? "cursor-pointer hover:border-zinc-500" : "cursor-default"}`}
                    >
                      <span className="opacity-60">{el.type === "XIC" ? "─┤ " : "─┤/"}</span>
                      {INPUT_LABELS[el.address] || el.address}
                      <span className="opacity-60">{" ├─"}</span>
                      {isActive && <span className="ml-1 text-emerald-400">●</span>}
                    </button>
                  );
                })}
                {rung.output && (
                  <button
                    onClick={() => {
                      const componentId = Object.entries(COMPONENT_TO_ADDRESS).find(
                        ([, addrs]) => addrs.includes(rung.output!.address)
                      )?.[0];
                      if (componentId) onSelectComponent(componentId);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono border transition-all ${
                      highlightedAddresses.includes(rung.output.address)
                        ? "border-sky-400/60 bg-sky-900/30 text-sky-300"
                        : (plc.outputs[rung.output.address] ?? false)
                        ? "border-emerald-700/40 bg-emerald-950/20 text-emerald-400"
                        : "border-zinc-700/30 bg-zinc-800/30 text-zinc-500"
                    } cursor-pointer hover:border-zinc-500`}
                  >
                    <span className="opacity-60">─( </span>
                    {INPUT_LABELS[rung.output.address] || rung.output.address}
                    <span className="opacity-60"> )─</span>
                    {(plc.outputs[rung.output.address] ?? false) && <span className="ml-1 text-emerald-400">●</span>}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Component: PLC I/O Status Sub-Panel ────────────────────────────────────
function PlcIoStatusPanel({
  ioState, config,
}: {
  ioState: PlcIoLiveState;
  config: WorkstationScenario["plcIoConfig"];
}) {
  const rows = [
    { label: "Logic Command", value: ioState.logicCommand, source: ioState.statusSources.logicCommand, color: ioState.logicCommand === "ON" ? "emerald" : "zinc" },
    { label: "Output Instruction", value: ioState.outputInstructionState, source: ioState.statusSources.outputInstruction, color: ioState.outputInstructionState === "TRUE" ? "emerald" : "zinc" },
    { label: "Output Channel", value: ioState.outputChannelIndicator, source: ioState.statusSources.outputChannel, color: ioState.outputChannelIndicator === "ON" ? "emerald" : "zinc" },
    { label: "Field Power", value: ioState.fieldPowerPresent, source: ioState.statusSources.fieldPower, color: ioState.fieldPowerPresent === "YES" ? "emerald" : ioState.fieldPowerPresent === "NO" ? "red" : "amber" },
    { label: "Output Voltage", value: ioState.measuredOutputVoltage, source: ioState.statusSources.outputVoltage, color: ioState.measuredOutputVoltage === "NOT VERIFIED" ? "amber" : "sky" },
  ];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">PLC I/O Status</h4>
        <span className="text-[9px] font-mono text-zinc-600">{config.outputLabel}</span>
      </div>

      {/* Status Rows */}
      <div className="space-y-0.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-2 py-1 rounded border border-zinc-700/20 bg-zinc-800/20">
            <span className="text-[9px] text-zinc-500">{row.label}</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-mono font-semibold ${
                row.color === "emerald" ? "text-emerald-400" :
                row.color === "red" ? "text-red-400" :
                row.color === "amber" ? "text-amber-400" :
                row.color === "sky" ? "text-sky-300" :
                "text-zinc-400"
              }`}>
                {row.value}
              </span>
              <span className={`text-[8px] px-1 py-0.5 rounded ${
                row.source === "software state" ? "bg-blue-900/30 text-blue-400" :
                row.source === "visual indicator" ? "bg-purple-900/30 text-purple-400" :
                row.source === "measured value" ? "bg-emerald-900/30 text-emerald-400" :
                "bg-amber-900/30 text-amber-400"
              }`}>
                {row.source}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Wire/Terminal Info */}
      <div className="flex gap-2 px-2 text-[9px] text-zinc-600">
        <span>Wire: <span className="text-zinc-400 font-mono">{config.wireNumber}</span></span>
        <span>Terminal: <span className="text-zinc-400 font-mono">{config.terminal}</span></span>
        <span>Expected: <span className="text-zinc-400 font-mono">{config.expectedVoltage}</span></span>
      </div>

      {/* Teaching Message */}
      <div className="px-2 py-1.5 rounded border border-amber-700/30 bg-amber-950/10">
        <div className="flex items-start gap-1.5">
          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[9px] text-amber-400/90 leading-relaxed">{config.teachingMessage}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Component: Zone-Grouped Hypotheses ─────────────────────────────────────
function HypothesesZonePanel({
  hypotheses, zones, onUpdateHypothesis, onAddHypothesis, compact = false, initialOnly = false, mobileInitialIds,
}: {
  hypotheses: Hypothesis[];
  zones: WorkstationScenario["zones"];
  onUpdateHypothesis: (id: string, status: HypothesisStatus) => void;
  onAddHypothesis: (text: string, zone: string) => void;
  compact?: boolean;
  initialOnly?: boolean;
  mobileInitialIds?: string[];
}) {
  const [showAll, setShowAll] = useState(false);
  const [newHypothesis, setNewHypothesis] = useState("");

  const displayHypotheses = initialOnly && !showAll && mobileInitialIds
    ? hypotheses.filter((h) => mobileInitialIds.includes(h.id))
    : hypotheses;

  const statusColors: Record<HypothesisStatus, string> = {
    untested: "border-zinc-600",
    supported: "border-emerald-500 bg-emerald-900/20",
    weakened: "border-amber-500 bg-amber-900/20",
    eliminated: "border-red-500/50",
    confirmed: "border-emerald-400",
  };

  const statusIcons: Record<HypothesisStatus, React.ReactNode> = {
    untested: <div className="w-3.5 h-3.5 rounded-full border border-zinc-600" />,
    supported: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 opacity-60" />,
    weakened: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
    eliminated: <XCircle className="w-3.5 h-3.5 text-red-400" />,
    confirmed: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  };

  const cycleStatus = (current: HypothesisStatus): HypothesisStatus => {
    const cycle: HypothesisStatus[] = ["untested", "supported", "weakened", "eliminated", "confirmed"];
    const idx = cycle.indexOf(current);
    return cycle[(idx + 1) % cycle.length];
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Hypotheses</h4>
        {initialOnly && mobileInitialIds && hypotheses.length > mobileInitialIds.length && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1 text-[9px] text-sky-400 hover:text-sky-300"
          >
            {showAll ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showAll ? "Show fewer" : `Show all ${hypotheses.length}`}
          </button>
        )}
      </div>

      {zones.map((zone) => {
        const zoneHypotheses = displayHypotheses.filter((h) => h.zone === zone.id);
        if (zoneHypotheses.length === 0) return null;

        return (
          <div key={zone.id} className="space-y-1">
            <div className="flex items-center gap-1.5 px-1">
              <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">{zone.label}</span>
            </div>
            {zoneHypotheses.map((h) => (
              <div
                key={h.id}
                className={`flex items-center gap-1.5 px-2 py-1 rounded border ${statusColors[h.status]} bg-zinc-800/20`}
              >
                <button onClick={() => onUpdateHypothesis(h.id, cycleStatus(h.status))} className="shrink-0">
                  {statusIcons[h.status]}
                </button>
                <span className={`${compact ? "text-[9px]" : "text-[10px]"} flex-1 ${
                  h.status === "eliminated" ? "line-through text-zinc-600" : "text-zinc-300"
                }`}>
                  {h.text}
                </span>
                <span className={`text-[8px] px-1 py-0.5 rounded ${
                  h.status === "untested" ? "bg-zinc-800 text-zinc-500" :
                  h.status === "supported" ? "bg-emerald-900/30 text-emerald-400" :
                  h.status === "weakened" ? "bg-amber-900/30 text-amber-400" :
                  h.status === "eliminated" ? "bg-red-900/30 text-red-400" :
                  "bg-emerald-900/50 text-emerald-300"
                }`}>
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        );
      })}

      {/* Add Hypothesis */}
      {!compact && (
        <div className="flex gap-1 mt-1">
          <input
            type="text"
            value={newHypothesis}
            onChange={(e) => setNewHypothesis(e.target.value)}
            placeholder="Add hypothesis..."
            className="flex-1 text-[10px] px-2 py-1 rounded border border-zinc-700 bg-zinc-800/50 text-zinc-300 placeholder:text-zinc-600"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newHypothesis.trim()) {
                onAddHypothesis(newHypothesis.trim(), zones[0]?.id || "");
                setNewHypothesis("");
              }
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            className="text-[10px] px-2 h-6"
            onClick={() => {
              if (newHypothesis.trim()) {
                onAddHypothesis(newHypothesis.trim(), zones[0]?.id || "");
                setNewHypothesis("");
              }
            }}
          >
            +
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Component: Diagnostic Bench (RIGHT) ────────────────────────────────────
function DiagnosticBenchPanel({
  plc, machine, tests, hypotheses, selectedProbe, meterMode, lastReading, safetyOk, ioState, scenario,
  onSelectProbe, onSetMeterMode, onTakeReading, onAddHypothesis, onUpdateHypothesis, onRecordInterpretation,
}: {
  plc: PlcState;
  machine: MachineState;
  tests: TestRecord[];
  hypotheses: Hypothesis[];
  selectedProbe: MeterProbeId;
  meterMode: MeterMode;
  lastReading: string | null;
  safetyOk: boolean;
  ioState: PlcIoLiveState;
  scenario: WorkstationScenario;
  onSelectProbe: (id: MeterProbeId) => void;
  onSetMeterMode: (mode: MeterMode) => void;
  onTakeReading: () => void;
  onAddHypothesis: (text: string, zone: string) => void;
  onUpdateHypothesis: (id: string, status: HypothesisStatus) => void;
  onRecordInterpretation: (testId: string, text: string) => void;
}) {
  const [interpretingId, setInterpretingId] = useState<string | null>(null);
  const [interpretationText, setInterpretationText] = useState("");

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-zinc-700/50 flex items-center gap-2">
        <Shield className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Diagnostic Bench</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Safety Status */}
        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border ${
          safetyOk ? "border-emerald-700/40 bg-emerald-950/20" : "border-red-700/40 bg-red-950/20"
        }`}>
          <div className={`w-2 h-2 rounded-full ${safetyOk ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`} />
          <span className={`text-[10px] font-medium ${safetyOk ? "text-emerald-400" : "text-red-400"}`}>
            {safetyOk ? "LOTO VERIFIED — Safe to test" : "SAFETY CONCERN"}
          </span>
        </div>

        {/* PLC I/O Status Sub-Panel */}
        <PlcIoStatusPanel ioState={ioState} config={scenario.plcIoConfig} />

        {/* Multimeter Section */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Multimeter</h4>
          <div className="flex gap-1">
            {(["voltage", "continuity"] as MeterMode[]).map((m) => (
              <button
                key={m}
                onClick={() => onSetMeterMode(m)}
                className={`flex-1 text-[10px] py-1.5 rounded border font-medium transition-all ${
                  meterMode === m
                    ? "border-sky-500/50 bg-sky-950/40 text-sky-300"
                    : "border-zinc-700/50 bg-zinc-800/30 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {m === "voltage" ? "V DC" : "Ω CONT"}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-500">Lead Placement:</p>
            <div className="grid grid-cols-1 gap-1 max-h-[120px] overflow-y-auto">
              {PROBE_DEFS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectProbe(p.id)}
                  className={`text-left px-2 py-1.5 rounded border text-[10px] transition-all ${
                    selectedProbe === p.id
                      ? "border-amber-500/50 bg-amber-950/30 text-amber-300"
                      : "border-zinc-700/40 bg-zinc-800/20 text-zinc-400 hover:text-zinc-300 hover:border-zinc-600/50"
                  }`}
                >
                  <span className="font-mono font-semibold">{p.component}</span>
                  <span className="mx-1 opacity-50">—</span>
                  <span>{p.terminals}</span>
                </button>
              ))}
            </div>
          </div>
          <Button
            size="sm"
            onClick={onTakeReading}
            className="w-full bg-amber-600 hover:bg-amber-500 text-black font-semibold text-xs"
          >
            Take Reading
          </Button>
          {lastReading && (
            <div className="px-2.5 py-2 rounded-md border border-amber-700/40 bg-amber-950/20">
              <p className="text-[10px] text-zinc-500">Reading:</p>
              <p className="text-sm font-mono font-bold text-amber-300 mt-0.5">{lastReading}</p>
            </div>
          )}
        </div>

        {/* Test History */}
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Test History ({tests.length})
          </h4>
          <div className="max-h-[100px] overflow-y-auto space-y-1">
            {tests.length === 0 && (
              <p className="text-[10px] text-zinc-600 italic">No measurements taken yet</p>
            )}
            {tests.map((t) => (
              <div key={t.id} className="px-2 py-1.5 rounded border border-zinc-700/30 bg-zinc-800/20">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-400">{t.probeLabel}</span>
                  <span className="text-[9px] text-zinc-600">{t.mode}</span>
                </div>
                <p className="text-[10px] font-mono text-amber-300 mt-0.5">{t.reading}</p>
                {t.interpretation ? (
                  <p className="text-[9px] text-emerald-400/80 mt-0.5 italic">{t.interpretation}</p>
                ) : (
                  <button
                    onClick={() => { setInterpretingId(t.id); setInterpretationText(""); }}
                    className="text-[9px] text-sky-400/70 hover:text-sky-300 mt-0.5 underline"
                  >
                    Record interpretation
                  </button>
                )}
              </div>
            ))}
          </div>
          {interpretingId && (
            <div className="flex gap-1">
              <input
                type="text"
                value={interpretationText}
                onChange={(e) => setInterpretationText(e.target.value)}
                placeholder="What does this verify or eliminate?"
                className="flex-1 text-[10px] px-2 py-1 rounded border border-zinc-700 bg-zinc-800/50 text-zinc-300 placeholder:text-zinc-600"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && interpretationText.trim()) {
                    onRecordInterpretation(interpretingId, interpretationText.trim());
                    setInterpretingId(null);
                  }
                }}
              />
              <Button
                size="sm"
                variant="ghost"
                className="text-[10px] px-2 h-6"
                onClick={() => {
                  if (interpretationText.trim()) {
                    onRecordInterpretation(interpretingId, interpretationText.trim());
                  }
                  setInterpretingId(null);
                }}
              >
                Save
              </Button>
            </div>
          )}
        </div>

        {/* Zone-Grouped Hypotheses */}
        <HypothesesZonePanel
          hypotheses={hypotheses}
          zones={scenario.zones}
          onUpdateHypothesis={onUpdateHypothesis}
          onAddHypothesis={onAddHypothesis}
        />
      </div>
    </div>
  );
}

// ─── Component: Bottom Drawer ───────────────────────────────────────────────
function BottomDrawer({
  tests, hypotheses, machine, scenario,
}: {
  tests: TestRecord[];
  hypotheses: Hypothesis[];
  machine: MachineState;
  scenario: WorkstationScenario;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"operator" | "closeout" | "methodology" | "replay" | "feedback">("operator");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackDifficulty, setFeedbackDifficulty] = useState<number>(0);
  const [feedbackHardestZone, setFeedbackHardestZone] = useState<string>("");
  const [feedbackConfusing, setFeedbackConfusing] = useState("");
  const [feedbackWouldHelp, setFeedbackWouldHelp] = useState("");

  const confirmedHypotheses = hypotheses.filter((h) => h.status === "confirmed");
  const fault = getFaultById(scenario.faultId);
  const faultCleared = scenario.isFaultCleared(machine);

  return (
    <div className={`border-t border-zinc-700/50 bg-zinc-900/95 backdrop-blur-sm transition-all ${isOpen ? "h-[280px]" : "h-10"}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 flex items-center justify-between px-4 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            {activeTab === "operator" ? "Operator Conversation" : activeTab === "closeout" ? "Work-Order Closeout" : activeTab === "methodology" ? "Methodology Summary" : activeTab === "replay" ? "Diagnostic Replay" : "Feedback"}
          </span>
          {confirmedHypotheses.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-400 font-medium">
              {confirmedHypotheses.length} confirmed
            </span>
          )}
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronUp className="w-4 h-4 text-zinc-500" />}
      </button>

      {isOpen && (
        <div className="h-[240px] flex flex-col">
          <div className="flex border-b border-zinc-700/30 px-3">
            {(["operator", "closeout", "methodology", "replay", "feedback"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-[10px] font-medium border-b-2 transition-all ${
                  activeTab === tab
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab === "operator" ? "Operator" : tab === "closeout" ? "Closeout" : tab === "methodology" ? "Methodology" : tab === "replay" ? "Replay" : "Feedback"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 text-[10px]">
            {activeTab === "operator" && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="text-amber-400 font-semibold shrink-0">Operator:</span>
                  <span className="text-zinc-300 italic">"{fault?.operatorReport}"</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-sky-400 font-semibold shrink-0">Symptom:</span>
                  <span className="text-zinc-300">{fault?.symptom}</span>
                </div>
                <div className="mt-2 px-2 py-1.5 rounded border border-zinc-700/30 bg-zinc-800/20">
                  <p className="text-[9px] text-zinc-500 italic">Static operator — AI conversation not yet connected.</p>
                </div>
              </div>
            )}

            {activeTab === "closeout" && (
              <div className="space-y-2">
                <p className="text-zinc-400">Work-order closeout fields:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="px-2 py-1.5 rounded border border-zinc-700/30">
                    <p className="text-zinc-500">Root Cause</p>
                    <p className="text-zinc-300">{confirmedHypotheses[0]?.text || "Not yet confirmed"}</p>
                  </div>
                  <div className="px-2 py-1.5 rounded border border-zinc-700/30">
                    <p className="text-zinc-500">Corrective Action</p>
                    <p className="text-zinc-300">{faultCleared ? scenario.closeoutResolvedText : scenario.closeoutPendingText}</p>
                  </div>
                  <div className="px-2 py-1.5 rounded border border-zinc-700/30">
                    <p className="text-zinc-500">Tests Performed</p>
                    <p className="text-zinc-300">{tests.length} measurement(s)</p>
                  </div>
                  <div className="px-2 py-1.5 rounded border border-zinc-700/30">
                    <p className="text-zinc-500">Machine State</p>
                    <p className="text-zinc-300">{machine.beltRunning ? "Running — returned to production" : "Stopped — awaiting repair"}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "methodology" && (
              <div className="space-y-2">
                <p className="text-zinc-400">Evidence chain:</p>
                {tests.filter((t) => t.interpretation).map((t) => (
                  <div key={t.id} className="px-2 py-1 rounded border border-zinc-700/30">
                    <span className="font-mono text-amber-400">{t.probeLabel}:</span>{" "}
                    <span className="text-zinc-300">{t.reading}</span>{" "}
                    <span className="text-emerald-400">→ {t.interpretation}</span>
                  </div>
                ))}
                {tests.filter((t) => t.interpretation).length === 0 && (
                  <p className="text-zinc-600 italic">No interpreted evidence yet</p>
                )}
                <div className="mt-2 px-2 py-1.5 rounded border border-zinc-700/30">
                  <p className="text-zinc-500">Fault Model:</p>
                  <p className="text-zinc-300 text-[9px] leading-relaxed">{scenario.plcIoConfig.faultModelDescription}</p>
                </div>
              </div>
            )}

            {activeTab === "replay" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <p className="text-zinc-400 font-medium">Diagnostic Reasoning Replay</p>
                </div>
                {tests.length === 0 && (
                  <p className="text-zinc-600 italic">No measurements taken yet — take readings to build your replay timeline.</p>
                )}
                {tests.length > 0 && (
                  <div className="relative pl-4 border-l-2 border-zinc-700/50 space-y-2">
                    {tests.map((t, idx) => {
                      const elapsed = idx === 0 ? 0 : Math.round((t.timestamp - tests[0].timestamp) / 1000);
                      const mins = Math.floor(elapsed / 60);
                      const secs = elapsed % 60;
                      const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                      return (
                        <div key={t.id} className="relative">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-zinc-600 bg-zinc-900" />
                          <div className="px-2 py-1.5 rounded border border-zinc-700/30 bg-zinc-800/20">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[9px] text-zinc-500 font-mono">+{timeStr}</span>
                              <span className="text-[9px] px-1 py-0.5 rounded bg-zinc-700/40 text-zinc-400">{t.mode}</span>
                              <span className="font-mono text-amber-400 text-[10px]">{t.probeLabel}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-300">{t.reading}</span>
                              {t.interpretation && (
                                <span className="text-emerald-400 ml-1">→ {t.interpretation}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {/* Hypothesis status changes annotation */}
                    {hypotheses.filter((h) => h.status !== "untested").length > 0 && (
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-emerald-600 bg-emerald-900" />
                        <div className="px-2 py-1.5 rounded border border-emerald-700/30 bg-emerald-900/10">
                          <p className="text-[9px] text-emerald-400 font-medium mb-0.5">Hypothesis Updates</p>
                          {hypotheses.filter((h) => h.status !== "untested").map((h) => (
                            <div key={h.id} className="flex items-center gap-1 text-[9px]">
                              <span className={`px-1 py-0.5 rounded font-medium ${
                                h.status === "confirmed" ? "bg-emerald-900/50 text-emerald-400" :
                                h.status === "eliminated" ? "bg-red-900/50 text-red-400" :
                                h.status === "supported" ? "bg-sky-900/50 text-sky-400" :
                                "bg-amber-900/50 text-amber-400"
                              }`}>{h.status}</span>
                              <span className="text-zinc-400 truncate">{h.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Corrective action event */}
                    {faultCleared && (
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-emerald-500" />
                        <div className="px-2 py-1.5 rounded border border-emerald-600/40 bg-emerald-900/20">
                          <p className="text-emerald-400 font-medium">Corrective Action Applied — Fault Cleared</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "feedback" && (
              <div className="space-y-2">
                {feedbackSubmitted ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-2" />
                    <p className="text-emerald-400 font-medium">Thank you for your feedback!</p>
                    <p className="text-zinc-500 text-[9px] mt-1">Your input helps improve this training module.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                      <p className="text-zinc-400 font-medium">Technician Feedback</p>
                    </div>
                    {/* Difficulty Rating */}
                    <div>
                      <p className="text-zinc-500 mb-1">Overall difficulty:</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => setFeedbackDifficulty(n)}
                            className="p-0.5 transition-colors"
                          >
                            <Star className={`w-4 h-4 ${n <= feedbackDifficulty ? "fill-amber-400 text-amber-400" : "text-zinc-600"}`} />
                          </button>
                        ))}
                        <span className="text-[9px] text-zinc-500 ml-1 self-center">
                          {feedbackDifficulty === 0 ? "" : feedbackDifficulty <= 2 ? "Easy" : feedbackDifficulty === 3 ? "Moderate" : "Challenging"}
                        </span>
                      </div>
                    </div>
                    {/* Hardest Zone */}
                    <div>
                      <p className="text-zinc-500 mb-1">Which zone was hardest?</p>
                      <div className="flex gap-1 flex-wrap">
                        {scenario.zones.map((z) => (
                          <button
                            key={z.id}
                            onClick={() => setFeedbackHardestZone(z.id)}
                            className={`px-2 py-0.5 rounded text-[9px] font-medium border transition-all ${
                              feedbackHardestZone === z.id
                                ? "border-sky-500 bg-sky-900/30 text-sky-400"
                                : "border-zinc-700 bg-zinc-800/30 text-zinc-400 hover:border-zinc-500"
                            }`}
                          >
                            {z.label.replace(/ZONE \d+ — /, "")}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Most Confusing */}
                    <div>
                      <p className="text-zinc-500 mb-1">What was most confusing?</p>
                      <textarea
                        value={feedbackConfusing}
                        onChange={(e) => setFeedbackConfusing(e.target.value)}
                        rows={2}
                        className="w-full rounded border border-zinc-700 bg-zinc-800/50 p-1.5 text-[10px] text-zinc-300 placeholder:text-zinc-600 resize-none"
                        placeholder="e.g., distinguishing software state from field voltage..."
                      />
                    </div>
                    {/* What Would Help */}
                    <div>
                      <p className="text-zinc-500 mb-1">What would help most?</p>
                      <textarea
                        value={feedbackWouldHelp}
                        onChange={(e) => setFeedbackWouldHelp(e.target.value)}
                        rows={2}
                        className="w-full rounded border border-zinc-700 bg-zinc-800/50 p-1.5 text-[10px] text-zinc-300 placeholder:text-zinc-600 resize-none"
                        placeholder="e.g., more guided prompts, a wiring diagram overlay..."
                      />
                    </div>
                    {/* Submit */}
                    <button
                      onClick={() => setFeedbackSubmitted(true)}
                      disabled={feedbackDifficulty === 0}
                      className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-medium transition-colors"
                    >
                      Submit Feedback
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Component: Mobile Context Bar ──────────────────────────────────────────
function MobileContextBar({
  machine, selectedComponent, selectedProbe, lastReading, safetyOk, scenario,
}: {
  machine: MachineState;
  selectedComponent: string | null;
  selectedProbe: MeterProbeId;
  lastReading: string | null;
  safetyOk: boolean;
  scenario: WorkstationScenario;
}) {
  const probeDef = PROBE_DEFS.find((p) => p.id === selectedProbe);
  const faultCleared = scenario.isFaultCleared(machine);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/95 border-b border-zinc-700/50 overflow-x-auto">
      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap ${
        faultCleared ? "bg-emerald-900/40 text-emerald-400" : scenario.badgeColor
      }`}>
        {faultCleared ? "CLEARED" : scenario.badgeText}
      </span>
      {selectedComponent && (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-900/40 text-sky-400 font-mono whitespace-nowrap">
          {selectedComponent}
        </span>
      )}
      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400 font-mono whitespace-nowrap">
        {probeDef?.component} {probeDef?.terminals}
      </span>
      {lastReading && (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-amber-300 font-mono whitespace-nowrap">
          {lastReading}
        </span>
      )}
      <div className={`w-2 h-2 rounded-full shrink-0 ${safetyOk ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`} />
    </div>
  );
}

// ─── Main Workstation Prototype Component ─────────────────────────────────────
export default function WorkstationPrototype() {
  // ── Scenario Selection ──
  const [scenarioId, setScenarioId] = useState<string>("overload_tripped");
  const scenario = useMemo(() => getScenario(scenarioId), [scenarioId]);

  // ── State ──
  const [plc, setPlc] = useState<PlcState>(createInitialPlcState);
  const [field, setField] = useState<FieldDeviceState>(() =>
    injectFault({ faultId: scenario.faultId, productAtPhotoeye: false, field: createNormalFieldState() })
  );
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [highlightedRung, setHighlightedRung] = useState<string | null>(null);
  const [selectedProbe, setSelectedProbe] = useState<MeterProbeId>(scenario.defaultProbe);
  const [meterMode, setMeterMode] = useState<MeterMode>(scenario.defaultMode);
  const [lastReading, setLastReading] = useState<string | null>(null);
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>(
    scenario.initialHypotheses.map((h) => ({ ...h, status: "untested" as const }))
  );
  const [mobileTab, setMobileTab] = useState<MobileTab>("machine");
  const [safetyOk, setSafetyOk] = useState(true);
  const [unsafeAttempts, setUnsafeAttempts] = useState<string[]>([]);
  const [measuredOutputVoltage, setMeasuredOutputVoltage] = useState<string | null>(null);

  // ── Scenario Switch Handler ──
  const handleScenarioSwitch = useCallback((newId: string) => {
    const newScenario = getScenario(newId);
    setScenarioId(newId);
    setPlc(createInitialPlcState());
    setField(injectFault({ faultId: newScenario.faultId, productAtPhotoeye: false, field: createNormalFieldState() }));
    setSelectedComponent(null);
    setHighlightedRung(null);
    setSelectedProbe(newScenario.defaultProbe);
    setMeterMode(newScenario.defaultMode);
    setLastReading(null);
    setTests([]);
    setHypotheses(newScenario.initialHypotheses.map((h) => ({ ...h, status: "untested" as const })));
    setMobileTab("machine");
    setSafetyOk(true);
    setUnsafeAttempts([]);
    setMeasuredOutputVoltage(null);
  }, []);

  // ── PLC Scan Loop ──
  useEffect(() => {
    const interval = setInterval(() => {
      setPlc((prev) => {
        const inputs = fieldStateToPlcInputs(field, {});
        return runScanCycle({ ...prev, inputs });
      });
    }, SCAN_MS);
    return () => clearInterval(interval);
  }, [field]);

  // ── Derived Machine State ──
  const machine = useMemo(() => deriveMachineTwin(plc, field, scenario.faultId), [plc, field, scenario.faultId]);
  const faultCleared = scenario.isFaultCleared(machine);

  // ── PLC I/O Live State ──
  const ioState = useMemo(() => scenario.derivePlcIoState(plc, machine, measuredOutputVoltage), [plc, machine, measuredOutputVoltage, scenario]);

  // ── Cross-highlight: component → rung ──
  useEffect(() => {
    if (!selectedComponent) {
      setHighlightedRung(null);
      return;
    }
    const addrs = COMPONENT_TO_ADDRESS[selectedComponent] || [];
    const rung = CONVEYOR_RUNGS.find((r) =>
      r.elements.some((e) => addrs.includes(e.address)) ||
      (r.output && addrs.includes(r.output.address))
    );
    setHighlightedRung(rung?.id || null);
  }, [selectedComponent]);

  // ── Handlers ──
  const handleSelectComponent = useCallback((id: string) => {
    setSelectedComponent((prev) => (prev === id ? null : id));
  }, []);

  const handleTakeReading = useCallback(() => {
    for (const rule of scenario.unsafeWhenEnergized) {
      if (selectedProbe === rule.probe && rule.condition(machine)) {
        setSafetyOk(false);
        setUnsafeAttempts((prev) => [...prev, rule.message]);
        return;
      }
    }

    const reading = computeMeterReading(selectedProbe, meterMode, plc, machine.mechanicalFault);
    setLastReading(reading);

    // Update measured output voltage if this probe is the output terminal probe
    if (selectedProbe === "output_terminal" && meterMode === "voltage") {
      setMeasuredOutputVoltage(reading);
    }

    const probeDef = PROBE_DEFS.find((p) => p.id === selectedProbe);
    const newTest: TestRecord = {
      id: `test-${Date.now()}`,
      probe: selectedProbe,
      probeLabel: probeDef?.label || selectedProbe,
      mode: meterMode,
      reading,
      timestamp: Date.now(),
      interpretation: "",
    };
    setTests((prev) => [...prev, newTest]);
  }, [selectedProbe, meterMode, plc, machine, scenario]);

  const handleAddHypothesis = useCallback((text: string, zone: string) => {
    setHypotheses((prev) => [...prev, { id: `h-${Date.now()}`, text, status: "untested", zone }]);
  }, []);

  const handleUpdateHypothesis = useCallback((id: string, status: HypothesisStatus) => {
    setHypotheses((prev) => prev.map((h) => (h.id === id ? { ...h, status } : h)));
  }, []);

  const handleRecordInterpretation = useCallback((testId: string, text: string) => {
    setTests((prev) => prev.map((t) => (t.id === testId ? { ...t, interpretation: text } : t)));
  }, []);

  const handleCorrectiveAction = useCallback(() => {
    if (scenario.faultId === "overload_tripped") {
      setField((prev) => ({ ...prev, overloadNcClosed: true }));
    } else if (scenario.faultId === "output_on_motor_dead") {
      setField((prev) => ({ ...prev, motorMechanicalOk: true }));
    }
  }, [scenario.faultId]);

  // ── Mobile Tab Content ──
  const renderMobileContent = () => {
    switch (mobileTab) {
      case "machine":
        return <MachineViewPanel machine={machine} selectedComponent={selectedComponent} onSelectComponent={handleSelectComponent} scenario={scenario} />;
      case "print":
        return <PrintPanel plc={plc} selectedComponent={selectedComponent} onSelectComponent={handleSelectComponent} highlightedRung={highlightedRung} />;
      case "meter":
        return (
          <DiagnosticBenchPanel
            plc={plc}
            machine={machine}
            tests={tests}
            hypotheses={hypotheses}
            selectedProbe={selectedProbe}
            meterMode={meterMode}
            lastReading={lastReading}
            safetyOk={safetyOk}
            ioState={ioState}
            scenario={scenario}
            onSelectProbe={setSelectedProbe}
            onSetMeterMode={setMeterMode}
            onTakeReading={handleTakeReading}
            onAddHypothesis={handleAddHypothesis}
            onUpdateHypothesis={handleUpdateHypothesis}
            onRecordInterpretation={handleRecordInterpretation}
          />
        );
      case "diagnosis":
        return (
          <div className="flex flex-col h-full p-3 space-y-3 overflow-y-auto">
            <h3 className="text-sm font-semibold text-zinc-200">Diagnosis</h3>

            {/* PLC I/O Status (compact on mobile) */}
            <PlcIoStatusPanel ioState={ioState} config={scenario.plcIoConfig} />

            {/* Zone-Grouped Hypotheses with progressive disclosure */}
            <HypothesesZonePanel
              hypotheses={hypotheses}
              zones={scenario.zones}
              onUpdateHypothesis={handleUpdateHypothesis}
              onAddHypothesis={handleAddHypothesis}
              compact
              initialOnly
              mobileInitialIds={scenario.mobileInitialHypotheses}
            />

            {/* Evidence */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-semibold text-zinc-400 uppercase">Evidence</h4>
              {tests.filter((t) => t.interpretation).map((t) => (
                <div key={t.id} className="px-2 py-1 rounded border border-zinc-700/30 text-[10px]">
                  <span className="font-mono text-amber-400">{t.probeLabel}:</span> {t.reading} → <span className="text-emerald-400">{t.interpretation}</span>
                </div>
              ))}
              {tests.filter((t) => t.interpretation).length === 0 && (
                <p className="text-[10px] text-zinc-600 italic">No interpreted evidence yet</p>
              )}
            </div>

            {/* Corrective Action */}
            <Button
              size="sm"
              onClick={handleCorrectiveAction}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs mt-auto"
              disabled={scenario.isCorrectiveDisabled(machine)}
            >
              {faultCleared ? scenario.resolvedLabel : scenario.correctiveActionLabel}
            </Button>
          </div>
        );
      case "closeout":
        return (
          <div className="flex flex-col h-full p-3 space-y-3 overflow-y-auto">
            <h3 className="text-sm font-semibold text-zinc-200">Closeout</h3>
            <div className="space-y-2 text-[10px]">
              <div className="px-2 py-1.5 rounded border border-zinc-700/30">
                <p className="text-zinc-500">Root Cause</p>
                <p className="text-zinc-300">{hypotheses.find((h) => h.status === "confirmed")?.text || "Not yet confirmed"}</p>
              </div>
              <div className="px-2 py-1.5 rounded border border-zinc-700/30">
                <p className="text-zinc-500">Corrective Action</p>
                <p className="text-zinc-300">{faultCleared ? scenario.closeoutResolvedText : scenario.closeoutPendingText}</p>
              </div>
              <div className="px-2 py-1.5 rounded border border-zinc-700/30">
                <p className="text-zinc-500">Tests Performed</p>
                <p className="text-zinc-300">{tests.length} measurement(s)</p>
              </div>
              <div className="px-2 py-1.5 rounded border border-zinc-700/30">
                <p className="text-zinc-500">Machine State</p>
                <p className="text-zinc-300">{machine.beltRunning ? "Running — returned to production" : "Stopped — awaiting repair"}</p>
              </div>
              <div className="px-2 py-1.5 rounded border border-zinc-700/30">
                <p className="text-zinc-500">Fault Model</p>
                <p className="text-zinc-300 text-[9px] leading-relaxed">{scenario.plcIoConfig.faultModelDescription}</p>
              </div>
            </div>
          </div>
        );
      case "replay":
        return (
          <div className="flex flex-col h-full p-3 space-y-3 overflow-y-auto">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" /> Diagnostic Replay
            </h3>
            {tests.length === 0 && (
              <p className="text-[10px] text-zinc-600 italic">No measurements taken yet — take readings to build your replay timeline.</p>
            )}
            {tests.length > 0 && (
              <div className="relative pl-4 border-l-2 border-zinc-700/50 space-y-2 text-[10px]">
                {tests.map((t, idx) => {
                  const elapsed = idx === 0 ? 0 : Math.round((t.timestamp - tests[0].timestamp) / 1000);
                  const mins = Math.floor(elapsed / 60);
                  const secs = elapsed % 60;
                  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                  return (
                    <div key={t.id} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-zinc-600 bg-zinc-900" />
                      <div className="px-2 py-1.5 rounded border border-zinc-700/30 bg-zinc-800/20">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[9px] text-zinc-500 font-mono">+{timeStr}</span>
                          <span className="text-[9px] px-1 py-0.5 rounded bg-zinc-700/40 text-zinc-400">{t.mode}</span>
                          <span className="font-mono text-amber-400">{t.probeLabel}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-zinc-300">{t.reading}</span>
                          {t.interpretation && (
                            <span className="text-emerald-400 ml-1">→ {t.interpretation}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {hypotheses.filter((h) => h.status !== "untested").length > 0 && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-emerald-600 bg-emerald-900" />
                    <div className="px-2 py-1.5 rounded border border-emerald-700/30 bg-emerald-900/10">
                      <p className="text-[9px] text-emerald-400 font-medium mb-0.5">Hypothesis Updates</p>
                      {hypotheses.filter((h) => h.status !== "untested").map((h) => (
                        <div key={h.id} className="flex items-center gap-1 text-[9px]">
                          <span className={`px-1 py-0.5 rounded font-medium ${
                            h.status === "confirmed" ? "bg-emerald-900/50 text-emerald-400" :
                            h.status === "eliminated" ? "bg-red-900/50 text-red-400" :
                            h.status === "supported" ? "bg-sky-900/50 text-sky-400" :
                            "bg-amber-900/50 text-amber-400"
                          }`}>{h.status}</span>
                          <span className="text-zinc-400 truncate">{h.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {faultCleared && (
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-emerald-500" />
                    <div className="px-2 py-1.5 rounded border border-emerald-600/40 bg-emerald-900/20">
                      <p className="text-emerald-400 font-medium">Corrective Action Applied — Fault Cleared</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="h-11 flex items-center gap-3 px-4 border-b border-zinc-700/50 bg-zinc-900/80 backdrop-blur-sm shrink-0">
        <Link href="/labs" className="text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">Motor Control Workstation</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
            faultCleared ? "bg-emerald-900/40 text-emerald-400" : scenario.badgeColor
          }`}>
            {faultCleared ? "FAULT CLEARED" : scenario.badgeText}
          </span>
        </div>

        {/* Scenario Selector */}
        <div className="ml-3">
          <select
            value={scenarioId}
            onChange={(e) => handleScenarioSwitch(e.target.value)}
            className="text-[10px] px-2 py-1 rounded border border-zinc-700 bg-zinc-800 text-zinc-300 cursor-pointer"
          >
            {SCENARIO_IDS.map((id) => (
              <option key={id} value={id}>
                {getScenario(id).badgeText}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {faultCleared && (
            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-400 font-medium animate-pulse">
              FAULT CLEARED
            </span>
          )}
          {unsafeAttempts.length > 0 && (
            <span className="text-[9px] px-2 py-0.5 rounded bg-red-900/40 text-red-400 font-medium">
              {unsafeAttempts.length} safety violation(s)
            </span>
          )}
        </div>
      </header>

      {/* ═══ DESKTOP LAYOUT ═══ */}
      <div className="hidden lg:flex flex-1 min-h-0">
        {/* LEFT — Machine View */}
        <div className="w-[280px] border-r border-zinc-700/50 flex flex-col min-h-0">
          <MachineViewPanel machine={machine} selectedComponent={selectedComponent} onSelectComponent={handleSelectComponent} scenario={scenario} />
          <div className="p-3 border-t border-zinc-700/50">
            <Button
              size="sm"
              onClick={handleCorrectiveAction}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
              disabled={scenario.isCorrectiveDisabled(machine)}
            >
              {faultCleared ? scenario.resolvedLabel : scenario.correctiveActionLabel}
            </Button>
          </div>
        </div>

        {/* CENTER — Print/Schematic */}
        <div className="flex-1 border-r border-zinc-700/50 flex flex-col min-h-0">
          <PrintPanel plc={plc} selectedComponent={selectedComponent} onSelectComponent={handleSelectComponent} highlightedRung={highlightedRung} />
        </div>

        {/* RIGHT — Diagnostic Bench */}
        <div className="w-[320px] flex flex-col min-h-0">
          <DiagnosticBenchPanel
            plc={plc}
            machine={machine}
            tests={tests}
            hypotheses={hypotheses}
            selectedProbe={selectedProbe}
            meterMode={meterMode}
            lastReading={lastReading}
            safetyOk={safetyOk}
            ioState={ioState}
            scenario={scenario}
            onSelectProbe={setSelectedProbe}
            onSetMeterMode={setMeterMode}
            onTakeReading={handleTakeReading}
            onAddHypothesis={handleAddHypothesis}
            onUpdateHypothesis={handleUpdateHypothesis}
            onRecordInterpretation={handleRecordInterpretation}
          />
        </div>
      </div>

      {/* DESKTOP — Bottom Drawer */}
      <div className="hidden lg:block">
        <BottomDrawer tests={tests} hypotheses={hypotheses} machine={machine} scenario={scenario} />
      </div>

      {/* ═══ MOBILE LAYOUT ═══ */}
      <div className="lg:hidden flex flex-col flex-1 min-h-0">
        <MobileContextBar
          machine={machine}
          selectedComponent={selectedComponent}
          selectedProbe={selectedProbe}
          lastReading={lastReading}
          safetyOk={safetyOk}
          scenario={scenario}
        />
        <div className="flex-1 min-h-0 overflow-hidden">
          {renderMobileContent()}
        </div>
        <div className="flex border-t border-zinc-700/50 bg-zinc-900/95 shrink-0">
          {([
            { id: "machine" as MobileTab, label: "Machine" },
            { id: "print" as MobileTab, label: "Print" },
            { id: "meter" as MobileTab, label: "Meter" },
            { id: "diagnosis" as MobileTab, label: "Dx" },
            { id: "closeout" as MobileTab, label: "Close" },
            { id: "replay" as MobileTab, label: "Replay" },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMobileTab(tab.id)}
              className={`flex-1 py-2.5 text-[10px] font-medium transition-all ${
                mobileTab === tab.id
                  ? "text-emerald-400 border-t-2 border-emerald-500 bg-emerald-950/20"
                  : "text-zinc-500 border-t-2 border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
