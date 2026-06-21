import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCategories)
  .post(protect, authorize('products'), createCategory);

router.route('/:id')
  .put(protect, authorize('products'), updateCategory)
  .delete(protect, authorize('products'), deleteCategory);

export default router;
