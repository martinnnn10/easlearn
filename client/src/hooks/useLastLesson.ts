/**
 * useLastLesson — Tracks the last lesson the user was viewing for "Continue where you left off"
 * Stores in localStorage so it persists across sessions
 */
import { useState, useEffect, useCallback } from "react";

interface LastLessonData {
  moduleSlug: string;
  lessonSlug: string;
  moduleTitle: string;
  lessonTitle: string;
  lessonIndex: number;
  totalLessons: number;
  timestamp: number;
}

const STORAGE_KEY = "eas-last-lesson";

export function useLastLesson() {
  const [lastLesson, setLastLesson] = useState<LastLessonData | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const saveLastLesson = useCallback((data: Omit<LastLessonData, "timestamp">) => {
    const entry: LastLessonData = { ...data, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    setLastLesson(entry);
  }, []);

  const clearLastLesson = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setLastLesson(null);
  }, []);

  return { lastLesson, saveLastLesson, clearLastLesson };
}
