import type { LessonCardDeck } from "../learningCardTypes";
import { choiceMcq } from "./deckHelpers";

/**
 * Lockout/Tagout & Guarding — Level 1 safety, built to the Risk Assessment bar.
 * Voice: a 30-year tech walking an operator through the procedure that keeps
 * their hands attached. Plain English, plant-floor real, scenario-heavy.
 */
export const GUARDING_LOCKOUT_DECK: LessonCardDeck = {
  moduleSlug: "safety-systems",
  lessonSlug: "guarding-lockout",
  reflection: true, // apprenticeship closeout — scenario in shared/lessonCloseouts.ts (SME-audited)
  title: "Lockout/Tagout: How to Make a Machine Safe",
  whatYoullLearn: [
    "Run the lockout/tagout (LOTO) steps in order — every time, no shortcuts.",
    "Verify zero energy instead of assuming the lock did its job.",
    "Handle group lockout, stored energy, and guards the right way.",
    "Know why you never touch, remove, or bypass someone else's lock or guard.",
  ],
  estimatedMinutes: 16,
  previewCardCount: 3,
  cards: [
    {
      id: "gl-00",
      kind: "concept",
      heading: "New to this?",
      body: "Before this lesson, know these terms:\n\n- **LOTO**: lockout/tagout",
      takeaway: "These terms come up throughout this lesson."
    },
    {
      id: "gl-01",
      kind: "concept",
      heading: "One lock would have saved his hand",
      body: "A tech went in to clear a wrap on a wrapper turntable. He hit the stop button, told the operator 'don't touch it,' and reached in. The operator, doing their job, saw the machine idle and pressed cycle-start to keep the line moving. The turntable indexed. It cost the tech three fingers.\n\nThere was a lockout point 18 inches from his hand. He didn't use it because 'it was just a quick one.' The quick ones are the ones that get you.",
      takeaway: "Telling someone 'don't start it' is not a control. A lock is.",
      visual: { type: "callout", tone: "warning", text: "'I told them not to start it' shows up in a huge share of amputation reports. Verbal warnings fail. Locks don't." },
    },
    {
      id: "gl-02",
      kind: "concept",
      heading: "What lockout/tagout actually is",
      body: "[[LOTO]] is how you make a machine truly safe to put your hands in. Not 'off at the button' — **safe**. You physically disconnect the energy, put your own lock on it so nobody can turn it back on, prove the energy is gone, and only then work.\n\nThe **lock** is a padlock only you hold the key to. The **tag** says who locked it and why. The lock does the protecting; the tag does the communicating.",
      takeaway: "Lockout = your lock physically prevents restart. Tagout = the tag tells everyone why.",
    },
    {
      id: "gl-03",
      kind: "interaction",
      heading: "Quick check — what protects you?",
      body: "",
      interaction: choiceMcq(
        "In the turntable story, what would have prevented the injury?",
        [
          "Telling the operator more clearly not to touch it",
          "Applying his own lock to the disconnect before reaching in",
          "Working faster so he'd be done sooner",
          "Putting up a warning sign",
        ],
        1,
        "Right. His own lock on the energy isolation point is the only thing that physically stops a restart. Words, speed, and signs all failed in that story — a lock wouldn't have.",
        "A verbal warning is exactly what failed here. The fix is a physical lock on the isolation point so the machine CAN'T be started."
      ),
    },
    {
      id: "gl-04",
      kind: "concept",
      heading: "Every energy source, not just electrical",
      body: "[[LOTO]] isn't only pulling the electrical disconnect. A machine can hold several energies, and you have to control every one:\n\n• **Electrical** — disconnect and lock the panel.\n• **Pneumatic / hydraulic** — isolate and **bleed to zero**.\n• **Gravity** — block or lower raised loads and axes.\n• **Mechanical / spring** — release or restrain stored tension.\n• **Thermal / chemical** — isolate and let cool / relieve.\n\nLock the electrical and forget the raised air cylinder, and gravity still gets you.",
      takeaway: "Isolate EVERY energy source. Electrical-only lockout is a common, dangerous mistake.",
    },
    {
      id: "gl-05",
      kind: "example",
      heading: "The [[LOTO]] steps — in order, every time",
      body: "Memorize this order. Doing them out of sequence is how people get hurt:\n\n1. **Prepare** — know every energy source on this machine.\n2. **Notify** — tell the operator and affected people you're locking out.\n3. **Shut down** — normal stop, the right way.\n4. **Isolate** — open every disconnect/valve for every energy.\n5. **Lock & tag** — your lock, your tag, on each isolation point.\n6. **Release stored energy** — bleed air/hydraulic, block gravity, discharge caps.\n7. **VERIFY ZERO** — prove it's dead before you touch it.\n\nRestore in reverse: clear people, remove your lock, then re-energize.",
      takeaway: "Prepare → notify → shut down → isolate → lock & tag → release stored energy → verify.",
      visual: { type: "diagram", variant: "loto-steps" },
    },
    {
      id: "gl-06",
      kind: "concept",
      heading: "Verify zero — the step that actually saves you",
      body: "This is the step people skip, and it's the one that matters most. Applying a lock is not proof the energy is gone — a wrong disconnect, a back-feed, a second source, or trapped pressure can all leave energy live.\n\n**Verify means test it dead:**\n• Try-to-start — hit the start button; nothing should happen.\n• Meter it — check for voltage at the terminals with a meter you trust.\n• Watch the gauge — pneumatic/hydraulic pressure reads a real zero.\n• Check for drift/motion before committing your hands.",
      takeaway: "A lock without verification is a guess. Prove zero energy before every job.",
    },
    {
      id: "gl-07",
      kind: "interaction",
      heading: "Check — the step people skip",
      body: "",
      interaction: choiceMcq(
        "You've notified, shut down, isolated, and applied your lock. What's the LAST thing before you put your hands in?",
        [
          "Start working — the lock is on",
          "Verify zero energy: try-to-start, meter it, and confirm stored energy is released",
          "Fill out the work order",
          "Ask the operator if it's safe",
        ],
        1,
        "Exactly. Verification is the difference between a lock and safety. Try-to-start, meter the terminals, confirm air/hydraulic bled and any raised load blocked — THEN work.",
        "The lock isn't proof. You verify zero energy — try-to-start, meter, confirm stored energy released — before your hands go anywhere."
      ),
    },
    {
      id: "gl-08",
      kind: "concept",
      heading: "One person, one lock — and group lockout",
      body: "Your lock is yours. You hold the only key. Nobody removes your lock but you — ever. If three people work on the same machine, **each person applies their own lock** (a group lockout hasp lets multiple locks share one point). The machine can't be re-energized until the *last* person removes *their* lock.\n\nWhy so strict? Because the moment someone can remove your lock, your life depends on their memory. It shouldn't.",
      takeaway: "Your key, your lock, your life. Never remove anyone else's lock. Group work = everyone locks on.",
    },
    {
      id: "gl-09",
      kind: "interaction",
      heading: "Whose lock is it?",
      body: "",
      interaction: choiceMcq(
        "You come back from break and a machine you need is locked out with a tag that isn't yours. The tag-holder is nowhere around. What do you do?",
        [
          "Cut the lock off — you need the machine and they're gone",
          "Find the person who owns the lock; never remove someone else's lock",
          "Add your own lock and start working around theirs",
          "Ask a supervisor to cut it so you can proceed",
        ],
        1,
        "Right. That lock might be the only thing between another person and a moving machine. You find the owner. Removing someone else's lock — even 'they're gone' — is how people die.",
        "Never remove another person's lock, and don't work a machine someone else has locked. Find the lock's owner — their lock may be protecting their hands right now."
      ),
    },
    {
      id: "gl-10",
      kind: "concept",
      heading: "Guards, interlocks, and why you never defeat them",
      body: "Guards keep body parts out of hazards. Two kinds you'll meet:\n\n• **Fixed guards** — bolted covers over gears, shafts, nips. Take them off with [[LOTO]] applied, put them back before running.\n• **Interlocked guards** — doors with a switch that stops the machine when opened. The switch is a safety device.\n\nDefeating an interlock (jumping the switch, taping the door) so a machine runs with the guard open is one of the most dangerous — and most cited — things you can do. If a job seems to require it, that's a design problem to report, not a shortcut to take.",
      takeaway: "Fixed guards go back on before running. Interlocks are never bypassed to keep production moving.",
    },
    {
      id: "gl-11",
      kind: "example",
      heading: "Scenario — the 'quick' jam clear",
      body: "A box is jammed and the line's backing up. Everyone's watching you. The temptation: stop button, reach, done in 20 seconds.\n\n**Play:** This is the exact setup from the injury stories. Notify the operator, isolate and lock the drive(s), release any stored energy, verify it won't move — then clear it. Yes, it's a couple minutes slower. A couple minutes beats a couple fingers, and the line's already down anyway.",
      takeaway: "There is no jam quick enough to skip [[LOTO]]. The 'quick one' is the dangerous one.",
    },
    {
      id: "gl-12",
      kind: "example",
      heading: "Scenario — raised load, air still in it",
      body: "You lock out the electrical panel on a palletizer, but the lift is parked up on its pneumatic cylinders. You duck under to work.\n\n**Play:** Electrical lockout did nothing about gravity or the trapped air. Bleed the pneumatic system to a verified zero and block or lower the lift **before** any part of you is under it. Locking the panel alone left two energies live.",
      takeaway: "Electrical-only lockout under a raised load is a classic fatal mistake. Control gravity and stored pressure too.",
      visual: { type: "callout", tone: "field", text: "Under a raised load: block it mechanically. Never trust air, hydraulics, or a valve to hold it up while you're under it." },
    },
    {
      id: "gl-13",
      kind: "example",
      heading: "Scenario — the guard's in the way",
      body: "You can see the problem through a gap in a fixed guard. Removing the guard is six bolts. Reaching through the gap with it running would take ten seconds.\n\n**Play:** Take the six bolts. Lock out, remove the guard, do the job, put the guard back before you run it. Reaching past a guard into a running machine is never worth it — and if the design forces routine reaching past guards, write it up so it gets fixed.",
      takeaway: "The safe way being slower doesn't make the fast way okay. Guard comes off with [[LOTO]], goes back before run.",
    },
    {
      id: "gl-14",
      kind: "example",
      heading: "Scenario — 'just tag it, we can't fully lock it'",
      body: "An old machine has an energy source you can't physically lock — only tag. Someone says 'just put a tag on it, that's fine.'\n\n**Play:** Tag-only is far weaker than a lock — a tag is a warning, not a physical block. It's only acceptable under specific rules with extra precautions, and it's not your call to make alone. If you can't lock it, stop and get your supervisor or a qualified person involved before working.",
      takeaway: "A tag warns; a lock protects. If you can't lock it, don't freelance — escalate.",
    },
    {
      id: "gl-15",
      kind: "interaction",
      heading: "Scenario check — put it together",
      body: "",
      interaction: choiceMcq(
        "You're clearing a jam on a machine with a 480V drive and a lift held up on air. You've locked the electrical disconnect. Are you safe to reach under the lift?",
        [
          "Yes — the electrical is locked out",
          "No — the lift is held by air and gravity; bleed the air to zero and block the lift first",
          "Yes, if you're quick about it",
          "Yes, once you put a tag on the air valve",
        ],
        1,
        "Correct. Electrical lockout does nothing about the raised load. Bleed the pneumatic pressure to a verified zero and physically block the lift before any part of you goes underneath. Multiple energies = multiple isolations.",
        "Locking the electrical leaves the air and gravity live. Bleed the pressure to zero and block the lift mechanically before you're under it."
      ),
    },
    {
      id: "gl-16",
      kind: "example",
      heading: "Mistakes that get operators and new techs hurt",
      body: "**Operators moving into maintenance:** trusting the stop button, telling someone 'don't start it' instead of locking, and reaching past guards for a 'quick' fix.\n\n**New techs:** locking only the electrical and forgetting stored energy, skipping verification, cutting or working around someone else's lock, and caving when a supervisor pushes to bypass a guard for production.\n\nEvery one of these is on this deck. If you catch yourself about to do one — stop.",
      takeaway: "The pattern is always a shortcut under pressure. [[LOTO]] exists precisely for those moments.",
    },
    {
      id: "gl-17",
      kind: "interaction",
      heading: "Lesson quiz — the judgment call",
      body: "",
      interaction: choiceMcq(
        "Which of these is ALWAYS wrong, no matter the production pressure?",
        [
          "Taking two extra minutes to lock out before clearing a jam",
          "Bypassing an interlock so a machine runs with a guard open",
          "Bleeding a cylinder to zero before freeing it",
          "Blocking a raised load before working under it",
        ],
        1,
        "Correct. Three of these are exactly what a good tech does. Defeating an interlock to run with a guard open is the line you never cross — no matter who's asking or how far behind the line is.",
        "Three of these are safe practice. Bypassing an interlock to run with a guard open is never acceptable, whatever the pressure."
      ),
    },
    {
      id: "gl-18",
      kind: "summary",
      heading: "Make it safe before you make it work",
      body: "• A verbal 'don't start it' is not a control — **your lock** is.\n• Isolate **every** energy: electrical, pneumatic/hydraulic, gravity, spring, thermal.\n• Run the steps in order and never skip **verify zero energy**.\n• **One person, one lock.** Never remove or work around someone else's lock.\n• Fixed guards go back on before running; **interlocks are never bypassed** for production.\n• If you can't lock it or the job needs a guard defeated — **stop and escalate.**",
      takeaway: "Lock it, prove it's dead, then work. That habit is what makes an operator into a tech people trust.",
    },
  ],
};
