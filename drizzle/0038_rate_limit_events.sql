-- Distributed rate limiting for AI endpoints (mentor.coach / mentor.operator).
-- Sliding-window counter shared across app instances; in-memory fallback covers
-- local/dev when the DB is unavailable.

CREATE TABLE IF NOT EXISTS `rate_limit_events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `bucket` varchar(40) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `rate_limit_events_id` PRIMARY KEY(`id`)
);
CREATE INDEX `rate_limit_events_user_bucket_idx` ON `rate_limit_events` (`userId`,`bucket`,`createdAt`);
