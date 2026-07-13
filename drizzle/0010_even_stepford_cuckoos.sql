CREATE TABLE `certification_levels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`level` enum('apprentice','journeyman','specialist','master') NOT NULL,
	`verificationCode` varchar(32) NOT NULL,
	`score` int,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `certification_levels_id` PRIMARY KEY(`id`),
	CONSTRAINT `certification_levels_verificationCode_unique` UNIQUE(`verificationCode`)
);
