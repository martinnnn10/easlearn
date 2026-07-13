import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  /** Hashed password for email/password auth (null for OAuth-only users) */
  passwordHash: varchar("passwordHash", { length: 255 }),
  /** Whether the user's email has been verified */
  emailVerified: boolean("emailVerified").default(false).notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "pro", "team"]).default("free").notNull(),
  /** Subscription lifecycle status */
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["none", "trialing", "active", "past_due", "canceled", "expired"]).default("none").notNull(),
  /** When the free trial started */
  trialStartAt: timestamp("trialStartAt"),
  /** When the free trial ends (7 days after start) */
  trialEndsAt: timestamp("trialEndsAt"),
  /** Whether day-5 reminder was sent */
  trialReminder5Sent: boolean("trialReminder5Sent").default(false).notNull(),
  /** Whether day-6 reminder was sent */
  trialReminder6Sent: boolean("trialReminder6Sent").default(false).notNull(),
  /** Whether the user has completed the onboarding wizard */
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  /** Onboarding drip: last step sent (0 = none, 1 = day-1, 2 = day-3, 3 = day-5 done) */
  onboardingDripStep: int("onboardingDripStep").default(0).notNull(),
  /** Onboarding drip: timestamp of last drip email sent */
  onboardingDripSentAt: timestamp("onboardingDripSentAt"),
  /** JSON blob of onboarding wizard selections (experienceLevel, goals, equipment) */
  onboardingSelections: json("onboardingSelections"),
  /** Company/organization this user belongs to (nullable for individual users) */
  companyId: int("companyId"),
  /** Personal referral code for the invite-a-friend viral loop (generated on first use). */
  referralCode: varchar("referralCode", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Subscriptions table - minimal, just Stripe IDs
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }).notNull(),
  stripePriceId: varchar("stripePriceId", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "canceled", "past_due", "trialing"]).default("active").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// Contact form submissions
