/**
 * Lesson closeout registry — the reusable configuration behind the flagship
 * apprenticeship closeout (reflection → operator role-play → work order → handoff).
 *
 * A deck may only enable `reflection: true` if it has a closeout here: the
 * closeout is what makes the pattern SCENARIO-SPECIFIC instead of a generic
 * reflection chat. Each entry answers: what happened on the machine, what unsafe
 * shortcut production will push for, and what a real technician's explanation,
 * work order, and handoff must contain. Enforced by shared/lessonCloseouts.test.ts.
 */
import type { OperatorPersona } from "./maintenanceMentor";

export interface LessonCloseout {
  /** DECKS key: moduleSlug/lessonSlug. */
  deckKey: string;
  /** What happened on the machine — fed to the AI operator + evidence scenario tag. */
  scenario: string;
  scenarioTag: string;
  /** The operator persona that fits this fault. */
  persona: OperatorPersona;
  /** LLM-free fallback opening line, in persona. */
  operatorOpeningLine: string;
  /** The unsafe shortcut production is tempted by (steers the operator LLM). */
  unsafeTemptation: string;
  /** Closeout card intro ("the line is back up…"). */
  introLine: string;
  /** Placeholder guidance per closeout block — scenario-specific, not generic. */
  prompts: {
    reflection: string;
    operator: string;
    workOrder: string;
    handoff: string;
  };
}

