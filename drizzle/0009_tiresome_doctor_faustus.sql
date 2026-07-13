CREATE TABLE `tutorials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(300) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`metaDescription` varchar(320) NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced') NOT NULL,
	`category` varchar(100) NOT NULL,
	`content` text NOT NULL,
	`readingTime` int NOT NULL DEFAULT 10,
	`tags` json,
	`isPublished` boolean NOT NULL DEFAULT true,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tutorials_id` PRIMARY KEY(`id`),
	CONSTRAINT `tutorials_slug_unique` UNIQUE(`slug`)
);
