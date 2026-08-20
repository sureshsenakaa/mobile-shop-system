const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { User, Shop } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

    const user = await User.findOne({ 
      where: { username },
      include: [{ model: Shop }] 
    });
    
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      return res.status(403).json({ message: 'Account locked.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      let updates = { failedLoginAttempts: newAttempts };
      if (newAttempts >= 5) {
        updates.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }
      await user.update(updates);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
      await user.update({ failedLoginAttempts: 0, lockoutUntil: null });
    }

    // Ensure shop is active if not super admin
    if (user.role !== 'super_admin') {
      if (!user.Shop) {
        return res.status(401).json({ message: 'No shop assigned to this user' });
      }
      if (!user.Shop.isActive) {
        return res.status(401).json({ message: 'This shop has been deactivated' });
      }
    }

    if (user.mustChangePassword) {
      user.lastLoginAt = new Date();
      await user.save();
      const tempToken = jwt.sign({ id: user.id, intent: 'reset_password' }, JWT_SECRET, { expiresIn: '15m' });
      return res.json({ message: 'Password change required', mustChangePassword: true, tempToken });
    }

    if (user.twoFactorEnabled) {
      user.lastLoginAt = new Date();
      await user.save();
      const tempToken = jwt.sign({ id: user.id, intent: '2fa' }, JWT_SECRET, { expiresIn: '15m' });
      return res.json({ message: '2FA required', require2FA: true, tempToken });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const payload = { 
      id: user.id, 
      username: user.username, 
      role: user.role, 
      shopId: user.shopId 
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    return res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        shopId: user.shopId,
        shopName: user.Shop ? user.Shop.name : (user.role === 'super_admin' ? 'Super Admin' : null),
        logoUrl: user.Shop ? user.Shop.logoUrl : null,
        printLogo: user.Shop ? user.Shop.printLogo : false,
        themeColor: user.Shop ? user.Shop.themeColor : '#3b82f6',
        permissions: user.permissions || []
      } 
    });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password required' });
    }

    const user = await User.findByPk(req.user.id);
    
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid current password' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    // Setting passwordChangedAt will invalidate all existing tokens for this user
    await user.update({ passwordHash, passwordChangedAt: new Date() });
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Password change error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function verify2FA(req, res) {
  try {
    const { tempToken, pin } = req.body;
    if (!tempToken || !pin) return res.status(400).json({ message: 'Token and PIN required' });
    
    const decoded = jwt.verify(tempToken, JWT_SECRET);
    if (decoded.intent !== '2fa') return res.status(401).json({ message: 'Invalid token intent' });

    const user = await User.findOne({ where: { id: decoded.id }, include: [{ model: Shop }] });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: pin
    });

    if (!verified) return res.status(401).json({ message: 'Invalid PIN' });

    const payload = { id: user.id, username: user.username, role: user.role, shopId: user.shopId };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    return res.json({
      token,
      user: {
        id: user.id, username: user.username, role: user.role, shopId: user.shopId,
        shopName: user.Shop ? user.Shop.name : (user.role === 'super_admin' ? 'Super Admin' : null),
        logoUrl: user.Shop ? user.Shop.logoUrl : null, printLogo: user.Shop ? user.Shop.printLogo : false,
        themeColor: user.Shop ? user.Shop.themeColor : '#3b82f6', permissions: user.permissions || []
      }
    });
  } catch (err) {
    console.error('verify2FA error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function resetTempPassword(req, res) {
  try {
    const { tempToken, newPassword } = req.body;
    if (!tempToken || !newPassword) return res.status(400).json({ message: 'Token and new password required' });

    const decoded = jwt.verify(tempToken, JWT_SECRET);
    if (decoded.intent !== 'reset_password') return res.status(401).json({ message: 'Invalid token intent' });

    const user = await User.findOne({ where: { id: decoded.id }, include: [{ model: Shop }] });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await user.update({ passwordHash, mustChangePassword: false, passwordChangedAt: new Date() });

    const payload = { id: user.id, username: user.username, role: user.role, shopId: user.shopId };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    return res.json({
      token,
      user: {
        id: user.id, username: user.username, role: user.role, shopId: user.shopId,
        shopName: user.Shop ? user.Shop.name : (user.role === 'super_admin' ? 'Super Admin' : null),
        logoUrl: user.Shop ? user.Shop.logoUrl : null, printLogo: user.Shop ? user.Shop.printLogo : false,
        themeColor: user.Shop ? user.Shop.themeColor : '#3b82f6', permissions: user.permissions || []
      }
    });
  } catch (err) {
    console.error('resetTempPassword error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function generate2FA(req, res) {
  try {
    const user = await User.findByPk(req.user.id);
    const secret = speakeasy.generateSecret({ name: 'MobileShop' });
    await user.update({ twoFactorSecret: secret.base32 });
    
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ qrCodeUrl, secret: secret.base32 });
  } catch (err) {
    console.error('generate2FA error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function enable2FA(req, res) {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ message: 'PIN required' });

    const user = await User.findByPk(req.user.id);
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: pin
    });

    if (!verified) return res.status(400).json({ message: 'Invalid PIN' });

    await user.update({ twoFactorEnabled: true });
    res.json({ success: true, message: '2FA enabled successfully' });
  } catch (err) {
    console.error('enable2FA error', err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { login, changePassword, verify2FA, resetTempPassword, generate2FA, enable2FA };
