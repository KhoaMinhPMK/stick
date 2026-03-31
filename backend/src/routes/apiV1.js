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

const router = express.Router();

// Helper for async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
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
  const journals = await prisma.journal.findMany({
    where: { userId: req.authUser.id, deletedAt: null },
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
router.get('/ai/grammar-quiz', requireAuth, asyncHandler(async (req, res) => {
  const count = Math.min(parseInt(req.query.count) || 5, 10);
  const onboarding = await prisma.onboardingState.findUnique({
    where: { userId: req.authUser.id },
  });
  const level = onboarding?.level || 'intermediate';
  const quiz = await generateGrammarQuiz(level, count);
  res.status(200).json(quiz);
}));

// ─── Reading Content ─────────────────────────────────
router.get('/ai/reading-content', requireAuth, asyncHandler(async (req, res) => {
  const topic = req.query.topic || '';
  const onboarding = await prisma.onboardingState.findUnique({
    where: { userId: req.authUser.id },
  });
  const level = onboarding?.level || 'intermediate';
  const content = await generateReadingContent(topic, level);
  res.status(200).json(content);
}));

// ─── AI Feedback ─────────────────────────────────────
router.post('/ai/feedback/text', requireAuth, asyncHandler(async (req, res) => {
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
    await prisma.aILog.create({
      data: {
        userId: req.authUser.id,
        journalId: journalId || null,
        inputText: content,
        outputText: JSON.stringify(feedback),
        statusCode: 200,
        latencyMs: Date.now() - startTime,
      },
    }).catch(() => {}); // non-blocking
  } catch (aiErr) {
    // Log failed AI call
    await prisma.aILog.create({
      data: {
        userId: req.authUser.id,
        journalId: journalId || null,
        inputText: content,
        statusCode: 500,
        latencyMs: Date.now() - startTime,
        errorMessage: aiErr.message,
      },
    }).catch(() => {});
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
    } catch (err) {
      console.error('Failed to update journal after AI feedback:', err.message);
    }
  }

  res.status(200).json({ feedback });
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

  const items = definitions.map((def) => ({
    ...def,
    unlocked: !!userMap[def.id],
    unlockedAt: userMap[def.id]?.unlockedAt || null,
    progress: userMap[def.id]?.progress || 0,
  }));

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

  res.status(201).json({ item });
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
  const today = new Date();
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

  // If current user isn't in top 20, add them
  const userInList = items.some(i => i.isUser);
  if (!userInList) {
    const userTotal = await prisma.progressDaily.aggregate({
      where: { userId: req.authUser.id, ...dateFilter },
      _sum: { xpEarned: true },
    });
    items.push({
      rank: items.length + 1,
      userId: req.authUser.id,
      name: req.authUser.name || 'You',
      score: userTotal._sum.xpEarned || 0,
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

  const where = {};
  if (status && status !== 'all') where.status = status;
  if (from || to) {
    where.publishDate = {};
    if (from) where.publishDate.gte = new Date(from);
    if (to) where.publishDate.lte = new Date(to);
  }

  const [items, total] = await Promise.all([
    prisma.dailyPrompt.findMany({
      where,
      orderBy: { publishDate: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.dailyPrompt.count({ where }),
  ]);

  res.status(200).json({ items, total, page: pageNum, limit: limitNum });
}));

router.get('/admin/prompts/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const prompt = await prisma.dailyPrompt.findUnique({ where: { id: req.params.id } });
  if (!prompt) return res.status(404).json({ code: 'NOT_FOUND', message: 'Prompt not found' });
  res.status(200).json({ prompt });
}));

router.post('/admin/prompts', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { publishDate, internalTitle, promptVi, promptEn, followUp, level } = req.body || {};
  if (!publishDate || !internalTitle || !promptVi || !promptEn) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'publishDate, internalTitle, promptVi, promptEn are required' });
  }

  try {
    const prompt = await prisma.dailyPrompt.create({
      data: {
        publishDate: new Date(publishDate),
        internalTitle,
        promptVi,
        promptEn,
        followUp: followUp || null,
        level: level || 'basic',
        status: 'draft',
        createdBy: req.authUser.id,
      },
    });
    res.status(201).json({ prompt });
  } catch (err) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ code: 'DATE_CONFLICT', message: 'A prompt already exists for this date' });
    }
    throw err;
  }
}));

router.put('/admin/prompts/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { publishDate, internalTitle, promptVi, promptEn, followUp, level, status } = req.body || {};
  const data = {};
  if (publishDate !== undefined) data.publishDate = new Date(publishDate);
  if (internalTitle !== undefined) data.internalTitle = internalTitle;
  if (promptVi !== undefined) data.promptVi = promptVi;
  if (promptEn !== undefined) data.promptEn = promptEn;
  if (followUp !== undefined) data.followUp = followUp || null;
  if (level !== undefined) data.level = level;
  if (status !== undefined) data.status = status;

  try {
    const prompt = await prisma.dailyPrompt.update({ where: { id: req.params.id }, data });
    res.status(200).json({ prompt });
  } catch (err) {
    if (err?.code === 'P2025') return res.status(404).json({ code: 'NOT_FOUND', message: 'Prompt not found' });
    if (err?.code === 'P2002') return res.status(409).json({ code: 'DATE_CONFLICT', message: 'A prompt already exists for this date' });
    throw err;
  }
}));

