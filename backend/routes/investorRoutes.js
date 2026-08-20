const express = require('express');
const router = express.Router();
const investorController = require('../controllers/investorController');
const { requireAuth } = require('../middleware/auth');
const { injectShopFilter } = require('../middleware/shopScope');

router.use(requireAuth, injectShopFilter);

router.post('/', investorController.createInvestor);
router.get('/', investorController.getInvestors);
router.put('/:id', investorController.updateInvestor);
router.delete('/:id', investorController.deleteInvestor);
router.post('/:id/pay', investorController.recordPayment);

module.exports = router;
