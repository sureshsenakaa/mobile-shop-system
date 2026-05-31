// Authentication middleware disabled — app runs without login.
// This file intentionally provides a no-op `requireAuth` so existing
// route declarations that referenced it don't need modification.

function requireAuth(req, res, next) {
  // Authentication removed; allow all requests through
  return next();
}

module.exports = { requireAuth };
