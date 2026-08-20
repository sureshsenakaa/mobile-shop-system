const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Notice is accessible to all authenticated users
router.get('/notice', requireAuth, shopController.getNotice);

// All other shop routes require super_admin
router.use(requireAuth, requireRole('super_admin'));

router.post('/', shopController.createShop);
router.get('/', shopController.getShops);
router.put('/:id', shopController.updateShop);
router.post('/:id/admin', shopController.createShopAdmin);

module.exports = router;
