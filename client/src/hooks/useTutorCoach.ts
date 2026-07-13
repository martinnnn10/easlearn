/**
 * useTutorCoach — thin client wrapper around the grounded AI tutor.
 *
 * Holds the latest coaching string + loading state for the simulator overlay.
 * Fire-and-forget friendly: a failed call resolves to the static fallback the
 * server returns, so it never blocks gameplay.
 */
import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";

export interface TutorCoachState {
  coaching: string | null;
  isLoading: boolean;
  grounded: boolean;
}

export function useTutorCoach() {
  const [state, setState] = useState<TutorCoachState>({
    coaching: null,
    isLoading: false,
    grounded: false,
  });

  const coachMutation = trpc.tutor.coachWrongMove.useMutation();

  const coachWrongMove = useCallback(
    async (input: Parameters<typeof coachMutation.mutateAsync>[0]) => {
      setState({ coaching: null, isLoading: true, grounded: false });
      try {
        const res = await coachMutation.mutateAsync(input);
        setState({ coaching: res.coaching, isLoading: false, grounded: res.grounded });
        return res;
      } catch {
        setState({ coaching: null, isLoading: false, grounded: false });
        return null;
      }
    },
    [coachMutation],
  );

  const clear = useCallback(
    () => setState({ coaching: null, isLoading: false, grounded: false }),
    [],
  );

  return { ...state, coachWrongMove, clear };
}
