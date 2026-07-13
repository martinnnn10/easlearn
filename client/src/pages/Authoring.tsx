/**
 * Authoring Studio — admin tool to draft, AI-assist, preview, and publish lesson
 * card decks without hand-editing .ts files. Writes through trpc.authoring.*.
 *
 * Three panes: drafts list · editor (with AI assist) · live preview + publish.
 * The human always owns the answer key; AI only drafts prose/distractors.
 */
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus, Sparkles, Loader2, Save, UploadCloud, Trash2, FileText, CheckCircle2, AlertTriangle,
  Layers, Cpu,
} from "lucide-react";
import SEO from "@/components/SEO";
import ScenarioDraftEditor from "@/components/authoring/ScenarioDraftEditor";

type CardKind = "concept" | "example" | "interaction" | "summary";
interface Choice { id: string; label: string }
interface CardInteraction {
  type: "reveal" | "choice";
  prompt: string;
  choices?: Choice[];
  correctChoiceId?: string;
  feedbackCorrect?: string;
  feedbackIncorrect?: string;
}
interface Card {
  id: string;
  kind: CardKind;
  heading: string;
  body: string;
  takeaway?: string;
  interaction?: CardInteraction;
}
interface Deck {
  moduleSlug: string;
  lessonSlug: string;
  title: string;
  whatYoullLearn: string[];
  estimatedMinutes: number;
  previewCardCount: number;
  cards: Card[];
}

const emptyDeck = (): Deck => ({
  moduleSlug: "",
  lessonSlug: "",
  title: "",
  whatYoullLearn: [""],
  estimatedMinutes: 10,
  previewCardCount: 2,
  cards: [],
});

