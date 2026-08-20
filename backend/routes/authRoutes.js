const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

const { requireAuth } = require('../middleware/auth');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 failed requests per 15 minutes
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, authController.login);
router.post('/change-password', requireAuth, authController.changePassword);
router.post('/verify-2fa', authController.verify2FA);
router.post('/reset-temp-password', authController.resetTempPassword);
router.post('/generate-2fa', requireAuth, authController.generate2FA);
router.post('/enable-2fa', requireAuth, authController.enable2FA);

module.exports = router;
