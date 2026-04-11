require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const apiV1Routes = require('./routes/apiV1');
const { prisma } = require('./lib/db');

const app = express();
const port = Number(process.env.PORT || 3040);

// Trust IIS reverse proxy so express-rate-limit can read X-Forwarded-For correctly
app.set('trust proxy', 1);

const openApiPath = path.join(__dirname, '..', 'docs', 'openapi.yaml');
let openApiDocument;
try {
  openApiDocument = YAML.load(openApiPath);
} catch {
  openApiDocument = { info: { title: 'STICK API', version: '1.0.0' }, paths: {} };
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'stick-api-prod',
    timestamp: new Date().toISOString(),
  });
});

app.get('/hello', (_req, res) => {
  res.status(200).json({
    message: 'Hello from STICK backend',
  });
});

app.get('/docs.json', (_req, res) => {
  res.status(200).json(openApiDocument);
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { explorer: true }));
// Keep old path as alias
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { explorer: true }));
app.use('/api/v1', apiV1Routes);

app.use((req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, _next) => {
  // Avoid dumping huge raw bodies (e.g. base64 audio) to stderr
  const logSafe = { message: err.message, type: err.type, status: err.status, stack: err.stack };
  console.error('Unhandled Error:', logSafe);
  res.status(err.status || 500).json({
    code: err.type === 'entity.too.large' ? 'PAYLOAD_TOO_LARGE'
      : err.type === 'entity.parse.failed' ? 'INVALID_JSON'
      : 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected error occurred',
  });
});

app.listen(port, () => {
  console.log(`STICK backend listening on http://localhost:${port}`);
  console.log(`Swagger UI available at http://localhost:${port}/docs`);
});

// ─── GAP-06: Streak warning cron ─────────────────────
// Runs every 4 hours. Finds users who had activity yesterday
// but not today, and sends a streak warning notification.
async function checkStreakWarnings() {
  try {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    // Users who had progress yesterday
    const activeYesterday = await prisma.progressDaily.findMany({
      where: { day: new Date(yesterdayStr) },
      select: { userId: true },
    });

    if (activeYesterday.length === 0) return;

    const userIds = activeYesterday.map(p => p.userId);

    // Users who already have progress today
    const activeToday = await prisma.progressDaily.findMany({
      where: {
        userId: { in: userIds },
        day: new Date(todayStr),
      },
      select: { userId: true },
    });
    const activeTodaySet = new Set(activeToday.map(p => p.userId));

    // Users at risk = active yesterday but not today
    const atRisk = userIds.filter(id => !activeTodaySet.has(id));

    // Avoid duplicate notifications: check if we already sent a streak warning today
    const alreadyNotified = await prisma.notification.findMany({
      where: {
        userId: { in: atRisk },
        type: 'streak',
        createdAt: { gte: new Date(todayStr) },
      },
      select: { userId: true },
    });
    const notifiedSet = new Set(alreadyNotified.map(n => n.userId));
    const toNotify = atRisk.filter(id => !notifiedSet.has(id));

    if (toNotify.length > 0) {
      await prisma.notification.createMany({
        data: toNotify.map(userId => ({
          userId,
          type: 'streak',
          title: 'Don\'t lose your streak!',
          body: 'You haven\'t written today yet. Take a minute to keep your streak alive! 🔥',
        })),
      });
      console.log(`[streak-cron] Sent ${toNotify.length} streak warning(s)`);
    }
  } catch (err) {
    console.error('[streak-cron] Error:', err.message);
  }
}

// Run every 4 hours (in ms)
const STREAK_CRON_INTERVAL = 4 * 60 * 60 * 1000;
setInterval(checkStreakWarnings, STREAK_CRON_INTERVAL);
// Also run once 30s after startup
setTimeout(checkStreakWarnings, 30_000);
