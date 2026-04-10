/**
 * LeaderboardEngine — Daily/Weekly leaderboard reads + finalization.
 *
 * Reads from DailyUserAggregate / WeeklyUserAggregate for live boards.
 * Finalization job snapshots top users + grants Premium Day-Pass to top 3.
 */
const crypto = require('crypto');
const { prisma } = require('./db');
const { getGameConfig, getGameConfigs } = require('./gameConfig');
const { todayKey, weekKey } = require('./rewardEngine');

// ─── Live Leaderboard ────────────────────────────────

/**
 * Get today's live daily leaderboard.
 * @param {Object} opts
 * @param {number} [opts.limit=20]
 * @param {string} [opts.userId] - If provided, also returns the user's own position
 * @returns {Promise<{board: Array, userPosition?: Object}>}
 */
async function getDailyLeaderboard({ limit = 20, userId } = {}) {
  const day = todayKey();
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT a.\`userId\`, a.\`rankedScore\`, a.\`xpEarned\`, a.\`verifiedEventCount\`,
              u.\`name\`, u.\`avatarUrl\`, u.\`accountTrustLevel\`, u.\`eligibleForRank\`, u.\`isPremium\`
       FROM \`DailyUserAggregate\` a
       JOIN \`User\` u ON u.\`id\` = a.\`userId\`
       WHERE a.\`dayKey\` = ? AND u.\`eligibleForRank\` = 1
         AND u.\`accountTrustLevel\` NOT IN ('flagged','banned')
       ORDER BY a.\`rankedScore\` DESC, a.\`xpEarned\` DESC, a.\`verifiedEventCount\` DESC
       LIMIT ?`,
      day, limit
    );

    const board = rows.map((r, i) => ({
      rank: i + 1,
      userId: r.userId,
      name: r.name,
      avatarUrl: r.avatarUrl,
      rankedScore: Number(r.rankedScore),
      xpEarned: Number(r.xpEarned),
      verifiedEventCount: Number(r.verifiedEventCount),
      isPremium: Boolean(r.isPremium),
      isUser: userId ? r.userId === userId : false,
    }));

    let userPosition = null;
    if (userId) {
      const found = board.find(b => b.userId === userId);
      if (found) {
        userPosition = found;
      } else {
        // Get user's own position
        const userRows = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) + 1 as \`rank\`, 
                  (SELECT a2.\`rankedScore\` FROM \`DailyUserAggregate\` a2 WHERE a2.\`userId\` = ? AND a2.\`dayKey\` = ?) as myScore,
                  (SELECT a2.\`xpEarned\` FROM \`DailyUserAggregate\` a2 WHERE a2.\`userId\` = ? AND a2.\`dayKey\` = ?) as myXp
           FROM \`DailyUserAggregate\` a
           JOIN \`User\` u ON u.\`id\` = a.\`userId\`
           WHERE a.\`dayKey\` = ? AND u.\`eligibleForRank\` = 1
             AND a.\`rankedScore\` > COALESCE((SELECT a3.\`rankedScore\` FROM \`DailyUserAggregate\` a3 WHERE a3.\`userId\` = ? AND a3.\`dayKey\` = ?), 0)`,
          userId, day, userId, day, day, userId, day
        );
        if (userRows.length > 0 && userRows[0].myScore != null) {
          userPosition = {
            rank: Number(userRows[0].rank),
            userId,
            rankedScore: Number(userRows[0].myScore),
            xpEarned: Number(userRows[0].myXp || 0),
          };
        }
      }
    }

    return { board, userPosition };
  } catch (err) {
    console.error('[LeaderboardEngine] getDailyLeaderboard error:', err.message);
    return { board: [], userPosition: null };
  }
}

/**
 * Get weekly leaderboard.
 */
