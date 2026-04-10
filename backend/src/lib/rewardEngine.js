/**
 * RewardEngine — Idempotent, cap-aware XP + Ranked score granting.
 *
 * Every XP/Ranked grant goes through this engine. It:
 * 1. Checks idempotency (skip if already recorded)
 * 2. Reads daily caps from GameConfig
 * 3. Reads current daily bucket totals from DailyUserAggregate
 * 4. Clamps amounts to respect per-bucket and global caps
 * 5. Writes RewardLedger + RankLedger atomically
 * 6. Updates DailyUserAggregate + WeeklyUserAggregate
 * 7. Updates User.totalXp + User.totalRankedScore
 * 8. Returns the actual amounts granted (after cap clamping)
 */
const crypto = require('crypto');
const { prisma } = require('./db');
const { getGameConfig, getGameConfigs } = require('./gameConfig');

// ─── Helpers ─────────────────────────────────────────

/** Get today's date key as YYYY-MM-DD string (VN timezone = UTC+7) */
function todayKey() {
  const now = new Date();
  // Shift to VN timezone
  const vnMs = now.getTime() + (7 * 60 * 60 * 1000);
  const vn = new Date(vnMs);
  return vn.toISOString().slice(0, 10);
}

/** Get ISO week key e.g. "2026-W15" */
function weekKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// ─── Public API ──────────────────────────────────────

/**
 * Grant XP + Ranked score for an event.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.eventType        e.g. "journal_verified", "lesson_complete"
 * @param {string} params.sourceType       e.g. "journal", "lesson", "vocab", "practice"
 * @param {string} params.sourceId         ID of the source entity (journalId, lessonId, etc.)
 * @param {string} params.bucket           "journal" | "lesson" | "review" | "practice"
 * @param {number} params.xpAmount         Nominal XP amount (before caps)
 * @param {number} params.rankedAmount     Nominal ranked score (before caps)
 * @param {Object} [params.options]
 * @param {number} [params.options.qualityScore]  Quality score (0-100)
 * @param {number} [params.options.learningMinutes]  Verified learning minutes
 * @param {Object} [params.options.metadata]  Extra metadata for ledger
 *
 * @returns {Promise<{xpGranted: number, rankedGranted: number, skipped: boolean, reason?: string}>}
 */
