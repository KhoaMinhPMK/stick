const express = require('express');
const { loadDb, saveDb } = require('../lib/dataStore');
const {
  hashPassword,
  generateId,
  createSession,
  sanitizeUser,
  requireAuth,
} = require('../lib/auth');

const router = express.Router();

function getOrCreateOnboardingState(db, userId) {
  let state = db.onboardingStates.find((item) => item.userId === userId);
  if (!state) {
    state = {
      id: generateId('onboarding'),
      userId,
      step: 0,
      level: null,
      schedule: null,
      goal: null,
      completed: false,
      updatedAt: new Date().toISOString(),
    };
    db.onboardingStates.push(state);
  }
  return state;
}

router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    scope: 'api-v1',
    timestamp: new Date().toISOString(),
  });
});

router.post('/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'name, email and password are required',
    });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const db = loadDb();
  const existed = db.users.find((u) => u.email === normalizedEmail && !u.isGuest);
  if (existed) {
    res.status(409).json({
      code: 'EMAIL_EXISTS',
      message: 'Email is already registered',
    });
    return;
  }

  const user = {
    id: generateId('user'),
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(String(password)),
    isGuest: false,
    bio: '',
    nativeLanguage: '',
    createdAt: new Date().toISOString(),
  };

  db.users.push(user);
  getOrCreateOnboardingState(db, user.id);
  saveDb(db);

  const accessToken = createSession(user.id);

  res.status(201).json({
    accessToken,
    user: sanitizeUser(user),
  });
});

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'email and password are required',
    });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const db = loadDb();
  const user = db.users.find((u) => u.email === normalizedEmail && !u.isGuest);
  if (!user || user.passwordHash !== hashPassword(String(password))) {
    res.status(401).json({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });
    return;
  }

  const accessToken = createSession(user.id);
  res.status(200).json({
    accessToken,
    user: sanitizeUser(user),
  });
});

router.post('/auth/guest', (_req, res) => {
  const db = loadDb();
  const user = {
    id: generateId('guest'),
    name: `Guest ${db.users.length + 1}`,
    email: null,
    passwordHash: null,
    isGuest: true,
    bio: '',
    nativeLanguage: '',
    createdAt: new Date().toISOString(),
  };

  db.users.push(user);
  getOrCreateOnboardingState(db, user.id);
  saveDb(db);

  const accessToken = createSession(user.id);
  res.status(201).json({
    accessToken,
    user: sanitizeUser(user),
  });
});

router.get('/me', requireAuth, (req, res) => {
  res.status(200).json({
    user: sanitizeUser(req.authUser),
  });
});

router.get('/onboarding/state', requireAuth, (req, res) => {
  const db = loadDb();
  const state = getOrCreateOnboardingState(db, req.authUser.id);
  saveDb(db);
  res.status(200).json({ state });
});

router.put('/onboarding/state', requireAuth, (req, res) => {
  const db = loadDb();
  const state = getOrCreateOnboardingState(db, req.authUser.id);

  const { step, level, schedule, goal, completed } = req.body || {};
  if (typeof step === 'number') state.step = step;
  if (typeof level !== 'undefined') state.level = level;
  if (typeof schedule !== 'undefined') state.schedule = schedule;
  if (typeof goal !== 'undefined') state.goal = goal;
  if (typeof completed === 'boolean') state.completed = completed;
  state.updatedAt = new Date().toISOString();

  saveDb(db);
  res.status(200).json({ state });
});

router.post('/onboarding/complete', requireAuth, (req, res) => {
  const db = loadDb();
  const state = getOrCreateOnboardingState(db, req.authUser.id);
  state.completed = true;
  state.updatedAt = new Date().toISOString();
  saveDb(db);
  res.status(200).json({ state });
});

router.get('/profile', requireAuth, (req, res) => {
  res.status(200).json({ user: sanitizeUser(req.authUser) });
});

router.put('/profile', requireAuth, (req, res) => {
  const db = loadDb();
  const user = db.users.find((u) => u.id === req.authUser.id);
  if (!user) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' });
    return;
  }

  const { name, bio, nativeLanguage } = req.body || {};
  if (typeof name === 'string' && name.trim()) user.name = name.trim();
  if (typeof bio === 'string') user.bio = bio;
  if (typeof nativeLanguage === 'string') user.nativeLanguage = nativeLanguage;

  saveDb(db);
  res.status(200).json({ user: sanitizeUser(user) });
});

router.post('/journals', requireAuth, (req, res) => {
  const { title, content } = req.body || {};
  if (!title || !content) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'title and content are required',
    });
    return;
  }

  const db = loadDb();
  const journal = {
    id: generateId('journal'),
    userId: req.authUser.id,
    title: String(title),
    content: String(content),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };
  db.journals.push(journal);
  saveDb(db);

  res.status(201).json({ journal });
});

router.get('/journals', requireAuth, (req, res) => {
  const db = loadDb();
  const journals = db.journals
    .filter((j) => j.userId === req.authUser.id && !j.deletedAt)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  res.status(200).json({
    items: journals,
    total: journals.length,
  });
});

router.get('/journals/:id', requireAuth, (req, res) => {
  const db = loadDb();
  const journal = db.journals.find(
    (j) => j.id === req.params.id && j.userId === req.authUser.id && !j.deletedAt,
  );

  if (!journal) {
    res.status(404).json({
      code: 'NOT_FOUND',
      message: 'Journal not found',
    });
    return;
  }

  res.status(200).json({ journal });
});

router.get('/progress/summary', requireAuth, (req, res) => {
  const db = loadDb();
  const totalJournals = db.journals.filter(
    (j) => j.userId === req.authUser.id && !j.deletedAt,
  ).length;

  const onboarding = getOrCreateOnboardingState(db, req.authUser.id);
  saveDb(db);

  res.status(200).json({
    totalJournals,
    onboardingCompleted: onboarding.completed,
  });
});

module.exports = router;

