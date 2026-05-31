const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { requireAuth } = require('../middleware/auth');


router.post('/', requireAuth, customerController.createCustomer);
router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);
router.delete('/:id', requireAuth, customerController.deleteCustomer);

module.exports = router;
