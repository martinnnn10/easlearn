/**
 * Workforce Intelligence console — the data-network moat + platform layer.
 *
 * Benchmarks and supply/demand over the verified competency graph (the data
 * product employers/OEMs/insurers pay for), plus public API key management
 * (the OEM/CMMS integration layer). Gated to signed-in users; in production
 * this is an enterprise/admin surface.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BarChart3, TrendingUp, KeyRound, Plus, Copy, Loader2, Lock, ShieldOff } from "lucide-react";
import SEO from "@/components/SEO";

export default function WorkforceIntelligence() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [threshold, setThreshold] = useState(70);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyLabel, setKeyLabel] = useState("");

  const benchmarks = trpc.intelligence.benchmarks.useQuery(undefined, { enabled: isAuthenticated });
  const supplyDemand = trpc.intelligence.supplyDemand.useQuery({ threshold }, { enabled: isAuthenticated });
  const apiKeys = trpc.intelligence.listApiKeys.useQuery(undefined, { enabled: isAuthenticated });
  const createKey = trpc.intelligence.createApiKey.useMutation();
  const revokeKey = trpc.intelligence.revokeApiKey.useMutation();

  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] text-white flex items-center justify-center p-6">
        <div className="text-center">
          <Lock className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">Sign in to access workforce intelligence.</p>
          <button onClick={() => navigate("/login")} className="rounded bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm">Sign in</button>
        </div>
      </div>
    );
  }

  const create = async () => {
    if (!keyLabel.trim()) { toast.error("Name the key (e.g. 'Rockwell integration')"); return; }
    const res = await createKey.mutateAsync({ label: keyLabel, scopes: ["verify", "talent", "jobs"] });
    setNewKey(res.key);
    setKeyLabel("");
    apiKeys.refetch();
  };

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white">
      <SEO title="Workforce Intelligence" description="Skill benchmarks, supply/demand, and platform API" path="/intelligence" />
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-emerald-400" /> Workforce Intelligence</h1>
        <p className="text-gray-500 text-sm mb-6">Aggregate, anonymized competency analytics over the verified talent graph.</p>

        {/* Benchmarks */}
        <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Competency benchmarks by domain</h3>
          {benchmarks.isLoading ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Aggregating…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-500 text-xs text-left">
                  <th className="py-1">Domain</th><th>Learners</th><th>Avg</th><th>p50</th><th>p75</th><th>p90</th>
                </tr></thead>
                <tbody>
                  {benchmarks.data?.map(b => (
                    <tr key={b.domain} className="border-t border-gray-800/60">
                      <td className="py-2 text-gray-200">{b.label}</td>
                      <td className="text-gray-400">{b.learners}</td>
                      <td className="text-emerald-400">{b.avg}%</td>
                      <td className="text-gray-400">{b.p50}%</td>
                      <td className="text-gray-400">{b.p75}%</td>
                      <td className="text-gray-400">{b.p90}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Supply/Demand */}
        <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> Talent supply vs job demand</h3>
            <label className="text-xs text-gray-500">Qualified at ≥{threshold}%
              <input type="range" min={0} max={100} value={threshold} onChange={e => setThreshold(Number(e.target.value))} className="ml-2 w-28 align-middle" />
            </label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {supplyDemand.data?.map(s => (
              <div key={s.domain} className="rounded border border-gray-800 p-3">
                <div className="text-gray-300 text-xs mb-1">{s.label}</div>
                <div className="text-white text-sm">{s.supply} qualified · {s.demand} open</div>
                {s.ratio != null && <div className={`text-xs mt-1 ${s.ratio < 1 ? "text-red-400" : "text-emerald-400"}`}>{s.ratio < 1 ? "talent shortage" : "talent surplus"} ({s.ratio}×)</div>}
              </div>
            ))}
          </div>
        </div>

        {/* API keys */}
        <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-1 flex items-center gap-2"><KeyRound className="w-4 h-4 text-emerald-400" /> Public API keys</h3>
          <p className="text-gray-500 text-xs mb-3">For OEM / CMMS / HR integrations. Endpoints: <code>/api/v1/verify/:code</code>, <code>/api/v1/talent</code>, <code>/api/v1/jobs</code>.</p>

          {newKey && (
            <div className="rounded border border-emerald-500/40 bg-emerald-500/10 p-3 mb-3">
              <p className="text-emerald-300 text-xs mb-1">Copy this key now — it won't be shown again:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-white break-all">{newKey}</code>
                <button onClick={() => { navigator.clipboard.writeText(newKey); toast.success("Copied"); }} className="text-emerald-400"><Copy className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            <input className="flex-1 bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm" placeholder="Key name (e.g. Rockwell integration)" value={keyLabel} onChange={e => setKeyLabel(e.target.value)} />
            <button onClick={create} disabled={createKey.isPending} className="inline-flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-sm px-3 py-1.5"><Plus className="w-4 h-4" /> Create</button>
          </div>

          <div className="space-y-1.5">
            {apiKeys.data?.map(k => (
              <div key={k.id} className="flex items-center gap-3 text-sm border-t border-gray-800/60 py-2">
                <code className="text-gray-300">{k.keyPrefix}…</code>
                <span className="text-gray-500 text-xs">{k.label}</span>
                <span className="text-gray-600 text-[10px]">{k.scopes}</span>
                <span className="ml-auto flex items-center gap-2">
                  {k.active ? <span className="text-emerald-400 text-xs">active</span> : <span className="text-gray-500 text-xs">revoked</span>}
                  {k.active && <button onClick={() => revokeKey.mutateAsync({ id: k.id }).then(() => apiKeys.refetch())} className="text-gray-500 hover:text-red-400" title="Revoke"><ShieldOff className="w-3.5 h-3.5" /></button>}
                </span>
              </div>
            ))}
            {(apiKeys.data?.length ?? 0) === 0 && <p className="text-gray-600 text-xs">No keys yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
