const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { requireAuth } = require('../middleware/auth');
const { injectShopFilter } = require('../middleware/shopScope');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth, injectShopFilter);

router.get('/template', productController.downloadTemplate);
router.post('/upload', upload.single('file'), productController.bulkUpload);

router.post('/', productController.createProduct);
router.post('/:id/restock', productController.restockProduct);
router.put('/:id', productController.updateProduct);
router.get('/', productController.getProducts);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
