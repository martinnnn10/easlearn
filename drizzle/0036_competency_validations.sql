-- Manager validations: the human ground-truth layer of the competency graph.

CREATE TABLE IF NOT EXISTS `competency_validations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `managerId` int NOT NULL,
  `userId` int NOT NULL,
  `domain` varchar(40) NOT NULL,
  `note` varchar(500),
  `validatedAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `competency_validations_id` PRIMARY KEY(`id`)
);
CREATE INDEX `competency_validations_user_idx` ON `competency_validations` (`userId`,`domain`);
CREATE INDEX `competency_validations_manager_idx` ON `competency_validations` (`managerId`);
