CREATE TABLE `client_errors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`errorMessage` text NOT NULL,
	`errorStack` text,
	`componentName` varchar(255),
	`url` varchar(2048),
	`userAgent` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_errors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `simulator_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scenarioId` varchar(100) NOT NULL,
	`playMode` varchar(30) NOT NULL,
	`difficulty` varchar(30) NOT NULL,
	`phase` varchar(30) NOT NULL,
	`gameState` json NOT NULL,
	`currentScore` int NOT NULL DEFAULT 0,
	`actionCount` int NOT NULL DEFAULT 0,
	`elapsedSeconds` int NOT NULL DEFAULT 0,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `simulator_sessions_id` PRIMARY KEY(`id`)
);
