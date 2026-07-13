/**
 * Feature flags — the "Jobs cut."
 *
 * The platform has many features. A first-time technician should see exactly ONE
 * thing: the magic moment (diagnose a real fault, get scored on how you think).
 * Everything else still exists and works — it's just hidden from the default,
 * unauthenticated path until the core loop is proven. Flip FOCUSED_LAUNCH off to
 * expose the full surface again. Nothing is deleted; this is focus, not removal.
 */

export const FOCUSED_LAUNCH = true;

/** Primary nav shown in focused mode — one path to the magic moment. */
export const FOCUSED_NAV: { href: string; label: string }[] = [
  { href: "/labs?entry=nav&mode=practice#conveyor-troubleshoot", label: "Diagnose a Fault" },
];
