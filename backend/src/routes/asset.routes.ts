import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/index.js';
import { assetController } from '../controllers/index.js';
import multer from 'multer';

const router = Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/upload', authenticate, upload.single('image'), (req: Request, res: Response, next: NextFunction) => {
  console.log('[Asset Upload] Request received');
  console.log('[Asset Upload] Body:', req.body);
  console.log('[Asset Upload] File:', req.file ? req.file.originalname : 'NO FILE');
  next();
}, assetController.uploadWithImage);

router.get('/organizer/stats', authenticate, assetController.getOrganizerStats);
router.get('/organizer/orders', authenticate, assetController.getEventOrders);

router.get('/', assetController.findAll);
router.get('/featured', assetController.getFeatured);
router.get('/categories', assetController.getCategories);
router.get('/slug/:slug', assetController.findBySlug);
router.get('/:id', assetController.findById);

router.post('/', authenticate, assetController.create);
router.put('/:id', authenticate, assetController.update);
router.delete('/:id', authenticate, assetController.delete);

router.patch('/:id/status', authenticate, assetController.updateStatus);

export default router;