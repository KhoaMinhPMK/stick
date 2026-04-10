-- Fix: Raise lesson daily XP cap from 40 to 200
-- Root cause: 40 XP cap hit after 2 lessons (~18 XP each), lesson 3+ gets 0 XP
-- Fix also raises global cap from 100 to 300 to not overshadow new lesson cap
UPDATE `GameConfig` SET `value` = '200' WHERE `key` = 'xp_lesson_daily_cap';
UPDATE `GameConfig` SET `value` = '300' WHERE `key` = 'xp_global_daily_cap';
