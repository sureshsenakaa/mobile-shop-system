const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('super_admin'));

router.get('/shops', adminController.getAllShops);
router.get('/revenue-stats', adminController.getRevenueStats);
router.get('/notice', adminController.getGlobalNotice);
router.post('/notice', adminController.updateGlobalNotice);

module.exports = router;
