const express = require('express');
const { prisma } = require('../lib/db');
const {
  hashPassword,
  createSession,
  sanitizeUser,
  requireAuth,
} = require('../lib/auth');
const { verifyIdToken } = require('../lib/firebase');
const { generateJournalFeedback, generateDailyChallenge, generateGrammarQuiz, generateReadingContent } = require('../lib/groqAI');

const { requireAdmin } = require('../middlewares/requireAdmin');

// Rate limiter for AI routes (expensive Groq calls)
let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch {
  // Fallback: no-op middleware if not installed
  rateLimit = null;
}

const aiRateLimiter = rateLimit
  ? rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 10, // 10 AI requests per minute per IP
      standardHeaders: true,
      legacyHeaders: false,
      message: { code: 'RATE_LIMITED', message: 'Too many AI requests, please try again in a minute' },
    })
  : (_req, _res, next) => next();

const router = express.Router();

// Helper for async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ─── Safe table helpers (work even if Prisma client not regenerated) ─────
async function tableExists(tableName) {
  try {
    const rows = await prisma.$queryRawUnsafe(`SELECT 1 FROM \`${tableName}\` LIMIT 1`);
    return true;
  } catch { return false; }
}

async function safeCountRaw(table, whereClause = '1=1') {
  try {
    const rows = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM \`${table}\` WHERE ${whereClause}`);
    return Number(rows[0].cnt);
  } catch { return 0; }
}

async function safeFindManyRaw(table, whereClause = '1=1', extra = '') {
  try {
    const rows = await prisma.$queryRawUnsafe(`SELECT * FROM \`${table}\` WHERE ${whereClause} ${extra}`);
    // Serialize dates & BigInts for JSON
    return rows.map(row => {
      const out = {};
      for (const [k, v] of Object.entries(row)) {
        if (v instanceof Date) out[k] = v.toISOString();
        else if (typeof v === 'bigint') out[k] = Number(v);
        else out[k] = v;
      }
      return out;
    });
  } catch { return []; }
}

async function getOrCreateOnboardingState(userId) {
  let state = await prisma.onboardingState.findUnique({
    where: { userId },
  });
  if (!state) {
    state = await prisma.onboardingState.create({
      data: { userId, step: 0, completed: false },
    });
  }
  return state;
}

/**
 * Track daily progress — upsert a ProgressDaily row for today.
 * Call this whenever the user does something meaningful.
 */
async function trackDailyProgress(userId, data = {}) {
  // Use Vietnam timezone (UTC+7) for day boundary so users see progress on their local date
  const vnNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  vnNow.setHours(0, 0, 0, 0);
  const today = vnNow;
  try {
    try {
      await prisma.progressDaily.upsert({
        where: { userId_day: { userId, day: today } },
        update: {
          journalsCount: { increment: data.journals || 0 },
          wordsLearned:  { increment: data.words || 0 },
          minutesSpent:  { increment: data.minutes || 0 },
          xpEarned:      { increment: data.xp || 0 },
        },
        create: {
          userId,
          day: today,
          journalsCount: data.journals || 0,
          wordsLearned:  data.words || 0,
          minutesSpent:  data.minutes || 0,
          xpEarned:      data.xp || 0,
        },
      });
    } catch (upsertErr) {
      // P2002: unique constraint race condition — fall back to plain update
      if (upsertErr?.code === 'P2002') {
        await prisma.progressDaily.update({
          where: { userId_day: { userId, day: today } },
          data: {
            journalsCount: { increment: data.journals || 0 },
            wordsLearned:  { increment: data.words || 0 },
            minutesSpent:  { increment: data.minutes || 0 },
            xpEarned:      { increment: data.xp || 0 },
          },
        });
      } else {
        throw upsertErr;
      }
    }
  } catch (err) {
    console.error('trackDailyProgress error:', err.message);
  }
}

/**
 * Create an in-app notification for a user.
 */
async function createNotification(userId, { type, title, body, data }) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: type || 'system',
        title,
        body,
        data: data ? JSON.stringify(data) : null,
      },
    });
  } catch (err) {
    console.error('createNotification error:', err.message);
  }
}

/**
 * Check and unlock achievements for a user.
 * Call after journal submit, feedback, streak update, vocab/phrase save.
 */
async function checkAndUnlockAchievements(userId) {
  try {
    const definitions = await prisma.achievementDefinition.findMany();
    const existing = await prisma.userAchievement.findMany({
      where: { userId },
    });
    const unlockedKeys = new Set();
    for (const ua of existing) {
      const def = definitions.find(d => d.id === ua.achievementId);
      if (def) unlockedKeys.add(def.key);
    }

    // Gather user stats
    const journalCount = await prisma.journal.count({
      where: { userId, deletedAt: null, status: 'submitted' },
    });

    // Calculate current streak
    const progressDays = await prisma.progressDaily.findMany({
      where: { userId },
      orderBy: { day: 'desc' },
      take: 365,
    });
    let currentStreak = 0;
    if (progressDays.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let checkDate = new Date(today);
      for (const pd of progressDays) {
        const pdDate = new Date(pd.day);
        pdDate.setHours(0, 0, 0, 0);
        const diff = Math.round((checkDate - pdDate) / 86400000);
        if (diff <= 1) {
          currentStreak++;
          checkDate = pdDate;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    const vocabCount = await prisma.vocabNotebookItem.count({ where: { userId } });
    const phraseCount = await prisma.savedPhrase.count({ where: { userId } });

    // Best journal score
    const bestJournal = await prisma.journal.findFirst({
      where: { userId, deletedAt: null, status: 'submitted', score: { not: null } },
      orderBy: { score: 'desc' },
    });
    const bestScore = bestJournal?.score || 0;

    // Check each definition
    const newlyUnlocked = [];
    for (const def of definitions) {
      if (unlockedKeys.has(def.key)) continue;

      let progress = 0;
      let qualified = false;

      switch (def.key) {
        case 'first_journal':
          progress = Math.min(journalCount, def.threshold);
          qualified = journalCount >= def.threshold;
          break;
        case 'journal_5':
        case 'journal_25':
          progress = Math.min(journalCount, def.threshold);
          qualified = journalCount >= def.threshold;
          break;
        case 'streak_3':
        case 'streak_7':
        case 'streak_30':
          progress = Math.min(currentStreak, def.threshold);
          qualified = currentStreak >= def.threshold;
          break;
        case 'vocab_10':
        case 'vocab_50':
          progress = Math.min(vocabCount, def.threshold);
          qualified = vocabCount >= def.threshold;
          break;
        case 'perfect_score':
          progress = bestScore >= 90 ? 1 : 0;
          qualified = bestScore >= 90;
          break;
        case 'phrase_collector':
          progress = Math.min(phraseCount, def.threshold);
          qualified = phraseCount >= def.threshold;
          break;
        default:
          // Unknown key — try generic category matching
          if (def.category === 'journal') {
            progress = Math.min(journalCount, def.threshold);
            qualified = journalCount >= def.threshold;
          } else if (def.category === 'streak') {
            progress = Math.min(currentStreak, def.threshold);
            qualified = currentStreak >= def.threshold;
          } else if (def.category === 'vocabulary') {
            progress = Math.min(vocabCount + phraseCount, def.threshold);
            qualified = (vocabCount + phraseCount) >= def.threshold;
          }
          break;
      }

      // Update progress for non-unlocked achievements
      const existingUa = existing.find(ua => ua.achievementId === def.id);
      if (existingUa && existingUa.progress !== progress) {
        await prisma.userAchievement.update({
          where: { id: existingUa.id },
          data: { progress },
        }).catch(() => {});
      }

      if (qualified) {
        await prisma.userAchievement.upsert({
          where: { userId_achievementId: { userId, achievementId: def.id } },
          update: { progress: def.threshold, unlockedAt: new Date() },
          create: { userId, achievementId: def.id, progress: def.threshold },
        });

        // Award XP
        if (def.xpReward > 0) {
          await trackDailyProgress(userId, { xp: def.xpReward });
        }

        newlyUnlocked.push(def);
      }
    }

    // Create notifications for newly unlocked achievements
    for (const def of newlyUnlocked) {
      await createNotification(userId, {
        type: 'achievement',
        title: `🏆 ${def.title}`,
        body: def.description,
        data: { achievementKey: def.key, xpReward: def.xpReward },
      });
    }

    return newlyUnlocked;
  } catch (err) {
    console.error('checkAndUnlockAchievements error:', err.message);
    return [];
  }
}

// ─── Health ───────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    scope: 'api-v1',
    timestamp: new Date().toISOString(),
  });
});

// ─── Auth: Local Register ────────────────────────────
router.post('/auth/register', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'name, email and password are required',
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existed = await prisma.user.findFirst({
    where: { email: normalizedEmail, isGuest: false },
  });
  if (existed) {
    return res.status(409).json({
      code: 'EMAIL_EXISTS',
      message: 'Email is already registered',
    });
  }

  const user = await prisma.user.create({
    data: {
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(String(password)),
      isGuest: false,
      bio: '',
      nativeLanguage: '',
    },
  });

  await getOrCreateOnboardingState(user.id);
  const accessToken = await createSession(user.id);

  res.status(201).json({ accessToken, user: sanitizeUser(user) });
}));

