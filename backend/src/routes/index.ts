import { Router } from 'express';
import authRoutes from './auth.routes.js';
import assetRoutes from './asset.routes.js';
import orderRoutes from './order.routes.js';
import paymentRoutes from './payment.routes.js';
import nftRoutes from './nft.routes.js';
import webhookRoutes from './webhook.routes.js';
import adminRoutes from './admin.routes.js';
import eventRoutes from './event.routes.js';
import ticketRoutes from './ticket.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/assets', assetRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/nfts', nftRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/admin', adminRoutes);
router.use('/events', eventRoutes);
router.use('/tickets', ticketRoutes);

router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'UPI Digital Asset Transparency System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;