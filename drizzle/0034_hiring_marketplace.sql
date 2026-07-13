-- Hiring marketplace: competency-gated jobs + applications (the employment-transaction lever).

CREATE TABLE IF NOT EXISTS `job_postings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `employerId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `company` varchar(255) NOT NULL,
  `location` varchar(255),
  `remote` boolean NOT NULL DEFAULT false,
  `description` text NOT NULL,
  `requiredDomain` varchar(40) NOT NULL,
  `minCompetency` int NOT NULL DEFAULT 60,
  `salaryMin` int,
  `salaryMax` int,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `job_postings_id` PRIMARY KEY(`id`)
);
CREATE INDEX `job_postings_status_idx` ON `job_postings` (`status`,`requiredDomain`);
CREATE INDEX `job_postings_employer_idx` ON `job_postings` (`employerId`);

CREATE TABLE IF NOT EXISTS `job_applications` (
  `id` int AUTO_INCREMENT NOT NULL,
  `jobId` int NOT NULL,
  `userId` int NOT NULL,
  `status` enum('applied','reviewing','interview','hired','rejected') NOT NULL DEFAULT 'applied',
  `competencySnapshot` json,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `job_applications_id` PRIMARY KEY(`id`),
  CONSTRAINT `job_applications_job_user_uq` UNIQUE(`jobId`,`userId`)
);
CREATE INDEX `job_applications_job_idx` ON `job_applications` (`jobId`);
CREATE INDEX `job_applications_user_idx` ON `job_applications` (`userId`);
