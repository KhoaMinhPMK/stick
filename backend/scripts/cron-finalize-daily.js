/**
 * Cron job: Finalize daily leaderboard + expire premium grants.
 * Schedule this on VPS at 00:05 VN time (17:05 UTC) daily.
 *
 * Usage: node scripts/cron-finalize-daily.js
 *
 * Or add to Windows Task Scheduler:
 *   Program: node
 *   Arguments: E:\project\stick\backend\scripts\cron-finalize-daily.js
 *   Trigger: Daily at 00:05 (VN timezone)
 */
const http = require('http');

const PORT = process.env.PORT || 3040;
const CRON_SECRET = process.env.CRON_SECRET || 'stick-cron-secret-2026';

const options = {
  hostname: '127.0.0.1',
  port: PORT,
  path: '/api/v1/cron/finalize-daily',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-cron-secret': CRON_SECRET,
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`[${new Date().toISOString()}] Finalize response (${res.statusCode}):`, data);
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});

req.on('error', (err) => {
  console.error(`[${new Date().toISOString()}] Cron request failed:`, err.message);
  process.exit(1);
});

req.write('{}');
req.end();
