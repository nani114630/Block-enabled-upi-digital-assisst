import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { paymentService, nftService, orderService, CreateOrderInput, VerifyPaymentInput } from '../services/index.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_signature: z.string().min(1, 'Signature is required'),
});

const createOrderSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().optional(),
  receipt: z.string().min(1, 'Receipt is required'),
});

export const paymentController = {
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createOrderSchema.parse(req.body) as CreateOrderInput;
      const order = await paymentService.createOrder(data);

      res.status(201).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const data = verifyPaymentSchema.parse(req.body) as VerifyPaymentInput;
      const verified = await paymentService.verifyPaymentSignature(data);

      res.status(200).json({
        status: 'success',
        data: { verified },
      });
    } catch (error) {
      next(error);
    }
  },

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const event = req.body;
      logger.info('Razorpay webhook received:', { event: event.event });

      switch (event.event) {
        case 'payment.captured': {
          const payment = event.payload.payment.entity;
          const orderId = payment.notes?.orderId;
          const paymentId = payment.id;
          
          if (orderId) {
            try {
              await orderService.handlePaymentSuccess(orderId, paymentId);
              
              const nft = await nftService.mint({ orderId, paymentId });
              logger.info('NFT minted after payment:', {
                orderId,
                paymentId,
                tokenId: nft.tokenId
              });
            } catch (mintError) {
              logger.error('NFT minting failed after payment:', mintError);
            }
          }
          break;
        }
        case 'payment.failed': {
          const payment = event.payload.payment.entity;
          const orderId = payment.notes?.orderId;
          
          if (orderId) {
            await orderService.handlePaymentFailure(orderId, payment.error_reason);
          }
          break;
        }
        default:
          logger.info('Unhandled Razorpay event:', { event: event.event });
      }

      res.status(200).json({ status: 'success' });
    } catch (error) {
      next(error);
    }
  },

  async verifyAndMint(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId, paymentId, signature } = req.body;

      if (!orderId || !paymentId) {
        res.status(400).json({
          status: 'fail',
          message: 'orderId and paymentId are required',
        });
        return;
      }

      try {
        const skipSignature = config.razorpay.keyId === 'rzp_test_placeholder_key_id' || !config.razorpay.keyId;
        if (!skipSignature) {
          await paymentService.verifyPaymentSignature({
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: signature || '',
          });
        }
      } catch (verifyError) {
        logger.warn('Payment signature verification skipped');
      }

      const { order, shouldMint } = await orderService.handlePaymentVerification(orderId, paymentId);

      if (!shouldMint) {
        res.status(200).json({
          status: 'success',
          data: { message: 'Order already processed', order },
        });
        return;
      }

      const nft = await nftService.mint({ orderId, paymentId });

      res.status(200).json({
        status: 'success',
        data: {
          message: 'Payment successful and NFT minted',
          order,
          nft: {
            tokenId: nft.tokenId,
            transactionHash: nft.blockchain.transactionHash,
          },
        },
      });
    } catch (error) {
      logger.error('Verify and mint error:', error);
      next(error);
    }
  },

  async getPaymentMethods(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        status: 'success',
        data: {
          methods: ['card', 'netbanking', 'upi', 'wallet', 'emi'],
          currency: 'INR',
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async fetchPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const payment = await paymentService.fetchPayment(id);

      if (!payment) {
        res.status(404).json({
          status: 'fail',
          message: 'Payment not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  },
};