import { Router, Request, Response, NextFunction } from 'express';
import { eventController } from '../controllers/index.js';
import { authenticate } from '../middleware/index.js';

const router = Router();

router.get('/organizer/my-events', authenticate, eventController.getOrganizerEvents);
router.get('/organizer/tickets/:eventId', authenticate, eventController.getEventTickets);
router.post('/verify-ticket', authenticate, eventController.verifyTicket);

router.get('/', eventController.findAll);
router.get('/featured', eventController.getFeatured);
router.get('/slug/:slug', eventController.findBySlug);
router.get('/:id', eventController.findById);

router.post('/', authenticate, eventController.create);
router.post('/:id/book', authenticate, eventController.bookTickets);
router.put('/:id', authenticate, eventController.update);
router.delete('/:id', authenticate, eventController.delete);

export default router;