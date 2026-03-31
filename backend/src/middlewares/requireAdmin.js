/**
 * Middleware: require authenticated user with role === "admin".
 * Must be chained AFTER requireAuth so that req.authUser exists.
 */
function requireAdmin(req, res, next) {
  if (!req.authUser || req.authUser.role !== 'admin') {
    return res.status(403).json({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
  next();
}

module.exports = { requireAdmin };
