import { Router } from 'express';
import { nftController } from '../controllers/index.js';
import { authenticate, optionalAuth } from '../middleware/index.js';

const router = Router();

router.get('/', nftController.findAll);
router.get('/user', authenticate, nftController.findByUser);
router.get('/asset/:assetId', nftController.findByAsset);
router.get('/:tokenId', nftController.findById);
router.get('/:tokenId/verify', nftController.verifyOwnership);
router.get('/:tokenId/uri', nftController.getTokenURI);

router.post('/mint', authenticate, nftController.mint);
router.post('/transfer', authenticate, nftController.transfer);

export default router;