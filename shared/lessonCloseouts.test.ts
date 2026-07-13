/**
 * Closeout scaling guardrails: a deck may only enable `reflection` if it has a
 * scenario-specific closeout, every closeout points at a real deck, and each
 * scenario's unsafe temptation is actually caught by the safety classifier —
 * the pattern must not be watered down as it scales.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { LESSON_CLOSEOUTS, closeoutFor } from "./lessonCloseouts";
import { DECKS } from "./lessonCardContent";
import { classifyCommunication, OPERATOR_PERSONAS, mentorEvidence } from "./maintenanceMentor";
import { readinessFromEvidence, communicationReadiness } from "./assessmentSpine";

describe("lesson closeouts — registry integrity", () => {
  it("every closeout points at an existing deck", () => {
    for (const key of Object.keys(LESSON_CLOSEOUTS)) {
      expect(DECKS[key as keyof typeof DECKS], key).toBeDefined();
    }
  });

  it("every deck with reflection:true has a scenario-specific closeout (no generic chats)", () => {
    for (const [key, deck] of Object.entries(DECKS)) {
      if ((deck as { reflection?: boolean }).reflection) {
        expect(LESSON_CLOSEOUTS[key], `${key} enables reflection but has no closeout`).toBeDefined();
      }
    }
  });

  it("the five new target lessons + the flagship are configured", () => {
    for (const key of [
      "motors-controls/motor-control-circuits",
      "safety-systems/estop-circuits",
      "motors-controls/starter-troubleshooting",
      "powerflex-vfd/fault-codes-diagnostics",
      "plc-fundamentals/io-troubleshooting",
      "sensors-instrumentation/proximity-photoelectric",
    ]) {
      expect(closeoutFor(key.split("/")[0], key.split("/")[1])).not.toBeNull();
      expect((DECKS[key as keyof typeof DECKS] as { reflection?: boolean }).reflection).toBe(true);
    }
  });

  it("every closeout is complete and scenario-specific (no empty or generic fields)", () => {
    for (const [key, c] of Object.entries(LESSON_CLOSEOUTS)) {
      expect(c.deckKey).toBe(key);
      expect(c.scenario.length, key).toBeGreaterThan(60);
      expect(c.scenarioTag.length, key).toBeGreaterThan(5);
      expect(OPERATOR_PERSONAS).toContain(c.persona);
      expect(c.operatorOpeningLine.length, key).toBeGreaterThan(20);
      expect(c.unsafeTemptation.length, key).toBeGreaterThan(15);
      for (const p of Object.values(c.prompts)) expect(p.length, key).toBeGreaterThan(20);
      // Scenario-specific means prompts differ across lessons — no copy-paste generic text.
      const others = Object.values(LESSON_CLOSEOUTS).filter((o) => o.deckKey !== key);
      expect(others.every((o) => o.prompts.operator !== c.prompts.operator), key).toBe(true);
    }
  });
});

describe("lesson closeouts — batch 2 (guarding, overload, motor testing, comm faults, sensor types)", () => {
  it("all five batch-2 lessons are configured with reflection enabled", () => {
    for (const key of [
      "safety-systems/guarding-lockout",
      "motors-controls/overload-protection",
      "motors-controls/motor-testing",
      "plc-fundamentals/communication-faults",
      "sensors-instrumentation/sensor-types-overview",
    ]) {
      expect(closeoutFor(key.split("/")[0], key.split("/")[1]), key).not.toBeNull();
      expect((DECKS[key as keyof typeof DECKS] as { reflection?: boolean }).reflection, key).toBe(true);
    }
  });

  it("every closeout has an SME audit entry in docs/CLOSEOUT_SME_AUDIT.md (mandatory gate)", () => {
    const doc = readFileSync(fileURLToPath(new URL("../docs/CLOSEOUT_SME_AUDIT.md", import.meta.url)), "utf-8");
    for (const key of Object.keys(LESSON_CLOSEOUTS)) {
      expect(doc.includes(`\`${key}\``), `${key} has no SME audit entry`).toBe(true);
    }
  });

  it("unsafe guard-bypass advice creates safety risk", () => {
    const a = classifyCommunication("Sure, we can bypass the guard switch until end of shift, just be careful.");
    expect(a.unsafe).toBe(true);
    const ev = mentorEvidence({ lessonTitle: "Guarding & LOTO", domain: "safety", mode: "operator_communication" }, a);
    expect(readinessFromEvidence("safety", [ev]).level).toBe("Needs Safety Review");
  });

  it("unsafe overload advice — keep resetting OR turn the setting up — creates safety risk", () => {
    expect(classifyCommunication("Just reset it when it trips again, it's fine.").unsafe).toBe(true);
    const crank = classifyCommunication("I'll just turn the overload up so it stops tripping.");
    expect(crank.unsafe).toBe(true);
    expect(crank.cues).toContain("defeat overload protection");
  });

  it("unsafe comm-fault advice (power cycle the panel every time) creates safety risk", () => {
    const a = classifyCommunication("Just power cycle the panel every time it loses comms.");
    expect(a.unsafe).toBe(true);
    const c = communicationReadiness([mentorEvidence({ lessonTitle: "Comm Faults", domain: "plc", mode: "operator_communication" }, a)]);
    expect(c.safetyCommunicationRisk).toBe(true);
  });

  it("the correct overload explanation (reset last, never turn it up) is strong, not unsafe", () => {
    const a = classifyCommunication(
      "The overload tripped because the motor was pulling too much current — I clamped the amps and metered all three legs, and verified the setting against the nameplate. Don't keep resetting it and never turn the setting up; if it trips again, call maintenance so we find the cause.",
    );
    expect(a.unsafe).toBe(false); // advising AGAINST both shortcuts
    expect(a.quality).toBe("strong");
  });

  it("strong motor-testing communication supports readiness but not mastery alone", () => {
    const a = classifyCommunication(
      "The motor tested good — I checked the shaft, measured the windings, meggered it disconnected, and clamped the amps. The real problem was the load binding. We're fixing that; tell maintenance if you hear it straining again.",
    );
    expect(a.quality).toBe("strong");
    const ev = mentorEvidence({ lessonTitle: "Motor Testing", domain: "motors", mode: "operator_communication" }, a);
    const r = readinessFromEvidence("motors", [ev]);
    expect(r.level).not.toBe("Ready");
    expect(r.level).not.toBe("Promotion Candidate");
  });
});

describe("lesson closeouts — unsafe temptations are caught by the safety net", () => {
  it("unsafe E-stop advice (pull it back out and keep running) creates safety risk", () => {
    const a = classifyCommunication("Yeah, next time just pull the e-stop back out and keep running, no need to wait for us.");
    expect(a.unsafe).toBe(true);
    const ev = mentorEvidence({ lessonTitle: "E-Stop", domain: "safety", mode: "operator_communication" }, a);
    expect(ev.safetyFlag).toBe(true);
    expect(readinessFromEvidence("safety", [ev]).level).toBe("Needs Safety Review");
  });

  it("unsafe VFD advice (power cycle it every time) creates safety risk", () => {
    const a = classifyCommunication("Just power cycle it every time it faults, that clears it.");
    expect(a.unsafe).toBe(true);
    const c = communicationReadiness([mentorEvidence({ lessonTitle: "VFD Faults", domain: "vfd", mode: "operator_communication" }, a)]);
    expect(c.safetyCommunicationRisk).toBe(true);
  });

  it("unsafe photoeye advice (tape over the eye / reach in) is caught", () => {
    expect(classifyCommunication("If it acts up, just tape over the eye so it stops false-tripping.").unsafe).toBe(true);
    expect(classifyCommunication("Reach in and wave at the sensor while it runs to clear it.").unsafe).toBe(true);
  });

  it("unsafe PLC advice (force the input) is caught", () => {
    expect(classifyCommunication("We can just force the input on in the PLC so it keeps cycling.").unsafe).toBe(true);
  });

  it("the correct E-stop explanation (why we never bypass) is NOT flagged unsafe, and is strong", () => {
    const a = classifyCommunication(
      "The safety circuit opened because one E-stop tripped. I verified which device and why before resetting. Never pull it back out and keep running without knowing why — call maintenance if it trips again.",
    );
    expect(a.unsafe).toBe(false); // negation guard: advising AGAINST the shortcut
    expect(a.quality).toBe("strong");
  });

  it("strong VFD operator communication supports readiness but never mastery alone", () => {
    const a = classifyCommunication(
      "The drive tripped on an overcurrent fault. I recorded the fault queue and checked the load before clearing it. Don't power cycle it if it faults again — write down the code and call maintenance so we can find the cause.",
    );
    expect(a.quality).toBe("strong");
    expect(a.unsafe).toBe(false);
    const ev = mentorEvidence({ lessonTitle: "VFD Faults", domain: "vfd", mode: "operator_communication" }, a);
    const r = readinessFromEvidence("vfd", [ev]);
    expect(r.level).not.toBe("Ready");
    expect(r.level).not.toBe("Promotion Candidate");
  });
});
