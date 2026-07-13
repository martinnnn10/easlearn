CREATE TABLE `assigned_paths` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`userId` int NOT NULL,
	`moduleId` int NOT NULL,
	`assignedBy` int NOT NULL,
	`dueAt` timestamp,
	`completed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assigned_paths_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `team_members` MODIFY COLUMN `role` enum('owner','admin','manager','member') NOT NULL DEFAULT 'member';--> statement-breakpoint
ALTER TABLE `teams` ADD `usedSeats` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `teams` ADD `domain` varchar(255);--> statement-breakpoint
ALTER TABLE `teams` ADD `industry` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` enum('none','trialing','active','past_due','canceled','expired') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `trialStartAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `trialEndsAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `trialReminder5Sent` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `trialReminder6Sent` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `companyId` int;