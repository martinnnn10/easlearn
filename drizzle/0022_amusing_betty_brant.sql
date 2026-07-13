ALTER TABLE `users` ADD `onboardingDripStep` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingDripSentAt` timestamp;