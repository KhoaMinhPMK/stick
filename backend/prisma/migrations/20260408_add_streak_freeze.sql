-- Migration: add_streak_freeze
-- Date: 2026-04-08
-- Description: Add StreakFreeze table for streak buff (freeze/shield) system

CREATE TABLE `StreakFreeze` (
    `id`          VARCHAR(191) NOT NULL,
    `userId`      VARCHAR(191) NOT NULL,
    `source`      VARCHAR(50)  NOT NULL DEFAULT 'admin',
    `note`        TEXT         NULL,
    `grantedBy`   VARCHAR(191) NULL,
    `grantedAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt`   DATETIME(3)  NULL,
    `usedAt`      DATETIME(3)  NULL,
    `usedForDate` DATE         NULL,

    INDEX `StreakFreeze_userId_idx`(`userId`),
    INDEX `StreakFreeze_userId_usedAt_idx`(`userId`, `usedAt`),
    CONSTRAINT `StreakFreeze_userId_fkey`
        FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
