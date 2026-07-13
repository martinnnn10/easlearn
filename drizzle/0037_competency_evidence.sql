-- Assessment Spine: the evidence ledger connecting the Learning Engine to the
-- Manufacturing Competency Graph. One row per important learner action, from any
-- source, preserving why a competency score changed. See shared/assessmentSpine.ts.

CREATE TABLE IF NOT EXISTS `competency_evidence` (
  `id` int AUTO_INCREMENT NOT NULL,
  `learnerId` int NOT NULL,
  `sourceType` enum('lesson','simulation','review','ai_mentor','manager_validation') NOT NULL,
  `evidenceType` varchar(40) NOT NULL,
  `mechanicId` varchar(48),
  `domain` varchar(40) NOT NULL,
  `skill` varchar(80),
  `lessonId` varchar(120),
  `courseId` varchar(120),
  `competencyId` varchar(120),
  `actionTaken` varchar(255),
  `correctness` varchar(12),
  `reasoningQuality` varchar(12),
  `methodologyScore` int,
  `confidenceScore` int,
  `safetyFlag` boolean NOT NULL DEFAULT false,
  `attemptNumber` int,
  `timeToDecisionMs` int,
  `detail` json,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `competency_evidence_id` PRIMARY KEY(`id`)
);
CREATE INDEX `competency_evidence_learner_domain_idx` ON `competency_evidence` (`learnerId`,`domain`);
CREATE INDEX `competency_evidence_source_idx` ON `competency_evidence` (`sourceType`);
CREATE INDEX `competency_evidence_created_idx` ON `competency_evidence` (`createdAt`);
