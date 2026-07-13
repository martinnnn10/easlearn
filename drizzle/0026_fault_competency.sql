CREATE TABLE `fault_types` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slug` varchar(80) NOT NULL,
  `title` varchar(255) NOT NULL,
  `domain` enum('power','motor','safety','sensor','plc','vfd','network','integration') NOT NULL,
  `difficulty` enum('beginner','intermediate','advanced') NOT NULL,
  `industry` varchar(80),
  `root_cause_class` varchar(120),
  `scenario_slug` varchar(100),
  `is_published` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `fault_types_id` PRIMARY KEY(`id`),
  CONSTRAINT `fault_types_slug_unique` UNIQUE(`slug`)
);

CREATE TABLE `fault_competency_units` (
  `id` int AUTO_INCREMENT NOT NULL,
  `fault_type_id` int NOT NULL,
  `mode` enum('guided','unguided','assessment','capstone') NOT NULL,
  `pass_threshold` int NOT NULL DEFAULT 75,
  `time_limit_sec` int,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `fault_competency_units_id` PRIMARY KEY(`id`),
  CONSTRAINT `fault_competency_units_fault_mode_unique` UNIQUE(`fault_type_id`,`mode`)
);

CREATE TABLE `fault_competency_attempts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `fcu_id` int NOT NULL,
  `scenario_slug` varchar(100) NOT NULL,
  `lesson_id` int,
  `assessment_id` int,
  `play_mode` varchar(30),
  `score` int NOT NULL,
  `max_score` int NOT NULL,
  `percentage` int NOT NULL,
  `time_to_diagnose_sec` int NOT NULL,
  `tool_selection_score` int,
  `methodology_score` int,
  `safety_score` int,
  `first_step_correct` boolean,
  `hints_used` int NOT NULL DEFAULT 0,
  `root_cause_identified` varchar(120),
  `passed` boolean NOT NULL,
  `methodology_dimensions` json,
  `decision_log` json,
  `completed_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `fault_competency_attempts_id` PRIMARY KEY(`id`)
);

CREATE TABLE `fault_competency_mastery` (
  `user_id` int NOT NULL,
  `fcu_id` int NOT NULL,
  `best_percentage` int NOT NULL DEFAULT 0,
  `best_methodology` int NOT NULL DEFAULT 0,
  `attempts` int NOT NULL DEFAULT 0,
  `passed` boolean NOT NULL DEFAULT false,
  `mastered_at` timestamp,
  CONSTRAINT `fault_competency_mastery_pk` PRIMARY KEY(`user_id`,`fcu_id`)
);

CREATE TABLE `lesson_fcu_links` (
  `lesson_id` int NOT NULL,
  `fcu_id` int NOT NULL,
  `required` boolean NOT NULL DEFAULT true,
  CONSTRAINT `lesson_fcu_links_pk` PRIMARY KEY(`lesson_id`,`fcu_id`)
);
