'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import api from '@/lib/api';
import { generateQRCode } from '@/lib/qrcode';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { Ticket, User, Calendar, MapPin, Loader2, ArrowLeft, CheckCircle, Clock, XCircle, Sparkles } from 'lucide-react';

interface Ticket {
  _id: string;
  uniqueId: string;
  eventId: {
    name: string;
    image: string;
    venue: { name: string; city: string };
    dateTime: { start: string; end: string };
  };
  ticketType: string;
  attendeeName: string;
  attendeeEmail?: string;
  qrCodeData: string;
  status: 'issued' | 'used' | 'cancelled' | 'refunded';
  checkedInAt?: string;
  priceInINR: number;
}

export default function MyTicketsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeTab, setActiveTab] = useState<'ongoing' | 'used' | 'completed'>('ongoing');

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyTickets();
    } else {
      router.push('/login');
    }
  }, [isAuthenticated]);

  const now = new Date();
  const ongoingTickets = tickets.filter(t => t.status === 'issued' && new Date(t.eventId.dateTime.end) > now);
  const usedTickets = tickets.filter(t => t.status === 'used');
  const completedTickets = tickets.filter(t => t.status === 'cancelled' || t.status === 'refunded' || (t.status === 'issued' && new Date(t.eventId.dateTime.end) <= now));
  
  const displayTickets = activeTab === 'ongoing' ? ongoingTickets : activeTab === 'used' ? usedTickets : completedTickets;

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/tickets/my-tickets');
      
      const ticketsWithQR: Ticket[] = [];
      for (const ticket of data.data || []) {
        let qrImage = ticket.qrCodeData;
        if (ticket.qrCodeData && !ticket.qrCodeData.startsWith('data:')) {
          qrImage = await generateQRCode(ticket.qrCodeData);
        }
        ticketsWithQR.push({
          ...ticket,
          qrCodeData: qrImage,
        });
      }
      setTickets(ticketsWithQR);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-8 bg-dark-900 min-h-screen">
        <button
          onClick={() => router.push('/marketplace')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        
        <div className="text-center mb-10">
          <span className="text-accent-400 font-medium mb-3 block">MY TICKETS</span>
          <h1 className="text-5xl font-bold text-white mb-4">My Tickets</h1>
          <p className="text-gray-400 text-lg">View and manage your event tickets</p>
        </div>

        <div className="flex justify-center gap-3 mb-12 flex-wrap">
          {[
            { key: 'ongoing', label: 'Upcoming', icon: Clock, count: ongoingTickets.length },
            { key: 'used', label: 'Used', icon: CheckCircle, count: usedTickets.length },
            { key: 'completed', label: 'Completed', icon: XCircle, count: completedTickets.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-white/20' : 'bg-white/10'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Ticket className="h-12 w-12 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">No Tickets Yet</h2>
            <p className="text-gray-400 mb-8">Book your first event to get started</p>
            <button
              onClick={() => router.push('/marketplace')}
              className="px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-2xl font-semibold hover:shadow-glow transition-all"
            >
              Browse Events
            </button>
          </div>
        ) : displayTickets.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Ticket className="h-12 w-12 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">No {activeTab === 'ongoing' ? 'Upcoming' : activeTab === 'used' ? 'Used' : 'Past'} Tickets</h2>
            <p className="text-gray-400 mb-8">{activeTab === 'ongoing' ? 'Book your first event to get started' : 'Your tickets will appear here'}</p>
            {activeTab === 'ongoing' && (
              <button
                onClick={() => router.push('/marketplace')}
                className="px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-2xl font-semibold hover:shadow-glow transition-all"
              >
                Browse Events
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {displayTickets.map((ticket) => (
              <div
                key={ticket._id}
                onClick={() => setSelectedTicket(ticket)}
                className="group relative cursor-pointer"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 via-accent-500 to-purple-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
                  <div className="relative h-44">
                    <Image
                      src={ticket.eventId.image}
                      alt={ticket.eventId.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent"></div>
                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${
                      ticket.status === 'used' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-white/10 text-white border border-white/20 backdrop-blur'
                    }`}>
                      {ticket.status === 'used' ? 'USED' : 'VALID'}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-bold text-xl text-white mb-1 line-clamp-1">{ticket.eventId.name}</h3>
                      <p className="text-sm text-gray-300">{ticket.ticketType}</p>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">DATE</p>
                        <p className="font-semibold text-white">{formatDate(ticket.eventId.dateTime.start)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">VENUE</p>
                        <p className="font-semibold text-white">{ticket.eventId.venue.city}</p>
                      </div>
                    </div>
                    
                    <div className="border-t border-b border-dashed border-white/20 py-4 mb-5">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500">ATTENDEE</p>
                          <p className="font-medium text-white">{ticket.attendeeName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">TICKET ID</p>
                          <p className="font-mono text-sm font-bold text-primary-400">{ticket.uniqueId.substring(0, 8)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Image
                        src={ticket.qrCodeData}
                        alt="QR Code"
                        width={140}
                        height={140}
                        className="rounded-xl border-2 border-white/20"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-primary-500 via-accent-500 to-purple-500 text-white text-center py-3 text-xs font-medium">
                    NFT TICKET • NON-TRANSFERABLE
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTicket && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="relative bg-dark-800 rounded-3xl max-w-lg w-full overflow-hidden border border-white/10">
              <div className="relative h-56">
                <Image
                  src={selectedTicket.eventId.image}
                  alt={selectedTicket.eventId.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-2xl font-bold mb-1">{selectedTicket.eventId.name}</h3>
                  <p className="text-gray-300">{selectedTicket.ticketType}</p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-8">
                <div className="bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/30 rounded-2xl p-5 mb-6">
                  <p className="text-xs text-primary-400 font-bold uppercase tracking-wider mb-1">Ticket Type</p>
                  <p className="text-xl font-bold text-primary-400">{selectedTicket.ticketType}</p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">DATE</p>
                    <p className="font-semibold text-white">{formatDate(selectedTicket.eventId.dateTime.start)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">VENUE</p>
                    <p className="font-semibold text-white">{selectedTicket.eventId.venue.city}</p>
                  </div>
                </div>

                <div className="border-t border-b border-dashed border-white/20 py-5 mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-xs text-gray-500">ATTENDEE</p>
                      <p className="font-medium text-white">{selectedTicket.attendeeName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">PRICE</p>
                      <p className="font-bold text-green-400">₹{selectedTicket.priceInINR}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 mb-6">
                  <p className="text-xs text-gray-500 mb-1">TICKET ID (FULL)</p>
                  <p className="font-mono text-sm text-primary-400 break-all">{selectedTicket.uniqueId}</p>
                </div>

                <div className="flex items-center justify-center mb-6">
                  <span className={`px-5 py-2 rounded-full text-sm font-bold ${
                    selectedTicket.status === 'used' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  }`}>
                    {selectedTicket.status === 'used' ? 'USED' : 'VALID'}
                  </span>
                </div>

                <div className="text-center">
                  <Image
                    src={selectedTicket.qrCodeData}
                    alt="QR Code"
                    width={200}
                    height={200}
                    className="mx-auto rounded-xl border-2 border-white/20"
                  />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-primary-500 via-accent-500 to-purple-500 text-white text-center py-4 text-sm font-medium">
                NFT TICKET • NON-TRANSFERABLE
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}