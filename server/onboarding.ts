/**
 * Onboarding — deterministic path assignment and analytics tracking.
 * No AI. No placeholder content. Only maps to existing published modules.
 */
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { users, onboardingEvents, courseModules, courseLessons, userProgress } from "../drizzle/schema";

// ─── Types ──────────────────────────────────────────────────────────────────────

export type Persona = "operator" | "new_tech" | "experienced_tech" | "controls_tech" | "leader";
export type ExperienceLevel = "none" | "basic" | "developing" | "experienced";
export type Goal = "move_to_maintenance" | "build_troubleshooting" | "improve_plc" | "improve_vfd" | "more_responsibility" | "manage_team";

interface AssignedPath {
  id: string;
  label: string;
  description: string;
  modules: { slug: string; title: string; reason: string }[];
  firstLesson: { moduleSlug: string; lessonSlug: string; title: string; estimatedMinutes: number; why: string };
}

// ─── Deterministic Path Mappings ────────────────────────────────────────────────
// Only references modules that exist with published lessons.

const PATHS: Record<string, AssignedPath> = {
  operator_to_tech: {
    id: "operator_to_tech",
    label: "Operator to Maintenance Tech",
    description: "Build the foundation every maintenance technician needs — from orientation through safety, meter skills, print reading, motor control, and your first guided diagnosis.",
    modules: [
      { slug: "maintenance-orientation", title: "Industrial Maintenance Orientation", reason: "Understand what maintenance techs do and how they think" },
      { slug: "safety-systems", title: "Safety Systems", reason: "Safety and authorization come before any troubleshooting" },
      { slug: "electrical-fundamentals", title: "Electrical Fundamentals", reason: "Learn the language of electricity" },
      { slug: "basic-meter-usage", title: "Basic Meter Usage", reason: "Learn to use your primary diagnostic tool safely" },
      { slug: "print-reading", title: "Print Reading (Electrical)", reason: "Read the blueprints techs use daily" },
      { slug: "motors-controls", title: "Motors & Motor Controls", reason: "Understand the machines you'll maintain" },
      { slug: "guided-beginner-troubleshooting", title: "Guided Beginner Troubleshooting", reason: "Your first guided diagnostic — apply the method" },
      { slug: "plc-fundamentals", title: "PLC Fundamentals", reason: "Read the controller that runs the line" },
    ],
    firstLesson: {
      moduleSlug: "maintenance-orientation",
      lessonSlug: "what-maintenance-techs-do",
      title: "What Maintenance Technicians Actually Do",
      estimatedMinutes: 5,
      why: "Before you learn any technical skill, understand what the job actually involves — the roles, the method, and why technicians verify before they replace.",
    },
  },
  troubleshooting_builder: {
    id: "troubleshooting_builder",
    label: "Troubleshooting Skills Builder",
    description: "Strengthen your diagnostic method — from reading ladder logic to isolating faults with a meter.",
    modules: [
      { slug: "electrical-fundamentals", title: "Electrical Fundamentals", reason: "Solidify the basics" },
      { slug: "plc-fundamentals", title: "PLC Fundamentals", reason: "Core troubleshooting skill" },
      { slug: "motors-controls", title: "Motors & Motor Controls", reason: "Most common failures" },
      { slug: "powerflex-vfd", title: "PowerFlex VFD", reason: "VFD faults are everywhere" },
    ],
    firstLesson: {
      moduleSlug: "electrical-fundamentals",
      lessonSlug: "ohms-law-power",
      title: "Ohm's Law & Power Calculations",
      estimatedMinutes: 10,
      why: "Every measurement you take with a meter depends on understanding voltage, current, and resistance. This is the foundation of every diagnosis.",
    },
  },
  advanced_diagnostics: {
    id: "advanced_diagnostics",
    label: "Advanced Diagnostics",
    description: "Push past intermediate — network troubleshooting, VFD internals, and complex multi-fault scenarios.",
    modules: [
      { slug: "plc-fundamentals", title: "PLC Fundamentals", reason: "Advanced ladder logic and comms" },
      { slug: "powerflex-vfd", title: "PowerFlex VFD", reason: "Deep VFD troubleshooting" },
      { slug: "industrial-networking", title: "Industrial Networking", reason: "EtherNet/IP, DLR, comms faults" },
    ],
    firstLesson: {
      moduleSlug: "plc-fundamentals",
      lessonSlug: "plc-fundamentals-intro",
      title: "PLC Architecture & Operation",
      estimatedMinutes: 15,
      why: "You already know the basics. This takes you deeper into scan cycles, memory structure, and how to trace faults through complex programs.",
    },
  },
  controls_specialist: {
    id: "controls_specialist",
    label: "Controls Specialist",
    description: "Expand into networking, robotics, and process control — the skills that separate a tech from a controls engineer.",
    modules: [
      { slug: "industrial-networking", title: "Industrial Networking", reason: "Network architecture and troubleshooting" },
      { slug: "robotics-fundamentals", title: "Robotics Fundamentals", reason: "Robot integration and faults" },
      { slug: "process-control", title: "Process Control", reason: "PID, instrumentation, loop tuning" },
    ],
    firstLesson: {
      moduleSlug: "industrial-networking",
      lessonSlug: "industrial-networking-intro",
      title: "Industrial Network Architecture",
      estimatedMinutes: 12,
      why: "Modern plants run on networks. Understanding EtherNet/IP topology, DLR rings, and managed switches is essential for controls work.",
    },
  },
};

