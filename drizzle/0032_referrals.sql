-- Referrals: the invite-a-friend viral loop (K-factor).

ALTER TABLE `users` ADD COLUMN `referralCode` varchar(32) AFTER `companyId`;

CREATE TABLE IF NOT EXISTS `referrals` (
  `id` int AUTO_INCREMENT NOT NULL,
  `referrerId` int NOT NULL,
  `referredUserId` int NOT NULL,
  `code` varchar(32) NOT NULL,
  `status` enum('pending','qualified') NOT NULL DEFAULT 'pending',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
  CONSTRAINT `referrals_referredUserId_unique` UNIQUE(`referredUserId`)
);

CREATE INDEX `referrals_referrer_idx` ON `referrals` (`referrerId`);
CREATE INDEX `referrals_code_idx` ON `referrals` (`code`);
