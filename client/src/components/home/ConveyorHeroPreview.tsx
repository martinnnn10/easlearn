import { motion } from "framer-motion";

/** Static hero preview — ladder, machine twin, I/O at a glance (no live sim). */
export default function ConveyorHeroPreview() {
  return (
    <div
      className="relative w-full max-w-xl mx-auto lg:mx-0 rounded-xl border border-[oklch(0.18_0.004_250)] bg-[oklch(0.06_0.003_250)] overflow-hidden shadow-[0_20px_60px_oklch(0_0_0/45%)]"
      aria-hidden
    >
      <div className="px-3 py-2 border-b border-[oklch(0.14_0.004_250)] flex items-center justify-between">
        <span className="text-[10px] font-mono text-[oklch(0.50_0.008_250)] uppercase tracking-wider">
          Conveyor PLC Diagnostic Lab
        </span>
        <span className="text-[10px] font-mono text-[oklch(0.55_0.12_155)]">● LIVE</span>
      </div>
      <div className="grid grid-cols-3 gap-px bg-[oklch(0.12_0.004_250)] p-px">
        <div className="bg-[oklch(0.08_0.003_250)] p-2 min-h-[120px]">
          <div className="text-[9px] font-mono text-[oklch(0.45_0.006_250)] uppercase mb-2">Ladder</div>
          <div className="space-y-1.5 font-mono text-[9px] text-[oklch(0.55_0.08_155)]">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2.4 }}
              className="px-1 py-0.5 rounded bg-[oklch(0.12_0.04_155/40%)]"
            >
              I:1/5 ───[ ]───
            </motion.div>
            <div className="text-[oklch(0.50_0.006_250)]">O:2/0 ───( )───</div>
          </div>
        </div>
        <div className="bg-[oklch(0.08_0.003_250)] p-2 min-h-[120px]">
          <div className="text-[9px] font-mono text-[oklch(0.45_0.006_250)] uppercase mb-2">Machine</div>
          <div className="flex justify-center gap-2 mt-3">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="w-5 h-5 rounded-full bg-[oklch(0.55_0.15_30)] border border-[oklch(0.65_0.15_30)]"
            />
            <div className="w-5 h-5 rounded-full bg-[oklch(0.12_0.02_155)] border border-[oklch(0.25_0.04_155)]" />
          </div>
          <p className="text-[8px] font-mono text-[oklch(0.55_0.08_60)] italic mt-3 text-center leading-tight">
            "Won't start"
          </p>
        </div>
        <div className="bg-[oklch(0.08_0.003_250)] p-2 min-h-[120px]">
          <div className="text-[9px] font-mono text-[oklch(0.45_0.006_250)] uppercase mb-2">I/O</div>
          <div className="grid grid-cols-2 gap-1 text-[8px] font-mono">
            {["I:1/2", "I:1/5", "O:2/0"].map((tag, i) => (
              <div
                key={tag}
                className={`px-1 py-0.5 rounded border ${
                  i === 1
                    ? "border-[oklch(0.55_0.12_155/40%)] text-[oklch(0.70_0.10_155)]"
                    : "border-[oklch(0.18_0.004_250)] text-[oklch(0.45_0.006_250)]"
                }`}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-3 py-2 text-[9px] font-mono text-[oklch(0.42_0.006_250)] border-t border-[oklch(0.14_0.004_250)]">
        Packaging Line 4 · Practice breakdown call
      </div>
    </div>
  );
}