router.delete('/admin/prompts/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  try {
    await prisma.dailyPrompt.delete({ where: { id: req.params.id } });
    res.status(200).json({ message: 'Prompt deleted' });
  } catch (err) {
    if (err?.code === 'P2025') return res.status(404).json({ code: 'NOT_FOUND', message: 'Prompt not found' });
    throw err;
  }
}));

router.post('/admin/prompts/:id/publish', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { status: newStatus } = req.body || {};
  if (!['scheduled', 'published'].includes(newStatus)) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'status must be scheduled or published' });
  }
  try {
    const prompt = await prisma.dailyPrompt.update({ where: { id: req.params.id }, data: { status: newStatus } });
    res.status(200).json({ prompt });
  } catch (err) {
    if (err?.code === 'P2025') return res.status(404).json({ code: 'NOT_FOUND', message: 'Prompt not found' });
    throw err;
  }
}));

// ─── Daily Prompt for user app ───────────────────────
router.get('/daily-prompt/today', requireAuth, asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prompt = await prisma.dailyPrompt.findFirst({
    where: {
      publishDate: today,
      status: { in: ['scheduled', 'published'] },
    },
  });

  if (!prompt) {
    return res.status(200).json({
      prompt: null,
      fallback: true,
      promptEn: 'What is on your mind today?',
      promptVi: 'Hôm nay bạn đang nghĩ gì?',
    });
  }

  // Auto-publish if scheduled
  if (prompt.status === 'scheduled') {
    await prisma.dailyPrompt.update({ where: { id: prompt.id }, data: { status: 'published' } }).catch(() => {});
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
  const targetDate = new Date(dateStr);
  targetDate.setHours(0, 0, 0, 0);
  const yesterday = new Date(targetDate);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayEnd = new Date(targetDate);
  todayEnd.setHours(23, 59, 59, 999);
  const yesterdayEnd = new Date(yesterday);
  yesterdayEnd.setHours(23, 59, 59, 999);

  const [todaySessions, yesterdaySessions] = await Promise.all([
    prisma.progressDaily.count({ where: { day: targetDate } }),
    prisma.progressDaily.count({ where: { day: yesterday } }),
  ]);

  const todaySubmissions = await prisma.journal.count({
    where: { status: 'submitted', createdAt: { gte: targetDate, lte: todayEnd } },
  });
  const completionRate = todaySessions > 0 ? todaySubmissions / todaySessions : 0;

  const yesterdaySubmissions = await prisma.journal.count({
    where: { status: 'submitted', createdAt: { gte: yesterday, lte: yesterdayEnd } },
  });
  const yesterdayCompletionRate = yesterdaySessions > 0 ? yesterdaySubmissions / yesterdaySessions : 0;

  const [aiErrors, aiTotal] = await Promise.all([
    prisma.aILog.count({ where: { statusCode: { not: 200 }, createdAt: { gte: targetDate, lte: todayEnd } } }),
    prisma.aILog.count({ where: { createdAt: { gte: targetDate, lte: todayEnd } } }),
  ]);
  const aiErrorRate = aiTotal > 0 ? aiErrors / aiTotal : 0;

  // D1 return: users registered yesterday who came back today
  const yesterdayUsers = await prisma.user.findMany({
    where: { createdAt: { gte: yesterday, lte: yesterdayEnd } },
    select: { id: true },
  });
  const yesterdayUserIds = yesterdayUsers.map(u => u.id);
  let day1ReturnRate = 0;
  if (yesterdayUserIds.length > 0) {
    const returnedCount = await prisma.progressDaily.count({
      where: { userId: { in: yesterdayUserIds }, day: targetDate },
    });
    day1ReturnRate = returnedCount / yesterdayUserIds.length;
  }

  const twoDaysAgo = new Date(yesterday);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);
  const twoDaysAgoEnd = new Date(twoDaysAgo);
  twoDaysAgoEnd.setHours(23, 59, 59, 999);
  const twoDaysAgoUsers = await prisma.user.findMany({
    where: { createdAt: { gte: twoDaysAgo, lte: twoDaysAgoEnd } },
    select: { id: true },
  });
  let prevD1 = 0;
  if (twoDaysAgoUsers.length > 0) {
    const prevReturned = await prisma.progressDaily.count({
      where: { userId: { in: twoDaysAgoUsers.map(u => u.id) }, day: yesterday },
    });
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
  const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 86400000);
  const toDate = to ? new Date(to) : new Date();
  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(23, 59, 59, 999);

  const dateFilter = { gte: fromDate, lte: toDate };

  const [sessions, submissions, aiLogs, completions] = await Promise.all([
    prisma.progressDaily.count({ where: { day: { gte: fromDate, lte: toDate } } }),
    prisma.journal.count({ where: { createdAt: dateFilter, status: { not: 'draft' } } }),
    prisma.aILog.count({ where: { createdAt: dateFilter, statusCode: 200 } }),
    prisma.journal.count({ where: { createdAt: dateFilter, status: 'submitted' } }),
  ]);

  const steps = [
    { step: 'session_start', count: sessions },
    { step: 'prompt_view', count: Math.round(sessions * 0.95) },
    { step: 'draft_saved', count: submissions + Math.round(submissions * 0.15) },
    { step: 'submission_sent', count: submissions },
    { step: 'feedback_view', count: aiLogs },
    { step: 'completion_view', count: completions },
  ];

  res.status(200).json({ steps });
}));

