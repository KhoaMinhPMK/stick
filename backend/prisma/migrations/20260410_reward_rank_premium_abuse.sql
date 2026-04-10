-- ============================================================
-- STICK Phase 1: Reward Ledger, Rank Ledger, Premium Grants,
--                Abuse Flags, Daily/Weekly Aggregates,
--                Leaderboard Snapshots, Admin Game Config
-- ============================================================

-- 1. RewardLedger — every XP-granting event
CREATE TABLE IF NOT EXISTS `RewardLedger` (
  `id`              VARCHAR(36) NOT NULL,
  `userId`          VARCHAR(36) NOT NULL,
  `eventType`       VARCHAR(60) NOT NULL,
  `sourceType`      VARCHAR(40) NOT NULL,
  `sourceId`        VARCHAR(36) NULL,
  `amount`          INT NOT NULL DEFAULT 0,
  `bucket`          VARCHAR(30) NOT NULL,
  `dayKey`          DATE NOT NULL,
  `idempotencyKey`  VARCHAR(120) NOT NULL,
  `integrityStatus` VARCHAR(20) NOT NULL DEFAULT 'clear',
  `metadata`        JSON NULL,
  `createdAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reward_idempotency` (`idempotencyKey`),
  INDEX `idx_reward_user_day` (`userId`, `dayKey`),
  INDEX `idx_reward_user_bucket_day` (`userId`, `bucket`, `dayKey`),
  INDEX `idx_reward_integrity` (`integrityStatus`),
  CONSTRAINT `fk_reward_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. RankLedger — every ranked-score event (verified learning only)
CREATE TABLE IF NOT EXISTS `RankLedger` (
  `id`                       VARCHAR(36) NOT NULL,
  `userId`                   VARCHAR(36) NOT NULL,
  `eventType`                VARCHAR(60) NOT NULL,
  `sourceType`               VARCHAR(40) NOT NULL,
  `sourceId`                 VARCHAR(36) NULL,
  `rankedPoints`             INT NOT NULL DEFAULT 0,
  `dayKey`                   DATE NOT NULL,
  `idempotencyKey`           VARCHAR(120) NOT NULL,
  `integrityStatus`          VARCHAR(20) NOT NULL DEFAULT 'clear',
  `qualityScore`             DECIMAL(5,2) NULL,
  `verifiedLearningMinutes`  DECIMAL(8,2) NULL DEFAULT 0,
  `createdAt`                DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rank_idempotency` (`idempotencyKey`),
  INDEX `idx_rank_user_day` (`userId`, `dayKey`),
  INDEX `idx_rank_day_points` (`dayKey`, `rankedPoints` DESC),
  INDEX `idx_rank_integrity` (`integrityStatus`),
  CONSTRAINT `fk_rank_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. DailyUserAggregate — materialized per user per day
CREATE TABLE IF NOT EXISTS `DailyUserAggregate` (
  `id`                       VARCHAR(36) NOT NULL,
  `userId`                   VARCHAR(36) NOT NULL,
  `dayKey`                   DATE NOT NULL,
  `xpEarned`                 INT NOT NULL DEFAULT 0,
  `rankedScore`              INT NOT NULL DEFAULT 0,
  `journalXp`               INT NOT NULL DEFAULT 0,
  `lessonXp`                INT NOT NULL DEFAULT 0,
  `reviewXp`                INT NOT NULL DEFAULT 0,
  `practiceXp`              INT NOT NULL DEFAULT 0,
  `journalRanked`           INT NOT NULL DEFAULT 0,
  `lessonRanked`            INT NOT NULL DEFAULT 0,
  `reviewRanked`            INT NOT NULL DEFAULT 0,
  `practiceRanked`          INT NOT NULL DEFAULT 0,
  `verifiedLearningMinutes` DECIMAL(8,2) NOT NULL DEFAULT 0,
  `verifiedEventCount`      INT NOT NULL DEFAULT 0,
  `integrityState`          VARCHAR(20) NOT NULL DEFAULT 'clear',
  `updatedAt`               DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_daily_user_day` (`userId`, `dayKey`),
  INDEX `idx_daily_day_ranked` (`dayKey`, `rankedScore` DESC),
  INDEX `idx_daily_user` (`userId`),
  CONSTRAINT `fk_daily_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. WeeklyUserAggregate — materialized per user per ISO week
CREATE TABLE IF NOT EXISTS `WeeklyUserAggregate` (
  `id`                       VARCHAR(36) NOT NULL,
  `userId`                   VARCHAR(36) NOT NULL,
  `weekKey`                  VARCHAR(10) NOT NULL,  -- e.g. "2026-W15"
  `xpEarned`                 INT NOT NULL DEFAULT 0,
  `rankedScore`              INT NOT NULL DEFAULT 0,
  `verifiedLearningMinutes`  DECIMAL(8,2) NOT NULL DEFAULT 0,
  `verifiedEventCount`       INT NOT NULL DEFAULT 0,
  `daysActive`               INT NOT NULL DEFAULT 0,
  `updatedAt`                DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_weekly_user_week` (`userId`, `weekKey`),
  INDEX `idx_weekly_week_ranked` (`weekKey`, `rankedScore` DESC),
  CONSTRAINT `fk_weekly_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. LeaderboardSnapshot — frozen daily/weekly leaderboard
CREATE TABLE IF NOT EXISTS `LeaderboardSnapshot` (
  `id`            VARCHAR(36) NOT NULL,
  `period`        VARCHAR(10) NOT NULL,  -- "daily" | "weekly"
  `periodKey`     VARCHAR(20) NOT NULL,  -- "2026-04-09" or "2026-W15"
  `userId`        VARCHAR(36) NOT NULL,
  `rank`          INT NOT NULL,
  `rankedScore`   INT NOT NULL DEFAULT 0,
  `xpEarned`      INT NOT NULL DEFAULT 0,
  `tieBreakData`  JSON NULL,
  `grantedDayPass` BOOLEAN NOT NULL DEFAULT FALSE,
  `createdAt`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_snapshot_period_user` (`period`, `periodKey`, `userId`),
  INDEX `idx_snapshot_period_rank` (`period`, `periodKey`, `rank`),
  CONSTRAINT `fk_snapshot_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. PremiumGrant — tracks all premium entitlements
CREATE TABLE IF NOT EXISTS `PremiumGrant` (
  `id`            VARCHAR(36) NOT NULL,
  `userId`        VARCHAR(36) NOT NULL,
  `grantType`     VARCHAR(30) NOT NULL,  -- "paid" | "day_pass_top3" | "admin" | "trial"
  `startsAt`      DATETIME(3) NOT NULL,
  `endsAt`        DATETIME(3) NULL,
  `sourceDayKey`  DATE NULL,
  `sourceRank`    INT NULL,
  `status`        VARCHAR(20) NOT NULL DEFAULT 'active',  -- "active" | "expired" | "revoked"
  `reason`        VARCHAR(200) NULL,
  `createdAt`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_grant_user_status` (`userId`, `status`),
  INDEX `idx_grant_type_status` (`grantType`, `status`),
  INDEX `idx_grant_ends` (`endsAt`),
  CONSTRAINT `fk_grant_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. AbuseFlag — fraud / spam detection
CREATE TABLE IF NOT EXISTS `AbuseFlag` (
  `id`          VARCHAR(36) NOT NULL,
  `userId`      VARCHAR(36) NOT NULL,
  `scope`       VARCHAR(20) NOT NULL,  -- "event" | "day" | "account"
  `severity`    VARCHAR(20) NOT NULL,  -- "low" | "medium" | "high" | "critical"
  `code`        VARCHAR(60) NOT NULL,
  `sourceId`    VARCHAR(36) NULL,
  `dayKey`      DATE NULL,
  `details`     JSON NULL,
  `status`      VARCHAR(20) NOT NULL DEFAULT 'open',  -- "open" | "reviewed" | "dismissed" | "confirmed"
  `reviewedBy`  VARCHAR(36) NULL,
  `reviewedAt`  DATETIME(3) NULL,
  `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_abuse_user` (`userId`),
  INDEX `idx_abuse_user_severity` (`userId`, `severity`),
  INDEX `idx_abuse_status` (`status`),
  INDEX `idx_abuse_code` (`code`),
  CONSTRAINT `fk_abuse_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. GameConfig — admin-editable caps, thresholds, feature flags
CREATE TABLE IF NOT EXISTS `GameConfig` (
  `key`         VARCHAR(100) NOT NULL,
  `value`       TEXT NOT NULL,
  `type`        VARCHAR(20) NOT NULL DEFAULT 'number',  -- "number" | "string" | "boolean" | "json"
  `category`    VARCHAR(40) NOT NULL DEFAULT 'general',
  `label`       VARCHAR(120) NULL,
  `description` TEXT NULL,
  `updatedAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `updatedBy`   VARCHAR(36) NULL,
  PRIMARY KEY (`key`),
  INDEX `idx_gameconfig_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. PremiumPopupEvent — tracks popup impressions + timing psychology
CREATE TABLE IF NOT EXISTS `PremiumPopupEvent` (
  `id`          VARCHAR(36) NOT NULL,
  `userId`      VARCHAR(36) NOT NULL,
  `triggerType` VARCHAR(60) NOT NULL,  -- "post_feedback" | "streak_3" | "day_pass_expired" | "near_top3" | "serious_learner"
  `action`      VARCHAR(30) NOT NULL DEFAULT 'shown',  -- "shown" | "dismissed" | "clicked" | "converted"
  `metadata`    JSON NULL,
  `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_popup_user` (`userId`),
  INDEX `idx_popup_user_trigger` (`userId`, `triggerType`),
  INDEX `idx_popup_trigger_action` (`triggerType`, `action`),
  CONSTRAINT `fk_popup_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Add eligibility + rank fields to User
ALTER TABLE `User` ADD COLUMN `eligibleForRank` BOOLEAN NOT NULL DEFAULT TRUE AFTER `premiumUntil`;
ALTER TABLE `User` ADD COLUMN `totalRankedScore` INT NOT NULL DEFAULT 0 AFTER `eligibleForRank`;
ALTER TABLE `User` ADD COLUMN `accountTrustLevel` VARCHAR(20) NOT NULL DEFAULT 'normal' AFTER `totalRankedScore`;

-- 11. Seed default GameConfig values
INSERT INTO `GameConfig` (`key`, `value`, `type`, `category`, `label`, `description`) VALUES
-- XP Caps
('xp_global_daily_cap',     '100', 'number', 'xp_caps', 'Global Daily XP Cap', 'Maximum XP a user can earn per day across all buckets'),
('xp_journal_daily_cap',    '15',  'number', 'xp_caps', 'Journal Daily XP Cap', 'Maximum XP from journal activities per day'),
('xp_lesson_daily_cap',     '40',  'number', 'xp_caps', 'Lesson Daily XP Cap', 'Maximum XP from lesson activities per day'),
('xp_review_daily_cap',     '25',  'number', 'xp_caps', 'Review Daily XP Cap', 'Maximum XP from vocabulary review per day'),
('xp_practice_daily_cap',   '20',  'number', 'xp_caps', 'Practice Daily XP Cap', 'Maximum XP from practice sessions per day'),
-- Ranked Caps
('rank_global_daily_cap',   '60',  'number', 'rank_caps', 'Global Daily Ranked Cap', 'Maximum ranked score per day'),
('rank_journal_daily_cap',  '12',  'number', 'rank_caps', 'Journal Daily Ranked Cap', 'Maximum ranked score from journal per day'),
('rank_lesson_daily_cap',   '24',  'number', 'rank_caps', 'Lesson Daily Ranked Cap', 'Maximum ranked score from lessons per day'),
('rank_review_daily_cap',   '16',  'number', 'rank_caps', 'Review Daily Ranked Cap', 'Maximum ranked score from review per day'),
('rank_practice_daily_cap', '12',  'number', 'rank_caps', 'Practice Daily Ranked Cap', 'Maximum ranked score from practice per day'),
-- XP Amounts
('xp_journal_verified',          '10', 'number', 'xp_amounts', 'XP: Journal Verified', 'XP awarded for verified journal submission'),
('xp_lesson_first_complete',     '15', 'number', 'xp_amounts', 'XP: Lesson First Complete', 'XP for first completion of a lesson'),
('xp_lesson_high_score_bonus',   '3',  'number', 'xp_amounts', 'XP: Lesson High Score Bonus', 'Bonus XP for score >= 90%'),
('xp_lesson_review',             '6',  'number', 'xp_amounts', 'XP: Lesson Review', 'XP for reviewing a completed lesson (1x/day)'),
('xp_vocab_first_recall',        '4',  'number', 'xp_amounts', 'XP: Vocab First Recall', 'XP for first successful recall of a vocab item'),
('xp_vocab_due_recall',          '2',  'number', 'xp_amounts', 'XP: Vocab Due Recall', 'XP for subsequent successful recall'),
('xp_practice_session',          '5',  'number', 'xp_amounts', 'XP: Practice Session', 'XP per practice session'),
-- Ranked Amounts
('rank_journal_verified',        '8',  'number', 'rank_amounts', 'Rank: Journal Verified', 'Ranked score for verified journal'),
('rank_feedback_verified',       '4',  'number', 'rank_amounts', 'Rank: Feedback Verified', 'Ranked score for viewing AI feedback'),
('rank_lesson_first_complete',   '12', 'number', 'rank_amounts', 'Rank: Lesson First Complete', 'Ranked score for first lesson completion'),
('rank_lesson_high_score_bonus', '3',  'number', 'rank_amounts', 'Rank: Lesson High Score Bonus', 'Bonus ranked for score >= 90%'),
('rank_lesson_review',           '5',  'number', 'rank_amounts', 'Rank: Lesson Review', 'Ranked score for lesson review'),
('rank_vocab_first_recall',      '3',  'number', 'rank_amounts', 'Rank: Vocab First Recall', 'Ranked for first vocab recall'),
('rank_vocab_due_recall',        '1',  'number', 'rank_amounts', 'Rank: Vocab Due Recall', 'Ranked for subsequent vocab recall'),
('rank_practice_session',        '4',  'number', 'rank_amounts', 'Rank: Practice Session', 'Ranked per practice session'),
-- Quality Multiplier
('rank_quality_multiplier_high', '1.1', 'number', 'rank_rules', 'Quality Multiplier (High)', 'Multiplier for high-quality submissions'),
('rank_quality_threshold',       '90',  'number', 'rank_rules', 'Quality Threshold', 'Score threshold to trigger quality multiplier'),
-- Anti-Cheat
('abuse_journal_min_chars',      '60',  'number', 'anti_cheat', 'Journal Min Chars', 'Minimum characters for journal to be verified'),
('abuse_journal_min_words',      '15',  'number', 'anti_cheat', 'Journal Min Words', 'Minimum words for journal to be verified'),
('abuse_journal_similarity_max', '0.9', 'number', 'anti_cheat', 'Journal Similarity Max', 'Max similarity with recent journals (0-1)'),
('abuse_practice_min_duration',  '90',  'number', 'anti_cheat', 'Practice Min Duration (sec)', 'Minimum seconds for practice to count'),
('abuse_practice_min_accuracy',  '0.6', 'number', 'anti_cheat', 'Practice Min Accuracy', 'Minimum accuracy (0-1) for practice reward'),
('abuse_practice_max_sessions',  '2',   'number', 'anti_cheat', 'Practice Max Sessions/Type/Day', 'Max rewardable practice sessions per type per day'),
('abuse_fresh_account_days',     '3',   'number', 'anti_cheat', 'Fresh Account Days', 'Days before account is eligible for top 3'),
('abuse_min_events_for_rank',    '2',   'number', 'anti_cheat', 'Min Events for Top 3', 'Min verified events in day to be eligible for top 3'),
-- Day Pass
('daypass_top3_enabled',         'true',  'boolean', 'day_pass', 'Top 3 Day Pass Enabled', 'Enable daily top 3 premium day pass grants'),
('daypass_min_ranked_score',     '18',    'number',  'day_pass', 'Min Ranked Score for Day Pass', 'Minimum ranked score to be eligible for day pass'),
('daypass_low_volume_threshold', '20',    'number',  'day_pass', 'Low Volume Threshold', 'Min eligible users to grant day pass without score gate'),
('daypass_grant_hour',           '0',     'number',  'day_pass', 'Grant Hour (VN)', 'Hour (0-23) in VN timezone to run daily finalization'),
('daypass_grant_minute',         '5',     'number',  'day_pass', 'Grant Minute', 'Minute (0-59) to run daily finalization'),
-- Leaderboard Finalization
('leaderboard_finalize_enabled', 'true',  'boolean', 'leaderboard', 'Auto Finalize Leaderboard', 'Enable automatic daily leaderboard finalization'),
('leaderboard_top_count',        '3',     'number',  'leaderboard', 'Top N for Day Pass', 'Number of top users to receive premium day pass'),
-- Premium Popup Psychology
('popup_cooldown_hours',                '24',   'number',  'popup_psychology', 'Popup Cooldown (hours)', 'Minimum hours between premium popups'),
('popup_max_per_week',                  '3',    'number',  'popup_psychology', 'Max Popups Per Week', 'Maximum premium popups shown per user per week'),
('popup_post_feedback_enabled',         'true', 'boolean', 'popup_psychology', 'Post-Feedback Popup', 'Show premium popup after first feedback view'),
('popup_streak_trigger_days',           '3',    'number',  'popup_psychology', 'Streak Trigger Days', 'Show popup after N consecutive days'),
('popup_day_pass_expired_enabled',      'true', 'boolean', 'popup_psychology', 'Day-Pass Expired Popup', 'Show popup when day pass expires'),
('popup_near_top3_enabled',             'true', 'boolean', 'popup_psychology', 'Near Top 3 Popup', 'Show popup when user is close to top 3'),
('popup_serious_learner_days',          '5',    'number',  'popup_psychology', 'Serious Learner Days', 'Days of consistent learning to trigger upsell'),
('popup_dismiss_backoff_multiplier',    '2',    'number',  'popup_psychology', 'Dismiss Backoff Multiplier', 'Multiply cooldown each time user dismisses')
ON DUPLICATE KEY UPDATE `key` = `key`;
