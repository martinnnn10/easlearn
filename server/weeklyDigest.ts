/**
 * Weekly XP Digest Service
 * 
 * Compiles weekly learner statistics and sends a summary notification
 * to the platform owner. Can also generate per-user digest data
 * for display on the Dashboard.
 */
import { getDb } from "./db";
import { sql } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

export interface UserWeeklyStats {
  userId: number;
  userName: string;
  email: string | null;
  lessonsCompleted: number;
  quizzesPassed: number;
  quizPoints: number;
  scenariosCompleted: number;
  totalXP: number;
  rank: number;
  rankChange: number; // positive = moved up, negative = moved down, 0 = unchanged
}

export interface WeeklyDigestData {
  periodStart: string;
  periodEnd: string;
  totalActiveLearners: number;
  newUsersThisWeek: number;
  totalLessonsCompleted: number;
  totalQuizzesPassed: number;
  totalScenariosCompleted: number;
  topLearners: UserWeeklyStats[];
  mostActiveModule: string | null;
  platformTotalXP: number;
}

/**
 * Generate the weekly digest data by querying the database
 */
export async function generateWeeklyDigest(): Promise<WeeklyDigestData | null> {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const periodStart = weekAgo.toISOString().split("T")[0];
  const periodEnd = now.toISOString().split("T")[0];

  try {
    // Active learners this week (users who completed at least one lesson or quiz)
    const [activeResult] = await db.execute(sql.raw(`
      SELECT COUNT(DISTINCT userId) AS cnt FROM (
        SELECT userId FROM user_progress WHERE completed = 1 AND completedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        UNION
        SELECT userId FROM quiz_attempts WHERE completedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ) active_users
    `)) as any;
    const totalActiveLearners = Number(activeResult?.[0]?.cnt || 0);

    // New users this week
    const [newUsersResult] = await db.execute(sql.raw(`
      SELECT COUNT(*) AS cnt FROM users WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `)) as any;
    const newUsersThisWeek = Number(newUsersResult?.[0]?.cnt || 0);

    // Total lessons completed this week
    const [lessonsResult] = await db.execute(sql.raw(`
      SELECT COUNT(*) AS cnt FROM user_progress WHERE completed = 1 AND completedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `)) as any;
    const totalLessonsCompleted = Number(lessonsResult?.[0]?.cnt || 0);

    // Total quizzes passed this week
    const [quizzesResult] = await db.execute(sql.raw(`
      SELECT COUNT(*) AS cnt FROM quiz_attempts WHERE passed = 1 AND completedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `)) as any;
    const totalQuizzesPassed = Number(quizzesResult?.[0]?.cnt || 0);

    // Total scenarios completed this week
    const [scenariosResult] = await db.execute(sql.raw(`
      SELECT COUNT(*) AS cnt FROM scenario_completions WHERE completedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `)) as any;
    const totalScenariosCompleted = Number(scenariosResult?.[0]?.cnt || 0);

    // Top 10 learners by XP earned this week
    const [topLearnersRaw] = await db.execute(sql.raw(`
      SELECT
        u.id AS userId,
        u.name AS userName,
        u.email,
        COALESCE(lp.lessons_completed, 0) AS lessonsCompleted,
        COALESCE(qa.quiz_points, 0) AS quizPoints,
        COALESCE(qa.quizzes_passed, 0) AS quizzesPassed,
        COALESCE(sc.scenarios_done, 0) AS scenariosCompleted,
        (COALESCE(lp.lessons_completed, 0) * 10 + COALESCE(qa.quiz_points, 0) * 2 + COALESCE(sc.scenarios_done, 0) * 25) AS totalXP
      FROM users u
      LEFT JOIN (
        SELECT userId, COUNT(*) AS lessons_completed
        FROM user_progress
        WHERE completed = 1 AND completedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY userId
      ) lp ON lp.userId = u.id
      LEFT JOIN (
        SELECT userId, SUM(score) AS quiz_points, SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) AS quizzes_passed
        FROM quiz_attempts
        WHERE completedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY userId
      ) qa ON qa.userId = u.id
      LEFT JOIN (
        SELECT userId, COUNT(*) AS scenarios_done
        FROM scenario_completions
        WHERE completedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY userId
      ) sc ON sc.userId = u.id
      WHERE (COALESCE(lp.lessons_completed, 0) + COALESCE(qa.quiz_points, 0) + COALESCE(sc.scenarios_done, 0)) > 0
      ORDER BY totalXP DESC
      LIMIT 10
    `)) as any;

    const topLearners: UserWeeklyStats[] = (topLearnersRaw || []).map((row: any, idx: number) => ({
      userId: Number(row.userId),
      userName: row.userName || "Anonymous Learner",
      email: row.email || null,
      lessonsCompleted: Number(row.lessonsCompleted),
      quizzesPassed: Number(row.quizzesPassed),
      quizPoints: Number(row.quizPoints),
      scenariosCompleted: Number(row.scenariosCompleted),
      totalXP: Number(row.totalXP),
      rank: idx + 1,
      rankChange: 0, // Would need previous week data to compute
    }));

    // Most active module this week
    const [moduleResult] = await db.execute(sql.raw(`
      SELECT cm.title, COUNT(*) AS completions
      FROM user_progress up
      JOIN course_lessons cl ON cl.id = up.lessonId
      JOIN course_modules cm ON cm.id = cl.moduleId
      WHERE up.completed = 1 AND up.completedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY cm.id, cm.title
      ORDER BY completions DESC
      LIMIT 1
    `)) as any;
    const mostActiveModule = moduleResult?.[0]?.title || null;

    // Platform total XP earned this week
    const platformTotalXP = topLearners.reduce((sum, l) => sum + l.totalXP, 0);

    return {
      periodStart,
      periodEnd,
      totalActiveLearners,
      newUsersThisWeek,
      totalLessonsCompleted,
      totalQuizzesPassed,
      totalScenariosCompleted,
      topLearners,
      mostActiveModule,
      platformTotalXP,
    };
  } catch (error) {
    console.error("[WeeklyDigest] Error generating digest:", error);
    return null;
  }
}