// ─── Auth: Local Login ───────────────────────────────
router.post('/auth/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'email and password are required',
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail, isGuest: false },
  });
  if (!user || user.passwordHash !== hashPassword(String(password))) {
    return res.status(401).json({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });
  }

  const accessToken = await createSession(user.id);
  res.status(200).json({ accessToken, user: sanitizeUser(user) });
}));

// ─── Auth: Guest ─────────────────────────────────────
router.post('/auth/guest', asyncHandler(async (_req, res) => {
  const guestCount = await prisma.user.count({ where: { isGuest: true } });

  const user = await prisma.user.create({
    data: {
      name: `Guest ${guestCount + 1}`,
      isGuest: true,
      bio: '',
      nativeLanguage: '',
    },
  });

  await getOrCreateOnboardingState(user.id);
  const accessToken = await createSession(user.id);

  res.status(201).json({ accessToken, user: sanitizeUser(user) });
}));

// ─── Auth: Firebase Login (Google, Email/Password, Phone, Anonymous) ──
router.post('/auth/firebase/login', asyncHandler(async (req, res) => {
  const { idToken } = req.body || {};
  if (!idToken) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'idToken is required',
    });
  }

  let decoded;
  try {
    decoded = await verifyIdToken(idToken);
  } catch (err) {
    console.error('Firebase token verification failed:', err.message);
    return res.status(401).json({
      code: 'INVALID_FIREBASE_TOKEN',
      message: 'Firebase ID token is invalid or expired',
    });
  }

  const firebaseUid = decoded.uid;
  const provider = decoded.firebase?.sign_in_provider || 'unknown';
  const firebaseEmail = decoded.email || null;
  const firebaseName = decoded.name || decoded.email?.split('@')[0] || `User`;
  const isAnonymous = provider === 'anonymous';

  // Check if this Firebase UID already exists
  let user = await prisma.user.findFirst({
    where: { firebaseUid },
  });

  if (user) {
    // Existing user — update name/email if changed
    if (firebaseEmail && firebaseEmail !== user.email) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { email: firebaseEmail },
      });
    }
  } else {
    // Check if email already has an account (link Firebase to existing account)
    if (firebaseEmail) {
      user = await prisma.user.findFirst({
        where: { email: firebaseEmail.toLowerCase(), isGuest: false },
      });
    }

    if (user) {
      // Link Firebase UID to existing email account
      user = await prisma.user.update({
        where: { id: user.id },
        data: { firebaseUid, firebaseProvider: provider },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          name: firebaseName,
          email: firebaseEmail ? firebaseEmail.toLowerCase() : null,
          firebaseUid,
          firebaseProvider: provider,
          isGuest: isAnonymous,
          bio: '',
          nativeLanguage: '',
        },
      });
      await getOrCreateOnboardingState(user.id);
    }
  }

  const accessToken = await createSession(user.id);
  res.status(200).json({ accessToken, user: sanitizeUser(user) });
}));

// ─── Auth: Logout ────────────────────────────────────
router.post('/auth/logout', requireAuth, asyncHandler(async (req, res) => {
  await prisma.session.deleteMany({
    where: { token: req.accessToken },
  });
  res.status(200).json({ message: 'Logged out' });
}));

// ─── Me ──────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  res.status(200).json({ user: sanitizeUser(req.authUser) });
});

// ─── Onboarding ──────────────────────────────────────
router.get('/onboarding/state', requireAuth, asyncHandler(async (req, res) => {
  const state = await getOrCreateOnboardingState(req.authUser.id);
  res.status(200).json({ state });
}));

router.put('/onboarding/state', requireAuth, asyncHandler(async (req, res) => {
  const { step, level, schedule, goal, completed } = req.body || {};
  const dataToUpdate = {};

  if (typeof step === 'number') dataToUpdate.step = step;
  if (typeof level !== 'undefined') dataToUpdate.level = level;
  if (typeof schedule !== 'undefined') dataToUpdate.schedule = schedule;
  if (typeof goal !== 'undefined') dataToUpdate.goal = typeof goal === 'object' ? JSON.stringify(goal) : goal;
  if (typeof completed === 'boolean') dataToUpdate.completed = completed;

  const state = await prisma.onboardingState.upsert({
    where: { userId: req.authUser.id },
    create: { userId: req.authUser.id, ...dataToUpdate },
    update: dataToUpdate,
  });

  const stateResponse = { ...state };
  if (stateResponse.goal && typeof stateResponse.goal === 'string' && stateResponse.goal.startsWith('[')) {
    try { stateResponse.goal = JSON.parse(stateResponse.goal); } catch {}
  }
  res.status(200).json({ state: stateResponse });
}));

router.post('/onboarding/complete', requireAuth, asyncHandler(async (req, res) => {
  const state = await prisma.onboardingState.update({
    where: { userId: req.authUser.id },
    data: { completed: true },
  });
  res.status(200).json({ state });
}));

// ─── Profile ─────────────────────────────────────────
router.get('/profile', requireAuth, (req, res) => {
  res.status(200).json({ user: sanitizeUser(req.authUser) });
});

router.put('/profile', requireAuth, asyncHandler(async (req, res) => {
  const { name, bio, nativeLanguage } = req.body || {};
  const updateData = {};

  if (typeof name === 'string' && name.trim()) updateData.name = name.trim();
  if (typeof bio === 'string') updateData.bio = bio;
  if (typeof nativeLanguage === 'string') updateData.nativeLanguage = nativeLanguage;

  const user = await prisma.user.update({
    where: { id: req.authUser.id },
    data: updateData,
  });
  res.status(200).json({ user: sanitizeUser(user) });
}));

// ─── Journals ────────────────────────────────────────
router.post('/journals', requireAuth, asyncHandler(async (req, res) => {
  const { title, content, language } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'title and content are required',
    });
  }

  // Per-day submission limit: only one submitted journal per user per calendar day (Vietnam timezone)
  const vnToday = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const todayStart = new Date(vnToday);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(vnToday);
  todayEnd.setHours(23, 59, 59, 999);
  const existingToday = await prisma.journal.findFirst({
    where: {
      userId: req.authUser.id,
      deletedAt: null,
      createdAt: { gte: todayStart, lte: todayEnd },
    },
  });
  if (existingToday) {
    // Return the existing journal instead of creating a duplicate
    return res.status(200).json({ journal: existingToday, reused: true });
  }

  const journal = await prisma.journal.create({
    data: {
      userId: req.authUser.id,
      title: String(title),
      content: String(content),
      language: language || 'en',
    },
  });

  // Track daily progress: +1 journal, +10 XP
  await trackDailyProgress(req.authUser.id, { journals: 1, xp: 10 });

  res.status(201).json({ journal });
}));

router.get('/journals', requireAuth, asyncHandler(async (req, res) => {
  const where = { userId: req.authUser.id, deletedAt: null };

  // GAP-17: filter by status (draft, submitted, etc.)
  const statusFilter = req.query.status;
  if (statusFilter && typeof statusFilter === 'string') {
    where.status = statusFilter;
  }

  const journals = await prisma.journal.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json({ items: journals, total: journals.length });
}));

router.get('/journals/:id', requireAuth, asyncHandler(async (req, res) => {
  const journal = await prisma.journal.findFirst({
    where: { id: req.params.id, userId: req.authUser.id, deletedAt: null },
  });
  if (!journal) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Journal not found' });
  }
  res.status(200).json({ journal });
}));

router.patch('/journals/:id', requireAuth, asyncHandler(async (req, res) => {
  const existing = await prisma.journal.findFirst({
    where: { id: req.params.id, userId: req.authUser.id, deletedAt: null },
  });
  if (!existing) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Journal not found' });
  }

  const { title, content, status } = req.body || {};
  const updateData = {};
  if (typeof title === 'string') updateData.title = title;
  if (typeof content === 'string') updateData.content = content;
  if (typeof status === 'string') updateData.status = status;

  const journal = await prisma.journal.update({
    where: { id: req.params.id },
    data: updateData,
  });
  res.status(200).json({ journal });
}));

router.delete('/journals/:id', requireAuth, asyncHandler(async (req, res) => {
  const existing = await prisma.journal.findFirst({
    where: { id: req.params.id, userId: req.authUser.id, deletedAt: null },
  });
  if (!existing) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Journal not found' });
  }

  await prisma.journal.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date() },
  });
  res.status(200).json({ message: 'Journal deleted' });
}));

// ─── Journal Review Items (vocab boosters from feedback) ─────────────────────
router.get('/journals/:id/review-items', requireAuth, asyncHandler(async (req, res) => {
  const journal = await prisma.journal.findFirst({
    where: { id: req.params.id, userId: req.authUser.id, deletedAt: null },
  });
  if (!journal) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Journal not found' });
  }
  let items = [];
  if (journal.feedback) {
    try {
      const fb = typeof journal.feedback === 'string' ? JSON.parse(journal.feedback) : journal.feedback;
      items = Array.isArray(fb?.vocabularyBoosters) ? fb.vocabularyBoosters : [];
    } catch {
      // feedback malformed — return empty
    }
  }
  res.status(200).json({ items, total: items.length });
}));

