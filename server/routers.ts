import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, subscriberProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createContactSubmission, getContactSubmissions, getUserByEmail } from "./db";
import { notifyOwner } from "./_core/notification";
import { createCheckoutSession, createBillingPortalSession } from "./stripe";
import { PLANS } from "./stripe/products";
import { getDb, upsertUser } from "./db";
import { resolveLessonPracticeScenario } from "./lessonScenarioLink";
import {
  listAssessmentScenarios,
  validateAssessmentScenarioIds,
} from "@shared/scenarioRegistry";
import { resolveSimulatorScenarioId } from "@shared/scenarioLinking";
import {
  CERTIFICATION_REQUIREMENTS,
  formatRequirementMessage,
} from "@shared/certificationConfig";
import { skillDomainForModule } from "@shared/competencyMatrix";
import { faultCompetencyRouter, recordFaultCompetencyAttempt } from "./faultCompetency";
import { hireReadyRouter } from "./hireReady";
import { tutorRouter } from "./tutor";
import { authoringRouter } from "./authoring";
import { competencyRouter } from "./competency";
import { accreditationRouter } from "./accreditation";
import { dailyRouter } from "./daily";
import { referralRouter } from "./referral";
import { reviewRouter } from "./review";
import { schedulerRouter } from "./reviewScheduler";
import { employerRouter, jobsRouter } from "./employer";
import { intelligenceRouter } from "./intelligence";
import { competencyGraphRouter } from "./competencyGraph";
import { assessmentRouter } from "./assessment";
import { mentorRouter } from "./mentor";
import { plannerRouter } from "./planner";
import { programRouter } from "./program";
import { assignmentsRouter } from "./assignments";
import { buildIluStatus, type IluProgressSnapshot } from "./hubsIlu";
import { scenarios, assessments, assessmentResults, courseModules, courseLessons, userProgress, quizQuestions, quizAttempts, certificates, teams, teamMembers, users, tutorials, contactSubmissions, certificationLevels, bookmarks, scenarioCompletions, subscriptions, passwordResetTokens, emailVerificationTokens, userStreaks, clientErrors, simulatorSessions, labScores, lessonAssessmentQuestions, lessonAssessmentAttempts } from "../drizzle/schema";
import {
  allModuleLessonQuizzesPassed,
  buildModuleLessonGates,
  getLessonQuizAttemptInfo,
  getLessonScenarioGate,
  getPassedAttemptMap,
  scoreLessonAssessment,
} from "./lessonAssessment";
import { didPass, LESSON_QUIZ_MAX_ATTEMPTS } from "@shared/assessment";
import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from "./email";
import { eq, desc, and, inArray, sql, like, or, gte } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";
import { hash, compare } from "bcryptjs";
import { sdk } from "./_core/sdk";
import crypto from "crypto";
import { isCardFormatLesson } from "@shared/lessonCardContent";
import { CARD_LESSON_CONTENT_STUB } from "@shared/cardLessonContentStub";

