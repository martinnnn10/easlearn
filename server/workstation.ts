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
import { eq, and, inArray, desc, asc } from "drizzle-orm";
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
import {
  WORKSTATION_EVENT_TYPES,
  REQUIRED_COMPLETION_EVENTS,
  COMPETENCY_TO_DOMAIN,
  getAnswerKey,
} from "../shared/workstationAnswerKey";

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

// (The former EVENT_TO_EVIDENCE map was dead code — evidence is created at
// completion time in completeAttempt, derived from persisted events.)

// ── Router ──────────────────────────────────────────────────────────────────────

export const workstationRouter = router({
  /** Check if the current user has access to the workstation */
  checkAccess: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { hasAccess: false, reason: "database_unavailable" };
    const hasAccess = await hasWorkstationAccess(db, ctx.user.id, ctx.user.role);
    return { hasAccess, reason: hasAccess ? null : "feature_not_enabled" };
  }),

  /** Start OR RESUME an attempt — server-authoritative resume-or-create.
   *  If an in_progress attempt exists for (user, scenario) it is returned
   *  (with saved machineState) instead of creating a duplicate. Refreshes,
   *  rerenders, and double-clicks therefore cannot fork attempts. */
  startAttempt: protectedProcedure.input(z.object({
    scenarioId: z.string().min(1),
    faultId: z.string().min(1),
    assignmentId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const hasAccess = await hasWorkstationAccess(db, ctx.user.id, ctx.user.role);
    if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN", message: "Workstation access not enabled for your account" });

    // If assignmentId provided, verify it belongs to this user (before any writes)
    if (input.assignmentId) {
      const [assignment] = await db.select().from(workstationAssignments)
        .where(and(eq(workstationAssignments.id, input.assignmentId), eq(workstationAssignments.userId, ctx.user.id)));
      if (!assignment) throw new TRPCError({ code: "NOT_FOUND", message: "Assignment not found" });
    }

    // RESUME: an existing in_progress attempt for this scenario wins
    const [existing] = await db.select().from(workstationAttempts)
      .where(and(
        eq(workstationAttempts.userId, ctx.user.id),
        eq(workstationAttempts.scenarioId, input.scenarioId),
        eq(workstationAttempts.status, "in_progress"),
      ))
      .orderBy(desc(workstationAttempts.startedAt))
      .limit(1);

    if (existing) {
      // Late-link assignment if this resume came from an assignment CTA
      if (input.assignmentId && !existing.assignmentId) {
        await db.update(workstationAttempts)
          .set({ assignmentId: input.assignmentId, lastActivityAt: new Date() })
          .where(eq(workstationAttempts.id, existing.id));
      }
      if (input.assignmentId) {
        await db.update(workstationAssignments)
          .set({ status: "in_progress" })
          .where(and(eq(workstationAssignments.id, input.assignmentId), eq(workstationAssignments.status, "not_started")));
      }
      return {
        attemptId: existing.id,
        resumed: true,
        machineState: existing.machineState ?? null,
        safetyViolation: existing.safetyViolation,
      };
    }

    // CREATE: no in_progress attempt exists
    const [membership] = await db.select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(and(eq(teamMembers.userId, ctx.user.id), eq(teamMembers.status, "active")));

    if (input.assignmentId) {
      await db.update(workstationAssignments)
        .set({ status: "in_progress" })
        .where(eq(workstationAssignments.id, input.assignmentId));
    }

    const key = getAnswerKey(input.scenarioId);
    const [result] = await db.insert(workstationAttempts).values({
      userId: ctx.user.id,
      teamId: membership?.teamId ?? null,
      scenarioId: input.scenarioId,
      faultId: input.faultId,
      scenarioVersion: key?.scenarioVersion ?? "1.0",
      status: "in_progress",
      assignmentId: input.assignmentId ?? null,
    }).$returningId();

    // Record the initial event
    await db.insert(workstationDiagnosticEvents).values({
      attemptId: result.id,
      userId: ctx.user.id,
      eventType: "scenario_observed",
      detail: { scenarioId: input.scenarioId, faultId: input.faultId },
      scenarioVersion: key?.scenarioVersion ?? "1.0",
      idempotencyKey: `${result.id}_scenario_observed_init`,
    });

    return { attemptId: result.id, resumed: false, machineState: null, safetyViolation: false };
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

  /** Record a diagnostic event (append-only; idempotent via idempotencyKey).
   *  Idempotency has two layers: an application-level pre-check plus the
   *  ws_evt_attempt_idem_uq unique index (drizzle/0039) that makes the
   *  ER_DUP_ENTRY path real. Server timestamps are authoritative; ordering
   *  is (occurredAt, id) — insertion order. */
  recordEvent: protectedProcedure.input(z.object({
    attemptId: z.number(),
    eventType: z.enum(WORKSTATION_EVENT_TYPES),
    detail: z.any().optional(),
    componentRef: z.string().max(120).optional(),
    idempotencyKey: z.string().min(1).max(64),
    scenarioVersion: z.string().max(20).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    await assertOwnsAttempt(db, input.attemptId, ctx.user.id);

    // Events may only be appended to a live attempt (append-only history ends at completion)
    const [attemptRow] = await db.select({ status: workstationAttempts.status })
      .from(workstationAttempts).where(eq(workstationAttempts.id, input.attemptId));
    if (!attemptRow || attemptRow.status !== "in_progress") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Attempt is not in progress — events can no longer be recorded" });
    }

    // Fast-path duplicate detection (belt) — the unique index is the guarantee (braces)
    const [dup] = await db.select({ id: workstationDiagnosticEvents.id })
      .from(workstationDiagnosticEvents)
      .where(and(
        eq(workstationDiagnosticEvents.attemptId, input.attemptId),
        eq(workstationDiagnosticEvents.idempotencyKey, input.idempotencyKey),
      ))
      .limit(1);
    if (dup) return { ok: true, duplicate: true };

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
      // Unique-index race: concurrent duplicate = idempotent success
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

    // Deterministic order: server timestamp, then insertion id (occurredAt is
    // second-precision — id breaks same-second ties in true append order).
    return db.select().from(workstationDiagnosticEvents)
      .where(eq(workstationDiagnosticEvents.attemptId, input.attemptId))
      .orderBy(asc(workstationDiagnosticEvents.occurredAt), asc(workstationDiagnosticEvents.id));
  }),

  /** Complete an attempt — FAIL-CLOSED and server-derived.
   *
   *  The client sends only the attemptId. The server:
   *   1. verifies every required diagnostic event is PERSISTED
   *      (measurement, diagnosis, corrective action, repair verification, closeout);
   *   2. derives the diagnosis, correctness, corrective action, and safety state
   *      from the persisted event timeline + the shared answer key — never from
   *      client-supplied booleans;
   *   3. completes atomically (conditional UPDATE ... WHERE status='in_progress')
   *      so concurrent/repeat submissions cannot double-write evidence;
   *   4. is idempotent: repeating the call on a completed attempt returns
   *      { ok:true, alreadyCompleted:true }. */
  completeAttempt: protectedProcedure.input(z.object({
    attemptId: z.number(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    await assertOwnsAttempt(db, input.attemptId, ctx.user.id);

    const [attempt] = await db.select().from(workstationAttempts)
      .where(eq(workstationAttempts.id, input.attemptId));
    if (!attempt) throw new TRPCError({ code: "NOT_FOUND", message: "Attempt not found" });

    // Idempotent repeat: already completed → success without new writes
    if (attempt.status === "completed") {
      return { ok: true, alreadyCompleted: true, evidenceCreated: 0, assignmentCompleted: !!attempt.assignmentId };
    }
    if (attempt.status !== "in_progress") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Attempt is not in progress" });
    }

    // ── Fail-closed gate: required evidence must already be PERSISTED ──
    const events = await db.select().from(workstationDiagnosticEvents)
      .where(eq(workstationDiagnosticEvents.attemptId, input.attemptId))
      .orderBy(asc(workstationDiagnosticEvents.occurredAt), asc(workstationDiagnosticEvents.id));

    const present = new Set(events.map((e: any) => e.eventType));
    const missing = REQUIRED_COMPLETION_EVENTS.filter((t) => !present.has(t));
    if (missing.length > 0) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `Cannot complete: required diagnostic evidence not persisted yet: ${missing.join(", ")}`,
      });
    }

    // ── Derive outcome from persisted events + answer key (server truth) ──
    const key = getAnswerKey(attempt.scenarioId);
    const lastOf = (type: string) => [...events].reverse().find((e: any) => e.eventType === type) as any;

    const diagEvent = lastOf("diagnosis_submitted");
    const diagDetail = (diagEvent?.detail ?? {}) as any;
    const finalDiagnosis: string = String(diagDetail.hypothesisText ?? diagDetail.diagnosis ?? "").slice(0, 500);
    const diagnosisCorrect = !!key && diagDetail.hypothesisId === key.correctHypothesisId;

    const correctiveEvent = lastOf("corrective_action_selected");
    const correctiveAction: string = String(
      (correctiveEvent?.detail as any)?.actionLabel ?? key?.correctiveActionLabel ?? "Corrective action performed"
    ).slice(0, 500);

    const repairEvent = lastOf("repair_verification_performed");
    const repairDetail = (repairEvent?.detail ?? {}) as any;
    const correctiveActionCorrect = repairDetail.faultCleared === true;
    const repairVerificationResult: string = String(
      repairDetail.result ?? (correctiveActionCorrect ? "Fault cleared — machine restored to service" : "Repair not verified")
    ).slice(0, 255);

    const safetyViolation = attempt.safetyViolation || events.some((e: any) => e.eventType === "unsafe_action_attempted");

    // ── Atomic completion guard: only ONE caller can transition the status ──
    const updateResult: any = await db.update(workstationAttempts).set({
      status: "completed",
      finalDiagnosis,
      correctiveAction,
      repairVerificationResult,
      diagnosisCorrect,
      correctiveActionCorrect,
      safetyViolation,
      completedAt: new Date(),
      lastActivityAt: new Date(),
    }).where(and(
      eq(workstationAttempts.id, input.attemptId),
      eq(workstationAttempts.status, "in_progress"),
    ));
    const header = Array.isArray(updateResult) ? updateResult[0] : updateResult;
    if (header && typeof header.affectedRows === "number" && header.affectedRows === 0) {
      // Lost the race — someone else completed it. Idempotent success, no evidence writes.
      return { ok: true, alreadyCompleted: true, evidenceCreated: 0, assignmentCompleted: !!attempt.assignmentId };
    }

    // Record completion event (server-derived summary; idempotency-keyed)
    try {
      await db.insert(workstationDiagnosticEvents).values({
        attemptId: input.attemptId,
        userId: ctx.user.id,
        eventType: "workstation_completed",
        detail: { finalDiagnosis, correctiveAction, diagnosisCorrect, correctiveActionCorrect, safetyViolation, derivedBy: "server" },
        idempotencyKey: `${input.attemptId}_workstation_completed`,
      });
    } catch (err: any) {
      if (!(err?.code === "ER_DUP_ENTRY" || err?.message?.includes("Duplicate entry"))) throw err;
    }

    // ── Assessment Spine evidence — from PERSISTED events only ──
    const evidenceToInsert: any[] = [];

    evidenceToInsert.push({
      learnerId: ctx.user.id,
      sourceType: "simulation",
      evidenceType: "simulation_completed",
      domain: "motors",
      competencyId: "motor_control_troubleshooting",
      correctness: diagnosisCorrect ? "correct" : "incorrect",
      reasoningQuality: diagnosisCorrect && correctiveActionCorrect ? "sound" : diagnosisCorrect ? "weak" : "flawed",
      safetyFlag: safetyViolation,
      detail: {
        attemptId: input.attemptId,
        scenarioId: attempt.scenarioId,
        faultId: attempt.faultId,
        workstationVersion: attempt.workstationVersion,
        eventCount: events.length,
      },
    });

    evidenceToInsert.push({
      learnerId: ctx.user.id,
      sourceType: "simulation",
      evidenceType: "diagnosis_submitted",
      domain: "motors",
      competencyId: "motor_control_troubleshooting",
      correctness: diagnosisCorrect ? "correct" : "incorrect",
      safetyFlag: safetyViolation,
      detail: { attemptId: input.attemptId, diagnosis: finalDiagnosis, scenarioId: attempt.scenarioId },
    });

    if (safetyViolation) {
      evidenceToInsert.push({
        learnerId: ctx.user.id,
        sourceType: "simulation",
        evidenceType: "safety_action",
        domain: "safety",
        competencyId: "safety_judgment",
        correctness: "incorrect",
        safetyFlag: true,
        detail: { attemptId: input.attemptId, scenarioId: attempt.scenarioId, violationType: "unsafe_action_during_workstation" },
      });
    }

    const measurements = events.filter((e: any) => e.eventType === "measurement_performed");
    if (measurements.length > 0) {
      evidenceToInsert.push({
        learnerId: ctx.user.id,
        sourceType: "simulation",
        evidenceType: "live_interaction",
        domain: "electrical",
        competencyId: "meter_usage",
        correctness: diagnosisCorrect ? "correct" : "partial",
        detail: { attemptId: input.attemptId, measurementCount: measurements.length, scenarioId: attempt.scenarioId },
      });
    }

    // PLC verification evidence — measurements at the PLC output terminal or PLC component interactions
    const plcEvents = events.filter((e: any) =>
      (e.componentRef && String(e.componentRef).toUpperCase().includes("PLC")) ||
      (e.eventType === "measurement_performed" && (e.detail as any)?.probe === "output_terminal")
    );
    if (plcEvents.length > 0) {
      evidenceToInsert.push({
        learnerId: ctx.user.id,
        sourceType: "simulation",
        evidenceType: "live_interaction",
        domain: "plc",
        competencyId: "plc_output_verification",
        correctness: diagnosisCorrect ? "correct" : "partial",
        detail: { attemptId: input.attemptId, plcInteractionCount: plcEvents.length, scenarioId: attempt.scenarioId },
      });
    }

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
      alreadyCompleted: false,
      evidenceCreated: evidenceToInsert.length,
      assignmentCompleted: !!attempt.assignmentId,
      derived: { finalDiagnosis, diagnosisCorrect, correctiveAction, correctiveActionCorrect, safetyViolation },
    };
  }),

  /** Abandon an attempt */
  abandonAttempt: protectedProcedure.input(z.object({
    attemptId: z.number(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await assertOwnsAttempt(db, input.attemptId, ctx.user.id);

    // Only a live attempt can be abandoned (a completed attempt is immutable)
    await db.update(workstationAttempts).set({
      status: "abandoned",
      lastActivityAt: new Date(),
    }).where(and(
      eq(workstationAttempts.id, input.attemptId),
      eq(workstationAttempts.status, "in_progress"),
    ));

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
    competency: z.enum([
      "motor_control_troubleshooting", "electrical_diagnostic_method", "meter_usage",
      "plc_output_verification", "safety_judgment", "root_cause_explanation",
      "repair_verification", "work_order_documentation",
    ]),
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

    // If validated, create manager_attestation evidence in the Assessment Spine.
    // Domain follows the competency (safety→safety, meter→electrical, …) instead
    // of blanket-filing everything under "motors".
    if (input.decision === "validated") {
      await db.insert(competencyEvidence).values({
        learnerId: attempt.userId,
        sourceType: "manager_validation",
        evidenceType: "manager_attestation",
        domain: (COMPETENCY_TO_DOMAIN[input.competency] ?? "motors") as SkillDomain,
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
