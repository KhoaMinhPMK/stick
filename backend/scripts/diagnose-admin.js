// Run this on VPS to diagnose admin 500 errors
// Usage: node scripts/diagnose-admin.js

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['error'] });

async function main() {
  console.log('=== STICK Admin Diagnostics ===\n');

  // 1. Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('[OK] Database connection');
  } catch (e) {
    console.error('[FAIL] Database connection:', e.message);
    return;
  }

  // 2. Check User table has role & status columns
  try {
    const rows = await prisma.$queryRaw`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'User' 
      AND COLUMN_NAME IN ('role', 'status')
    `;
    const cols = rows.map(r => r.COLUMN_NAME);
    if (cols.includes('role') && cols.includes('status')) {
      console.log('[OK] User table has role & status columns');
    } else {
      console.error('[FAIL] User table missing columns:', 
        !cols.includes('role') ? 'role' : '', 
        !cols.includes('status') ? 'status' : '');
      console.log('  FIX: Run "npx prisma db push"');
    }
  } catch (e) {
    console.error('[FAIL] Cannot check User columns:', e.message);
  }

  // 3. Check DailyPrompt table exists
  try {
    const count = await prisma.dailyPrompt.count();
    console.log(`[OK] DailyPrompt table exists (${count} rows)`);
  } catch (e) {
    console.error('[FAIL] DailyPrompt table:', e.message);
    console.log('  FIX: Run "npx prisma db push"');
  }

  // 4. Check AILog table exists
  try {
    const count = await prisma.aILog.count();
    console.log(`[OK] AILog table exists (${count} rows)`);
  } catch (e) {
    console.error('[FAIL] AILog table:', e.message);
    console.log('  FIX: Run "npx prisma db push"');
  }

  // 5. Check AppConfig table exists
  try {
    const count = await prisma.appConfig.count();
    console.log(`[OK] AppConfig table exists (${count} rows)`);
  } catch (e) {
    console.error('[FAIL] AppConfig table:', e.message);
    console.log('  FIX: Run "npx prisma db push"');
  }

  // 6. Check ProgressDaily table
  try {
    const count = await prisma.progressDaily.count();
    console.log(`[OK] ProgressDaily table exists (${count} rows)`);
  } catch (e) {
    console.error('[FAIL] ProgressDaily table:', e.message);
  }

  // 7. Check admin user exists
  try {
    const admins = await prisma.$queryRaw`
      SELECT id, email, name, role FROM \`User\` WHERE role = 'admin'
    `;
    if (admins.length > 0) {
      console.log(`[OK] Admin user(s): ${admins.map(a => a.email).join(', ')}`);
    } else {
      console.error('[FAIL] No admin users found');
      console.log('  FIX: Run "node prisma/seed-admin.js"');
    }
  } catch (e) {
    // role column might not exist
    console.error('[FAIL] Cannot query admin users:', e.message);
    console.log('  FIX: Run "npx prisma db push" then "node prisma/seed-admin.js"');
  }

  // 8. Test actual metrics query (same as /admin/metrics/cards)
  console.log('\n--- Testing metrics queries ---');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  try {
    const count = await prisma.progressDaily.count({ where: { day: today } });
    console.log(`[OK] progressDaily.count for today: ${count}`);
  } catch (e) {
    console.error('[FAIL] progressDaily.count:', e.message);
  }

  try {
    const count = await prisma.journal.count({ 
      where: { status: 'submitted', createdAt: { gte: today, lte: todayEnd } } 
    });
    console.log(`[OK] journal.count submitted today: ${count}`);
  } catch (e) {
    console.error('[FAIL] journal.count:', e.message);
  }

  try {
    const count = await prisma.aILog.count({ 
      where: { createdAt: { gte: today, lte: todayEnd } } 
    });
    console.log(`[OK] aILog.count today: ${count}`);
  } catch (e) {
    console.error('[FAIL] aILog.count:', e.message);
  }

  console.log('\n=== Done ===');
}

main()
  .catch(e => console.error('Fatal:', e.message))
  .finally(() => prisma.$disconnect());
