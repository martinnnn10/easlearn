/**
 * Onboarding Drip Email Sequence
 *
 * 3-email series sent to new users over their first 5 days:
 *   Day 1 — Explore your first course
 *   Day 3 — Try the troubleshooting simulator
 *   Day 5 — Earn your first certification
 *
 * Called by Heartbeat cron at /api/scheduled/onboarding-drip (daily 10:00 UTC).
 * Each user progresses through steps 0 → 1 → 2 → 3 (done).
 */
import type { Request, Response } from "express";
import { Resend } from "resend";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq, and, lt, lte, isNotNull } from "drizzle-orm";
import { sdk } from "./_core/sdk";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_SUPPORT = "EAS Platform <support@easlearn.org>";

function getBaseUrl(): string {
  return process.env.NODE_ENV === "production"
    ? "https://easlearn.org"
    : "http://localhost:3000";
}

// ─── Drip Schedule ───────────────────────────────────────────────────────────

interface DripStep {
  /** Minimum hours since account creation before this email is eligible */
  minHoursAfterSignup: number;
  /** Minimum hours since last drip email before this one can be sent */
  minHoursSinceLastDrip: number;
  /** Subject line */
  subject: string;
  /** Function to generate email HTML */
  template: (name: string, baseUrl: string) => string;
}

const DRIP_STEPS: DripStep[] = [
  {
    // Step 1: Day 1 — sent ~24h after signup
    minHoursAfterSignup: 24,
    minHoursSinceLastDrip: 0,
    subject: "Your First Course Awaits — EAS Platform",
    template: dripDay1Template,
  },
  {
    // Step 2: Day 3 — sent ~72h after signup, at least 48h after step 1
    minHoursAfterSignup: 72,
    minHoursSinceLastDrip: 48,
    subject: "Try the Troubleshooting Simulator — EAS Platform",
    template: dripDay3Template,
  },
  {
    // Step 3: Day 5 — sent ~120h after signup, at least 48h after step 2
    minHoursAfterSignup: 120,
    minHoursSinceLastDrip: 48,
    subject: "Earn Your First Certification — EAS Platform",
    template: dripDay5Template,
  },
];

// ─── Email Layout (reuse branded pattern from email.ts) ──────────────────────

