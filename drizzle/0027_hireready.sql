CREATE TABLE `hire_ready_packs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slug` varchar(40) NOT NULL,
  `title` varchar(120) NOT NULL,
  `role_target` enum('maintenance','electrical','controls') NOT NULL,
  `scenario_ids` json NOT NULL,
  `time_limit_min` int NOT NULL DEFAULT 60,
  `pass_threshold` int NOT NULL DEFAULT 75,
  `weights` json,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `hire_ready_packs_id` PRIMARY KEY(`id`),
  CONSTRAINT `hire_ready_packs_slug_unique` UNIQUE(`slug`)
);

ALTER TABLE `assessments` ADD `pack_slug` varchar(40);
ALTER TABLE `assessments` ADD `team_id` int;
ALTER TABLE `assessments` ADD `remediation_token` varchar(64);
ALTER TABLE `assessments` ADD `hire_recommendation` enum('hire','hold','no_hire');

CREATE TABLE `assessment_competency_scores` (
  `assessment_id` int NOT NULL,
  `domain` varchar(40) NOT NULL,
  `score` int NOT NULL,
  CONSTRAINT `assessment_competency_scores_pk` PRIMARY KEY(`assessment_id`,`domain`)
);

CREATE TABLE `assessment_remediation_links` (
  `id` int AUTO_INCREMENT NOT NULL,
  `assessment_id` int NOT NULL,
  `fault_type_slug` varchar(80) NOT NULL,
  `lesson_id` int,
  `fcu_id` int,
  CONSTRAINT `assessment_remediation_links_id` PRIMARY KEY(`id`)
);
