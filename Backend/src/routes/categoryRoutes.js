import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCategories)
  .post(protect, authorize('products', 'create'), createCategory);

router.route('/:id')
  .put(protect, authorize('products', 'edit'), updateCategory)
  .delete(protect, authorize('products', 'delete'), deleteCategory);

export default router;
