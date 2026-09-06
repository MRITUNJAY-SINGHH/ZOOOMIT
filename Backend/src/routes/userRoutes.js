import express from 'express';
import { getUsers, createUser, updateUser, deleteUser, getDeliveryBoyStats } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('staff', 'view'), getUsers)
  .post(protect, authorize('staff', 'create'), createUser);

router.route('/:id')
  .put(protect, authorize('staff', 'edit'), updateUser)
  .delete(protect, authorize('staff', 'delete'), deleteUser);

router.route('/:id/stats')
  .get(protect, authorize('staff', 'view'), getDeliveryBoyStats);

export default router;
