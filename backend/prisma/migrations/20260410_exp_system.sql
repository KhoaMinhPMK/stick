-- Migration: EXP System
-- Adds cached XP/streak fields to User and creates UserXpLog table

-- 1. Add cached fields to User
ALTER TABLE `User`
  ADD COLUMN IF NOT EXISTS `totalXp`       INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `currentStreak` INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `bestStreak`    INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `lastActiveDate` DATE NULL;

-- 2. Create UserXpLog table
CREATE TABLE IF NOT EXISTS `UserXpLog` (
  `id`          VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId`      VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount`      INT NOT NULL,
  `source`      VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `journalId`   VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `UserXpLog_userId_createdAt_idx` (`userId`, `createdAt` DESC),
  CONSTRAINT `UserXpLog_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE=InnoDB;

-- 3. Backfill totalXp from existing ProgressDaily records
UPDATE `User` u
  SET u.`totalXp` = (
    SELECT COALESCE(SUM(pd.`xpEarned`), 0)
    FROM `ProgressDaily` pd
    WHERE pd.`userId` = u.`id`
  );
