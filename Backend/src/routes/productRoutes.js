import express from 'express';
import { 
  getProducts, getProductById, createProduct, updateProduct, deleteProduct, bulkDeleteProducts,
  searchProductByBarcode, addVariant, deleteVariant, getProductBatches, bulkImportProducts 
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getProducts)
  .post(protect, authorize('products', 'create'), createProduct);

router.route('/bulk')
  .post(protect, authorize('products', 'create'), bulkImportProducts)
  .delete(protect, authorize('products', 'delete'), bulkDeleteProducts);

router.route('/barcode/:barcode')
  .get(protect, authorize('pos', 'view'), searchProductByBarcode);

router.route('/:id')
  .get(protect, getProductById)
  .put(protect, authorize('products', 'edit'), updateProduct)
  .delete(protect, authorize('products', 'delete'), deleteProduct);

router.route('/:id/variants')
  .post(protect, authorize('products', 'create'), addVariant);

router.route('/:id/variants/:variantId')
  .delete(protect, authorize('products', 'delete'), deleteVariant);

router.route('/:id/batches')
  .get(protect, getProductBatches);

export default router;
