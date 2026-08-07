/**
 * Motor Control Diagnostic Workstation — Production Route
 *
 * Access gate (auth + feature flag) PLUS the production persistence layer:
 *  - server-authoritative attempt resume-or-create per scenario
 *  - diagnostic event recording via the append-only queue
 *  - machine-state autosave for resume
 *  - fail-closed completion (server verifies persisted evidence)
 *
 * Query params: ?scenario=<scenarioId>&assignment=<assignmentId>
 * (MyAssignments links carry these so assignment attempts are linked + completed.)
 */
import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Loader2, Lock, AlertTriangle, RotateCcw } from "lucide-react";
import { getLoginUrl } from "@/const";
import WorkstationPrototype from "./WorkstationPrototype";
import { useWorkstationPersistence } from "@/lib/useWorkstationPersistence";
import { getScenario, SCENARIO_IDS } from "@/lib/workstationScenarios";

function GatedWorkstation() {
  // Query params (read once — navigation away/back remounts the route)
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const paramScenario = params.get("scenario");
  const paramAssignment = params.get("assignment");
  const assignmentId = paramAssignment && /^\d+$/.test(paramAssignment) ? Number(paramAssignment) : undefined;
  const lockedScenario = !!(paramScenario && SCENARIO_IDS.includes(paramScenario as (typeof SCENARIO_IDS)[number]));

  const [scenarioId, setScenarioId] = useState<string>(
    lockedScenario ? (paramScenario as string) : "overload_tripped"
  );
  const scenario = getScenario(scenarioId);

  const persistence = useWorkstationPersistence(scenarioId, scenario.faultId, assignmentId);

  if (persistence.bootstrapping) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Preparing your attempt…
      </div>
    );
  }

  if (persistence.bootstrapError || persistence.attemptId == null) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-6">
        <AlertTriangle className="w-10 h-10 text-amber-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Could not start the attempt</h1>
        <p className="text-zinc-400 text-sm text-center max-w-md mb-4">
          {persistence.bootstrapError ?? "The attempt could not be created."} Your work is not being
          recorded, so the workstation will not open without a persisted attempt.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" /> Try again
        </button>
      </div>
    );
  }

  return (
    <WorkstationPrototype
      key={`${scenarioId}:${persistence.attemptId}`}
      initialScenarioId={scenarioId}
      lockedScenario={lockedScenario}
      onScenarioChange={(id) => setScenarioId(id)}
      persistence={persistence}
      initialSaved={persistence.resumedState}
      initialSafetyViolation={persistence.resumedSafetyViolation}
    />
  );
}

export default function MotorControlWorkstation() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const accessQuery = trpc.workstation.checkAccess.useQuery(undefined, { enabled: isAuthenticated });

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-6">
        <Lock className="w-10 h-10 text-zinc-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Sign In Required</h1>
        <p className="text-zinc-400 text-sm text-center max-w-md mb-6">
          The Motor Control Diagnostic Workstation requires an authenticated account with workstation access enabled.
        </p>
        <a href={getLoginUrl()} className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium">
          Sign In
        </a>
      </div>
    );
  }

  if (accessQuery.isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Checking access...
      </div>
    );
  }

  if (!accessQuery.data?.hasAccess) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-6">
        <AlertTriangle className="w-10 h-10 text-amber-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Access Not Enabled</h1>
        <p className="text-zinc-400 text-sm text-center max-w-md mb-4">
          The Motor Control Diagnostic Workstation is currently in pilot release. Your account does not have access enabled.
        </p>
        <p className="text-zinc-500 text-xs text-center max-w-md">
          If you believe you should have access, contact your team manager or the platform administrator.
        </p>
      </div>
    );
  }

  return <GatedWorkstation />;
}
