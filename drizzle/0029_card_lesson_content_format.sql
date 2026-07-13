-- Mark card-format ILU lessons; legacy markdown superseded by shared/lessonDecks bundle.
ALTER TABLE `course_lessons`
  ADD COLUMN `contentFormat` varchar(20) NOT NULL DEFAULT 'markdown' AFTER `content`;
