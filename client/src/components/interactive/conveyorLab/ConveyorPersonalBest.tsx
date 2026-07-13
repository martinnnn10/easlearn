import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPersonalBests, type PersonalBestStore } from "@/lib/conveyorLab/personalBest";
import { FAULT_CATALOG } from "@/lib/conveyorLab/faultCatalog";
import type { FaultId } from "@/lib/conveyorLab/types";

interface ConveyorPersonalBestProps {
  /** If set, show a "new record" badge for this fault */
  newRecordFault?: FaultId | null;
  isNewBestTime?: boolean;
  isNewBestScore?: boolean;
}

function formatTime(sec: number): string {
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

export default function ConveyorPersonalBest({
  newRecordFault,
  isNewBestTime,
  isNewBestScore,
}: ConveyorPersonalBestProps) {
  const [store, setStore] = useState<PersonalBestStore | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setStore(getPersonalBests());
  }, []);

  if (!store || Object.keys(store.records).length === 0) return null;

  const records = Object.values(store.records).sort((a, b) => b.bestScore - a.bestScore);
  const faultLabels = new Map(FAULT_CATALOG.map((f) => [f.id, f.label]));

  return (
    <div className="mb-4">
      {/* New record celebration */}
      <AnimatePresence>
        {newRecordFault && (isNewBestTime || isNewBestScore) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mb-3 px-3 py-2 rounded-md bg-[oklch(0.10_0.04_80)] border border-[oklch(0.60_0.15_80/50%)]"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">🏆</span>
              <div>
                <div className="text-[11px] font-mono font-bold text-[oklch(0.80_0.12_80)]">
                  New Personal Best!
                </div>
                <div className="text-[9px] font-mono text-[oklch(0.60_0.08_80)]">
                  {isNewBestTime && isNewBestScore
                    ? "Fastest time & highest score"
                    : isNewBestTime
                    ? "Fastest diagnosis time"
                    : "Highest score achieved"}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact stats bar */}
      <div className="flex items-center justify-between px-3 py-2 rounded-md bg-[oklch(0.06_0.003_250)] border border-[oklch(0.14_0.004_250)]">
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="text-[oklch(0.45_0.006_250)]">
            Attempts: <span className="text-white">{store.totalAttempts}</span>
          </span>
          <span className="text-[oklch(0.45_0.006_250)]">
            Streak: <span className="text-[oklch(0.75_0.12_155)]">{store.currentStreak}</span>
          </span>
          <span className="text-[oklch(0.45_0.006_250)]">
            Best: <span className="text-[oklch(0.65_0.12_80)]">{store.longestStreak}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] font-mono text-[oklch(0.55_0.12_250)] hover:underline"
        >
          {expanded ? "Hide records" : "View records"}
        </button>
      </div>

      {/* Expanded per-fault records */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1">
              {records.map((rec) => (
                <div
                  key={rec.faultId}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-[10px] font-mono bg-[oklch(0.06_0.003_250)] border ${
                    rec.faultId === newRecordFault
                      ? "border-[oklch(0.60_0.15_80/50%)]"
                      : "border-[oklch(0.12_0.004_250)]"
                  }`}
                >
                  <span className="flex-1 text-[oklch(0.55_0.008_250)] truncate">
                    {faultLabels.get(rec.faultId as FaultId) || rec.faultId}
                  </span>
                  <span className="text-[oklch(0.65_0.12_155)] shrink-0" title="Best time">
                    ⏱ {formatTime(rec.bestTimeSeconds)}
                  </span>
                  <span className="text-[oklch(0.65_0.12_80)] shrink-0" title="Best score">
                    {rec.bestScore}%
                  </span>
                  <span className="text-[oklch(0.40_0.006_250)] shrink-0" title="Attempts">
                    ×{rec.attempts}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
