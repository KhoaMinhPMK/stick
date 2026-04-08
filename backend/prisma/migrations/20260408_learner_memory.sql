-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260408_learner_memory
-- Adds:
--   1. LearnerErrorPattern — per-user recurring error tracking for AI context
--   2. VocabNotebookItem.sourceJournalId — which journal produced this word
--   3. VocabNotebookItem.fromAI — whether this item was imported from AI feedback
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. LearnerErrorPattern table
CREATE TABLE IF NOT EXISTS `LearnerErrorPattern` (
  `id`           VARCHAR(36)   NOT NULL,
  `userId`       VARCHAR(36)   NOT NULL,
  `errorType`    VARCHAR(100)  NOT NULL,
  `count`        INT           NOT NULL DEFAULT 1,
  `lastSeenAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `exampleError` LONGTEXT      NULL,
  `updatedAt`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `LearnerErrorPattern_userId_errorType_key` (`userId`, `errorType`),
  KEY `LearnerErrorPattern_userId_count_idx` (`userId`, `count` DESC),
  CONSTRAINT `LearnerErrorPattern_user_fk`
    FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. New columns on VocabNotebookItem
ALTER TABLE `VocabNotebookItem`
  ADD COLUMN IF NOT EXISTS `sourceJournalId` VARCHAR(36) NULL AFTER `notes`,
  ADD COLUMN IF NOT EXISTS `fromAI` TINYINT(1) NOT NULL DEFAULT 0 AFTER `sourceJournalId`;
