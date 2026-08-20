const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { requireAuth } = require('../middleware/auth');
const { injectShopFilter } = require('../middleware/shopScope');

router.use(requireAuth, injectShopFilter);

router.post('/', supplierController.createSupplier);
router.get('/', supplierController.getSuppliers);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router;