// ─── Path Assignment Logic ──────────────────────────────────────────────────────

function assignPath(persona: Persona, experience: ExperienceLevel, goal: Goal): AssignedPath | null {
  // Leaders go to manager portal — no learning path assigned
  if (persona === "leader") return null;

  // Operator + none/basic + move to maintenance → operator_to_tech
  if (persona === "operator" && (experience === "none" || experience === "basic") && goal === "move_to_maintenance") {
    return PATHS.operator_to_tech;
  }

  // Operator + any experience + any other goal → operator_to_tech (safest default)
  if (persona === "operator") {
    return PATHS.operator_to_tech;
  }

  // New tech + none/basic → operator_to_tech
  if (persona === "new_tech" && (experience === "none" || experience === "basic")) {
    return PATHS.operator_to_tech;
  }

  // New tech + developing/experienced → troubleshooting_builder
  if (persona === "new_tech") {
    return PATHS.troubleshooting_builder;
  }

  // Experienced tech + PLC/VFD goals → advanced_diagnostics
  if (persona === "experienced_tech" && (goal === "improve_plc" || goal === "improve_vfd")) {
    return PATHS.advanced_diagnostics;
  }

  // Experienced tech + more responsibility → controls_specialist
  if (persona === "experienced_tech" && goal === "more_responsibility") {
    return PATHS.controls_specialist;
  }

  // Experienced tech + anything else → troubleshooting_builder
  if (persona === "experienced_tech") {
    return PATHS.troubleshooting_builder;
  }

  // Controls tech → controls_specialist
  if (persona === "controls_tech") {
    return PATHS.controls_specialist;
  }

  // Fallback
  return PATHS.troubleshooting_builder;
}

// ─── Router ─────────────────────────────────────────────────────────────────────

