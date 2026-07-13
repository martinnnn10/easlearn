import { ClipboardList } from "lucide-react";

interface ConveyorMissionBriefingProps {
  onStart: () => void;
}

export default function ConveyorMissionBriefing({ onStart }: ConveyorMissionBriefingProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[oklch(0.04_0.003_250/92%)] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conveyor-mission-title"
    >
      <div className="w-full max-w-lg rounded-lg border border-[oklch(0.22_0.006_250)] bg-[oklch(0.08_0.003_250)] shadow-[0_24px_80px_oklch(0_0_0/55%)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[oklch(0.16_0.004_250)] bg-[oklch(0.06_0.003_250)] flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[oklch(0.50_0.008_250)]">
            Maintenance dispatch
          </span>
          <span className="ml-auto text-[10px] font-mono text-[oklch(0.45_0.006_250)]">Ticket #L4-2847</span>
        </div>

        <div className="p-5 sm:p-6 space-y-4 font-mono text-sm">
          <div>
            <h2 id="conveyor-mission-title" className="text-lg sm:text-xl font-heading text-[oklch(0.92_0.02_30)] tracking-wide">
              LINE 4 CONVEYOR DOWN
            </h2>
            <p className="text-[11px] text-[oklch(0.48_0.006_250)] mt-1">Time: 2:07 AM · Packaging · Shift B</p>
          </div>

          <div className="space-y-3 text-[12px] leading-relaxed">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[oklch(0.45_0.006_250)] mb-1">Operator report</div>
              <p className="text-[oklch(0.78_0.02_60)] italic">"The conveyor won't start."</p>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[oklch(0.45_0.006_250)] mb-1">Production impact</div>
              <p className="text-[oklch(0.65_0.008_250)]">Packaging line stopped.</p>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[oklch(0.45_0.006_250)] mb-1">Your role</div>
              <p className="text-white">Maintenance Technician</p>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[oklch(0.45_0.006_250)] mb-1">Objective</div>
              <p className="text-[oklch(0.65_0.008_250)]">
                Find the root cause and return the conveyor to service safely.
              </p>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[oklch(0.45_0.006_250)] mb-1">Tools available</div>
              <ul className="text-[oklch(0.60_0.008_250)] list-disc pl-4 space-y-0.5">
                <li>Electrical prints</li>
                <li>Ladder logic</li>
                <li>Multimeter</li>
                <li>I/O diagnostics</li>
              </ul>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[oklch(0.45_0.006_250)] mb-1">Expected time</div>
              <p className="text-[oklch(0.60_0.008_250)]">3–5 minutes</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onStart}
            className="w-full mt-2 px-4 py-3.5 min-h-[3rem] text-sm font-mono uppercase tracking-wider rounded-md border border-[oklch(0.55_0.12_155/50%)] bg-[oklch(0.14_0.05_155)] text-[oklch(0.82_0.12_155)] hover:bg-[oklch(0.18_0.06_155)] transition-colors"
          >
            Start troubleshooting
          </button>
        </div>
      </div>
    </div>
  );
}
