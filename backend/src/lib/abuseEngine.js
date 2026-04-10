/**
 * AbuseEngine — Detects suspicious XP/rank activity and flags it.
 *
 * Checks run inline (before/after grantReward) or as batch analysis.
 * Flags are stored in AbuseFlag table and affect leaderboard eligibility.
 */
const crypto = require('crypto');
const { prisma } = require('./db');
const { getGameConfig, getGameConfigs } = require('./gameConfig');
const { todayKey } = require('./rewardEngine');

// ─── Inline Checks (called before/during reward) ────

/**
 * Check if a journal submission is suspicious.
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.content - The journal text
 * @param {string} params.journalId
 * @returns {Promise<{ok: boolean, flags: string[]}>}
 */
async function checkJournalIntegrity({ userId, content, journalId }) {
  const configs = await getGameConfigs([
    'abuse_journal_min_chars',
    'abuse_journal_min_words',
    'abuse_journal_similarity_max',
  ]);

  const minChars = configs.abuse_journal_min_chars ?? 60;
  const minWords = configs.abuse_journal_min_words ?? 15;
  const flags = [];

  // Length check
  if (!content || content.trim().length < minChars) {
    flags.push('journal_too_short');
  }

  // Word count check
  const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  if (wordCount < minWords) {
    flags.push('journal_too_few_words');
  }

  // Repetitive content check — simple char-based entropy
  if (content && content.length > 10) {
    const uniq = new Set(content.toLowerCase().split(''));
    const ratio = uniq.size / content.length;
    if (ratio < 0.05) {
      flags.push('journal_repetitive_chars');
    }
  }

  // Record flags
  const day = todayKey();
  for (const code of flags) {
    await createFlag({
      userId,
      scope: 'event',
      severity: code === 'journal_repetitive_chars' ? 'high' : 'low',
      code,
      sourceId: journalId,
      dayKey: day,
      details: { charCount: content?.length || 0, wordCount },
    });
  }

  return { ok: flags.length === 0, flags };
}

/**
 * Check practice session integrity.
 * @param {Object} params
 * @returns {Promise<{ok: boolean, flags: string[]}>}
 */
async function checkPracticeIntegrity({ userId, sessionId, durationSec, accuracy, sessionType }) {
  const configs = await getGameConfigs([
    'abuse_practice_min_duration',
    'abuse_practice_min_accuracy',
    'abuse_practice_max_sessions',
  ]);

  const minDuration = configs.abuse_practice_min_duration ?? 90;
  const minAccuracy = configs.abuse_practice_min_accuracy ?? 0.6;
  const maxSessions = configs.abuse_practice_max_sessions ?? 2;
  const flags = [];
  const day = todayKey();

  // Duration too short — speed-running
  if (durationSec != null && durationSec < minDuration) {
    flags.push('practice_too_fast');
  }

  // Accuracy suspiciously low — random clicking
  if (accuracy != null && accuracy < minAccuracy) {
    flags.push('practice_low_accuracy');
  }

  // Too many sessions per type today
  if (sessionType) {
    try {
      const countRows = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as cnt FROM \`RewardLedger\`
         WHERE \`userId\` = ? AND \`bucket\` = 'practice'
           AND \`dayKey\` = ? AND \`eventType\` LIKE ?`,
        userId, day, `%${sessionType}%`
      );
      const count = Number(countRows[0]?.cnt || 0);
      if (count >= maxSessions) {
        flags.push('practice_session_cap_exceeded');
      }
    } catch { /* table may not exist yet */ }
  }

  for (const code of flags) {
    await createFlag({
      userId,
      scope: 'event',
      severity: code === 'practice_session_cap_exceeded' ? 'medium' : 'low',
      code,
      sourceId: sessionId,
      dayKey: day,
      details: { durationSec, accuracy, sessionType },
    });
  }

  return { ok: flags.length === 0, flags };
}

/**
 * Check if a user is eligible for top-3 day-pass consideration.
 * Called during finalization.
 */
