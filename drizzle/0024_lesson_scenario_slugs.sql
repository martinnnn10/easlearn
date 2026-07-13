-- S-02: Disambiguate lesson scenario links from module numeric IDs
ALTER TABLE `scenarios` ADD `slug` varchar(120);
ALTER TABLE `course_lessons` ADD `linkedScenarioSlug` varchar(120);
--> statement-breakpoint
CREATE UNIQUE INDEX `scenarios_slug_unique` ON `scenarios` (`slug`);
--> statement-breakpoint
-- Backfill stable DB slugs (idempotent)
UPDATE `scenarios` SET `slug` = CONCAT('db-', `id`) WHERE `slug` IS NULL OR `slug` = '';
--> statement-breakpoint
UPDATE `course_lessons`
SET `linkedScenarioSlug` = CONCAT('db-', `linkedScenarioId`)
WHERE `linkedScenarioId` IS NOT NULL
  AND (`linkedScenarioSlug` IS NULL OR `linkedScenarioSlug` = '');
