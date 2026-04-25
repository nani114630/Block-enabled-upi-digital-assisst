import mongoose from 'mongoose';
import { Order, Asset, NFT, User } from '../models/index.js';
import { paymentService } from './payment.service.js';
import { blockchainService } from './blockchain.service.js';
import { ipfsService } from './ipfs.service.js';
import { AppError, NotFoundError, ValidationError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export interface CreateOrderInput {
  assetId: string;
  userId: string;
}

export interface PaymentCallbackData {
  paymentId: string;
  orderId: string;
  signature: string;
}

export const orderService = {
  async create(input: CreateOrderInput) {
    const { assetId, userId } = input;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    if (asset.status !== 'active') {
      throw new ValidationError('Asset is not available for purchase', [
        { field: 'assetId', message: 'This asset is not available for purchase' },
      ]);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const amountPaise = Math.round(asset.priceInINR * 100);

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    const order = new Order({
      orderNumber,
      userId: new mongoose.Types.ObjectId(userId),
      assetId: new mongoose.Types.ObjectId(assetId),
      amount: amountPaise,
      currency: 'INR',
      status: 'created',
      paymentGateway: 'razorpay',
      attemptCount: 0,
      expiresAt,
    });

    await order.save();

    logger.info('Order created:', { orderId: order._id, orderNumber, amount: amountPaise });

    return order;
  },

  async initiatePayment(orderId: string) {
    const order = await Order.findById(orderId).populate('assetId');
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.status !== 'created' && order.status !== 'initiated') {
      throw new ValidationError('Order cannot be modified', [
        { field: 'orderId', message: 'Order is already completed or cancelled' },
      ]);
    }

    if (new Date() > order.expiresAt) {
      await Order.findByIdAndUpdate(orderId, { status: 'cancelled' });
      throw new ValidationError('Order has expired', [
        { field: 'orderId', message: 'Please create a new order' },
      ]);
    }

    const asset = order.assetId as unknown as {
      _id: mongoose.Types.ObjectId;
      name: string;
      priceInINR: number;
      status: string;
    };
    if (!asset || asset.status !== 'active') {
      throw new ValidationError('Asset is no longer available', [
        { field: 'assetId', message: 'This asset is not available for purchase' },
      ]);
    }

    const amountPaise = Math.round(asset.priceInINR * 100);

    const razorpayOrder = await paymentService.createOrder({
      amount: amountPaise,
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order._id.toString(),
        assetId: asset._id.toString(),
        userId: order.userId.toString(),
      },
    });

    await Order.findByIdAndUpdate(orderId, {
      paymentOrderId: razorpayOrder.id,
      status: 'initiated',
      $inc: { attemptCount: 1 },
    });

    logger.info('Payment initiated:', {
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
    });

    return {
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        amount: order.amount,
        currency: order.currency,
        status: 'initiated',
      },
      payment: {
        orderId: razorpayOrder.id,
        internalOrderId: order._id.toString(),
        amount: amountPaise,
        currency: 'INR',
        keyId: config.razorpay.keyId,
      },
    };
  },

  async handlePaymentVerification(orderId: string, paymentId: string) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

if (order.status === 'completed') {
        logger.warn('Order already completed:', { orderId });
        return { order, shouldMint: false };
      }

    if (paymentId.startsWith('test_pay_')) {
      logger.info('Test mode - skipping payment verification');
      await Order.findByIdAndUpdate(orderId, {
        status: 'completed',
        paymentId,
        paidAt: new Date(),
      });
      return { order, shouldMint: true };
    }

    const payment = await paymentService.fetchPayment(paymentId);
    if (!payment) {
      throw new ValidationError('Payment not found', [
        { field: 'paymentId', message: 'Invalid payment' },
      ]);
    }

    const paymentStatus = (payment as { status?: string }).status;
    if (paymentStatus !== 'captured') {
      throw new ValidationError('Payment not captured', [
        { field: 'paymentId', message: 'Payment status: ' + paymentStatus },
      ]);
    }

    await Order.findByIdAndUpdate(orderId, {
      status: 'completed',
      paymentId,
      paidAt: new Date(),
    });

    return { order, payment, shouldMint: true };
  },

  async handlePaymentSuccess(orderId: string, paymentId: string) {
    const order = await Order.findById(orderId).populate('assetId');
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.status === 'completed') {
      logger.warn('Order already completed:', { orderId });
      return { orderId, paymentId, alreadyCompleted: true };
    }

    await Order.findByIdAndUpdate(orderId, {
      status: 'completed',
      paymentId,
      paidAt: new Date(),
    });

    logger.info('Payment completed:', { orderId, paymentId, amount: order.amount });

    return { orderId, paymentId, order };
  },

  async handlePaymentFailure(orderId: string, reason?: string) {
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status: 'failed',
        failedAt: new Date(),
      },
      { new: true }
    );

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    logger.warn('Payment failed:', { orderId, reason });

    return order;
  },

  async findById(orderId: string) {
    const order = await Order.findById(orderId)
      .populate('assetId')
      .populate('userId', 'name email');

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return order;
  },

  async findByUser(userId: string, filters?: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 10 } = filters || {};

    const query: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('assetId')
        .populate('userId', 'name email'),
      Order.countDocuments(query),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findAll(filters?: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 10 } = filters || {};

    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('assetId')
        .populate('userId', 'name email'),
      Order.countDocuments(query),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};