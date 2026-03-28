const crypto = require('crypto');
const { loadDb, saveDb } = require('./dataStore');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function createSession(userId) {
  const db = loadDb();
  const accessToken = crypto.randomBytes(24).toString('hex');

  db.sessions.push({
    id: generateId('sess'),
    userId,
    accessToken,
    createdAt: new Date().toISOString(),
  });

  saveDb(db);
  return accessToken;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isGuest: Boolean(user.isGuest),
    bio: user.bio || '',
    nativeLanguage: user.nativeLanguage || '',
    createdAt: user.createdAt,
  };
}

function getUserFromBearer(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return null;
  }

  const db = loadDb();
  const session = db.sessions.find((s) => s.accessToken === token);
  if (!session) {
    return null;
  }

  const user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    return null;
  }

  return { user, token };
}

function requireAuth(req, res, next) {
  const result = getUserFromBearer(req.headers.authorization);
  if (!result) {
    res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Missing or invalid access token',
    });
    return;
  }

  req.authUser = result.user;
  req.accessToken = result.token;
  next();
}

module.exports = {
  hashPassword,
  generateId,
  createSession,
  sanitizeUser,
  requireAuth,
};

