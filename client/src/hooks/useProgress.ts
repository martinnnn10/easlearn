/**
 * useProgress - localStorage-based progress tracking for the EAS simulator
 * Tracks completed scenarios, best scores, time records, and overall stats.
 */

import { useState, useCallback, useEffect } from "react";

export interface ScenarioRecord {
  scenarioId: string;
  scenarioTitle: string;
  bestScore: number;
  bestPercentage: number;
  bestGrade: string;
  bestTime: number; // seconds
  attempts: number;
  lastCompleted: string; // ISO date string
}

export interface ProgressData {
  records: ScenarioRecord[];
  totalCompleted: number;
  totalAttempts: number;
  averageScore: number;
  averageTime: number;
  lastActivity: string;
}

const STORAGE_KEY = "eas-simulator-progress";

function getDefaultProgress(): ProgressData {
  return {
    records: [],
    totalCompleted: 0,
    totalAttempts: 0,
    averageScore: 0,
    averageTime: 0,
    lastActivity: "",
  };
}

function loadProgress(): ProgressData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as ProgressData;
    }
  } catch {
    // If localStorage is unavailable or corrupted, start fresh
  }
  return getDefaultProgress();
}

function saveProgress(data: ProgressData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silently fail if localStorage is full or unavailable
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressData>(loadProgress);

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const recordCompletion = useCallback(
    (result: {
      scenarioId: string;
      scenarioTitle: string;
      score: number;
      percentage: number;
      grade: string;
      timeSeconds: number;
    }) => {
      setProgress((prev) => {
        const existingIndex = prev.records.findIndex(
          (r) => r.scenarioId === result.scenarioId
        );
        const now = new Date().toISOString();
        let records: ScenarioRecord[];

        if (existingIndex >= 0) {
          // Update existing record if new score is better
          records = [...prev.records];
          const existing = records[existingIndex];
          records[existingIndex] = {
            ...existing,
            bestScore: Math.max(existing.bestScore, result.score),
            bestPercentage: Math.max(existing.bestPercentage, result.percentage),
            bestGrade:
              result.percentage > existing.bestPercentage
                ? result.grade
                : existing.bestGrade,
            bestTime: Math.min(existing.bestTime, result.timeSeconds),
            attempts: existing.attempts + 1,
            lastCompleted: now,
          };
        } else {
          // Add new record
          records = [
            ...prev.records,
            {
              scenarioId: result.scenarioId,
              scenarioTitle: result.scenarioTitle,
              bestScore: result.score,
              bestPercentage: result.percentage,
              bestGrade: result.grade,
              bestTime: result.timeSeconds,
              attempts: 1,
              lastCompleted: now,
            },
          ];
        }

        const totalCompleted = records.length;
        const totalAttempts = records.reduce((sum, r) => sum + r.attempts, 0);
        const averageScore =
          records.length > 0
            ? Math.round(
                records.reduce((sum, r) => sum + r.bestPercentage, 0) /
                  records.length
              )
            : 0;
        const averageTime =
          records.length > 0
            ? Math.round(
                records.reduce((sum, r) => sum + r.bestTime, 0) / records.length
              )
            : 0;

        return {
          records,
          totalCompleted,
          totalAttempts,
          averageScore,
          averageTime,
          lastActivity: now,
        };
      });
    },
    []
  );

  const getScenarioRecord = useCallback(
    (scenarioId: string): ScenarioRecord | undefined => {
      return progress.records.find((r) => r.scenarioId === scenarioId);
    },
    [progress.records]
  );

  const resetProgress = useCallback(() => {
    const fresh = getDefaultProgress();
    setProgress(fresh);
    saveProgress(fresh);
  }, []);

  return {
    progress,
    recordCompletion,
    getScenarioRecord,
    resetProgress,
  };
}
