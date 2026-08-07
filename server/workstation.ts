/**
 * Motor Control Diagnostic Workstation — Production Router
 *
 * Handles:
 *   workstation.checkAccess       — verify feature flag for current user
 *   workstation.startAttempt      — create a real persisted attempt
 *   workstation.getAttempt        — fetch attempt with authorization
 *   workstation.getActiveAttempt  — find in-progress attempt for resume
 *   workstation.saveState         — persist machine state for resume
 *   workstation.recordEvent       — append diagnostic event (idempotent)
 *   workstation.getEvents         — fetch event timeline for an attempt
 *   workstation.completeAttempt   — finalize diagnosis + corrective action
 *   workstation.abandonAttempt    — mark attempt abandoned
 *   workstation.assignWorkstation — manager assigns workstation to team members
 *   workstation.myAssignments     — learner's workstation assignments
 *   workstation.teamAssignments   — manager's view of team assignments
 *
 * Authorization rules:
 *   - Learner can only access their own attempts
 *   - Manager can only access attempts for learners they manage
 *   - Feature flag gates access to the workstation
 */
import { z } from "zod";
import { eq, and, inArray, desc, isNull } from "drizzle-orm";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  workstationAttempts,
  workstationDiagnosticEvents,
  workstationAssignments,
  workstationFeatureFlags,
  workstationValidations,
  teamMembers,
  competencyEvidence,
} from "../drizzle/schema";
import { managedMemberIds } from "./competencyGraph";
import { TRPCError } from "@trpc/server";
import type { SkillDomain } from "../shared/competencyMatrix";

// ── Feature Flag Check ──────────────────────────────────────────────────────────

async function hasWorkstationAccess(db: any, userId: number, userRole: string): Promise<boolean> {
  // Check role-based flag
  const roleFlags = await db.select().from(workstationFeatureFlags)
    .where(and(
      eq(workstationFeatureFlags.entityType, "role"),
      eq(workstationFeatureFlags.entityId, userRole),
      eq(workstationFeatureFlags.feature, "motor_control_workstation"),
      eq(workstationFeatureFlags.enabled, true),
    ));
  if (roleFlags.length > 0) return true;

  // Check user-based flag
  const userFlags = await db.select().from(workstationFeatureFlags)
    .where(and(
      eq(workstationFeatureFlags.entityType, "user"),
      eq(workstationFeatureFlags.entityId, String(userId)),
      eq(workstationFeatureFlags.feature, "motor_control_workstation"),
      eq(workstationFeatureFlags.enabled, true),
    ));
  if (userFlags.length > 0) return true;

  // Check team-based flag
  const userTeams = await db.select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.status, "active")));
  if (userTeams.length > 0) {
    const teamIds = userTeams.map((t: any) => String(t.teamId));
    const teamFlags = await db.select().from(workstationFeatureFlags)
      .where(and(
        eq(workstationFeatureFlags.entityType, "team"),
        inArray(workstationFeatureFlags.entityId, teamIds),
        eq(workstationFeatureFlags.feature, "motor_control_workstation"),
        eq(workstationFeatureFlags.enabled, true),
      ));
    if (teamFlags.length > 0) return true;
  }

  return false;
}

// ── Authorization Helpers ───────────────────────────────────────────────────────

async function assertOwnsAttempt(db: any, attemptId: number, userId: number) {
  const [attempt] = await db.select({ userId: workstationAttempts.userId })
    .from(workstationAttempts).where(eq(workstationAttempts.id, attemptId));
  if (!attempt || attempt.userId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this attempt" });
  }
}

async function assertManagesUser(db: any, managerId: number, targetUserId: number) {
  const managed = await managedMemberIds(db, managerId);
  if (!managed.includes(targetUserId)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not manage this user" });
  }
}

// ── Competency Mapping ──────────────────────────────────────────────────────────

