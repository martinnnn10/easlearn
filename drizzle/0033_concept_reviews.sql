-- Spaced-repetition schedule (retention keystone of the Mission model).

CREATE TABLE IF NOT EXISTS `concept_reviews` (
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
  `lastReviewedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `concept_reviews_id` PRIMARY KEY(`id`)
);

CREATE INDEX `concept_reviews_user_due_idx` ON `concept_reviews` (`userId`,`dueAt`);
CREATE UNIQUE INDEX `concept_reviews_user_question_uq` ON `concept_reviews` (`userId`,`questionId`);
