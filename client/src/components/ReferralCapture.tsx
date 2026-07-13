/**
 * ReferralCapture — invisible. Captures ?ref=CODE on landing (survives the signup
 * flow via localStorage) and attributes it once the user is authenticated.
 */
import { useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const KEY = "eas_ref";

export default function ReferralCapture() {
  const { isAuthenticated } = useAuth();
  const attribute = trpc.referral.attribute.useMutation();
  const done = useRef(false);

  // Capture the code on first load.
  useEffect(() => {
    try {
      const code = new URLSearchParams(window.location.search).get("ref");
      if (code) localStorage.setItem(KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  // Attribute once authenticated.
  useEffect(() => {
    if (!isAuthenticated || done.current) return;
    const code = (() => {
      try {
        return localStorage.getItem(KEY);
      } catch {
        return null;
      }
    })();
    if (!code) return;
    done.current = true;
    attribute
      .mutateAsync({ code })
      .catch(() => {})
      .finally(() => {
        try {
          localStorage.removeItem(KEY);
        } catch {
          /* ignore */
        }
      });
  }, [isAuthenticated, attribute]);

  return null;
}
