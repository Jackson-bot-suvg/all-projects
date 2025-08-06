
import { Router } from "express";
import { register, login, logout, getCurrentUser, verifyEmail, forgotPassword, resetPassword } from '../controllers/authController';

import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, getCurrentUser);
router.post('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
