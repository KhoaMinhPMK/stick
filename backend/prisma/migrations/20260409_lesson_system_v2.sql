-- Migration: lesson_system_v2
-- Date: 2026-04-09
-- Description: Expand Lesson model, add LearningPath/Unit/Module hierarchy,
--              LessonAttempt, ExerciseAttempt, UserLessonProgress, UserPathProgress

-- 1. LearningPath table
CREATE TABLE IF NOT EXISTS `LearningPath` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `titleVi` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `coverImage` TEXT NULL,
    `level` VARCHAR(191) NOT NULL DEFAULT 'beginner',
    `isPremium` BOOLEAN NOT NULL DEFAULT false,
    `orderIndex` INTEGER NOT NULL DEFAULT 0,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `LearningPath_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Unit table
CREATE TABLE IF NOT EXISTS `Unit` (
    `id` VARCHAR(191) NOT NULL,
    `learningPathId` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `titleVi` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `coverImage` TEXT NULL,
    `orderIndex` INTEGER NOT NULL DEFAULT 0,
    `isPremium` BOOLEAN NOT NULL DEFAULT false,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Unit_learningPathId_slug_key`(`learningPathId`, `slug`),
    INDEX `Unit_learningPathId_orderIndex_idx`(`learningPathId`, `orderIndex`),
    PRIMARY KEY (`id`),
    CONSTRAINT `Unit_learningPathId_fkey` FOREIGN KEY (`learningPathId`) REFERENCES `LearningPath`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Module table
CREATE TABLE IF NOT EXISTS `Module` (
    `id` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `titleVi` VARCHAR(191) NULL,
    `orderIndex` INTEGER NOT NULL DEFAULT 0,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX `Module_unitId_orderIndex_idx`(`unitId`, `orderIndex`),
    PRIMARY KEY (`id`),
    CONSTRAINT `Module_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Expand Lesson table with new columns
ALTER TABLE `Lesson` ADD COLUMN `moduleId` VARCHAR(191) NULL;
ALTER TABLE `Lesson` ADD COLUMN `titleVi` VARCHAR(191) NULL;
ALTER TABLE `Lesson` ADD COLUMN `xpReward` INTEGER NOT NULL DEFAULT 15;
ALTER TABLE `Lesson` ADD COLUMN `isPremium` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `Lesson` ADD COLUMN `tags` TEXT NULL;
ALTER TABLE `Lesson` ADD COLUMN `aiGenerated` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `Lesson` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'published';
ALTER TABLE `Lesson` ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1;

-- Update duration default from 10 to 5
ALTER TABLE `Lesson` ALTER COLUMN `duration` SET DEFAULT 5;

-- Add indexes for new columns
CREATE INDEX `Lesson_moduleId_orderIndex_idx` ON `Lesson`(`moduleId`, `orderIndex`);
CREATE INDEX `Lesson_status_idx` ON `Lesson`(`status`);

-- Add foreign key for moduleId
ALTER TABLE `Lesson` ADD CONSTRAINT `Lesson_moduleId_fkey` FOREIGN KEY (`moduleId`) REFERENCES `Module`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. LessonAttempt table
CREATE TABLE IF NOT EXISTS `LessonAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `lessonId` VARCHAR(191) NOT NULL,
    `score` INTEGER NOT NULL DEFAULT 0,
    `starRating` INTEGER NOT NULL DEFAULT 0,
    `xpEarned` INTEGER NOT NULL DEFAULT 0,
    `comboMax` INTEGER NOT NULL DEFAULT 0,
    `duration` INTEGER NOT NULL DEFAULT 0,
    `answers` LONGTEXT NOT NULL,
    `isReview` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LessonAttempt_userId_lessonId_idx`(`userId`, `lessonId`),
    INDEX `LessonAttempt_userId_createdAt_idx`(`userId`, `createdAt` DESC),
    PRIMARY KEY (`id`),
    CONSTRAINT `LessonAttempt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `LessonAttempt_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 6. ExerciseAttempt table
CREATE TABLE IF NOT EXISTS `ExerciseAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `lessonId` VARCHAR(191) NOT NULL,
    `exerciseIndex` INTEGER NOT NULL,
    `exerciseType` VARCHAR(191) NOT NULL,
    `answer` TEXT NOT NULL,
    `correct` BOOLEAN NOT NULL DEFAULT false,
    `points` INTEGER NOT NULL DEFAULT 0,
    `timeSpent` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ExerciseAttempt_userId_exerciseType_idx`(`userId`, `exerciseType`),
    INDEX `ExerciseAttempt_userId_lessonId_idx`(`userId`, `lessonId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `ExerciseAttempt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 7. UserLessonProgress table
CREATE TABLE IF NOT EXISTS `UserLessonProgress` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `lessonId` VARCHAR(191) NOT NULL,
    `bestScore` INTEGER NOT NULL DEFAULT 0,
    `starRating` INTEGER NOT NULL DEFAULT 0,
    `totalAttempts` INTEGER NOT NULL DEFAULT 0,
    `totalXpEarned` INTEGER NOT NULL DEFAULT 0,
    `firstCompletedAt` DATETIME(3) NULL,
    `lastAttemptAt` DATETIME(3) NULL,

    UNIQUE INDEX `UserLessonProgress_userId_lessonId_key`(`userId`, `lessonId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `UserLessonProgress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 8. UserPathProgress table
CREATE TABLE IF NOT EXISTS `UserPathProgress` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `learningPathId` VARCHAR(191) NOT NULL,
    `unitsCompleted` INTEGER NOT NULL DEFAULT 0,
    `totalUnits` INTEGER NOT NULL DEFAULT 0,
    `currentUnitId` VARCHAR(191) NULL,
    `currentLessonId` VARCHAR(191) NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    UNIQUE INDEX `UserPathProgress_userId_learningPathId_key`(`userId`, `learningPathId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `UserPathProgress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
