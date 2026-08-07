/**
 * Legacy User Repair — classifies and fixes users who completed the old onboarding
 * wizard but have no deterministic assigned path.
 *
 * Classification:
 * A. Existing answers can map deterministically → create the missing assigned path
 * B. Existing answers are incomplete/incompatible → mark onboarding incomplete for re-onboarding
 * C. User has legitimate course progress but no path → preserve progress, create recommended path
 * D. Manager/admin account → do not assign an operator learning path
 *
 * Does NOT:
 * - Erase completed lessons
 * - Overwrite valid current paths
 * - Silently mark users complete
 * - Create fake assignments
 */
import { eq, and, gt } from "drizzle-orm";
import { getDb } from "./db";
import { users, userProgress } from "../drizzle/schema";

interface RepairResult {
  userId: number;
  email: string | null;
  classification: "A" | "B" | "C" | "D" | "SKIP";
  action: string;
  previousState: any;
  newState: any;
}

// Map old wizard answers to new path IDs
function mapLegacyAnswersToPath(selections: any): string | null {
  if (!selections) return null;

  const experience = selections.experienceLevel;
  const goals = selections.goals || [];
  const equipment = selections.equipment || [];

  // If they said "new to the trade" or "student" → operator_to_tech
  if (experience === "new" || experience === "student" || experience === "beginner") {
    return "operator_to_tech";
  }

  // If they have PLC/VFD goals → advanced_diagnostics
  if (goals.includes("plc") || goals.includes("vfd") || goals.includes("advanced_troubleshooting")) {
    return "advanced_diagnostics";
  }

  // If they have controls/networking goals → controls_specialist
  if (goals.includes("controls") || goals.includes("networking") || goals.includes("robotics")) {
    return "controls_specialist";
  }

  // If they have troubleshooting goals → troubleshooting_builder
  if (goals.includes("troubleshooting") || goals.includes("electrical") || goals.includes("motors")) {
    return "troubleshooting_builder";
  }

  // If they selected specific equipment → troubleshooting_builder
  if (equipment.length > 0) {
    return "troubleshooting_builder";
  }

  // Cannot map deterministically
  return null;
}

export async function repairLegacyUsers(dryRun = true): Promise<RepairResult[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const results: RepairResult[] = [];

  // Find all users with onboardingCompleted=true
  const allCompleted = await db.select({
    id: users.id,
    email: users.email,
    role: users.role,
    onboardingCompleted: users.onboardingCompleted,
    onboardingSelections: users.onboardingSelections,
  }).from(users).where(eq(users.onboardingCompleted, true));

  for (const user of allCompleted) {
    const selections = user.onboardingSelections as any;

    // Check if this user already has a valid new-system path
    if (selections?.assignedPathId) {
      // Already has a valid path from the new system — skip
      results.push({
        userId: user.id,
        email: user.email,
        classification: "SKIP",
        action: "Already has valid assigned path",
        previousState: selections,
        newState: null,
      });
      continue;
    }

    // Case D: Manager/admin — do not assign operator path
    if (user.role === "admin") {
      results.push({
        userId: user.id,
        email: user.email,
        classification: "D",
        action: "Manager/admin — no operator path assigned",
        previousState: selections,
        newState: null,
      });
      continue;
    }

    // Check if user has legitimate course progress
    const progressCount = await db.select({ id: userProgress.id })
      .from(userProgress)
      .where(eq(userProgress.userId, user.id));
    const hasProgress = progressCount.length > 0;

    // Case A: Try to map existing answers to a valid path
    const mappedPathId = mapLegacyAnswersToPath(selections);

    if (mappedPathId) {
      // Case A or C: Can map to a path
      const newSelections = {
        ...(selections || {}),
        assignedPathId: mappedPathId,
        repairedAt: Date.now(),
        repairReason: hasProgress ? "Case C: progress preserved, path created" : "Case A: legacy answers mapped",
      };

      if (!dryRun) {
        await db.update(users).set({
          onboardingSelections: newSelections,
        }).where(eq(users.id, user.id));
      }

      results.push({
        userId: user.id,
        email: user.email,
        classification: hasProgress ? "C" : "A",
        action: `Assigned path: ${mappedPathId}${hasProgress ? " (progress preserved)" : ""}`,
        previousState: selections,
        newState: newSelections,
      });
      continue;
    }

    // Case B: Cannot map — mark onboarding incomplete for re-onboarding
    if (!hasProgress) {
      if (!dryRun) {
        await db.update(users).set({
          onboardingCompleted: false,
          onboardingSelections: {
            ...(selections || {}),
            repairedAt: Date.now(),
            repairReason: "Case B: incomplete answers, re-onboarding required",
          },
        }).where(eq(users.id, user.id));
      }

      results.push({
        userId: user.id,
        email: user.email,
        classification: "B",
        action: "Marked onboarding incomplete — user will be sent through /onboarding",
        previousState: selections,
        newState: { onboardingCompleted: false },
      });
      continue;
    }

    // Case C with unmappable answers: has progress but can't determine path
    // Default to troubleshooting_builder (safest for someone with existing progress)
    const fallbackSelections = {
      ...(selections || {}),
      assignedPathId: "troubleshooting_builder",
      repairedAt: Date.now(),
      repairReason: "Case C: unmappable answers with progress, defaulted to troubleshooting_builder",
    };

    if (!dryRun) {
      await db.update(users).set({
        onboardingSelections: fallbackSelections,
      }).where(eq(users.id, user.id));
    }

    results.push({
      userId: user.id,
      email: user.email,
      classification: "C",
      action: "Assigned fallback path: troubleshooting_builder (progress preserved)",
      previousState: selections,
      newState: fallbackSelections,
    });
  }

  return results;
}
