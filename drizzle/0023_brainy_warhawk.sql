CREATE TABLE `lab_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`labId` varchar(100) NOT NULL,
	`correctAnswers` int NOT NULL DEFAULT 0,
	`totalQuestions` int NOT NULL DEFAULT 0,
	`scorePercent` int NOT NULL DEFAULT 0,
	`masteredTypes` json,
	`badgeEarned` boolean NOT NULL DEFAULT false,
	`badgeEarnedAt` timestamp,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lab_scores_id` PRIMARY KEY(`id`)
);
