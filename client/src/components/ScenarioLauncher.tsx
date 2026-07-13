/**
 * ScenarioLauncher — Pre-play configuration panel
 * 
 * Allows users to select:
 * - Play mode (Standard, Timed, Guided, Expert)
 * - Fault variant (randomized or specific)
 * - Difficulty modifier (standard, limited tools, high pressure, etc.)
 * 
 * Shown before starting a V3 scenario to increase replayability.
 */
import { useState, useMemo } from "react";
import {
  Play, Timer, BookOpen, Shield, Shuffle,
  Wrench, AlertTriangle, Zap, FileX, Radio,
  ChevronRight, Info, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type PlayMode,
  type DifficultyModifier,
  type FaultVariant,
  PLAY_MODES,
  DIFFICULTY_MODIFIERS,
  SCENARIO_VARIANTS,
  selectRandomVariant,
  getConfigLabel,
  getScenarioVariantConfig,
} from "@/lib/scenarioModular";
import type { ScenarioV3 } from "@/data/scenariosV3";

interface ScenarioLauncherProps {
  scenario: ScenarioV3;
  onLaunch: (config: LaunchConfig) => void;
  onCancel: () => void;
}

export interface LaunchConfig {
  mode: PlayMode;
  modifier: DifficultyModifier;
  variant: FaultVariant | null;
  scenarioId: string;
}

const MODE_ICONS: Record<PlayMode, React.ReactNode> = {
  standard: <Play className="w-5 h-5" />,
  timed: <Timer className="w-5 h-5" />,
  guided: <BookOpen className="w-5 h-5" />,
  minimal_hints: <Shield className="w-5 h-5" />,
};

const MODIFIER_ICONS: Record<DifficultyModifier, React.ReactNode> = {
  standard: <Play className="w-4 h-4" />,
  reduced_tools: <Wrench className="w-4 h-4" />,
  time_pressure: <AlertTriangle className="w-4 h-4" />,
  cascading_faults: <Zap className="w-4 h-4" />,
  no_prints: <FileX className="w-4 h-4" />,
  degraded_readings: <Radio className="w-4 h-4" />,
};

