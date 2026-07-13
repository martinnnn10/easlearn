/**
 * Interactive Labs — Showcase page for all interactive simulation components
 * Accessible from the main navigation as a key differentiator
 *
 * Gating: Circuit Flow Animator is free for all users.
 * Relay Simulator, PLC Logic, and Ohm's Law require a paid subscription.
 */
import { motion } from "framer-motion";
import { Zap, Cpu, Calculator, Activity, GraduationCap, Lock, ArrowRight, Brain, Wrench, Cable, Factory } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import SEO from "@/components/SEO";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Gauge, Network } from "lucide-react";
import { RelaySimulator, PLCLogicVisualizer, OhmsLawCalculator, CircuitFlowAnimator, VirtualMultimeterLab, LadderLogicSimulatorLab, VFDParameterLab, DiodeTestingLab, TransistorTestingLab, ThyristorTestingLab, ComponentIDChallenge, MotorStarterSimulator, WiringDiagramLab, ConveyorTroubleshootingLab, PowerFlexDiagnosticLab } from "@/components/interactive";
import SimulatorOnboarding from "@/components/SimulatorOnboarding";
import { isLocalQaFullDeck } from "@shared/lessonCardNav";

type LabTab = "circuit" | "relay" | "plc" | "ohms" | "multimeter" | "ladder" | "vfd" | "diode" | "transistor" | "thyristor" | "component-id" | "motor-starter" | "wiring-diagram" | "conveyor-troubleshoot" | "powerflex-diagnostic";

const FLAGSHIP_TAB_IDS: LabTab[] = ["conveyor-troubleshoot", "powerflex-diagnostic"];
const PRACTICE_TAB_IDS: LabTab[] = [
  "ladder",
  "multimeter",
  "circuit",
  "relay",
  "plc",
  "ohms",
  "vfd",
  "diode",
  "transistor",
  "thyristor",
  "component-id",
  "motor-starter",
  "wiring-diagram",
];

const tabs: { id: LabTab; label: string; icon: any; description: string; free: boolean }[] = [
  { id: "conveyor-troubleshoot", label: "Conveyor PLC Lab", icon: Factory, description: "Flagship diagnostic lab — Packaging Line 4 machine twin, ladder logic, fault engine, and process scoring", free: true },
  { id: "powerflex-diagnostic", label: "PowerFlex VFD Lab", icon: Gauge, description: "Beta VFD benchmark — PowerFlex 525 fault display, parameters, status monitor, and process scoring", free: true },
  { id: "ladder", label: "Ladder Logic", icon: Cpu, description: "Full PLC program simulator with seal-in circuits, timers, and safety interlocks", free: false },
  { id: "multimeter", label: "Multimeter", icon: Gauge, description: "Virtual multimeter — select settings, probe test points, learn proper meter usage", free: true },
  { id: "circuit", label: "Circuit Flow", icon: Activity, description: "Animated current flow through a basic circuit", free: true },
  { id: "relay", label: "Relay Simulator", icon: Zap, description: "Interactive relay energization and contact states", free: false },
  { id: "plc", label: "PLC Logic", icon: Cpu, description: "Ladder logic visualizer with live rung evaluation", free: false },
  { id: "ohms", label: "Ohm's Law", icon: Calculator, description: "Interactive calculator with circuit response", free: false },
  { id: "vfd", label: "VFD Parameters", icon: Network, description: "Configure a PowerFlex 525 VFD from a work order — learn parameter navigation", free: false },
  { id: "diode", label: "Diode Testing", icon: Zap, description: "Virtual diode tester — identify healthy, shorted, and open diodes with multimeter", free: true },
  { id: "transistor", label: "Transistor Testing", icon: Cpu, description: "Test BJTs, MOSFETs, Darlingtons, and IGBTs — identify junction health with diode-test mode", free: true },
  { id: "thyristor", label: "Thyristor Testing", icon: Zap, description: "Test SCRs, TRIACs, DIACs, and GTOs — learn gate triggering and failure mode identification", free: true },
  { id: "component-id", label: "Component ID", icon: Brain, description: "Identify unlabeled NEMA / JIC symbols — name the component, terminals, and common part numbers", free: true },
  { id: "motor-starter", label: "Motor Starter", icon: Wrench, description: "Troubleshoot a 3-wire motor control circuit — use your virtual meter to diagnose faults", free: true },
  { id: "wiring-diagram", label: "Wiring Diagrams", icon: Cable, description: "Read one-line and three-line diagrams — trace paths, identify wire numbers, find breakers", free: true },
];

