'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import api from '@/lib/api';
import { generateQRCode } from '@/lib/qrcode';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { Calendar, MapPin, Clock, User, Ticket, QrCode, Loader2, Sparkles, ArrowLeft, CreditCard, Smartphone, Building2, Wallet, X } from 'lucide-react';

interface Event {
  _id: string;
  name: string;
  description: string;
  venue: {
    name: string;
    address: string;
    city: string;
  };
  dateTime: {
    start: string;
    end: string;
    timezone: string;
  };
  ticketTypes: Array<{
    name: string;
    priceInINR: number;
    quantity: number;
    sold: number;
    description?: string;
  }>;
  image: string;
  status: string;
  totalTicketsSold: number;
  organizer: {
    name: string;
    contactEmail?: string;
  };
}

interface Ticket {
  uniqueId: string;
  qrCodeData: string;
  ticketType: string;
  attendeeName: string;
  status: string;
}

type PaymentMethod = 'card' | 'debit' | 'upi' | 'netbanking' | 'wallet' | null;

const paymentMethods = [
  { id: 'card', label: 'Credit Card', icon: CreditCard },
  { id: 'debit', label: 'Debit Card', icon: CreditCard },
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'netbanking', label: 'Net Banking', icon: Building2 },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
];

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  
  const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');
  const [purchasedTickets, setPurchasedTickets] = useState<Ticket[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [params.id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/events/${params.id}`);
      setEvent(data.data);
    } catch {
      toast.error('Failed to load event');
      router.push('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleBookTicket = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!attendeeName.trim()) {
      toast.error('Please enter attendee name');
      return;
    }

    if (!selectedTicketType) {
      toast.error('Please select a ticket type');
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setProcessingPayment(true);

    try {
      const { data } = await api.post(`/events/${params.id}/book`, {
        ticketType: selectedTicketType,
        quantity,
        attendeeName,
        attendeeEmail,
        attendeePhone,
        paymentMethod: selectedPaymentMethod,
      });

      if (data.testMode) {
        const ticketsWithQR: Ticket[] = [];
        for (const ticket of data.data) {
          const qrImage = await generateQRCode(ticket.qrCodeData);
          ticketsWithQR.push({
            ...ticket,
            qrCodeData: qrImage,
          });
        }
        setPurchasedTickets(ticketsWithQR);
        setShowPaymentModal(false);
        toast.success('Tickets booked successfully! (Test Mode)');
        setProcessingPayment(false);
        return;
      }

      if (data.paymentRequired && data.data.razorpayOrderId) {
        const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/razorpay.js';
        script.async = true;
        script.onload = () => {
          const options = {
            key: keyId,
            amount: data.data.amount * 100,
            currency: 'INR',
            name: 'UPI Digital Assets',
            description: `Event Tickets - ${event?.name}`,
            order_id: data.data.razorpayOrderId,
            handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string }) => {
              try {
                const verifyRes = await api.post('/payments/verify-mint', {
                  orderId: data.data.razorpayOrderId,
                  paymentId: response.razorpay_payment_id,
                  signature: (response as { razorpay_signature?: string }).razorpay_signature || '',
                });

                const ticketsWithQR: Ticket[] = [];
                for (const ticket of verifyRes.data.data.order?.tickets || []) {
                  const qrImage = await generateQRCode(ticket.qrCodeData);
                  ticketsWithQR.push({
                    ...ticket,
                    qrCodeData: qrImage,
                  });
                }

                if (ticketsWithQR.length > 0) {
                  setPurchasedTickets(ticketsWithQR);
                } else {
                  const ticketData = verifyRes.data.data.order?.tickets || [];
                  for (const ticket of ticketData) {
                    const qrImage = await generateQRCode(ticket.qrCodeData);
                    ticketsWithQR.push({ ...ticket, qrCodeData: qrImage });
                  }
                  setPurchasedTickets(ticketsWithQR);
                }

                setShowPaymentModal(false);
                toast.success('Tickets booked successfully!');
              } catch (error) {
                toast.error('Payment verification failed');
              }
            },
            modal: {
              confirm_close: true,
            },
            prefill: {
              name: attendeeName,
              email: attendeeEmail || '',
              contact: attendeePhone || '',
            },
            method: selectedPaymentMethod || undefined,
            theme: {
              color: '#0ea5e9',
            },
          };

          const razorpay = new (window as unknown as { Razorpay: new (opts: Record<string, unknown>) => { open: () => void } }).Razorpay(options);
          razorpay.open();
          setProcessingPayment(false);
        };
        document.body.appendChild(script);
        return;
      }

      if (data.success) {
        const ticketsWithQR: Ticket[] = [];
        for (const ticket of data.data) {
          const qrImage = await generateQRCode(ticket.qrCodeData);
          ticketsWithQR.push({
            ...ticket,
            qrCodeData: qrImage,
          });
        }
        setPurchasedTickets(ticketsWithQR);
        setShowPaymentModal(false);
        setShowPaymentModal(false);
        toast.success('Tickets booked successfully!');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to book ticket');
    } finally {
      setProcessingPayment(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-dark-900">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </>
    );
  }

  if (purchasedTickets.length > 0) {
    return (
      <>
        <Header />
        <main className="max-w-4xl mx-auto px-6 py-12 bg-dark-900 min-h-screen">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-8"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-10 w-10 text-green-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">Booking Confirmed!</h1>
            <p className="text-gray-400">Your tickets are ready. Show the QR codes at the event entrance.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {purchasedTickets.map((ticket, index) => (
              <div key={ticket.uniqueId} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-primary-500 to-accent-500 p-4">
                  <h3 className="text-white font-bold text-lg">{event?.name}</h3>
                  <p className="text-white/70 text-sm">{ticket.ticketType}</p>
                </div>
                <div className="p-6">
                  <div className="text-center mb-4">
                    <div className="w-14 h-14 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="h-7 w-7 text-primary-400" />
                    </div>
                    <p className="font-bold text-xl text-white">{ticket.attendeeName}</p>
                    <p className="text-sm text-gray-400">Ticket #{index + 1}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-500 text-center">Ticket ID</p>
                    <p className="font-mono text-sm text-center text-primary-400">{ticket.uniqueId}</p>
                  </div>
                  <div className="flex justify-center">
                    <Image
                      src={ticket.qrCodeData}
                      alt="QR Code"
                      width={160}
                      height={160}
                      className="rounded-lg"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push('/my-tickets')}
            className="mt-10 w-full py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-semibold hover:shadow-glow transition-all"
          >
            View All My Tickets
          </button>
        </main>
      </>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-8 bg-dark-900 min-h-screen">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden mb-6">
              <Image
                src={event.image}
                alt={event.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900/70 to-transparent"></div>
            </div>

            <h1 className="text-4xl font-bold text-white mb-4">{event.name}</h1>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar className="h-5 w-5 text-primary-400" />
                <span className="text-white">{formatDate(event.dateTime.start)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="h-5 w-5 text-accent-400" />
                <span className="text-white">{formatTime(event.dateTime.start)} - {formatTime(event.dateTime.end)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="h-5 w-5 text-green-400" />
                <span className="text-white">{event.venue.name}, {event.venue.city}</span>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">About this Event</h2>
              <p className="text-gray-400 whitespace-pre-wrap">{event.description}</p>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Venue</h2>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <p className="font-medium text-white">{event.venue.name}</p>
                <p className="text-gray-400">{event.venue.address}</p>
                <p className="text-gray-400">{event.venue.city}</p>
              </div>
            </div>
          </div>

          {!isOrganizer && (
            <div className="md:col-span-1">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sticky top-4">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <Ticket className="h-5 w-5 text-primary-400" />
                  Book Tickets
                </h2>
               
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">Select Ticket Type</label>
                  <div className="space-y-3">
                    {event.ticketTypes.map((ticket) => {
                      const available = ticket.quantity - ticket.sold;
                      return (
                        <button
                          key={ticket.name}
                          onClick={() => setSelectedTicketType(ticket.name)}
                          disabled={available === 0}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            selectedTicketType === ticket.name
                              ? 'border-primary-500 bg-primary-500/10'
                              : available === 0
                              ? 'border-white/10 opacity-50 cursor-not-allowed'
                              : 'border-white/10 hover:border-primary-500/50'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-white">{ticket.name}</p>
                              {ticket.description && (
                                <p className="text-sm text-gray-400">{ticket.description}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-white">₹{ticket.priceInINR}</p>
                              <p className="text-xs text-gray-500">{available} left</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-300 mb-3">Quantity</label>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-primary-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num} className="bg-dark-800">{num}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-300 mb-3">Attendee Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={attendeeName}
                    onChange={(e) => setAttendeeName(e.target.value)}
                    placeholder="Enter name as on ID"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 outline-none"
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-300 mb-3">Email (optional)</label>
                  <input
                    type="email"
                    value={attendeeEmail}
                    onChange={(e) => setAttendeeEmail(e.target.value)}
                    placeholder="Enter email"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 outline-none"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">Phone (optional)</label>
                  <input
                    type="tel"
                    value={attendeePhone}
                    onChange={(e) => setAttendeePhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 outline-none"
                  />
                </div>

                {selectedTicketType && (
                  <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total</span>
                      <span className="text-2xl font-bold text-white">
                        ₹{(event.ticketTypes.find(t => t.name === selectedTicketType)?.priceInINR || 0) * quantity}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBookTicket}
                  disabled={booking || !selectedTicketType || !attendeeName}
                  className="w-full py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-semibold hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {booking ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Ticket className="h-5 w-5" />
                      Book Now
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Select Payment Method</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 text-center">
              <p className="text-gray-400">Amount to pay</p>
              <p className="text-3xl font-bold text-primary-400">
                ₹{((event?.ticketTypes.find(t => t.name === selectedTicketType)?.priceInINR || 0) * quantity).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id as PaymentMethod)}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                      selectedPaymentMethod === method.id
                        ? 'border-primary-500 bg-primary-500/20 text-primary-400'
                        : 'border-white/10 hover:border-white/30 text-gray-300'
                    }`}
                  >
                    <Icon className="h-8 w-8 mb-2" />
                    <span className="font-medium">{method.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handlePaymentConfirm}
              disabled={processingPayment || !selectedPaymentMethod}
              className="w-full py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-semibold hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Pay Now</>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}