// ─── Daily Challenge ─────────────────────────────────
router.get('/daily-challenge', requireAuth, asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const challenge = await generateDailyChallenge(today);
  // Get user's day number from journal count
  const totalJournals = await prisma.journal.count({
    where: { userId: req.authUser.id, deletedAt: null },
  });
  res.status(200).json({
    ...challenge,
    date: today,
    dayNumber: totalJournals + 1,
  });
}));

// ─── Grammar Quiz ────────────────────────────────────
router.get('/ai/grammar-quiz', requireAuth, aiRateLimiter, asyncHandler(async (req, res) => {
  const count = Math.min(parseInt(req.query.count) || 5, 10);
  const onboarding = await prisma.onboardingState.findUnique({
    where: { userId: req.authUser.id },
  });
  const level = onboarding?.level || 'intermediate';
  const quiz = await generateGrammarQuiz(level, count);
  res.status(200).json(quiz);
}));

// ─── Reading Content ─────────────────────────────────
router.get('/ai/reading-content', requireAuth, aiRateLimiter, asyncHandler(async (req, res) => {
  const topic = req.query.topic || '';
  const onboarding = await prisma.onboardingState.findUnique({
    where: { userId: req.authUser.id },
  });
  const level = onboarding?.level || 'intermediate';
  const content = await generateReadingContent(topic, level);
  res.status(200).json(content);
}));

// ─── AI Feedback ─────────────────────────────────────
router.post('/ai/feedback/text', requireAuth, aiRateLimiter, asyncHandler(async (req, res) => {
  let { journalId, content, language } = req.body || {};

  if (!content && journalId) {
    const journal = await prisma.journal.findFirst({
      where: { id: journalId, userId: req.authUser.id, deletedAt: null },
    });
    if (!journal) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Journal not found or access denied' });
    }
    content = journal.content;
    language = journal.language;
  }

  if (!content) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'content is required',
    });
  }

  // Get user's level from onboarding
  const onboarding = await prisma.onboardingState.findUnique({
    where: { userId: req.authUser.id },
  });
  const level = onboarding?.level || 'intermediate';

  const startTime = Date.now();
  let feedback;
  try {
    feedback = await generateJournalFeedback({
      content,
      language: language || 'en',
      level,
    });

    // Log successful AI call
    const logId = require('crypto').randomUUID();
    const latency = Date.now() - startTime;
    await prisma.$queryRawUnsafe(
      `INSERT INTO \`AILog\` (id, userId, journalId, inputText, outputText, statusCode, latencyMs, createdAt)
       VALUES (?, ?, ?, ?, ?, 200, ?, NOW())`,
      logId, req.authUser.id, journalId || null, content, JSON.stringify(feedback), latency
    ).catch(() => {}); // non-blocking
  } catch (aiErr) {
    // Log failed AI call
    const logId2 = require('crypto').randomUUID();
    const latency2 = Date.now() - startTime;
    await prisma.$queryRawUnsafe(
      `INSERT INTO \`AILog\` (id, userId, journalId, inputText, statusCode, latencyMs, errorMessage, createdAt)
       VALUES (?, ?, ?, ?, 500, ?, ?, NOW())`,
      logId2, req.authUser.id, journalId || null, content, latency2, aiErr.message
    ).catch(() => {});
    throw aiErr;
  }

  // If journalId is provided, update the journal score and feedback
  if (journalId) {
    try {
      const updatedJournal = await prisma.journal.update({
        where: { id: journalId, userId: req.authUser.id },
        data: {
          score: feedback.overallScore || null,
          feedback: JSON.stringify(feedback),
          status: 'submitted',
        },
      });

      // Track XP based on score
      const bonusXp = Math.round((feedback.overallScore || 0) / 5);
      await trackDailyProgress(req.authUser.id, { xp: bonusXp });

      // Create a LearningSession record for history
      await prisma.learningSession.create({
        data: {
          userId: req.authUser.id,
          type: 'journal',
          title: updatedJournal.title || 'Journal Entry',
          summary: `Score: ${feedback.overallScore || 0}/100`,
          score: feedback.overallScore || null,
          metadata: JSON.stringify({ journalId }),
        },
      });

      // Check achievements after feedback (may unlock perfect_score, journal milestones)
      checkAndUnlockAchievements(req.authUser.id).catch(() => {});
    } catch (err) {
      console.error('Failed to update journal after AI feedback:', err.message);
    }
  }

  res.status(200).json({ feedback });
}));

// ─── Learning Sessions (create from practice modes) ─────────────────────
router.post('/learning-sessions', requireAuth, asyncHandler(async (req, res) => {
  const { type, title, summary, score, duration, metadata } = req.body || {};
  if (!type || !title) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'type and title are required' });
  }
  const allowedTypes = ['grammar', 'reading', 'listening', 'speaking', 'journal'];
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: `type must be one of: ${allowedTypes.join(', ')}` });
  }

  const session = await prisma.learningSession.create({
    data: {
      userId: req.authUser.id,
      type,
      title: String(title),
      summary: summary ? String(summary) : null,
      score: typeof score === 'number' ? score : null,
      duration: typeof duration === 'number' ? duration : null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });

  // Track XP for practice completion
  const xpMap = { grammar: 5, reading: 5, listening: 5, speaking: 5 };
  const xp = xpMap[type] || 0;
  if (xp > 0) {
    await trackDailyProgress(req.authUser.id, { xp });
  }

  res.status(201).json({ session });
}));

// ─── Settings ────────────────────────────────────────
router.get('/settings', requireAuth, asyncHandler(async (req, res) => {
  let settings = await prisma.userSettings.findUnique({
    where: { userId: req.authUser.id },
  });
  if (!settings) {
    settings = await prisma.userSettings.create({
      data: { userId: req.authUser.id },
    });
  }
  res.status(200).json({ settings });
}));

router.put('/settings', requireAuth, asyncHandler(async (req, res) => {
  const { theme, language, notificationsOn, soundOn, dailyGoalMinutes } = req.body || {};
  const data = {};
  if (typeof theme === 'string') data.theme = theme;
  if (typeof language === 'string') data.language = language;
  if (typeof notificationsOn === 'boolean') data.notificationsOn = notificationsOn;
  if (typeof soundOn === 'boolean') data.soundOn = soundOn;
  if (typeof dailyGoalMinutes === 'number') data.dailyGoalMinutes = dailyGoalMinutes;

  const settings = await prisma.userSettings.upsert({
    where: { userId: req.authUser.id },
    create: { userId: req.authUser.id, ...data },
    update: data,
  });
  res.status(200).json({ settings });
}));

// ─── Reminders ───────────────────────────────────────
router.get('/reminders', requireAuth, asyncHandler(async (req, res) => {
  const reminders = await prisma.reminder.findMany({
    where: { userId: req.authUser.id },
    orderBy: { createdAt: 'asc' },
  });
  res.status(200).json({ items: reminders, total: reminders.length });
}));

router.put('/reminders', requireAuth, asyncHandler(async (req, res) => {
  const { reminders } = req.body || {};
  if (!Array.isArray(reminders)) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'reminders array is required' });
  }

  // Delete existing and recreate (simple upsert strategy)
  await prisma.reminder.deleteMany({ where: { userId: req.authUser.id } });

  const created = [];
  for (const r of reminders) {
    const reminder = await prisma.reminder.create({
      data: {
        userId: req.authUser.id,
        time: r.time || '08:00',
        days: r.days || 'mon,tue,wed,thu,fri',
        enabled: r.enabled !== false,
        label: r.label || null,
      },
    });
    created.push(reminder);
  }
  res.status(200).json({ items: created, total: created.length });
}));

// ─── Notifications ───────────────────────────────────
router.get('/notifications', requireAuth, asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const cursor = req.query.cursor || null;

  const where = { userId: req.authUser.id };
  const findOptions = {
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
  };
  if (cursor) {
    findOptions.cursor = { id: cursor };
    findOptions.skip = 1;
  }

  const notifications = await prisma.notification.findMany(findOptions);
  const hasMore = notifications.length > limit;
  if (hasMore) notifications.pop();

  const unreadCount = await prisma.notification.count({
    where: { userId: req.authUser.id, read: false },
  });

  res.status(200).json({
    items: notifications,
    total: notifications.length,
    unreadCount,
    nextCursor: hasMore ? notifications[notifications.length - 1]?.id : null,
  });
}));

router.patch('/notifications/:id/read', requireAuth, asyncHandler(async (req, res) => {
  const notification = await prisma.notification.findFirst({
    where: { id: req.params.id, userId: req.authUser.id },
  });
  if (!notification) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Notification not found' });
  }
  const updated = await prisma.notification.update({
    where: { id: req.params.id },
    data: { read: true },
  });
  res.status(200).json({ notification: updated });
}));

