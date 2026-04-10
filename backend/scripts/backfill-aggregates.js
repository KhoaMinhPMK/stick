/**
 * backfill-aggregates.js
 *
 * One-time script: populate DailyUserAggregate + WeeklyUserAggregate
 * from existing ProgressDaily records.
 *
 * Run on VPS:
 *   node /path/to/backend/scripts/backfill-aggregates.js
 */

const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/** ISO week key from a Date string "YYYY-MM-DD" */
function weekKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

async function main() {
  console.log('[backfill] Starting...');

  // 1. Read all ProgressDaily records
  const rows = await prisma.$queryRawUnsafe(
    `SELECT pd.userId, DATE_FORMAT(pd.day, '%Y-%m-%d') as dayKey,
            pd.xpEarned, pd.journalsCount, pd.minutesSpent, pd.wordsLearned
     FROM ProgressDaily pd
     ORDER BY pd.userId, pd.day`
  );

  console.log(`[backfill] Found ${rows.length} ProgressDaily records`);

  if (rows.length === 0) {
    console.log('[backfill] Nothing to backfill.');
    return;
  }

  let dailyInserted = 0;
  let dailySkipped = 0;
  const weeklyMap = {}; // { "userId:weekKey": { xp, ranked, minutes, events, days } }

  // 2. Backfill DailyUserAggregate
  for (const row of rows) {
    const xp = Number(row.xpEarned) || 0;
    const journals = Number(row.journalsCount) || 0;
    const minutes = Number(row.minutesSpent) || 0;
    // Use xpEarned as rankedScore proxy (capped at 60 for fairness)
    const ranked = Math.min(xp, 60);
    const id = crypto.randomUUID();

    try {
      await prisma.$executeRawUnsafe(
        `INSERT IGNORE INTO DailyUserAggregate
           (id, userId, dayKey, xpEarned, rankedScore,
            journalXp, journalRanked,
            verifiedLearningMinutes, verifiedEventCount, integrityState)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'clear')`,
        id, row.userId, row.dayKey,
        xp, ranked,
        xp, ranked,
        minutes, journals
      );
      dailyInserted++;
    } catch (err) {
      if (err.message && err.message.includes('Duplicate')) {
        dailySkipped++;
      } else {
        console.error(`[backfill] Error on ${row.userId} / ${row.dayKey}:`, err.message);
      }
    }

    // Accumulate weekly
    const wk = weekKey(row.dayKey);
    const wkey = `${row.userId}:${wk}`;
    if (!weeklyMap[wkey]) {
      weeklyMap[wkey] = { userId: row.userId, weekKey: wk, xp: 0, ranked: 0, minutes: 0, events: 0, days: 0 };
    }
    weeklyMap[wkey].xp += xp;
    weeklyMap[wkey].ranked += ranked;
    weeklyMap[wkey].minutes += minutes;
    weeklyMap[wkey].events += journals;
    weeklyMap[wkey].days += 1;
  }

  console.log(`[backfill] DailyUserAggregate: ${dailyInserted} inserted, ${dailySkipped} skipped (already existed)`);

  // 3. Backfill WeeklyUserAggregate
  let weeklyInserted = 0;
  let weeklySkipped = 0;
  for (const entry of Object.values(weeklyMap)) {
    const id = crypto.randomUUID();
    try {
      await prisma.$executeRawUnsafe(
        `INSERT IGNORE INTO WeeklyUserAggregate
           (id, userId, weekKey, xpEarned, rankedScore,
            verifiedLearningMinutes, verifiedEventCount, daysActive)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        id, entry.userId, entry.weekKey,
        entry.xp, entry.ranked,
        entry.minutes, entry.events, entry.days
      );
      weeklyInserted++;
    } catch (err) {
      if (err.message && err.message.includes('Duplicate')) {
        weeklySkipped++;
      } else {
        console.error(`[backfill] Weekly error ${entry.userId}/${entry.weekKey}:`, err.message);
      }
    }
  }

  console.log(`[backfill] WeeklyUserAggregate: ${weeklyInserted} inserted, ${weeklySkipped} skipped`);

  // 4. Update User.totalRankedScore from DailyUserAggregate sum
  const updated = await prisma.$executeRawUnsafe(
    `UPDATE User u
     SET u.totalRankedScore = (
       SELECT COALESCE(SUM(d.rankedScore), 0)
       FROM DailyUserAggregate d
       WHERE d.userId = u.id
     ),
     u.totalXp = (
       SELECT COALESCE(SUM(d.xpEarned), 0)
       FROM DailyUserAggregate d
       WHERE d.userId = u.id
     )
     WHERE u.id IN (
       SELECT DISTINCT userId FROM DailyUserAggregate
     )`
  );

  console.log(`[backfill] Updated totalRankedScore + totalXp for ${updated} users`);
  console.log('[backfill] Done!');
}

main()
  .catch(err => { console.error('[backfill] Fatal:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
