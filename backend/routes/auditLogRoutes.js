const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { injectShopFilter } = require('../middleware/shopScope');

router.use(requireAuth);
router.use(injectShopFilter);
// Only shop admins and super admins should view logs
router.use(requireRole('super_admin', 'shop_admin'));

router.get('/', auditLogController.getLogs);

module.exports = router;
