-- Migration: add_admin_models
-- Date: 2026-03-31
-- Description: Add role to User, create DailyPrompt, AILog, AppConfig tables

-- 1. Add role column to User
ALTER TABLE `User` ADD COLUMN `role` VARCHAR(191) NOT NULL DEFAULT 'user';

-- 1b. Add status column to User
ALTER TABLE `User` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'active';

-- 2. Create DailyPrompt table
CREATE TABLE `DailyPrompt` (
    `id` VARCHAR(191) NOT NULL,
    `publishDate` DATE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `internalTitle` VARCHAR(191) NOT NULL,
    `promptVi` TEXT NOT NULL,
    `promptEn` TEXT NOT NULL,
    `followUp` TEXT NULL,
    `level` VARCHAR(191) NOT NULL DEFAULT 'basic',
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DailyPrompt_publishDate_key`(`publishDate`),
    INDEX `DailyPrompt_status_publishDate_idx`(`status`, `publishDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Create AILog table
CREATE TABLE `AILog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `journalId` VARCHAR(191) NULL,
    `inputText` TEXT NOT NULL,
    `outputText` TEXT NULL,
    `model` VARCHAR(191) NOT NULL DEFAULT 'llama-3.3-70b-versatile',
    `statusCode` INTEGER NOT NULL DEFAULT 200,
    `latencyMs` INTEGER NOT NULL DEFAULT 0,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AILog_createdAt_idx`(`createdAt` DESC),
    INDEX `AILog_userId_idx`(`userId`),
    INDEX `AILog_statusCode_idx`(`statusCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Create AppConfig table
CREATE TABLE `AppConfig` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` LONGTEXT NOT NULL,
    `updatedBy` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AppConfig_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 5. Seed initial AppConfig
INSERT INTO `AppConfig` (`id`, `key`, `value`, `updatedAt`) VALUES
(UUID(), 'ai_system_prompt', 'You are an expert English language tutor for the STICK language-learning app.', NOW()),
(UUID(), 'ai_model', 'llama-3.3-70b-versatile', NOW()),
(UUID(), 'ai_temperature', '0.3', NOW()),
(UUID(), 'ai_max_tokens', '2000', NOW()),
(UUID(), 'maintenance_mode', 'false', NOW());
