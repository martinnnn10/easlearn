CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`label` varchar(120) NOT NULL,
	`keyHash` varchar(64) NOT NULL,
	`keyPrefix` varchar(20) NOT NULL,
	`scopes` varchar(255) NOT NULL DEFAULT 'verify',
	`active` boolean NOT NULL DEFAULT true,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_keyHash_unique` UNIQUE(`keyHash`)
);
--> statement-breakpoint
CREATE TABLE `assessment_competency_scores` (
	`assessment_id` int NOT NULL,
	`domain` varchar(40) NOT NULL,
	`score` int NOT NULL
);
--> statement-breakpoint
CREATE TABLE `assessment_remediation_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessment_id` int NOT NULL,
	`fault_type_slug` varchar(80) NOT NULL,
	`lesson_id` int,
	`fcu_id` int,
	CONSTRAINT `assessment_remediation_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competency_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`learnerId` int NOT NULL,
	`sourceType` enum('lesson','simulation','review','ai_mentor','manager_validation') NOT NULL,
	`evidenceType` varchar(40) NOT NULL,
	`mechanicId` varchar(48),
	`domain` varchar(40) NOT NULL,
	`skill` varchar(80),
	`lessonId` varchar(120),
	`courseId` varchar(120),
	`competencyId` varchar(120),
	`actionTaken` varchar(255),
	`correctness` varchar(12),
	`reasoningQuality` varchar(12),
	`methodologyScore` int,
	`confidenceScore` int,
	`safetyFlag` boolean NOT NULL DEFAULT false,
	`attemptNumber` int,
	`timeToDecisionMs` int,
	`detail` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `competency_evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competency_validations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`managerId` int NOT NULL,
	`userId` int NOT NULL,
	`domain` varchar(40) NOT NULL,
	`note` varchar(500),
	`validatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `competency_validations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `concept_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` int NOT NULL,
	`lessonId` int NOT NULL,
	`ease` int NOT NULL DEFAULT 250,
	`intervalDays` int NOT NULL DEFAULT 0,
	`reps` int NOT NULL DEFAULT 0,
	`lapses` int NOT NULL DEFAULT 0,
	`mastered` boolean NOT NULL DEFAULT false,
	`dueAt` timestamp NOT NULL,
	`lastReviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `concept_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deck_drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`module_slug` varchar(100) NOT NULL,
	`lesson_slug` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`deck` json NOT NULL,
	`status` enum('draft','in_review','published','archived') NOT NULL DEFAULT 'draft',
	`version` int NOT NULL DEFAULT 1,
	`author_id` int NOT NULL,
	`reviewer_id` int,
	`review_notes` text,
	`published_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deck_drafts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `failure_industries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(60) NOT NULL,
	`title` varchar(120) NOT NULL,
	CONSTRAINT `failure_industries_id` PRIMARY KEY(`id`),
	CONSTRAINT `failure_industries_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `failure_machines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`industry_id` int NOT NULL,
	`slug` varchar(80) NOT NULL,
	`title` varchar(120) NOT NULL,
	CONSTRAINT `failure_machines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `failure_mode_links` (
	`failure_mode_id` int NOT NULL,
	`link_type` enum('lesson','simulator','assessment','fcu') NOT NULL,
	`link_id` varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `failure_modes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`industry_id` int NOT NULL,
	`machine_id` int,
	`title` varchar(255) NOT NULL,
	`symptoms` json NOT NULL,
	`likely_causes` json NOT NULL,
	`diagnostic_procedure` json NOT NULL,
	`downtime_cost_band` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`fault_type_id` int,
	`is_published` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `failure_modes_id` PRIMARY KEY(`id`),
	CONSTRAINT `failure_modes_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `fault_competency_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`fcu_id` int NOT NULL,
	`scenario_slug` varchar(100) NOT NULL,
	`lesson_id` int,
	`assessment_id` int,
	`play_mode` varchar(30),
	`score` int NOT NULL,
	`max_score` int NOT NULL,
	`percentage` int NOT NULL,
	`time_to_diagnose_sec` int NOT NULL,
	`tool_selection_score` int,
	`methodology_score` int,
	`safety_score` int,
	`first_step_correct` boolean,
	`hints_used` int NOT NULL DEFAULT 0,
	`root_cause_identified` varchar(120),
	`passed` boolean NOT NULL,
	`methodology_dimensions` json,
	`decision_log` json,
	`completed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fault_competency_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fault_competency_mastery` (
	`user_id` int NOT NULL,
	`fcu_id` int NOT NULL,
	`best_percentage` int NOT NULL DEFAULT 0,
	`best_methodology` int NOT NULL DEFAULT 0,
	`attempts` int NOT NULL DEFAULT 0,
	`passed` boolean NOT NULL DEFAULT false,
	`mastered_at` timestamp
);
--> statement-breakpoint
CREATE TABLE `fault_competency_units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fault_type_id` int NOT NULL,
	`mode` enum('guided','unguided','assessment','capstone') NOT NULL,
	`pass_threshold` int NOT NULL DEFAULT 75,
	`time_limit_sec` int,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fault_competency_units_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fault_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`title` varchar(255) NOT NULL,
	`domain` enum('power','motor','safety','sensor','plc','vfd','network','integration') NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced') NOT NULL,
	`industry` varchar(80),
	`root_cause_class` varchar(120),
	`scenario_slug` varchar(100),
	`is_published` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fault_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `fault_types_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `hire_ready_packs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(40) NOT NULL,
	`title` varchar(120) NOT NULL,
	`role_target` enum('maintenance','electrical','controls') NOT NULL,
	`scenario_ids` json NOT NULL,
	`time_limit_min` int NOT NULL DEFAULT 60,
	`pass_threshold` int NOT NULL DEFAULT 75,
	`weights` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hire_ready_packs_id` PRIMARY KEY(`id`),
	CONSTRAINT `hire_ready_packs_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `job_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('applied','reviewing','interview','hired','rejected') NOT NULL DEFAULT 'applied',
	`competencySnapshot` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `job_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_postings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employerId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`company` varchar(255) NOT NULL,
	`location` varchar(255),
	`remote` boolean NOT NULL DEFAULT false,
	`description` text NOT NULL,
	`requiredDomain` varchar(40) NOT NULL,
	`minCompetency` int NOT NULL DEFAULT 60,
	`salaryMin` int,
	`salaryMax` int,
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `job_postings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_assessment_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lessonId` int NOT NULL,
	`type` enum('knowledge_check','lesson_quiz') NOT NULL,
	`score` int NOT NULL,
	`totalQuestions` int NOT NULL,
	`passed` boolean NOT NULL,
	`answers` json,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lesson_assessment_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_assessment_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`type` enum('knowledge_check','lesson_quiz') NOT NULL,
	`question` text NOT NULL,
	`options` json NOT NULL,
	`correctIndex` int NOT NULL,
	`explanation` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lesson_assessment_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_fcu_links` (
	`lesson_id` int NOT NULL,
	`fcu_id` int NOT NULL,
	`required` boolean NOT NULL DEFAULT true
);
--> statement-breakpoint
CREATE TABLE `open_response_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scenarioSlug` varchar(120),
	`lessonId` int,
	`prompt` varchar(500) NOT NULL,
	`answer` text NOT NULL,
	`score` int NOT NULL,
	`rationale` text,
	`missed` text,
	`gradedBy` varchar(60),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `open_response_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rate_limit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bucket` varchar(40) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rate_limit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`status` enum('pending','qualified') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referredUserId_unique` UNIQUE(`referredUserId`)
);
--> statement-breakpoint
CREATE TABLE `scenario_drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(120) NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(100) NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced') NOT NULL,
	`scenario` json NOT NULL,
	`status` enum('draft','in_review','published','archived') NOT NULL DEFAULT 'draft',
	`version` int NOT NULL DEFAULT 1,
	`author_id` int NOT NULL,
	`reviewer_id` int,
	`review_notes` text,
	`published_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scenario_drafts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `assessments` ADD `packSlug` varchar(40);--> statement-breakpoint
ALTER TABLE `assessments` ADD `teamId` int;--> statement-breakpoint
ALTER TABLE `assessments` ADD `remediationToken` varchar(64);--> statement-breakpoint
ALTER TABLE `assessments` ADD `hireRecommendation` enum('hire','hold','no_hire');--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `contentFormat` varchar(20) DEFAULT 'markdown' NOT NULL;--> statement-breakpoint
ALTER TABLE `course_lessons` ADD `linkedScenarioSlug` varchar(120);--> statement-breakpoint
ALTER TABLE `scenarios` ADD `slug` varchar(120);--> statement-breakpoint
ALTER TABLE `users` ADD `referralCode` varchar(32);