router.post('/notifications/read-all', requireAuth, asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.authUser.id, read: false },
    data: { read: true },
  });
  res.status(200).json({ message: 'All notifications marked as read' });
}));

// ─── Achievements ────────────────────────────────────
router.get('/achievements', requireAuth, asyncHandler(async (req, res) => {
  const definitions = await prisma.achievementDefinition.findMany({
    orderBy: { category: 'asc' },
  });
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId: req.authUser.id },
  });

  const userMap = {};
  for (const ua of userAchievements) {
    userMap[ua.achievementId] = ua;
  }

  const items = definitions.map((def) => {
    const ua = userMap[def.id];
    const progress = ua?.progress || 0;
    return {
      ...def,
      unlocked: !!(ua && progress >= def.threshold),
      unlockedAt: (ua && progress >= def.threshold) ? ua.unlockedAt : null,
      progress,
    };
  });

  res.status(200).json({ items, total: items.length });
}));

router.get('/achievements/summary', requireAuth, asyncHandler(async (req, res) => {
  const totalDefinitions = await prisma.achievementDefinition.count();
  const totalUnlocked = await prisma.userAchievement.count({
    where: { userId: req.authUser.id },
  });
  const totalXp = await prisma.userAchievement.findMany({
    where: { userId: req.authUser.id },
    include: { achievement: true },
  });
  const xpEarned = totalXp.reduce((sum, ua) => sum + (ua.achievement?.xpReward || 0), 0);

  res.status(200).json({
    totalAchievements: totalDefinitions,
    unlocked: totalUnlocked,
    locked: totalDefinitions - totalUnlocked,
    xpEarned,
    completionPercent: totalDefinitions > 0 ? Math.round((totalUnlocked / totalDefinitions) * 100) : 0,
  });
}));

// ─── Saved Phrases ───────────────────────────────────
router.get('/phrases', requireAuth, asyncHandler(async (req, res) => {
  const category = req.query.category || undefined;
  const search = req.query.search || undefined;

  const where = { userId: req.authUser.id };
  if (category) where.category = category;
  if (search) {
    where.phrase = { contains: search };
  }

  const phrases = await prisma.savedPhrase.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json({ items: phrases, total: phrases.length });
}));

router.post('/phrases', requireAuth, asyncHandler(async (req, res) => {
  const { phrase, meaning, example, category } = req.body || {};
  if (!phrase) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'phrase is required' });
  }
  const saved = await prisma.savedPhrase.create({
    data: {
      userId: req.authUser.id,
      phrase: String(phrase),
      meaning: meaning || null,
      example: example || null,
      category: category || 'general',
    },
  });

  // Track daily progress: +2 XP
  await trackDailyProgress(req.authUser.id, { xp: 2 });

  // Check achievements (phrase_collector)
  checkAndUnlockAchievements(req.authUser.id).catch(() => {});

  res.status(201).json({ phrase: saved });
}));

router.delete('/phrases/:id', requireAuth, asyncHandler(async (req, res) => {
  const existing = await prisma.savedPhrase.findFirst({
    where: { id: req.params.id, userId: req.authUser.id },
  });
  if (!existing) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Phrase not found' });
  }
  await prisma.savedPhrase.delete({ where: { id: req.params.id } });
  res.status(200).json({ message: 'Phrase deleted' });
}));

// ─── Vocab Notebook ──────────────────────────────────
router.get('/vocab/notebook', requireAuth, asyncHandler(async (req, res) => {
  const mastery = req.query.mastery || undefined;
  const where = { userId: req.authUser.id };
  if (mastery) where.mastery = mastery;

  const items = await prisma.vocabNotebookItem.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  });
  res.status(200).json({ items, total: items.length });
}));

router.post('/vocab/notebook', requireAuth, asyncHandler(async (req, res) => {
  const { word, meaning, example, tags, notes } = req.body || {};
  if (!word) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'word is required' });
  }
  const item = await prisma.vocabNotebookItem.create({
    data: {
      userId: req.authUser.id,
      word: String(word),
      meaning: meaning || null,
      example: example || null,
      tags: tags || null,
      notes: notes || null,
    },
  });

  // Track daily progress: +1 word, +3 XP
  await trackDailyProgress(req.authUser.id, { words: 1, xp: 3 });

  // Check achievements (vocab milestones)
  checkAndUnlockAchievements(req.authUser.id).catch(() => {});

  res.status(201).json({ item });
}));

// ─── Vocab: Due for review (SRS) ─────────────────────
router.get('/vocab/notebook/due', requireAuth, asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const now = new Date();

  // Items due: nextReviewAt <= now OR nextReviewAt is null (never reviewed)
  const items = await prisma.vocabNotebookItem.findMany({
    where: {
      userId: req.authUser.id,
      mastery: { not: 'mastered' },
      OR: [
        { nextReviewAt: null },
        { nextReviewAt: { lte: now } },
      ],
    },
    orderBy: { nextReviewAt: 'asc' },
    take: limit,
  });
  res.status(200).json({ items, total: items.length });
}));

// ─── Vocab: Review with SM-2 algorithm ───────────────
router.post('/vocab/notebook/:id/review', requireAuth, asyncHandler(async (req, res) => {
  const existing = await prisma.vocabNotebookItem.findFirst({
    where: { id: req.params.id, userId: req.authUser.id },
  });
  if (!existing) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Vocab item not found' });
  }

  // quality: 0-5 (0=forgot, 3=correct with difficulty, 5=perfect recall)
  const quality = Math.max(0, Math.min(5, parseInt(req.body.quality) || 0));

  let { easeFactor, reviewInterval, reviewCount } = existing;
  easeFactor = easeFactor || 2.5;
  reviewInterval = reviewInterval || 0;
  reviewCount = reviewCount || 0;

  // SM-2 Algorithm
  if (quality >= 3) {
    // Correct response
    if (reviewCount === 0) {
      reviewInterval = 1;
    } else if (reviewCount === 1) {
      reviewInterval = 6;
    } else {
      reviewInterval = Math.round(reviewInterval * easeFactor);
    }
    reviewCount += 1;
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  } else {
    // Incorrect — reset
    reviewCount = 0;
    reviewInterval = 1;
    // easeFactor stays the same
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + reviewInterval);

  // Determine mastery level
  let mastery = 'new';
  if (reviewCount >= 5 && quality >= 4) {
    mastery = 'mastered';
  } else if (reviewCount >= 1) {
    mastery = 'learning';
  }

  const updated = await prisma.vocabNotebookItem.update({
    where: { id: req.params.id },
    data: { easeFactor, reviewInterval, reviewCount, nextReviewAt, mastery },
  });
  res.status(200).json({ item: updated });
}));

router.patch('/vocab/notebook/:id', requireAuth, asyncHandler(async (req, res) => {
  const existing = await prisma.vocabNotebookItem.findFirst({
    where: { id: req.params.id, userId: req.authUser.id },
  });
  if (!existing) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Vocab item not found' });
  }
  const { mastery, tags, notes, meaning, example } = req.body || {};
  const data = {};
  if (typeof mastery === 'string') data.mastery = mastery;
  if (typeof tags === 'string') data.tags = tags;
  if (typeof notes === 'string') data.notes = notes;
  if (typeof meaning === 'string') data.meaning = meaning;
  if (typeof example === 'string') data.example = example;

  const updated = await prisma.vocabNotebookItem.update({
    where: { id: req.params.id },
    data,
  });
  res.status(200).json({ item: updated });
}));

router.delete('/vocab/notebook/:id', requireAuth, asyncHandler(async (req, res) => {
  const existing = await prisma.vocabNotebookItem.findFirst({
    where: { id: req.params.id, userId: req.authUser.id },
  });
  if (!existing) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Vocab item not found' });
  }
  await prisma.vocabNotebookItem.delete({ where: { id: req.params.id } });
  res.status(200).json({ message: 'Vocab item deleted' });
}));

// ─── History (Learning Sessions) ─────────────────────
router.get('/history', requireAuth, asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const cursor = req.query.cursor || null;
  const type = req.query.type || undefined;

  const where = { userId: req.authUser.id };
  if (type) where.type = type;

  const findOptions = {
    where,
    orderBy: { completedAt: 'desc' },
    take: limit + 1,
  };
  if (cursor) {
    findOptions.cursor = { id: cursor };
    findOptions.skip = 1;
  }

  const sessions = await prisma.learningSession.findMany(findOptions);
  const hasMore = sessions.length > limit;
  if (hasMore) sessions.pop();

  res.status(200).json({
    items: sessions,
    total: sessions.length,
    nextCursor: hasMore ? sessions[sessions.length - 1]?.id : null,
  });
}));

router.get('/history/:id', requireAuth, asyncHandler(async (req, res) => {
  const session = await prisma.learningSession.findFirst({
    where: { id: req.params.id, userId: req.authUser.id },
  });
  if (!session) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Learning session not found' });
  }
  // Parse metadata JSON if present
  const result = { ...session };
  if (result.metadata) {
    try { result.metadata = JSON.parse(result.metadata); } catch {}
  }
  res.status(200).json({ session: result });
}));

