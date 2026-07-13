/**
 * Loads scenario payloads for the candidate assessment flow by engine version.
 * Registry metadata lives in @shared/scenarioRegistry; scenario logic is unchanged.
 */
import { scenarioDatabase, type ScenarioData } from "@/data/scenarios";
import { conveyorEstopV2 } from "@/data/scenarioConveyorEstopV2";
import type { ScenarioV2 } from "@/data/scenariosV2";
import type { ScenarioV3 } from "@/data/scenariosV3";
import { scenarioMultiFaultV3 } from "@/data/scenarioMultiFaultV3";
import { scenarioVFDOvercurrent } from "@/data/scenarioVFDOvercurrent";
import { scenarioVFDUndervoltage } from "@/data/scenarioVFDUndervoltage";
import { scenarioVFDGroundFault } from "@/data/scenarioVFDGroundFault";
import { scenarioVFDCoolingFan } from "@/data/scenarioVFDCoolingFan";
import { scenarioVFDPhaseLoss } from "@/data/scenarioVFDPhaseLoss";
import { scenarioBlownFuse } from "@/data/scenarioBlownFuse";
import { scenarioFailedRelay } from "@/data/scenarioFailedRelay";
import { scenarioPLCIOFault } from "@/data/scenarioPLCIOFault";
import { scenarioMotorOverload } from "@/data/scenarioMotorOverload";
import { scenarioCommLoss } from "@/data/scenarioCommLoss";
import { scenarioIntermittentGround } from "@/data/scenarioIntermittentGround";
import {
  getScenarioRegistryEntry,
  normalizeAssessmentScenarioId,
  type ScenarioEngineVersion,
} from "@shared/scenarioRegistry";
import type { LaunchConfig } from "@/components/ScenarioLauncher";
import { selectRandomVariant } from "@/lib/scenarioModular";
import type { SimulationResults } from "@/components/SimulatorEngine";
import type { SimV2Results } from "@/components/SimulatorEngineV2";
import type { SimV3Results } from "@/components/SimulatorEngineV3";

const V1_BY_ID = new Map(scenarioDatabase.map((s) => [s.id, s]));

const V2_BY_ID: Record<string, ScenarioV2> = {
  [conveyorEstopV2.id]: conveyorEstopV2,
};

const V3_BY_ID: Record<string, ScenarioV3> = {
  [scenarioMultiFaultV3.id]: scenarioMultiFaultV3,
  [scenarioVFDOvercurrent.id]: scenarioVFDOvercurrent,
  [scenarioVFDUndervoltage.id]: scenarioVFDUndervoltage,
  [scenarioVFDGroundFault.id]: scenarioVFDGroundFault,
  [scenarioVFDCoolingFan.id]: scenarioVFDCoolingFan,
  [scenarioVFDPhaseLoss.id]: scenarioVFDPhaseLoss,
  [scenarioBlownFuse.id]: scenarioBlownFuse,
  [scenarioFailedRelay.id]: scenarioFailedRelay,
  [scenarioPLCIOFault.id]: scenarioPLCIOFault,
  [scenarioMotorOverload.id]: scenarioMotorOverload,
  [scenarioCommLoss.id]: scenarioCommLoss,
  [scenarioIntermittentGround.id]: scenarioIntermittentGround,
};

export interface LoadedAssessmentScenario {
  id: string;
  title: string;
  engineVersion: ScenarioEngineVersion;
  v1?: ScenarioData;
  v2?: ScenarioV2;
  v3?: ScenarioV3;
}

/** Standard assessment play — no launcher UI; fair baseline for all candidates */
export function buildAssessmentLaunchConfig(scenarioId: string): LaunchConfig {
  return {
    scenarioId,
    mode: "standard",
    modifier: "standard",
    variant: selectRandomVariant(scenarioId),
  };
}

export function loadAssessmentScenario(rawId: string): LoadedAssessmentScenario | null {
  const id = normalizeAssessmentScenarioId(rawId);
  const entry = getScenarioRegistryEntry(id);
  if (!entry?.assessmentEligible) return null;

  if (entry.engineVersion === "v1") {
    const v1 = V1_BY_ID.get(id);
    if (!v1) return null;
    return { id, title: entry.title, engineVersion: "v1", v1 };
  }

  if (entry.engineVersion === "v2") {
    const v2 = V2_BY_ID[id];
    if (!v2) return null;
    return { id, title: entry.title, engineVersion: "v2", v2 };
  }

  const v3 = V3_BY_ID[id];
  if (!v3) return null;
  return { id, title: entry.title, engineVersion: "v3", v3 };
}

export function mapV2ResultsToAssessmentPayload(r: SimV2Results): SimulationResults {
  return {
    scenarioId: r.scenarioId,
    scenarioTitle: r.scenarioTitle,
    totalScore: r.totalScore,
    maxScore: r.maxScore,
    percentage: r.percentage,
    grade: r.grade,
    totalTime: r.totalTime,
    decisions: r.actionsLog.map((a) => ({
      stepTitle: a.location,
      chosenOption: a.reading,
      wasCorrect: a.wasUseful,
      scoreImpact: a.wasUseful ? 1 : 0,
      timeSpent: 0,
    })),
    hintsUsed: r.hintsUsed,
    perfectPath: false,
  };
}

export function mapV3ResultsToAssessmentPayload(r: SimV3Results): SimulationResults {
  return {
    scenarioId: r.scenarioId,
    scenarioTitle: r.scenarioTitle,
    totalScore: r.totalScore,
    maxScore: r.maxScore,
    percentage: r.percentage,
    grade: r.grade,
    totalTime: r.totalTime,
    decisions: r.actionsLog.map((a) => ({
      stepTitle: a.location ?? a.type,
      chosenOption: a.description,
      wasCorrect: a.wasUseful,
      scoreImpact: a.wasUseful ? 1 : 0,
      timeSpent: 0,
    })),
    hintsUsed: r.hintsUsed,
    perfectPath: false,
  };
}