/**
 * Format the digest data into a readable notification message
 */
export function formatDigestNotification(data: WeeklyDigestData): { title: string; content: string } {
  const title = `EAS Weekly Digest: ${data.periodStart} – ${data.periodEnd}`;

  const leaderboardLines = data.topLearners.slice(0, 5).map((l, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
    return `${medal} ${l.userName} — ${l.totalXP} XP (${l.lessonsCompleted} lessons, ${l.quizzesPassed} quizzes, ${l.scenariosCompleted} scenarios)`;
  });

  const content = [
    `Weekly Platform Summary`,
    `═══════════════════════`,
    ``,
    `Active Learners: ${data.totalActiveLearners}`,
    `New Signups: ${data.newUsersThisWeek}`,
    `Lessons Completed: ${data.totalLessonsCompleted}`,
    `Quizzes Passed: ${data.totalQuizzesPassed}`,
    `Scenarios Completed: ${data.totalScenariosCompleted}`,
    `Total XP Earned: ${data.platformTotalXP}`,
    data.mostActiveModule ? `Most Active Module: ${data.mostActiveModule}` : "",
    ``,
    `Top Learners This Week`,
    `──────────────────────`,
    ...leaderboardLines,
    leaderboardLines.length === 0 ? "(No activity this week)" : "",
  ].filter(Boolean).join("\n");

  return { title, content };
}

/**
 * Generate and send the weekly digest notification to the platform owner
 */
export async function sendWeeklyDigest(): Promise<{ success: boolean; data: WeeklyDigestData | null }> {
  const data = await generateWeeklyDigest();
  if (!data) {
    return { success: false, data: null };
  }

  const { title, content } = formatDigestNotification(data);
  const sent = await notifyOwner({ title, content });

  if (sent) {
    console.log("[WeeklyDigest] Digest sent successfully");
  } else {
    console.warn("[WeeklyDigest] Failed to send digest notification");
  }

  return { success: sent, data };
}