router.get('/admin/metrics/retention', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const fromDate = from ? new Date(from) : new Date(Date.now() - 10 * 86400000);
  const toDate = to ? new Date(to) : new Date();
  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(23, 59, 59, 999);

  const cohorts = [];
  const current = new Date(fromDate);
  while (current <= toDate) {
    const dayStart = new Date(current);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(current);
    dayEnd.setHours(23, 59, 59, 999);

    const users = await prisma.user.findMany({
      where: { createdAt: { gte: dayStart, lte: dayEnd } },
      select: { id: true },
    });
    const userIds = users.map(u => u.id);
    const totalUsers = userIds.length;

    if (totalUsers > 0) {
      const d1Date = new Date(dayStart);
      d1Date.setDate(d1Date.getDate() + 1);
      const d2Date = new Date(dayStart);
      d2Date.setDate(d2Date.getDate() + 2);
      const d3Date = new Date(dayStart);
      d3Date.setDate(d3Date.getDate() + 3);

      const [d1Count, d2Count, d3Count] = await Promise.all([
        prisma.progressDaily.count({ where: { userId: { in: userIds }, day: d1Date } }),
        prisma.progressDaily.count({ where: { userId: { in: userIds }, day: d2Date } }),
        prisma.progressDaily.count({ where: { userId: { in: userIds }, day: d3Date } }),
      ]);

      cohorts.push({
        registeredDate: dayStart.toISOString().split('T')[0],
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
    date.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const logs = await prisma.aILog.findMany({
      where: { createdAt: { gte: date, lte: dateEnd } },
      select: { latencyMs: true, statusCode: true },
    });

    const totalRequests = logs.length;
    const errorCount = logs.filter(l => l.statusCode !== 200).length;
    const avgLatencyMs = totalRequests > 0
      ? Math.round(logs.reduce((sum, l) => sum + l.latencyMs, 0) / totalRequests)
      : 0;

    daily.push({
      date: date.toISOString().split('T')[0],
      avgLatencyMs,
      errorCount,
      totalRequests,
    });
  }

  res.status(200).json({ daily });
}));

// ─── Admin: Users ────────────────────────────────────
router.get('/admin/users', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { search, page = '1', limit = '20', sort = 'createdAt' } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

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
      orderBy: { [sort]: 'desc' },
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

  const where = {};
  if (status === '200') where.statusCode = 200;
  else if (status === '500') where.statusCode = { not: 200 };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = toDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.aILog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.aILog.count({ where }),
  ]);

  const userIds = [...new Set(logs.map(l => l.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));

  const items = logs.map(l => ({
    ...l,
    userName: userMap[l.userId] || 'Unknown',
  }));

  res.status(200).json({ items, total, page: pageNum, limit: limitNum });
}));

router.get('/admin/ai-logs/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const log = await prisma.aILog.findUnique({ where: { id: req.params.id } });
  if (!log) return res.status(404).json({ code: 'NOT_FOUND', message: 'AI Log not found' });

  const user = await prisma.user.findUnique({
    where: { id: log.userId },
    select: { id: true, name: true, email: true },
  });

  res.status(200).json({ log: { ...log, userName: user?.name || 'Unknown', userEmail: user?.email || null } });
}));

// ─── Admin: Config ───────────────────────────────────
router.get('/admin/config', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const items = await prisma.appConfig.findMany({ orderBy: { key: 'asc' } });
  res.status(200).json({ items });
}));

router.put('/admin/config/:key', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const { value } = req.body || {};
  if (value === undefined) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'value is required' });
  }

  const config = await prisma.appConfig.upsert({
    where: { key: req.params.key },
    update: { value: String(value), updatedBy: req.authUser.id },
    create: { key: req.params.key, value: String(value), updatedBy: req.authUser.id },
  });

  res.status(200).json({ config });
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
