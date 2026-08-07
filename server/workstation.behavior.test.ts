/**
 * Motor Control Workstation — BEHAVIORAL tests.
 *
 * Unlike workstation.test.ts (shape assertions on literals), these invoke the
 * REAL tRPC procedures via createCaller with a scripted fake DB, so regressions
 * in the router logic actually fail:
 *   - startAttempt resume-or-create (no duplicate attempts)
 *   - recordEvent idempotency (pre-check + ER_DUP_ENTRY race) and status guard
 *   - completeAttempt fail-closed gate, server-derived grading, idempotent repeat,
 *     atomic race guard, evidence creation, assignment completion
 *   - authorization: cross-user, cross-team, self-validation
 *   - validate: per-competency Assessment Spine domain mapping
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Scripted fake DB ────────────────────────────────────────────────────────
type InsertBehavior = { throw?: unknown; returningId?: Array<{ id: number }> };

class FakeDb {
  selectResults: unknown[][] = [];
  insertBehaviors: InsertBehavior[] = [];
  updateResults: Array<{ affectedRows: number }> = [];
  inserted: Array<{ table: unknown; values: unknown }> = [];
  updated: Array<{ table: unknown; set: Record<string, unknown> }> = [];

  select(_fields?: unknown) {
    const result = this.selectResults.length > 0 ? this.selectResults.shift()! : [];
    const chain: any = {};
    for (const m of ["from", "where", "orderBy", "limit"]) chain[m] = () => chain;
    chain.then = (res: any, rej: any) => Promise.resolve(result).then(res, rej);
    return chain;
  }

  insert(table: unknown) {
    const self = this;
    return {
      values(v: unknown) {
        self.inserted.push({ table, values: v });
        const behavior = self.insertBehaviors.length > 0 ? self.insertBehaviors.shift()! : {};
        return {
          then(res: any, rej: any) {
            return (behavior.throw ? Promise.reject(behavior.throw) : Promise.resolve({})).then(res, rej);
          },
          $returningId() {
            return behavior.throw ? Promise.reject(behavior.throw) : Promise.resolve(behavior.returningId ?? [{ id: 1 }]);
          },
        } as any;
      },
    };
  }

  update(table: unknown) {
    const self = this;
    return {
      set(s: Record<string, unknown>) {
        self.updated.push({ table, set: s });
        const behavior = self.updateResults.length > 0 ? self.updateResults.shift()! : { affectedRows: 1 };
        return {
          where() {
            return { then: (res: any, rej: any) => Promise.resolve([behavior]).then(res, rej) } as any;
          },
        };
      },
    };
  }
}

const fake = new FakeDb();
const managedMock = vi.fn<() => Promise<number[]>>();

vi.mock("./db", () => ({ getDb: vi.fn(async () => fake) }));
vi.mock("./competencyGraph", () => ({ managedMemberIds: (..._args: unknown[]) => managedMock() }));

import { workstationRouter } from "./workstation";
import {
  workstationAttempts,
  workstationDiagnosticEvents,
  workstationAssignments,
  competencyEvidence,
} from "../drizzle/schema";

const LEARNER = { user: { id: 1, role: "user" } } as any;
const MANAGER = { user: { id: 50, role: "user" } } as any;

function caller(ctx: any) {
  return workstationRouter.createCaller(ctx);
}

/** Selects consumed by hasWorkstationAccess: role flags, user flags, team memberships (+ team flags if teams exist). */
function scriptFlagAccess(granted: boolean) {
  if (granted) fake.selectResults.push([{ id: 1 }]); // role flag hit — short-circuits
  else fake.selectResults.push([], [], []);          // role [], user [], teams []
}

beforeEach(() => {
  fake.selectResults = [];
  fake.insertBehaviors = [];
  fake.updateResults = [];
  fake.inserted = [];
  fake.updated = [];
  managedMock.mockReset();
});

