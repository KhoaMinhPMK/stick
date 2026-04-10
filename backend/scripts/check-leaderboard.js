const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const weeks = await p.$queryRawUnsafe(
    'SELECT weekKey, COUNT(*) as cnt, SUM(rankedScore) as totalRanked FROM WeeklyUserAggregate GROUP BY weekKey ORDER BY weekKey DESC'
  );
  console.log('WeeklyUserAggregate weeks:', JSON.stringify(weeks, null, 2));

  const today = new Date();
  const vnMs = today.getTime() + (7 * 60 * 60 * 1000);
  const vn = new Date(vnMs);
  const todayStr = vn.toISOString().slice(0, 10);
  console.log('Today (VN):', todayStr);

  const d = new Date(todayStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  const wk = `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  console.log('Current week key:', wk);

  const dayRows = await p.$queryRawUnsafe(
    `SELECT dayKey, COUNT(*) as cnt FROM DailyUserAggregate GROUP BY dayKey ORDER BY dayKey DESC LIMIT 10`
  );
  console.log('Recent DailyUserAggregate days:', JSON.stringify(dayRows, null, 2));

  const users = await p.$queryRawUnsafe(
    `SELECT u.id, u.displayName, u.eligibleForRank, u.accountTrustLevel, u.totalRankedScore 
     FROM User u 
     WHERE u.totalRankedScore > 0 OR u.eligibleForRank = 1
     LIMIT 10`
  );
  console.log('Users with ranked eligibility:', JSON.stringify(users, null, 2));
}
run().catch(e => console.error(e)).finally(() => p.$disconnect());