async function getWeeklyLeaderboard({ limit = 20, userId } = {}) {
  const week = weekKey(todayKey());
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT a.\`userId\`, a.\`rankedScore\`, a.\`xpEarned\`, a.\`daysActive\`,
              u.\`name\`, u.\`avatarUrl\`, u.\`isPremium\`
       FROM \`WeeklyUserAggregate\` a
       JOIN \`User\` u ON u.\`id\` = a.\`userId\`
       WHERE a.\`weekKey\` = ? AND u.\`eligibleForRank\` = 1
         AND u.\`accountTrustLevel\` NOT IN ('flagged','banned')
       ORDER BY a.\`rankedScore\` DESC, a.\`xpEarned\` DESC, a.\`daysActive\` DESC
       LIMIT ?`,
      week, limit
    );

    const board = rows.map((r, i) => ({
      rank: i + 1,
      userId: r.userId,
      name: r.name,
      avatarUrl: r.avatarUrl,
      rankedScore: Number(r.rankedScore),
      xpEarned: Number(r.xpEarned),
      daysActive: Number(r.daysActive),
      isPremium: Boolean(r.isPremium),
      isUser: userId ? r.userId === userId : false,
    }));

    let userPosition = null;
    if (userId) {
      const found = board.find(b => b.userId === userId);
      if (found) {
        userPosition = found;
      } else {
        const userRows = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) + 1 as \`rank\`,
                  (SELECT a2.\`rankedScore\` FROM \`WeeklyUserAggregate\` a2 WHERE a2.\`userId\` = ? AND a2.\`weekKey\` = ?) as myScore,
                  (SELECT a2.\`xpEarned\` FROM \`WeeklyUserAggregate\` a2 WHERE a2.\`userId\` = ? AND a2.\`weekKey\` = ?) as myXp
           FROM \`WeeklyUserAggregate\` a
           JOIN \`User\` u ON u.\`id\` = a.\`userId\`
           WHERE a.\`weekKey\` = ? AND u.\`eligibleForRank\` = 1
             AND a.\`rankedScore\` > COALESCE((SELECT a3.\`rankedScore\` FROM \`WeeklyUserAggregate\` a3 WHERE a3.\`userId\` = ? AND a3.\`weekKey\` = ?), 0)`,
          userId, week, userId, week, week, userId, week
        );
        if (userRows.length > 0 && userRows[0].myScore != null) {
          userPosition = {
            rank: Number(userRows[0].rank),
            userId,
            rankedScore: Number(userRows[0].myScore),
            xpEarned: Number(userRows[0].myXp || 0),
          };
        }
      }
    }

    return { board, userPosition };
  } catch (err) {
    console.error('[LeaderboardEngine] getWeeklyLeaderboard error:', err.message);
    return { board: [], userPosition: null };
  }
}

/**
 * Get a previous day's finalized leaderboard snapshot.
 */
async function getSnapshot(period, periodKey, { limit = 20 } = {}) {
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT s.*, u.\`name\`, u.\`avatarUrl\`
       FROM \`LeaderboardSnapshot\` s
       JOIN \`User\` u ON u.\`id\` = s.\`userId\`
       WHERE s.\`period\` = ? AND s.\`periodKey\` = ?
       ORDER BY s.\`rank\` ASC
       LIMIT ?`,
      period, periodKey, limit
    );
    return rows.map(r => ({
      rank: Number(r.rank),
      userId: r.userId,
      name: r.name,
      avatarUrl: r.avatarUrl,
      rankedScore: Number(r.rankedScore),
      xpEarned: Number(r.xpEarned),
      grantedDayPass: Boolean(r.grantedDayPass),
    }));
  } catch (err) {
    console.error('[LeaderboardEngine] getSnapshot error:', err.message);
    return [];
  }
}

// ─── Finalization ────────────────────────────────────

/**
 * Finalize yesterday's daily leaderboard:
 * 1. Snapshot top N users
 * 2. Grant Premium Day-Pass to top 3 (if eligible)
 * 3. Update WeeklyUserAggregate daysActive
 *
 * Should be called by a cron/scheduler at ~00:05 VN time.
 */