// In-memory throttle for error spike notifications (one alert per 15-min window)
let _lastErrorAlertSentAt = 0;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),

    register: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Name is required").max(255),
        email: z.string().email("Invalid email address").max(320),
        password: z.string().min(8, "Password must be at least 8 characters").max(128),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if email already exists
        const existing = await getUserByEmail(input.email.toLowerCase().trim());
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An account with this email already exists. Please sign in instead.",
          });
        }

        // Hash password
        const passwordHash = await hash(input.password, 12);

        // Generate a unique openId for this email user
        const openId = crypto.randomUUID();

        // Create user in database
        await upsertUser({
          openId,
          name: input.name.trim(),
          email: input.email.toLowerCase().trim(),
          loginMethod: "email",
          lastSignedIn: new Date(),
        });

        // Store the password hash directly
        const db = await getDb();
        if (db) {
          await db.update(users)
            .set({ passwordHash })
            .where(eq(users.openId, openId));
        }

        // Generate email verification token
        const verificationToken = crypto.randomBytes(48).toString("hex");
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        if (db) {
          // Get the user ID
          const [newUser] = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
          if (newUser) {
            await db.insert(emailVerificationTokens).values({
              userId: newUser.id,
              token: verificationToken,
              expiresAt: verificationExpires,
            });

            // Send verification email
            await sendVerificationEmail(
              input.email.toLowerCase().trim(),
              input.name.trim(),
              verificationToken
            ).catch((err) => console.error("[Auth] Failed to send verification email:", err));
          }
        }

        // Create session token and set cookie (user can browse but with limited access until verified)
        const sessionToken = await sdk.createSessionToken(openId, {
          name: input.name.trim(),
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        // Notify owner of new registration
        await notifyOwner({
          title: `New User Registration: ${input.name}`,
          content: `Name: ${input.name}\nEmail: ${input.email}\nMethod: Email/Password\nVerification pending.`,
        }).catch(() => {});

        return { success: true, name: input.name.trim(), requiresVerification: true };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByEmail(input.email.toLowerCase().trim());

        if (!user || !user.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password.",
          });
        }

        // Verify password
        const valid = await compare(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password.",
          });
        }

        // Update last signed in
        await upsertUser({
          openId: user.openId,
          lastSignedIn: new Date(),
        });

        // Create session token and set cookie
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true, name: user.name || "" };
      }),

    requestPasswordReset: publicProcedure
      .input(z.object({
        email: z.string().email("Invalid email address"),
      }))
      .mutation(async ({ input }) => {
        const user = await getUserByEmail(input.email.toLowerCase().trim());

        // Always return success to prevent email enumeration
        if (!user) {
          return { success: true };
        }

        // Generate a secure token
        const token = crypto.randomBytes(48).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Store token in database
        const db = await getDb();
        if (db) {
          await db.insert(passwordResetTokens).values({
            userId: user.id,
            token,
            expiresAt,
          });
        }

        // Send password reset email via Resend
        await sendPasswordResetEmail(
          user.email!,
          user.name || "User",
          token
        ).catch((err) => console.error("[Auth] Failed to send password reset email:", err));

        return { success: true };
      }),

    verifyEmail: publicProcedure
      .input(z.object({
        token: z.string().min(1, "Verification token is required"),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        }

        // Find the token
        const [verifyToken] = await db.select().from(emailVerificationTokens)
          .where(eq(emailVerificationTokens.token, input.token))
          .limit(1);

        if (!verifyToken) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired verification link." });
        }

        if (verifyToken.usedAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This verification link has already been used." });
        }

        if (new Date() > verifyToken.expiresAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This verification link has expired. Please request a new one." });
        }

        // Mark email as verified
        await db.update(users)
          .set({ emailVerified: true })
          .where(eq(users.id, verifyToken.userId));

        // Mark token as used
        await db.update(emailVerificationTokens)
          .set({ usedAt: new Date() })
          .where(eq(emailVerificationTokens.id, verifyToken.id));

        // Get user for welcome email and session
        const [user] = await db.select().from(users).where(eq(users.id, verifyToken.userId)).limit(1);
        if (!user) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "User not found" });
        }

        // Send welcome email
        await sendWelcomeEmail(
          user.email!,
          user.name || "User"
        ).catch((err) => console.error("[Auth] Failed to send welcome email:", err));

        // Auto-login: create session
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true, name: user.name || "" };
      }),

    resendVerification: publicProcedure
      .input(z.object({
        email: z.string().email("Invalid email address"),
      }))
      .mutation(async ({ input }) => {
        const user = await getUserByEmail(input.email.toLowerCase().trim());

        // Always return success to prevent email enumeration
        if (!user || user.emailVerified) {
          return { success: true };
        }

        // Generate a new verification token
        const token = crypto.randomBytes(48).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const db = await getDb();
        if (db) {
          await db.insert(emailVerificationTokens).values({
            userId: user.id,
            token,
            expiresAt,
          });
        }

        // Send verification email
        await sendVerificationEmail(
          user.email!,
          user.name || "User",
          token
        ).catch((err) => console.error("[Auth] Failed to resend verification email:", err));

        return { success: true };
      }),

    resetPassword: publicProcedure
      .input(z.object({
        token: z.string().min(1, "Reset token is required"),
        password: z.string().min(8, "Password must be at least 8 characters").max(128),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        }

        // Find the token
        const [resetToken] = await db.select().from(passwordResetTokens)
          .where(eq(passwordResetTokens.token, input.token))
          .limit(1);

        if (!resetToken) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired reset link." });
        }

        if (resetToken.usedAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This reset link has already been used." });
        }

        if (new Date() > resetToken.expiresAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This reset link has expired. Please request a new one." });
        }

        // Hash new password and update user
        const passwordHash = await hash(input.password, 12);
        await db.update(users)
          .set({ passwordHash })
          .where(eq(users.id, resetToken.userId));

        // Mark token as used
        await db.update(passwordResetTokens)
          .set({ usedAt: new Date() })
          .where(eq(passwordResetTokens.id, resetToken.id));

        // Get user for session
        const [user] = await db.select().from(users).where(eq(users.id, resetToken.userId)).limit(1);
        if (!user) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "User not found" });
        }

        // Auto-login: create session
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true, name: user.name || "" };
      }),

    getOnboardingStatus: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { completed: false, selections: null };
      const [row] = await db.select({
        onboardingCompleted: users.onboardingCompleted,
        onboardingSelections: users.onboardingSelections,
      })
        .from(users).where(eq(users.id, ctx.user.id)).limit(1);
      return {
        completed: row?.onboardingCompleted ?? false,
        selections: (row?.onboardingSelections as any) ?? null,
      };
    }),

    completeOnboarding: protectedProcedure
      .input(z.object({
        experienceLevel: z.string().nullable().optional(),
        goals: z.array(z.string()).optional(),
        equipment: z.array(z.string()).optional(),
        skipped: z.boolean().optional(),
      }).optional())
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const selections = input ? {
          experienceLevel: input.experienceLevel ?? null,
          goals: input.goals ?? [],
          equipment: input.equipment ?? [],
          skipped: input.skipped ?? false,
          completedAt: Date.now(),
        } : null;
        await db.update(users).set({
          onboardingCompleted: true,
          ...(selections ? { onboardingSelections: selections } : {}),
        }).where(eq(users.id, ctx.user.id));
        return { success: true };
      }),
  }),

  contact: router({
    submit: publicProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        email: z.string().email().max(320),
        company: z.string().max(255).optional(),
        inquiryType: z.enum(["general", "training", "simulator", "assessment"]),
        message: z.string().min(1).max(5000),
      }))
      .mutation(async ({ input }) => {
        await createContactSubmission({
          name: input.name,
          email: input.email,
          company: input.company || null,
          inquiryType: input.inquiryType,
          message: input.message,
        });

        await notifyOwner({
          title: `New Contact: ${input.name} (${input.inquiryType})`,
          content: `Name: ${input.name}\nEmail: ${input.email}\nCompany: ${input.company || "N/A"}\nType: ${input.inquiryType}\n\nMessage:\n${input.message}`,
        });

        return { success: true };
      }),

    list: protectedProcedure.query(async () => {
      return getContactSubmissions();
    }),
  }),

  stripe: router({
    getPlans: publicProcedure.query(() => {
      return {
        free: { ...PLANS.free },
        pro: { ...PLANS.pro, stripePriceId: undefined },
        team: { ...PLANS.team, stripePriceId: undefined },
      };
    }),

    createCheckout: protectedProcedure
      .input(z.object({
        plan: z.enum(["pro", "team", "proAnnual", "teamAnnual"]),
        seats: z.number().min(5).max(50).optional(),
        teamName: z.string().min(1).max(255).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const plan = PLANS[input.plan];
        if (!plan.stripePriceId) {
          throw new Error("Invalid plan selected");
        }

        const isTeamPlan = input.plan === "team" || input.plan === "teamAnnual";
        const quantity = isTeamPlan ? (input.seats || 10) : 1;

        // Only include trial if user hasn't already used one
        const alreadyTrialed = !!ctx.user.trialStartAt;

        const session = await createCheckoutSession({
          userId: ctx.user.id,
          userEmail: ctx.user.email || "",
          userName: ctx.user.name || "",
          priceId: plan.stripePriceId,
          origin: ctx.req.headers.origin || "",
          quantity,
          plan: input.plan,
          teamName: input.teamName,
          includeTrial: !alreadyTrialed,
        });

        return { url: session.url };
      }),

    createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user.stripeCustomerId) {
        throw new Error("No active subscription found");
      }

      const session = await createBillingPortalSession({
        customerId: ctx.user.stripeCustomerId,
        origin: ctx.req.headers.origin || "",
      });

      return { url: session.url };
    }),

    getSubscription: protectedProcedure.query(async ({ ctx }) => {
      const tier = ctx.user.subscriptionTier || "free";
      const status = ctx.user.subscriptionStatus || "none";
      const trialEndsAt = ctx.user.trialEndsAt ? new Date(ctx.user.trialEndsAt).getTime() : null;
      const trialStartAt = ctx.user.trialStartAt ? new Date(ctx.user.trialStartAt).getTime() : null;
      const now = Date.now();

      // Calculate trial days remaining
      let trialDaysRemaining: number | null = null;
      if (status === "trialing" && trialEndsAt) {
        trialDaysRemaining = Math.max(0, Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24)));
      }

      // Check if trial has expired (status may not have been updated yet)
      const trialExpired = status === "trialing" && trialEndsAt && now >= trialEndsAt;

      return {
        tier,
        status: trialExpired ? "expired" as const : status,
        hasActiveSubscription: (status === "active" || status === "trialing" || status === "past_due") && tier !== "free" && !trialExpired,
        isTrial: status === "trialing" && !trialExpired,
        trialDaysRemaining,
        trialEndsAt,
        trialStartAt,
        trialExpired: !!trialExpired,
        stripeCustomerId: ctx.user.stripeCustomerId || null,
      };
    }),
  }),

  scenarios: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const results = await db
        .select()
        .from(scenarios)
        .where(eq(scenarios.isPublished, true))
        .orderBy(desc(scenarios.createdAt));
      return results;
    }),

    listAll: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const results = await db
        .select()
        .from(scenarios)
        .orderBy(desc(scenarios.createdAt));
      return results;
    }),

    generate: adminProcedure
      .input(z.object({
        prompt: z.string().min(10).max(1000),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]),
        category: z.string().min(1).max(100),
      }))
      .mutation(async ({ input }) => {
        const systemPrompt = `You are an expert industrial maintenance training scenario designer. You create realistic troubleshooting scenarios for electrical, PLC, motor control, and automation systems.

Generate a complete troubleshooting scenario based on the user's prompt. The scenario must feel like a real plant-floor situation with realistic equipment, readings, and decision points.

Return ONLY valid JSON with this exact structure:
{
  "title": "Short descriptive title (e.g., 'VFD Trips During Ramp-Up')",
  "description": "2-3 sentence description of the fault situation as a technician would encounter it",
  "estimatedTime": "X-Y min",
  "equipment": ["list", "of", "relevant", "equipment"],
  "steps": [
    {
      "id": 1,
      "title": "Step title",
      "description": "What the technician sees/needs to decide",
      "options": [
        {
          "id": "a",
          "text": "Option description",
          "correct": true,
          "consequence": "What happens when this is chosen",
          "reading": "Optional meter reading or observation"
        },
        {
          "id": "b",
          "text": "Option description",
          "correct": false,
          "consequence": "What happens when this wrong choice is made",
          "reading": "Optional meter reading"
        },
        {
          "id": "c",
          "text": "Option description",
          "correct": false,
          "consequence": "What happens",
          "reading": "Optional"
        }
      ]
    }
  ],
  "toolReadings": {
    "multimeter": { "label": "What the meter shows", "value": "Specific reading", "unit": "V/A/Ω" },
    "prints": { "label": "What the prints reveal", "description": "Brief circuit description" },
    "flashlight": { "label": "What you see", "description": "Physical observation" }
  }
}

Requirements:
- Include exactly 3 steps with 3 options each (one correct, two incorrect)
- Use realistic voltage/current/resistance readings
- Consequences should teach WHY a choice is right or wrong
- Equipment should be specific (e.g., "Allen-Bradley PowerFlex 525" not just "VFD")
- Difficulty: ${input.difficulty}
- Category: ${input.category}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input.prompt },
          ],
        });

        const rawContent = response.choices[0]?.message?.content;
        if (!rawContent) {
          throw new Error("AI generation failed - no response");
        }
        const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);

        // Parse the JSON response
        let scenarioData: any;
        try {
          // Extract JSON from potential markdown code blocks
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
          scenarioData = JSON.parse(jsonMatch[1]!.trim());
        } catch (e) {
          throw new Error("AI generation failed - invalid response format");
        }

        // Store in database
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(scenarios).values({
          title: scenarioData.title,
          category: input.category,
          difficulty: input.difficulty,
          estimatedTime: scenarioData.estimatedTime || "5-10 min",
          description: scenarioData.description,
          equipment: scenarioData.equipment,
          steps: scenarioData.steps,
          toolReadings: scenarioData.toolReadings,
          isFree: false,
          isPublished: false,
        });

        return {
          success: true,
          scenario: scenarioData,
        };
      }),

    publish: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(scenarios).set({ isPublished: true }).where(eq(scenarios.id, input.id));
        return { success: true };
      }),

    unpublish: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(scenarios).set({ isPublished: false }).where(eq(scenarios.id, input.id));
        return { success: true };
      }),

    toggleFree: adminProcedure
      .input(z.object({ id: z.number(), isFree: z.boolean() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.update(scenarios).set({ isFree: input.isFree }).where(eq(scenarios.id, input.id));
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.delete(scenarios).where(eq(scenarios.id, input.id));
        return { success: true };
      }),
  }),

  courses: router({
    /** Public content counts — single source of truth for all pages */
    contentCounts: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { courseModules: 0, scenarios: 0, lessons: 0 };
      const [modCount] = await db.select({ count: sql<number>`count(*)` }).from(courseModules).where(eq(courseModules.isPublished, true));
      const [scenCount] = await db.select({ count: sql<number>`count(*)` }).from(scenarios);
      const [lessonCount] = await db.select({ count: sql<number>`count(*)` }).from(courseLessons).where(eq(courseLessons.isPublished, true));
      return {
        courseModules: Number(modCount?.count || 0),
        scenarios: Number(scenCount?.count || 0),
        lessons: Number(lessonCount?.count || 0),
      };
    }),

    listModules: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];

      const mods = await db
        .select()
        .from(courseModules)
        .where(eq(courseModules.isPublished, true))
        .orderBy(courseModules.orderIndex);

      const lessonCountRows = await db
        .select({
          moduleId: courseLessons.moduleId,
          count: sql<number>`cast(count(*) as unsigned)`.mapWith(Number),
        })
        .from(courseLessons)
        .where(eq(courseLessons.isPublished, true))
        .groupBy(courseLessons.moduleId);

      const quizCountRows = await db
        .select({
          moduleId: quizQuestions.moduleId,
          count: sql<number>`cast(count(*) as unsigned)`.mapWith(Number),
        })
        .from(quizQuestions)
        .groupBy(quizQuestions.moduleId);

      const lessonMap = new Map(lessonCountRows.map((r) => [r.moduleId, r.count]));
      const quizMap = new Map(quizCountRows.map((r) => [r.moduleId, r.count]));

      return mods.map((mod) => {
        const actualLessonCount = lessonMap.get(mod.id) ?? 0;
        const quizQuestionCount = quizMap.get(mod.id) ?? 0;
        return {
          ...mod,
          actualLessonCount,
          quizQuestionCount,
          // Prefer live published lesson count so catalog matches the database
          totalLessons: actualLessonCount > 0 ? actualLessonCount : mod.totalLessons,
        };
      });
    }),

    /** Lightweight search index: modules + lesson titles + tutorials + scenarios (no full content) */
    searchIndex: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { modules: [], lessons: [], tutorials: [], scenarios: [] };
      const mods = await db.select({
        id: courseModules.id,
        slug: courseModules.slug,
        title: courseModules.title,
        description: courseModules.description,
        path: courseModules.path,
        totalLessons: courseModules.totalLessons,
      }).from(courseModules).where(eq(courseModules.isPublished, true)).orderBy(courseModules.orderIndex);
      const lessons = await db.select({
        id: courseLessons.id,
        slug: courseLessons.slug,
        title: courseLessons.title,
        moduleId: courseLessons.moduleId,
        estimatedMinutes: courseLessons.estimatedMinutes,
      }).from(courseLessons).where(eq(courseLessons.isPublished, true)).orderBy(courseLessons.orderIndex);
      const tuts = await db.select({
        id: tutorials.id,
        slug: tutorials.slug,
        title: tutorials.title,
        metaDescription: tutorials.metaDescription,
        category: tutorials.category,
        tags: tutorials.tags,
      }).from(tutorials).where(eq(tutorials.isPublished, true));
      const scens = await db.select({
        id: scenarios.id,
        title: scenarios.title,
        description: scenarios.description,
        category: scenarios.category,
        difficulty: scenarios.difficulty,
      }).from(scenarios).where(eq(scenarios.isPublished, true));
      return { modules: mods, lessons, tutorials: tuts, scenarios: scens };
    }),

    getModule: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const mods = await db.select().from(courseModules).where(eq(courseModules.slug, input.slug)).limit(1);
        if (mods.length === 0) return null;
        const mod = mods[0];
        const lessons = await db.select({
          id: courseLessons.id,
          slug: courseLessons.slug,
          title: courseLessons.title,
          orderIndex: courseLessons.orderIndex,
          estimatedMinutes: courseLessons.estimatedMinutes,
          linkedScenarioId: courseLessons.linkedScenarioId,
        })
          .from(courseLessons)
          .where(and(eq(courseLessons.moduleId, mod.id), eq(courseLessons.isPublished, true)))
          .orderBy(courseLessons.orderIndex);

        const [quizCountRow] = await db
          .select({ count: sql<number>`cast(count(*) as unsigned)`.mapWith(Number) })
          .from(quizQuestions)
          .where(eq(quizQuestions.moduleId, mod.id));

        const publishedLessonCount = lessons.length;
        const quizQuestionCount = quizCountRow?.count ?? 0;

        return {
          module: {
            ...mod,
            actualLessonCount: publishedLessonCount,
            totalLessons: publishedLessonCount > 0 ? publishedLessonCount : mod.totalLessons,
          },
          lessons,
          quizQuestionCount,
        };
      }),

    getLesson: publicProcedure
      .input(z.object({ moduleSlug: z.string(), lessonSlug: z.string() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const mods = await db.select().from(courseModules).where(eq(courseModules.slug, input.moduleSlug)).limit(1);
        if (mods.length === 0) return null;
        const mod = mods[0];
        const allLessons = await db.select().from(courseLessons).where(eq(courseLessons.moduleId, mod.id)).orderBy(courseLessons.orderIndex);
        const lessonIndex = allLessons.findIndex(l => l.slug === input.lessonSlug);
        if (lessonIndex === -1) return null;
        const lesson = allLessons[lessonIndex];
        const prevLesson = lessonIndex > 0 ? { slug: allLessons[lessonIndex - 1].slug, title: allLessons[lessonIndex - 1].title } : null;
        const nextLesson = lessonIndex < allLessons.length - 1 ? { slug: allLessons[lessonIndex + 1].slug, title: allLessons[lessonIndex + 1].title } : null;
        const practiceScenario = await resolveLessonPracticeScenario(lesson);

        const assessmentRows = await db
          .select({
            id: lessonAssessmentQuestions.id,
            type: lessonAssessmentQuestions.type,
            question: lessonAssessmentQuestions.question,
            options: lessonAssessmentQuestions.options,
            sortOrder: lessonAssessmentQuestions.sortOrder,
          })
          .from(lessonAssessmentQuestions)
          .where(eq(lessonAssessmentQuestions.lessonId, lesson.id))
          .orderBy(lessonAssessmentQuestions.sortOrder);

        const knowledgeCheckQuestions = assessmentRows.filter((q) => q.type === "knowledge_check");
        const lessonQuizQuestions = assessmentRows.filter((q) => q.type === "lesson_quiz");

        let gateStatus = {
          unlocked: lessonIndex === 0,
          knowledgeCheckPassed: false,
          lessonQuizPassed: false,
          scenarioRequired: Boolean(practiceScenario.hasPracticeScenario),
          scenarioPassed: false,
          scenarioSlug: practiceScenario.simulatorScenarioId,
          lessonQuizAttemptsRemaining: 3,
          lessonQuizCooldownEndsAt: null as string | null,
          canProceedToNext: false,
        };

        if (ctx.user) {
          const gates = await buildModuleLessonGates(db, ctx.user.id, mod.id);
          const thisGate = gates.find((g) => g.lessonId === lesson.id);
          if (thisGate) {
            const assessmentsDone =
              (!knowledgeCheckQuestions.length || thisGate.knowledgeCheckPassed) &&
              (!lessonQuizQuestions.length || thisGate.lessonQuizPassed);
            const scenarioDone = !thisGate.scenarioRequired || thisGate.scenarioPassed;
            gateStatus = {
              unlocked: thisGate.unlocked,
              knowledgeCheckPassed: thisGate.knowledgeCheckPassed,
              lessonQuizPassed: thisGate.lessonQuizPassed,
              scenarioRequired: thisGate.scenarioRequired,
              scenarioPassed: thisGate.scenarioPassed,
              scenarioSlug: thisGate.scenarioSlug,
              lessonQuizAttemptsRemaining: thisGate.lessonQuizAttemptsRemaining,
              lessonQuizCooldownEndsAt: thisGate.lessonQuizCooldownEndsAt,
              canProceedToNext: assessmentsDone && scenarioDone,
            };
          }
        } else {
          gateStatus.unlocked = lessonIndex === 0;
        }

        return {
          lesson: isCardFormatLesson(input.moduleSlug, input.lessonSlug)
            ? { ...lesson, content: CARD_LESSON_CONTENT_STUB, contentFormat: "cards" as const }
            : lesson,
          module: mod,
          prevLesson,
          nextLesson,
          lessonIndex,
          totalLessons: allLessons.length,
          practiceScenario,
          knowledgeCheckQuestions,
          lessonQuizQuestions,
          gateStatus,
        };
      }),

    getProgress: protectedProcedure
      .input(z.object({ moduleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { completedLessonIds: [], lessonGates: [] };
        const progress = await db.select().from(userProgress).where(
          and(eq(userProgress.userId, ctx.user.id), eq(userProgress.moduleId, input.moduleId), eq(userProgress.completed, true))
        );
        const lessonGates = await buildModuleLessonGates(db, ctx.user.id, input.moduleId);
        return {
          completedLessonIds: progress.map(p => p.lessonId),
          lessonGates,
        };
      }),

    markLessonComplete: protectedProcedure
      .input(z.object({ lessonId: z.number(), moduleId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const passedMap = await getPassedAttemptMap(db, ctx.user.id, [input.lessonId]);
        const hasKcQuestions = await db
          .select({ id: lessonAssessmentQuestions.id })
          .from(lessonAssessmentQuestions)
          .where(and(eq(lessonAssessmentQuestions.lessonId, input.lessonId), eq(lessonAssessmentQuestions.type, "knowledge_check")))
          .limit(1);
        const hasQuizQuestions = await db
          .select({ id: lessonAssessmentQuestions.id })
          .from(lessonAssessmentQuestions)
          .where(and(eq(lessonAssessmentQuestions.lessonId, input.lessonId), eq(lessonAssessmentQuestions.type, "lesson_quiz")))
          .limit(1);

        if (hasKcQuestions.length > 0 && !passedMap.get(`${input.lessonId}:knowledge_check`)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Pass the knowledge check before completing this lesson." });
        }
        if (hasQuizQuestions.length > 0 && !passedMap.get(`${input.lessonId}:lesson_quiz`)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Pass the lesson quiz before completing this lesson." });
        }

        const [lessonRow] = await db
          .select()
          .from(courseLessons)
          .where(eq(courseLessons.id, input.lessonId))
          .limit(1);
        if (lessonRow) {
          const scenarioGate = await getLessonScenarioGate(db, ctx.user.id, lessonRow);
          if (scenarioGate.required && !scenarioGate.passed) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Complete the linked troubleshooting scenario before marking this lesson complete.",
            });
          }
        }

        const existing = await db.select().from(userProgress).where(
          and(eq(userProgress.userId, ctx.user.id), eq(userProgress.lessonId, input.lessonId))
        ).limit(1);
        if (existing.length === 0) {
          await db.insert(userProgress).values({
            userId: ctx.user.id,
            lessonId: input.lessonId,
            moduleId: input.moduleId,
            completed: true,
            completedAt: new Date(),
          });
        } else {
          await db.update(userProgress).set({ completed: true, completedAt: new Date() }).where(eq(userProgress.id, existing[0].id));
        }
        return { success: true };
      }),

    getDashboard: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { modules: [], overallProgress: 0, totalLessons: 0, completedLessons: 0, nextLesson: null, certificates: [] };

      // Get all published modules
      const allModules = await db.select().from(courseModules).where(eq(courseModules.isPublished, true)).orderBy(courseModules.orderIndex);

      // Get all published lessons
      const allLessons = await db.select().from(courseLessons).where(eq(courseLessons.isPublished, true)).orderBy(courseLessons.orderIndex);

      // Get user progress
      const progress = await db.select().from(userProgress).where(
        and(eq(userProgress.userId, ctx.user.id), eq(userProgress.completed, true))
      );
      const completedLessonIds = new Set(progress.map(p => p.lessonId));

      // Get user certificates
      const userCerts = await db.select().from(certificates).where(eq(certificates.userId, ctx.user.id));
      const certModuleIds = new Set(userCerts.map(c => c.moduleId));

      // Build per-module progress
      let nextLesson: { moduleSlug: string; moduleName: string; lessonSlug: string; lessonTitle: string } | null = null;
      const modules = allModules.map(mod => {
        const moduleLessons = allLessons.filter(l => l.moduleId === mod.id);
        const completedCount = moduleLessons.filter(l => completedLessonIds.has(l.id)).length;
        const totalCount = moduleLessons.length;
        const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        const hasCertificate = certModuleIds.has(mod.id);

        // Find next incomplete lesson for recommendation
        if (!nextLesson && percentage < 100) {
          const nextIncomplete = moduleLessons.find(l => !completedLessonIds.has(l.id));
          if (nextIncomplete) {
            nextLesson = {
              moduleSlug: mod.slug,
              moduleName: mod.title,
              lessonSlug: nextIncomplete.slug,
              lessonTitle: nextIncomplete.title,
            };
          }
        }

        return {
          id: mod.id,
          title: mod.title,
          slug: mod.slug,
          icon: mod.icon,
          completedCount,
          totalCount,
          percentage,
          hasCertificate,
        };
      });

      // Filter out modules with 0 lessons (upcoming/empty courses)
      const activeModules = modules.filter(m => m.totalCount > 0);

      const totalLessons = allLessons.filter(l => allModules.some(m => m.id === l.moduleId)).length;
      const completedLessons = progress.filter(p => allLessons.some(l => l.id === p.lessonId)).length;
      const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return { modules: activeModules, overallProgress, totalLessons, completedLessons, nextLesson, certificates: userCerts };
    }),
  }),

  hubs: router({
    /** ILU stage status stub — uses existing lesson gates, no new persistence (A2). */
    getIluStatus: publicProcedure
      .input(z.object({ moduleSlug: z.string(), lessonSlug: z.string() }))
      .query(async ({ ctx, input }) => {
        const progress: IluProgressSnapshot = { isOnLessonPage: true };

        const db = await getDb();
        if (ctx.user && db) {
          const mods = await db
            .select()
            .from(courseModules)
            .where(eq(courseModules.slug, input.moduleSlug))
            .limit(1);
          if (mods.length > 0) {
            const lessons = await db
              .select()
              .from(courseLessons)
              .where(
                and(
                  eq(courseLessons.moduleId, mods[0].id),
                  eq(courseLessons.slug, input.lessonSlug)
                )
              )
              .limit(1);
            if (lessons.length > 0) {
              const gates = await buildModuleLessonGates(db, ctx.user.id, mods[0].id);
              const gate = gates.find((g) => g.lessonId === lessons[0].id);
              if (gate) {
                progress.lessonCompleted = gate.completed;
                progress.lessonQuizPassed = gate.lessonQuizPassed;
                progress.scenarioPassed = gate.scenarioPassed;
                progress.knowledgeCheckPassed = gate.knowledgeCheckPassed;
              }
            }
          }
        }

        return buildIluStatus(input.moduleSlug, input.lessonSlug, progress, "A");
      }),
  }),

  assessments: router({
    /** Unified V1/V2/V3 scenario list for admin assessment builder (Q-06) */
    listScenarios: adminProcedure.query(() => listAssessmentScenarios()),

    // Create a new assessment invite (admin only)
    create: adminProcedure
      .input(z.object({
        candidateName: z.string().min(1).max(255),
        candidateEmail: z.string().email().max(320),
        company: z.string().max(255).optional(),
        position: z.string().max(255).optional(),
        scenarioIds: z.array(z.string()).min(1).max(10),
        timeLimitMinutes: z.number().min(0).max(180).default(60),
        expiresInDays: z.number().min(1).max(30).default(7),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const { valid, normalized, invalid } = validateAssessmentScenarioIds(
          input.scenarioIds
        );
        if (!valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid assessment scenario id(s): ${invalid.join(", ")}`,
          });
        }

        const token = nanoid(32);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

        await db.insert(assessments).values({
          token,
          createdBy: ctx.user.id,
          candidateName: input.candidateName,
          candidateEmail: input.candidateEmail,
          company: input.company || null,
          position: input.position || null,
          scenarioIds: normalized,
          timeLimitMinutes: input.timeLimitMinutes,
          expiresAt,
        });

        // Notify owner
        await notifyOwner({
          title: `Assessment Created for ${input.candidateName}`,
          content: `New candidate assessment created.\n\nCandidate: ${input.candidateName}\nEmail: ${input.candidateEmail}\nCompany: ${input.company || "N/A"}\nPosition: ${input.position || "N/A"}\nScenarios: ${input.scenarioIds.length}\nTime Limit: ${input.timeLimitMinutes} min\nExpires: ${expiresAt.toLocaleDateString()}\n\nAssessment Link Token: ${token}`,
        });

        return { success: true, token };
      }),

    // List all assessments (admin only)
    list: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const allAssessments = await db.select().from(assessments).orderBy(desc(assessments.createdAt));
      // Attach results for each assessment
      const withResults = await Promise.all(
        allAssessments.map(async (a) => {
          const results = await db.select().from(assessmentResults).where(eq(assessmentResults.assessmentId, a.id));
          return { ...a, results };
        })
      );
      return withResults;
    }),

    // Get assessment by token (public - for candidates)
    getByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db
          .select()
          .from(assessments)
          .where(eq(assessments.token, input.token))
          .limit(1);

        if (result.length === 0) {
          throw new Error("Assessment not found");
        }

        const assessment = result[0];

        // Check if expired
        if (assessment.expiresAt && new Date() > assessment.expiresAt) {
          return { ...assessment, status: "expired" as const };
        }

        return assessment;
      }),

    // Start an assessment (public - candidate)
    start: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db
          .select()
          .from(assessments)
          .where(eq(assessments.token, input.token))
          .limit(1);

        if (result.length === 0) throw new Error("Assessment not found");
        const assessment = result[0];

        if (assessment.status === "completed") throw new Error("Assessment already completed");
        if (assessment.expiresAt && new Date() > assessment.expiresAt) throw new Error("Assessment expired");

        if (assessment.status === "pending") {
          await db
            .update(assessments)
            .set({ status: "in_progress", startedAt: new Date() })
            .where(eq(assessments.id, assessment.id));
        }

        return { success: true };
      }),

    // Submit a scenario result (public - candidate)
    submitResult: publicProcedure
      .input(z.object({
        token: z.string(),
        scenarioId: z.string(),
        scenarioTitle: z.string(),
        score: z.number(),
        maxScore: z.number(),
        percentage: z.number(),
        grade: z.string(),
        timeSeconds: z.number(),
        decisions: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db
          .select()
          .from(assessments)
          .where(eq(assessments.token, input.token))
          .limit(1);

        if (result.length === 0) throw new Error("Assessment not found");
        const assessment = result[0];

        await db.insert(assessmentResults).values({
          assessmentId: assessment.id,
          scenarioId: input.scenarioId,
          scenarioTitle: input.scenarioTitle,
          score: input.score,
          maxScore: input.maxScore,
          percentage: input.percentage,
          grade: input.grade,
          timeSeconds: input.timeSeconds,
          decisions: input.decisions || null,
        });

        // Check if all scenarios completed
        const scenarioIds = (assessment.scenarioIds as string[]) || [];
        const completedResults = await db
          .select()
          .from(assessmentResults)
          .where(eq(assessmentResults.assessmentId, assessment.id));

        if (completedResults.length >= scenarioIds.length) {
          const avgScore = completedResults.length > 0
            ? Math.round(completedResults.reduce((sum, r) => sum + r.percentage, 0) / completedResults.length)
            : 0;

          const packThreshold = 75;
          const hireRecommendation =
            avgScore >= packThreshold + 10 ? "hire" as const
            : avgScore >= packThreshold ? "hold" as const
            : "no_hire" as const;

          await db
            .update(assessments)
            .set({
              status: "completed",
              completedAt: new Date(),
              hireRecommendation,
            })
            .where(eq(assessments.id, assessment.id));

          await notifyOwner({
            title: `Assessment Completed: ${assessment.candidateName} (${avgScore}%)`,
            content: `Candidate assessment completed!\n\nCandidate: ${assessment.candidateName}\nEmail: ${assessment.candidateEmail}\nPosition: ${assessment.position || "N/A"}\nCompany: ${assessment.company || "N/A"}\n\nOverall Score: ${avgScore}%\nRecommendation: ${hireRecommendation}\nScenarios Completed: ${completedResults.length}\n\nView full results in the Admin dashboard.`,
          });
        }

        return { success: true };
      }),

    // Get results for an assessment (admin only)
    getResults: adminProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db
          .select()
          .from(assessmentResults)
          .where(eq(assessmentResults.assessmentId, input.assessmentId))
          .orderBy(assessmentResults.completedAt);
      }),
  }),

  quiz: router({
    getQuestions: protectedProcedure
      .input(z.object({ moduleId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Enforce paid subscription
        const tier = ctx.user.subscriptionTier || "free";
        if (tier === "free") {
          throw new TRPCError({ code: "FORBIDDEN", message: "A paid subscription is required to take quizzes." });
        }
        const db = (await getDb())!;
        const questions = await db
          .select({
            id: quizQuestions.id,
            question: quizQuestions.question,
            options: quizQuestions.options,
            sortOrder: quizQuestions.sortOrder,
          })
          .from(quizQuestions)
          .where(eq(quizQuestions.moduleId, input.moduleId))
          .orderBy(quizQuestions.sortOrder);
        return questions;
      }),

    submitQuiz: protectedProcedure
      .input(z.object({
        moduleId: z.number(),
        answers: z.array(z.object({
          questionId: z.number(),
          selectedIndex: z.number(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        // Enforce paid subscription
        const tier = ctx.user.subscriptionTier || "free";
        if (tier === "free") {
          throw new TRPCError({ code: "FORBIDDEN", message: "A paid subscription is required to take quizzes." });
        }
        const db = (await getDb())!;
        // Get all questions with correct answers
        const questions = await db
          .select()
          .from(quizQuestions)
          .where(eq(quizQuestions.moduleId, input.moduleId));

        if (questions.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No quiz questions are available for this module yet.",
          });
        }

        // Score the quiz
        let correct = 0;
        const results = input.answers.map(answer => {
          const question = questions.find(q => q.id === answer.questionId);
          const isCorrect = question ? question.correctIndex === answer.selectedIndex : false;
          if (isCorrect) correct++;
          return {
            questionId: answer.questionId,
            selectedIndex: answer.selectedIndex,
            correctIndex: question?.correctIndex ?? 0,
            isCorrect,
            explanation: question?.explanation ?? '',
          };
        });

        const lessonsComplete = await allModuleLessonQuizzesPassed(db, ctx.user.id, input.moduleId);
        if (!lessonsComplete) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Complete all lessons and pass each lesson quiz before taking the module assessment.",
          });
        }

        const totalQuestions = questions.length;
        const score = Math.round((correct / totalQuestions) * 100);
        const passed = didPass(score, "module_quiz");

        // Save attempt
        await db.insert(quizAttempts).values({
          userId: ctx.user.id,
          moduleId: input.moduleId,
          score,
          totalQuestions,
          passed,
          answers: JSON.stringify(input.answers),
        });

        // If passed, generate certificate
        let certificateCode = null;
        if (passed) {
          // Check if certificate already exists
          const existing = await db
            .select()
            .from(certificates)
            .where(and(
              eq(certificates.userId, ctx.user.id),
              eq(certificates.moduleId, input.moduleId)
            ));

          if (existing.length === 0) {
            // Get module title
            const [mod] = await db
              .select({ title: courseModules.title })
              .from(courseModules)
              .where(eq(courseModules.id, input.moduleId));

            certificateCode = nanoid(16);
            await db.insert(certificates).values({
              userId: ctx.user.id,
              moduleId: input.moduleId,
              certificateCode,
              userName: ctx.user.name || 'Student',
              moduleTitle: mod?.title || 'Course Module',
              quizScore: score,
            });
          } else {
            certificateCode = existing[0].certificateCode;
          }
        }

        return { score, totalQuestions, correct, passed, results, certificateCode };
      }),

    getAttempts: protectedProcedure
      .input(z.object({ moduleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        const attempts = await db!
          .select()
          .from(quizAttempts)
          .where(and(
            eq(quizAttempts.userId, ctx.user.id),
            eq(quizAttempts.moduleId, input.moduleId)
          ))
          .orderBy(desc(quizAttempts.completedAt));
        return attempts;
      }),
  }),

  lessonAssessment: router({
    getForLesson: protectedProcedure
      .input(z.object({ lessonId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const rows = await db
          .select({
            id: lessonAssessmentQuestions.id,
            type: lessonAssessmentQuestions.type,
            question: lessonAssessmentQuestions.question,
            options: lessonAssessmentQuestions.options,
            sortOrder: lessonAssessmentQuestions.sortOrder,
          })
          .from(lessonAssessmentQuestions)
          .where(eq(lessonAssessmentQuestions.lessonId, input.lessonId))
          .orderBy(lessonAssessmentQuestions.sortOrder);
        return {
          knowledgeCheck: rows.filter((r) => r.type === "knowledge_check"),
          lessonQuiz: rows.filter((r) => r.type === "lesson_quiz"),
        };
      }),

    submit: protectedProcedure
      .input(z.object({
        lessonId: z.number(),
        type: z.enum(["knowledge_check", "lesson_quiz"]),
        answers: z.array(z.object({
          questionId: z.number(),
          selectedIndex: z.number(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const [lesson] = await db
          .select({ moduleId: courseLessons.moduleId })
          .from(courseLessons)
          .where(eq(courseLessons.id, input.lessonId))
          .limit(1);
        if (!lesson) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
        }

        if (input.type === "lesson_quiz") {
          const passedMap = await getPassedAttemptMap(db, ctx.user.id, [input.lessonId]);
          if (!passedMap.get(`${input.lessonId}:knowledge_check`)) {
            const hasKc = await db
              .select({ id: lessonAssessmentQuestions.id })
              .from(lessonAssessmentQuestions)
              .where(and(eq(lessonAssessmentQuestions.lessonId, input.lessonId), eq(lessonAssessmentQuestions.type, "knowledge_check")))
              .limit(1);
            if (hasKc.length > 0) {
              throw new TRPCError({ code: "FORBIDDEN", message: "Pass the knowledge check first." });
            }
          }

          const { attemptsUsed, cooldownEndsAt } = await getLessonQuizAttemptInfo(db, ctx.user.id, input.lessonId);
          if (cooldownEndsAt && cooldownEndsAt.getTime() > Date.now()) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: `Lesson quiz locked until ${cooldownEndsAt.toISOString()}`,
            });
          }
          if (attemptsUsed >= LESSON_QUIZ_MAX_ATTEMPTS && !passedMap.get(`${input.lessonId}:lesson_quiz`)) {
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Maximum lesson quiz attempts reached for this period." });
          }
        }

        const scored = await scoreLessonAssessment(db, input.lessonId, input.type, input.answers);
        if (!scored) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No assessment questions for this lesson." });
        }

        await db.insert(lessonAssessmentAttempts).values({
          userId: ctx.user.id,
          lessonId: input.lessonId,
          type: input.type,
          score: scored.score,
          totalQuestions: scored.totalQuestions,
          passed: scored.passed,
          answers: JSON.stringify(input.answers),
        });

        if (input.type === "lesson_quiz" && scored.passed) {
          const existing = await db.select().from(userProgress).where(
            and(eq(userProgress.userId, ctx.user.id), eq(userProgress.lessonId, input.lessonId))
          ).limit(1);
          if (existing.length === 0) {
            await db.insert(userProgress).values({
              userId: ctx.user.id,
              lessonId: input.lessonId,
              moduleId: lesson.moduleId,
              completed: true,
              completedAt: new Date(),
            });
          } else if (!existing[0].completed) {
            await db.update(userProgress).set({ completed: true, completedAt: new Date() }).where(eq(userProgress.id, existing[0].id));
          }
        }

        const { attemptsUsed } = await getLessonQuizAttemptInfo(db, ctx.user.id, input.lessonId);
        return {
          ...scored,
          lessonQuizAttemptsRemaining: input.type === "lesson_quiz"
            ? Math.max(0, LESSON_QUIZ_MAX_ATTEMPTS - attemptsUsed)
            : undefined,
        };
      }),

    getMyAttempts: protectedProcedure
      .input(z.object({ lessonId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];
        return db
          .select()
          .from(lessonAssessmentAttempts)
          .where(and(
            eq(lessonAssessmentAttempts.userId, ctx.user.id),
            eq(lessonAssessmentAttempts.lessonId, input.lessonId),
          ))
                    .orderBy(desc(lessonAssessmentAttempts.completedAt));
      }),

    getWeakSpots: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all failed attempts for this user
      const failedAttempts = await db
        .select({
          lessonId: lessonAssessmentAttempts.lessonId,
          type: lessonAssessmentAttempts.type,
          score: lessonAssessmentAttempts.score,
          totalQuestions: lessonAssessmentAttempts.totalQuestions,
          passed: lessonAssessmentAttempts.passed,
          answers: lessonAssessmentAttempts.answers,
          completedAt: lessonAssessmentAttempts.completedAt,
        })
        .from(lessonAssessmentAttempts)
        .where(and(
          eq(lessonAssessmentAttempts.userId, ctx.user.id),
          eq(lessonAssessmentAttempts.passed, false)
        ))
        .orderBy(desc(lessonAssessmentAttempts.completedAt));

      if (failedAttempts.length === 0) return { weakSpots: [], totalFailures: 0 };

      // Group failures by lessonId
      const lessonFailures = new Map<number, { count: number; lastFailed: Date; types: Set<string> }>();
      for (const attempt of failedAttempts) {
        const existing = lessonFailures.get(attempt.lessonId);
        if (existing) {
          existing.count++;
          existing.types.add(attempt.type);
        } else {
          lessonFailures.set(attempt.lessonId, {
            count: 1,
            lastFailed: attempt.completedAt,
            types: new Set([attempt.type]),
          });
        }
      }

      // Get lesson + module info for the failed lessons
      const lessonIds = Array.from(lessonFailures.keys());
      const lessonInfo = await db
        .select({
          id: courseLessons.id,
          slug: courseLessons.slug,
          title: courseLessons.title,
          moduleId: courseLessons.moduleId,
        })
        .from(courseLessons)
        .where(inArray(courseLessons.id, lessonIds));

      const moduleIds = Array.from(new Set(lessonInfo.map((l) => l.moduleId)));
      const moduleInfo = await db
        .select({ id: courseModules.id, slug: courseModules.slug, title: courseModules.title })
        .from(courseModules)
        .where(inArray(courseModules.id, moduleIds));
      const moduleMap = new Map(moduleInfo.map((m) => [m.id, m]));

      // Also check if user has since passed these lessons
      const passedAttempts = await db
        .select({ lessonId: lessonAssessmentAttempts.lessonId, type: lessonAssessmentAttempts.type })
        .from(lessonAssessmentAttempts)
        .where(and(
          eq(lessonAssessmentAttempts.userId, ctx.user.id),
          eq(lessonAssessmentAttempts.passed, true),
          inArray(lessonAssessmentAttempts.lessonId, lessonIds)
        ));
      const passedSet = new Set(passedAttempts.map((p) => `${p.lessonId}:${p.type}`));

      const weakSpots = lessonInfo
        .map((lesson) => {
          const failures = lessonFailures.get(lesson.id)!;
          const mod = moduleMap.get(lesson.moduleId);
          const types = Array.from(failures.types);
          const resolved = types.every((t) => passedSet.has(`${lesson.id}:${t}`));
          return {
            lessonId: lesson.id,
            lessonSlug: lesson.slug,
            lessonTitle: lesson.title,
            moduleSlug: mod?.slug ?? "",
            moduleTitle: mod?.title ?? "",
            failureCount: failures.count,
            lastFailed: failures.lastFailed,
            assessmentTypes: types,
            resolved,
          };
        })
        .sort((a, b) => {
          // Unresolved first, then by failure count desc
          if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
          return b.failureCount - a.failureCount;
        });

      return { weakSpots, totalFailures: failedAttempts.length };
    }),
  }),
  certificates: router({
    getMyCertificates: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      const certs = await db!
        .select()
        .from(certificates)
        .where(eq(certificates.userId, ctx.user.id))
        .orderBy(desc(certificates.issuedAt));
      return certs;
    }),

    getByCode: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        const [cert] = await db!
          .select()
          .from(certificates)
          .where(eq(certificates.certificateCode, input.code));
        return cert || null;
      }),
  }),

  team: router({
    // Get user's team (as owner or member)
    getMyTeam: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;

      // Check if user owns a team
      const [ownedTeam] = await db
        .select()
        .from(teams)
        .where(and(eq(teams.ownerId, ctx.user.id), eq(teams.isActive, true)))
        .limit(1);

      if (ownedTeam) {
        const members = await db
          .select()
          .from(teamMembers)
          .where(eq(teamMembers.teamId, ownedTeam.id));
        return { ...ownedTeam, members, role: "owner" as const };
      }

      // Check if user is a member of a team
      const [membership] = await db
        .select()
        .from(teamMembers)
        .where(and(
          eq(teamMembers.userId, ctx.user.id),
          eq(teamMembers.status, "active")
        ))
        .limit(1);

      if (membership) {
        const [team] = await db
          .select()
          .from(teams)
          .where(and(eq(teams.id, membership.teamId), eq(teams.isActive, true)));
        if (team) {
          const members = await db
            .select()
            .from(teamMembers)
            .where(eq(teamMembers.teamId, team.id));
          return { ...team, members, role: membership.role };
        }
      }

      return null;
    }),

    // Create invite link for team members
    createInvite: protectedProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Verify user owns a team
        const [team] = await db
          .select()
          .from(teams)
          .where(and(eq(teams.ownerId, ctx.user.id), eq(teams.isActive, true)))
          .limit(1);

        if (!team) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You don't own a team" });
        }

        // Check seat limit
        const members = await db
          .select()
          .from(teamMembers)
          .where(and(
            eq(teamMembers.teamId, team.id),
            eq(teamMembers.status, "active")
          ));

        const pendingMembers = await db
          .select()
          .from(teamMembers)
          .where(and(
            eq(teamMembers.teamId, team.id),
            eq(teamMembers.status, "pending")
          ));

        if (members.length + pendingMembers.length >= team.maxSeats) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Team seat limit reached (${team.maxSeats} seats). Upgrade your plan to add more seats.` });
        }

        // Check if already invited
        const [existing] = await db
          .select()
          .from(teamMembers)
          .where(and(
            eq(teamMembers.teamId, team.id),
            eq(teamMembers.invitedEmail, input.email)
          ))
          .limit(1);

        if (existing && existing.status !== "removed") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This email has already been invited" });
        }

        const token = nanoid(32);

        if (existing && existing.status === "removed") {
          // Re-invite removed member
          await db
            .update(teamMembers)
            .set({ status: "pending", inviteToken: token })
            .where(eq(teamMembers.id, existing.id));
        } else {
          await db.insert(teamMembers).values({
            teamId: team.id,
            invitedEmail: input.email,
            inviteToken: token,
            role: "member",
            status: "pending",
          });
        }

        // Notify team owner about the invite (serves as record)
        await notifyOwner({
          title: `Team Invite Sent: ${input.email}`,
          content: `A team invite was created for ${input.email} to join "${team.name}".\n\nThe invite link has been copied to the team owner's clipboard. Share it with the invitee to complete onboarding.`,
        }).catch(() => {});

        return { token, teamName: team.name };
      }),

    // Accept an invite (join team)
    acceptInvite: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const [invite] = await db
          .select()
          .from(teamMembers)
          .where(and(
            eq(teamMembers.inviteToken, input.token),
            eq(teamMembers.status, "pending")
          ))
          .limit(1);

        if (!invite) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired invite" });
        }

        // Verify team is still active
        const [team] = await db
          .select()
          .from(teams)
          .where(and(eq(teams.id, invite.teamId), eq(teams.isActive, true)))
          .limit(1);

        if (!team) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Team is no longer active" });
        }

        // Activate the member
        await db
          .update(teamMembers)
          .set({
            userId: ctx.user.id,
            status: "active",
            joinedAt: new Date(),
            inviteToken: null,
          })
          .where(eq(teamMembers.id, invite.id));

        // Upgrade user to team tier
        await db
          .update(users)
          .set({ subscriptionTier: "team" })
          .where(eq(users.id, ctx.user.id));

        return { success: true, teamName: team.name };
      }),

    // Remove a member from team (owner only)
    removeMember: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Verify user owns a team
        const [team] = await db
          .select()
          .from(teams)
          .where(and(eq(teams.ownerId, ctx.user.id), eq(teams.isActive, true)))
          .limit(1);

        if (!team) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You don't own a team" });
        }

        const [member] = await db
          .select()
          .from(teamMembers)
          .where(and(
            eq(teamMembers.id, input.memberId),
            eq(teamMembers.teamId, team.id)
          ))
          .limit(1);

        if (!member) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
        }

        if (member.role === "owner") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot remove team owner" });
        }

        await db
          .update(teamMembers)
          .set({ status: "removed" })
          .where(eq(teamMembers.id, input.memberId));

        // Downgrade removed user to free if they have a userId
        if (member.userId) {
          await db
            .update(users)
            .set({ subscriptionTier: "free" })
            .where(eq(users.id, member.userId));
        }

        return { success: true };
      }),

    // Get team progress (owner/admin only)
    getTeamProgress: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;

      // Check if user owns a team
      let [team] = await db
        .select()
        .from(teams)
        .where(and(eq(teams.ownerId, ctx.user.id), eq(teams.isActive, true)))
        .limit(1);

      // If not owner, check if user is an admin member of a team
      if (!team) {
        const [adminMembership] = await db
          .select()
          .from(teamMembers)
          .where(and(
            eq(teamMembers.userId, ctx.user.id),
            eq(teamMembers.role, "admin"),
            eq(teamMembers.status, "active")
          ))
          .limit(1);

        if (adminMembership) {
          [team] = await db
            .select()
            .from(teams)
            .where(and(eq(teams.id, adminMembership.teamId), eq(teams.isActive, true)))
            .limit(1);
        }
      }

      if (!team) return null;

      // Get active members with user IDs
      const members = await db
        .select()
        .from(teamMembers)
        .where(and(
          eq(teamMembers.teamId, team.id),
          eq(teamMembers.status, "active")
        ));

      const memberUserIds = members
        .filter(m => m.userId !== null)
        .map(m => m.userId!);

      if (memberUserIds.length === 0) {
        return { team, memberProgress: [] };
      }

      // Get user details for members
      const memberUsers = await db
        .select({ id: users.id, name: users.name, email: users.email, lastSignedIn: users.lastSignedIn })
        .from(users)
        .where(inArray(users.id, memberUserIds));

      // Get progress for all members
      const allProgress = await db
        .select()
        .from(userProgress)
        .where(inArray(userProgress.userId, memberUserIds));

      // Get total lessons count
      const allLessons = await db
        .select({ id: courseLessons.id })
        .from(courseLessons)
        .where(eq(courseLessons.isPublished, true));
      const totalLessons = allLessons.length;

      // Get certificates for members
      const memberCerts = await db
        .select()
        .from(certificates)
        .where(inArray(certificates.userId, memberUserIds));

      const publishedModules = await db
        .select({ id: courseModules.id, slug: courseModules.slug, title: courseModules.title })
        .from(courseModules)
        .where(eq(courseModules.isPublished, true));

      const lessonCounts = await db
        .select({
          moduleId: courseLessons.moduleId,
          count: sql<number>`cast(count(*) as unsigned)`.mapWith(Number),
        })
        .from(courseLessons)
        .where(eq(courseLessons.isPublished, true))
        .groupBy(courseLessons.moduleId);

      const lessonCountByModule = new Map(lessonCounts.map((r) => [r.moduleId, r.count]));

      const memberScenarioCounts = await db
        .select({
          userId: scenarioCompletions.userId,
          count: sql<number>`cast(count(distinct ${scenarioCompletions.scenarioSlug}) as unsigned)`.mapWith(Number),
        })
        .from(scenarioCompletions)
        .where(inArray(scenarioCompletions.userId, memberUserIds))
        .groupBy(scenarioCompletions.userId);

      const scenarioCountByUser = new Map(memberScenarioCounts.map((r) => [r.userId, r.count]));

      // Build progress per member
      const memberProgress = memberUsers.map(user => {
        const progress = allProgress.filter(p => p.userId === user.id && p.completed);
        const certs = memberCerts.filter(c => c.userId === user.id);

        const moduleProgress = publishedModules.map((mod) => {
          const completedInModule = progress.filter((p) => p.moduleId === mod.id).length;
          const totalInModule = lessonCountByModule.get(mod.id) ?? 0;
          return {
            moduleId: mod.id,
            moduleSlug: mod.slug,
            moduleTitle: mod.title,
            skillDomain: skillDomainForModule(mod.slug),
            completedLessons: completedInModule,
            totalLessons: totalInModule,
            percent: totalInModule > 0 ? Math.round((completedInModule / totalInModule) * 100) : 0,
          };
        });

        return {
          userId: user.id,
          userName: user.name || "Unknown",
          name: user.name || "Unknown",
          email: user.email || "",
          lastActive: user.lastSignedIn,
          completedLessons: progress.length,
          totalLessons,
          completionPercent: totalLessons > 0 ? Math.round((progress.length / totalLessons) * 100) : 0,
          certificatesEarned: certs.length,
          scenariosCompleted: scenarioCountByUser.get(user.id) ?? 0,
          moduleProgress,
        };
      });

      return { team, memberProgress };
    }),

    // Get invite info (public - for invite acceptance page)
    getInviteInfo: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;

        const [invite] = await db
          .select()
          .from(teamMembers)
          .where(and(
            eq(teamMembers.inviteToken, input.token),
            eq(teamMembers.status, "pending")
          ))
          .limit(1);

        if (!invite) return null;

        const [team] = await db
          .select({ name: teams.name })
          .from(teams)
          .where(eq(teams.id, invite.teamId))
          .limit(1);

        return {
          teamName: team?.name || "Unknown Team",
          email: invite.invitedEmail,
        };
      }),
  }),

  // Knowledge Base / Tutorials
  tutorials: router({
    // List tutorials with optional search and filters
    list: publicProcedure
      .input(z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { tutorials: [], total: 0 };

        const conditions = [eq(tutorials.isPublished, true)];

        if (input.category) {
          conditions.push(eq(tutorials.category, input.category));
        }
        if (input.difficulty) {
          conditions.push(eq(tutorials.difficulty, input.difficulty));
        }
        if (input.search) {
          const searchTerm = `%${input.search}%`;
          conditions.push(
            or(
              like(tutorials.title, searchTerm),
              like(tutorials.metaDescription, searchTerm)
            )!
          );
        }

        const whereClause = and(...conditions);

        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(tutorials)
          .where(whereClause);

        const results = await db
          .select({
            id: tutorials.id,
            title: tutorials.title,
            slug: tutorials.slug,
            metaDescription: tutorials.metaDescription,
            difficulty: tutorials.difficulty,
            category: tutorials.category,
            readingTime: tutorials.readingTime,
            tags: tutorials.tags,
            publishedAt: tutorials.publishedAt,
          })
          .from(tutorials)
          .where(whereClause)
          .orderBy(desc(tutorials.publishedAt))
          .limit(input.limit)
          .offset(input.offset);

        return { tutorials: results, total: countResult?.count || 0 };
      }),

    // Get single tutorial by slug
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;

        const [tutorial] = await db
          .select()
          .from(tutorials)
          .where(and(
            eq(tutorials.slug, input.slug),
            eq(tutorials.isPublished, true)
          ))
          .limit(1);

        if (!tutorial) return null;

        // Get related tutorials (same category, different slug)
        const related = await db
          .select({
            id: tutorials.id,
            title: tutorials.title,
            slug: tutorials.slug,
            difficulty: tutorials.difficulty,
            category: tutorials.category,
            readingTime: tutorials.readingTime,
          })
          .from(tutorials)
          .where(and(
            eq(tutorials.category, tutorial.category),
            eq(tutorials.isPublished, true)
          ))
          .limit(6);

        const relatedFiltered = related.filter(r => r.slug !== tutorial.slug).slice(0, 4);

        return { tutorial, related: relatedFiltered };
      }),

    // Get all categories (for filter UI)
    getCategories: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];

      const results = await db
        .select({ category: tutorials.category, count: sql<number>`count(*)` })
        .from(tutorials)
        .where(eq(tutorials.isPublished, true))
        .groupBy(tutorials.category);

      return results;
    }),
  }),

  // Certification & Progression System
  certification: router({
    // Get user's current certification level and progress toward next
    getMyProgress: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;

      // Get earned certifications
      const earned = await db
        .select()
        .from(certificationLevels)
        .where(eq(certificationLevels.userId, ctx.user.id));

      // Get completed lessons count per module
      const progress = await db
        .select({
          moduleId: userProgress.moduleId,
          completed: sql<number>`COUNT(*)`,
        })
        .from(userProgress)
        .where(and(eq(userProgress.userId, ctx.user.id), eq(userProgress.completed, true)))
        .groupBy(userProgress.moduleId);

      // Get scenario completions (from quiz_attempts on scenario-linked content)
      const quizResults = await db
        .select()
        .from(quizAttempts)
        .where(eq(quizAttempts.userId, ctx.user.id));

      // Calculate level requirements
      // Apprentice: Complete PLC Module 1-2 + VFD Module 1 + all Beginner scenarios
      // Journeyman: Complete PLC Module 3-4 + VFD Module 2-3 + all Intermediate scenarios
      // Specialist: Complete PLC Module 5 + VFD Module 4-5 + all Advanced scenarios
      // Master: All Master scenarios with 90%+ score + timed assessment

      const levelOrder = ["apprentice", "journeyman", "specialist", "master"] as const;
      const currentLevel = earned.length > 0
        ? levelOrder[Math.max(...earned.map(e => levelOrder.indexOf(e.level as any)))]
        : null;

      return {
        currentLevel,
        earnedCertifications: earned,
        moduleProgress: progress,
        quizResults: quizResults.length,
      };
    }),

    // Claim a certification level
    claimLevel: protectedProcedure
      .input(z.object({
        level: z.enum(["apprentice", "journeyman", "specialist", "master"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Check if already earned
        const existing = await db
          .select()
          .from(certificationLevels)
          .where(and(
            eq(certificationLevels.userId, ctx.user.id),
            eq(certificationLevels.level, input.level as any)
          ));

        if (existing.length > 0) {
          return { success: false, message: "Already earned this certification" };
        }

        // Verify requirements based on level
        const progress = await db
          .select({
            moduleId: userProgress.moduleId,
            completed: sql<number>`COUNT(*)`,
          })
          .from(userProgress)
          .where(and(eq(userProgress.userId, ctx.user.id), eq(userProgress.completed, true)))
          .groupBy(userProgress.moduleId);

        const completedModuleCount = progress.length;

        // Scenario completions — count distinct scenario slugs
        const scenarioRows = await db
          .select({ slug: scenarioCompletions.scenarioSlug })
          .from(scenarioCompletions)
          .where(eq(scenarioCompletions.userId, ctx.user.id));
        const passedScenarios = new Set(scenarioRows.map((r) => r.slug)).size;

        // Module quiz passes
        const quizPasses = await db
          .select({ count: sql<number>`COUNT(DISTINCT moduleId)` })
          .from(quizAttempts)
          .where(and(
            eq(quizAttempts.userId, ctx.user.id),
            eq(quizAttempts.passed, true)
          ));
        const passedQuizzes = quizPasses[0]?.count || 0;

        const req = CERTIFICATION_REQUIREMENTS[input.level];
        const failMessage = formatRequirementMessage(input.level, {
          modules: completedModuleCount,
          scenarios: passedScenarios,
          quizzes: passedQuizzes,
        });
        if (failMessage) {
          return { success: false, message: failMessage };
        }

        // Check prerequisite levels
        const levelOrder = ["apprentice", "journeyman", "specialist", "master"];
        const targetIdx = levelOrder.indexOf(input.level);
        if (targetIdx > 0) {
          const prerequisite = levelOrder[targetIdx - 1];
          const hasPrereq = await db
            .select()
            .from(certificationLevels)
            .where(and(
              eq(certificationLevels.userId, ctx.user.id),
              eq(certificationLevels.level, prerequisite as any)
            ));
          if (hasPrereq.length === 0) {
            return { success: false, message: `Must earn ${prerequisite} certification first` };
          }
        }

        const verificationCode = nanoid(16);

        await db.insert(certificationLevels).values({
          userId: ctx.user.id,
          level: input.level,
          verificationCode,
        });

        return { success: true, verificationCode };
      }),

    // Public verification endpoint
    verify: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;

        const results = await db
          .select({
            level: certificationLevels.level,
            earnedAt: certificationLevels.earnedAt,
            userName: users.name,
          })
          .from(certificationLevels)
          .innerJoin(users, eq(users.id, certificationLevels.userId))
          .where(eq(certificationLevels.verificationCode, input.code));

        if (results.length === 0) return null;
        return results[0];
      }),

    // Module Mastery: check if user has completed all ILU stages for a module
    getModuleMastery: protectedProcedure
      .input(z.object({ moduleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return null;

        // 1. Get module info
        const [mod] = await db.select().from(courseModules).where(eq(courseModules.id, input.moduleId));
        if (!mod) return null;

        // 2. Get total lessons and completed lessons
        const allLessons = await db.select({
          id: courseLessons.id,
          linkedScenarioId: courseLessons.linkedScenarioId,
          linkedScenarioSlug: courseLessons.linkedScenarioSlug,
        })
          .from(courseLessons)
          .where(eq(courseLessons.moduleId, input.moduleId));
        const totalLessons = allLessons.length;

        const completedLessons = await db.select()
          .from(userProgress)
          .where(and(
            eq(userProgress.userId, ctx.user.id),
            eq(userProgress.moduleId, input.moduleId),
            eq(userProgress.completed, true)
          ));
        const lessonsComplete = completedLessons.length >= totalLessons && totalLessons > 0;

        // 3. Check quiz passed
        const quizPassed = await db.select()
          .from(quizAttempts)
          .where(and(
            eq(quizAttempts.userId, ctx.user.id),
            eq(quizAttempts.moduleId, input.moduleId),
            eq(quizAttempts.passed, true)
          ))
          .limit(1);
        const quizComplete = quizPassed.length > 0;

        // 4. Check scenario completion by simulator slug (not DB title)
        const requiredSlugs = new Set<string>();
        for (const lesson of allLessons) {
          const simId = resolveSimulatorScenarioId(
            lesson.linkedScenarioSlug,
            lesson.linkedScenarioId,
          );
          if (simId) requiredSlugs.add(simId);
        }

        let scenarioComplete = requiredSlugs.size === 0;
        const scenarioRequired = requiredSlugs.size;
        if (requiredSlugs.size > 0) {
          const completions = await db
            .select({ scenarioSlug: scenarioCompletions.scenarioSlug })
            .from(scenarioCompletions)
            .where(eq(scenarioCompletions.userId, ctx.user.id));
          const completedSlugs = new Set(completions.map((c) => c.scenarioSlug));
          scenarioComplete = Array.from(requiredSlugs).every((s) => completedSlugs.has(s));
        }

        const mastered = lessonsComplete && quizComplete && scenarioComplete;

        return {
          moduleId: input.moduleId,
          moduleTitle: mod.title,
          mastered,
          stages: {
            theory: { complete: lessonsComplete, completed: completedLessons.length, total: totalLessons },
            quiz: { complete: quizComplete },
            scenario: { complete: scenarioComplete, required: scenarioRequired },
          },
        };
      }),

    // Get mastery status for all modules at once
    getAllModuleMastery: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const allModules = await db.select().from(courseModules).where(eq(courseModules.isPublished, true));
      const allLessons = await db.select({ id: courseLessons.id, moduleId: courseLessons.moduleId, linkedScenarioId: courseLessons.linkedScenarioId }).from(courseLessons);
      const completedProgress = await db.select().from(userProgress)
        .where(and(eq(userProgress.userId, ctx.user.id), eq(userProgress.completed, true)));
      const passedQuizzes = await db.select({ moduleId: quizAttempts.moduleId }).from(quizAttempts)
        .where(and(eq(quizAttempts.userId, ctx.user.id), eq(quizAttempts.passed, true)));
      const allCompletions = await db.select({ scenarioTitle: scenarioCompletions.scenarioTitle }).from(scenarioCompletions)
        .where(eq(scenarioCompletions.userId, ctx.user.id));

      const completedTitles = new Set(allCompletions.map(c => c.scenarioTitle));
      const passedModuleIds = new Set(passedQuizzes.map(q => q.moduleId));

      // Get all scenario titles for linked scenarios
      const allScenarioIds = Array.from(new Set(allLessons.map(l => l.linkedScenarioId).filter((id): id is number => id !== null && id !== undefined)));
      let scenarioIdToTitle: Record<number, string> = {};
      if (allScenarioIds.length > 0) {
        const scenarioRows = await db.select({ id: scenarios.id, title: scenarios.title }).from(scenarios)
          .where(inArray(scenarios.id, allScenarioIds));
        scenarioIdToTitle = Object.fromEntries(scenarioRows.map(s => [s.id, s.title]));
      }

      return allModules.map(mod => {
        const moduleLessons = allLessons.filter(l => l.moduleId === mod.id);
        const totalLessons = moduleLessons.length;
        const completedCount = completedProgress.filter(p => p.moduleId === mod.id).length;
        const lessonsComplete = completedCount >= totalLessons && totalLessons > 0;
        const quizComplete = passedModuleIds.has(mod.id);

        const linkedScenarioIds = Array.from(new Set(moduleLessons.map(l => l.linkedScenarioId).filter((id): id is number => id !== null && id !== undefined)));
        const linkedTitles = linkedScenarioIds.map(id => scenarioIdToTitle[id]).filter(Boolean);
        const scenarioComplete = linkedTitles.length === 0 || linkedTitles.every(t => completedTitles.has(t));

        return {
          moduleId: mod.id,
          moduleTitle: mod.title,
          mastered: lessonsComplete && quizComplete && scenarioComplete,
          stages: {
            theory: { complete: lessonsComplete, completed: completedCount, total: totalLessons },
            quiz: { complete: quizComplete },
            scenario: { complete: scenarioComplete, required: linkedTitles.length },
          },
        };
      });
    }),
  }),

  // Resources / Lead Magnets
  resources: router({
    requestDownload: publicProcedure
      .input(z.object({
        resourceId: z.string(),
        email: z.string().email(),
        name: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Store the lead in the database
        const db = await getDb();
        if (db) {
          // We'll use contact_submissions table to track leads
          await db.insert(contactSubmissions).values({
            name: input.name || "Resource Download",
            email: input.email,
            company: "",
            inquiryType: "resource_download",
            message: `Downloaded: ${input.resourceId}`,
            status: "new",
          });
        }

        // Map resource IDs to download URLs
        // In production these would be actual PDF URLs from S3
        const downloadUrls: Record<string, string> = {
          "troubleshooting-cheat-sheet": "/resources/troubleshooting-cheat-sheet.pdf",
          "powerflex-parameter-reference": "/resources/powerflex-parameter-reference.pdf",
          "plc-troubleshooting-flowchart": "/resources/plc-troubleshooting-flowchart.pdf",
        };

        const downloadUrl = downloadUrls[input.resourceId];
        if (!downloadUrl) {
          throw new Error("Resource not found");
        }

        return { success: true, downloadUrl };
      }),
  }),

  digest: router({
    /** Generate weekly digest data (admin only) */
    getWeeklyDigest: adminProcedure
      .query(async () => {
        const { generateWeeklyDigest } = await import("./weeklyDigest");
        const data = await generateWeeklyDigest();
        return data;
      }),

    /** Send weekly digest notification to owner (admin only) */
    sendWeeklyDigest: adminProcedure
      .mutation(async () => {
        const { sendWeeklyDigest } = await import("./weeklyDigest");
        const result = await sendWeeklyDigest();
        return result;
      }),
  }),

  leaderboard: router({
    /** Get top learners ranked by XP (lessons completed + quiz scores + scenarios) */
    getLeaderboard: publicProcedure
      .input(z.object({
        limit: z.number().min(5).max(50).default(20),
        period: z.enum(["all", "week", "month"]).default("all"),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { entries: [] };
        const limit = input?.limit ?? 20;
        const period = input?.period ?? "all";

        // Build date filter for period
        let dateFilter = "";
        if (period === "week") {
          dateFilter = "AND up.completedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        } else if (period === "month") {
          dateFilter = "AND up.completedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        }

        // Calculate XP: 50 pts/lesson + quiz bonus (score * 2) + 25 pts/scenario
        const rawResults = await db.execute(sql.raw(`
          SELECT
            u.id AS userId,
            u.name AS userName,
            u.subscriptionTier,
            COALESCE(lp.lessons_completed, 0) AS lessonsCompleted,
            COALESCE(qa.quiz_points, 0) AS quizPoints,
            COALESCE(qa.quizzes_passed, 0) AS quizzesPassed,
            COALESCE(sc.scenarios_completed, 0) AS scenariosCompleted,
            COALESCE(cl.cert_level, 'none') AS certLevel,
            (COALESCE(lp.lessons_completed, 0) * 50 + COALESCE(qa.quiz_points, 0) * 2 + COALESCE(sc.scenarios_completed, 0) * 25) AS totalXP
          FROM users u
          LEFT JOIN (
            SELECT userId, COUNT(*) AS lessons_completed
            FROM user_progress up
            WHERE up.completed = 1 ${dateFilter}
            GROUP BY userId
          ) lp ON lp.userId = u.id
          LEFT JOIN (
            SELECT userId, SUM(score) AS quiz_points, SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) AS quizzes_passed
            FROM quiz_attempts
            ${period !== "all" ? `WHERE completedAt >= DATE_SUB(NOW(), INTERVAL ${period === "week" ? 7 : 30} DAY)` : ""}
            GROUP BY userId
          ) qa ON qa.userId = u.id
          LEFT JOIN (
            SELECT userId, COUNT(*) AS scenarios_completed
            FROM scenario_completions
            GROUP BY userId
          ) sc ON sc.userId = u.id
          LEFT JOIN (
            SELECT userId, MAX(level) AS cert_level
            FROM certification_levels
            GROUP BY userId
          ) cl ON cl.userId = u.id
          WHERE (COALESCE(lp.lessons_completed, 0) + COALESCE(qa.quiz_points, 0) + COALESCE(sc.scenarios_completed, 0)) > 0
          ORDER BY totalXP DESC
          LIMIT ${limit}
        `));

        const entries = (rawResults as any)[0]?.map((row: any, idx: number) => ({
          rank: idx + 1,
          userId: row.userId,
          userName: row.userName || "Anonymous Learner",
          subscriptionTier: row.subscriptionTier || "free",
          lessonsCompleted: Number(row.lessonsCompleted),
          quizzesPassed: Number(row.quizzesPassed),
          quizPoints: Number(row.quizPoints),
          certLevel: row.certLevel || "none",
          totalXP: Number(row.totalXP),
        })) || [];

        return { entries };
      }),

    /** Get the current user's stats and rank position */
    getMyStats: protectedProcedure
      .input(z.object({
        period: z.enum(["all", "week", "month"]).default("all"),
      }).optional())
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return null;
        const period = input?.period ?? "all";

        let dateFilterProgress = "";
        let dateFilterQuiz = "";
        if (period === "week") {
          dateFilterProgress = "AND up.completedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
          dateFilterQuiz = "AND completedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        } else if (period === "month") {
          dateFilterProgress = "AND up.completedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
          dateFilterQuiz = "AND completedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        }

        // Get user's own stats
        const [lessonsResult] = await db.execute(sql.raw(`
          SELECT COUNT(*) AS cnt FROM user_progress up
          WHERE up.userId = ${ctx.user.id} AND up.completed = 1 ${dateFilterProgress}
        `)) as any;
        const lessonsCompleted = Number(lessonsResult?.[0]?.cnt || 0);

        const [quizResult] = await db.execute(sql.raw(`
          SELECT COALESCE(SUM(score), 0) AS pts, SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) AS passed
          FROM quiz_attempts
          WHERE userId = ${ctx.user.id} ${dateFilterQuiz}
        `)) as any;
        const quizPoints = Number(quizResult?.[0]?.pts || 0);
        const quizzesPassed = Number(quizResult?.[0]?.passed || 0);

        // Count scenario completions
        const [scenarioResult] = await db.execute(sql.raw(`
          SELECT COUNT(*) AS cnt FROM scenario_completions
          WHERE userId = ${ctx.user.id}
        `)) as any;
        const scenariosCompleted = Number(scenarioResult?.[0]?.cnt || 0);

        const totalXP = lessonsCompleted * 50 + quizPoints * 2 + scenariosCompleted * 25;

        // Get rank (how many users have more XP)
        const [rankResult] = await db.execute(sql.raw(`
          SELECT COUNT(*) AS ahead FROM (
            SELECT
              u.id,
              (COALESCE(lp.lc, 0) * 50 + COALESCE(qa.qp, 0) * 2 + COALESCE(sc.sc, 0) * 25) AS xp
            FROM users u
            LEFT JOIN (
              SELECT userId, COUNT(*) AS lc FROM user_progress up
              WHERE up.completed = 1 ${dateFilterProgress}
              GROUP BY userId
            ) lp ON lp.userId = u.id
            LEFT JOIN (
              SELECT userId, SUM(score) AS qp FROM quiz_attempts
              ${dateFilterQuiz ? `WHERE 1=1 ${dateFilterQuiz}` : ""}
              GROUP BY userId
            ) qa ON qa.userId = u.id
            LEFT JOIN (
              SELECT userId, COUNT(*) AS sc FROM scenario_completions
              GROUP BY userId
            ) sc ON sc.userId = u.id
            HAVING xp > ${totalXP}
          ) ranked
        `)) as any;
        const rank = Number(rankResult?.[0]?.ahead || 0) + 1;

        // Get total active learners — count any user with XP activity (lessons, quizzes, or scenarios)
        // Note: dateFilterProgress uses "up.completedAt" alias, so we replace it for the subquery context
        const dateFilterProgressNoAlias = dateFilterProgress.replace(/up\./g, "");
        const [totalResult] = await db.execute(sql.raw(`
          SELECT COUNT(*) AS cnt FROM (
            SELECT u.id FROM users u
            LEFT JOIN (SELECT userId, COUNT(*) AS lc FROM user_progress WHERE completed = 1 ${dateFilterProgressNoAlias} GROUP BY userId) lp ON lp.userId = u.id
            LEFT JOIN (SELECT userId, SUM(score) AS qp FROM quiz_attempts ${dateFilterQuiz ? `WHERE 1=1 ${dateFilterQuiz}` : ""} GROUP BY userId) qa ON qa.userId = u.id
            LEFT JOIN (SELECT userId, COUNT(*) AS sc FROM scenario_completions GROUP BY userId) sc ON sc.userId = u.id
            WHERE (COALESCE(lp.lc, 0) + COALESCE(qa.qp, 0) + COALESCE(sc.sc, 0)) > 0
          ) active_users
        `)) as any;
        // Ensure totalLearners is always at least equal to rank (prevents "Rank #2 of 1")
        const rawTotal = Math.max(1, Number(totalResult?.[0]?.cnt || 0));
        const totalLearners = Math.max(rawTotal, rank);

        // Get cert level
        const certRows = await db.select().from(certificationLevels)
          .where(eq(certificationLevels.userId, ctx.user.id))
          .orderBy(desc(certificationLevels.earnedAt))
          .limit(1);
        const certLevel = certRows.length > 0 ? certRows[0].level : "none";

        return {
          rank,
          totalLearners,
          lessonsCompleted,
          quizzesPassed,
          quizPoints,
          scenariosCompleted,
          totalXP,
          certLevel,
        };
      }),
  }),

  bookmarks: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const results = await db
        .select({
          id: bookmarks.id,
          lessonId: bookmarks.lessonId,
          createdAt: bookmarks.createdAt,
          lessonTitle: courseLessons.title,
          lessonSlug: courseLessons.slug,
          moduleId: courseLessons.moduleId,
          moduleTitle: courseModules.title,
          moduleSlug: courseModules.slug,
        })
        .from(bookmarks)
        .innerJoin(courseLessons, eq(bookmarks.lessonId, courseLessons.id))
        .innerJoin(courseModules, eq(courseLessons.moduleId, courseModules.id))
        .where(eq(bookmarks.userId, ctx.user.id))
        .orderBy(desc(bookmarks.createdAt));
      return results;
    }),

    toggle: protectedProcedure
      .input(z.object({ lessonId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const existing = await db
          .select()
          .from(bookmarks)
          .where(and(eq(bookmarks.userId, ctx.user.id), eq(bookmarks.lessonId, input.lessonId)))
          .limit(1);
        if (existing.length > 0) {
          await db.delete(bookmarks).where(eq(bookmarks.id, existing[0].id));
          return { bookmarked: false };
        } else {
          await db.insert(bookmarks).values({ userId: ctx.user.id, lessonId: input.lessonId });
          return { bookmarked: true };
        }
      }),

    isBookmarked: protectedProcedure
      .input(z.object({ lessonId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { bookmarked: false };
        const existing = await db
          .select()
          .from(bookmarks)
          .where(and(eq(bookmarks.userId, ctx.user.id), eq(bookmarks.lessonId, input.lessonId)))
          .limit(1);
        return { bookmarked: existing.length > 0 };
      }),
  }),

  scenarioProgression: router({
    recordCompletion: protectedProcedure
      .input(z.object({
        scenarioSlug: z.string(),
        scenarioTitle: z.string(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]),
        score: z.number(),
        maxScore: z.number(),
        timeSeconds: z.number(),
        hintsUsed: z.number().default(0),
        // Methodology scoring fields (optional for backward compat)
        methodologyScore: z.number().optional(),
        methodologyGrade: z.string().optional(),
        playMode: z.string().optional(),
        faultVariant: z.string().optional(),
        difficultyModifier: z.string().optional(),
        methodologyDimensions: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.insert(scenarioCompletions).values({
          userId: ctx.user.id,
          scenarioSlug: input.scenarioSlug,
          scenarioTitle: input.scenarioTitle,
          difficulty: input.difficulty,
          score: input.score,
          maxScore: input.maxScore,
          timeSeconds: input.timeSeconds,
          hintsUsed: input.hintsUsed,
          methodologyScore: input.methodologyScore ?? null,
          methodologyGrade: input.methodologyGrade ?? null,
          playMode: input.playMode ?? null,
          faultVariant: input.faultVariant ?? null,
          difficultyModifier: input.difficultyModifier ?? null,
          methodologyDimensions: input.methodologyDimensions ?? null,
        });

        const pct = input.maxScore > 0 ? Math.round((input.score / input.maxScore) * 100) : 0;
        const toolScore = input.methodologyDimensions &&
          typeof input.methodologyDimensions === "object" &&
          "toolSelection" in (input.methodologyDimensions as object)
          ? Number((input.methodologyDimensions as Record<string, number>).toolSelection) || undefined
          : undefined;

        await recordFaultCompetencyAttempt(db, {
          userId: ctx.user.id,
          scenarioSlug: input.scenarioSlug,
          playMode: input.playMode,
          score: input.score,
          maxScore: input.maxScore,
          percentage: pct,
          timeSeconds: input.timeSeconds,
          methodologyScore: input.methodologyScore,
          safetyScore: input.methodologyDimensions &&
            typeof input.methodologyDimensions === "object" &&
            "unsafeActions" in (input.methodologyDimensions as object)
            ? ((input.methodologyDimensions as Record<string, number>).unsafeActions === 0 ? 100 : 0)
            : 100,
          toolSelectionScore: toolScore,
          hintsUsed: input.hintsUsed,
          methodologyDimensions: input.methodologyDimensions,
        }).catch(() => undefined);

        return { success: true };
      }),

    getHistory: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const results = await db
        .select()
        .from(scenarioCompletions)
        .where(eq(scenarioCompletions.userId, ctx.user.id))
        .orderBy(desc(scenarioCompletions.completedAt));
      return results;
    }),

    getCareerStats: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { totalCompleted: 0, uniqueScenarios: 0, totalAttempts: 0, averageScore: 0, bestScore: 0, totalTimeSeconds: 0, averageTimeSeconds: 0, hintsUsed: 0, achievements: [], difficultyBreakdown: { beginner: 0, intermediate: 0, advanced: 0 }, recentCompletions: [], masteryLevel: "apprentice" as const };

      const completions = await db
        .select()
        .from(scenarioCompletions)
        .where(eq(scenarioCompletions.userId, ctx.user.id))
        .orderBy(desc(scenarioCompletions.completedAt));

      if (completions.length === 0) {
        return { totalCompleted: 0, uniqueScenarios: 0, totalAttempts: 0, averageScore: 0, bestScore: 0, totalTimeSeconds: 0, averageTimeSeconds: 0, hintsUsed: 0, achievements: [], difficultyBreakdown: { beginner: 0, intermediate: 0, advanced: 0 }, recentCompletions: [], masteryLevel: "apprentice" as const };
      }

      const uniqueSlugs = new Set(completions.map(c => c.scenarioSlug));
      const totalScore = completions.reduce((sum, c) => sum + Math.round((c.score / c.maxScore) * 100), 0);
      const bestScore = Math.max(...completions.map(c => Math.round((c.score / c.maxScore) * 100)));
      const totalTime = completions.reduce((sum, c) => sum + c.timeSeconds, 0);
      const totalHints = completions.reduce((sum, c) => sum + c.hintsUsed, 0);

      const difficultyBreakdown = {
        beginner: new Set(completions.filter(c => c.difficulty === "beginner").map(c => c.scenarioSlug)).size,
        intermediate: new Set(completions.filter(c => c.difficulty === "intermediate").map(c => c.scenarioSlug)).size,
        advanced: new Set(completions.filter(c => c.difficulty === "advanced").map(c => c.scenarioSlug)).size,
      };

      // Compute achievements
      const achievements: { id: string; title: string; description: string; earned: boolean }[] = [
        { id: "first_fix", title: "First Fix", description: "Complete your first scenario", earned: completions.length >= 1 },
        { id: "quick_draw", title: "Quick Draw", description: "Complete a scenario in under 5 minutes", earned: completions.some(c => c.timeSeconds < 300) },
        { id: "perfect_score", title: "Perfect Score", description: "Score 100% on any scenario", earned: completions.some(c => c.score === c.maxScore) },
        { id: "no_hints", title: "Self Reliant", description: "Complete a scenario without using hints", earned: completions.some(c => c.hintsUsed === 0) },
        { id: "five_complete", title: "Dedicated Tech", description: "Complete 5 different scenarios", earned: uniqueSlugs.size >= 5 },
        { id: "all_beginner", title: "Foundation Builder", description: "Complete all beginner scenarios", earned: difficultyBreakdown.beginner >= 2 },
        { id: "intermediate_ready", title: "Rising Specialist", description: "Complete all intermediate scenarios", earned: difficultyBreakdown.intermediate >= 4 },
        { id: "advanced_master", title: "Master Troubleshooter", description: "Complete all advanced scenarios", earned: difficultyBreakdown.advanced >= 2 },
        { id: "speed_demon", title: "Speed Demon", description: "Average completion time under 8 minutes", earned: completions.length > 0 && (totalTime / completions.length) < 480 },
        { id: "consistency", title: "Consistent Performer", description: "Score above 70% on 10 consecutive attempts", earned: completions.length >= 10 && completions.slice(0, 10).every(c => Math.round((c.score / c.maxScore) * 100) >= 70) },
      ];

      // Determine mastery level
      let masteryLevel: "apprentice" | "journeyman" | "specialist" | "master" = "apprentice";
      if (difficultyBreakdown.advanced >= 2 && bestScore >= 90) masteryLevel = "master";
      else if (difficultyBreakdown.intermediate >= 3 && bestScore >= 80) masteryLevel = "specialist";
      else if (difficultyBreakdown.beginner >= 2 && uniqueSlugs.size >= 3) masteryLevel = "journeyman";

      return {
        totalCompleted: completions.length,
        uniqueScenarios: uniqueSlugs.size,
        totalAttempts: completions.length,
        averageScore: Math.round(totalScore / completions.length),
        bestScore,
        totalTimeSeconds: totalTime,
        averageTimeSeconds: Math.round(totalTime / completions.length),
        hintsUsed: totalHints,
        achievements,
        difficultyBreakdown,
        recentCompletions: completions.slice(0, 5).map(c => ({
          scenarioTitle: c.scenarioTitle,
          score: Math.round((c.score / c.maxScore) * 100),
          difficulty: c.difficulty,
          timeSeconds: c.timeSeconds,
          completedAt: c.completedAt,
        })),
        masteryLevel,
      };
    }),

    getRecommendation: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { recommended: null, reason: "" };

      // Get user's completed scenarios
      const completions = await db
        .select()
        .from(scenarioCompletions)
        .where(eq(scenarioCompletions.userId, ctx.user.id))
        .orderBy(desc(scenarioCompletions.completedAt));

      // Define the scenario progression path
      const progressionPath = [
        { slug: "blown-fuse", title: "Blown Control Fuse", difficulty: "beginner" as const },
        { slug: "failed-relay", title: "Failed Control Relay", difficulty: "beginner" as const },
        { slug: "vfd-overcurrent", title: "VFD Overcurrent Fault", difficulty: "intermediate" as const },
        { slug: "vfd-undervoltage", title: "VFD Undervoltage Fault", difficulty: "intermediate" as const },
        { slug: "vfd-ground-fault", title: "VFD Ground Fault", difficulty: "intermediate" as const },
        { slug: "vfd-cooling-fan", title: "VFD Cooling Fan Failure", difficulty: "intermediate" as const },
        { slug: "vfd-phase-loss", title: "VFD Input Phase Loss", difficulty: "advanced" as const },
        { slug: "multi-fault", title: "Multi-Fault Scenario", difficulty: "advanced" as const },
      ];

      const completedSlugs = new Set(completions.map(c => c.scenarioSlug));

      // Find the next uncompleted scenario in the path
      const nextScenario = progressionPath.find(s => !completedSlugs.has(s.slug));

      if (!nextScenario) {
        // All completed — suggest replaying the hardest for a better score
        const lastAdvanced = completions.find(c => c.difficulty === "advanced");
        if (lastAdvanced && lastAdvanced.score < lastAdvanced.maxScore * 0.9) {
          return {
            recommended: { slug: lastAdvanced.scenarioSlug, title: lastAdvanced.scenarioTitle, difficulty: lastAdvanced.difficulty },
            reason: "Try to improve your score on this advanced scenario — aim for 90%+!",
          };
        }
        return {
          recommended: null,
          reason: "You've completed all scenarios! New ones are added monthly.",
        };
      }

      // Generate a reason based on what they've done
      let reason = "";
      if (completions.length === 0) {
        reason = "Start here — this beginner scenario teaches fundamental troubleshooting methodology.";
      } else {
        const lastCompletion = completions[0];
        const lastPct = Math.round((lastCompletion.score / lastCompletion.maxScore) * 100);
        if (lastPct >= 80) {
          reason = `Great score on ${lastCompletion.scenarioTitle} (${lastPct}%)! You're ready for the next challenge.`;
        } else {
          reason = `Good attempt on ${lastCompletion.scenarioTitle} (${lastPct}%). This next scenario builds on similar skills.`;
        }
      }

      return {
        recommended: nextScenario,
        reason,
      };
    }),

    getMethodologyProgress: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { completions: [], averageDimensions: null, trend: [], totalAttempts: 0 };

      const results = await db
        .select({
          id: scenarioCompletions.id,
          scenarioTitle: scenarioCompletions.scenarioTitle,
          scenarioSlug: scenarioCompletions.scenarioSlug,
          difficulty: scenarioCompletions.difficulty,
          score: scenarioCompletions.score,
          maxScore: scenarioCompletions.maxScore,
          timeSeconds: scenarioCompletions.timeSeconds,
          hintsUsed: scenarioCompletions.hintsUsed,
          completedAt: scenarioCompletions.completedAt,
          methodologyScore: scenarioCompletions.methodologyScore,
          methodologyGrade: scenarioCompletions.methodologyGrade,
          playMode: scenarioCompletions.playMode,
          faultVariant: scenarioCompletions.faultVariant,
          difficultyModifier: scenarioCompletions.difficultyModifier,
          methodologyDimensions: scenarioCompletions.methodologyDimensions,
        })
        .from(scenarioCompletions)
        .where(eq(scenarioCompletions.userId, ctx.user.id))
        .orderBy(desc(scenarioCompletions.completedAt))
        .limit(100);

      // Calculate average dimensions across all completions that have methodology data
      const withMethodology = results.filter(r => r.methodologyDimensions && r.methodologyScore);
      
      let averageDimensions: Record<string, { avg: number; count: number; best: number }> | null = null;
      if (withMethodology.length > 0) {
        const dimAccum: Record<string, { sum: number; count: number; best: number }> = {};
        for (const comp of withMethodology) {
          const dims = comp.methodologyDimensions as any[];
          if (!Array.isArray(dims)) continue;
          for (const dim of dims) {
            if (!dimAccum[dim.id]) dimAccum[dim.id] = { sum: 0, count: 0, best: 0 };
            dimAccum[dim.id].sum += dim.percentage;
            dimAccum[dim.id].count += 1;
            dimAccum[dim.id].best = Math.max(dimAccum[dim.id].best, dim.percentage);
          }
        }
        averageDimensions = {};
        for (const [id, data] of Object.entries(dimAccum)) {
          averageDimensions[id] = { avg: Math.round(data.sum / data.count), count: data.count, best: data.best };
        }
      }

      // Build trend data (last 20 completions with methodology, oldest first)
      const trend = withMethodology.slice(0, 20).reverse().map(c => ({
        date: c.completedAt,
        scenarioTitle: c.scenarioTitle,
        methodologyScore: c.methodologyScore,
        playMode: c.playMode,
        dimensions: c.methodologyDimensions as any[],
      }));

      return {
        completions: results.map(r => ({
          id: r.id,
          scenarioTitle: r.scenarioTitle,
          scenarioSlug: r.scenarioSlug,
          difficulty: r.difficulty,
          score: r.score,
          maxScore: r.maxScore,
          percentage: Math.round((r.score / Math.max(r.maxScore, 1)) * 100),
          timeSeconds: r.timeSeconds,
          hintsUsed: r.hintsUsed,
          completedAt: r.completedAt,
          methodologyScore: r.methodologyScore,
          methodologyGrade: r.methodologyGrade,
          playMode: r.playMode,
          faultVariant: r.faultVariant,
          difficultyModifier: r.difficultyModifier,
        })),
        averageDimensions,
        trend,
        totalAttempts: results.length,
      };
    }),
  }),

  // ─── Error Logging ───────────────────────────────────────────────────────
  errorLogging: router({
    /** Public procedure to log client-side errors (rate-limited by truncation) */
    logClientError: publicProcedure
      .input(z.object({
        errorMessage: z.string().max(2000),
        errorStack: z.string().max(5000).optional(),
        componentName: z.string().max(255).optional(),
        url: z.string().max(2048).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { success: false };
        const userId = ctx.user?.id ?? null;
        const userAgent = (ctx.req.headers["user-agent"] || "").slice(0, 512);
        await db.insert(clientErrors).values({
          userId,
          errorMessage: input.errorMessage,
          errorStack: input.errorStack || null,
          componentName: input.componentName || null,
          url: input.url || null,
          userAgent,
        });

        // Error rate spike detection: check if >10 errors in the last 15 minutes
        // Use in-memory throttle to avoid spamming notifications
        try {
          const ERROR_ALERT_THRESHOLD = 10;
          const ERROR_ALERT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
          const now = Date.now();
          if (now - _lastErrorAlertSentAt > ERROR_ALERT_WINDOW_MS) {
            const cutoff = new Date(now - ERROR_ALERT_WINDOW_MS);
            const recentErrors = await db.select({ count: sql<number>`count(*)` })
              .from(clientErrors)
              .where(gte(clientErrors.createdAt, cutoff));
            const errorCount = recentErrors[0]?.count ?? 0;
            if (errorCount >= ERROR_ALERT_THRESHOLD) {
              _lastErrorAlertSentAt = now;
              // Fire-and-forget notification
              notifyOwner({
                title: `\u26a0\ufe0f Error Spike: ${errorCount} client errors in 15 min`,
                content: `${errorCount} client-side errors detected in the last 15 minutes.\n\nLatest error:\n- Message: ${input.errorMessage.slice(0, 200)}\n- Component: ${input.componentName || "unknown"}\n- URL: ${input.url || "unknown"}\n\nCheck the Error Logs tab in the admin dashboard for details.`,
              }).catch(() => {});
            }
          }
        } catch (alertErr) {
          console.warn("[ErrorAlert] Failed to check error rate:", alertErr);
        }

        return { success: true };
      }),

    /** Admin-only: error frequency by day for the past 7 days */
    getErrorFrequency: adminProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) return [];
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const rows = await db.select({
          day: sql<string>`DATE(created_at)`.as("day"),
          count: sql<number>`COUNT(*)`.as("count"),
        })
          .from(clientErrors)
          .where(gte(clientErrors.createdAt, sevenDaysAgo))
          .groupBy(sql`DATE(created_at)`)
          .orderBy(sql`DATE(created_at)`);
        // Fill in missing days with 0
        const result: { day: string; count: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          const dayStr = d.toISOString().split("T")[0];
          const found = rows.find((r) => r.day === dayStr);
          result.push({ day: dayStr, count: found ? Number(found.count) : 0 });
        }
        return result;
      }),

    /** Admin-only: list recent client errors */
    getRecentErrors: adminProcedure
      .input(z.object({
        limit: z.number().min(1).max(200).default(50),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const limit = input?.limit ?? 50;
        const rows = await db.select({
          id: clientErrors.id,
          userId: clientErrors.userId,
          errorMessage: clientErrors.errorMessage,
          errorStack: clientErrors.errorStack,
          componentName: clientErrors.componentName,
          url: clientErrors.url,
          userAgent: clientErrors.userAgent,
          createdAt: clientErrors.createdAt,
        })
          .from(clientErrors)
          .orderBy(desc(clientErrors.createdAt))
          .limit(limit);
        return rows;
      }),
  }),

  // ─── Simulator Sessions (Resume) ────────────────────────────────────────────
  simulatorSession: router({
    /** Save or update a simulator session for the current user + scenario */
    save: protectedProcedure
      .input(z.object({
        scenarioId: z.string().max(100),
        playMode: z.string().max(30),
        difficulty: z.string().max(30),
        phase: z.string().max(30),
        gameState: z.any(),
        currentScore: z.number().int().default(0),
        actionCount: z.number().int().default(0),
        elapsedSeconds: z.number().int().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { success: false };
        const userId = ctx.user!.id;

        // Check if a session already exists for this user + scenario
        const existing = await db.select({ id: simulatorSessions.id })
          .from(simulatorSessions)
          .where(and(
            eq(simulatorSessions.userId, userId),
            eq(simulatorSessions.scenarioId, input.scenarioId)
          ))
          .limit(1);

        if (existing.length > 0) {
          // Update existing session
          await db.update(simulatorSessions).set({
            playMode: input.playMode,
            difficulty: input.difficulty,
            phase: input.phase,
            gameState: input.gameState,
            currentScore: input.currentScore,
            actionCount: input.actionCount,
            elapsedSeconds: input.elapsedSeconds,
          }).where(eq(simulatorSessions.id, existing[0].id));
        } else {
          // Insert new session
          await db.insert(simulatorSessions).values({
            userId,
            scenarioId: input.scenarioId,
            playMode: input.playMode,
            difficulty: input.difficulty,
            phase: input.phase,
            gameState: input.gameState,
            currentScore: input.currentScore,
            actionCount: input.actionCount,
            elapsedSeconds: input.elapsedSeconds,
          });
        }
        return { success: true };
      }),

    /** Get saved session for a scenario */
    get: protectedProcedure
      .input(z.object({
        scenarioId: z.string().max(100),
      }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return null;
        const userId = ctx.user!.id;
        const rows = await db.select()
          .from(simulatorSessions)
          .where(and(
            eq(simulatorSessions.userId, userId),
            eq(simulatorSessions.scenarioId, input.scenarioId)
          ))
          .limit(1);
        return rows[0] || null;
      }),

    /** Clear saved session (on completion or abandon) */
    clear: protectedProcedure
      .input(z.object({
        scenarioId: z.string().max(100),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { success: false };
        const userId = ctx.user!.id;
        await db.delete(simulatorSessions)
          .where(and(
            eq(simulatorSessions.userId, userId),
            eq(simulatorSessions.scenarioId, input.scenarioId)
          ));
        return { success: true };
      }),
  }),

  streaks: router({
    /** Get current user's streak data */
    getMyStreak: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, lastActivityDate: null };

      const [existing] = await db.select().from(userStreaks).where(eq(userStreaks.userId, ctx.user.id)).limit(1);
      if (!existing) {
        return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, lastActivityDate: null };
      }
      return {
        currentStreak: existing.currentStreak,
        longestStreak: existing.longestStreak,
        totalActiveDays: existing.totalActiveDays,
        lastActivityDate: existing.lastActivityDate,
      };
    }),

    /** Record activity for today (call on page load / lesson completion) */
    recordActivity: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { currentStreak: 0, longestStreak: 0 };

      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

      const [existing] = await db.select().from(userStreaks).where(eq(userStreaks.userId, ctx.user.id)).limit(1);

      if (!existing) {
        // First ever activity
        await db.insert(userStreaks).values({
          userId: ctx.user.id,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: now,
          streakStartDate: now,
          totalActiveDays: 1,
        });
        return { currentStreak: 1, longestStreak: 1 };
      }

      const lastDate = existing.lastActivityDate;
      if (!lastDate) {
        // No previous activity recorded
        await db.update(userStreaks).set({
          currentStreak: 1,
          longestStreak: Math.max(existing.longestStreak, 1),
          lastActivityDate: now,
          streakStartDate: now,
          totalActiveDays: existing.totalActiveDays + 1,
          updatedAt: now,
        }).where(eq(userStreaks.id, existing.id));
        return { currentStreak: 1, longestStreak: Math.max(existing.longestStreak, 1) };
      }

      const lastStr = lastDate.toISOString().slice(0, 10);
      if (lastStr === todayStr) {
        // Already recorded today
        return { currentStreak: existing.currentStreak, longestStreak: existing.longestStreak };
      }

      // Check if yesterday
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      let newStreak: number;
      let newStreakStart: Date;
      if (lastStr === yesterdayStr) {
        // Consecutive day
        newStreak = existing.currentStreak + 1;
        newStreakStart = existing.streakStartDate || now;
      } else {
        // Streak broken
        newStreak = 1;
        newStreakStart = now;
      }

      const newLongest = Math.max(existing.longestStreak, newStreak);

      await db.update(userStreaks).set({
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActivityDate: now,
        streakStartDate: newStreakStart,
        totalActiveDays: existing.totalActiveDays + 1,
        updatedAt: now,
      }).where(eq(userStreaks.id, existing.id));

      return { currentStreak: newStreak, longestStreak: newLongest };
    }),
  }),

  // Interactive Labs — scoring and badge tracking
  labs: router({
    // Save a quiz session result
    saveScore: protectedProcedure
      .input(z.object({
        labId: z.string(),
        correctAnswers: z.number().int().min(0),
        totalQuestions: z.number().int().min(1),
        masteredTypes: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const scorePercent = Math.round((input.correctAnswers / input.totalQuestions) * 100);
        
        // Check if badge should be earned (100% on all 9 diode types)
        const allDiodeTypes = ["rectifier", "zener", "schottky", "led", "photodiode", "tvs", "fast_recovery", "bridge", "flyback"];
        const masteredTypes = input.masteredTypes || [];
        const badgeEarned = allDiodeTypes.every(t => masteredTypes.includes(t));
        
        await db.insert(labScores).values({
          userId: ctx.user.id,
          labId: input.labId,
          correctAnswers: input.correctAnswers,
          totalQuestions: input.totalQuestions,
          scorePercent,
          masteredTypes: masteredTypes,
          badgeEarned,
          badgeEarnedAt: badgeEarned ? new Date() : null,
        });
        
        return { scorePercent, badgeEarned };
      }),

    // Get user's best scores and badge status for a lab
    getMyScores: protectedProcedure
      .input(z.object({ labId: z.string() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { scores: [], bestScore: 0, badgeEarned: false, masteredTypes: [] as string[] };
        
        const scores = await db.select()
          .from(labScores)
          .where(and(
            eq(labScores.userId, ctx.user.id),
            eq(labScores.labId, input.labId)
          ))
          .orderBy(desc(labScores.completedAt))
          .limit(10);
        
        const bestScore = scores.length > 0 ? Math.max(...scores.map(s => s.scorePercent)) : 0;
        const badgeEarned = scores.some(s => s.badgeEarned);
        
        // Aggregate all mastered types across sessions
        const allMastered = new Set<string>();
        scores.forEach(s => {
          if (s.masteredTypes && Array.isArray(s.masteredTypes)) {
            (s.masteredTypes as string[]).forEach(t => allMastered.add(t));
          }
        });
        
        return {
          scores: scores.map(s => ({
            id: s.id,
            correct: s.correctAnswers,
            total: s.totalQuestions,
            percent: s.scorePercent,
            badgeEarned: s.badgeEarned,
            date: s.completedAt,
          })),
          bestScore,
          badgeEarned,
          masteredTypes: Array.from(allMastered),
        };
      }),

    // Get all badges earned by the current user across all labs
    getMyBadges: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return { badges: [] };
        
        const badgeRows = await db.select({
          labId: labScores.labId,
          badgeEarnedAt: labScores.badgeEarnedAt,
          scorePercent: labScores.scorePercent,
        })
          .from(labScores)
          .where(and(
            eq(labScores.userId, ctx.user.id),
            eq(labScores.badgeEarned, true)
          ))
          .orderBy(desc(labScores.badgeEarnedAt));
        
        // Deduplicate by labId (keep earliest earned date)
        const badgeMap = new Map<string, { labId: string; earnedAt: Date | null; bestScore: number }>();
        for (const row of badgeRows) {
          if (!badgeMap.has(row.labId)) {
            badgeMap.set(row.labId, {
              labId: row.labId,
              earnedAt: row.badgeEarnedAt,
              bestScore: row.scorePercent,
            });
          }
        }
        
        return {
          badges: Array.from(badgeMap.values()),
        };
      }),
  }),

  faultCompetency: faultCompetencyRouter,

  hireReady: hireReadyRouter,

  tutor: tutorRouter,

  authoring: authoringRouter,

  competency: competencyRouter,

  accreditation: accreditationRouter,

  daily: dailyRouter,

  referral: referralRouter,

  review: reviewRouter,
  scheduler: schedulerRouter,

  employer: employerRouter,

  jobs: jobsRouter,

  intelligence: intelligenceRouter,

  competencyGraph: competencyGraphRouter,

  assessment: assessmentRouter,

  mentor: mentorRouter,

  planner: plannerRouter,

  program: programRouter,

  assignments: assignmentsRouter,

  verification: router({
    verifyCode: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const code = input.code.trim();

        const [moduleCert] = await db
          .select()
          .from(certificates)
          .where(eq(certificates.certificateCode, code))
          .limit(1);

        if (moduleCert) {
          return {
            type: "module" as const,
            userName: moduleCert.userName,
            title: moduleCert.moduleTitle,
            score: moduleCert.quizScore,
            issuedAt: moduleCert.issuedAt,
            code: moduleCert.certificateCode,
          };
        }

        const skillResults = await db
          .select({
            level: certificationLevels.level,
            earnedAt: certificationLevels.earnedAt,
            userName: users.name,
            verificationCode: certificationLevels.verificationCode,
          })
          .from(certificationLevels)
          .innerJoin(users, eq(users.id, certificationLevels.userId))
          .where(eq(certificationLevels.verificationCode, code))
          .limit(1);

        if (skillResults.length > 0) {
          const row = skillResults[0];
          return {
            type: "skill" as const,
            userName: row.userName,
            title: `EAS Certified ${row.level.charAt(0).toUpperCase()}${row.level.slice(1)}`,
            level: row.level,
            issuedAt: row.earnedAt,
            code: row.verificationCode,
          };
        }

        return null;
      }),
  }),
});

export type AppRouter = typeof appRouter;
