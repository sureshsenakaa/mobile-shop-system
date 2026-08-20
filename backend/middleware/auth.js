const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists and if token was issued before password changed
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }

    if (user.passwordChangedAt) {
      // decoded.iat is in seconds, passwordChangedAt is a Date object (milliseconds)
      const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
      if (decoded.iat < changedTimestamp) {
        return res.status(401).json({ message: 'Unauthorized: Password changed recently. Please login again.' });
      }
    }

    req.user = decoded; // Keep decoded payload
    req.userModel = user; // Attach full DB model
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
}

function requirePermission(permission) {
  return (req, res, next) => {
    // Super admins and shop admins bypass granular permission checks
    if (req.user && ['super_admin', 'shop_admin'].includes(req.user.role)) {
      return next();
    }
    
    // Check if staff has the specific permission
    const permissions = req.userModel ? (req.userModel.permissions || []) : [];
    if (!permissions.includes(permission)) {
      return res.status(403).json({ message: `Forbidden: Missing permission '${permission}'` });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole, requirePermission };
