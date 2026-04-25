import { Router } from 'express';
import { paymentController } from '../controllers/index.js';

const router = Router();

router.post('/create-order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);
router.post('/verify-mint', paymentController.verifyAndMint);
router.post('/webhook', paymentController.handleWebhook);
router.get('/methods', paymentController.getPaymentMethods);
router.get('/:id', paymentController.fetchPayment);

export default router;