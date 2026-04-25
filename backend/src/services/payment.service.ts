import Razorpay from 'razorpay';
import { config } from '../config/index.js';
import { AppError, ValidationError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

export interface CreateOrderInput {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface VerifyPaymentInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentOrder {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  receipt: string;
  created_at: number;
}

export const paymentService = {
  async createOrder(input: CreateOrderInput): Promise<PaymentOrder> {
    if (config.razorpay.keyId === 'rzp_test_placeholder_key_id' || !config.razorpay.keyId) {
      const mockId = `test_order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      logger.info('Razorpay test mode - mock order created:', { mockId });
      return {
        id: mockId,
        entity: 'order',
        amount: input.amount,
        currency: input.currency || 'INR',
        status: 'created',
        receipt: input.receipt,
        created_at: Math.floor(Date.now() / 1000),
      };
    }

    try {
      const order = await razorpay.orders.create({
        amount: input.amount,
        currency: input.currency || 'INR',
        receipt: input.receipt,
        notes: input.notes,
      });

      logger.info('Razorpay order created:', { orderId: order.id, amount: order.amount });

      return order as unknown as PaymentOrder;
    } catch (error) {
      logger.error('Razorpay order creation failed:', error);
      throw new AppError('Failed to create payment order', 500);
    }
  },

  async fetchOrder(orderId: string): Promise<PaymentOrder | null> {
    try {
      const order = await razorpay.orders.fetch(orderId);
      return order as unknown as PaymentOrder;
    } catch (error) {
      logger.error('Razorpay order fetch failed:', error);
      return null;
    }
  },

  async verifyPaymentSignature(input: VerifyPaymentInput): Promise<boolean> {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = input;

      const crypto = await import('crypto');
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', config.razorpay.keySecret)
        .update(body)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        throw new ValidationError('Invalid payment signature', [
          { field: 'signature', message: 'Payment signature verification failed' },
        ]);
      }

      logger.info('Payment signature verified:', {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });

      return true;
    } catch (error) {
      logger.error('Payment signature verification failed:', error);
      throw error;
    }
  },

  async fetchPayment(paymentId: string): Promise<unknown> {
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      logger.error('Razorpay payment fetch failed:', error);
      return null;
    }
  },

  async createRefund(paymentId: string, amount?: number): Promise<unknown> {
    try {
      const refund = await razorpay.payments.refund(paymentId, {
        amount,
      });

      logger.info('Refund created:', { paymentId, refundId: refund.id, amount: refund.amount });

      return refund;
    } catch (error) {
      logger.error('Refund creation failed:', error);
      throw new AppError('Failed to create refund', 500);
    }
  },

  generateWebhookSignature(body: string): string {
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', config.razorpay.webhookSecret)
      .update(body)
      .digest('hex');
  },

  verifyWebhookSignature(body: string, signature: string): boolean {
    const expectedSignature = this.generateWebhookSignature(body);
    return signature === expectedSignature;
  },
};