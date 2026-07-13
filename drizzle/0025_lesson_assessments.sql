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
