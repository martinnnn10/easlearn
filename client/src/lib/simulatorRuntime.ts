/**
 * Runtime scenario data resolution — supports hidden V1 for assessments + public browse.
 */
import { scenarioDatabase } from "@/data/scenarios";
import { conveyorEstopV2 } from "@/data/scenarioConveyorEstopV2";
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
  getCatalogEntry,
  getBrowsableCatalog,
  type SimulatorCatalogEntry,
} from "@shared/simulatorCatalog";

export type RuntimeScenarioItem = {
  id: string;
  title: string;
  difficulty: string;
  type: string;
  duration: string;
  faults: string[];
  isV2: boolean;
  isV3: boolean;
  isLab: boolean;
  labRoute?: string;
  data: unknown;
};

const v3List = [
  scenarioMultiFaultV3,
  scenarioVFDOvercurrent,
  scenarioVFDUndervoltage,
  scenarioVFDGroundFault,
  scenarioVFDCoolingFan,
  scenarioVFDPhaseLoss,
  scenarioBlownFuse,
  scenarioFailedRelay,
  scenarioPLCIOFault,
  scenarioMotorOverload,
  scenarioCommLoss,
  scenarioIntermittentGround,
];

function buildRuntimeMap(): Map<string, RuntimeScenarioItem> {
  const map = new Map<string, RuntimeScenarioItem>();

  for (const s of v3List) {
    map.set(s.id, {
      id: s.id,
      title: s.title,
      difficulty: "Adaptive",
      type: s.type,
      duration: "5–25 min",
      faults: s.faults.map((f) => f.name),
      isV2: false,
      isV3: true,
      isLab: false,
      data: s,
    });
  }

  map.set(conveyorEstopV2.id, {
    id: conveyorEstopV2.id,
    title: conveyorEstopV2.title,
    difficulty: "Adaptive",
    type: conveyorEstopV2.type,
    duration: "5–12 min",
    faults: ["E-stop chain open", "Vibration-induced trip", "Safety relay de-energized"],
    isV2: true,
    isV3: false,
    isLab: false,
    data: conveyorEstopV2,
  });

  for (const s of scenarioDatabase) {
    map.set(s.id, {
      id: s.id,
      title: s.title,
      difficulty: s.difficulty,
      type: s.type,
      duration: s.duration,
      faults: s.possibleFaults,
      isV2: false,
      isV3: false,
      isLab: false,
      data: s,
    });
  }

  return map;
}

const RUNTIME_MAP = buildRuntimeMap();

export function getRuntimeScenario(id: string): RuntimeScenarioItem | undefined {
  const entry = getCatalogEntry(id);
  if (entry?.engine === "lab" && entry.route) {
    return {
      id: entry.id,
      title: entry.title,
      difficulty: entry.difficulty,
      type: entry.scenarioType,
      duration: entry.duration,
      faults: entry.faults,
      isV2: false,
      isV3: false,
      isLab: true,
      labRoute: entry.route,
      data: null,
    };
  }
  return RUNTIME_MAP.get(id);
}

/** All launchable scenario engines (includes hidden V1 for assessment deep links) */
export function getAllRuntimeScenarioIds(): string[] {
  return Array.from(RUNTIME_MAP.keys());
}

export function getBrowsableEntries(): SimulatorCatalogEntry[] {
  return getBrowsableCatalog();
}

export function getDefaultScenarioId(): string {
  const featured = getBrowsableCatalog().find((e) => e.featured && e.clickable && e.engine !== "lab");
  return featured?.id ?? "plc-io-fault-v3";
}

export function resolveScenarioIdFromUrl(param: string | null, resolver: (id: string) => string | null): string {
  if (!param) return getDefaultScenarioId();
  const resolved = resolver(param);
  if (resolved && (RUNTIME_MAP.has(resolved) || getCatalogEntry(resolved)?.engine === "lab")) {
    return resolved;
  }
  if (RUNTIME_MAP.has(param) || getCatalogEntry(param)?.engine === "lab") {
    return param;
  }
  return getDefaultScenarioId();
}
