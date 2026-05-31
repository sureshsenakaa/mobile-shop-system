const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { requireAuth } = require('../middleware/auth');


router.post('/', requireAuth, productController.createProduct);
router.post('/:id/restock', requireAuth, productController.restockProduct);
router.put('/:id', requireAuth, productController.updateProduct);
router.get('/', productController.getProducts);
router.delete('/:id', requireAuth, productController.deleteProduct);

module.exports = router;
