const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { requireAuth } = require('../middleware/auth');
const { injectShopFilter } = require('../middleware/shopScope');

router.use(requireAuth, injectShopFilter);

router.post('/', customerController.createCustomer);
router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);
router.put('/:id', customerController.updateCustomer);
router.post('/:id/pay', customerController.payCustomerDebt);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
