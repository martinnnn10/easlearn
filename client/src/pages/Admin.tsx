/**
 * EAS Admin Page
 * AI Scenario Generation, Management, and Candidate Assessments
 * Only accessible to admin users
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Cpu, Trash2, Eye, EyeOff, Unlock, Lock,
  Loader2, Sparkles, AlertTriangle, ClipboardList,
  Send, Copy, CheckCircle2, XCircle, Clock, User, BarChart3
} from "lucide-react";
import { pluralize } from "@/lib/pluralize";
import SEO from "@/components/SEO";
import type { ScenarioEngineVersion } from "@shared/scenarioRegistry";

type Tab = "scenarios" | "assessments" | "errorLogs";
type AssessmentScenarioFilter = "all" | ScenarioEngineVersion;

export default function Admin() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect non-admin users to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated && user?.role !== "admin") {
      toast.error("Access denied — admin privileges required");
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, user, navigate]);
  const [activeTab, setActiveTab] = useState<Tab>("scenarios");
  const [prompt, setPrompt] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [category, setCategory] = useState("Motor Control");
  const [generating, setGenerating] = useState(false);

  // Assessment form state
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [scenarioIds, setScenarioIds] = useState<string[]>(["conveyor-estop"]);
  const [assessmentScenarioFilter, setAssessmentScenarioFilter] =
    useState<AssessmentScenarioFilter>("all");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(60);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [creatingAssessment, setCreatingAssessment] = useState(false);

  const { data: assessmentScenarios } = trpc.assessments.listScenarios.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: allScenarios, refetch: refetchScenarios } = trpc.scenarios.listAll.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: assessments, refetch: refetchAssessments } = trpc.assessments.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const generateMutation = trpc.scenarios.generate.useMutation({
    onSuccess: () => {
      toast.success("Scenario generated successfully!");
      refetchScenarios();
      setPrompt("");
      setGenerating(false);
    },
    onError: (error) => {
      toast.error(error.message || "Generation failed");
      setGenerating(false);
    },
  });

  const publishMutation = trpc.scenarios.publish.useMutation({
    onSuccess: () => { toast.success("Scenario published"); refetchScenarios(); },
  });

  const unpublishMutation = trpc.scenarios.unpublish.useMutation({
    onSuccess: () => { toast.success("Scenario unpublished"); refetchScenarios(); },
  });

  const toggleFreeMutation = trpc.scenarios.toggleFree.useMutation({
    onSuccess: () => { toast.success("Updated"); refetchScenarios(); },
  });

  const deleteMutation = trpc.scenarios.delete.useMutation({
    onSuccess: () => { toast.success("Scenario deleted"); refetchScenarios(); },
  });

  const createAssessmentMutation = trpc.assessments.create.useMutation({
    onSuccess: (data) => {
      toast.success("Assessment created! Link copied to clipboard.");
      const link = `${window.location.origin}/assessment/${data.token}`;
      navigator.clipboard.writeText(link);
      refetchAssessments();
      setCandidateName("");
      setCandidateEmail("");
      setCreatingAssessment(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create assessment");
      setCreatingAssessment(false);
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) { toast.error("Enter a scenario prompt"); return; }
    setGenerating(true);
    generateMutation.mutate({ prompt, difficulty, category });
  };

  const handleCreateAssessment = () => {
    if (!candidateName.trim() || !candidateEmail.trim()) {
      toast.error("Enter candidate name and email");
      return;
    }
    if (scenarioIds.length === 0) {
      toast.error("Select at least one scenario");
      return;
    }
    setCreatingAssessment(true);
    createAssessmentMutation.mutate({
      candidateName,
      candidateEmail,
      scenarioIds,
      timeLimitMinutes,
      expiresInDays,
    });
  };

  const copyAssessmentLink = (token: string) => {
    const link = `${window.location.origin}/assessment/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Assessment link copied to clipboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[oklch(0.55_0.12_155)]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-heading text-white mb-4">ADMIN ACCESS REQUIRED</h2>
          <p className="text-[oklch(0.55_0.008_250)] mb-6">Please sign in to access the admin panel.</p>
          <a href="/login" className="btn-primary px-6 py-3 rounded text-sm font-semibold">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-[oklch(0.75_0.12_75)] mx-auto mb-4" />
          <h2 className="text-xl font-heading text-white mb-4">ACCESS DENIED</h2>
          <p className="text-[oklch(0.55_0.008_250)]">You do not have admin privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SEO
        title="Admin Panel"
        description="EAS Admin Panel — manage scenarios, generate AI content, and create candidate assessments."
        path="/admin"
      />
      {/* Hero */}
      <section className="py-16 border-b border-[oklch(0.18_0.004_250)]">
        <div className="container">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-6 h-6 text-[oklch(0.55_0.12_155)]" />
            <h1 className="text-3xl font-heading text-white tracking-wide">
              ADMIN PANEL
            </h1>
          </div>
          <p className="text-[oklch(0.55_0.008_250)]">
            Manage scenarios, generate AI content, and create candidate assessments.
          </p>
          <button
            onClick={() => navigate("/admin/authoring")}
            className="mt-4 inline-flex items-center gap-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2"
          >
            <Sparkles className="w-4 h-4" /> Open Authoring Studio
          </button>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="border-b border-[oklch(0.18_0.004_250)]">
        <div className="container">
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab("scenarios")}
              className={`px-6 py-4 text-[13px] font-semibold tracking-wider uppercase border-b-2 transition-colors ${
                activeTab === "scenarios"
                  ? "border-[oklch(0.55_0.12_155)] text-[oklch(0.55_0.12_155)]"
                  : "border-transparent text-[oklch(0.45_0.006_250)] hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Scenarios
              </span>
            </button>
            <button
              onClick={() => setActiveTab("assessments")}
              className={`px-6 py-4 text-[13px] font-semibold tracking-wider uppercase border-b-2 transition-colors ${
                activeTab === "assessments"
                  ? "border-[oklch(0.55_0.12_155)] text-[oklch(0.55_0.12_155)]"
                  : "border-transparent text-[oklch(0.45_0.006_250)] hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Assessments
                {assessments && assessments.length > 0 && (
                  <span className="ml-1 text-[10px] bg-[oklch(0.55_0.12_155/15%)] text-[oklch(0.55_0.12_155)] px-1.5 py-0.5 rounded">
                    {assessments.length}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("errorLogs")}
              className={`px-6 py-4 text-[13px] font-semibold tracking-wider uppercase border-b-2 transition-colors ${
                activeTab === "errorLogs"
                  ? "border-[oklch(0.55_0.12_155)] text-[oklch(0.55_0.12_155)]"
                  : "border-transparent text-[oklch(0.45_0.006_250)] hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Error Logs
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Scenarios Tab */}
      {activeTab === "scenarios" && (
        <>
          {/* AI Generator */}
          <section className="py-10 bg-[oklch(0.07_0.003_250)] border-b border-[oklch(0.18_0.004_250)]">
            <div className="container max-w-4xl">
              <div className="card-panel p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles className="w-5 h-5 text-[oklch(0.55_0.12_155)]" />
                  <h2 className="text-lg font-heading text-white tracking-wide">AI SCENARIO GENERATOR</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block font-mono-industrial text-[10px] text-[oklch(0.45_0.006_250)] tracking-wider mb-2">
                      SCENARIO PROMPT
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the fault scenario... e.g., 'A VFD on a packaging line trips on overcurrent during ramp-up. The motor is a 15HP 3-phase running a case packer conveyor.'"
                      className="w-full h-28 bg-[oklch(0.08_0.003_250)] border border-[oklch(0.22_0.004_250)] rounded px-4 py-3 text-[13px] text-white placeholder:text-[oklch(0.35_0.006_250)] focus:border-[oklch(0.55_0.12_155/40%)] focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono-industrial text-[10px] text-[oklch(0.45_0.006_250)] tracking-wider mb-2">
                        DIFFICULTY
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="w-full bg-[oklch(0.08_0.003_250)] border border-[oklch(0.22_0.004_250)] rounded px-4 py-2.5 text-[13px] text-white focus:border-[oklch(0.55_0.12_155/40%)] focus:outline-none"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono-industrial text-[10px] text-[oklch(0.45_0.006_250)] tracking-wider mb-2">
                        CATEGORY
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-[oklch(0.08_0.003_250)] border border-[oklch(0.22_0.004_250)] rounded px-4 py-2.5 text-[13px] text-white focus:border-[oklch(0.55_0.12_155/40%)] focus:outline-none"
                      >
                        <option value="Motor Control">Motor Control</option>
                        <option value="PLC Systems">PLC Systems</option>
                        <option value="Drives & VFDs">Drives & VFDs</option>
                        <option value="Safety Circuit">Safety Circuit</option>
                        <option value="Sensors & Instrumentation">Sensors & Instrumentation</option>
                        <option value="Power Distribution">Power Distribution</option>
                        <option value="Communication Networks">Communication Networks</option>
                        <option value="Pneumatics & Hydraulics">Pneumatics & Hydraulics</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={generating || !prompt.trim()}
                    className="btn-primary w-full py-3 rounded text-[13px] font-semibold tracking-wider uppercase flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {generating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Generating Scenario...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Generate Scenario</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Scenario Library */}
          <section className="py-10">
            <div className="container max-w-4xl">
              <h2 className="text-lg font-heading text-white tracking-wide mb-6">
                SCENARIO LIBRARY ({allScenarios?.length || 0})
              </h2>

              {!allScenarios || allScenarios.length === 0 ? (
                <div className="card-panel p-8 text-center">
                  <p className="text-[oklch(0.45_0.006_250)]">No AI-generated scenarios yet. Use the generator above to create your first one.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allScenarios.map((scenario) => (
                    <motion.div
                      key={scenario.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card-panel p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-[14px] font-semibold text-white truncate">{scenario.title}</h4>
                          {scenario.isPublished ? (
                            <span className="font-mono-industrial text-[9px] px-2 py-0.5 rounded bg-[oklch(0.55_0.12_155/10%)] border border-[oklch(0.55_0.12_155/25%)] text-[oklch(0.55_0.12_155)]">LIVE</span>
                          ) : (
                            <span className="font-mono-industrial text-[9px] px-2 py-0.5 rounded bg-[oklch(0.3_0.004_250/30%)] border border-[oklch(0.3_0.004_250)] text-[oklch(0.45_0.006_250)]">DRAFT</span>
                          )}
                          {scenario.isFree && (
                            <span className="font-mono-industrial text-[9px] px-2 py-0.5 rounded bg-[oklch(0.55_0.12_200/10%)] border border-[oklch(0.55_0.12_200/25%)] text-[oklch(0.55_0.12_200)]">FREE</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[oklch(0.45_0.006_250)]">
                          <span className="font-mono-industrial">{scenario.difficulty?.toUpperCase()}</span>
                          <span>•</span>
                          <span>{scenario.category}</span>
                          <span>•</span>
                          <span>{scenario.estimatedTime}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            if (scenario.isPublished) { unpublishMutation.mutate({ id: scenario.id }); }
                            else { publishMutation.mutate({ id: scenario.id }); }
                          }}
                          className="p-2 rounded hover:bg-[oklch(0.15_0.003_250)] transition-colors"
                          title={scenario.isPublished ? "Unpublish" : "Publish"}
                        >
                          {scenario.isPublished ? <EyeOff className="w-4 h-4 text-[oklch(0.55_0.008_250)]" /> : <Eye className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />}
                        </button>
                        <button
                          onClick={() => toggleFreeMutation.mutate({ id: scenario.id, isFree: !scenario.isFree })}
                          className="p-2 rounded hover:bg-[oklch(0.15_0.003_250)] transition-colors"
                          title={scenario.isFree ? "Make paid" : "Make free"}
                        >
                          {scenario.isFree ? <Unlock className="w-4 h-4 text-[oklch(0.55_0.12_200)]" /> : <Lock className="w-4 h-4 text-[oklch(0.55_0.008_250)]" />}
                        </button>
                        <button
                          onClick={() => { if (confirm("Delete this scenario permanently?")) { deleteMutation.mutate({ id: scenario.id }); } }}
                          className="p-2 rounded hover:bg-[oklch(0.65_0.18_25/10%)] transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-[oklch(0.65_0.18_25)]" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* Assessments Tab */}
      {activeTab === "errorLogs" && <ErrorLogsPanel />}

      {activeTab === "assessments" && (
        <>
          {/* Create Assessment */}
          <section className="py-10 bg-[oklch(0.07_0.003_250)] border-b border-[oklch(0.18_0.004_250)]">
            <div className="container max-w-4xl">
              <div className="card-panel p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Send className="w-5 h-5 text-[oklch(0.55_0.12_155)]" />
                  <h2 className="text-lg font-heading text-white tracking-wide">CREATE ASSESSMENT INVITE</h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono-industrial text-[10px] text-[oklch(0.45_0.006_250)] tracking-wider mb-2">
                        CANDIDATE NAME
                      </label>
                      <input
                        type="text"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="John Smith"
                        className="w-full bg-[oklch(0.08_0.003_250)] border border-[oklch(0.22_0.004_250)] rounded px-4 py-2.5 text-[13px] text-white placeholder:text-[oklch(0.35_0.006_250)] focus:border-[oklch(0.55_0.12_155/40%)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-mono-industrial text-[10px] text-[oklch(0.45_0.006_250)] tracking-wider mb-2">
                        CANDIDATE EMAIL
                      </label>
                      <input
                        type="email"
                        value={candidateEmail}
                        onChange={(e) => setCandidateEmail(e.target.value)}
                        placeholder="john@company.com"
                        className="w-full bg-[oklch(0.08_0.003_250)] border border-[oklch(0.22_0.004_250)] rounded px-4 py-2.5 text-[13px] text-white placeholder:text-[oklch(0.35_0.006_250)] focus:border-[oklch(0.55_0.12_155/40%)] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono-industrial text-[10px] text-[oklch(0.45_0.006_250)] tracking-wider mb-2">
                      SCENARIOS TO ASSESS (V1 / V2 / V3)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(["all", "v1", "v2", "v3"] as const).map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setAssessmentScenarioFilter(filter)}
                          className={`px-3 py-1 rounded text-[10px] font-mono-industrial tracking-wider border transition-colors ${
                            assessmentScenarioFilter === filter
                              ? "border-[oklch(0.55_0.12_155/50%)] bg-[oklch(0.55_0.12_155/10%)] text-white"
                              : "border-[oklch(0.18_0.004_250)] text-[oklch(0.55_0.008_250)] hover:border-[oklch(0.35_0.006_250)]"
                          }`}
                        >
                          {filter === "all" ? "ALL" : filter.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                      {(assessmentScenarios ?? [])
                        .filter(
                          (s) =>
                            assessmentScenarioFilter === "all" ||
                            s.engineVersion === assessmentScenarioFilter
                        )
                        .map((scenario) => (
                        <label
                          key={scenario.id}
                          className="flex items-start gap-2 p-2 rounded border border-[oklch(0.18_0.004_250)] hover:border-[oklch(0.55_0.12_155/30%)] cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={scenarioIds.includes(scenario.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setScenarioIds([...scenarioIds, scenario.id]);
                              } else {
                                setScenarioIds(scenarioIds.filter((s) => s !== scenario.id));
                              }
                            }}
                            className="rounded border-[oklch(0.3_0.004_250)] bg-[oklch(0.08_0.003_250)] mt-0.5"
                          />
                          <span className="flex-1 min-w-0">
                            <span className="block text-[12px] text-[oklch(0.85_0.008_250)] leading-snug">
                              {scenario.title}
                            </span>
                            <span className="block text-[10px] text-[oklch(0.45_0.006_250)] font-mono-industrial mt-0.5">
                              {scenario.engineVersion.toUpperCase()} · {scenario.category} · {scenario.estimatedMinutes} min
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                    {scenarioIds.length > 0 && (
                      <p className="text-[10px] text-[oklch(0.45_0.006_250)] font-mono-industrial mt-2">
                        {scenarioIds.length} selected (max 10)
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono-industrial text-[10px] text-[oklch(0.45_0.006_250)] tracking-wider mb-2">
                        TIME LIMIT (MINUTES)
                      </label>
                      <input
                        type="number"
                        value={timeLimitMinutes}
                        onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                        min={15}
                        max={180}
                        className="w-full bg-[oklch(0.08_0.003_250)] border border-[oklch(0.22_0.004_250)] rounded px-4 py-2.5 text-[13px] text-white focus:border-[oklch(0.55_0.12_155/40%)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-mono-industrial text-[10px] text-[oklch(0.45_0.006_250)] tracking-wider mb-2">
                        LINK EXPIRES IN (DAYS)
                      </label>
                      <input
                        type="number"
                        value={expiresInDays}
                        onChange={(e) => setExpiresInDays(Number(e.target.value))}
                        min={1}
                        max={30}
                        className="w-full bg-[oklch(0.08_0.003_250)] border border-[oklch(0.22_0.004_250)] rounded px-4 py-2.5 text-[13px] text-white focus:border-[oklch(0.55_0.12_155/40%)] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCreateAssessment}
                    disabled={creatingAssessment || !candidateName.trim() || !candidateEmail.trim()}
                    className="btn-primary w-full py-3 rounded text-[13px] font-semibold tracking-wider uppercase flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {creatingAssessment ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Create & Copy Invite Link</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Assessment Results Dashboard */}
          <section className="py-10">
            <div className="container max-w-4xl">
              <h2 className="text-lg font-heading text-white tracking-wide mb-6">
                ASSESSMENT RESULTS ({assessments?.length || 0})
              </h2>

              {!assessments || assessments.length === 0 ? (
                <div className="card-panel p-8 text-center">
                  <p className="text-[oklch(0.45_0.006_250)]">No assessments created yet. Use the form above to invite your first candidate.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assessments.map((assessment: any) => (
                    <motion.div
                      key={assessment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card-panel p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <User className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
                            <h4 className="text-[14px] font-semibold text-white">{assessment.candidateName}</h4>
                            <StatusBadge status={assessment.status} />
                          </div>
                          <div className="flex items-center gap-4 text-[11px] text-[oklch(0.45_0.006_250)] mb-3">
                            <span>{assessment.candidateEmail}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {assessment.timeLimitMinutes} min limit
                            </span>
                            <span>•</span>
                            <span>{pluralize(assessment.scenarioIds?.length || 0, "scenario")}</span>
                          </div>

                          {/* Results if completed */}
                          {assessment.status === "completed" && assessment.results && assessment.results.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-[oklch(0.18_0.004_250)]">
                              <div className="grid grid-cols-3 gap-3">
                                {assessment.results.map((result: any, idx: number) => (
                                  <div key={idx} className="bg-[oklch(0.08_0.003_250)] rounded p-3">
                                    <div className="text-[10px] font-mono-industrial text-[oklch(0.45_0.006_250)] mb-1 truncate">
                                      {result.scenarioTitle}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[16px] font-heading ${
                                        result.percentage >= 80 ? "text-[oklch(0.55_0.12_155)]" :
                                        result.percentage >= 60 ? "text-[oklch(0.75_0.12_75)]" :
                                        "text-[oklch(0.65_0.18_25)]"
                                      }`}>
                                        {result.percentage}%
                                      </span>
                                      <span className="text-[10px] text-[oklch(0.45_0.006_250)]">
                                        ({result.grade})
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-[oklch(0.4_0.006_250)]">
                                      {result.timeSeconds}s • {result.score}/{result.maxScore}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {/* Overall Score */}
                              <div className="mt-3 flex items-center gap-4">
                                <span className="font-mono-industrial text-[10px] text-[oklch(0.45_0.006_250)]">OVERALL:</span>
                                <span className="text-white font-semibold text-[14px]">
                                  {Math.round(assessment.results.reduce((acc: number, r: any) => acc + r.percentage, 0) / assessment.results.length)}% avg
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => copyAssessmentLink(assessment.token)}
                            className="p-2 rounded hover:bg-[oklch(0.15_0.003_250)] transition-colors"
                            title="Copy invite link"
                          >
                            <Copy className="w-4 h-4 text-[oklch(0.55_0.008_250)]" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <span className="font-mono-industrial text-[9px] px-2 py-0.5 rounded bg-[oklch(0.55_0.12_155/10%)] border border-[oklch(0.55_0.12_155/25%)] text-[oklch(0.55_0.12_155)] flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> COMPLETED
        </span>
      );
    case "in_progress":
      return (
        <span className="font-mono-industrial text-[9px] px-2 py-0.5 rounded bg-[oklch(0.55_0.12_200/10%)] border border-[oklch(0.55_0.12_200/25%)] text-[oklch(0.55_0.12_200)] flex items-center gap-1">
          <Clock className="w-3 h-3" /> IN PROGRESS
        </span>
      );
    case "expired":
      return (
        <span className="font-mono-industrial text-[9px] px-2 py-0.5 rounded bg-[oklch(0.65_0.18_25/10%)] border border-[oklch(0.65_0.18_25/25%)] text-[oklch(0.65_0.18_25)] flex items-center gap-1">
          <XCircle className="w-3 h-3" /> EXPIRED
        </span>
      );
    default:
      return (
        <span className="font-mono-industrial text-[9px] px-2 py-0.5 rounded bg-[oklch(0.3_0.004_250/30%)] border border-[oklch(0.3_0.004_250)] text-[oklch(0.45_0.006_250)] flex items-center gap-1">
          <Clock className="w-3 h-3" /> PENDING
        </span>
      );
  }
}


