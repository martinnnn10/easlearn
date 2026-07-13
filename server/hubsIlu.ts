/**
 * ILU status stub — derives stage state from existing lesson progress (A2).
 * No new persistence.
 */

import {
  type IluStage,
  type IluTrack,
  getIluLinksForTrack,
  type LessonUnit,
} from "@shared/hubRegistry";
import { getLessonUnit } from "@shared/lessonPracticeMap";

export type IluStageStatus = "current" | "available" | "complete" | "unavailable" | "scaffold";

export interface IluStageState {
  stage: IluStage;
  status: IluStageStatus;
  title: string;
  required: boolean;
  targetSlug: string;
}

export interface IluStatusResult {
  mapped: boolean;
  track: IluTrack;
  moduleSlug: string;
  lessonSlug: string;
  hubId?: string;
  stages: IluStageState[];
  trackB?: {
    cardCount: number;
    quizPassThreshold: number;
    knowledgeCheckBlocks: number;
  };
}

export interface IluProgressSnapshot {
  isOnLessonPage?: boolean;
  lessonCompleted?: boolean;
  lessonQuizPassed?: boolean;
  scenarioPassed?: boolean;
  knowledgeCheckPassed?: boolean;
}

function stageStatus(
  linkStage: IluStage,
  link: { simulatorStatus?: string; required: boolean },
  progress: IluProgressSnapshot
): IluStageStatus {
  if (link.simulatorStatus === "scaffold") return "scaffold";

  switch (linkStage) {
    case "lesson":
      return progress.isOnLessonPage ? "current" : progress.lessonCompleted ? "complete" : "available";
    case "lesson_quiz":
      return progress.lessonQuizPassed ? "complete" : "available";
    case "knowledge_check":
      return progress.knowledgeCheckPassed ? "complete" : "available";
    case "practice":
    case "troubleshoot":
      return progress.scenarioPassed ? "complete" : "available";
    case "assess":
      return progress.lessonCompleted || progress.scenarioPassed ? "complete" : "available";
    default:
      return "available";
  }
}

export function buildIluStatus(
  moduleSlug: string,
  lessonSlug: string,
  progress: IluProgressSnapshot = {},
  track: IluTrack = "A"
): IluStatusResult {
  const unit = getLessonUnit(moduleSlug, lessonSlug);
  if (!unit) {
    return {
      mapped: false,
      track,
      moduleSlug,
      lessonSlug,
      stages: [],
    };
  }

  return buildIluStatusFromUnit(unit, moduleSlug, lessonSlug, progress, track);
}

export function buildIluStatusFromUnit(
  unit: LessonUnit,
  moduleSlug: string,
  lessonSlug: string,
  progress: IluProgressSnapshot,
  track: IluTrack = "A"
): IluStatusResult {
  const links = getIluLinksForTrack(unit.iluLinks, track);

  const stages: IluStageState[] = links.map((link) => ({
    stage: link.stage,
    status: stageStatus(link.stage, link, progress),
    title: link.title,
    required: link.required,
    targetSlug: link.targetSlug,
  }));

  return {
    mapped: true,
    track,
    moduleSlug,
    lessonSlug,
    stages,
    trackB: {
      cardCount: unit.trackB.cards.estimatedCount,
      quizPassThreshold: unit.trackB.lessonQuiz.passThreshold,
      knowledgeCheckBlocks: unit.trackB.knowledgeChecks.blockCount,
    },
  };
}