async function checkDayPassEligibility(userId) {
  const configs = await getGameConfigs([
    'abuse_fresh_account_days',
    'abuse_min_events_for_rank',
  ]);

  const freshDays = configs.abuse_fresh_account_days ?? 3;
  const minEvents = configs.abuse_min_events_for_rank ?? 2;
  const day = todayKey();

  // Check account age
  try {
    const userRows = await prisma.$queryRawUnsafe(
      "SELECT `createdAt`, `accountTrustLevel`, `eligibleForRank` FROM `User` WHERE `id` = ? LIMIT 1",
      userId
    );
    if (userRows.length === 0) return { eligible: false, reason: 'user_not_found' };
    const user = userRows[0];

    if (!user.eligibleForRank) return { eligible: false, reason: 'rank_disabled' };
    if (user.accountTrustLevel === 'flagged' || user.accountTrustLevel === 'banned') {
      return { eligible: false, reason: 'trust_level_blocked' };
    }

    const ageDays = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000);
    if (ageDays < freshDays) {
      return { eligible: false, reason: 'fresh_account' };
    }
  } catch (err) {
    return { eligible: false, reason: 'check_error' };
  }

  // Check min events today
  try {
    const aggRows = await prisma.$queryRawUnsafe(
      "SELECT `verifiedEventCount` FROM `DailyUserAggregate` WHERE `userId` = ? AND `dayKey` = ? LIMIT 1",
      userId, day
    );
    const events = aggRows.length > 0 ? Number(aggRows[0].verifiedEventCount) : 0;
    if (events < minEvents) {
      return { eligible: false, reason: 'too_few_events' };
    }
  } catch {
    return { eligible: false, reason: 'check_error' };
  }

  // Check for open high-severity flags today
  try {
    const flagRows = await prisma.$queryRawUnsafe(
      "SELECT `id` FROM `AbuseFlag` WHERE `userId` = ? AND `dayKey` = ? AND `severity` IN ('high','critical') AND `status` = 'open' LIMIT 1",
      userId, day
    );
    if (flagRows.length > 0) {
      return { eligible: false, reason: 'open_abuse_flag' };
    }
  } catch { /* OK */ }

  return { eligible: true };
}

// ─── Flag Management ─────────────────────────────────

async function createFlag({ userId, scope, severity, code, sourceId, dayKey, details }) {
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO \`AbuseFlag\`
        (\`id\`, \`userId\`, \`scope\`, \`severity\`, \`code\`, \`sourceId\`, \`dayKey\`, \`details\`, \`status\`, \`createdAt\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', NOW(3))`,
      crypto.randomUUID(), userId, scope, severity, code, sourceId || null, dayKey || null,
      details ? JSON.stringify(details) : null
    );
  } catch (err) {
    console.error('[AbuseEngine] createFlag error:', err.message);
  }
}

/**
 * Get open abuse flags for admin review.
 */
async function getOpenFlags({ limit = 50, severity } = {}) {
  try {
    let query = `SELECT f.*, u.\`displayName\`, u.\`email\`
                 FROM \`AbuseFlag\` f
                 JOIN \`User\` u ON u.\`id\` = f.\`userId\`
                 WHERE f.\`status\` = 'open'`;
    const params = [];
    if (severity) {
      query += ` AND f.\`severity\` = ?`;
      params.push(severity);
    }
    query += ` ORDER BY f.\`createdAt\` DESC LIMIT ?`;
    params.push(limit);

    return await prisma.$queryRawUnsafe(query, ...params);
  } catch (err) {
    console.error('[AbuseEngine] getOpenFlags error:', err.message);
    return [];
  }
}

/**
 * Review a flag (admin action).
 */
async function reviewFlag(flagId, { status, reviewedBy }) {
  try {
    await prisma.$executeRawUnsafe(
      "UPDATE `AbuseFlag` SET `status` = ?, `reviewedBy` = ?, `reviewedAt` = NOW(3) WHERE `id` = ?",
      status, reviewedBy, flagId
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = {
  checkJournalIntegrity,
  checkPracticeIntegrity,
  checkDayPassEligibility,
  createFlag,
  getOpenFlags,
  reviewFlag,
};
