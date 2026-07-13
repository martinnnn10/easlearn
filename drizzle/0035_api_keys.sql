-- Public API keys: the platform/integration layer (OEM, CMMS, enterprise).

CREATE TABLE IF NOT EXISTS `api_keys` (
  `id` int AUTO_INCREMENT NOT NULL,
  `ownerId` int NOT NULL,
  `label` varchar(120) NOT NULL,
  `keyHash` varchar(64) NOT NULL,
  `keyPrefix` varchar(20) NOT NULL,
  `scopes` varchar(255) NOT NULL DEFAULT 'verify',
  `active` boolean NOT NULL DEFAULT true,
  `lastUsedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
  CONSTRAINT `api_keys_keyHash_unique` UNIQUE(`keyHash`)
);
CREATE INDEX `api_keys_owner_idx` ON `api_keys` (`ownerId`);
