/**
 * MotorStarterInteractive — a live 3-wire start/stop control circuit the learner
 * WORKS, not reads. Press-and-hold START, then let go: the seal-in auxiliary
 * contact latches the coil and the motor keeps running. Trip the overload and
 * the whole string drops — fail-safe, by design.
 *
 * This is the moat move: a NEMA-accurate control schematic that energizes in
 * real time, teaching the single most important behavior in motor control by
 * having the learner cause it. Built to a bar a senior tech would respect.
 */
import { useState } from "react";

const ON = "#22c55e";
const OFF = "#64748b";
const RAIL = "#94a3b8";
const AMBER = "#fbbf24";

export default function MotorStarterInteractive() {
  const [startHeld, setStartHeld] = useState(false);
  const [running, setRunning] = useState(false);
  const [olTripped, setOlTripped] = useState(false);
  const [releasedWhileRunning, setReleasedWhileRunning] = useState(false);

  // Coil energizes when the string is intact and either START is held or the
  // seal-in has already latched the coil (running).
  const coilEnergized = (startHeld || running) && !olTripped;
  const auxClosed = coilEnergized; // aux contact moves with the coil

  const pressStart = () => {
    if (olTripped) return;
    setStartHeld(true);
    setRunning(true);
  };
  const releaseStart = () => {
    setStartHeld(false);
    if (running) setReleasedWhileRunning(true);
  };
  const pressStop = () => {
    setRunning(false);
    setStartHeld(false);
    setReleasedWhileRunning(false);
  };
  const toggleOl = () => {
    setOlTripped((t) => {
      const next = !t;
      if (next) { setRunning(false); setStartHeld(false); setReleasedWhileRunning(false); }
      return next;
    });
  };

  const wire = (live: boolean) => (live ? ON : RAIL);
  const wireW = (live: boolean) => (live ? 3 : 1.6);

  const hint = olTripped
    ? "Overload tripped — the series string is open, so the coil can't energize no matter what you press. That's fail-safe. Reset the overload to restore the string."
    : running && !startHeld
      ? "You let go of START and it's still running. The seal-in aux contact is holding the coil's path complete. That is the whole trick of this circuit."
      : coilEnergized && startHeld
        ? "Coil energized, aux contact closed. Now release START and watch what happens…"
        : "Press and hold START. Watch the coil pull in and the aux contact close.";

  return (
    <div className="rounded-lg border border-[oklch(0.18_0.004_250)] bg-[oklch(0.07_0.003_250)] p-3">
      <svg viewBox="0 0 400 250" className="w-full h-auto" role="img" aria-label="Interactive three-wire motor starter control circuit">
        {/* rails */}
        <line x1={28} y1={44} x2={28} y2={150} stroke={RAIL} strokeWidth={2} />
        <line x1={372} y1={44} x2={372} y2={150} stroke={RAIL} strokeWidth={2} />
        <text x={20} y={38} fill={AMBER} fontSize={10} fontFamily="monospace">L1 · 120 VAC</text>
        <text x={348} y={38} fill={RAIL} fontSize={10} fontFamily="monospace">L2 / N</text>

        {/* main rung wires (green when that segment is conducting) */}
        <line x1={28} y1={80} x2={74} y2={80} stroke={wire(!olTripped)} strokeWidth={wireW(!olTripped)} />
        <line x1={106} y1={80} x2={154} y2={80} stroke={wire(coilEnergized)} strokeWidth={wireW(coilEnergized)} />
        <line x1={186} y1={80} x2={234} y2={80} stroke={wire(coilEnergized)} strokeWidth={wireW(coilEnergized)} />
        <line x1={266} y1={80} x2={312} y2={80} stroke={wire(coilEnergized)} strokeWidth={wireW(coilEnergized)} />
        <line x1={348} y1={80} x2={372} y2={80} stroke={wire(coilEnergized)} strokeWidth={wireW(coilEnergized)} />

        {/* STOP — NC pushbutton at x=90 */}
        <g>
          <line x1={74} y1={80} x2={82} y2={80} stroke={RAIL} strokeWidth={1.6} />
          <line x1={82} y1={68} x2={82} y2={92} stroke={RAIL} strokeWidth={2} />
          <line x1={98} y1={68} x2={98} y2={92} stroke={RAIL} strokeWidth={2} />
          <line x1={82} y1={72} x2={100} y2={64} stroke={RAIL} strokeWidth={2} />
          <line x1={90} y1={60} x2={90} y2={64} stroke={RAIL} strokeWidth={1.6} />
          <circle cx={90} cy={57} r={3} fill="none" stroke={RAIL} strokeWidth={1.6} />
          <line x1={98} y1={80} x2={106} y2={80} stroke={RAIL} strokeWidth={1.6} />
          <text x={90} y={106} fill={RAIL} fontSize={9} textAnchor="middle" fontFamily="monospace">STOP (NC)</text>
        </g>

        {/* START — NO pushbutton at x=170 */}
        <g>
          <line x1={154} y1={80} x2={162} y2={80} stroke={wire(coilEnergized)} strokeWidth={wireW(coilEnergized)} />
          <line x1={162} y1={68} x2={162} y2={92} stroke={startHeld ? ON : RAIL} strokeWidth={2} />
          <line x1={178} y1={68} x2={178} y2={92} stroke={startHeld ? ON : RAIL} strokeWidth={2} />
          {/* contact bar: bridges when held */}
          <line x1={162} y1={startHeld ? 80 : 70} x2={180} y2={startHeld ? 80 : 62} stroke={startHeld ? ON : RAIL} strokeWidth={2} />
          <line x1={170} y1={58} x2={170} y2={62} stroke={RAIL} strokeWidth={1.6} />
          <circle cx={170} cy={55} r={3} fill="none" stroke={RAIL} strokeWidth={1.6} />
          <line x1={178} y1={80} x2={186} y2={80} stroke={wire(coilEnergized)} strokeWidth={wireW(coilEnergized)} />
          <text x={170} y={106} fill={startHeld ? ON : RAIL} fontSize={9} textAnchor="middle" fontFamily="monospace">START (NO)</text>
        </g>

        {/* OL — overload NC contact at x=250 */}
        <g>
          <line x1={234} y1={80} x2={242} y2={80} stroke={wire(coilEnergized)} strokeWidth={wireW(coilEnergized)} />
          <line x1={242} y1={68} x2={242} y2={92} stroke={olTripped ? "#ef4444" : wire(coilEnergized)} strokeWidth={2} />
          <line x1={258} y1={68} x2={258} y2={92} stroke={olTripped ? "#ef4444" : wire(coilEnergized)} strokeWidth={2} />
          {/* NC bar: closed (bridged) unless tripped */}
          <line x1={242} y1={olTripped ? 70 : 80} x2={260} y2={olTripped ? 62 : 80} stroke={olTripped ? "#ef4444" : wire(coilEnergized)} strokeWidth={2} />
          <line x1={258} y1={80} x2={266} y2={80} stroke={wire(coilEnergized)} strokeWidth={wireW(coilEnergized)} />
          <text x={250} y={106} fill={olTripped ? "#ef4444" : RAIL} fontSize={9} textAnchor="middle" fontFamily="monospace">OL{olTripped ? " ✕" : ""}</text>
        </g>

        {/* Coil M at x=330 */}
        <g>
          <circle cx={330} cy={80} r={16} fill="none" stroke={coilEnergized ? ON : RAIL} strokeWidth={coilEnergized ? 3 : 1.8} />
          <text x={330} y={85} fill={coilEnergized ? ON : RAIL} fontSize={13} textAnchor="middle" fontFamily="monospace" fontWeight={700}>M</text>
          <text x={330} y={106} fill={RAIL} fontSize={9} textAnchor="middle" fontFamily="monospace">COIL</text>
        </g>

        {/* Seal-in parallel branch around START: tap (120,80) → down → aux → up (220,80) */}
        <line x1={120} y1={80} x2={120} y2={130} stroke={wire(auxClosed)} strokeWidth={wireW(auxClosed)} />
        <line x1={120} y1={130} x2={154} y2={130} stroke={wire(auxClosed)} strokeWidth={wireW(auxClosed)} />
        {/* aux NO contact at x=170, y=130 — closes when coil energized */}
        <line x1={154} y1={130} x2={162} y2={130} stroke={wire(auxClosed)} strokeWidth={wireW(auxClosed)} />
        <line x1={162} y1={120} x2={162} y2={140} stroke={auxClosed ? ON : RAIL} strokeWidth={2} />
        <line x1={178} y1={120} x2={178} y2={140} stroke={auxClosed ? ON : RAIL} strokeWidth={2} />
        <line x1={162} y1={auxClosed ? 130 : 122} x2={180} y2={auxClosed ? 130 : 114} stroke={auxClosed ? ON : RAIL} strokeWidth={2} />
        <line x1={178} y1={130} x2={186} y2={130} stroke={wire(auxClosed)} strokeWidth={wireW(auxClosed)} />
        <line x1={186} y1={130} x2={220} y2={130} stroke={wire(auxClosed)} strokeWidth={wireW(auxClosed)} />
        <line x1={220} y1={130} x2={220} y2={80} stroke={wire(auxClosed)} strokeWidth={wireW(auxClosed)} />
        <text x={170} y={154} fill={auxClosed ? ON : RAIL} fontSize={9} textAnchor="middle" fontFamily="monospace">SEAL-IN AUX (NO)</text>

        {/* Motor + coil-voltage readout */}
        <g>
          <circle cx={330} cy={200} r={22} fill="none" stroke={running ? ON : OFF} strokeWidth={running ? 3 : 1.8} />
          <text x={330} y={205} fill={running ? ON : OFF} fontSize={15} textAnchor="middle" fontFamily="monospace" fontWeight={700}>M</text>
          {running && (
            <g>
              <path d="M330 182 A18 18 0 0 1 348 200" fill="none" stroke={ON} strokeWidth={2}>
                <animateTransform attributeName="transform" type="rotate" from="0 330 200" to="360 330 200" dur="0.9s" repeatCount="indefinite" />
              </path>
            </g>
          )}
          <text x={330} y={236} fill={running ? ON : OFF} fontSize={10} textAnchor="middle" fontFamily="monospace">{running ? "MOTOR RUNNING" : "MOTOR STOPPED"}</text>
        </g>
        <g>
          <rect x={28} y={182} width={150} height={34} rx={4} fill="oklch(0.10 0.003 250)" stroke={coilEnergized ? ON : "oklch(0.22 0.004 250)"} />
          <text x={38} y={198} fill={RAIL} fontSize={9} fontFamily="monospace">Coil A1–A2</text>
          <text x={38} y={211} fill={coilEnergized ? ON : OFF} fontSize={13} fontFamily="monospace" fontWeight={700}>{coilEnergized ? "120 VAC" : "0 VAC"}</text>
        </g>
      </svg>

      {/* Controls */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onPointerDown={pressStart}
          onPointerUp={releaseStart}
          onPointerLeave={() => startHeld && releaseStart()}
          className="select-none rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2.5 min-h-11"
          aria-label="Press and hold Start"
        >
          Press &amp; hold START
        </button>
        <button
          type="button"
          onClick={pressStop}
          className="rounded-md border border-red-500/40 text-red-300 hover:bg-red-500/10 text-sm font-medium px-4 py-2.5 min-h-11"
        >
          STOP
        </button>
        <button
          type="button"
          onClick={toggleOl}
          className={`rounded-md border text-sm font-medium px-4 py-2.5 min-h-11 ${olTripped ? "border-amber-500/60 text-amber-300 bg-amber-500/10" : "border-[oklch(0.28_0.004_250)] text-[oklch(0.65_0.008_250)] hover:bg-white/5"}`}
        >
          {olTripped ? "Reset overload" : "Trip overload"}
        </button>
      </div>

      <div className={`mt-3 rounded-md border-l-4 px-3 py-2 text-sm leading-relaxed ${releasedWhileRunning && running ? "border-l-emerald-500 bg-emerald-500/8 text-[oklch(0.80_0.05_155)]" : "border-l-[oklch(0.35_0.06_250)] bg-[oklch(0.10_0.003_250)] text-[oklch(0.68_0.008_250)]"}`} role="status">
        {hint}
      </div>
    </div>
  );
}