function emailLayout(content: string, preheader: string = ""): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EAS Platform</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    body { margin: 0; padding: 0; width: 100%; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 16px !important; }
      .content { padding: 24px 20px !important; }
      .button { padding: 14px 24px !important; font-size: 15px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #060906; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #060906;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 10px; padding: 10px 12px;">
                    <span style="color: #34d399; font-size: 20px; font-weight: bold;">⚡</span>
                  </td>
                  <td style="padding-left: 10px;">
                    <span style="color: #ffffff; font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">EAS</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0d120d; border: 1px solid rgba(55, 65, 55, 0.4); border-radius: 16px; overflow: hidden;">
                <tr>
                  <td class="content" style="padding: 40px 36px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; line-height: 1.5; margin: 0;">
                Electrical Automation Services, Inc.<br>
                Industrial training built from real plant-floor experience.
              </p>
              <p style="color: #4b5563; font-size: 11px; margin-top: 16px;">
                You're receiving this because you signed up for EAS Platform.<br>
                <a href="${getBaseUrl()}/dashboard" style="color: #34d399;">Manage your account</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buttonHtml(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px auto;">
    <tr>
      <td align="center" style="border-radius: 8px; background-color: #059669;">
        <a href="${url}" class="button" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px; background-color: #059669;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

// ─── Day 1: Explore Your First Course ────────────────────────────────────────

function dripDay1Template(name: string, baseUrl: string): string {
  return emailLayout(`
    <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">
      Ready to Start Learning?
    </h1>
    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
      Hi ${name}, your EAS account is set up and waiting. Here's the best way to get started:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px; background-color: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 10px;">
          <p style="color: #34d399; font-size: 13px; font-weight: 600; margin: 0 0 8px 0;">RECOMMENDED FIRST STEP</p>
          <p style="color: #d1d5db; font-size: 14px; line-height: 1.6; margin: 0;">
            <strong style="color: #ffffff;">Electrical Fundamentals</strong> — Start with the basics of voltage, current, and resistance. This foundational module sets you up for everything else on the platform.
          </p>
        </td>
      </tr>
    </table>

    ${buttonHtml("Browse Courses", `${baseUrl}/courses`)}

    <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
      Each module takes about 1–2 hours and includes a quiz to test your understanding.
    </p>
  `, "Your first EAS course is ready — start with Electrical Fundamentals");
}

// ─── Day 3: Try the Troubleshooting Simulator ───────────────────────────────

function dripDay3Template(name: string, baseUrl: string): string {
  return emailLayout(`
    <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">
      Practice Real Troubleshooting
    </h1>
    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
      Hi ${name}, the best way to build confidence is hands-on practice. Our AI-powered simulator recreates real plant-floor scenarios.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
      <tr>
        <td style="padding: 14px 16px; background-color: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 10px 10px 0 0;">
          <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0;">VFD Overcurrent Fault</p>
          <p style="color: #9ca3af; font-size: 12px; margin: 4px 0 0 0;">Diagnose why a PowerFlex drive is tripping on overcurrent</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 16px; background-color: rgba(16, 185, 129, 0.03); border-left: 1px solid rgba(16, 185, 129, 0.15); border-right: 1px solid rgba(16, 185, 129, 0.15); border-bottom: 1px solid rgba(16, 185, 129, 0.15); border-radius: 0 0 10px 10px;">
          <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0;">Conveyor E-Stop Circuit</p>
          <p style="color: #9ca3af; font-size: 12px; margin: 4px 0 0 0;">Trace a safety circuit failure on a production line</p>
        </td>
      </tr>
    </table>

    ${buttonHtml("Launch Simulator", `${baseUrl}/simulator`)}

    <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
      Choose your difficulty level and play mode. Your scores are tracked on the leaderboard.
    </p>
  `, "Try the EAS troubleshooting simulator — practice real plant-floor scenarios");
}

// ─── Day 5: Earn Your First Certification ────────────────────────────────────

function dripDay5Template(name: string, baseUrl: string): string {
  return emailLayout(`
    <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">
      Earn Your First Certificate
    </h1>
    <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
      Hi ${name}, completing a course module and passing the quiz earns you a verifiable certificate — proof of your skills that you can share with employers.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 20px; background-color: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 10px; text-align: center;">
          <p style="color: #34d399; font-size: 28px; margin: 0 0 8px 0;">🏆</p>
          <p style="color: #ffffff; font-size: 15px; font-weight: 600; margin: 0 0 6px 0;">Certification Pathway</p>
          <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0;">
            Apprentice → Journeyman → Specialist → Master<br>
            <span style="color: #6b7280; font-size: 12px;">Each level unlocks with completed modules and quiz scores</span>
          </p>
        </td>
      </tr>
    </table>

    ${buttonHtml("View Certifications", `${baseUrl}/certifications`)}

    <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
      Each certificate has a unique verification URL that employers can check.
    </p>
  `, "Complete a course module to earn your first EAS certificate");
}

// ─── Scheduled Handler ───────────────────────────────────────────────────────

/**
 * Process all eligible users for the next drip step.
 * Called by Heartbeat cron daily at 10:00 UTC.
 */
export async function handleOnboardingDrip(req: Request, res: Response) {
  try {
    // Authenticate the cron request
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        error: "Database not available",
        timestamp: new Date().toISOString(),
      });
    }

    const baseUrl = getBaseUrl();
    const now = new Date();
    const results = { step1: 0, step2: 0, step3: 0, errors: 0 };

    // Process each drip step (1, 2, 3)
    for (let stepIndex = 0; stepIndex < DRIP_STEPS.length; stepIndex++) {
      const step = DRIP_STEPS[stepIndex];
      const currentStepNum = stepIndex + 1; // 1-based
      const previousStepNum = stepIndex; // 0-based (matches onboardingDripStep value)

      // Find users eligible for this step:
      // - emailVerified = true (they confirmed their email)
      // - email is not null
      // - onboardingDripStep = previousStepNum (haven't received this step yet)
      // - createdAt is old enough (minHoursAfterSignup)
      // - onboardingDripSentAt is old enough (minHoursSinceLastDrip) or null (for step 1)
      const signupCutoff = new Date(now.getTime() - step.minHoursAfterSignup * 60 * 60 * 1000);

      const eligibleUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          onboardingDripSentAt: users.onboardingDripSentAt,
        })
        .from(users)
        .where(
          and(
            eq(users.emailVerified, true),
            isNotNull(users.email),
            eq(users.onboardingDripStep, previousStepNum),
            lte(users.createdAt, signupCutoff)
          )
        )
        .limit(100); // Process up to 100 users per step per run

      for (const u of eligibleUsers) {
        // Check minHoursSinceLastDrip
        if (step.minHoursSinceLastDrip > 0 && u.onboardingDripSentAt) {
          const hoursSinceLastDrip =
            (now.getTime() - new Date(u.onboardingDripSentAt).getTime()) / (60 * 60 * 1000);
          if (hoursSinceLastDrip < step.minHoursSinceLastDrip) {
            continue; // Not enough time since last drip
          }
        }

        try {
          const html = step.template(u.name || "there", baseUrl);
          await resend.emails.send({
            from: FROM_SUPPORT,
            to: [u.email!],
            subject: step.subject,
            html,
          });

          // Update user's drip progress
          await db
            .update(users)
            .set({
              onboardingDripStep: currentStepNum,
              onboardingDripSentAt: now,
            })
            .where(eq(users.id, u.id));

          if (currentStepNum === 1) results.step1++;
          else if (currentStepNum === 2) results.step2++;
          else results.step3++;
        } catch (emailErr) {
          console.error(`[OnboardingDrip] Failed to send step ${currentStepNum} to user ${u.id}:`, emailErr);
          results.errors++;
        }
      }
    }

    console.log(
      `[OnboardingDrip] Sent: step1=${results.step1}, step2=${results.step2}, step3=${results.step3}, errors=${results.errors}`
    );

    return res.json({
      ok: true,
      sent: results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("[OnboardingDrip] Handler error:", error);
    return res.status(500).json({
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.url },
      timestamp: new Date().toISOString(),
    });
  }
}

// ─── Exported for testing ────────────────────────────────────────────────────

export { DRIP_STEPS, dripDay1Template, dripDay3Template, dripDay5Template };
