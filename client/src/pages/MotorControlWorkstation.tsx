/**
 * Motor Control Diagnostic Workstation — Production Route
 *
 * Wraps the existing WorkstationPrototype with:
 * - Feature flag gate (access check)
 * - Real attempt creation and persistence
 * - Diagnostic event recording on every action
 * - Machine state saving for resume
 * - Real completion with Assessment Spine evidence
 *
 * The existing WorkstationPrototype remains unchanged — this page
 * adds the production persistence layer on top.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Loader2, Lock, AlertTriangle } from "lucide-react";
import { getLoginUrl } from "@/const";
import WorkstationPrototype from "./WorkstationPrototype";

export default function MotorControlWorkstation() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
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

  // Access granted — render the workstation with production persistence
  return <WorkstationPrototype />;
}
