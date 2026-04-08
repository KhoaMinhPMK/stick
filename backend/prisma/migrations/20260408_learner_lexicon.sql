-- Learner Lexicon: per-user expression knowledge memory
-- Applied: 2026-04-08

CREATE TABLE IF NOT EXISTS `LearnerLexicon` (
  `id`                    VARCHAR(36)  NOT NULL,
  `userId`                VARCHAR(36)  NOT NULL,
  `expression`            VARCHAR(255) NOT NULL,
  `expressionType`        VARCHAR(20)  NOT NULL DEFAULT 'word',
  `aiSuggestedCount`      INT          NOT NULL DEFAULT 0,
  `userSavedCount`        INT          NOT NULL DEFAULT 0,
  `userUsedCount`         INT          NOT NULL DEFAULT 0,
  `correctUseCount`       INT          NOT NULL DEFAULT 0,
  `incorrectUseCount`     INT          NOT NULL DEFAULT 0,
  `correctUseSessions`    INT          NOT NULL DEFAULT 0,
  `reviewSuccessCount`    INT          NOT NULL DEFAULT 0,
  `reviewFailCount`       INT          NOT NULL DEFAULT 0,
  `knowledgeState`        VARCHAR(20)  NOT NULL DEFAULT 'unseen',
  `relatedNotebookItemId` VARCHAR(36)  NULL,
  `lastJournalId`         VARCHAR(36)  NULL,
  `firstSeenAt`           DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lastSuggestedAt`       DATETIME(3)  NULL,
  `lastUsedAt`            DATETIME(3)  NULL,
  `lastReviewedAt`        DATETIME(3)  NULL,
  `createdAt`             DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`             DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `LearnerLexicon_userId_expression` (`userId`, `expression`),
  INDEX `LearnerLexicon_userId_state` (`userId`, `knowledgeState`),
  INDEX `LearnerLexicon_userId_correctUse` (`userId`, `correctUseCount` DESC),
  CONSTRAINT `LearnerLexicon_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed from existing VocabNotebookItem to bootstrap lexicon
INSERT INTO `LearnerLexicon`
  (`id`, `userId`, `expression`, `expressionType`, `userSavedCount`,
   `knowledgeState`, `firstSeenAt`, `createdAt`, `updatedAt`)
SELECT
  UUID(),
  `userId`,
  LOWER(TRIM(`word`)),
  'word',
  1,
  CASE
    WHEN `mastery` = 'mastered' THEN 'stable'
    WHEN `mastery` = 'learning' THEN 'learning'
    ELSE 'noticed'
  END,
  `createdAt`,
  NOW(3),
  NOW(3)
FROM `VocabNotebookItem`
WHERE `word` IS NOT NULL AND TRIM(`word`) != ''
ON DUPLICATE KEY UPDATE `userSavedCount` = `userSavedCount` + 1;
