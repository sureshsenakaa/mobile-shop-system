const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');

router.post('/', supplierController.createSupplier);
router.get('/', supplierController.getSuppliers);
router.delete('/:id', supplierController.deleteSupplier);
router.put('/:id', supplierController.updateSupplier);

module.exports = router;
