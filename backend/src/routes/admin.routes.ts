import { Router } from 'express';
import { adminController } from '../controllers/index.js';
import { authenticate, requireAdmin } from '../middleware/index.js';

const router = Router();

router.get('/stats', authenticate, requireAdmin, adminController.getDashboardStats);
router.get('/users', authenticate, requireAdmin, adminController.getUsers);
router.get('/assets', authenticate, requireAdmin, adminController.getAssets);
router.get('/orders', authenticate, requireAdmin, adminController.getOrders);
router.get('/nfts', authenticate, requireAdmin, adminController.getNFTs);
router.patch('/users/:userId/role', authenticate, requireAdmin, adminController.updateUserRole);
router.post('/orders/:orderId/refund', authenticate, requireAdmin, adminController.createRefund);

export default router;