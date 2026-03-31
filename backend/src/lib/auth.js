const crypto = require('crypto');
const { prisma } = require('./db');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

async function createSession(userId) {
  const accessToken = crypto.randomBytes(24).toString('hex');
  await prisma.session.create({
    data: {
      userId,
      token: accessToken,
    },
  });
  return accessToken;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isGuest: Boolean(user.isGuest),
    role: user.role || 'user',
    bio: user.bio || '',
    nativeLanguage: user.nativeLanguage || '',
    createdAt: user.createdAt,
  };
}

async function getUserFromBearer(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || !session.user) {
    return null;
  }

  return { user: session.user, token };
}

async function requireAuth(req, res, next) {
  try {
    const result = await getUserFromBearer(req.headers.authorization);
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
  } catch (err) {
    console.error('requireAuth Error:', err);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Auth service failed' });
  }
}

module.exports = {
  hashPassword,
  generateId,
  createSession,
  sanitizeUser,
  requireAuth,
};
