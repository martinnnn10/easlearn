import type { DriveParameter } from "@/lib/powerflexLab/types";

interface PowerFlexParameterPanelProps {
  parameters: DriveParameter[];
  onBrowse: () => void;
}

export default function PowerFlexParameterPanel({ parameters, onBrowse }: PowerFlexParameterPanelProps) {
  return (
    <div className="powerflex-lab-panel p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-mono text-[oklch(0.45_0.006_250)] uppercase">Parameter Browse</div>
        <button
          type="button"
          onClick={onBrowse}
          className="text-[10px] font-mono px-2 py-1 rounded border border-[oklch(0.55_0.12_250/40%)] text-[oklch(0.65_0.10_250)]"
        >
          Log review
        </button>
      </div>
      <table className="w-full text-[10px] font-mono">
        <thead>
          <tr className="text-[oklch(0.45_0.006_250)] text-left">
            <th className="pb-2 pr-2">Param</th>
            <th className="pb-2 pr-2">Name</th>
            <th className="pb-2 pr-2">Value</th>
            <th className="pb-2">Group</th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((p) => (
            <tr
              key={p.number}
              className={`border-t border-[oklch(0.12_0.004_250)] ${
                p.abnormal ? "text-[oklch(0.75_0.15_30)]" : "text-[oklch(0.55_0.008_250)]"
              }`}
            >
              <td className="py-1.5 pr-2 text-white">{p.number}</td>
              <td className="py-1.5 pr-2">{p.name}</td>
              <td className="py-1.5 pr-2">
                {p.value} {p.unit}
                {p.abnormal && <span className="ml-1 text-[oklch(0.55_0.15_30)]">⚠</span>}
              </td>
              <td className="py-1.5">{p.group}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-[10px] text-[oklch(0.42_0.006_250)]">
        Curated monitor set — not full PowerFlex parameter database (beta lab).
      </p>
    </div>
  );
}
