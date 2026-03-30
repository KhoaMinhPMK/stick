const express = require('express');
const { prisma } = require('../lib/db');
const {
  hashPassword,
  createSession,
  sanitizeUser,
  requireAuth,
} = require('../lib/auth');
const { verifyIdToken } = require('../lib/firebase');
const { generateJournalFeedback } = require('../lib/groqAI');

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

// ─── AI Feedback ─────────────────────────────────────
router.post('/ai/feedback/text', requireAuth, asyncHandler(async (req, res) => {
  let { journalId, content, language } = req.body || {};

  if (!content && journalId) {
    const journal = await prisma.journal.findUnique({ where: { id: journalId } });
    if (journal) {
      content = journal.content;
      language = journal.language;
    }
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

  const feedback = await generateJournalFeedback({
    content,
    language: language || 'en',
    level,
  });

  // If journalId is provided, update the journal score and feedback
  if (journalId) {
    try {
      const updatedJournal = await prisma.journal.update({
        where: { id: journalId },
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

// ─── Error Handler ───────────────────────────────────
router.use((err, _req, res, _next) => {
  console.error('API Error:', err);
  res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
});

module.exports = router;