async function grantReward({
  userId,
  eventType,
  sourceType,
  sourceId,
  bucket,
  xpAmount,
  rankedAmount,
  options = {},
}) {
  const day = todayKey();
  const week = weekKey(day);
  const idemKey = `${userId}:${eventType}:${sourceId || day}:${day}`;

  // 1. Idempotency check — skip if already recorded
  try {
    const existing = await prisma.$queryRawUnsafe(
      "SELECT `id` FROM `RewardLedger` WHERE `idempotencyKey` = ? LIMIT 1",
      idemKey
    );
    if (existing.length > 0) {
      return { xpGranted: 0, rankedGranted: 0, skipped: true, reason: 'duplicate' };
    }
  } catch {
    // Table might not exist yet — proceed anyway
  }

  // 2. Load caps from GameConfig
  const caps = await getGameConfigs([
    'xp_global_daily_cap',
    `xp_${bucket}_daily_cap`,
    'rank_global_daily_cap',
    `rank_${bucket}_daily_cap`,
  ]);

  const xpGlobalCap = caps['xp_global_daily_cap'] ?? 100;
  const xpBucketCap = caps[`xp_${bucket}_daily_cap`] ?? 50;
  const rankGlobalCap = caps['rank_global_daily_cap'] ?? 60;
  const rankBucketCap = caps[`rank_${bucket}_daily_cap`] ?? 30;

  // 3. Read current daily aggregate
  let agg;
  try {
    const rows = await prisma.$queryRawUnsafe(
      "SELECT * FROM `DailyUserAggregate` WHERE `userId` = ? AND `dayKey` = ? LIMIT 1",
      userId, day
    );
    agg = rows.length > 0 ? rows[0] : null;
  } catch {
    agg = null;
  }

  const currentXp = agg ? Number(agg.xpEarned) : 0;
  const currentRank = agg ? Number(agg.rankedScore) : 0;
  const currentBucketXp = agg ? Number(agg[`${bucket}Xp`] || 0) : 0;
  const currentBucketRank = agg ? Number(agg[`${bucket}Ranked`] || 0) : 0;

  // 4. Clamp to caps
  let xpGrant = Math.max(0, Math.min(
    xpAmount,
    xpBucketCap - currentBucketXp,
    xpGlobalCap - currentXp
  ));

  let rankGrant = Math.max(0, Math.min(
    rankedAmount,
    rankBucketCap - currentBucketRank,
    rankGlobalCap - currentRank
  ));

  // Apply quality multiplier for ranked
  if (options.qualityScore != null) {
    const threshold = await getGameConfig('rank_quality_threshold', 90);
    const mult = await getGameConfig('rank_quality_multiplier_high', 1.1);
    if (options.qualityScore >= threshold) {
      rankGrant = Math.floor(rankGrant * mult);
      // Re-clamp after multiplier
      rankGrant = Math.min(rankGrant, rankBucketCap - currentBucketRank, rankGlobalCap - currentRank);
    }
  }

  // If nothing to grant, still record 0 for audit trail
  const rewardId = crypto.randomUUID();
  const rankId = crypto.randomUUID();
  const learningMin = options.learningMinutes || 0;
  const metadata = options.metadata ? JSON.stringify(options.metadata) : null;

  // 5+6+7. Atomic transaction: write ledgers + update aggregates + update user
  try {
    await prisma.$transaction(async (tx) => {
      // 5a. RewardLedger
      await tx.$executeRawUnsafe(
        `INSERT INTO \`RewardLedger\` (\`id\`, \`userId\`, \`eventType\`, \`sourceType\`, \`sourceId\`, \`amount\`, \`bucket\`, \`dayKey\`, \`idempotencyKey\`, \`integrityStatus\`, \`metadata\`, \`createdAt\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'clear', ?, NOW(3))`,
        rewardId, userId, eventType, sourceType, sourceId || null, xpGrant, bucket, day, idemKey, metadata
      );

      // 5b. RankLedger
      await tx.$executeRawUnsafe(
        `INSERT INTO \`RankLedger\` (\`id\`, \`userId\`, \`eventType\`, \`sourceType\`, \`sourceId\`, \`rankedPoints\`, \`dayKey\`, \`idempotencyKey\`, \`integrityStatus\`, \`qualityScore\`, \`verifiedLearningMinutes\`, \`createdAt\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'clear', ?, ?, NOW(3))`,
        rankId, userId, eventType, sourceType, sourceId || null, rankGrant, day,
        `rank:${idemKey}`, options.qualityScore ?? null, learningMin
      );

      // 6a. Upsert DailyUserAggregate
      const aggId = crypto.randomUUID();
      await tx.$executeRawUnsafe(
        `INSERT INTO \`DailyUserAggregate\`
          (\`id\`, \`userId\`, \`dayKey\`,
           \`xpEarned\`, \`rankedScore\`,
           \`${bucket}Xp\`, \`${bucket}Ranked\`,
           \`verifiedLearningMinutes\`, \`verifiedEventCount\`,
           \`updatedAt\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(3))
         ON DUPLICATE KEY UPDATE
           \`xpEarned\` = \`xpEarned\` + VALUES(\`xpEarned\`),
           \`rankedScore\` = \`rankedScore\` + VALUES(\`rankedScore\`),
           \`${bucket}Xp\` = \`${bucket}Xp\` + VALUES(\`${bucket}Xp\`),
           \`${bucket}Ranked\` = \`${bucket}Ranked\` + VALUES(\`${bucket}Ranked\`),
           \`verifiedLearningMinutes\` = \`verifiedLearningMinutes\` + VALUES(\`verifiedLearningMinutes\`),
           \`verifiedEventCount\` = \`verifiedEventCount\` + 1,
           \`updatedAt\` = NOW(3)`,
        aggId, userId, day, xpGrant, rankGrant, xpGrant, rankGrant, learningMin
      );

      // 6b. Upsert WeeklyUserAggregate
      const weekAggId = crypto.randomUUID();
      await tx.$executeRawUnsafe(
        `INSERT INTO \`WeeklyUserAggregate\`
          (\`id\`, \`userId\`, \`weekKey\`,
           \`xpEarned\`, \`rankedScore\`,
           \`verifiedLearningMinutes\`, \`verifiedEventCount\`,
           \`daysActive\`, \`updatedAt\`)
         VALUES (?, ?, ?, ?, ?, ?, 1, 1, NOW(3))
         ON DUPLICATE KEY UPDATE
           \`xpEarned\` = \`xpEarned\` + VALUES(\`xpEarned\`),
           \`rankedScore\` = \`rankedScore\` + VALUES(\`rankedScore\`),
           \`verifiedLearningMinutes\` = \`verifiedLearningMinutes\` + VALUES(\`verifiedLearningMinutes\`),
           \`verifiedEventCount\` = \`verifiedEventCount\` + 1,
           \`updatedAt\` = NOW(3)`,
        weekAggId, userId, week, xpGrant, rankGrant, learningMin
      );

      // 7. Update User totals
      if (xpGrant > 0 || rankGrant > 0) {
        await tx.$executeRawUnsafe(
          `UPDATE \`User\` SET
             \`totalXp\` = \`totalXp\` + ?,
             \`totalRankedScore\` = \`totalRankedScore\` + ?
           WHERE \`id\` = ?`,
          xpGrant, rankGrant, userId
        );
      }

      // Legacy: also create UserXpLog for backward compat with existing UI
      if (xpGrant > 0) {
        await tx.$executeRawUnsafe(
          `INSERT INTO \`UserXpLog\` (\`id\`, \`userId\`, \`amount\`, \`source\`, \`description\`, \`createdAt\`)
           VALUES (?, ?, ?, ?, ?, NOW(3))`,
          crypto.randomUUID(), userId, xpGrant, sourceType, eventType
        );
      }
    });
  } catch (err) {
    // If idempotency constraint fires, it's a race condition — treat as skip
    if (err.code === 'P2002' || (err.message && err.message.includes('Duplicate entry'))) {
      return { xpGranted: 0, rankedGranted: 0, skipped: true, reason: 'race_duplicate' };
    }
    throw err;
  }

  return { xpGranted: xpGrant, rankedGranted: rankGrant, skipped: false };
}

