import { Router } from 'express';
import { webhookController } from '../controllers/index.js';

const router = Router();

router.post('/razorpay', webhookController.handleRazorpay);
router.post('/cashfree', webhookController.handleCashfree);

export default router;