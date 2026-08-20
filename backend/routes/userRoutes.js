const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { injectShopFilter } = require('../middleware/shopScope');

router.get('/me', requireAuth, userController.getCurrentUser);

// Staff management requires shop_admin role
router.use('/staff', requireAuth, requireRole('shop_admin'), injectShopFilter);

router.post('/staff', userController.createStaff);
router.put('/staff/:id', userController.updateStaff);
router.get('/staff', userController.getStaffList);
router.delete('/staff/:id', userController.deleteStaff);

module.exports = router;
