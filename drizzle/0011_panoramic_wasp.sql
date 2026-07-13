ALTER TABLE `course_modules` ADD `path` varchar(50) DEFAULT 'advanced' NOT NULL;--> statement-breakpoint
ALTER TABLE `course_modules` ADD `prerequisiteSlug` varchar(100);