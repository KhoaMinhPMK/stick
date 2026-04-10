-- Fix stale AI config values left from the Groq/llama era
-- Now all AI settings actually control backend behavior

-- 1. Fix ai_model: was "llama-3.3-70b-versatile", should be "gpt-4.1"
UPDATE `AppConfig` SET `value` = 'gpt-4.1', `updatedAt` = NOW()
WHERE `key` = 'ai_model';

-- 2. Fix ai_max_tokens: was "2000", actual default is 2500
UPDATE `AppConfig` SET `value` = '2500', `updatedAt` = NOW()
WHERE `key` = 'ai_max_tokens';

-- 3. Rename ai_system_prompt → ai_tutor_style and set proper default
UPDATE `AppConfig`
SET `key` = 'ai_tutor_style',
    `value` = 'You are a warm, encouraging English tutor for the STICK app — a daily micro-learning tool that helps Vietnamese learners think in English.',
    `updatedAt` = NOW()
WHERE `key` = 'ai_system_prompt';

-- 4. Ensure ai_temperature is correct (0.3)
UPDATE `AppConfig` SET `value` = '0.3', `updatedAt` = NOW()
WHERE `key` = 'ai_temperature';