function ErrorFrequencyChart() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: frequency } = (trpc as any).errorLogging.getErrorFrequency.useQuery(
    undefined,
    { refetchInterval: 60_000 }
  );

  if (!frequency || frequency.length === 0) return null;

  const maxCount = Math.max(...frequency.map((d: { day: string; count: number }) => d.count), 1);

  return (
    <div className="card-panel p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-[oklch(0.55_0.12_155)]" />
        <h3 className="text-sm font-heading text-white tracking-wide">
          ERROR FREQUENCY (PAST 7 DAYS)
        </h3>
      </div>
      <div className="flex items-end gap-1.5 h-32">
        {frequency.map((d: { day: string; count: number }) => {
          const heightPct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
          const dayLabel = new Date(d.day + "T12:00:00").toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] font-mono text-[oklch(0.55_0.008_250)]">
                {d.count > 0 ? d.count : ""}
              </span>
              <div
                className="w-full rounded-t transition-all duration-300"
                style={{
                  height: `${Math.max(heightPct, 2)}%`,
                  backgroundColor:
                    d.count === 0
                      ? "oklch(0.18 0.004 250)"
                      : d.count >= 10
                        ? "oklch(0.65 0.18 25)"
                        : d.count >= 5
                          ? "oklch(0.7 0.14 75)"
                          : "oklch(0.55 0.12 155)",
                }}
                title={`${dayLabel}: ${d.count} error${d.count !== 1 ? "s" : ""}`}
              />
              <span className="text-[8px] font-mono text-[oklch(0.4_0.006_250)] whitespace-nowrap">
                {new Date(d.day + "T12:00:00").toLocaleDateString(undefined, {
                  weekday: "short",
                })}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[9px] text-[oklch(0.45_0.006_250)]">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: "oklch(0.55 0.12 155)" }} />
          1\u20134
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: "oklch(0.7 0.14 75)" }} />
          5\u20139
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: "oklch(0.65 0.18 25)" }} />
          10+
        </span>
      </div>
    </div>
  );
}

