import express from 'express';
import { 
  getProducts, getProductById, createProduct, updateProduct, deleteProduct, bulkDeleteProducts,
  searchProductByBarcode, addVariant, deleteVariant, getProductBatches, bulkImportProducts 
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getProducts)
  .post(protect, authorize('products'), createProduct);

router.route('/bulk')
  .post(protect, authorize('products'), bulkImportProducts)
  .delete(protect, authorize('products'), bulkDeleteProducts);

router.route('/barcode/:barcode')
  .get(protect, authorize('pos'), searchProductByBarcode);

router.route('/:id')
  .get(protect, getProductById)
  .put(protect, authorize('products'), updateProduct)
  .delete(protect, authorize('products'), deleteProduct);

router.route('/:id/variants')
  .post(protect, authorize('products'), addVariant);

router.route('/:id/variants/:variantId')
  .delete(protect, authorize('products'), deleteVariant);

router.route('/:id/batches')
  .get(protect, getProductBatches);

export default router;
