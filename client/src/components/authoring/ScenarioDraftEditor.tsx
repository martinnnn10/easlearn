/**
 * ScenarioDraftEditor — authoring surface for simulator scenarios (ScenarioV3).
 *
 * ScenarioV3 is too structurally rich (system states, terminal measurements,
 * animations, comms) for a form, so authors edit the JSON payload directly with
 * live client-side validation + metadata fields. The server's scenarioPublishSchema
 * enforces the hard invariants on publish (exactly one correct action per actionable
 * state; every Fault.correctFixId references a real action), so a scenario can't go
 * live unless the engine + scoring + tutor would have ground truth.
 *
 * Writes through trpc.authoring.{listScenarioDrafts,upsertScenarioDraft,publishScenarioDraft}.
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Save, UploadCloud, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";

type Difficulty = "beginner" | "intermediate" | "advanced";

interface Meta {
  slug: string;
  title: string;
  category: string;
  difficulty: Difficulty;
}

const STARTER_JSON = `{
  "id": "",
  "title": "",
  "plantContext": { "plantName": "", "lineName": "" },
  "phases": [{ "initialStateId": "state-1" }],
  "systemStates": {
    "state-1": {
      "availableActions": [
        { "id": "fix-a", "isCorrect": true },
        { "id": "fix-b", "isCorrect": false }
      ]
    }
  },
  "faults": [{ "id": "fault-1", "correctFixId": "fix-a" }]
}`;

/** Mirror of the server invariants — gives authors instant feedback pre-publish. */
function clientValidate(raw: string): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  let s: any;
  try {
    s = JSON.parse(raw);
  } catch (e) {
    return { ok: false, issues: [`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`] };
  }
  if (!s.id) issues.push("Missing scenario id");
  if (!s.title) issues.push("Missing title");
  if (!s.plantContext?.plantName || !s.plantContext?.lineName) issues.push("plantContext needs plantName + lineName");
  if (!Array.isArray(s.faults) || s.faults.length === 0) issues.push("At least one fault required");
  if (!Array.isArray(s.phases) || s.phases.length === 0) issues.push("At least one phase required");

  const allActionIds = new Set<string>();
  if (s.systemStates && typeof s.systemStates === "object") {
    for (const [stateId, st] of Object.entries<any>(s.systemStates)) {
      const actions = st?.availableActions ?? [];
      actions.forEach((a: any) => a?.id && allActionIds.add(a.id));
      if (actions.length > 0) {
        const correct = actions.filter((a: any) => a?.isCorrect).length;
        if (correct !== 1) issues.push(`State "${stateId}" must have exactly one correct action (found ${correct})`);
      }
    }
  } else {
    issues.push("Missing systemStates");
  }
  if (Array.isArray(s.faults)) {
    for (const f of s.faults) {
      if (f?.correctFixId && !allActionIds.has(f.correctFixId)) {
        issues.push(`Fault "${f.id}" correctFixId "${f.correctFixId}" matches no action`);
      }
    }
  }
  return { ok: issues.length === 0, issues };
}