function ErrorLogsPanel() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: errors, isLoading } = (trpc as any).errorLogging.getRecentErrors.useQuery(
    { limit: 50 },
    { refetchInterval: 30_000 }
  );

  if (isLoading) {
    return (
      <section className="py-10">
        <div className="container max-w-6xl flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[oklch(0.55_0.12_155)]" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-10">
      <div className="container max-w-6xl">
        {/* Error Frequency Chart */}
        <ErrorFrequencyChart />

        {/* Error Table */}
        {(!errors || errors.length === 0) ? (
          <div className="card-panel p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-[oklch(0.45_0.006_250)] mx-auto mb-3" />
            <p className="text-[oklch(0.55_0.008_250)] text-sm">No client errors recorded yet.</p>
          </div>
        ) : (
          <div className="card-panel p-6">
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle className="w-5 h-5 text-[oklch(0.75_0.12_75)]" />
              <h2 className="text-lg font-heading text-white tracking-wide">
                CLIENT ERROR LOGS
              </h2>
              <span className="ml-2 text-[10px] bg-[oklch(0.75_0.12_75/15%)] text-[oklch(0.75_0.12_75)] px-1.5 py-0.5 rounded">
                {errors.length} {pluralize(errors.length, "error")}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[oklch(0.18_0.004_250)]">
                    <th className="py-2 px-3 font-mono-industrial text-[10px] text-[oklch(0.45_0.006_250)] tracking-wider">TIME</th>
                    <th className="py-2 px-3 font-mono-industrial text-[10px] text-[oklch(0.45_0.006_250)] tracking-wider">USER</th>
                    <th className="py-2 px-3 font-mono-industrial text-[10px] text-[oklch(0.45_0.006_250)] tracking-wider">COMPONENT</th>
                    <th className="py-2 px-3 font-mono-industrial text-[10px] text-[oklch(0.45_0.006_250)] tracking-wider">MESSAGE</th>
                    <th className="py-2 px-3 font-mono-industrial text-[10px] text-[oklch(0.45_0.006_250)] tracking-wider">URL</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((err: any) => (
                    <tr key={err.id} className="border-b border-[oklch(0.14_0.003_250)] hover:bg-[oklch(0.12_0.003_250)] transition-colors">
                      <td className="py-2 px-3 font-mono text-[10px] text-[oklch(0.5_0.008_250)] whitespace-nowrap">
                        {err.createdAt ? new Date(err.createdAt).toLocaleString() : "\u2014"}
                      </td>
                      <td className="py-2 px-3 font-mono text-[10px] text-[oklch(0.5_0.008_250)]">
                        {err.userId ? `#${err.userId}` : <span className="text-[oklch(0.35_0.006_250)]">anon</span>}
                      </td>
                      <td className="py-2 px-3 font-mono text-[10px] text-[oklch(0.6_0.08_200)]">
                        {err.componentName || "\u2014"}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-[oklch(0.75_0.12_25)] max-w-[300px] truncate" title={err.errorMessage}>
                        {err.errorMessage}
                      </td>
                      <td className="py-2 px-3 font-mono text-[10px] text-[oklch(0.45_0.006_250)] max-w-[200px] truncate" title={err.url || ""}>
                        {err.url ? (() => { try { return new URL(err.url).pathname; } catch { return err.url; } })() : "\u2014"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