async function finalizeDailyLeaderboard(overrideDayKey) {
  // Yesterday in VN time
  const now = new Date();
  const vnMs = now.getTime() + (7 * 60 * 60 * 1000) - 86400000;
  const yesterday = overrideDayKey || new Date(vnMs).toISOString().slice(0, 10);

  const configs = await getGameConfigs([
    'daypass_top3_enabled',
    'daypass_min_ranked_score',
    'daypass_low_volume_threshold',
    'leaderboard_top_count',
    'leaderboard_finalize_enabled',
    'abuse_fresh_account_days',
    'abuse_min_events_for_rank',
  ]);

  if (configs.leaderboard_finalize_enabled === false) {
    return { status: 'disabled' };
  }

  // Check if already finalized
  const existing = await prisma.$queryRawUnsafe(
    "SELECT `id` FROM `LeaderboardSnapshot` WHERE `period` = 'daily' AND `periodKey` = ? LIMIT 1",
    yesterday
  );
  if (existing.length > 0) {
    return { status: 'already_finalized', periodKey: yesterday };
  }

  // Get all eligible users for that day, ordered by rankedScore
  const candidates = await prisma.$queryRawUnsafe(
    `SELECT a.\`userId\`, a.\`rankedScore\`, a.\`xpEarned\`, a.\`verifiedEventCount\`,
            u.\`createdAt\` as userCreatedAt, u.\`eligibleForRank\`, u.\`accountTrustLevel\`
     FROM \`DailyUserAggregate\` a
     JOIN \`User\` u ON u.\`id\` = a.\`userId\`
     WHERE a.\`dayKey\` = ? AND a.\`rankedScore\` > 0
       AND u.\`eligibleForRank\` = 1
       AND u.\`accountTrustLevel\` NOT IN ('flagged','banned')
     ORDER BY a.\`rankedScore\` DESC, a.\`xpEarned\` DESC, a.\`verifiedEventCount\` DESC
     LIMIT 50`,
    yesterday
  );

  if (candidates.length === 0) {
    return { status: 'no_candidates', periodKey: yesterday };
  }

  const topCount = configs.leaderboard_top_count ?? 3;
  const dayPassEnabled = configs.daypass_top3_enabled !== false;
  const minRanked = configs.daypass_min_ranked_score ?? 18;
  const lowVolumeThreshold = configs.daypass_low_volume_threshold ?? 20;
  const freshDays = configs.abuse_fresh_account_days ?? 3;
  const minEvents = configs.abuse_min_events_for_rank ?? 2;

  const totalEligible = candidates.length;
  const snapshots = [];
  const dayPassGrants = [];

  for (let i = 0; i < Math.min(candidates.length, 50); i++) {
    const c = candidates[i];
    const rank = i + 1;
    const isDayPassEligible = rank <= topCount
      && dayPassEnabled
      && Number(c.verifiedEventCount) >= minEvents
      && (totalEligible >= lowVolumeThreshold || Number(c.rankedScore) >= minRanked);

    // Fresh account check
    const accountAge = Math.floor((Date.now() - new Date(c.userCreatedAt).getTime()) / 86400000);
    const isFresh = accountAge < freshDays;
    const grantDayPass = isDayPassEligible && !isFresh;

    snapshots.push({
      id: crypto.randomUUID(),
      period: 'daily',
      periodKey: yesterday,
      userId: c.userId,
      rank,
      rankedScore: Number(c.rankedScore),
      xpEarned: Number(c.xpEarned),
      grantedDayPass: grantDayPass,
    });

    if (grantDayPass) {
      dayPassGrants.push({
        id: crypto.randomUUID(),
        userId: c.userId,
        grantType: 'day_pass_top3',
        sourceDayKey: yesterday,
        sourceRank: rank,
      });
    }
  }

  // Write in transaction
  await prisma.$transaction(async (tx) => {
    // Insert snapshots
    for (const s of snapshots) {
      await tx.$executeRawUnsafe(
        `INSERT INTO \`LeaderboardSnapshot\`
          (\`id\`, \`period\`, \`periodKey\`, \`userId\`, \`rank\`, \`rankedScore\`, \`xpEarned\`, \`grantedDayPass\`, \`createdAt\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
        s.id, s.period, s.periodKey, s.userId, s.rank, s.rankedScore, s.xpEarned, s.grantedDayPass ? 1 : 0
      );
    }

    // Grant day passes
    for (const g of dayPassGrants) {
      // Premium grant: starts today, ends tomorrow at 23:59:59 VN
      const startsAt = new Date();
      const endsVn = new Date(startsAt.getTime() + (7 * 60 * 60 * 1000));
      endsVn.setUTCHours(23 + 7, 59, 59, 999); // End of today VN time = 16:59:59 UTC
      // Actually, day pass should last until end of TODAY (the day after the competition day)
      const endsAt = new Date(endsVn.getTime() - (7 * 60 * 60 * 1000));

      await tx.$executeRawUnsafe(
        `INSERT INTO \`PremiumGrant\`
          (\`id\`, \`userId\`, \`grantType\`, \`startsAt\`, \`endsAt\`, \`sourceDayKey\`, \`sourceRank\`, \`status\`, \`reason\`, \`createdAt\`)
         VALUES (?, ?, 'day_pass_top3', NOW(3), ?, ?, ?, 'active', ?, NOW(3))`,
        g.id, g.userId, endsAt, g.sourceDayKey, g.sourceRank,
        `Top ${g.sourceRank} on daily leaderboard ${g.sourceDayKey}`
      );

      // Also update User.isPremium + premiumUntil if they don't already have a longer premium
      await tx.$executeRawUnsafe(
        `UPDATE \`User\` SET
           \`isPremium\` = 1,
           \`premiumUntil\` = CASE
             WHEN \`premiumUntil\` IS NULL OR \`premiumUntil\` < ? THEN ?
             ELSE \`premiumUntil\`
           END
         WHERE \`id\` = ?`,
        endsAt, endsAt, g.userId
      );
    }
  });

  return {
    status: 'finalized',
    periodKey: yesterday,
    totalCandidates: candidates.length,
    snapshotCount: snapshots.length,
    dayPassesGranted: dayPassGrants.length,
    topUsers: snapshots.slice(0, 5).map(s => ({
      rank: s.rank,
      userId: s.userId,
      rankedScore: s.rankedScore,
      grantedDayPass: s.grantedDayPass,
    })),
  };
}