export const contactSubmissions = mysqlTable("contact_submissions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 255 }),
  inquiryType: varchar("inquiryType", { length: 64 }).notNull().default("general"),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "read", "replied"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;

// AI-generated scenarios stored in database
export const scenarios = mysqlTable("scenarios", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).notNull(),
  estimatedTime: varchar("estimatedTime", { length: 20 }).notNull(),
  description: text("description").notNull(),
  equipment: json("equipment"),
  steps: json("steps"),
  toolReadings: json("toolReadings"),
  isFree: boolean("isFree").default(false).notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  /** Stable slug for linking (e.g. db-30005) — avoids numeric collision with course_modules.id */
  slug: varchar("slug", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = typeof scenarios.$inferInsert;

// Assessment invites for recruiting
export const assessments = mysqlTable("assessments", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique token for the assessment link */
  token: varchar("token", { length: 64 }).notNull().unique(),
  /** Recruiter/admin who created this assessment */
  createdBy: int("createdBy").notNull(),
  /** Candidate name */
  candidateName: varchar("candidateName", { length: 255 }).notNull(),
  /** Candidate email */
  candidateEmail: varchar("candidateEmail", { length: 320 }).notNull(),
  /** Company the candidate is being assessed for */
  company: varchar("company", { length: 255 }),
  /** Position/role being assessed for */
  position: varchar("position", { length: 255 }),
  /** Scenarios assigned (JSON array of scenario IDs from built-in + DB) */
  scenarioIds: json("scenarioIds"),
  /** Time limit in minutes (0 = no limit) */
  timeLimitMinutes: int("timeLimitMinutes").default(0).notNull(),
  /** Assessment status */
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "expired"]).default("pending").notNull(),
  /** When the assessment expires */
  expiresAt: timestamp("expiresAt"),
  /** When the candidate started */
  startedAt: timestamp("startedAt"),
  /** When the candidate completed */
  completedAt: timestamp("completedAt"),
  /** HireReady pack slug (imt-core, et-standard, ct-plus) */
  packSlug: varchar("packSlug", { length: 40 }),
  /** Team that commissioned this assessment */
  teamId: int("teamId"),
  /** Token for candidate remediation path */
  remediationToken: varchar("remediationToken", { length: 64 }),
  /** Automated hire recommendation */
  hireRecommendation: mysqlEnum("hireRecommendation", ["hire", "hold", "no_hire"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = typeof assessments.$inferInsert;

// Assessment results - individual scenario scores
export const assessmentResults = mysqlTable("assessment_results", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull(),
  scenarioId: varchar("scenarioId", { length: 100 }).notNull(),
  scenarioTitle: varchar("scenarioTitle", { length: 255 }).notNull(),
  score: int("score").notNull(),
  maxScore: int("maxScore").notNull(),
  percentage: int("percentage").notNull(),
  grade: varchar("grade", { length: 2 }).notNull(),
  timeSeconds: int("timeSeconds").notNull(),
  /** Detailed decision log (JSON) */
  decisions: json("decisions"),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type AssessmentResult = typeof assessmentResults.$inferSelect;
export type InsertAssessmentResult = typeof assessmentResults.$inferInsert;

// Course modules
export const courseModules = mysqlTable("course_modules", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  /** Learning path: 'foundational' or 'advanced' */
  path: varchar("path", { length: 50 }).notNull().default("advanced"),
  /** Prerequisite module slug (must complete before unlocking this module) */
  prerequisiteSlug: varchar("prerequisiteSlug", { length: 100 }),
  orderIndex: int("orderIndex").notNull().default(0),
  totalLessons: int("totalLessons").notNull().default(0),
  estimatedHours: int("estimatedHours").notNull().default(1),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourseModule = typeof courseModules.$inferSelect;
export type InsertCourseModule = typeof courseModules.$inferInsert;

// Course lessons within modules
export const courseLessons = mysqlTable("course_lessons", {
  id: int("id").autoincrement().primaryKey(),
  moduleId: int("moduleId").notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  orderIndex: int("orderIndex").notNull().default(0),
  /** Lesson content in markdown format */
  content: text("content").notNull(),
  /** `markdown` = scroll article; `cards` = deck in shared/lessonDecks (DB content is stub) */
  contentFormat: varchar("contentFormat", { length: 20 }).notNull().default("markdown"),
  /** @deprecated Prefer linkedScenarioSlug — numeric id collides with course_modules.id namespace */
  linkedScenarioId: int("linkedScenarioId"),
  /** Stable scenario slug (e.g. db-5 or motor-overload-trip-v3) for lesson practice links */
  linkedScenarioSlug: varchar("linkedScenarioSlug", { length: 120 }),
  estimatedMinutes: int("estimatedMinutes").notNull().default(10),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourseLesson = typeof courseLessons.$inferSelect;
export type InsertCourseLesson = typeof courseLessons.$inferInsert;

// User progress tracking
export const userProgress = mysqlTable("user_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lessonId: int("lessonId").notNull(),
  moduleId: int("moduleId").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;

// Quiz questions for end-of-module assessments
export const quizQuestions = mysqlTable("quiz_questions", {
  id: int("id").autoincrement().primaryKey(),
  moduleId: int("moduleId").notNull(),
  question: text("question").notNull(),
  /** JSON array of 4 answer options */
  options: json("options").notNull(),
  /** Index (0-3) of the correct answer */
  correctIndex: int("correctIndex").notNull(),
  /** Brief explanation shown after answering */
  explanation: text("explanation"),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = typeof quizQuestions.$inferInsert;

// Quiz attempt records
export const quizAttempts = mysqlTable("quiz_attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  moduleId: int("moduleId").notNull(),
  score: int("score").notNull(),
  totalQuestions: int("totalQuestions").notNull(),
  passed: boolean("passed").notNull(),
  /** JSON array of user's answers */
  answers: json("answers"),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;

/** Per-lesson formative (knowledge_check) and summative (lesson_quiz) questions */
export const lessonAssessmentQuestions = mysqlTable("lesson_assessment_questions", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull(),
  /** knowledge_check = in-lesson gate; lesson_quiz = end-of-lesson summative */
  type: mysqlEnum("type", ["knowledge_check", "lesson_quiz"]).notNull(),
  question: text("question").notNull(),
  options: json("options").notNull(),
  correctIndex: int("correctIndex").notNull(),
  explanation: text("explanation"),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LessonAssessmentQuestion = typeof lessonAssessmentQuestions.$inferSelect;
export type InsertLessonAssessmentQuestion = typeof lessonAssessmentQuestions.$inferInsert;

/** Learner attempts on lesson-level assessments (retained for accreditation records) */
export const lessonAssessmentAttempts = mysqlTable("lesson_assessment_attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lessonId: int("lessonId").notNull(),
  type: mysqlEnum("type", ["knowledge_check", "lesson_quiz"]).notNull(),
  score: int("score").notNull(),
  totalQuestions: int("totalQuestions").notNull(),
  passed: boolean("passed").notNull(),
  answers: json("answers"),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});
export type LessonAssessmentAttempt = typeof lessonAssessmentAttempts.$inferSelect;
export type InsertLessonAssessmentAttempt = typeof lessonAssessmentAttempts.$inferInsert;

// Companies / Teams — supports both current team billing and future multi-seat company accounts
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerId: int("ownerId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  maxSeats: int("maxSeats").notNull().default(10),
  usedSeats: int("usedSeats").notNull().default(1),
  /** Company domain for auto-join (e.g. 'acme.com') */
  domain: varchar("domain", { length: 255 }),
  /** Company industry vertical */
  industry: varchar("industry", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

// Team/company members (invited or joined)
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  userId: int("userId"),
  /** owner = billing admin, admin = can manage members, manager = can view reports, member = learner */
  role: mysqlEnum("role", ["owner", "admin", "manager", "member"]).default("member").notNull(),
  invitedEmail: varchar("invitedEmail", { length: 320 }),
  inviteToken: varchar("inviteToken", { length: 64 }),
  status: mysqlEnum("status", ["pending", "active", "removed"]).default("pending").notNull(),
  joinedAt: timestamp("joinedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

// Assigned learning paths — company admins assign programs to employees
export const assignedPaths = mysqlTable("assigned_paths", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  userId: int("userId").notNull(),
  moduleId: int("moduleId").notNull(),
  /** Assigned by (admin user id) */
  assignedBy: int("assignedBy").notNull(),
  /** Due date for completion */
  dueAt: timestamp("dueAt"),
  /** Whether the assigned path has been completed */
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AssignedPath = typeof assignedPaths.$inferSelect;
export type InsertAssignedPath = typeof assignedPaths.$inferInsert;

// Course completion certificates
export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  moduleId: int("moduleId").notNull(),
  /** Unique certificate ID for verification */
  certificateCode: varchar("certificateCode", { length: 32 }).notNull().unique(),
  userName: varchar("userName", { length: 255 }).notNull(),
  moduleTitle: varchar("moduleTitle", { length: 255 }).notNull(),
  quizScore: int("quizScore").notNull(),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
});
export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

// Certification levels (progression system)
export const certificationLevels = mysqlTable("certification_levels", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** apprentice, journeyman, specialist, master */
  level: mysqlEnum("level", ["apprentice", "journeyman", "specialist", "master"]).notNull(),
  /** Unique verification code for public URL */
  verificationCode: varchar("verificationCode", { length: 32 }).notNull().unique(),
  /** Score achieved (for master level timed assessment) */
  score: int("score"),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});
export type CertificationLevel = typeof certificationLevels.$inferSelect;
export type InsertCertificationLevel = typeof certificationLevels.$inferInsert;

// Knowledge Base / Free Tutorials (SEO content engine)
export const tutorials = mysqlTable("tutorials", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  metaDescription: varchar("metaDescription", { length: 320 }).notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  /** Full tutorial content in markdown */
  content: text("content").notNull(),
  /** Estimated reading time in minutes */
  readingTime: int("readingTime").notNull().default(10),
  /** Tags for filtering (JSON array of strings) */
  tags: json("tags"),
  isPublished: boolean("isPublished").default(true).notNull(),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tutorial = typeof tutorials.$inferSelect;
export type InsertTutorial = typeof tutorials.$inferInsert;

// Lesson bookmarks (save for later)
export const bookmarks = mysqlTable("bookmarks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lessonId: int("lessonId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;

// Scenario completion history (for progression recommendations)
export const scenarioCompletions = mysqlTable("scenario_completions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  scenarioSlug: varchar("scenarioSlug", { length: 100 }).notNull(),
  scenarioTitle: varchar("scenarioTitle", { length: 255 }).notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).notNull(),
  score: int("score").notNull(),
  maxScore: int("maxScore").notNull(),
  /** Time in seconds to complete */
  timeSeconds: int("timeSeconds").notNull(),
  /** Number of hints used */
  hintsUsed: int("hintsUsed").notNull().default(0),
  /** Methodology overall percentage (0-100) */
  methodologyScore: int("methodologyScore"),
  /** Methodology letter grade (A-F) */
  methodologyGrade: varchar("methodologyGrade", { length: 2 }),
  /** Play mode used */
  playMode: varchar("playMode", { length: 20 }),
  /** Fault variant ID selected */
  faultVariant: varchar("faultVariant", { length: 100 }),
  /** Difficulty modifier applied */
  difficultyModifier: varchar("difficultyModifier", { length: 30 }),
  /** JSON blob of per-dimension scores for detailed history */
  methodologyDimensions: json("methodologyDimensions"),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type ScenarioCompletion = typeof scenarioCompletions.$inferSelect;
export type InsertScenarioCompletion = typeof scenarioCompletions.$inferInsert;

// Password reset tokens
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// Email verification tokens
export const emailVerificationTokens = mysqlTable("email_verification_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type InsertEmailVerificationToken = typeof emailVerificationTokens.$inferInsert;

// Client-side error logs (captured from ErrorBoundary)
export const clientErrors = mysqlTable("client_errors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  errorMessage: text("errorMessage").notNull(),
  errorStack: text("errorStack"),
  componentName: varchar("componentName", { length: 255 }),
  url: varchar("url", { length: 2048 }),
  userAgent: varchar("userAgent", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ClientError = typeof clientErrors.$inferSelect;
export type InsertClientError = typeof clientErrors.$inferInsert;

// Simulator session persistence (resume interrupted scenarios)
export const simulatorSessions = mysqlTable("simulator_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  scenarioId: varchar("scenarioId", { length: 100 }).notNull(),
  /** Play mode: standard, timed, guided, expert */
  playMode: varchar("playMode", { length: 30 }).notNull(),
  /** Difficulty modifier: new_tech, experienced_tech, senior_tech */
  difficulty: varchar("difficulty", { length: 30 }).notNull(),
  /** Current phase: role_select, briefing, active, debrief */
  phase: varchar("phase", { length: 30 }).notNull(),
  /** Full game state JSON (score, actions, timer, discovered faults, etc.) */
  gameState: json("gameState").notNull(),
  /** Current score at time of save */
  currentScore: int("currentScore").default(0).notNull(),
  /** Number of actions taken so far */
  actionCount: int("actionCount").default(0).notNull(),
  /** Elapsed time in seconds */
  elapsedSeconds: int("elapsedSeconds").default(0).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SimulatorSession = typeof simulatorSessions.$inferSelect;
export type InsertSimulatorSession = typeof simulatorSessions.$inferInsert;

// User login streaks (professional gamification)
export const userStreaks = mysqlTable("user_streaks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastActivityDate: timestamp("lastActivityDate"), // date of last recorded activity
  streakStartDate: timestamp("streakStartDate"), // when current streak began
  totalActiveDays: int("totalActiveDays").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type UserStreak = typeof userStreaks.$inferSelect;
export type InsertUserStreak = typeof userStreaks.$inferInsert;

// Lab scores — tracks user performance in interactive labs (e.g., Diode Testing Lab)
export const labScores = mysqlTable("lab_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Lab identifier (e.g., 'diode-testing') */
  labId: varchar("labId", { length: 100 }).notNull(),
  /** Total questions answered correctly in this session */
  correctAnswers: int("correctAnswers").default(0).notNull(),
  /** Total questions attempted in this session */
  totalQuestions: int("totalQuestions").default(0).notNull(),
  /** Percentage score (0-100) */
  scorePercent: int("scorePercent").default(0).notNull(),
  /** JSON array of diode types mastered (scored 100% on) */
  masteredTypes: json("masteredTypes"),
  /** Whether the "Diode Diagnostics" badge has been earned */
  badgeEarned: boolean("badgeEarned").default(false).notNull(),
  /** Timestamp when badge was earned */
  badgeEarnedAt: timestamp("badgeEarnedAt"),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LabScore = typeof labScores.$inferSelect;
export type InsertLabScore = typeof labScores.$inferInsert;

// ── Fault Competency System ──────────────────────────────────────────────────

export const faultTypes = mysqlTable("fault_types", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  domain: mysqlEnum("domain", ["power", "motor", "safety", "sensor", "plc", "vfd", "network", "integration"]).notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).notNull(),
  industry: varchar("industry", { length: 80 }),
  rootCauseClass: varchar("root_cause_class", { length: 120 }),
  scenarioSlug: varchar("scenario_slug", { length: 100 }),
  isPublished: boolean("is_published").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type FaultType = typeof faultTypes.$inferSelect;

export const faultCompetencyUnits = mysqlTable("fault_competency_units", {
  id: int("id").autoincrement().primaryKey(),
  faultTypeId: int("fault_type_id").notNull(),
  mode: mysqlEnum("mode", ["guided", "unguided", "assessment", "capstone"]).notNull(),
  passThreshold: int("pass_threshold").default(75).notNull(),
  timeLimitSec: int("time_limit_sec"),
  sortOrder: int("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type FaultCompetencyUnit = typeof faultCompetencyUnits.$inferSelect;

export const faultCompetencyAttempts = mysqlTable("fault_competency_attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  fcuId: int("fcu_id").notNull(),
  scenarioSlug: varchar("scenario_slug", { length: 100 }).notNull(),
  lessonId: int("lesson_id"),
  assessmentId: int("assessment_id"),
  playMode: varchar("play_mode", { length: 30 }),
  score: int("score").notNull(),
  maxScore: int("max_score").notNull(),
  percentage: int("percentage").notNull(),
  timeToDiagnoseSec: int("time_to_diagnose_sec").notNull(),
  toolSelectionScore: int("tool_selection_score"),
  methodologyScore: int("methodology_score"),
  safetyScore: int("safety_score"),
  firstStepCorrect: boolean("first_step_correct"),
  hintsUsed: int("hints_used").default(0).notNull(),
  rootCauseIdentified: varchar("root_cause_identified", { length: 120 }),
  passed: boolean("passed").notNull(),
  methodologyDimensions: json("methodology_dimensions"),
  decisionLog: json("decision_log"),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});
export type FaultCompetencyAttempt = typeof faultCompetencyAttempts.$inferSelect;

export const faultCompetencyMastery = mysqlTable("fault_competency_mastery", {
  userId: int("user_id").notNull(),
  fcuId: int("fcu_id").notNull(),
  bestPercentage: int("best_percentage").default(0).notNull(),
  bestMethodology: int("best_methodology").default(0).notNull(),
  attempts: int("attempts").default(0).notNull(),
  passed: boolean("passed").default(false).notNull(),
  masteredAt: timestamp("mastered_at"),
});
export type FaultCompetencyMastery = typeof faultCompetencyMastery.$inferSelect;

export const lessonFcuLinks = mysqlTable("lesson_fcu_links", {
  lessonId: int("lesson_id").notNull(),
  fcuId: int("fcu_id").notNull(),
  required: boolean("required").default(true).notNull(),
});

// ── HireReady ────────────────────────────────────────────────────────────────

export const hireReadyPacks = mysqlTable("hire_ready_packs", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 40 }).notNull().unique(),
  title: varchar("title", { length: 120 }).notNull(),
  roleTarget: mysqlEnum("role_target", ["maintenance", "electrical", "controls"]).notNull(),
  scenarioIds: json("scenario_ids").notNull(),
  timeLimitMin: int("time_limit_min").default(60).notNull(),
  passThreshold: int("pass_threshold").default(75).notNull(),
  weights: json("weights"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type HireReadyPack = typeof hireReadyPacks.$inferSelect;

export const assessmentCompetencyScores = mysqlTable("assessment_competency_scores", {
  assessmentId: int("assessment_id").notNull(),
  domain: varchar("domain", { length: 40 }).notNull(),
  score: int("score").notNull(),
});

export const assessmentRemediationLinks = mysqlTable("assessment_remediation_links", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessment_id").notNull(),
  faultTypeSlug: varchar("fault_type_slug", { length: 80 }).notNull(),
  lessonId: int("lesson_id"),
  fcuId: int("fcu_id"),
});

// ── Industrial Failure Database ──────────────────────────────────────────────

export const failureIndustries = mysqlTable("failure_industries", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  title: varchar("title", { length: 120 }).notNull(),
});

export const failureMachines = mysqlTable("failure_machines", {
  id: int("id").autoincrement().primaryKey(),
  industryId: int("industry_id").notNull(),
  slug: varchar("slug", { length: 80 }).notNull(),
  title: varchar("title", { length: 120 }).notNull(),
});

export const failureModes = mysqlTable("failure_modes", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  industryId: int("industry_id").notNull(),
  machineId: int("machine_id"),
  title: varchar("title", { length: 255 }).notNull(),
  symptoms: json("symptoms").notNull(),
  likelyCauses: json("likely_causes").notNull(),
  diagnosticProcedure: json("diagnostic_procedure").notNull(),
  downtimeCostBand: mysqlEnum("downtime_cost_band", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  faultTypeId: int("fault_type_id"),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const failureModeLinks = mysqlTable("failure_mode_links", {
  failureModeId: int("failure_mode_id").notNull(),
  linkType: mysqlEnum("link_type", ["lesson", "simulator", "assessment", "fcu"]).notNull(),
  linkId: varchar("link_id", { length: 100 }).notNull(),
});

// ── Authoring Platform ───────────────────────────────────────────────────────
// Moves content authoring out of hand-edited .ts files and into a draft → review
// → publish workflow, so supply scales beyond a single engineer/author.

/** Draft lesson card decks (mirror of shared LessonCardDeck, stored as JSON). */
export const deckDrafts = mysqlTable("deck_drafts", {
  id: int("id").autoincrement().primaryKey(),
  moduleSlug: varchar("module_slug", { length: 100 }).notNull(),
  lessonSlug: varchar("lesson_slug", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  /** Full LessonCardDeck payload as authored (validated on publish). */
  deck: json("deck").notNull(),
  status: mysqlEnum("status", ["draft", "in_review", "published", "archived"]).default("draft").notNull(),
  version: int("version").default(1).notNull(),
  authorId: int("author_id").notNull(),
  reviewerId: int("reviewer_id"),
  reviewNotes: text("review_notes"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type DeckDraft = typeof deckDrafts.$inferSelect;
export type InsertDeckDraft = typeof deckDrafts.$inferInsert;

/** Draft simulator scenarios (mirror of ScenarioV3, stored as JSON). */
export const scenarioDrafts = mysqlTable("scenario_drafts", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).notNull(),
  /** Full ScenarioV3 payload as authored (validated on publish). */
  scenario: json("scenario").notNull(),
  status: mysqlEnum("status", ["draft", "in_review", "published", "archived"]).default("draft").notNull(),
  version: int("version").default(1).notNull(),
  authorId: int("author_id").notNull(),
  reviewerId: int("reviewer_id"),
  reviewNotes: text("review_notes"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
export type ScenarioDraft = typeof scenarioDrafts.$inferSelect;
export type InsertScenarioDraft = typeof scenarioDrafts.$inferInsert;

/**
 * Open-response (free-text) diagnosis attempts, AI-graded against known ground
 * truth. Retained as an accreditation/certification record — this is assessment
 * of reasoning, not recognition, so it carries evidentiary weight for HireReady
 * and certification. Linked to a scenario and/or lesson for the competency trail.
 */
export const openResponseAttempts = mysqlTable("open_response_attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Scenario slug this response was for (nullable if lesson-level). */
  scenarioSlug: varchar("scenarioSlug", { length: 120 }),
  /** Lesson id this response was for (nullable if scenario-level). */
  lessonId: int("lessonId"),
  /** The fault / prompt the learner was answering about. */
  prompt: varchar("prompt", { length: 500 }).notNull(),
  /** Learner's free-text answer. */
  answer: text("answer").notNull(),
  /** AI grade 0-100 against the known root cause. */
  score: int("score").notNull(),
  /** Grader rationale. */
  rationale: text("rationale"),
  /** Key point the learner missed (if any). */
  missed: text("missed"),
  /** Model id that graded it (for audit). */
  gradedBy: varchar("gradedBy", { length: 60 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type OpenResponseAttempt = typeof openResponseAttempts.$inferSelect;
export type InsertOpenResponseAttempt = typeof openResponseAttempts.$inferInsert;

/**
 * Referrals — the viral K-factor loop. Each successful invite (a new user who
 * signs up via a referrer's code) is one row. Drives the invite-a-friend reward
 * and the "Recruiter" milestone on the Skills Passport.
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  /** User who shared their code. */
  referrerId: int("referrerId").notNull(),
  /** New user who joined via the code. */
  referredUserId: int("referredUserId").notNull().unique(),
  /** The code used (denormalized for audit). */
  code: varchar("code", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["pending", "qualified"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * Spaced-repetition schedule per learner per concept (a knowledge-check question).
 * The retention keystone: concepts resurface on an SM-2 schedule until mastered.
 */
export const conceptReviews = mysqlTable("concept_reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** The concept = a lesson_assessment_questions.id the learner has encountered. */
  questionId: int("questionId").notNull(),
  lessonId: int("lessonId").notNull(),
  ease: int("ease").default(250).notNull(), // ×100 (2.50 → 250) to stay integer
  intervalDays: int("intervalDays").default(0).notNull(),
  reps: int("reps").default(0).notNull(),
  lapses: int("lapses").default(0).notNull(),
  mastered: boolean("mastered").default(false).notNull(),
  dueAt: timestamp("dueAt").notNull(),
  lastReviewedAt: timestamp("lastReviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ConceptReview = typeof conceptReviews.$inferSelect;
export type InsertConceptReview = typeof conceptReviews.$inferInsert;

// ── Hiring Marketplace (the employment-transaction lever) ─────────────────────
// Fuses learning → verified competency → employment. The competency graph is
// searchable by employers; jobs are gated by demonstrated skill, not résumés.

export const jobPostings = mysqlTable("job_postings", {
  id: int("id").autoincrement().primaryKey(),
  employerId: int("employerId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  remote: boolean("remote").default(false).notNull(),
  description: text("description").notNull(),
  /** Required skill domain (shared/competencyMatrix SkillDomain). */
  requiredDomain: varchar("requiredDomain", { length: 40 }).notNull(),
  /** Minimum demonstrated competency 0-100 to qualify/apply. */
  minCompetency: int("minCompetency").default(60).notNull(),
  salaryMin: int("salaryMin"),
  salaryMax: int("salaryMax"),
  status: mysqlEnum("status", ["open", "closed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPosting = typeof jobPostings.$inferInsert;

export const jobApplications = mysqlTable("job_applications", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["applied", "reviewing", "interview", "hired", "rejected"]).default("applied").notNull(),
  /** Competency snapshot at apply time (verifiable, tamper-evident record). */
  competencySnapshot: json("competencySnapshot"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = typeof jobApplications.$inferInsert;

// ── Platform / Public API (the OEM, CMMS, enterprise integration layer) ───────
// Turns the product into a platform others build on — the $100B multiplier.
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  /** Only the SHA-256 hash is stored; the plaintext key is shown once at creation. */
  keyHash: varchar("keyHash", { length: 64 }).notNull().unique(),
  /** First 8 chars for display ("eas_live_ab12…"). */
  keyPrefix: varchar("keyPrefix", { length: 20 }).notNull(),
  /** Comma-separated scopes: verify,talent,jobs. */
  scopes: varchar("scopes", { length: 255 }).default("verify").notNull(),
  active: boolean("active").default(true).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Manager validations — the human ground-truth layer of the competency graph.
 * A manager attests that a technician has demonstrated a competency in the field,
 * the one signal that makes the credential trustworthy beyond the simulator.
 */
export const competencyValidations = mysqlTable("competency_validations", {
  id: int("id").autoincrement().primaryKey(),
  managerId: int("managerId").notNull(),
  userId: int("userId").notNull(),
  /** SkillDomain the manager is attesting. */
  domain: varchar("domain", { length: 40 }).notNull(),
  note: varchar("note", { length: 500 }),
  validatedAt: timestamp("validatedAt").defaultNow().notNull(),
});
export type CompetencyValidation = typeof competencyValidations.$inferSelect;
export type InsertCompetencyValidation = typeof competencyValidations.$inferInsert;

/**
 * Assessment Spine — the evidence ledger. One row per important learner action,
 * from any source, preserving enough detail that a manager or auditor can see
 * WHY a competency score changed. Interpreted by shared/assessmentSpine.ts.
 */
export const competencyEvidence = mysqlTable("competency_evidence", {
  id: int("id").autoincrement().primaryKey(),
  learnerId: int("learnerId").notNull(),
  /** lesson | simulation | review | ai_mentor | manager_validation */
  sourceType: mysqlEnum("sourceType", ["lesson", "simulation", "review", "ai_mentor", "manager_validation"]).notNull(),
  /** EvidenceType from the spine (reasoned_answer, simulation_completed, review_recall, …). */
  evidenceType: varchar("evidenceType", { length: 40 }).notNull(),
  /** LearningMechanicId from shared/learningEngine.ts. */
  mechanicId: varchar("mechanicId", { length: 48 }),
  /** SkillDomain the evidence bears on. */
  domain: varchar("domain", { length: 40 }).notNull(),
  skill: varchar("skill", { length: 80 }),
  lessonId: varchar("lessonId", { length: 120 }),
  courseId: varchar("courseId", { length: 120 }),
  competencyId: varchar("competencyId", { length: 120 }),
  actionTaken: varchar("actionTaken", { length: 255 }),
  /** correct | incorrect | partial */
  correctness: varchar("correctness", { length: 12 }),
  /** sound | weak | flawed | none */
  reasoningQuality: varchar("reasoningQuality", { length: 12 }),
  methodologyScore: int("methodologyScore"),
  confidenceScore: int("confidenceScore"),
  safetyFlag: boolean("safetyFlag").notNull().default(false),
  attemptNumber: int("attemptNumber"),
  timeToDecisionMs: int("timeToDecisionMs"),
  detail: json("detail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CompetencyEvidence = typeof competencyEvidence.$inferSelect;
export type InsertCompetencyEvidence = typeof competencyEvidence.$inferInsert;

/**
 * Distributed rate limiting for AI endpoints (mentor.coach, mentor.operator).
 * Sliding-window: one row per allowed request; counted per (userId, bucket)
 * within the window. Old rows are pruned opportunistically. In-memory fallback
 * is used when the DB is unavailable (local/dev).
 */
export const rateLimitEvents = mysqlTable("rate_limit_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bucket: varchar("bucket", { length: 40 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type RateLimitEvent = typeof rateLimitEvents.$inferSelect;

// ── Spaced Repetition Scheduler — Competency Durability ──────────────────────
export const spacedReviewItems = mysqlTable("spaced_review_items", {
  id: int("id").autoincrement().primaryKey(),
  learnerId: int("learner_id").notNull(),
  /** What kind of review activity */
  itemType: mysqlEnum("item_type", [
    "retry_fault",
    "review_concept",
    "repeat_simulation",
    "explain_fault",
    "practice_work_order",
    "practice_communication",
    "review_safety",
    "review_reasoning",
  ]).notNull(),
  /** Source reference (fault ID, scenario slug, lesson ID, etc.) */
  sourceId: varchar("source_id", { length: 120 }).notNull(),
  /** Human-readable label for the source */
  sourceLabel: varchar("source_label", { length: 255 }).notNull(),
  /** Skill domain this review targets */
  domain: varchar("domain", { length: 40 }).notNull(),
  /** Specific skill within the domain */
  skill: varchar("skill", { length: 120 }),
  /** Why this review was assigned */
  reason: mysqlEnum("reason", [
    "missed_root_cause",
    "slow_diagnostic",
    "excess_hints",
    "weak_reasoning",
    "unsafe_action",
    "failed_reflection",
    "poor_operator_communication",
    "vague_work_order",
    "low_confidence",
    "knowledge_decay",
    "previous_needs_review",
  ]).notNull(),
  /** Human-readable explanation */
  reasonDetail: varchar("reason_detail", { length: 500 }).notNull(),
  /** Priority: critical > high > medium > low */
  priority: mysqlEnum("priority", ["critical", "high", "medium", "low"]).notNull(),
  /** Difficulty tier (1-5) */
  difficulty: int("difficulty").default(3).notNull(),
  /** Current status */
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "skipped"]).default("pending").notNull(),
  /** SM-2 interval in days */
  intervalDays: int("interval_days").default(0).notNull(),
  /** SM-2 ease factor ×100 (250 = 2.50) */
  ease: int("ease").default(250).notNull(),
  /** Consecutive successful reviews */
  reps: int("reps").default(0).notNull(),
  /** Times the learner failed this review */
  lapses: int("lapses").default(0).notNull(),
  /** When this review is next due */
  dueAt: timestamp("due_at").notNull(),
  /** Result of the last attempt */
  lastAttemptResult: mysqlEnum("last_attempt_result", ["not_attempted", "passed", "failed", "partial"]).default("not_attempted").notNull(),
  /** JSON metadata */
  metadata: json("metadata"),
  /** Whether mastered (interval >= 21 days with 3+ reps) */
  mastered: boolean("mastered").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type SpacedReviewItem = typeof spacedReviewItems.$inferSelect;
export type InsertSpacedReviewItem = typeof spacedReviewItems.$inferInsert;
