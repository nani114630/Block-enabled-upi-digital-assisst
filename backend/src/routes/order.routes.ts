import { Router } from 'express';
import { orderController } from '../controllers/index.js';
import { authenticate } from '../middleware/index.js';

const router = Router();

router.post('/', authenticate, orderController.create);
router.post('/initiate-payment', authenticate, orderController.initiatePayment);
router.get('/user', authenticate, orderController.findByUser);
router.get('/:id', orderController.findById);

export default router;