// ─── Progress (Expanded) ────────────────────────────
router.get('/progress/summary', requireAuth, asyncHandler(async (req, res) => {
  const totalJournals = await prisma.journal.count({
    where: { userId: req.authUser.id, deletedAt: null },
  });
  const totalWords = await prisma.vocabNotebookItem.count({
    where: { userId: req.authUser.id },
  });
  const totalPhrases = await prisma.savedPhrase.count({
    where: { userId: req.authUser.id },
  });
  const totalSessions = await prisma.learningSession.count({
    where: { userId: req.authUser.id },
  });
  const onboarding = await getOrCreateOnboardingState(req.authUser.id);

  // Calculate streak (consecutive days with activity)
  const dailyProgress = await prisma.progressDaily.findMany({
    where: { userId: req.authUser.id },
    orderBy: { day: 'desc' },
    take: 60,
  });

  let currentStreak = 0;
  let bestStreak = 0;
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  today.setHours(0, 0, 0, 0);

  // Build a set of active date strings for fast lookup
  const activeDateSet = new Set();
  for (const p of dailyProgress) {
    if (p.journalsCount > 0 || p.minutesSpent > 0 || p.xpEarned > 0 || p.wordsLearned > 0) {
      activeDateSet.add(new Date(p.day).toISOString().split('T')[0]);
    }
  }

  // Calculate current streak
  for (let i = 0; i < 60; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    if (activeDateSet.has(dateStr)) {
      currentStreak++;
    } else if (i === 0) {
      continue; // Today might not have activity yet
    } else {
      break;
    }
  }

  // Calculate best streak (longest consecutive run in last 365 days)
  const allProgress = await prisma.progressDaily.findMany({
    where: { userId: req.authUser.id },
    orderBy: { day: 'asc' },
  });
  const allActiveDates = allProgress
    .filter(p => p.journalsCount > 0 || p.minutesSpent > 0 || p.xpEarned > 0 || p.wordsLearned > 0)
    .map(p => new Date(p.day).toISOString().split('T')[0])
    .sort();

  let tempStreak = 0;
  for (let i = 0; i < allActiveDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(allActiveDates[i - 1]);
      const curr = new Date(allActiveDates[i]);
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > bestStreak) bestStreak = tempStreak;
  }
  if (currentStreak > bestStreak) bestStreak = currentStreak;

  // Average score
  const journals = await prisma.journal.findMany({
    where: { userId: req.authUser.id, deletedAt: null, score: { not: null } },
    select: { score: true },
  });
  const avgScore = journals.length > 0
    ? Math.round(journals.reduce((s, j) => s + j.score, 0) / journals.length)
    : 0;

  // Total XP
  const totalXp = dailyProgress.reduce((sum, p) => sum + p.xpEarned, 0);

  // memberSince for day-number calculation
  const user = await prisma.user.findUnique({ where: { id: req.authUser.id }, select: { createdAt: true } });

  res.status(200).json({
    totalJournals,
    totalWords,
    totalPhrases,
    totalSessions,
    currentStreak,
    bestStreak,
    avgScore,
    totalXp,
    onboardingCompleted: onboarding.completed,
    level: onboarding.level || 'beginner',
    memberSince: user?.createdAt || null,
  });
}));

router.get('/progress/daily', requireAuth, asyncHandler(async (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 30, 90);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const progress = await prisma.progressDaily.findMany({
    where: {
      userId: req.authUser.id,
      day: { gte: startDate },
    },
    orderBy: { day: 'asc' },
  });

  res.status(200).json({ items: progress, days });
}));

// ─── Backfill ProgressDaily from historical data ─────
router.post('/progress/backfill', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.authUser.id;

  // Gather all journals
  const journals = await prisma.journal.findMany({
    where: { userId, deletedAt: null },
    select: { id: true, createdAt: true },
  });

  // Gather vocab items
  const vocabItems = await prisma.vocabNotebookItem.findMany({
    where: { userId },
    select: { createdAt: true },
  });

  // Gather saved phrases
  const phrases = await prisma.savedPhrase.findMany({
    where: { userId },
    select: { createdAt: true },
  });

  // Gather learning sessions
  const sessions = await prisma.learningSession.findMany({
    where: { userId },
    select: { completedAt: true, duration: true },
  });

  // Aggregate by day
  const dayMap = {};
  const getDay = (d) => {
    const dt = new Date(d);
    dt.setHours(0, 0, 0, 0);
    return dt.toISOString().split('T')[0];
  };

  for (const j of journals) {
    const k = getDay(j.createdAt);
    if (!dayMap[k]) dayMap[k] = { journals: 0, words: 0, minutes: 0, xp: 0 };
    dayMap[k].journals += 1;
    dayMap[k].xp += 10;
  }

  for (const v of vocabItems) {
    const k = getDay(v.createdAt);
    if (!dayMap[k]) dayMap[k] = { journals: 0, words: 0, minutes: 0, xp: 0 };
    dayMap[k].words += 1;
    dayMap[k].xp += 3;
  }

  for (const p of phrases) {
    const k = getDay(p.createdAt);
    if (!dayMap[k]) dayMap[k] = { journals: 0, words: 0, minutes: 0, xp: 0 };
    dayMap[k].xp += 2;
  }

  for (const s of sessions) {
    const k = getDay(s.completedAt);
    if (!dayMap[k]) dayMap[k] = { journals: 0, words: 0, minutes: 0, xp: 0 };
    dayMap[k].minutes += Math.round((s.duration || 0) / 60);
    dayMap[k].xp += 5;
  }

  // Upsert each day
  let upserted = 0;
  for (const [dateStr, data] of Object.entries(dayMap)) {
    const day = new Date(dateStr + 'T00:00:00');
    await prisma.progressDaily.upsert({
      where: { userId_day: { userId, day } },
      update: {
        journalsCount: data.journals,
        wordsLearned:  data.words,
        minutesSpent:  data.minutes,
        xpEarned:      data.xp,
      },
      create: {
        userId,
        day,
        journalsCount: data.journals,
        wordsLearned:  data.words,
        minutesSpent:  data.minutes,
        xpEarned:      data.xp,
      },
    });
    upserted++;
  }

  res.status(200).json({ message: 'Backfill complete', daysProcessed: upserted });
}));

// ─── Library / Lessons ───────────────────────────────
router.get('/library/lessons', asyncHandler(async (req, res) => {
  const category = req.query.category || undefined;
  const level = req.query.level || undefined;

  const where = { published: true };
  if (category) where.category = category;
  if (level) where.level = level;

  const lessons = await prisma.lesson.findMany({
    where,
    orderBy: [{ category: 'asc' }, { orderIndex: 'asc' }],
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      level: true,
      duration: true,
      orderIndex: true,
    },
  });
  res.status(200).json({ items: lessons, total: lessons.length });
}));

router.get('/library/lessons/:id', asyncHandler(async (req, res) => {
  const lesson = await prisma.lesson.findFirst({
    where: { id: req.params.id, published: true },
  });
  if (!lesson) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Lesson not found' });
  }
  res.status(200).json({ lesson });
}));

// ─── GAP-15: Lesson completion tracking ──────────────
router.post('/library/lessons/:id/complete', requireAuth, asyncHandler(async (req, res) => {
  const lesson = await prisma.lesson.findFirst({
    where: { id: req.params.id, published: true },
  });
  if (!lesson) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Lesson not found' });
  }

  const { duration } = req.body || {};
  const session = await prisma.learningSession.create({
    data: {
      userId: req.authUser.id,
      type: 'lesson',
      title: lesson.title,
      summary: `Completed lesson: ${lesson.category} / ${lesson.level}`,
      score: 100,
      duration: typeof duration === 'number' ? duration : null,
      metadata: JSON.stringify({ lessonId: lesson.id, category: lesson.category, level: lesson.level }),
    },
  });

  // Update daily progress
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.progressDaily.upsert({
    where: { userId_day: { userId: req.authUser.id, day: today } },
    create: { userId: req.authUser.id, day: today, xpEarned: 15, minutesSpent: lesson.duration || 0 },
    update: { xpEarned: { increment: 15 }, minutesSpent: { increment: lesson.duration || 0 } },
  });

  await checkAndUnlockAchievements(req.authUser.id);

  res.status(201).json({ session });
}));