const ORDERED_TAB_IDS: LabTab[] = [...FLAGSHIP_TAB_IDS, ...PRACTICE_TAB_IDS];
const tabsById = new Map(tabs.map((t) => [t.id, t]));
const orderedTabs = ORDERED_TAB_IDS.map((id) => tabsById.get(id)).filter(Boolean) as typeof tabs;

export default function InteractiveLabs() {
  // Support deep-linking via URL hash (e.g., /labs#relay, /labs#plc)
  const getInitialTab = (): LabTab => {
    const hash = window.location.hash.replace('#', '') as LabTab;
    const validTabs: LabTab[] = ORDERED_TAB_IDS;
    return validTabs.includes(hash) ? hash : "conveyor-troubleshoot";
  };

  const [activeTab, setActiveTab] = useState<LabTab>(getInitialTab);
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { hasAccess, isLoading } = useSubscription();
  const qaLabsUnlock = isLocalQaFullDeck();
  const hasLabAccess = hasAccess || user?.role === "admin" || qaLabsUnlock;
  const subscriptionPending = authLoading || (isAuthenticated && isLoading);

  // Update hash when tab changes (for shareable URLs)
  useEffect(() => {
    if (activeTab !== "conveyor-troubleshoot") {
      window.history.replaceState(null, '', `#${activeTab}`);
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [activeTab]);

  // Listen for hash changes (e.g., browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as LabTab;
      const validTabs: LabTab[] = ORDERED_TAB_IDS;
      if (validTabs.includes(hash)) setActiveTab(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const activeTabData = tabs.find((t) => t.id === activeTab);
  const isTabLocked = !activeTabData?.free && !hasLabAccess && isAuthenticated && !subscriptionPending;
  const isTabLockedUnauthenticated = !activeTabData?.free && !hasLabAccess && !isAuthenticated && !authLoading;
  const isTabLoading = !activeTabData?.free && isAuthenticated && subscriptionPending;
  const [mobileInstructionsOpen, setMobileInstructionsOpen] = useState(true);

  const LAB_DIFFICULTY: Partial<Record<LabTab, string>> = {
    "conveyor-troubleshoot": "Intermediate",
    "powerflex-diagnostic": "Intermediate",
    ladder: "Intermediate",
    "motor-starter": "Beginner",
    circuit: "Beginner",
  };

  const renderLab = () => {
    switch (activeTab) {
      case "circuit": return <CircuitFlowAnimator />;
      case "multimeter": return <VirtualMultimeterLab />;
      case "ladder": return <LadderLogicSimulatorLab />;
      case "vfd": return <VFDParameterLab />;
      case "relay": return <RelaySimulator />;
      case "plc": return <PLCLogicVisualizer />;
      case "ohms": return <OhmsLawCalculator />;
      case "diode": return <DiodeTestingLab />;
      case "transistor": return <TransistorTestingLab />;
      case "thyristor": return <ThyristorTestingLab />;
      case "component-id": return <ComponentIDChallenge />;
      case "motor-starter": return <MotorStarterSimulator />;
      case "wiring-diagram": return <WiringDiagramLab />;
      case "conveyor-troubleshoot": return <ConveyorTroubleshootingLab />;
      case "powerflex-diagnostic": return <PowerFlexDiagnosticLab />;
      default: return null;
    }
  };

  return (
    <div className="overflow-x-hidden pb-8">
      <SEO
        title="Interactive Labs"
        description="Hands-on interactive electrical simulations. Relay energization, PLC ladder logic, Ohm's Law calculator, and animated circuit flow."
        path="/labs"
      />
      {/* First-run orientation for the flagship diagnostic lab — short & skippable */}
      <SimulatorOnboarding show={activeTab === "conveyor-troubleshoot"} />

      {/* Hero */}
      <section className="relative py-16 sm:py-24 landscape:py-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.12_0.02_155/8%)] via-transparent to-transparent" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[oklch(0.55_0.12_155/30%)] to-transparent" />
        
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[oklch(0.55_0.12_155/10%)] border border-[oklch(0.55_0.12_155/20%)] text-xs text-[oklch(0.65_0.10_155)] mb-5 landscape:hidden">
              <GraduationCap className="w-3.5 h-3.5" />
              Hands-On Learning
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl landscape:text-2xl font-heading text-white tracking-wide mb-4 landscape:mb-2">
              Interactive Labs
            </h1>
            <p className="text-base text-[oklch(0.65_0.008_250)] leading-relaxed max-w-2xl landscape:hidden">
              Click, toggle, and experiment with real electrical concepts. These simulations respond in real-time — 
              no static diagrams, no PowerPoint slides.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tab Navigation — non-sticky in landscape to preserve vertical space */}
      <section className="sticky landscape:static top-[calc(4rem+env(safe-area-inset-top,0px))] z-30 bg-[oklch(0.07_0.003_250)/95%] backdrop-blur-md border-b border-[oklch(0.14_0.004_250)] overflow-hidden">
        <div className="container max-w-full">
          <div
            className="flex gap-1 overflow-x-auto py-3 landscape:py-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide max-w-full"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <span className="flex items-center px-2 text-[10px] font-mono uppercase tracking-wider text-[oklch(0.45_0.006_250)] shrink-0">
              Flagship Labs
            </span>
            {orderedTabs
              .filter((tab) => FLAGSHIP_TAB_IDS.includes(tab.id))
              .map((tab) => {
                const Icon = tab.icon;
                const locked = !tab.free && ((!hasAccess && isAuthenticated && !isLoading) || !isAuthenticated);
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 min-h-11 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-all ${
                      activeTab === tab.id
                        ? "bg-[oklch(0.55_0.12_155/15%)] text-[oklch(0.75_0.12_155)] border border-[oklch(0.55_0.12_155/30%)]"
                        : "text-[oklch(0.55_0.008_250)] hover:text-white hover:bg-[oklch(0.12_0.003_250)]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {locked && <Lock className="w-3 h-3 text-[oklch(0.45_0.006_250)]" />}
                  </button>
                );
              })}
            <span className="flex items-center px-2 ml-2 text-[10px] font-mono uppercase tracking-wider text-[oklch(0.45_0.006_250)] shrink-0 border-l border-[oklch(0.18_0.004_250)]">
              Practice Tools
            </span>
            {orderedTabs
              .filter((tab) => PRACTICE_TAB_IDS.includes(tab.id))
              .map((tab) => {
                const Icon = tab.icon;
                const locked = !tab.free && ((!hasAccess && isAuthenticated && !isLoading) || !isAuthenticated);
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 min-h-11 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-all ${
                      activeTab === tab.id
                        ? "bg-[oklch(0.55_0.12_155/15%)] text-[oklch(0.75_0.12_155)] border border-[oklch(0.55_0.12_155/30%)]"
                        : "text-[oklch(0.55_0.008_250)] hover:text-white hover:bg-[oklch(0.12_0.003_250)]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {locked && <Lock className="w-3 h-3 text-[oklch(0.45_0.006_250)]" />}
                  </button>
                );
              })}
          </div>
        </div>
      </section>

      {/* Active Lab */}
      <section className="py-10">
        <div className="container max-w-7xl">
          {activeTabData && (
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-heading text-white tracking-wide">{activeTabData.label}</h2>
              {LAB_DIFFICULTY[activeTab] && (
                <span className="text-[10px] font-mono uppercase px-2 py-1 rounded border border-[oklch(0.55_0.12_155/30%)] text-[oklch(0.65_0.10_155)]">
                  {LAB_DIFFICULTY[activeTab]}
                </span>
              )}
            </div>
          )}

          <motion.div
            key={activeTab + "-component"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {isTabLoading ? (
              <div className="min-h-[40vh] flex items-center justify-center">
                <div className="animate-pulse space-y-4 w-full max-w-md">
                  <div className="h-8 bg-[oklch(0.15_0.003_250)] rounded w-2/3" />
                  <div className="h-4 bg-[oklch(0.15_0.003_250)] rounded w-full" />
                  <div className="h-4 bg-[oklch(0.15_0.003_250)] rounded w-5/6" />
                </div>
              </div>
            ) : (isTabLocked || isTabLockedUnauthenticated) ? (
              <div className="min-h-[40vh] flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-14 h-14 rounded-2xl bg-[oklch(0.55_0.12_155/8%)] border border-[oklch(0.55_0.12_155/20%)] flex items-center justify-center mx-auto mb-5">
                    <Lock className="w-7 h-7 text-[oklch(0.55_0.12_155)]" />
                  </div>
                  <h2 className="text-2xl font-heading text-white mb-3">Subscribe to Unlock</h2>
                  <p className="text-base text-[oklch(0.55_0.008_250)] mb-6 leading-relaxed">
                    The {activeTabData?.label} lab requires a paid subscription.
                    The Circuit Flow lab is free to try — subscribe to access all interactive labs.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href="/pricing"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-11 btn-primary font-semibold rounded-lg"
                    >
                      <Zap className="w-4 h-4" />
                      View Plans
                    </Link>
                    <button
                      onClick={() => setActiveTab("conveyor-troubleshoot")}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-11 text-base font-medium text-[oklch(0.60_0.005_250)] border border-[oklch(0.20_0.004_250)] rounded-lg hover:border-[oklch(0.30_0.004_250)] transition-colors"
                    >
                      Try Conveyor PLC Lab (Free)
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="sim-lab-layout">
                <div className="sim-lab-instructions space-y-3">
                  <div className="hidden lg:block space-y-3">
                    <div className="card-panel p-4">
                      <h3 className="text-xs font-mono uppercase text-[oklch(0.45_0.006_250)] mb-2" data-sim-instructions>
                        Instructions
                      </h3>
                      <p className="text-base text-[oklch(0.65_0.008_250)] leading-relaxed">
                        {activeTabData?.description}
                      </p>
                      <ol className="mt-4 space-y-2 text-base text-[oklch(0.58_0.008_250)] list-decimal list-inside">
                        <li>Read the symptom or goal in the simulator panel.</li>
                        <li>Use on-screen controls — all buttons are tap-friendly on mobile.</li>
                        <li>Verify your diagnosis against I/O, meter readings, or drive status.</li>
                      </ol>
                    </div>
                    {(activeTab === "conveyor-troubleshoot" || activeTab === "powerflex-diagnostic") && (
                      <div className="card-panel p-4">
                        <h3 className="text-xs font-mono uppercase text-[oklch(0.45_0.006_250)] mb-2">Fault evidence</h3>
                        <p className="text-base text-[oklch(0.58_0.008_250)]">
                          Use the diagnostics panel inside the lab to review I/O, event log, and meter readings. Evidence unlocks as you investigate.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="lg:hidden">
                    <button
                      type="button"
                      data-sim-instructions-mobile
                      className="w-full flex items-center justify-between px-4 py-3 min-h-11 rounded-lg border border-[oklch(0.20_0.004_250)] text-base text-white"
                      onClick={() => setMobileInstructionsOpen((o) => !o)}
                    >
                      Instructions
                      <span className="text-xs text-[oklch(0.50_0.008_250)]">{mobileInstructionsOpen ? "Hide" : "Show"}</span>
                    </button>
                    {mobileInstructionsOpen && (
                      <div className="space-y-3 mt-3">
                        <div className="card-panel p-4">
                          <h3 className="text-xs font-mono uppercase text-[oklch(0.45_0.006_250)] mb-2" data-sim-instructions>
                            Instructions
                          </h3>
                          <p className="text-base text-[oklch(0.65_0.008_250)] leading-relaxed">
                            {activeTabData?.description}
                          </p>
                        </div>
                        {(activeTab === "conveyor-troubleshoot" || activeTab === "powerflex-diagnostic") && (
                          <div className="card-panel p-4">
                            <h3 className="text-xs font-mono uppercase text-[oklch(0.45_0.006_250)] mb-2">Fault evidence</h3>
                            <p className="text-base text-[oklch(0.58_0.008_250)]">
                              Use the diagnostics panel inside the lab to review I/O, event log, and meter readings.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="sim-lab-panel min-w-0">{renderLab()}</div>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