/** Map workstation event types to Assessment Spine evidence types and competency domains */
const EVENT_TO_EVIDENCE: Record<string, { evidenceType: string; domain: SkillDomain; competencyId: string }> = {
  measurement_performed: { evidenceType: "live_interaction", domain: "electrical", competencyId: "meter_usage" },
  measurement_predicted: { evidenceType: "prediction", domain: "electrical", competencyId: "electrical_diagnostic_method" },
  measurement_interpreted: { evidenceType: "reasoned_answer", domain: "electrical", competencyId: "electrical_diagnostic_method" },
  hypothesis_created: { evidenceType: "reasoned_answer", domain: "motors", competencyId: "motor_control_troubleshooting" },
  hypothesis_confirmed: { evidenceType: "reasoned_answer", domain: "motors", competencyId: "motor_control_troubleshooting" },
  hypothesis_eliminated: { evidenceType: "reasoned_answer", domain: "motors", competencyId: "motor_control_troubleshooting" },
  unsafe_action_blocked: { evidenceType: "safety_action", domain: "safety", competencyId: "safety_judgment" },
  unsafe_action_attempted: { evidenceType: "safety_action", domain: "safety", competencyId: "safety_judgment" },
  meter_function_selected: { evidenceType: "action_choice", domain: "electrical", competencyId: "meter_usage" },
  test_points_selected: { evidenceType: "action_choice", domain: "electrical", competencyId: "meter_usage" },
  corrective_action_selected: { evidenceType: "action_choice", domain: "motors", competencyId: "repair_verification" },
  repair_verification_performed: { evidenceType: "live_interaction", domain: "motors", competencyId: "repair_verification" },
  diagnosis_submitted: { evidenceType: "diagnosis_submitted", domain: "motors", competencyId: "motor_control_troubleshooting" },
  workstation_completed: { evidenceType: "simulation_completed", domain: "integration", competencyId: "motor_control_troubleshooting" },
  closeout_submitted: { evidenceType: "ai_work_order_documentation", domain: "integration", competencyId: "work_order_documentation" },
};

// ── Router ──────────────────────────────────────────────────────────────────────

