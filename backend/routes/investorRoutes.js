const express = require('express');
const router = express.Router();
const investorController = require('../controllers/investorController');

router.post('/', investorController.createInvestor);
router.get('/', investorController.getInvestors);
router.post('/:id/pay', investorController.recordPayment);
router.put('/:id', investorController.updateInvestor);
router.delete('/:id', investorController.deleteInvestor);

module.exports = router;