export const onboardingRouter = router({
  /** Complete onboarding with new 3-step answers and get assigned path */
  complete: protectedProcedure
    .input(z.object({
      persona: z.enum(["operator", "new_tech", "experienced_tech", "controls_tech", "leader"]),
      experience: z.enum(["none", "basic", "developing", "experienced"]),
      goal: z.enum(["move_to_maintenance", "build_troubleshooting", "improve_plc", "improve_vfd", "more_responsibility", "manage_team"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const path = assignPath(input.persona, input.experience, input.goal);

      // Fail-safe: leaders don't get a learning path (they go to manager portal)
      // All other personas MUST receive a path — do not silently mark complete without one
      if (!path && input.persona !== "leader") {
        console.error(`[Onboarding] Path assignment failed for user ${ctx.user.id}: persona=${input.persona}, experience=${input.experience}, goal=${input.goal}`);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to assign a training path. Please try again." });
      }

      const selections = {
        persona: input.persona,
        experience: input.experience,
        goal: input.goal,
        assignedPathId: path?.id ?? null,
        firstLessonSlug: path?.firstLesson.lessonSlug ?? null,
        completedAt: Date.now(),
      };

      await db.update(users).set({
        onboardingCompleted: true,
        onboardingSelections: selections,
      }).where(eq(users.id, ctx.user.id));

      // Track analytics
      await db.insert(onboardingEvents).values({
        userId: ctx.user.id,
        event: "onboarding_completed",
        meta: selections,
      });

      return {
        path,
        redirectTo: path ? null : "/manager",
      };
    }),

  /** Get the user's assigned path with progress */
  getMyPath: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const [user] = await db.select({
      onboardingCompleted: users.onboardingCompleted,
      onboardingSelections: users.onboardingSelections,
    }).from(users).where(eq(users.id, ctx.user.id)).limit(1);

    if (!user?.onboardingCompleted || !user.onboardingSelections) return null;

    const sel = user.onboardingSelections as any;
    const pathId = sel.assignedPathId;
    if (!pathId || !PATHS[pathId]) return null;

    const path = PATHS[pathId];

    // Get module IDs for progress calculation
    const allModules = await db.select({
      id: courseModules.id,
      slug: courseModules.slug,
      totalLessons: courseModules.totalLessons,
    }).from(courseModules);

    const moduleMap = new Map(allModules.map(m => [m.slug, m]));

    // Get user's completed lessons
    const completed = await db.select({
      moduleId: userProgress.moduleId,
      lessonId: userProgress.lessonId,
    }).from(userProgress).where(eq(userProgress.userId, ctx.user.id));

    const completedByModule = new Map<number, number>();
    for (const c of completed) {
      completedByModule.set(c.moduleId, (completedByModule.get(c.moduleId) || 0) + 1);
    }

    // Build progress for each module in the path
    const modulesWithProgress = path.modules.map(pm => {
      const dbModule = moduleMap.get(pm.slug);
      const total = dbModule?.totalLessons ?? 0;
      const done = dbModule ? (completedByModule.get(dbModule.id) || 0) : 0;
      return {
        ...pm,
        moduleId: dbModule?.id ?? null,
        totalLessons: total,
        completedLessons: done,
        percentComplete: total > 0 ? Math.round((done / total) * 100) : 0,
        isComplete: total > 0 && done >= total,
      };
    });

    // Find current module (first incomplete)
    const currentModuleIndex = modulesWithProgress.findIndex(m => !m.isComplete);
    const currentModule = currentModuleIndex >= 0 ? modulesWithProgress[currentModuleIndex] : null;

    // Find next lesson in current module
    let nextLesson: { slug: string; title: string; moduleSlug: string } | null = null;
    if (currentModule && currentModule.moduleId) {
      const lessons = await db.select({
        id: courseLessons.id,
        slug: courseLessons.slug,
        title: courseLessons.title,
        orderIndex: courseLessons.orderIndex,
      }).from(courseLessons)
        .where(eq(courseLessons.moduleId, currentModule.moduleId))
        .orderBy(asc(courseLessons.orderIndex));

      const completedLessonIds = new Set(
        completed.filter(c => c.moduleId === currentModule.moduleId).map(c => c.lessonId)
      );

      const next = lessons.find(l => !completedLessonIds.has(l.id));
      if (next) {
        nextLesson = { slug: next.slug, title: next.title, moduleSlug: currentModule.slug };
      }
    }

    // Overall progress
    const totalLessons = modulesWithProgress.reduce((s, m) => s + m.totalLessons, 0);
    const totalCompleted = modulesWithProgress.reduce((s, m) => s + m.completedLessons, 0);

    return {
      path: {
        id: path.id,
        label: path.label,
        description: path.description,
      },
      modules: modulesWithProgress,
      currentModule: currentModule ? { slug: currentModule.slug, title: currentModule.title } : null,
      nextLesson,
      firstLesson: path.firstLesson,
      totalLessons,
      totalCompleted,
      percentComplete: totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0,
      isComplete: totalCompleted >= totalLessons && totalLessons > 0,
    };
  }),

  /** Track an onboarding analytics event */
  trackEvent: protectedProcedure
    .input(z.object({
      event: z.string().max(60),
      meta: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db.insert(onboardingEvents).values({
        userId: ctx.user.id,
        event: input.event,
        meta: input.meta ?? null,
      });
      return { success: true };
    }),
});
