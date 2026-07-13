-- Open-response (free-text) diagnosis attempts, AI-graded vs ground truth.
-- Durable accreditation record: assessment of reasoning, not recognition.

CREATE TABLE IF NOT EXISTS `open_response_attempts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `scenarioSlug` varchar(120),
  `lessonId` int,
  `prompt` varchar(500) NOT NULL,
  `answer` text NOT NULL,
  `score` int NOT NULL,
  `rationale` text,
  `missed` text,
  `gradedBy` varchar(60),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `open_response_attempts_id` PRIMARY KEY(`id`)
);

CREATE INDEX `open_response_user_idx` ON `open_response_attempts` (`userId`);
CREATE INDEX `open_response_scenario_idx` ON `open_response_attempts` (`scenarioSlug`);