/**
 * Read a user's daily aggregate for today.
 */
async function getDailyAggregate(userId, day) {
  const d = day || todayKey();
  try {
    const rows = await prisma.$queryRawUnsafe(
      "SELECT * FROM `DailyUserAggregate` WHERE `userId` = ? AND `dayKey` = ? LIMIT 1",
      userId, d
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    // Convert BigInt/Decimal fields
    const out = {};
    for (const [k, v] of Object.entries(row)) {
      out[k] = typeof v === 'bigint' ? Number(v) : v;
    }
    return out;
  } catch {
    return null;
  }
}

/**
 * Read weekly aggregate for current week.
 */
async function getWeeklyAggregate(userId, week) {
  const w = week || weekKey(todayKey());
  try {
    const rows = await prisma.$queryRawUnsafe(
      "SELECT * FROM `WeeklyUserAggregate` WHERE `userId` = ? AND `weekKey` = ? LIMIT 1",
      userId, w
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    const out = {};
    for (const [k, v] of Object.entries(row)) {
      out[k] = typeof v === 'bigint' ? Number(v) : v;
    }
    return out;
  } catch {
    return null;
  }
}

module.exports = {
  grantReward,
  getDailyAggregate,
  getWeeklyAggregate,
  todayKey,
  weekKey,
};
