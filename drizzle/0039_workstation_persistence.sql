-- Motor Control Workstation persistence hardening.
-- 1) Creates the five workstation tables if absent (prod may already have them
--    via db:push — CREATE TABLE IF NOT EXISTS makes this a no-op there).
-- 2) Adds the UNIQUE index that makes recordEvent idempotency real (the router's
--    ER_DUP_ENTRY handler was dead code without it) plus hot-path indexes.
-- 3) Seeds the admin-role feature flag the handoff documented but never shipped
--    (guarded — inserts only if no admin role flag exists).

CREATE TABLE IF NOT EXISTS `workstation_feature_flags` (
  `id` int AUTO_INCREMENT NOT NULL,
  `entityType` enum('role','user','team') NOT NULL,
  `entityId` varchar(60) NOT NULL,
  `feature` varchar(60) NOT NULL DEFAULT 'motor_control_workstation',
  `enabled` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `workstation_feature_flags_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `workstation_attempts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `teamId` int,
  `scenarioId` varchar(60) NOT NULL,
  `faultId` varchar(60) NOT NULL,
  `scenarioVersion` varchar(20) NOT NULL DEFAULT '1.0',
  `workstationVersion` varchar(20) NOT NULL DEFAULT '1.0',
  `status` enum('not_started','in_progress','completed','abandoned') NOT NULL DEFAULT 'not_started',
  `machineState` json,
  `finalDiagnosis` varchar(500),
  `correctiveAction` varchar(500),
  `repairVerificationResult` varchar(255),
  `diagnosisCorrect` boolean,
  `correctiveActionCorrect` boolean,
  `safetyViolation` boolean NOT NULL DEFAULT false,
  `assignmentId` int,
  `startedAt` timestamp NOT NULL DEFAULT (now()),
  `lastActivityAt` timestamp NOT NULL DEFAULT (now()),
  `completedAt` timestamp,
  CONSTRAINT `workstation_attempts_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `workstation_diagnostic_events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `attemptId` int NOT NULL,
  `userId` int NOT NULL,
  `eventType` varchar(60) NOT NULL,
  `detail` json,
  `scenarioVersion` varchar(20),
  `componentRef` varchar(120),
  `idempotencyKey` varchar(64),
  `occurredAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `workstation_diagnostic_events_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `workstation_assignments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `teamId` int NOT NULL,
  `userId` int NOT NULL,
  `workstationId` varchar(60) NOT NULL DEFAULT 'motor_control_workstation',
  `scenarioId` varchar(60),
  `assignedBy` int NOT NULL,
  `dueAt` timestamp,
  `status` enum('not_started','in_progress','completed','overdue') NOT NULL DEFAULT 'not_started',
  `completedAttemptId` int,
  `completedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `workstation_assignments_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `workstation_validations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `managerId` int NOT NULL,
  `userId` int NOT NULL,
  `attemptId` int NOT NULL,
  `competency` varchar(80) NOT NULL,
  `decision` enum('validated','needs_additional_demonstration','needs_coaching','needs_safety_review') NOT NULL,
  `comment` varchar(500),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `workstation_validations_id` PRIMARY KEY(`id`)
);

-- Idempotency: one row per (attemptId, idempotencyKey). NULL keys are exempt per MySQL semantics.
CREATE UNIQUE INDEX `ws_evt_attempt_idem_uq` ON `workstation_diagnostic_events` (`attemptId`,`idempotencyKey`);

-- Hot-path indexes.
CREATE INDEX `ws_evt_attempt_time_idx` ON `workstation_diagnostic_events` (`attemptId`,`occurredAt`);
CREATE INDEX `ws_attempt_user_scenario_idx` ON `workstation_attempts` (`userId`,`scenarioId`,`status`);
CREATE INDEX `ws_assign_user_idx` ON `workstation_assignments` (`userId`,`status`);
CREATE INDEX `ws_flag_lookup_idx` ON `workstation_feature_flags` (`feature`,`entityType`,`entityId`);
CREATE INDEX `ws_validation_attempt_idx` ON `workstation_validations` (`attemptId`);

-- Admin-role pilot flag (the handoff documented this seed; it never shipped).
INSERT INTO `workstation_feature_flags` (`entityType`, `entityId`, `feature`, `enabled`)
SELECT 'role', 'admin', 'motor_control_workstation', true
WHERE NOT EXISTS (
  SELECT 1 FROM `workstation_feature_flags`
  WHERE `entityType` = 'role' AND `entityId` = 'admin' AND `feature` = 'motor_control_workstation'
);
