import { Request, Response } from "express";
import Stripe from "stripe";
import { getStripe } from "./index";
import { getDb } from "../db";
import { users, subscriptions, teams, teamMembers } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

export async function handleStripeWebhook(req: Request, res: Response) {
  const stripe = getStripe();
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Webhook] STRIPE_WEBHOOK_SECRET not configured");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const customerId = session.customer as string;
        const plan = session.metadata?.plan || "pro";

        if (userId) {
          const db = await getDb();
          if (db) {
            const userIdNum = parseInt(userId);
            const tier = (plan === "team" || plan === "teamAnnual") ? "team" : "pro";

            // Determine if this checkout started a trial
            const stripeSubscription = session.subscription
              ? await stripe.subscriptions.retrieve(session.subscription as string)
              : null;

            const isTrial = stripeSubscription?.status === "trialing";
            const now = new Date();
            const trialEnd = isTrial && stripeSubscription?.trial_end
              ? new Date(stripeSubscription.trial_end * 1000)
              : null;

            // Update user with Stripe customer ID, tier, and trial info
            await db
              .update(users)
              .set({
                stripeCustomerId: customerId,
                subscriptionTier: tier,
                subscriptionStatus: isTrial ? "trialing" : "active",
                trialStartAt: isTrial ? now : undefined,
                trialEndsAt: trialEnd || undefined,
              })
              .where(eq(users.id, userIdNum));

            // Create subscription record
            if (session.subscription) {
              await db.insert(subscriptions).values({
                userId: userIdNum,
                stripeSubscriptionId: session.subscription as string,
                stripePriceId: session.metadata?.price_id || "",
                status: isTrial ? "trialing" : "active",
                currentPeriodEnd: trialEnd || undefined,
              });
            }

            // If team plan, create the team
            if (plan === "team" || plan === "teamAnnual") {
              const teamName = session.metadata?.team_name || "My Team";
              const seats = parseInt(session.metadata?.seats || "10");

              const [insertResult] = await db.insert(teams).values({
                name: teamName,
                ownerId: userIdNum,
                stripeSubscriptionId: session.subscription as string || null,
                stripeCustomerId: customerId,
                maxSeats: seats,
                isActive: true,
              });

              const teamId = (insertResult as any).insertId;

              // Add owner as first team member
              await db.insert(teamMembers).values({
                teamId,
                userId: userIdNum,
                role: "owner",
                status: "active",
                joinedAt: new Date(),
              });
            }

            // Notify owner of new subscriber
            const planName = (plan === "team" || plan === "teamAnnual") ? "Team" : "Pro";
            const seats = session.metadata?.seats;
            const seatsInfo = seats ? ` (${seats} seats)` : "";
            const trialInfo = isTrial ? " (7-day trial)" : "";
            await notifyOwner({
              title: `New Subscriber: ${session.customer_details?.name || session.metadata?.customer_name || "Unknown"}`,
              content: `New subscription${trialInfo}!\n\nName: ${session.customer_details?.name || session.metadata?.customer_name || "Unknown"}\nEmail: ${session.customer_details?.email || session.metadata?.customer_email || "Unknown"}\nPlan: ${planName}${seatsInfo}\nStatus: ${isTrial ? "Trialing (7 days)" : "Active"}\n\nTotal active subscribers: Check Stripe Dashboard for details.`,
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const db = await getDb();
        if (db) {
          // Map Stripe status to our status
          let status: "active" | "trialing" | "past_due" | "canceled";
          let userSubStatus: "active" | "trialing" | "past_due" | "canceled" | "expired" | "none";

          if (subscription.status === "active") {
            status = "active";
            userSubStatus = "active";
          } else if (subscription.status === "trialing") {
            status = "trialing";
            userSubStatus = "trialing";
          } else if (subscription.status === "past_due") {
            status = "past_due";
            userSubStatus = "past_due";
          } else {
            status = "canceled";
            userSubStatus = "canceled";
          }

          const periodEnd = (subscription as any).current_period_end
            ? new Date((subscription as any).current_period_end * 1000)
            : undefined;

          await db
            .update(subscriptions)
            .set({
              status,
              currentPeriodEnd: periodEnd,
            })
            .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

          // Find the user for this subscription
          const sub = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
            .limit(1);

          if (sub.length > 0) {
            const updateSet: Record<string, any> = {
              subscriptionStatus: userSubStatus,
            };

            // If transitioning from trial to active, clear trial fields
            if (status === "active") {
              // Keep trialStartAt/trialEndsAt for historical reference
            }

            // If canceled, downgrade tier
            if (status === "canceled") {
              updateSet.subscriptionTier = "free";
              updateSet.subscriptionStatus = "canceled";

              // Deactivate team if this was a team subscription
              await db
                .update(teams)
                .set({ isActive: false })
                .where(eq(teams.stripeSubscriptionId, subscription.id));
            }

            await db
              .update(users)
              .set(updateSet)
              .where(eq(users.id, sub[0].userId));
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const db = await getDb();
        if (db) {
          await db
            .update(subscriptions)
            .set({ status: "canceled" })
            .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

          // Downgrade user to free
          const sub = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
            .limit(1);

          if (sub.length > 0) {
            await db
              .update(users)
              .set({
                subscriptionTier: "free",
                subscriptionStatus: "expired",
              })
              .where(eq(users.id, sub[0].userId));

            // Deactivate team
            await db
              .update(teams)
              .set({ isActive: false })
              .where(eq(teams.stripeSubscriptionId, subscription.id));
          }
        }
        break;
      }

      case "customer.subscription.trial_will_end": {
        // Stripe sends this 3 days before trial ends — we use it as a backup reminder
        const subscription = event.data.object as Stripe.Subscription;
        const db = await getDb();
        if (db) {
          const sub = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
            .limit(1);

          if (sub.length > 0) {
            const user = await db
              .select()
              .from(users)
              .where(eq(users.id, sub[0].userId))
              .limit(1);

            if (user.length > 0) {
              await notifyOwner({
                title: `Trial Ending Soon: ${user[0].name || user[0].email || "User #" + user[0].id}`,
                content: `A user's trial is ending in 3 days.\n\nName: ${user[0].name || "N/A"}\nEmail: ${user[0].email || "N/A"}\nTrial ends: ${user[0].trialEndsAt?.toISOString() || "Unknown"}\n\nThey will be automatically charged unless they cancel.`,
              });
            }
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const db = await getDb();
        const failedSubId = (invoice as any).subscription as string | null;
        console.log(`[Webhook] Payment failed for invoice ${invoice.id}`);

        // Update user status to past_due
        if (db && failedSubId) {
          const sub = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, failedSubId))
            .limit(1);

          if (sub.length > 0) {
            await db
              .update(users)
              .set({ subscriptionStatus: "past_due" })
              .where(eq(users.id, sub[0].userId));

            await db
              .update(subscriptions)
              .set({ status: "past_due" })
              .where(eq(subscriptions.stripeSubscriptionId, failedSubId));
          }
        }

        // Notify owner
        await notifyOwner({
          title: "Payment Failed",
          content: `Payment failed for invoice ${invoice.id}.\nCustomer: ${invoice.customer_email || "Unknown"}\nAmount: $${(invoice.amount_due || 0) / 100}\n\nStripe will retry automatically.`,
        });
        break;
      }

      case "invoice.paid": {
        const paidInvoice = event.data.object as Stripe.Invoice;
        const paidDb = await getDb();
        const paidSubId = (paidInvoice as any).subscription as string | null;

        // When an invoice is paid (including after trial), ensure user is active
        if (paidDb && paidSubId) {
          const sub = await paidDb
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, paidSubId))
            .limit(1);

          if (sub.length > 0) {
            await paidDb
              .update(users)
              .set({ subscriptionStatus: "active" })
              .where(eq(users.id, sub[0].userId));

            await paidDb
              .update(subscriptions)
              .set({ status: "active" })
              .where(eq(subscriptions.stripeSubscriptionId, paidSubId));
          }
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[Webhook] Error processing ${event.type}:`, err);
    return res.status(500).json({ error: "Webhook processing error" });
  }

  return res.json({ received: true });
}
