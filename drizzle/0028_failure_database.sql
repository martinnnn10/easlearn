CREATE TABLE `failure_industries` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slug` varchar(60) NOT NULL,
  `title` varchar(120) NOT NULL,
  CONSTRAINT `failure_industries_id` PRIMARY KEY(`id`),
  CONSTRAINT `failure_industries_slug_unique` UNIQUE(`slug`)
);

CREATE TABLE `failure_machines` (
  `id` int AUTO_INCREMENT NOT NULL,
  `industry_id` int NOT NULL,
  `slug` varchar(80) NOT NULL,
  `title` varchar(120) NOT NULL,
  CONSTRAINT `failure_machines_id` PRIMARY KEY(`id`)
);

CREATE TABLE `failure_modes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slug` varchar(100) NOT NULL,
  `industry_id` int NOT NULL,
  `machine_id` int,
  `title` varchar(255) NOT NULL,
  `symptoms` json NOT NULL,
  `likely_causes` json NOT NULL,
  `diagnostic_procedure` json NOT NULL,
  `downtime_cost_band` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `fault_type_id` int,
  `is_published` boolean NOT NULL DEFAULT false,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `failure_modes_id` PRIMARY KEY(`id`),
  CONSTRAINT `failure_modes_slug_unique` UNIQUE(`slug`)
);

CREATE TABLE `failure_mode_links` (
  `failure_mode_id` int NOT NULL,
  `link_type` enum('lesson','simulator','assessment','fcu') NOT NULL,
  `link_id` varchar(100) NOT NULL,
  CONSTRAINT `failure_mode_links_pk` PRIMARY KEY(`failure_mode_id`,`link_type`,`link_id`)
);