export const LESSON_CLOSEOUTS: Record<string, LessonCloseout> = {
  "motors-controls/motor-control-circuits": {
    deckKey: "motors-controls/motor-control-circuits",
    scenario:
      "The conveyor stopped because the overload opened. The technician metered the control string, found why the overload had tripped, corrected the cause, and reset it; the line is running again. The operator wants to know what happened and whether they can just reset it themselves if it trips again.",
    scenarioTag: "conveyor-overload-roleplay",
    persona: "rushed",
    operatorOpeningLine: "Is it fixed? I've got a quota — can I just reset it myself if it trips again?",
    unsafeTemptation: "resetting the overload repeatedly without calling maintenance",
    introLine: "The line's back up. Before we close it out — explain what happened, the way a tech has to.",
    prompts: {
      reflection: "The conveyor stopped because… I verified… I'm still assuming…",
      operator: "Plain language: what the overload trip means, and why they must call maintenance instead of resetting repeatedly.",
      workOrder: "Symptom (conveyor stopped) · tests (coil voltage, control string) · evidence · likely cause · corrective action · follow-up.",
      handoff: "Machine state · what you verified · what's still unknown · watch for repeat overload trips.",
    },
  },
  "safety-systems/estop-circuits": {
    deckKey: "safety-systems/estop-circuits",
    scenario:
      "The cell went down because the safety circuit opened — one E-stop in the chain was tripped. The technician found which device opened, verified WHY before resetting, and restored the cell. The operator wants to keep running and is tempted to just pull the E-stop back out next time without telling anyone.",
    scenarioTag: "estop-chain-roleplay",
    persona: "unsafe",
    operatorOpeningLine: "We're back up? Look — next time can I just pull the E-stop back out and keep running so we don't lose twenty minutes?",
    unsafeTemptation: "pulling the E-stop back out and resuming without finding out why it tripped, or bypassing the safety chain",
    introLine: "The cell is reset and running. Before you close the ticket — the operator wants a word about that E-stop.",
    prompts: {
      reflection: "The safety circuit opened because… I verified which device and WHY before resetting… I confirmed the area was safe to restart… I'm still assuming…",
      operator: "Why an E-stop trip always needs a reason before reset, why the chain is never bypassed, and why the area must be clear before any reset — machines can move the moment the chain is made.",
      workOrder: "Symptom (cell down, safety circuit open) · which device opened · why it tripped · verification before reset · restart-safety confirmed · any damage found · follow-up.",
      handoff: "Which E-stop tripped and why · what was verified · whether the cause is fully resolved · confirm a safe state before any reset if it trips again.",
    },
  },
  "motors-controls/starter-troubleshooting": {
    deckKey: "motors-controls/starter-troubleshooting",
    scenario:
      "A motor starter wouldn't pull in. The technician metered the control string, found the open device, fixed the cause, and the motor runs. The operator is frustrated — this machine has been down twice this month — and wants to know why it keeps happening.",
    scenarioTag: "starter-troubleshooting-roleplay",
    persona: "frustrated",
    operatorOpeningLine: "Finally. This thing's been down twice this month — what is it THIS time, and is it actually fixed or just patched?",
    unsafeTemptation: "swapping parts on a hunch, or jumpering the control circuit to keep production moving instead of finding the cause",
    introLine: "The motor's running. The operator has been burned before — close this out like a tech they can trust.",
    prompts: {
      reflection: "The starter wouldn't pull in because… I metered… the open device was… I verified the cause was…",
      operator: "What actually failed and what you verified — calm, specific, no blame, and what to report if it recurs.",
      workOrder: "Symptom (starter won't pull in) · meter readings taken · open device found · root cause · corrective action · parts used · follow-up.",
      handoff: "What failed and why · what was replaced or corrected · whether the repeat-failure pattern is resolved · what to monitor.",
    },
  },
  "powerflex-vfd/fault-codes-diagnostics": {
    deckKey: "powerflex-vfd/fault-codes-diagnostics",
    scenario:
      "The PowerFlex drive tripped on a fault code. The technician recorded the fault queue, measured toward the likely cause, corrected the condition, and verified stable restarts before returning the line to production. The operator has seen it fault before and wants to just power-cycle the drive every time it happens.",
    scenarioTag: "vfd-fault-roleplay",
    persona: "rushed",
    operatorOpeningLine: "It says fault again like last month. Can I just power cycle it every time it does that? Beats waiting for you guys.",
    unsafeTemptation: "power-cycling or resetting the drive every time it faults, without recording the code or finding the cause",
    introLine: "The drive is running again. Before you close it out — the operator wants a shortcut, and you owe the next tech a real record.",
    prompts: {
      reflection: "The drive tripped on fault… the fault queue showed… I checked… before clearing. I'm still assuming…",
      operator: "What the fault code means, why the code must be recorded before any reset, and when to call maintenance instead of power-cycling.",
      workOrder: "Fault code(s) and queue · what was measured/checked · likely cause · corrective action · whether the fault is understood or recurring · follow-up.",
      handoff: "Which fault, how many times · what was checked · whether root cause is confirmed · what conditions to monitor (load, heat, supply).",
    },
  },
  "plc-fundamentals/io-troubleshooting": {
    deckKey: "plc-fundamentals/io-troubleshooting",
    scenario:
      "A machine stopped because an input never made it to the PLC — the technician started at the input card LED, worked back through the terminal strip and wiring to the field device, found the break, and fixed it. The operator doesn't understand PLCs and is nervous the machine will just stop again.",
    scenarioTag: "plc-io-roleplay",
    persona: "confused",
    operatorOpeningLine: "So it just… stopped seeing the sensor? I don't get it. Is it going to do that again? Is there something I should be doing?",
    unsafeTemptation: "asking maintenance to 'just make the PLC ignore that sensor' — forcing an input to keep running, which requires authorization and procedure and never substitutes for fixing the wiring",
    introLine: "The machine's cycling again. The operator doesn't speak PLC — explain it so they trust the machine, and the record helps the next tech.",
    prompts: {
      reflection: "The input wasn't reaching the PLC because… I started at the input card LED and worked back through the terminal strip and wiring to the device, and verified… I'm still assuming…",
      operator: "Plain words, no PLC jargon: what stopped the machine, what you fixed, and what they should tell maintenance if it happens again.",
      workOrder: "Symptom (input not seen) · trace path (input card LED → terminal strip → wiring → device) · where the break was · corrective action · whether wiring/terminals need follow-up.",
      handoff: "Which input and address · where the fault was found · whether it could be intermittent · what to watch on the I/O status lights.",
    },
  },
  "sensors-instrumentation/proximity-photoelectric": {
    deckKey: "sensors-instrumentation/proximity-photoelectric",
    scenario:
      "The line kept stopping because a photoeye said the path was blocked when it wasn't. The technician watched the sensor's own output LED first, found a filmed lens and slight misalignment, cleaned and realigned it, and verified the output state. The operator has been clearing 'phantom jams' all shift and is fed up.",
    scenarioTag: "photoeye-fault-roleplay",
    persona: "frustrated",
    operatorOpeningLine: "All shift it's been saying there's a jam when there's nothing there. I've been reaching over and waving at the eye to clear it. Fixed for real this time?",
    unsafeTemptation: "reaching into the machine to wave at or wipe the sensor while it's running, or taping over / defeating the photoeye",
    introLine: "The phantom jams are gone. Close it out so the operator stops improvising — and never reaches into a running machine again.",
    prompts: {
      reflection: "The photoeye reported blocked because… I checked alignment/lens and verified the output… I'm still assuming…",
      operator: "What was wrong with the eye, why reaching into a running machine is never OK, and what to do if phantom jams come back.",
      workOrder: "Symptom (false blocked signal) · checks (alignment, lens, output state, wiring) · cause found · corrective action · cleaning/alignment follow-up.",
      handoff: "Which sensor and where · what was corrected · whether contamination/vibration could recur · what to watch before calling it fixed.",
    },
  },
};

