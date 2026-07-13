/**
 * Employer Portal — post roles and SEARCH THE VERIFIED COMPETENCY GRAPH.
 *
 * This is the demand side of the marketplace: employers find technicians by
 * demonstrated diagnostic skill (and open their tamper-evident Skills Passport),
 * not by résumé keywords. The willingness-to-pay here (a placement) is what makes
 * the platform large.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Building2, Search, Plus, Loader2, ExternalLink, Lock } from "lucide-react";
import SEO from "@/components/SEO";

const DOMAINS = [
  ["vfd", "VFD Diagnostics"], ["plc", "PLC Diagnostics"], ["motors", "Motor Control"],
  ["safety", "Safety Circuits"], ["electrical", "Electrical Power"], ["networking", "Industrial Networking"],
  ["sensors", "Sensors & Instrumentation"], ["integration", "System Integration"],
] as const;

export default function EmployerPortal() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"talent" | "post">("talent");

  // Talent search
  const [domain, setDomain] = useState<string>("plc");
  const [minComp, setMinComp] = useState(60);
  const talent = trpc.employer.searchTalent.useQuery(
    { domain: domain as any, minCompetency: minComp, limit: 25 },
    { enabled: isAuthenticated && tab === "talent" },
  );

  // Post job
  const [form, setForm] = useState({ title: "", company: "", location: "", remote: false, description: "", requiredDomain: "plc", minCompetency: 60, salaryMin: "", salaryMax: "" });
  const postJob = trpc.employer.postJob.useMutation();
  const myJobs = trpc.employer.myJobs.useQuery(undefined, { enabled: isAuthenticated && tab === "post" });

  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] text-white flex items-center justify-center p-6">
        <div className="text-center">
          <Lock className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">Sign in to search verified industrial talent.</p>
          <button onClick={() => navigate("/login")} className="rounded bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm">Sign in</button>
        </div>
      </div>
    );
  }

  const submitJob = async () => {
    if (!form.title || !form.company || form.description.length < 10) { toast.error("Fill in title, company, and a description"); return; }
    const res = await postJob.mutateAsync({
      title: form.title, company: form.company, location: form.location || undefined, remote: form.remote,
      description: form.description, requiredDomain: form.requiredDomain as any, minCompetency: form.minCompetency,
      salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined, salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
    });
    if (res.id) { toast.success("Role posted — qualified technicians will see it"); myJobs.refetch(); }
  };

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white">
      <SEO title="Employer Portal" description="Hire industrial technicians by demonstrated competency" path="/employer" />
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"><Building2 className="w-6 h-6 text-emerald-400" /> Hire by proven skill</h1>
        <p className="text-gray-500 text-sm mb-5">Search the verified competency graph. Every candidate has a tamper-evident Skills Passport.</p>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab("talent")} className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm ${tab === "talent" ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-300"}`}><Search className="w-4 h-4" /> Find talent</button>
          <button onClick={() => setTab("post")} className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm ${tab === "post" ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-300"}`}><Plus className="w-4 h-4" /> Post & manage</button>
        </div>

        {tab === "talent" ? (
          <div>
            <div className="flex flex-wrap items-end gap-3 mb-5 rounded-lg border border-gray-800 bg-[#0d120d] p-4">
              <label className="text-xs text-gray-400">Skill domain
                <select value={domain} onChange={e => setDomain(e.target.value)} className="block mt-1 bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm">
                  {DOMAINS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label className="text-xs text-gray-400">Min competency: {minComp}%
                <input type="range" min={0} max={100} value={minComp} onChange={e => setMinComp(Number(e.target.value))} className="block mt-2 w-40" />
              </label>
            </div>
            {talent.isLoading ? (
              <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Searching the competency graph…</div>
            ) : (talent.data?.length ?? 0) === 0 ? (
              <p className="text-gray-500 text-sm">No technicians meet this bar yet. Lower the threshold or check back as the pool grows.</p>
            ) : (
              <div className="space-y-2">
                {talent.data!.map(t => (
                  <div key={t.userId} className="flex items-center gap-3 rounded-lg border border-gray-800 bg-[#0d120d] p-4">
                    <div className="flex-1">
                      <p className="text-white font-medium">{t.name}</p>
                      <p className="text-gray-500 text-xs">Overall competency {t.overallPercent}%</p>
                    </div>
                    <span className="text-emerald-400 font-mono text-lg">{t.domainPercent}%</span>
                    {t.verificationCode && (
                      <a href={`/verify/skills/${t.verificationCode}`} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
                        Passport <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="rounded-lg border border-gray-800 bg-[#0d120d] p-4 space-y-3 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <input className="bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm" placeholder="Job title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                <input className="bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm" placeholder="Company" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                <input className="bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm" placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                <select value={form.requiredDomain} onChange={e => setForm(f => ({ ...f, requiredDomain: e.target.value }))} className="bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm">
                  {DOMAINS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <input className="bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm" placeholder="Salary min (k)" value={form.salaryMin} onChange={e => setForm(f => ({ ...f, salaryMin: e.target.value }))} />
                <input className="bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm" placeholder="Salary max (k)" value={form.salaryMax} onChange={e => setForm(f => ({ ...f, salaryMax: e.target.value }))} />
              </div>
              <label className="text-xs text-gray-400 block">Min competency to apply: {form.minCompetency}%
                <input type="range" min={0} max={100} value={form.minCompetency} onChange={e => setForm(f => ({ ...f, minCompetency: Number(e.target.value) }))} className="block mt-1 w-full" />
              </label>
              <textarea className="w-full bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm h-24" placeholder="Role description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <button onClick={submitJob} disabled={postJob.isPending} className="flex items-center gap-2 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-sm px-4 py-2"><Plus className="w-4 h-4" /> Post role</button>
            </div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Your roles</h3>
            {(myJobs.data?.length ?? 0) === 0 ? <p className="text-gray-600 text-xs">No roles posted yet.</p> : (
              <div className="space-y-2">
                {myJobs.data!.map(j => (
                  <div key={j.id} className="flex items-center justify-between rounded border border-gray-800 p-3 text-sm">
                    <span className="text-gray-200">{j.title} <span className="text-gray-500">· {j.company}</span></span>
                    <span className={`text-xs ${j.status === "open" ? "text-emerald-400" : "text-gray-500"}`}>{j.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
