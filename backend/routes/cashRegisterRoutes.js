const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cashRegisterController');
const { requireAuth } = require('../middleware/auth');
const { injectShopFilter } = require('../middleware/shopScope');

router.use(requireAuth, injectShopFilter);

router.get('/today', ctrl.getTodaySummary);
router.post('/open', ctrl.openRegister);
router.post('/close', ctrl.closeRegister);
router.get('/history', ctrl.getHistory);

module.exports = router;