export default function Authoring() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role !== "admin") {
      toast.error("Access denied — admin privileges required");
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, user, navigate]);

  const isAdmin = isAuthenticated && user?.role === "admin";
  const [mode, setMode] = useState<"decks" | "scenarios">("decks");
  const [draftId, setDraftId] = useState<number | null>(null);
  const [deck, setDeck] = useState<Deck>(emptyDeck());
  const [warStory, setWarStory] = useState("");

  const drafts = trpc.authoring.listDeckDrafts.useQuery(undefined, { enabled: isAdmin });
  const upsert = trpc.authoring.upsertDeckDraft.useMutation();
  const publish = trpc.authoring.publishDeckDraft.useMutation();
  const aiDraft = trpc.authoring.aiDraftCards.useMutation();

  const set = (patch: Partial<Deck>) => setDeck(d => ({ ...d, ...patch }));
  const setCard = (i: number, patch: Partial<Card>) =>
    setDeck(d => ({ ...d, cards: d.cards.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));

  const addCard = () =>
    set({
      cards: [
        ...deck.cards,
        { id: `c-${deck.cards.length + 1}`, kind: "concept", heading: "", body: "" },
      ],
    });

  const loadDraft = (id: number) => {
    const row = drafts.data?.find(r => r.id === id);
    if (!row) return;
    setDraftId(id);
    setDeck({ ...emptyDeck(), ...(row.deck as Partial<Deck>) });
  };

  const newDraft = () => {
    setDraftId(null);
    setDeck(emptyDeck());
    setWarStory("");
  };

  const handleSave = async () => {
    const res = await upsert.mutateAsync({
      id: draftId ?? undefined,
      moduleSlug: deck.moduleSlug,
      lessonSlug: deck.lessonSlug,
      title: deck.title,
      deck: deck as unknown as Record<string, unknown>,
    });
    setDraftId(res.id);
    toast.success("Draft saved");
    drafts.refetch();
  };

  const handlePublish = async () => {
    if (!draftId) {
      toast.error("Save the draft first");
      return;
    }
    await handleSave();
    const res = await publish.mutateAsync({ id: draftId });
    if (res.ok) {
      toast.success("Published — passed all validation gates");
      drafts.refetch();
    } else {
      toast.error(`Blocked by ${res.errors.length} validation issue(s)`);
    }
  };

  const handleAiDraft = async () => {
    const takeaways = deck.whatYoullLearn.map(t => t.trim()).filter(Boolean);
    if (!warStory.trim() || takeaways.length === 0) {
      toast.error("Add a war story and at least one 'what you'll learn' takeaway first");
      return;
    }
    const res = await aiDraft.mutateAsync({
      moduleSlug: deck.moduleSlug || "draft",
      lessonSlug: deck.lessonSlug || "draft",
      title: deck.title || "Untitled lesson",
      warStory,
      keyTakeaways: takeaways,
      cardCount: 5,
    });
    if (res.ok && res.cards.length) {
      set({ cards: res.cards as Card[] });
      toast.success(`Drafted ${res.cards.length} cards — review and edit before publishing`);
    } else {
      toast.error(res.error || "AI drafting failed");
    }
  };

  const publishErrors = publish.data && !publish.data.ok ? publish.data.errors : [];

  const previewCards = useMemo(() => deck.cards, [deck.cards]);

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white">
      <SEO title="Authoring Studio" description="Draft and publish lesson decks" path="/admin/authoring" />
      <div className="max-w-[1400px] mx-auto p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-1">Authoring Studio</h1>
        <p className="text-gray-500 text-sm mb-4">Draft → AI-assist → preview → publish. No code required.</p>

        {/* Content type toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("decks")}
            className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm ${mode === "decks" ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
          >
            <Layers className="w-4 h-4" /> Lesson Decks
          </button>
          <button
            onClick={() => setMode("scenarios")}
            className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm ${mode === "scenarios" ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
          >
            <Cpu className="w-4 h-4" /> Scenarios
          </button>
        </div>

        {mode === "scenarios" ? (
          <ScenarioDraftEditor />
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_360px] gap-4">
          {/* Drafts list */}
          <aside className="rounded-lg border border-gray-800 bg-[#0d120d] p-3">
            <button onClick={newDraft} className="w-full flex items-center justify-center gap-2 rounded bg-emerald-600 hover:bg-emerald-700 text-sm py-2 mb-3">
              <Plus className="w-4 h-4" /> New deck
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
              {drafts.data?.length === 0 && <p className="text-gray-600 text-xs px-2">No drafts yet.</p>}
            </div>
          </aside>

          {/* Editor */}
          <main className="rounded-lg border border-gray-800 bg-[#0d120d] p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input className="bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm" placeholder="module-slug" value={deck.moduleSlug} onChange={e => set({ moduleSlug: e.target.value })} />
              <input className="bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm" placeholder="lesson-slug" value={deck.lessonSlug} onChange={e => set({ lessonSlug: e.target.value })} />
            </div>
            <input className="w-full bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm" placeholder="Lesson title" value={deck.title} onChange={e => set({ title: e.target.value })} />

            <div>
              <label className="text-xs text-gray-400">What you'll learn (answer key / takeaways)</label>
              {deck.whatYoullLearn.map((t, i) => (
                <input
                  key={i}
                  className="w-full bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm mt-1"
                  placeholder={`Takeaway ${i + 1}`}
                  value={t}
                  onChange={e => set({ whatYoullLearn: deck.whatYoullLearn.map((x, j) => (j === i ? e.target.value : x)) })}
                />
              ))}
              <button onClick={() => set({ whatYoullLearn: [...deck.whatYoullLearn, ""] })} className="text-xs text-emerald-400 mt-1">+ takeaway</button>
            </div>

            {/* AI assist */}
            <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-3">
              <label className="text-xs text-emerald-300 flex items-center gap-1.5 mb-1"><Sparkles className="w-3.5 h-3.5" /> AI-assisted drafting</label>
              <textarea className="w-full bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1.5 text-sm h-24" placeholder="Paste the war story / source material. AI drafts cards from this + your takeaways. You review before publish." value={warStory} onChange={e => setWarStory(e.target.value)} />
              <button onClick={handleAiDraft} disabled={aiDraft.isPending} className="mt-2 flex items-center gap-2 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-sm px-3 py-1.5">
                {aiDraft.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Draft cards
              </button>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {deck.cards.map((c, i) => (
                <div key={i} className="rounded border border-gray-800 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">#{i + 1}</span>
                    <select className="bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1 text-xs" value={c.kind} onChange={e => setCard(i, { kind: e.target.value as CardKind })}>
                      <option value="concept">concept</option>
                      <option value="example">example</option>
                      <option value="interaction">interaction</option>
                      <option value="summary">summary</option>
                    </select>
                    <button onClick={() => set({ cards: deck.cards.filter((_, j) => j !== i) })} className="ml-auto text-gray-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <input className="w-full bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1 text-sm" placeholder="Heading" value={c.heading} onChange={e => setCard(i, { heading: e.target.value })} />
                  <textarea className="w-full bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1 text-sm h-16" placeholder="Body" value={c.body} onChange={e => setCard(i, { body: e.target.value })} />
                  <input className="w-full bg-[#0a0f0a] border border-gray-700 rounded px-2 py-1 text-xs" placeholder="Takeaway (optional)" value={c.takeaway ?? ""} onChange={e => setCard(i, { takeaway: e.target.value })} />
                  {c.kind === "interaction" && (
                    <p className="text-[10px] text-amber-400/80 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Interaction cards need a choice + correctChoiceId to pass publish validation.</p>
                  )}
                </div>
              ))}
              <button onClick={addCard} className="text-xs text-emerald-400 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add card</button>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-800">
              <button onClick={handleSave} disabled={upsert.isPending} className="flex items-center gap-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-sm px-3 py-1.5"><Save className="w-4 h-4" /> Save draft</button>
              <button onClick={handlePublish} disabled={publish.isPending} className="flex items-center gap-2 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-sm px-3 py-1.5"><UploadCloud className="w-4 h-4" /> Validate & publish</button>
            </div>
            {publishErrors.length > 0 && (
              <ul className="text-xs text-red-400 space-y-1">
                {publishErrors.map((e, i) => <li key={i} className="flex items-start gap-1.5"><AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {e}</li>)}
              </ul>
            )}
          </main>

          {/* Live preview */}
          <aside className="rounded-lg border border-gray-800 bg-[#0d120d] p-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-300">Live preview</h3>
            <div className="space-y-3">
              {previewCards.length === 0 && <p className="text-gray-600 text-xs">Cards appear here as you write.</p>}
              {previewCards.map((c, i) => (
                <div key={i} className="rounded border border-gray-800 bg-[#0a0f0a] p-3">
                  <span className="text-[9px] uppercase tracking-wide text-emerald-400">{c.kind}</span>
                  <h4 className="text-sm font-semibold text-white mt-1">{c.heading || "—"}</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed whitespace-pre-line">{c.body}</p>
                  {c.takeaway && <p className="text-[11px] text-emerald-300/80 mt-2 flex items-start gap-1"><CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" /> {c.takeaway}</p>}
                </div>
              ))}
            </div>
          </aside>
        </div>
        )}
      </div>
    </div>
  );
}