// ─── Leaderboard ─────────────────────────────────────
router.get('/leaderboard', requireAuth, asyncHandler(async (req, res) => {
  const scope = req.query.scope || 'weekly'; // 'weekly' or 'all-time'

  let dateFilter = {};
  if (scope === 'weekly') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    dateFilter = { day: { gte: weekAgo } };
  }

  // Get all users' XP totals
  const userXp = await prisma.progressDaily.groupBy({
    by: ['userId'],
    where: dateFilter,
    _sum: { xpEarned: true },
    orderBy: { _sum: { xpEarned: 'desc' } },
    take: 20,
  });

  // Get user details
  const userIds = userXp.map(u => u.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const userMap = {};
  for (const u of users) userMap[u.id] = u;

  const items = userXp.map((entry, idx) => ({
    rank: idx + 1,
    userId: entry.userId,
    name: userMap[entry.userId]?.name || 'Unknown',
    score: entry._sum.xpEarned || 0,
    isUser: entry.userId === req.authUser.id,
  }));

  // If current user isn't in top 20, calculate their real rank
  const userInList = items.some(i => i.isUser);
  if (!userInList) {
    const userTotal = await prisma.progressDaily.aggregate({
      where: { userId: req.authUser.id, ...dateFilter },
      _sum: { xpEarned: true },
    });
    const userXpTotal = userTotal._sum.xpEarned || 0;

    // Count how many users have more XP than current user
    const usersAbove = await prisma.progressDaily.groupBy({
      by: ['userId'],
      where: dateFilter,
      _sum: { xpEarned: true },
      having: { xpEarned: { _sum: { gt: userXpTotal } } },
    });
    const realRank = usersAbove.length + 1;

    items.push({
      rank: realRank,
      userId: req.authUser.id,
      name: req.authUser.name || 'You',
      score: userXpTotal,
      isUser: true,
    });
  }

  res.status(200).json({ items, scope });
}));

// ─── Journal Mood ────────────────────────────────────
router.post('/journals/:id/mood', requireAuth, asyncHandler(async (req, res) => {
  const { mood } = req.body || {};
  if (!mood) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'mood is required' });
  }

  const journal = await prisma.journal.findFirst({
    where: { id: req.params.id, userId: req.authUser.id },
  });
  if (!journal) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Journal not found' });
  }

  // Store mood in journal feedback JSON
  let feedbackObj = {};
  if (journal.feedback) {
    try { feedbackObj = JSON.parse(journal.feedback); } catch {}
  }
  feedbackObj.mood = mood;

  await prisma.journal.update({
    where: { id: req.params.id },
    data: { feedback: JSON.stringify(feedbackObj) },
  });

  // Check achievements on completion (streak milestones may trigger here)
  checkAndUnlockAchievements(req.authUser.id).catch(() => {});

  res.status(200).json({ message: 'Mood saved', mood });
}));

// ─── Progress Daily Detail ──────────────────────────
router.get('/progress/daily/:date', requireAuth, asyncHandler(async (req, res) => {
  const dateStr = req.params.date; // YYYY-MM-DD
  const targetDate = new Date(dateStr);
  targetDate.setHours(0, 0, 0, 0);

  const progress = await prisma.progressDaily.findUnique({
    where: { userId_day: { userId: req.authUser.id, day: targetDate } },
  });

  if (!progress) {
    return res.status(200).json({ detail: null });
  }

  // Get journals written on that day
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const journals = await prisma.journal.findMany({
    where: {
      userId: req.authUser.id,
      createdAt: { gte: targetDate, lt: nextDay },
      deletedAt: null,
    },
    select: { id: true, title: true, score: true, createdAt: true },
  });

  res.status(200).json({
    detail: {
      ...progress,
      journals,
    },
  });
}));

// ═══════════════════════════════════════════════════════
// ─── ADMIN ROUTES ─────────────────────────────────────
// ═══════════════════════════════════════════════════════

// ─── Admin Auth ──────────────────────────────────────
router.post('/admin/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'email and password are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  // Use raw SQL to ensure `role` and `status` are always fetched,
  // even if Prisma client was generated before these columns were added.
  const rows = await prisma.$queryRaw`
    SELECT id, email, name, passwordHash, isGuest, role, status, createdAt
    FROM \`User\`
    WHERE email = ${normalizedEmail} AND isGuest = 0
    LIMIT 1
  `;
  const user = rows[0] || null;
  if (!user || user.passwordHash !== hashPassword(String(password))) {
    return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Email or password incorrect' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ code: 'NOT_ADMIN', message: 'This account does not have admin access' });
  }

  const accessToken = await createSession(user.id);
  res.status(200).json({ accessToken, user: sanitizeUser(user) });
}));

// ─── Admin: Prompts CRUD ─────────────────────────────
router.get('/admin/prompts', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { status, page = '1', limit = '20', from, to } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

  const conditions = ['1=1'];
  if (status && status !== 'all') conditions.push(`status = '${status}'`);
  if (from) conditions.push(`publishDate >= '${from}'`);
  if (to) conditions.push(`publishDate <= '${to}'`);
  const whereClause = conditions.join(' AND ');

  const offset = (pageNum - 1) * limitNum;
  const items = await safeFindManyRaw('DailyPrompt', whereClause, `ORDER BY publishDate DESC LIMIT ${limitNum} OFFSET ${offset}`);
  const total = await safeCountRaw('DailyPrompt', whereClause);

  res.status(200).json({ items, total, page: pageNum, limit: limitNum });
}));

router.get('/admin/prompts/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const rows = await safeFindManyRaw('DailyPrompt', `id = '${req.params.id}'`, 'LIMIT 1');
  if (rows.length === 0) return res.status(404).json({ code: 'NOT_FOUND', message: 'Prompt not found' });
  res.status(200).json({ prompt: rows[0] });
}));

router.post('/admin/prompts', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { publishDate, internalTitle, promptVi, promptEn, followUp, level } = req.body || {};
  if (!publishDate || !internalTitle || !promptVi || !promptEn) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'publishDate, internalTitle, promptVi, promptEn are required' });
  }

  const id = require('crypto').randomUUID();
  const safeVi = String(promptVi).replace(/'/g, "\\'");
  const safeEn = String(promptEn).replace(/'/g, "\\'");
  const safeTitle = String(internalTitle).replace(/'/g, "\\'");
  const safeFollowUp = followUp ? `'${String(followUp).replace(/'/g, "\\'")}'` : 'NULL';

  try {
    await prisma.$queryRawUnsafe(`
      INSERT INTO \`DailyPrompt\` (id, publishDate, internalTitle, promptVi, promptEn, followUp, level, status, createdBy, createdAt, updatedAt)
      VALUES ('${id}', '${publishDate}', '${safeTitle}', '${safeVi}', '${safeEn}', ${safeFollowUp}, '${level || 'basic'}', 'draft', '${req.authUser.id}', NOW(), NOW())
    `);
    const rows = await safeFindManyRaw('DailyPrompt', `id = '${id}'`, 'LIMIT 1');
    res.status(201).json({ prompt: rows[0] || { id } });
  } catch (err) {
    if (err?.message?.includes('Duplicate entry')) {
      return res.status(409).json({ code: 'DATE_CONFLICT', message: 'A prompt already exists for this date' });
    }
    throw err;
  }
}));

router.put('/admin/prompts/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { publishDate, internalTitle, promptVi, promptEn, followUp, level, status } = req.body || {};
  const sets = [];
  if (publishDate !== undefined) sets.push(`publishDate = '${publishDate}'`);
  if (internalTitle !== undefined) sets.push(`internalTitle = '${String(internalTitle).replace(/'/g, "\\'")}'`);
  if (promptVi !== undefined) sets.push(`promptVi = '${String(promptVi).replace(/'/g, "\\'")}'`);
  if (promptEn !== undefined) sets.push(`promptEn = '${String(promptEn).replace(/'/g, "\\'")}'`);
  if (followUp !== undefined) sets.push(followUp ? `followUp = '${String(followUp).replace(/'/g, "\\'")}'` : `followUp = NULL`);
  if (level !== undefined) sets.push(`level = '${level}'`);
  if (status !== undefined) sets.push(`status = '${status}'`);
  sets.push('updatedAt = NOW()');

  if (sets.length === 1) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'No fields to update' });

  try {
    const result = await prisma.$queryRawUnsafe(`UPDATE \`DailyPrompt\` SET ${sets.join(', ')} WHERE id = '${req.params.id}'`);
    const rows = await safeFindManyRaw('DailyPrompt', `id = '${req.params.id}'`, 'LIMIT 1');
    if (rows.length === 0) return res.status(404).json({ code: 'NOT_FOUND', message: 'Prompt not found' });
    res.status(200).json({ prompt: rows[0] });
  } catch (err) {
    if (err?.message?.includes('Duplicate entry')) return res.status(409).json({ code: 'DATE_CONFLICT', message: 'A prompt already exists for this date' });
    throw err;
  }
}));

router.delete('/admin/prompts/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const existing = await safeFindManyRaw('DailyPrompt', `id = '${req.params.id}'`, 'LIMIT 1');
  if (existing.length === 0) return res.status(404).json({ code: 'NOT_FOUND', message: 'Prompt not found' });
  await prisma.$queryRawUnsafe(`DELETE FROM \`DailyPrompt\` WHERE id = '${req.params.id}'`);
  res.status(200).json({ message: 'Prompt deleted' });
}));