// ── Batch 2 (SME-audited — see docs/CLOSEOUT_SME_AUDIT.md) ──────────────────

LESSON_CLOSEOUTS["safety-systems/guarding-lockout"] = {
  deckKey: "safety-systems/guarding-lockout",
  scenario:
    "A jam was cleared the right way: full LOTO — every energy source isolated, stored energy released, zero verified — then the guard went back on before restart. It cost twenty minutes and production felt every one of them. The operator wants a faster way next time and floats bypassing the guard switch until end of shift.",
  scenarioTag: "guarding-loto-roleplay",
  persona: "unsafe",
  operatorOpeningLine: "That took twenty minutes for a jam I could've cleared in two. Can't we just bypass the guard switch until end of shift? I'll be careful.",
  unsafeTemptation: "bypassing the guard switch or clearing the next jam without locking out, because the safe way is slower",
  introLine: "The jam's cleared and the guard is back on. The operator thinks LOTO is overkill — close this out so they understand why it isn't.",
  prompts: {
    reflection: "The jam happened because… I isolated every energy source (not just electrical)… I released stored energy and verified zero… the guard went back on before restart. I'm still assuming…",
    operator: "Why no jam is quick enough to skip LOTO, and why a guard or interlock is never bypassed — the lock protects them, the tag just explains it. No lecturing, no blame.",
    workOrder: "Jam cause · energy sources isolated (electrical, air, gravity, stored) · zero-energy verification · stored energy released · guard reinstated · recurring-jam follow-up.",
    handoff: "What caused the jam and whether it will recur · confirmation the guard/interlock is fully functional with no bypasses in place · what to watch · never clear a jam without locking out.",
  },
};

LESSON_CLOSEOUTS["motors-controls/overload-protection"] = {
  deckKey: "motors-controls/overload-protection",
  scenario:
    "The motor's overload kept tripping. Instead of resetting it again, the technician investigated: turned the shaft by hand, checked the load, clamped the amps, metered all three legs, and verified the overload setting against the motor nameplate — found the cause, corrected it, then reset. The operator has been resetting it all week and wants to keep doing that.",
  scenarioTag: "overload-trip-roleplay",
  persona: "rushed",
  operatorOpeningLine: "It's run fine all week if you just reset it when it trips. Can I keep doing that? Or better — can you just turn the overload up so it stops tripping?",
  unsafeTemptation: "resetting the overload repeatedly without finding the cause, or turning the overload setting up to stop the trips",
  introLine: "The trips are explained and fixed — not just reset. The operator's been treating the reset button as the fix all week; close this out so that stops.",
  prompts: {
    reflection: "The overload was tripping because (bind / bearing / low voltage / lost phase / real overload / wrong setting)… I turned the shaft, clamped the amps, metered the legs, and verified the setting… I'm still assuming…",
    operator: "What a trip actually means (the motor pulling too much current for too long), why repeated resets cook the motor, why the setting never gets turned up, and when to call maintenance.",
    workOrder: "Trip history and frequency · shaft/load check · clamp-amp readings · voltage on all three legs · overload setting vs nameplate FLA · cause found · corrective action · follow-up.",
    handoff: "Why it was tripping and what was corrected · whether trips may recur while parts are on order · amp readings to compare against · reset is the last step, never the first.",
  },
};

LESSON_CLOSEOUTS["motors-controls/motor-testing"] = {
  deckKey: "motors-controls/motor-testing",
  scenario:
    "The motor was suspected bad. Before changing it, the technician proved it: turned the shaft by hand, measured winding resistance across all three phases, meggered the insulation with the motor safely disconnected, and clamped the running amps. The tests showed the motor was fine — the real problem was a binding load. The operator just wants a straight answer.",
  scenarioTag: "motor-testing-roleplay",
  persona: "curious",
  operatorOpeningLine: "So bottom line — is the motor bad or not? Yesterday somebody said swap it. Should we just swap it and be done?",
  unsafeTemptation: "swapping the motor on a hunch without testing, which wastes the shift and leaves the real fault (the load) in place",
  introLine: "Ten minutes of testing just saved a day of changing the wrong part. Close this out so the record shows WHY the motor stays.",
  prompts: {
    reflection: "I suspected the motor because… I turned the shaft, ohmed the windings, meggered it (disconnected, discharged after), and clamped the amps… the evidence showed… I'm still assuming…",
    operator: "A straight answer backed by the tests: what was measured, why the motor is good (or bad), what the real problem is, and what happens next — plain words, no jargon.",
    workOrder: "Suspected symptom · shaft/rotation check · winding resistance readings (all three phases) · megger reading and that the motor was isolated for it · clamp-amp readings · verdict with evidence · actual fault found · corrective action.",
    handoff: "The motor's test results (so nobody re-suspects it) · the real fault and its status · readings to compare if symptoms return · don't change the motor on a hunch.",
  },
};

