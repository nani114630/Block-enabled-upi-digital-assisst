import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { paymentService, orderService } from '../services/index.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const razorpayWebhookSchema = z.object({
  event: z.string(),
  payload: z.record(z.unknown()),
});

export const webhookController = {
  async handleRazorpay(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      
      if (!signature) {
        throw new AppError('Webhook signature missing', 400);
      }

      const isValid = paymentService.verifyWebhookSignature(
        JSON.stringify(req.body),
        signature
      );

      if (!isValid) {
        logger.warn('Invalid Razorpay webhook signature');
        throw new AppError('Invalid webhook signature', 401);
      }

      const event = razorpayWebhookSchema.parse(req.body);
      logger.info('Razorpay webhook received:', { event: event.event });

      switch (event.event) {
        case 'payment.captured': {
          const paymentPayload = event.payload as { payment?: { entity?: { notes?: { orderId?: string }, id?: string } } };
          const payment = paymentPayload?.payment?.entity;
          const orderId = payment?.notes?.orderId;
          const paymentId = payment?.id;
          
          if (orderId) {
            await orderService.handlePaymentSuccess(orderId, paymentId || '');
            logger.info('Payment captured:', { orderId, paymentId });
          }
          break;
        }
        case 'payment.failed': {
          const paymentPayload = event.payload as { payment?: { entity?: { notes?: { orderId?: string }, error_reason?: string } } };
          const payment = paymentPayload?.payment?.entity;
          const orderId = payment?.notes?.orderId;
          const errorReason = payment?.error_reason;
          
          if (orderId) {
            await orderService.handlePaymentFailure(orderId, errorReason);
            logger.warn('Payment failed:', { orderId, errorReason });
          }
          break;
        }
        case 'order.paid': {
          logger.info('Order paid event:', event.payload);
          break;
        }
        case 'refund.created': {
          const refundPayload = event.payload as { refund?: { entity?: { payment_id?: string } } };
          const refund = refundPayload?.refund?.entity;
          const paymentId = refund?.payment_id;
          
          logger.info('Refund created:', { paymentId });
          break;
        }
        default:
          logger.info('Unhandled Razorpay event:', { event: event.event });
      }

      res.status(200).json({ status: 'success', received: true });
    } catch (error) {
      logger.error('Webhook processing error:', error);
      next(error);
    }
  },

  async handleCashfree(req: Request, res: Response, next: NextFunction) {
    try {
      const event = req.body;
      logger.info('Cashfree webhook received:', event);

      const eventType = (event as { type?: string }).type || (event as { event?: string }).event;
      const data = (event as { data?: Record<string, unknown> }).data || event;

      switch (eventType) {
        case 'PAYMENT_SUCCESS': {
          const orderId = (data as { orderId?: string }).orderId;
          const paymentId = (data as { referenceId?: string }).referenceId;
          
          if (orderId) {
            await orderService.handlePaymentSuccess(orderId, paymentId || '');
            logger.info('Cashfree payment success:', { orderId, paymentId });
          }
          break;
        }
        case 'PAYMENT_FAILURE': {
          const orderId = (data as { orderId?: string }).orderId;
          const error = (data as { errorDescription?: string }).errorDescription;
          
          if (orderId) {
            await orderService.handlePaymentFailure(orderId, error);
            logger.warn('Cashfree payment failure:', { orderId, error });
          }
          break;
        }
        default:
          logger.info('Unhandled Cashfree event:', { eventType });
      }

      res.status(200).json({ status: 'success', received: true });
    } catch (error) {
      logger.error('Cashfree webhook error:', error);
      next(error);
    }
  },
};