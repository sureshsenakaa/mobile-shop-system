const express = require('express');
const router = express.Router();
const multer = require('multer');
const brandingController = require('../controllers/brandingController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { injectShopFilter } = require('../middleware/shopScope');

// Use memory storage for multer so we can process it with sharp before saving
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(requireAuth, injectShopFilter);
router.use(requireRole('super_admin', 'shop_admin')); // Shop Admins can update branding

router.get('/branding', brandingController.getBranding);
router.put('/branding', upload.single('logo'), brandingController.updateBranding);

module.exports = router;
