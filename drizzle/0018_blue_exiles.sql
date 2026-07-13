ALTER TABLE `scenario_completions` ADD `methodologyScore` int;--> statement-breakpoint
ALTER TABLE `scenario_completions` ADD `methodologyGrade` varchar(2);--> statement-breakpoint
ALTER TABLE `scenario_completions` ADD `playMode` varchar(20);--> statement-breakpoint
ALTER TABLE `scenario_completions` ADD `faultVariant` varchar(100);--> statement-breakpoint
ALTER TABLE `scenario_completions` ADD `difficultyModifier` varchar(30);--> statement-breakpoint
ALTER TABLE `scenario_completions` ADD `methodologyDimensions` json;