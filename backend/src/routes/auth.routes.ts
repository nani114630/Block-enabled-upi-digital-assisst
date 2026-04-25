import { Router } from 'express';
import { authController } from '../controllers/index.js';
import { authenticate } from '../middleware/index.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.delete('/account', authenticate, authController.deleteAccount);

export default router;