import Stripe from "stripe";
import { ENV } from "../_core/env";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(secretKey, {
      apiVersion: "2024-12-18.acacia" as any,
    });
  }
  return _stripe;
}

/** 7-day free trial for all new subscriptions */
const TRIAL_PERIOD_DAYS = 7;

export async function createCheckoutSession({
  userId,
  userEmail,
  userName,
  priceId,
  origin,
  quantity = 1,
  plan = "pro",
  teamName,
  includeTrial = true,
}: {
  userId: number;
  userEmail: string;
  userName: string;
  priceId: string;
  origin: string;
  quantity?: number;
  plan?: string;
  teamName?: string;
  /** Set to false for users who already used their trial */
  includeTrial?: boolean;
}) {
  const stripe = getStripe();

  const metadata: Record<string, string> = {
    user_id: userId.toString(),
    customer_email: userEmail,
    customer_name: userName,
    plan,
    price_id: priceId,
  };

  if (plan === "team" || plan === "teamAnnual") {
    metadata.team_name = teamName || `${userName}'s Team`;
    metadata.seats = quantity.toString();
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: userEmail,
    client_reference_id: userId.toString(),
    metadata,
    line_items: [
      {
        price: priceId,
        quantity,
      },
    ],
    allow_promotion_codes: true,
    success_url: `${origin}/checkout/success`,
    cancel_url: `${origin}/pricing?payment=canceled`,
  };

  // Add 7-day free trial — requires card upfront via payment_method_collection
  if (includeTrial) {
    sessionParams.subscription_data = {
      trial_period_days: TRIAL_PERIOD_DAYS,
      metadata,
    };
    // Ensure card is collected even during trial
    sessionParams.payment_method_collection = "always";
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return session;
}

export async function createBillingPortalSession({
  customerId,
  origin,
}: {
  customerId: string;
  origin: string;
}) {
  const stripe = getStripe();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/account`,
  });

  return session;
}