/**
 * Expire premium day-passes that have ended.
 * Should be called periodically (e.g. every hour or at midnight).
 */
async function expirePremiumGrants() {
  try {
    // Find grants that are active but past endsAt
    const expired = await prisma.$queryRawUnsafe(
      `SELECT \`id\`, \`userId\`, \`endsAt\` FROM \`PremiumGrant\`
       WHERE \`status\` = 'active' AND \`endsAt\` IS NOT NULL AND \`endsAt\` < NOW(3)`
    );

    if (expired.length === 0) return { expired: 0 };

    for (const g of expired) {
      await prisma.$executeRawUnsafe(
        "UPDATE `PremiumGrant` SET `status` = 'expired' WHERE `id` = ?",
        g.id
      );

      // Check if user still has any active premium grant
      const active = await prisma.$queryRawUnsafe(
        "SELECT `id` FROM `PremiumGrant` WHERE `userId` = ? AND `status` = 'active' LIMIT 1",
        g.userId
      );
      if (active.length === 0) {
        // No more active grants — revoke premium
        await prisma.$executeRawUnsafe(
          "UPDATE `User` SET `isPremium` = 0 WHERE `id` = ? AND `isPremium` = 1",
          g.userId
        );
      }
    }

    return { expired: expired.length };
  } catch (err) {
    console.error('[LeaderboardEngine] expirePremiumGrants error:', err.message);
    return { expired: 0, error: err.message };
  }
}

module.exports = {
  getDailyLeaderboard,
  getWeeklyLeaderboard,
  getSnapshot,
  finalizeDailyLeaderboard,
  expirePremiumGrants,
};