export const workstationRouter = router({
  /** Check if the current user has access to the workstation */
  checkAccess: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { hasAccess: false, reason: "database_unavailable" };
    const hasAccess = await hasWorkstationAccess(db, ctx.user.id, ctx.user.role);
    return { hasAccess, reason: hasAccess ? null : "feature_not_enabled" };
  }),

  /** Start a new attempt — creates a persisted record */
  startAttempt: protectedProcedure.input(z.object({
    scenarioId: z.string().min(1),
    faultId: z.string().min(1),
    assignmentId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const hasAccess = await hasWorkstationAccess(db, ctx.user.id, ctx.user.role);
    if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Workstation access not enabled for your account" });

    // Find user's team (if any)
    const [membership] = await db.select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(and(eq(teamMembers.userId, ctx.user.id), eq(teamMembers.status, "active")));

    // If assignmentId provided, verify it belongs to this user
    if (input.assignmentId) {
      const [assignment] = await db.select().from(workstationAssignments)
        .where(and(eq(workstationAssignments.id, input.assignmentId), eq(workstationAssignments.userId, ctx.user.id)));
      if (!assignment) throw new TRPCError({ code: "NOT_FOUND", message: "Assignment not found" });

      // Update assignment status to in_progress
      await db.update(workstationAssignments)
        .set({ status: "in_progress" })
        .where(eq(workstationAssignments.id, input.assignmentId));
    }

    const [result] = await db.insert(workstationAttempts).values({
      userId: ctx.user.id,
      teamId: membership?.teamId ?? null,
      scenarioId: input.scenarioId,
      faultId: input.faultId,
      status: "in_progress",
      assignmentId: input.assignmentId ?? null,
    }).$returningId();

    // Record the initial event
    await db.insert(workstationDiagnosticEvents).values({
      attemptId: result.id,
      userId: ctx.user.id,
      eventType: "scenario_observed",
      detail: { scenarioId: input.scenarioId, faultId: input.faultId },
      idempotencyKey: `${result.id}_scenario_observed_init`,
    });

    return { attemptId: result.id };
  }),

  /** Get a specific attempt (learner: own only, manager: managed users) */
  getAttempt: protectedProcedure.input(z.object({
    attemptId: z.number(),
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [attempt] = await db.select().from(workstationAttempts)
      .where(eq(workstationAttempts.id, input.attemptId));
    if (!attempt) throw new TRPCError({ code: "NOT_FOUND", message: "Attempt not found" });

    // Authorization: own attempt OR managed user
    if (attempt.userId !== ctx.user.id) {
      await assertManagesUser(db, ctx.user.id, attempt.userId);
    }

    return attempt;
  }),

  /** Find the active (in_progress) attempt for the current user on a scenario */
  getActiveAttempt: protectedProcedure.input(z.object({
    scenarioId: z.string().min(1),
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return null;

    const [attempt] = await db.select().from(workstationAttempts)
      .where(and(
        eq(workstationAttempts.userId, ctx.user.id),
        eq(workstationAttempts.scenarioId, input.scenarioId),
        eq(workstationAttempts.status, "in_progress"),
      ))
      .orderBy(desc(workstationAttempts.startedAt))
      .limit(1);

    return attempt ?? null;
  }),

  /** Save machine state for resume */
  saveState: protectedProcedure.input(z.object({
    attemptId: z.number(),
    machineState: z.any(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    await assertOwnsAttempt(db, input.attemptId, ctx.user.id);

    await db.update(workstationAttempts).set({
      machineState: input.machineState,
      lastActivityAt: new Date(),
    }).where(eq(workstationAttempts.id, input.attemptId));

    return { ok: true };
  }),

  /** Record a diagnostic event (idempotent via idempotencyKey) */
  recordEvent: protectedProcedure.input(z.object({
    attemptId: z.number(),
    eventType: z.string().min(1),
    detail: z.any().optional(),
    componentRef: z.string().optional(),
    idempotencyKey: z.string().min(1),
    scenarioVersion: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    await assertOwnsAttempt(db, input.attemptId, ctx.user.id);

    // Duplicate prevention via idempotency key
    try {
      await db.insert(workstationDiagnosticEvents).values({
        attemptId: input.attemptId,
        userId: ctx.user.id,
        eventType: input.eventType,
        detail: input.detail ?? null,
        componentRef: input.componentRef ?? null,
        idempotencyKey: input.idempotencyKey,
        scenarioVersion: input.scenarioVersion ?? null,
      });
    } catch (err: any) {
      // Duplicate key = idempotent success
      if (err?.code === "ER_DUP_ENTRY" || err?.message?.includes("Duplicate entry")) {
        return { ok: true, duplicate: true };
      }
      throw err;
    }

    // Update lastActivityAt
    await db.update(workstationAttempts).set({ lastActivityAt: new Date() })
      .where(eq(workstationAttempts.id, input.attemptId));

    // If this is a safety violation, flag the attempt
    if (input.eventType === "unsafe_action_attempted") {
      await db.update(workstationAttempts).set({ safetyViolation: true })
        .where(eq(workstationAttempts.id, input.attemptId));
    }

    return { ok: true, duplicate: false };
  }),

  /** Get all events for an attempt (learner: own, manager: managed) */
  getEvents: protectedProcedure.input(z.object({
    attemptId: z.number(),
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];

    // Authorization check
    const [attempt] = await db.select({ userId: workstationAttempts.userId })
      .from(workstationAttempts).where(eq(workstationAttempts.id, input.attemptId));
    if (!attempt) throw new TRPCError({ code: "NOT_FOUND" });
    if (attempt.userId !== ctx.user.id) {
      await assertManagesUser(db, ctx.user.id, attempt.userId);
    }

    return db.select().from(workstationDiagnosticEvents)
      .where(eq(workstationDiagnosticEvents.attemptId, input.attemptId))
      .orderBy(workstationDiagnosticEvents.occurredAt);
  }),

  /** Complete an attempt — finalize diagnosis, create Assessment Spine evidence */
  completeAttempt: protectedProcedure.input(z.object({
    attemptId: z.number(),
    finalDiagnosis: z.string().min(1),
    correctiveAction: z.string().min(1),
    repairVerificationResult: z.string().optional(),
    diagnosisCorrect: z.boolean(),
    correctiveActionCorrect: z.boolean(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    await assertOwnsAttempt(db, input.attemptId, ctx.user.id);

    // Verify attempt is in_progress
    const [attempt] = await db.select().from(workstationAttempts)
      .where(eq(workstationAttempts.id, input.attemptId));
    if (!attempt || attempt.status !== "in_progress") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Attempt is not in progress" });
    }

    // Update attempt
    await db.update(workstationAttempts).set({
      status: "completed",
      finalDiagnosis: input.finalDiagnosis,
      correctiveAction: input.correctiveAction,
      repairVerificationResult: input.repairVerificationResult ?? null,
      diagnosisCorrect: input.diagnosisCorrect,
      correctiveActionCorrect: input.correctiveActionCorrect,
      completedAt: new Date(),
      lastActivityAt: new Date(),
    }).where(eq(workstationAttempts.id, input.attemptId));

    // Record completion event
    await db.insert(workstationDiagnosticEvents).values({
      attemptId: input.attemptId,
      userId: ctx.user.id,
      eventType: "workstation_completed",
      detail: {
        finalDiagnosis: input.finalDiagnosis,
        correctiveAction: input.correctiveAction,
        diagnosisCorrect: input.diagnosisCorrect,
        correctiveActionCorrect: input.correctiveActionCorrect,
      },
      idempotencyKey: `${input.attemptId}_workstation_completed`,
    });

    // Get all events for this attempt to create Assessment Spine evidence
    const events = await db.select().from(workstationDiagnosticEvents)
      .where(eq(workstationDiagnosticEvents.attemptId, input.attemptId));

    // Create Assessment Spine evidence from diagnostic events
    const evidenceToInsert: any[] = [];
    const safetyViolation = attempt.safetyViolation || events.some((e: any) => e.eventType === "unsafe_action_attempted");

    // Overall simulation_completed evidence
    evidenceToInsert.push({
      learnerId: ctx.user.id,
      sourceType: "simulation",
      evidenceType: "simulation_completed",
      domain: "motors",
      competencyId: "motor_control_troubleshooting",
      correctness: input.diagnosisCorrect ? "correct" : "incorrect",
      reasoningQuality: input.diagnosisCorrect && input.correctiveActionCorrect ? "sound" : input.diagnosisCorrect ? "weak" : "flawed",
      safetyFlag: safetyViolation,
      detail: {
        attemptId: input.attemptId,
        scenarioId: attempt.scenarioId,
        faultId: attempt.faultId,
        workstationVersion: attempt.workstationVersion,
        eventCount: events.length,
      },
    });

    // Diagnosis evidence
    evidenceToInsert.push({
      learnerId: ctx.user.id,
      sourceType: "simulation",
      evidenceType: "diagnosis_submitted",
      domain: "motors",
      competencyId: "motor_control_troubleshooting",
      correctness: input.diagnosisCorrect ? "correct" : "incorrect",
      safetyFlag: safetyViolation,
      detail: {
        attemptId: input.attemptId,
        diagnosis: input.finalDiagnosis,
        scenarioId: attempt.scenarioId,
      },
    });

    // Safety evidence (if any safety events occurred)
    if (safetyViolation) {
      evidenceToInsert.push({
        learnerId: ctx.user.id,
        sourceType: "simulation",
        evidenceType: "safety_action",
        domain: "safety",
        competencyId: "safety_judgment",
        correctness: "incorrect",
        safetyFlag: true,
        detail: {
          attemptId: input.attemptId,
          scenarioId: attempt.scenarioId,
          violationType: "unsafe_action_during_workstation",
        },
      });
    }

    // Meter usage evidence (if measurements were taken)
    const measurements = events.filter((e: any) => e.eventType === "measurement_performed");
    if (measurements.length > 0) {
      evidenceToInsert.push({
        learnerId: ctx.user.id,
        sourceType: "simulation",
        evidenceType: "live_interaction",
        domain: "electrical",
        competencyId: "meter_usage",
        correctness: input.diagnosisCorrect ? "correct" : "partial",
        detail: {
          attemptId: input.attemptId,
          measurementCount: measurements.length,
          scenarioId: attempt.scenarioId,
        },
      });
    }

    // PLC verification evidence (if PLC-related events occurred)
    const plcEvents = events.filter((e: any) =>
      e.eventType === "component_selected" && (e.detail as any)?.component?.includes("plc")
    );
    if (plcEvents.length > 0) {
      evidenceToInsert.push({
        learnerId: ctx.user.id,
        sourceType: "simulation",
        evidenceType: "live_interaction",
        domain: "plc",
        competencyId: "plc_output_verification",
        correctness: input.diagnosisCorrect ? "correct" : "partial",
        detail: {
          attemptId: input.attemptId,
          plcInteractionCount: plcEvents.length,
          scenarioId: attempt.scenarioId,
        },
      });
    }

    // Batch insert all evidence
    if (evidenceToInsert.length > 0) {
      await db.insert(competencyEvidence).values(evidenceToInsert);
    }

    // Update assignment if this attempt was from an assignment
    if (attempt.assignmentId) {
      await db.update(workstationAssignments).set({
        status: "completed",
        completedAttemptId: input.attemptId,
        completedAt: new Date(),
      }).where(eq(workstationAssignments.id, attempt.assignmentId));
    }

    return {
      ok: true,
      evidenceCreated: evidenceToInsert.length,
      assignmentCompleted: !!attempt.assignmentId,
    };
  }),

  /** Abandon an attempt */
  abandonAttempt: protectedProcedure.input(z.object({
    attemptId: z.number(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await assertOwnsAttempt(db, input.attemptId, ctx.user.id);

    await db.update(workstationAttempts).set({
      status: "abandoned",
      lastActivityAt: new Date(),
    }).where(eq(workstationAttempts.id, input.attemptId));

    return { ok: true };
  }),

  /** Manager assigns workstation to team members */
  assignWorkstation: protectedProcedure.input(z.object({
    userIds: z.array(z.number()).min(1),
    scenarioId: z.string().optional(),
    dueAt: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const managed = await managedMemberIds(db, ctx.user.id);
    const validUserIds = input.userIds.filter(id => managed.includes(id));
    if (validUserIds.length === 0) {
      throw new TRPCError({ code: "FORBIDDEN", message: "No valid team members to assign" });
    }

    // Get team IDs for each user
    const memberships = await db.select({ userId: teamMembers.userId, teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(and(inArray(teamMembers.userId, validUserIds), eq(teamMembers.status, "active")));

    const toInsert = memberships.map(m => ({
      teamId: m.teamId!,
      userId: m.userId!,
      workstationId: "motor_control_workstation",
      scenarioId: input.scenarioId ?? null,
      assignedBy: ctx.user.id,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
    }));

    if (toInsert.length > 0) {
      await db.insert(workstationAssignments).values(toInsert);
    }

    return { assigned: toInsert.length };
  }),

  /** Learner's workstation assignments */
  myAssignments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db.select().from(workstationAssignments)
      .where(eq(workstationAssignments.userId, ctx.user.id))
      .orderBy(desc(workstationAssignments.createdAt));
  }),

  /** Manager's view of team workstation assignments */
  teamAssignments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const managed = await managedMemberIds(db, ctx.user.id);
    if (managed.length === 0) return [];

    return db.select().from(workstationAssignments)
      .where(inArray(workstationAssignments.userId, managed))
      .orderBy(desc(workstationAssignments.createdAt));
  }),

  /** Manager views a specific learner's workstation attempts */
  learnerAttempts: protectedProcedure.input(z.object({
    userId: z.number(),
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];

    await assertManagesUser(db, ctx.user.id, input.userId);

    return db.select().from(workstationAttempts)
      .where(eq(workstationAttempts.userId, input.userId))
      .orderBy(desc(workstationAttempts.startedAt));
  }),

  /** Manager records a validation decision for a workstation attempt */
  validate: protectedProcedure.input(z.object({
    attemptId: z.number(),
    competency: z.string().min(1),
    decision: z.enum(["validated", "needs_additional_demonstration", "needs_coaching", "needs_safety_review"]),
    comment: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Get the attempt to find the learner
    const [attempt] = await db.select().from(workstationAttempts)
      .where(eq(workstationAttempts.id, input.attemptId));
    if (!attempt) throw new TRPCError({ code: "NOT_FOUND" });

    // Verify manager manages this learner
    await assertManagesUser(db, ctx.user.id, attempt.userId);

    // Cannot self-validate
    if (ctx.user.id === attempt.userId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Cannot validate your own attempt" });
    }

    // Record the validation
    await db.insert(workstationValidations).values({
      managerId: ctx.user.id,
      userId: attempt.userId,
      attemptId: input.attemptId,
      competency: input.competency,
      decision: input.decision,
      comment: input.comment ?? null,
    });

    // If validated, create manager_attestation evidence in the Assessment Spine
    if (input.decision === "validated") {
      await db.insert(competencyEvidence).values({
        learnerId: attempt.userId,
        sourceType: "manager_validation",
        evidenceType: "manager_attestation",
        domain: "motors" as SkillDomain,
        competencyId: input.competency,
        correctness: "correct",
        reasoningQuality: "sound",
        detail: {
          attemptId: input.attemptId,
          managerId: ctx.user.id,
          validationDecision: input.decision,
          comment: input.comment,
        },
      });
    }

    return { ok: true };
  }),

  /** Get validations for an attempt */
  getValidations: protectedProcedure.input(z.object({
    attemptId: z.number(),
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];

    // Authorization: own attempt or managed user
    const [attempt] = await db.select({ userId: workstationAttempts.userId })
      .from(workstationAttempts).where(eq(workstationAttempts.id, input.attemptId));
    if (!attempt) return [];
    if (attempt.userId !== ctx.user.id) {
      await assertManagesUser(db, ctx.user.id, attempt.userId);
    }

    return db.select().from(workstationValidations)
      .where(eq(workstationValidations.attemptId, input.attemptId))
      .orderBy(desc(workstationValidations.createdAt));
  }),

  /** Get learner's completed workstation attempts for Skills Passport */
  myCompletedAttempts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db.select().from(workstationAttempts)
      .where(and(
        eq(workstationAttempts.userId, ctx.user.id),
        eq(workstationAttempts.status, "completed"),
      ))
      .orderBy(desc(workstationAttempts.completedAt));
  }),
});