router.post('/admin/prompts/:id/publish', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { status: newStatus } = req.body || {};
  if (!['scheduled', 'published'].includes(newStatus)) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'status must be scheduled or published' });
  }
  const existing = await safeFindManyRaw('DailyPrompt', `id = '${req.params.id}'`, 'LIMIT 1');
  if (existing.length === 0) return res.status(404).json({ code: 'NOT_FOUND', message: 'Prompt not found' });
  await prisma.$queryRawUnsafe(`UPDATE \`DailyPrompt\` SET status = '${newStatus}', updatedAt = NOW() WHERE id = '${req.params.id}'`);
  const rows = await safeFindManyRaw('DailyPrompt', `id = '${req.params.id}'`, 'LIMIT 1');
  res.status(200).json({ prompt: rows[0] });
}));

// ─── Daily Prompt for user app ───────────────────────
router.get('/daily-prompt/today', requireAuth, asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const rows = await safeFindManyRaw('DailyPrompt', `publishDate = '${today}' AND status IN ('scheduled', 'published')`, 'LIMIT 1');

  if (rows.length === 0) {
    return res.status(200).json({
      prompt: null,
      fallback: true,
      promptEn: 'What is on your mind today?',
      promptVi: 'Hôm nay bạn đang nghĩ gì?',
    });
  }

  const prompt = rows[0];
  // Auto-publish if scheduled
  if (prompt.status === 'scheduled') {
    await prisma.$queryRawUnsafe(`UPDATE \`DailyPrompt\` SET status = 'published', updatedAt = NOW() WHERE id = '${prompt.id}'`).catch(() => {});
  }

  res.status(200).json({
    prompt: {
      id: prompt.id,
      promptEn: prompt.promptEn,
      promptVi: prompt.promptVi,
      followUp: prompt.followUp,
      level: prompt.level,
    },
    fallback: false,
  });
}));

// ─── Admin: Metrics ──────────────────────────────────
router.get('/admin/metrics/cards', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const dateStr = req.query.date || new Date().toISOString().split('T')[0];
  const todayStart = `${dateStr} 00:00:00`;
  const todayEnd = `${dateStr} 23:59:59`;

  const yd = new Date(dateStr);
  yd.setDate(yd.getDate() - 1);
  const ydStr = yd.toISOString().split('T')[0];
  const ydStart = `${ydStr} 00:00:00`;
  const ydEnd = `${ydStr} 23:59:59`;

  // Sessions from ProgressDaily
  const todaySessions = await safeCountRaw('ProgressDaily', `day = '${dateStr}'`);
  const yesterdaySessions = await safeCountRaw('ProgressDaily', `day = '${ydStr}'`);

  // Submissions
  const todaySubmissions = await safeCountRaw('Journal', `status = 'submitted' AND createdAt >= '${todayStart}' AND createdAt <= '${todayEnd}'`);
  const completionRate = todaySessions > 0 ? todaySubmissions / todaySessions : 0;

  const yesterdaySubmissions = await safeCountRaw('Journal', `status = 'submitted' AND createdAt >= '${ydStart}' AND createdAt <= '${ydEnd}'`);
  const yesterdayCompletionRate = yesterdaySessions > 0 ? yesterdaySubmissions / yesterdaySessions : 0;

  // AI errors (safe — returns 0 if AILog table doesn't exist)
  const aiErrors = await safeCountRaw('AILog', `statusCode != 200 AND createdAt >= '${todayStart}' AND createdAt <= '${todayEnd}'`);
  const aiTotal = await safeCountRaw('AILog', `createdAt >= '${todayStart}' AND createdAt <= '${todayEnd}'`);
  const aiErrorRate = aiTotal > 0 ? aiErrors / aiTotal : 0;

  // D1 return
  const yesterdayUsers = await prisma.user.findMany({
    where: { createdAt: { gte: new Date(ydStart), lte: new Date(ydEnd) } },
    select: { id: true },
  });
  const ydIds = yesterdayUsers.map(u => u.id);
  let day1ReturnRate = 0;
  if (ydIds.length > 0) {
    const placeholders = ydIds.map(id => `'${id}'`).join(',');
    const returnedCount = await safeCountRaw('ProgressDaily', `userId IN (${placeholders}) AND day = '${dateStr}'`);
    day1ReturnRate = returnedCount / ydIds.length;
  }

  const td = new Date(ydStr);
  td.setDate(td.getDate() - 1);
  const tdStr = td.toISOString().split('T')[0];
  const twoDaysAgoUsers = await prisma.user.findMany({
    where: { createdAt: { gte: new Date(`${tdStr} 00:00:00`), lte: new Date(`${tdStr} 23:59:59`) } },
    select: { id: true },
  });
  let prevD1 = 0;
  if (twoDaysAgoUsers.length > 0) {
    const placeholders = twoDaysAgoUsers.map(u => `'${u.id}'`).join(',');
    const prevReturned = await safeCountRaw('ProgressDaily', `userId IN (${placeholders}) AND day = '${ydStr}'`);
    prevD1 = prevReturned / twoDaysAgoUsers.length;
  }

  res.status(200).json({
    todaySessions,
    yesterdaySessions,
    completionRate: Math.round(completionRate * 100) / 100,
    completionRateChange: Math.round((completionRate - yesterdayCompletionRate) * 100) / 100,
    aiErrorRate: Math.round(aiErrorRate * 100) / 100,
    aiErrorCount: aiErrors,
    day1ReturnRate: Math.round(day1ReturnRate * 100) / 100,
    day1ReturnChange: Math.round((day1ReturnRate - prevD1) * 100) / 100,
  });
}));

router.get('/admin/metrics/funnel', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const fromDate = from || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const toDate = to || new Date().toISOString().split('T')[0];
  const fStart = `${fromDate} 00:00:00`;
  const tEnd = `${toDate} 23:59:59`;

  const sessions = await safeCountRaw('ProgressDaily', `day >= '${fromDate}' AND day <= '${toDate}'`);
  const submissions = await safeCountRaw('Journal', `status != 'draft' AND createdAt >= '${fStart}' AND createdAt <= '${tEnd}'`);
  const aiLogs = await safeCountRaw('AILog', `statusCode = 200 AND createdAt >= '${fStart}' AND createdAt <= '${tEnd}'`);
  const completions = await safeCountRaw('Journal', `status = 'submitted' AND createdAt >= '${fStart}' AND createdAt <= '${tEnd}'`);

  // Use real data instead of estimates
  const drafts = await safeCountRaw('Journal', `status = 'draft' AND createdAt >= '${fStart}' AND createdAt <= '${tEnd}'`);

  const steps = [
    { step: 'session_start', count: sessions },
    { step: 'prompt_view', count: sessions }, // every session sees a prompt
    { step: 'draft_saved', count: drafts + submissions },
    { step: 'submission_sent', count: submissions },
    { step: 'feedback_view', count: aiLogs },
    { step: 'completion_view', count: completions },
  ];

  res.status(200).json({ steps });
}));

router.get('/admin/metrics/retention', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const fromDate = from || new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0];
  const toDate = to || new Date().toISOString().split('T')[0];

  const cohorts = [];
  const current = new Date(fromDate);
  const end = new Date(toDate);

  while (current <= end) {
    const dayStr = current.toISOString().split('T')[0];
    const dayStart = `${dayStr} 00:00:00`;
    const dayEnd = `${dayStr} 23:59:59`;

    const users = await prisma.user.findMany({
      where: { createdAt: { gte: new Date(dayStart), lte: new Date(dayEnd) } },
      select: { id: true },
    });
    const totalUsers = users.length;

    if (totalUsers > 0) {
      const ids = users.map(u => `'${u.id}'`).join(',');
      const d1 = new Date(current); d1.setDate(d1.getDate() + 1);
      const d2 = new Date(current); d2.setDate(d2.getDate() + 2);
      const d3 = new Date(current); d3.setDate(d3.getDate() + 3);
      const d1Str = d1.toISOString().split('T')[0];
      const d2Str = d2.toISOString().split('T')[0];
      const d3Str = d3.toISOString().split('T')[0];

      const [d1Count, d2Count, d3Count] = await Promise.all([
        safeCountRaw('ProgressDaily', `userId IN (${ids}) AND day = '${d1Str}'`),
        safeCountRaw('ProgressDaily', `userId IN (${ids}) AND day = '${d2Str}'`),
        safeCountRaw('ProgressDaily', `userId IN (${ids}) AND day = '${d3Str}'`),
      ]);

      cohorts.push({
        registeredDate: dayStr,
        totalUsers,
        d1: Math.round((d1Count / totalUsers) * 100) / 100,
        d2: Math.round((d2Count / totalUsers) * 100) / 100,
        d3: Math.round((d3Count / totalUsers) * 100) / 100,
      });
    }

    current.setDate(current.getDate() + 1);
  }

  res.status(200).json({ cohorts });
}));

