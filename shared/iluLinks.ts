/**
 * ILU CTA link builder — query params for hub attribution (A2).
 */

import type { HubId, IluLink, IluStage } from "./hubRegistry";
import { getHubForModule } from "./hubRegistry";
import { getLessonUnit, getModuleHubId } from "./lessonPracticeMap";

export interface IluAttributionContext {
  moduleSlug: string;
  lessonSlug: string;
  hubId?: HubId;
}

export interface BuildIluHrefOptions extends IluAttributionContext {
  link: IluLink;
}

/** Build CTA href with hub / lesson / ilu attribution query params. */
export function buildIluCtaHref({ link, moduleSlug, lessonSlug, hubId }: BuildIluHrefOptions): string {
  const hub = hubId ?? getModuleHubId(moduleSlug);
  const params = new URLSearchParams();

  if (hub) params.set("hub", hub);
  params.set("module", moduleSlug);
  params.set("lesson", lessonSlug);
  params.set("ilu", link.stage);

  if (link.labMode) params.set("mode", link.labMode);
  if (link.faultScope?.length) params.set("faultScope", link.faultScope.join(","));
  if (link.queryParams) {
    for (const [key, value] of Object.entries(link.queryParams)) {
      params.set(key, value);
    }
  }

  return mergeAttributionIntoRoute(link.route, params);
}

/** Merge attribution params into route without duplicating keys already in the base URL. */
export function mergeAttributionIntoRoute(base: string, params: URLSearchParams): string {
  const hashIdx = base.indexOf("#");
  const hash = hashIdx >= 0 ? base.slice(hashIdx) : "";
  const pathPart = hashIdx >= 0 ? base.slice(0, hashIdx) : base;
  const qIdx = pathPart.indexOf("?");
  const pathname = qIdx >= 0 ? pathPart.slice(0, qIdx) : pathPart;
  const existing = new URLSearchParams(qIdx >= 0 ? pathPart.slice(qIdx + 1) : "");

  params.forEach((value, key) => {
    if (!existing.has(key)) {
      existing.set(key, value);
    }
  });

  const qs = existing.toString();
  return qs ? `${pathname}?${qs}${hash}` : `${pathname}${hash}`;
}

export type IluStripItemStatus = "current" | "available" | "complete" | "unavailable" | "scaffold";

export interface IluStripItem {
  stage: IluStage;
  label: string;
  title: string;
  href: string | null;
  status: IluStripItemStatus;
  required: boolean;
  isExternalLab: boolean;
  targetSlug: string;
}

const TRACK_A_LABELS: Record<string, string> = {
  lesson: "Lesson",
  practice: "Practice",
  troubleshoot: "Troubleshoot",
  assess: "Assess",
};

export interface IluStripProgress {
  isOnLessonPage?: boolean;
  lessonCompleted?: boolean;
  knowledgeCheckPassed?: boolean;
  lessonQuizPassed?: boolean;
  scenarioPassed?: boolean;
}

function resolveStripStatus(
  link: IluLink,
  progress: IluStripProgress
): IluStripItemStatus {
  if (link.stage === "lesson") {
    return progress.isOnLessonPage ? "current" : progress.lessonCompleted ? "complete" : "available";
  }

  if (link.simulatorStatus === "scaffold") {
    return "scaffold";
  }

  if (link.stage === "assess") {
    const kcDone = progress.knowledgeCheckPassed ?? progress.lessonCompleted;
    const quizDone = progress.lessonQuizPassed ?? progress.lessonCompleted;
    if (quizDone && kcDone) return "complete";
    if (progress.scenarioPassed && quizDone) return "complete";
    return "available";
  }

  if (link.stage === "practice" || link.stage === "troubleshoot") {
    // Track A A2: visible/clickable while viewing lesson (no 80% quiz gate yet)
    if (progress.isOnLessonPage || progress.lessonCompleted || progress.lessonQuizPassed) {
      return "available";
    }
    return "available";
  }

  return "available";
}

/** Track A strip items for legacy lessons. */
export function buildTrackAStripItems(
  links: IluLink[],
  context: IluAttributionContext,
  progress: IluStripProgress = {}
): IluStripItem[] {
  return links
    .filter((l) => l.tracks.includes("A"))
    .map((link) => {
      const status = resolveStripStatus(link, progress);
      const isLessonStage = link.stage === "lesson";
      const isAssessStage = link.stage === "assess";

      let href: string | null = null;
      if (!isLessonStage && status !== "unavailable") {
        if (status === "scaffold") {
          href = null;
        } else if (isAssessStage) {
          href = `${link.route.split("#")[0]}#ilu-assess`;
        } else {
          href = buildIluCtaHref({ link, ...context });
        }
      }

      return {
        stage: link.stage,
        label: TRACK_A_LABELS[link.stage] ?? link.title,
        title: link.title,
        href,
        status: isLessonStage ? (progress.isOnLessonPage ? "current" : status) : status,
        required: link.required,
        isExternalLab: link.targetType === "lab" || link.targetType === "simulator",
        targetSlug: link.targetSlug,
      };
    });
}

export function getLessonIluStripData(
  moduleSlug: string,
  lessonSlug: string,
  progress: IluStripProgress = {}
): { mapped: boolean; hubId?: HubId; items: IluStripItem[]; trackBCardCount?: number } {
  const unit = getLessonUnit(moduleSlug, lessonSlug);
  if (!unit) {
    return { mapped: false, items: [] };
  }

  const hubId = getModuleHubId(moduleSlug) ?? getHubForModule(moduleSlug)?.id;
  const items = buildTrackAStripItems(unit.iluLinks, { moduleSlug, lessonSlug, hubId }, progress);

  return {
    mapped: true,
    hubId,
    items,
    trackBCardCount: unit.trackB.cards.estimatedCount,
  };
}