// ── startAttempt ────────────────────────────────────────────────────────────
describe("startAttempt (behavioral)", () => {
  it("rejects when the feature flag denies access", async () => {
    scriptFlagAccess(false);
    await expect(
      caller(LEARNER).startAttempt({ scenarioId: "overload_tripped", faultId: "overload_tripped" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(fake.inserted).toHaveLength(0);
  });

  it("creates a new attempt (with initial scenario_observed event) when none is in progress", async () => {
    scriptFlagAccess(true);
    fake.selectResults.push([]);           // no existing in_progress attempt
    fake.selectResults.push([]);           // no team membership
    fake.insertBehaviors.push({ returningId: [{ id: 77 }] }); // attempt insert
    const res = await caller(LEARNER).startAttempt({ scenarioId: "overload_tripped", faultId: "overload_tripped" });
    expect(res).toMatchObject({ attemptId: 77, resumed: false });
    expect(fake.inserted[0]!.table).toBe(workstationAttempts);
    expect(fake.inserted[1]!.table).toBe(workstationDiagnosticEvents);
    expect((fake.inserted[1]!.values as any).eventType).toBe("scenario_observed");
    expect((fake.inserted[1]!.values as any).idempotencyKey).toBe("77_scenario_observed_init");
  });

  it("RESUMES an existing in_progress attempt instead of creating a duplicate", async () => {
    scriptFlagAccess(true);
    fake.selectResults.push([{
      id: 42, userId: 1, status: "in_progress", assignmentId: null,
      machineState: { scenarioId: "overload_tripped" }, safetyViolation: false,
    }]);
    const res = await caller(LEARNER).startAttempt({ scenarioId: "overload_tripped", faultId: "overload_tripped" });
    expect(res).toMatchObject({ attemptId: 42, resumed: true });
    expect((res as any).machineState).toEqual({ scenarioId: "overload_tripped" });
    expect(fake.inserted).toHaveLength(0); // NO new attempt, NO duplicate initial event
  });
});

// ── recordEvent ─────────────────────────────────────────────────────────────
describe("recordEvent (behavioral)", () => {
  function scriptOwnershipAndStatus(userId: number, status = "in_progress") {
    fake.selectResults.push([{ userId }]);   // assertOwnsAttempt
    fake.selectResults.push([{ status }]);   // status guard
  }

  it("rejects another learner's attempt (FORBIDDEN)", async () => {
    fake.selectResults.push([{ userId: 2 }]); // owned by user 2, caller is 1
    await expect(
      caller(LEARNER).recordEvent({ attemptId: 5, eventType: "measurement_performed", idempotencyKey: "k1" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects events on a completed attempt (append-only history ends at completion)", async () => {
    scriptOwnershipAndStatus(1, "completed");
    await expect(
      caller(LEARNER).recordEvent({ attemptId: 5, eventType: "measurement_performed", idempotencyKey: "k1" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects unknown event types (vocabulary enforced)", async () => {
    await expect(
      caller(LEARNER).recordEvent({ attemptId: 5, eventType: "made_up_event" as any, idempotencyKey: "k1" })
    ).rejects.toThrow();
  });

  it("is idempotent via the duplicate pre-check (no second insert)", async () => {
    scriptOwnershipAndStatus(1);
    fake.selectResults.push([{ id: 9 }]); // duplicate found
    const res = await caller(LEARNER).recordEvent({ attemptId: 5, eventType: "measurement_performed", idempotencyKey: "dup-key" });
    expect(res).toEqual({ ok: true, duplicate: true });
    expect(fake.inserted).toHaveLength(0);
  });

  it("is idempotent under the unique-index race (ER_DUP_ENTRY → duplicate:true)", async () => {
    scriptOwnershipAndStatus(1);
    fake.selectResults.push([]); // pre-check missed (race)
    fake.insertBehaviors.push({ throw: Object.assign(new Error("Duplicate entry"), { code: "ER_DUP_ENTRY" }) });
    const res = await caller(LEARNER).recordEvent({ attemptId: 5, eventType: "measurement_performed", idempotencyKey: "race-key" });
    expect(res).toEqual({ ok: true, duplicate: true });
  });

  it("persists the event and flags safety violations on the attempt", async () => {
    scriptOwnershipAndStatus(1);
    fake.selectResults.push([]); // no duplicate
    const res = await caller(LEARNER).recordEvent({
      attemptId: 5, eventType: "unsafe_action_attempted",
      detail: { probe: "motor_coil", reason: "energized continuity" }, idempotencyKey: "k-unsafe",
    });
    expect(res).toEqual({ ok: true, duplicate: false });
    expect(fake.inserted[0]!.table).toBe(workstationDiagnosticEvents);
    // lastActivityAt update + safetyViolation flag update
    const sets = fake.updated.map((u) => u.set);
    expect(sets.some((s) => s.safetyViolation === true)).toBe(true);
  });
});

// ── completeAttempt ─────────────────────────────────────────────────────────
const FULL_EVENTS = (opts: { hypothesisId?: string; unsafe?: boolean } = {}) => {
  const { hypothesisId = "h1", unsafe = false } = opts;
  const evts: any[] = [
    { eventType: "scenario_observed", detail: {} },
    { eventType: "measurement_performed", detail: { probe: "overload_nc", reading: "OL (open)" } },
    { eventType: "diagnosis_submitted", detail: { hypothesisId, hypothesisText: "Overload relay tripped due to excessive current draw" } },
    { eventType: "corrective_action_selected", detail: { actionLabel: "Reset Overload Relay (Corrective Action)" } },
    { eventType: "repair_verification_performed", detail: { faultCleared: true, result: "Fault Cleared — Motor Running" } },
    { eventType: "closeout_submitted", detail: { rootCause: "OL trip", testsPerformed: 1 } },
  ];
  if (unsafe) evts.push({ eventType: "unsafe_action_attempted", detail: { reason: "energized continuity" } });
  return evts;
};

describe("completeAttempt (behavioral, fail-closed)", () => {
  function scriptAttempt(attempt: Record<string, unknown>) {
    fake.selectResults.push([{ userId: attempt.userId ?? 1 }]); // assertOwnsAttempt
    fake.selectResults.push([attempt]);                          // attempt load
  }

  const BASE_ATTEMPT = {
    id: 5, userId: 1, status: "in_progress", scenarioId: "overload_tripped",
    faultId: "overload_tripped", workstationVersion: "1.0", safetyViolation: false, assignmentId: null,
  };

  it("FAILS CLOSED when required diagnostic events are missing", async () => {
    scriptAttempt(BASE_ATTEMPT);
    fake.selectResults.push([{ eventType: "scenario_observed", detail: {} }]); // events — nothing else persisted
    await expect(caller(LEARNER).completeAttempt({ attemptId: 5 })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    // and it must NOT have completed the attempt or written evidence
    expect(fake.updated.filter((u) => u.set.status === "completed")).toHaveLength(0);
    expect(fake.inserted.filter((i) => i.table === competencyEvidence)).toHaveLength(0);
  });

  it("derives grading SERVER-SIDE from persisted events + answer key (correct diagnosis)", async () => {
    scriptAttempt(BASE_ATTEMPT);
    fake.selectResults.push(FULL_EVENTS()); // events include diagnosis h1 (correct for overload_tripped)
    const res: any = await caller(LEARNER).completeAttempt({ attemptId: 5 });
    expect(res.ok).toBe(true);
    expect(res.derived.diagnosisCorrect).toBe(true);
    expect(res.derived.correctiveActionCorrect).toBe(true);
    // attempt completed with derived values
    const completedSet = fake.updated.find((u) => u.set.status === "completed")!.set;
    expect(completedSet.diagnosisCorrect).toBe(true);
    // evidence: simulation_completed + diagnosis_submitted + meter live_interaction (no safety row)
    const evidence = fake.inserted.find((i) => i.table === competencyEvidence)!.values as any[];
    const types = evidence.map((e) => e.evidenceType);
    expect(types).toContain("simulation_completed");
    expect(types).toContain("diagnosis_submitted");
    expect(types).toContain("live_interaction");
    expect(types).not.toContain("safety_action");
    expect(evidence.find((e) => e.evidenceType === "simulation_completed").reasoningQuality).toBe("sound");
  });

  it("grades a wrong hypothesis as incorrect and files safety evidence on violations", async () => {
    scriptAttempt({ ...BASE_ATTEMPT });
    fake.selectResults.push(FULL_EVENTS({ hypothesisId: "h3", unsafe: true }));
    const res: any = await caller(LEARNER).completeAttempt({ attemptId: 5 });
    expect(res.derived.diagnosisCorrect).toBe(false);
    expect(res.derived.safetyViolation).toBe(true);
    const evidence = fake.inserted.find((i) => i.table === competencyEvidence)!.values as any[];
    const safety = evidence.find((e) => e.evidenceType === "safety_action");
    expect(safety).toBeDefined();
    expect(safety.safetyFlag).toBe(true);
    expect(evidence.find((e) => e.evidenceType === "simulation_completed").correctness).toBe("incorrect");
  });

  it("is idempotent: repeating completion returns alreadyCompleted without new writes", async () => {
    scriptAttempt({ ...BASE_ATTEMPT, status: "completed" });
    const res: any = await caller(LEARNER).completeAttempt({ attemptId: 5 });
    expect(res).toMatchObject({ ok: true, alreadyCompleted: true });
    expect(fake.inserted).toHaveLength(0);
    expect(fake.updated).toHaveLength(0);
  });

  it("loses the completion race safely (conditional update matched 0 rows → no evidence)", async () => {
    scriptAttempt(BASE_ATTEMPT);
    fake.selectResults.push(FULL_EVENTS());
    fake.updateResults.push({ affectedRows: 0 }); // another caller completed first
    const res: any = await caller(LEARNER).completeAttempt({ attemptId: 5 });
    expect(res).toMatchObject({ ok: true, alreadyCompleted: true });
    expect(fake.inserted.filter((i) => i.table === competencyEvidence)).toHaveLength(0);
  });

  it("completes the linked assignment", async () => {
    scriptAttempt({ ...BASE_ATTEMPT, assignmentId: 12 });
    fake.selectResults.push(FULL_EVENTS());
    const res: any = await caller(LEARNER).completeAttempt({ attemptId: 5 });
    expect(res.assignmentCompleted).toBe(true);
    const assignmentUpdate = fake.updated.find((u) => u.table === workstationAssignments);
    expect(assignmentUpdate?.set.status).toBe("completed");
    expect(assignmentUpdate?.set.completedAttemptId).toBe(5);
  });
});

// ── Authorization: manager scope ────────────────────────────────────────────
describe("manager authorization (behavioral)", () => {
  it("getEvents denies a manager outside the learner's team", async () => {
    fake.selectResults.push([{ userId: 3 }]); // attempt owner
    managedMock.mockResolvedValue([4, 5]);    // manager manages others — not user 3
    await expect(caller(MANAGER).getEvents({ attemptId: 8 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("getEvents allows a manager who manages the learner", async () => {
    fake.selectResults.push([{ userId: 3 }]);
    managedMock.mockResolvedValue([3]);
    fake.selectResults.push([{ id: 1, eventType: "scenario_observed" }]); // events
    const events = await caller(MANAGER).getEvents({ attemptId: 8 });
    expect(events).toHaveLength(1);
  });

  it("learnerAttempts denies unmanaged users", async () => {
    managedMock.mockResolvedValue([7, 8]);
    await expect(caller(MANAGER).learnerAttempts({ userId: 3 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

// ── validate ────────────────────────────────────────────────────────────────
describe("validate (behavioral)", () => {
  it("forbids self-validation", async () => {
    fake.selectResults.push([{ id: 5, userId: 50 }]); // attempt belongs to the manager themself
    managedMock.mockResolvedValue([50]);
    await expect(
      caller(MANAGER).validate({ attemptId: 5, competency: "meter_usage", decision: "validated" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("maps the validated competency to its Assessment Spine domain (not blanket motors)", async () => {
    fake.selectResults.push([{ id: 5, userId: 3 }]);
    managedMock.mockResolvedValue([3]);
    await caller(MANAGER).validate({ attemptId: 5, competency: "safety_judgment", decision: "validated", comment: "Solid LOTO discipline" });
    const evidence = fake.inserted.find((i) => i.table === competencyEvidence)!.values as any;
    expect(evidence.domain).toBe("safety");
    expect(evidence.evidenceType).toBe("manager_attestation");
    expect(evidence.learnerId).toBe(3);
  });

  it("rejects competencies outside the 8-item vocabulary", async () => {
    await expect(
      caller(MANAGER).validate({ attemptId: 5, competency: "made_up" as any, decision: "validated" })
    ).rejects.toThrow();
  });
});