export default function ScenarioDraftEditor() {
  const [draftId, setDraftId] = useState<number | null>(null);
  const [meta, setMeta] = useState<Meta>({ slug: "", title: "", category: "Motor Control", difficulty: "intermediate" });
  const [json, setJson] = useState(STARTER_JSON);

  const drafts = trpc.authoring.listScenarioDrafts.useQuery();
  const upsert = trpc.authoring.upsertScenarioDraft.useMutation();
  const publish = trpc.authoring.publishScenarioDraft.useMutation();

  const local = useMemo(() => clientValidate(json), [json]);

  const loadDraft = (id: number) => {
    const row = drafts.data?.find(r => r.id === id);
    if (!row) return;
    setDraftId(id);
    setMeta({ slug: row.slug, title: row.title, category: row.category, difficulty: row.difficulty as Difficulty });
    setJson(JSON.stringify(row.scenario, null, 2));
  };

  const newDraft = () => {
    setDraftId(null);
    setMeta({ slug: "", title: "", category: "Motor Control", difficulty: "intermediate" });
    setJson(STARTER_JSON);
  };

  const handleSave = async () => {
    if (!local.ok && !confirm("JSON has validation issues. Save as draft anyway?")) return;
    let scenario: Record<string, unknown>;
    try {
      scenario = JSON.parse(json);
    } catch {
      toast.error("Fix JSON before saving");
      return;
    }
    const res = await upsert.mutateAsync({
      id: draftId ?? undefined,
      slug: meta.slug,
      title: meta.title,
      category: meta.category,
      difficulty: meta.difficulty,
      scenario,
    });
    setDraftId(res.id);
    toast.success("Scenario draft saved");
    drafts.refetch();
  };

  const handlePublish = async () => {
    if (!draftId) {
      toast.error("Save the draft first");
      return;
    }
    if (!local.ok) {
      toast.error("Resolve validation issues before publishing");
      return;
    }
    await handleSave();
    const res = await publish.mutateAsync({ id: draftId });
    if (res.ok) {
      toast.success("Scenario published — passed all gates");
      drafts.refetch();
    } else {
      toast.error(`Blocked by ${res.errors.length} server validation issue(s)`);
    }
  };

  const serverErrors = publish.data && !publish.data.ok ? publish.data.errors : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_320px] gap-4">
      {/* Drafts list */}
      <aside className="rounded-lg border border-gray-800 bg-[#0d120d] p-3">
        <button onClick={newDraft} className="w-full flex items-center justify-center gap-2 rounded bg-emerald-600 hover:bg-emerald-700 text-sm py-2 mb-3">
          <Plus className="w-4 h-4" /> New scenario
        </button>
        <div className="space-y-1">
          {drafts.data?.map(r => (
            <button
              key={r.id}
              onClick={() => loadDraft(r.id)}
              className={`w-full text-left text-xs px-2 py-2 rounded flex items-center gap-2 ${draftId === r.id ? "bg-emerald-500/15 text-emerald-300" : "hover:bg-gray-800/50 text-gray-300"}`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{r.title || "(untitled)"}</span>
              <span className={`ml-auto text-[9px] uppercase ${r.status === "published" ? "text-emerald-400" : "text-gray-500"}`}>{r.status}</span>
            </button>
          ))}
          {drafts.data?.length === 0 && <p className="text-gray-600 text-xs px-2">No scenario drafts yet.</p>}
        </div>
      </aside>

      {/* Editor */}
      <main className="rounded-lg border border-gray-800 bg-[#0d120d] p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input className="bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm" placeholder="scenario-slug" value={meta.slug} onChange={e => setMeta(m => ({ ...m, slug: e.target.value }))} />
          <input className="bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm" placeholder="Title" value={meta.title} onChange={e => setMeta(m => ({ ...m, title: e.target.value }))} />
          <input className="bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm" placeholder="Category" value={meta.category} onChange={e => setMeta(m => ({ ...m, category: e.target.value }))} />
          <select className="bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm" value={meta.difficulty} onChange={e => setMeta(m => ({ ...m, difficulty: e.target.value as Difficulty }))}>
            <option value="beginner">beginner</option>
            <option value="intermediate">intermediate</option>
            <option value="advanced">advanced</option>
          </select>
        </div>
        <label className="text-xs text-gray-400">ScenarioV3 JSON payload</label>
        <textarea
          className="w-full bg-[#0a0f0a] border border-gray-700 rounded px-3 py-2 text-xs font-mono text-gray-200 h-[420px]"
          spellCheck={false}
          value={json}
          onChange={e => setJson(e.target.value)}
        />
        <div className="flex gap-2 pt-2 border-t border-gray-800">
          <button onClick={handleSave} disabled={upsert.isPending} className="flex items-center gap-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-sm px-3 py-1.5"><Save className="w-4 h-4" /> Save draft</button>
          <button onClick={handlePublish} disabled={publish.isPending || !local.ok} className="flex items-center gap-2 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-sm px-3 py-1.5"><UploadCloud className="w-4 h-4" /> Validate & publish</button>
        </div>
      </main>

      {/* Validation panel */}
      <aside className="rounded-lg border border-gray-800 bg-[#0d120d] p-4">
        <h3 className="text-sm font-semibold mb-3 text-gray-300">Validation</h3>
        {local.ok ? (
          <p className="text-emerald-400 text-xs flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Passes all client invariants.</p>
        ) : (
          <ul className="text-red-400 text-xs space-y-1.5">
            {local.issues.map((e, i) => <li key={i} className="flex items-start gap-1.5"><AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {e}</li>)}
          </ul>
        )}
        {serverErrors.length > 0 && (
          <>
            <h4 className="text-xs text-gray-500 mt-4 mb-2">Server rejected:</h4>
            <ul className="text-red-400 text-xs space-y-1.5">
              {serverErrors.map((e, i) => <li key={i} className="flex items-start gap-1.5"><AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {e}</li>)}
            </ul>
          </>
        )}
        <p className="text-gray-600 text-[10px] mt-4 leading-relaxed">
          Tip: every actionable system state needs exactly one action with <code>isCorrect: true</code>, and each fault's <code>correctFixId</code> must match an action id — that's the ground truth the scoring engine and tutor read.
        </p>
      </aside>
    </div>
  );
}
