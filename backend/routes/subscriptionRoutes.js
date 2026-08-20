const express = require('express');
const router = express.Router();
const multer = require('multer');
const subscriptionController = require('../controllers/subscriptionController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { injectShopFilter } = require('../middleware/shopScope');

// Use memory storage for multer so we can process it with sharp
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// All routes require authentication
router.use(requireAuth);

// --- Shop Admin Routes ---
// Inject shop filter for shop admins
router.post('/upload-slip', injectShopFilter, requireRole('shop_admin', 'super_admin'), upload.single('slipImage'), subscriptionController.uploadSlip);
router.get('/history', injectShopFilter, requireRole('shop_admin', 'super_admin'), subscriptionController.getShopHistory);

// --- Super Admin Routes ---
router.get('/admin/all', requireRole('super_admin'), subscriptionController.getAllPayments);
router.put('/admin/approve/:id', requireRole('super_admin'), subscriptionController.approvePayment);
router.put('/admin/reject/:id', requireRole('super_admin'), subscriptionController.rejectPayment);

module.exports = router;