LESSON_CLOSEOUTS["plc-fundamentals/communication-faults"] = {
  deckKey: "plc-fundamentals/communication-faults",
  scenario:
    "An EtherNet/IP adapter kept dropping communication. The technician worked the order the method demands — physical layer first: checked the link LED and patch cord, pinged the node, read the I/O tree fault code — and found a duplicate IP address. Assigned a unique address and documented it. The operator has watched maintenance power-cycle panels before and wants to just do that every time.",
  scenarioTag: "comm-fault-roleplay",
  persona: "rushed",
  operatorOpeningLine: "It lost communication again — third time this month. Can't we just power cycle the panel every time it does that? That's what usually gets it going.",
  unsafeTemptation: "power-cycling the panel every time communication drops — an uncontrolled restart that masks the cause and never fixes a duplicate IP or bad cable",
  introLine: "The node is back online with a unique, documented address. The operator thinks a power cycle is the fix — close this out so the real cause is on record.",
  prompts: {
    reflection: "Comms dropped because… I checked link LED → ping → I/O tree fault code, in that order… the cause was (cable / IP config / switch), not the CPU… I'm still assuming…",
    operator: "Why a power cycle isn't the fix (it masks the cause, restarts things unexpectedly, and a duplicate IP never heals itself) — and what to report when comms drop: which station, what the lights showed, what was running.",
    workOrder: "Which node lost comms and how often · link LED / cable / ping results · I/O tree fault code · cause found (duplicate IP) · unique address assigned AND documented · switch/cable follow-up if any.",
    handoff: "Which node faulted and the confirmed cause · the documented IP change · whether any other station could share the old conflict · what the fault LED looks like if it recurs — check the physical layer before anything else.",
  },
};

LESSON_CLOSEOUTS["sensors-instrumentation/sensor-types-overview"] = {
  deckKey: "sensors-instrumentation/sensor-types-overview",
  scenario:
    "A machine kept missing parts after a sensor was replaced. The technician checked the input card LED first, then the replacement sensor's label — the new sensor's output type (NPN) didn't match the input card's expected type (PNP). Fitted the correct type, terminated it right, and verified the card LED tracks the part. Meanwhile the operator had been triggering the sensor by hand to keep the machine cycling.",
  scenarioTag: "sensor-type-roleplay",
  persona: "confused",
  operatorOpeningLine: "It kept missing parts so I've just been waving my hand in front of it to make it run. Is that okay? What was even wrong with it?",
  unsafeTemptation: "hand-triggering the sensor near a running machine to keep it cycling instead of reporting the fault — masking a detection problem and putting a hand near moving equipment",
  introLine: "The right sensor type is in and the card LED tracks the part. The operator's been improvising all shift — close this out so they stop, and the record shows why the swap failed.",
  prompts: {
    reflection: "The machine missed parts because the replacement sensor's output type didn't match the input card… I checked the card LED first, then the sensor label… I verified the LED tracks the part… I'm still assuming…",
    operator: "Plain words: why the replaced sensor didn't work (wrong type, not a bad machine), why hand-triggering it masks the fault and puts their hand near moving parts, and what to report instead.",
    workOrder: "Symptom (parts missed after sensor swap) · card LED observation · sensor output type vs input card type (NPN/PNP) · correct sensor fitted and terminated · verification (LED tracks part) · note for the crib: match the label on replacements.",
    handoff: "Which sensor was replaced and why the first swap failed (type mismatch) · verification done · watch for missed parts in case alignment also needs touching up · replacements must match output type.",
  },
};

export function closeoutFor(moduleSlug: string, lessonSlug: string): LessonCloseout | null {
  return LESSON_CLOSEOUTS[`${moduleSlug}/${lessonSlug}`] ?? null;
}
