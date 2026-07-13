-- Authoring platform: draft → review → publish workflow for decks and scenarios.
-- Moves content authoring out of hand-edited .ts files so supply scales past one author.

CREATE TABLE IF NOT EXISTS `deck_drafts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `module_slug` varchar(100) NOT NULL,
  `lesson_slug` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `deck` json NOT NULL,
  `status` enum('draft','in_review','published','archived') NOT NULL DEFAULT 'draft',
  `version` int NOT NULL DEFAULT 1,
  `author_id` int NOT NULL,
  `reviewer_id` int,
  `review_notes` text,
  `published_at` timestamp,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `deck_drafts_id` PRIMARY KEY(`id`)
);

CREATE INDEX `deck_drafts_lesson_idx` ON `deck_drafts` (`module_slug`,`lesson_slug`);
CREATE INDEX `deck_drafts_status_idx` ON `deck_drafts` (`status`);

CREATE TABLE IF NOT EXISTS `scenario_drafts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slug` varchar(120) NOT NULL,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `difficulty` enum('beginner','intermediate','advanced') NOT NULL,
  `scenario` json NOT NULL,
  `status` enum('draft','in_review','published','archived') NOT NULL DEFAULT 'draft',
  `version` int NOT NULL DEFAULT 1,
  `author_id` int NOT NULL,
  `reviewer_id` int,
  `review_notes` text,
  `published_at` timestamp,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `scenario_drafts_id` PRIMARY KEY(`id`)
);

CREATE INDEX `scenario_drafts_slug_idx` ON `scenario_drafts` (`slug`);
CREATE INDEX `scenario_drafts_status_idx` ON `scenario_drafts` (`status`);
