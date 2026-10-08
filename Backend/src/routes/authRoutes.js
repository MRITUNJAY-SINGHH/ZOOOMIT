import express from 'express';
import { authUser, getUserProfile, forgotPassword, resetPassword, changePassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 50, 
  message: { message: 'Too many login attempts, please try again after 15 minutes' }
});

const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

router.post('/login', loginLimiter, validateLogin, authUser);
router.route('/profile').get(protect, getUserProfile);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:token', resetPassword);
router.put('/changepassword', protect, changePassword);

export default router;