router.get('/admin/metrics/ai-health', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const daily = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dStart = `${dateStr} 00:00:00`;
    const dEnd = `${dateStr} 23:59:59`;

    const logs = await safeFindManyRaw('AILog', `createdAt >= '${dStart}' AND createdAt <= '${dEnd}'`, '');
    const totalRequests = logs.length;
    const errorCount = logs.filter(l => l.statusCode !== 200).length;
    const avgLatencyMs = totalRequests > 0
      ? Math.round(logs.reduce((sum, l) => sum + (l.latencyMs || 0), 0) / totalRequests)
      : 0;

    daily.push({ date: dateStr, avgLatencyMs, errorCount, totalRequests });
  }

  res.status(200).json({ daily });
}));

// ─── Admin: Users ────────────────────────────────────
router.get('/admin/users', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { search, page = '1', limit = '20', sort = 'createdAt' } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

  // Map frontend sort values to Prisma column names
  const sortMap = { recent: 'createdAt', streak: 'createdAt', active: 'updatedAt', createdAt: 'createdAt', name: 'name' };
  const orderField = sortMap[sort] || 'createdAt';

  const where = {};
  if (search) {
    where.OR = [
      { email: { contains: search } },
      { name: { contains: search } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { [orderField]: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      include: {
        progressDaily: { orderBy: { day: 'desc' }, take: 1 },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const items = await Promise.all(users.map(async (u) => {
    const progressDays = await prisma.progressDaily.count({ where: { userId: u.id } });
    const latestProgress = u.progressDaily[0];
    const journalCount = await prisma.journal.count({ where: { userId: u.id, deletedAt: null } });

    let streak = 0;
    if (latestProgress) {
      const daysData = await prisma.progressDaily.findMany({
        where: { userId: u.id },
        orderBy: { day: 'desc' },
        take: 30,
        select: { day: true },
      });
      let expected = new Date();
      expected.setHours(0, 0, 0, 0);
      for (const d of daysData) {
        const dayDate = new Date(d.day);
        dayDate.setHours(0, 0, 0, 0);
        if (dayDate.getTime() === expected.getTime()) {
          streak++;
          expected.setDate(expected.getDate() - 1);
        } else if (dayDate.getTime() === expected.getTime() + 86400000) {
          streak++;
          expected = new Date(dayDate);
          expected.setDate(expected.getDate() - 1);
        } else {
          break;
        }
      }
    }

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      isGuest: u.isGuest,
      role: u.role,
      status: u.status || 'active',
      createdAt: u.createdAt,
      stats: {
        totalDays: progressDays,
        currentStreak: streak,
        totalJournals: journalCount,
        lastActiveAt: latestProgress ? latestProgress.day : null,
      },
    };
  }));

  res.status(200).json({ items, total, page: pageNum, limit: limitNum });
}));

router.get('/admin/users/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      onboarding: true,
      progressDaily: { orderBy: { day: 'desc' }, take: 30 },
    },
  });
  if (!user) return res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' });

  const [journalCount, wordCount, minuteSum] = await Promise.all([
    prisma.journal.count({ where: { userId: user.id, deletedAt: null } }),
    prisma.progressDaily.aggregate({ where: { userId: user.id }, _sum: { wordsLearned: true } }),
    prisma.progressDaily.aggregate({ where: { userId: user.id }, _sum: { minutesSpent: true } }),
  ]);

  let streak = 0;
  const daysData = user.progressDaily;
  if (daysData.length > 0) {
    let expected = new Date();
    expected.setHours(0, 0, 0, 0);
    for (const d of daysData) {
      const dayDate = new Date(d.day);
      dayDate.setHours(0, 0, 0, 0);
      if (dayDate.getTime() === expected.getTime()) {
        streak++;
        expected.setDate(expected.getDate() - 1);
      } else if (dayDate.getTime() === expected.getTime() + 86400000) {
        streak++;
        expected = new Date(dayDate);
        expected.setDate(expected.getDate() - 1);
      } else {
        break;
      }
    }
  }

  const recentJournals = await prisma.journal.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, title: true, content: true, status: true, score: true, createdAt: true },
  });

  res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isGuest: user.isGuest,
      role: user.role,
      status: user.status || 'active',
      bio: user.bio,
      nativeLanguage: user.nativeLanguage,
      createdAt: user.createdAt,
      onboarding: user.onboarding ? {
        completed: user.onboarding.completed,
        level: user.onboarding.level,
        goal: user.onboarding.goal,
      } : null,
      stats: {
        totalDays: daysData.length,
        currentStreak: streak,
        totalJournals: journalCount,
        totalWordsLearned: wordCount._sum.wordsLearned || 0,
        totalMinutes: minuteSum._sum.minutesSpent || 0,
        lastActiveAt: daysData[0]?.day || null,
      },
    },
    recentJournals,
  });
}));

router.patch('/admin/users/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { role, status } = req.body || {};

  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' });

  // Prevent admin from changing their own role
  if (role && req.params.id === req.authUser.id) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Cannot change your own role' });
  }

  const data = {};
  if (role && ['user', 'admin'].includes(role)) data.role = role;
  if (status && ['active', 'banned'].includes(status)) data.status = status;

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'No valid fields to update' });
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  res.status(200).json({ user: updated });
}));

// ─── Admin: AI Logs ──────────────────────────────────
router.get('/admin/ai-logs', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { status, page = '1', limit = '20', from, to } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

  const conditions = ['1=1'];
  if (status === '200') conditions.push('statusCode = 200');
  else if (status === '500') conditions.push('statusCode != 200');
  if (from) conditions.push(`createdAt >= '${from} 00:00:00'`);
  if (to) conditions.push(`createdAt <= '${to} 23:59:59'`);

  const whereClause = conditions.join(' AND ');
  const total = await safeCountRaw('AILog', whereClause);
  const offset = (pageNum - 1) * limitNum;
  const logs = await safeFindManyRaw('AILog', whereClause, `ORDER BY createdAt DESC LIMIT ${limitNum} OFFSET ${offset}`);

  const userIds = [...new Set(logs.map(l => l.userId).filter(Boolean))];
  let userMap = {};
  if (userIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    userMap = Object.fromEntries(users.map(u => [u.id, u.name]));
  }

  const items = logs.map(l => ({ ...l, userName: userMap[l.userId] || 'Unknown' }));
  res.status(200).json({ items, total, page: pageNum, limit: limitNum });
}));

router.get('/admin/ai-logs/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const logs = await safeFindManyRaw('AILog', `id = '${req.params.id}'`, 'LIMIT 1');
  if (logs.length === 0) return res.status(404).json({ code: 'NOT_FOUND', message: 'AI Log not found' });
  const log = logs[0];

  const user = await prisma.user.findUnique({
    where: { id: log.userId },
    select: { id: true, name: true, email: true },
  });

  res.status(200).json({ log: { ...log, userName: user?.name || 'Unknown', userEmail: user?.email || null } });
}));

// ─── Admin: Config ───────────────────────────────────
router.get('/admin/config', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const items = await safeFindManyRaw('AppConfig', '1=1', 'ORDER BY `key` ASC');
  res.status(200).json({ items });
}));

router.put('/admin/config/:key', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { value } = req.body || {};
  if (value === undefined) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'value is required' });
  }

  const keyParam = req.params.key;
  const existing = await safeFindManyRaw('AppConfig', `\`key\` = '${keyParam}'`, 'LIMIT 1');
  let config;
  if (existing.length > 0) {
    await prisma.$queryRawUnsafe(`UPDATE \`AppConfig\` SET value = '${String(value)}', updatedBy = '${req.authUser.id}', updatedAt = NOW() WHERE \`key\` = '${keyParam}'`);
    config = { ...existing[0], value: String(value), updatedBy: req.authUser.id };
  } else {
    const id = require('crypto').randomUUID();
    await prisma.$queryRawUnsafe(`INSERT INTO \`AppConfig\` (id, \`key\`, value, updatedBy, createdAt, updatedAt) VALUES ('${id}', '${keyParam}', '${String(value)}', '${req.authUser.id}', NOW(), NOW())`);
    config = { id, key: keyParam, value: String(value), updatedBy: req.authUser.id };
  }

  res.status(200).json({ config });
}));

// ─── Account Deletion ────────────────────────────────
router.delete('/me', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.authUser.id;

  // Delete all user data (cascade handles most via Prisma schema)
  // But some tables may not cascade — clean up manually
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.userAchievement.deleteMany({ where: { userId } });
  await prisma.savedPhrase.deleteMany({ where: { userId } });
  await prisma.vocabNotebookItem.deleteMany({ where: { userId } });
  await prisma.learningSession.deleteMany({ where: { userId } });
  await prisma.progressDaily.deleteMany({ where: { userId } });
  await prisma.journal.deleteMany({ where: { userId } });
  await prisma.reminder.deleteMany({ where: { userId } });

  // Delete settings & onboarding
  await prisma.userSettings.deleteMany({ where: { userId } }).catch(() => {});
  await prisma.onboardingState.deleteMany({ where: { userId } }).catch(() => {});

  // Finally delete the user
  await prisma.user.delete({ where: { id: userId } });

  res.status(200).json({ message: 'Account deleted successfully' });
}));

// ─── Error Handler ───────────────────────────────────
router.use((err, _req, res, _next) => {
  console.error('API Error:', err);
  res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
});

module.exports = router;
