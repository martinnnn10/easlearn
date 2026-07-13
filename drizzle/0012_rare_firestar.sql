CREATE TABLE `bookmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lessonId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookmarks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenario_completions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scenarioSlug` varchar(100) NOT NULL,
	`scenarioTitle` varchar(255) NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced') NOT NULL,
	`score` int NOT NULL,
	`maxScore` int NOT NULL,
	`timeSeconds` int NOT NULL,
	`hintsUsed` int NOT NULL DEFAULT 0,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scenario_completions_id` PRIMARY KEY(`id`)
);
