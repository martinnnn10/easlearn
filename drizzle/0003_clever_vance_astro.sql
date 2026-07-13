CREATE TABLE `assessment_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`scenarioId` varchar(100) NOT NULL,
	`scenarioTitle` varchar(255) NOT NULL,
	`score` int NOT NULL,
	`maxScore` int NOT NULL,
	`percentage` int NOT NULL,
	`grade` varchar(2) NOT NULL,
	`timeSeconds` int NOT NULL,
	`decisions` json,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assessment_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`createdBy` int NOT NULL,
	`candidateName` varchar(255) NOT NULL,
	`candidateEmail` varchar(320) NOT NULL,
	`company` varchar(255),
	`position` varchar(255),
	`scenarioIds` json,
	`timeLimitMinutes` int NOT NULL DEFAULT 0,
	`status` enum('pending','in_progress','completed','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assessments_id` PRIMARY KEY(`id`),
	CONSTRAINT `assessments_token_unique` UNIQUE(`token`)
);
