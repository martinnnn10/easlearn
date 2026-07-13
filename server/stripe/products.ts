/**
 * EAS Subscription Plans
 * 
 * Free: 2 scenarios, no tools, no progress tracking
 * Pro Monthly: $49/month
 * Pro Annual: $468/year ($39/month — save $120/year)
 * Team Monthly: $29/seat/month
 * Team Annual: $290/seat/year ($24.17/month — save $58/seat/year)
 */

export const PLANS = {
  free: {
    name: "Free",
    description: "Try the simulator with 2 sample scenarios",
    scenarioLimit: 2,
    features: [
      "2 sample troubleshooting scenarios",
      "Basic decision tree interface",
      "No progress tracking",
    ],
    price: null,
    stripePriceId: null,
  },
  pro: {
    // Priced so a machine operator can actually afford to learn.
    // NOTE: `price` is display only. The real charge is the Stripe price behind
    // STRIPE_PRO_PRICE_ID — create a $15/mo price in Stripe and point the env var
    // at it so the charged amount matches what's shown here.
    name: "Individual — Become a Tech",
    description: "Everything an operator needs to learn maintenance and get job-ready. Your plant can reimburse it.",
    scenarioLimit: Infinity,
    features: [
      "The full Operator → Maintenance Tech path",
      "Full course library + every interactive lab",
      "AI tutor coaching + scored fault simulators",
      "Fault Mastery Map — track faults diagnosed, not videos watched",
      "Spaced-repetition review so it actually sticks",
      "Skills Passport + completion certificates",
    ],
    price: 7.99,
    interval: "month" as const,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || "price_pro_monthly",
  },
  proAnnual: {
    // Matches the $80/yr Stripe price behind STRIPE_PRO_ANNUAL_PRICE_ID.
    name: "Individual — Annual",
    description: "Best value for operators — about $6.67/month, billed yearly.",
    scenarioLimit: Infinity,
    features: [
      "Everything in the monthly plan",
      "About $6.67/month — save ~17% vs monthly",
      "Priority access to new content",
    ],
    price: 80,
    monthlyEquivalent: 6.67,
    interval: "year" as const,
    stripePriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || "price_pro_annual",
  },
  team: {
    name: "Team / Company",
    description: "For maintenance departments and training managers",
    scenarioLimit: Infinity,
    features: [
      "Everything in Pro",
      "5-50 team seats (per-seat pricing)",
      "Team admin dashboard",
      "Invite team members via email",
      "Team progress tracking & reporting",
      "Skill matrix & gap analysis",
      "Priority support",
    ],
    pricePerSeat: 20,
    minSeats: 5,
    maxSeats: 50,
    interval: "month" as const,
    stripePriceId: process.env.STRIPE_TEAM_PRICE_ID || "price_team_monthly",
  },
  teamAnnual: {
    name: "Team / Company (Annual)",
    description: "For maintenance departments — save $58/seat/year with annual billing",
    scenarioLimit: Infinity,
    features: [
      "Everything in Team Monthly",
      "Save $58/seat/year (2 months free per seat)",
      "Dedicated onboarding support",
    ],
    pricePerSeat: 200,
    pricePerSeatMonthly: 16.67,
    minSeats: 5,
    maxSeats: 50,
    interval: "year" as const,
    stripePriceId: process.env.STRIPE_TEAM_ANNUAL_PRICE_ID || "price_team_annual",
  },
} as const;

export type PlanKey = keyof typeof PLANS;