export default function ScenarioLauncher({ scenario, onLaunch, onCancel }: ScenarioLauncherProps) {
  const [selectedMode, setSelectedMode] = useState<PlayMode>("standard");
  const [selectedModifier, setSelectedModifier] = useState<DifficultyModifier>("standard");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("random");

  const variantConfig = getScenarioVariantConfig(scenario.id);
  const hasVariants = variantConfig && variantConfig.faultVariants.length > 1;
  const availableModes = variantConfig?.availableModes || ["standard", "timed", "guided", "minimal_hints"];
  const availableModifiers = variantConfig?.availableModifiers || ["standard"];

  const selectedVariant = useMemo(() => {
    if (!variantConfig) return null;
    if (selectedVariantId === "random") {
      return selectRandomVariant(scenario.id);
    }
    return variantConfig.faultVariants.find(v => v.id === selectedVariantId) || null;
  }, [selectedVariantId, scenario.id, variantConfig]);

  const configLabel = getConfigLabel(selectedVariant, selectedMode, selectedModifier);

  const handleLaunch = () => {
    const variant = selectedVariantId === "random"
      ? selectRandomVariant(scenario.id)
      : selectedVariant;
    onLaunch({
      mode: selectedMode,
      modifier: selectedModifier,
      variant,
      scenarioId: scenario.id,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-[oklch(0.15_0.01_250)] border border-[oklch(0.3_0.02_250)] rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[oklch(0.25_0.02_250)]">
          <div>
            <h2 className="text-lg font-bold text-white font-[Oswald]">{scenario.title}</h2>
            <p className="text-sm text-[oklch(0.65_0.02_250)]">{scenario.type}</p>
          </div>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-[oklch(0.2_0.02_250)] transition-colors" aria-label="Close scenario launcher">
            <X className="w-5 h-5 text-[oklch(0.5_0.02_250)]" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto" style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>
          {/* Play Mode Selection */}
          <div>
            <h3 className="text-sm font-semibold text-[oklch(0.7_0.02_250)] uppercase tracking-wider mb-3 font-[Oswald]">
              Play Mode
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {availableModes.map(modeId => {
                const mode = PLAY_MODES[modeId];
                const isSelected = selectedMode === modeId;
                return (
                  <button
                    key={modeId}
                    onClick={() => setSelectedMode(modeId)}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${
                      isSelected
                        ? "border-[oklch(0.65_0.18_145)] bg-[oklch(0.65_0.18_145/10%)]"
                        : "border-[oklch(0.25_0.02_250)] bg-[oklch(0.12_0.01_250)] hover:border-[oklch(0.35_0.02_250)]"
                    }`}
                  >
                    <div className={`mt-0.5 ${isSelected ? "text-[oklch(0.65_0.18_145)]" : "text-[oklch(0.5_0.02_250)]"}`}>
                      {MODE_ICONS[modeId]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${isSelected ? "text-white" : "text-[oklch(0.75_0.02_250)]"}`}>
                        {mode.label}
                      </div>
                      <div className="text-xs text-[oklch(0.55_0.02_250)] mt-0.5 line-clamp-2">
                        {mode.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fault Variant Selection */}
          {hasVariants && (
            <div>
              <h3 className="text-sm font-semibold text-[oklch(0.7_0.02_250)] uppercase tracking-wider mb-3 font-[Oswald]">
                Fault Configuration
              </h3>
              <div className="space-y-2">
                {/* Random option */}
                <button
                  onClick={() => setSelectedVariantId("random")}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    selectedVariantId === "random"
                      ? "border-[oklch(0.65_0.18_145)] bg-[oklch(0.65_0.18_145/10%)]"
                      : "border-[oklch(0.25_0.02_250)] bg-[oklch(0.12_0.01_250)] hover:border-[oklch(0.35_0.02_250)]"
                  }`}
                >
                  <Shuffle className={`w-4 h-4 ${selectedVariantId === "random" ? "text-[oklch(0.65_0.18_145)]" : "text-[oklch(0.5_0.02_250)]"}`} />
                  <div className="flex-1">
                    <div className={`text-sm font-semibold ${selectedVariantId === "random" ? "text-white" : "text-[oklch(0.75_0.02_250)]"}`}>
                      Random Fault
                    </div>
                    <div className="text-xs text-[oklch(0.55_0.02_250)]">
                      Different fault each time — maximizes replayability
                    </div>
                  </div>
                </button>

                {/* Specific variants */}
                {variantConfig!.faultVariants.map(variant => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      selectedVariantId === variant.id
                        ? "border-[oklch(0.65_0.18_145)] bg-[oklch(0.65_0.18_145/10%)]"
                        : "border-[oklch(0.25_0.02_250)] bg-[oklch(0.12_0.01_250)] hover:border-[oklch(0.35_0.02_250)]"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${selectedVariantId === variant.id ? "text-white" : "text-[oklch(0.75_0.02_250)]"}`}>
                          {variant.label}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                          variant.difficulty === "beginner" ? "bg-[oklch(0.55_0.12_155/20%)] text-[oklch(0.55_0.12_155)]" :
                          variant.difficulty === "intermediate" ? "bg-[oklch(0.75_0.12_75/20%)] text-[oklch(0.75_0.12_75)]" :
                          "bg-[oklch(0.65_0.18_25/20%)] text-[oklch(0.65_0.18_25)]"
                        }`}>
                          {variant.difficulty}
                        </span>
                      </div>
                      <div className="text-xs text-[oklch(0.55_0.02_250)] mt-0.5">
                        {variant.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty Modifiers */}
          {availableModifiers.length > 1 && (
            <div>
              <h3 className="text-sm font-semibold text-[oklch(0.7_0.02_250)] uppercase tracking-wider mb-3 font-[Oswald]">
                Difficulty Modifier
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableModifiers.map(modId => {
                  const mod = DIFFICULTY_MODIFIERS[modId];
                  const isSelected = selectedModifier === modId;
                  return (
                    <button
                      key={modId}
                      onClick={() => setSelectedModifier(modId)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm ${
                        isSelected
                          ? "border-[oklch(0.65_0.18_145)] bg-[oklch(0.65_0.18_145/10%)] text-white"
                          : "border-[oklch(0.25_0.02_250)] bg-[oklch(0.12_0.01_250)] text-[oklch(0.65_0.02_250)] hover:border-[oklch(0.35_0.02_250)]"
                      }`}
                      title={mod.description}
                    >
                      {MODIFIER_ICONS[modId]}
                      <span>{mod.label}</span>
                      {mod.scoreMultiplier > 1 && (
                        <span className="text-[10px] text-[oklch(0.75_0.12_75)] font-mono">
                          +{Math.round((mod.scoreMultiplier - 1) * 100)}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Configuration Summary */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[oklch(0.12_0.01_250)] border border-[oklch(0.2_0.02_250)]">
            <Info className="w-4 h-4 text-[oklch(0.5_0.02_250)] shrink-0" />
            <span className="text-xs text-[oklch(0.6_0.02_250)]">
              Configuration: <span className="text-[oklch(0.75_0.02_250)] font-medium">{configLabel}</span>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[oklch(0.25_0.02_250)] bg-[oklch(0.12_0.01_250)]">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-[oklch(0.6_0.02_250)] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <Button
            onClick={handleLaunch}
            className="bg-[oklch(0.55_0.15_145)] hover:bg-[oklch(0.5_0.15_145)] text-white gap-2"
          >
            <Play className="w-4 h-4" />
            Start Scenario
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
