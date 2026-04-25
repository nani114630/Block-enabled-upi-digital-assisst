'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { CreditCard, Smartphone, Building2, Wallet } from 'lucide-react';

interface PaymentPopupProps {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  onSuccess?: (data: { tokenId: number; transactionHash: string }) => void;
  onError?: (error: string) => void;
}

interface PaymentData {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  keyId: string;
}

type PaymentMethod = 'card' | 'debit' | 'upi' | 'netbanking' | 'wallet' | null;

const paymentMethods = [
  { id: 'card', label: 'Credit Card', icon: CreditCard, description: 'Pay with your credit card' },
  { id: 'debit', label: 'Debit Card', icon: CreditCard, description: 'Pay with your debit card' },
  { id: 'upi', label: 'UPI', icon: Smartphone, description: 'Pay using UPI apps' },
  { id: 'netbanking', label: 'Net Banking', icon: Building2, description: 'Direct bank transfer' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, description: 'Pay with wallets' },
];

export function PaymentPopup({ orderId, razorpayOrderId, amount, onSuccess, onError }: PaymentPopupProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setLoading(true);
    setStatus('processing');

    const isTestMode = razorpayOrderId.startsWith('test_order_') || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    if (isTestMode) {
      const fakePaymentId = `test_pay_${Date.now()}`;
      try {
        const { data } = await api.post('/payments/verify-mint', {
          orderId: orderId,
          paymentId: fakePaymentId,
          signature: '',
        });
        setStatus('success');
        toast.success('Payment successful! NFT minted successfully!');
        onSuccess?.({
          tokenId: data.data.nft?.tokenId || Math.floor(Math.random() * 1000),
          transactionHash: data.data.nft?.transactionHash || '0xtest',
        });
      } catch (error) {
        const err = error as { response?: { data?: { message?: string } } };
        setStatus('error');
        toast.error(err.response?.data?.message || 'Test payment failed');
        onError?.(err.response?.data?.message || 'Test payment failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'test_key';

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/razorpay.js';
      script.async = true;
      script.onload = () => {
        openRazorpay(razorpayKeyId);
      };
      document.body.appendChild(script);
    } catch (error) {
      const err = error as { message?: string };
      setStatus('error');
      setLoading(false);
      toast.error(err.message || 'Failed to initiate payment');
      onError?.(err.message || 'Failed to initiate payment');
    }
  };

  const openRazorpay = async (keyId: string) => {
    try {
      const options = {
        key: keyId,
        amount: amount * 100,
        currency: 'INR',
        name: 'UPI Digital Assets',
        description: `Purchase NFT - Order ${orderId}`,
        order_id: razorpayOrderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string }) => {
          await handlePaymentSuccess(response);
        },
        modal: {
          confirm_close: true,
          animation: true,
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999',
        },
        method: selectedMethod || undefined,
        theme: {
          color: '#0ea5e9',
        },
      };

      const razorpay = new (window as unknown as { Razorpay: new (opts: Record<string, unknown>) => { open: () => void } }).Razorpay(options);
      razorpay.open();
    } catch (error) {
      const err = error as { message?: string };
      setStatus('error');
      setLoading(false);
      toast.error('Payment failed');
      onError?.(err.message || 'Payment failed');
    }
  };

  const handlePaymentSuccess = async (response: { razorpay_payment_id: string; razorpay_order_id: string }) => {
    try {
      setStatus('processing');

      const { data } = await api.post('/payments/verify-mint', {
        orderId: orderId,
        paymentId: response.razorpay_payment_id,
        signature: (response as { razorpay_signature?: string }).razorpay_signature || '',
      });

      setStatus('success');
      toast.success('Payment successful! NFT minted successfully!');
      
      onSuccess?.({
        tokenId: data.data.nft?.tokenId || 0,
        transactionHash: data.data.nft?.transactionHash || '',
      });
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || 'Verification failed';
      setStatus('error');
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      <div className="mb-4">
        <p className="text-gray-600">Amount to pay:</p>
        <p className="text-3xl font-bold text-primary-600">
          ₹{amount.toLocaleString('en-IN')}
        </p>
      </div>

      {status === 'success' ? (
        <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg">
          ✓ Payment successful! NFT minted.
        </div>
      ) : status === 'error' ? (
        <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg mb-4">
          ✗ Payment failed. Please try again.
        </div>
      ) : status === 'processing' ? (
        <div className="bg-blue-100 text-blue-800 px-4 py-3 rounded-lg">
          Processing payment...
        </div>
      ) : null}

      {status === 'idle' && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Select Payment Method</p>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id as PaymentMethod)}
                  className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                    selectedMethod === method.id
                      ? 'border-accent-500 bg-accent-50 text-accent-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-6 h-6 mb-1" />
                  <span className="text-sm font-medium">{method.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading || status === 'success' || !selectedMethod}
        className="btn-primary w-full disabled:opacity-50"
      >
        {loading ? 'Processing...' : selectedMethod ? `Pay ₹${amount.toLocaleString('en-IN')}` : 'Select a payment method'}
      </button>

      <p className="text-xs text-gray-500 mt-4">
        Test mode: Use card number 4111 1111 1111 1111, any future expiry, any CVV
      </p>
    </div>
  );
}

export async function initiateAndPay(
  assetId: string,
  onPaymentReady: (data: PaymentData, openPopup: () => void) => void
) {
  try {
    const { data: orderData } = await api.post('/orders', { assetId });

    const { data: paymentData } = await api.post('/orders/initiate-payment', {
      orderId: orderData.data._id,
    });

    if (paymentData.data.payment) {
      onPaymentReady(
        {
          orderId: paymentData.data.payment.orderId,
          razorpayOrderId: paymentData.data.payment.orderId,
          amount: paymentData.data.payment.amount / 100,
          keyId: paymentData.data.payment.keyId,
        },
        () => {}
      );
    }
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } };
    throw new Error(err.response?.data?.message || 'Failed to initiate payment');
  }
}