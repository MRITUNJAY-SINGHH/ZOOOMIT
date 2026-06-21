import express from 'express';
import { getUsers, createUser, updateUser, deleteUser, getDeliveryBoyStats } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('staff'), getUsers)
  .post(protect, authorize('staff'), createUser);

router.route('/:id')
  .put(protect, authorize('staff'), updateUser)
  .delete(protect, authorize('staff'), deleteUser);

router.route('/:id/stats')
  .get(protect, authorize('staff'), getDeliveryBoyStats);

export default router;
