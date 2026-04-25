'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Header } from '@/components/Header';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { Calendar, DollarSign, Edit, Trash2, Eye, Users, Ticket, ChevronDown, ChevronUp, Hash, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NFTInfo {
  tokenId: number;
  ownerName: string;
  ownerEmail: string;
  mintedAt: string;
  transactionHash: string;
}

interface Attendee {
  orderId: string;
  userId: string;
  name: string;
  email: string;
  paidAt: string;
}

interface EventStats {
  assetId: string;
  name: string;
  totalTickets: number;
  ticketsSold: number;
  revenue: number;
  attendees: Attendee[];
  nfts: NFTInfo[];
}

interface StatsData {
  events: EventStats[];
  totalRevenue: number;
  totalEvents: number;
  totalTicketsSold: number;
}

interface Event {
  _id: string;
  name: string;
  description: string;
  priceInINR: number;
  category: string;
  status: string;
  media: {
    imageUrl: string;
  };
  creator: {
    name: string;
  };
  createdAt: string;
}

export default function MyEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState<string | null>(null);
  const [eventOrders, setEventOrders] = useState<{ orders: Attendee[]; nfts: NFTInfo[] } | null>(null);
  const { user } = useAuthStore();
  const router = useRouter();

  const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';

  useEffect(() => {
    if (isOrganizer) {
      fetchMyEvents();
      fetchStats();
    }
  }, [isOrganizer]);

  const fetchMyEvents = async () => {
    try {
      const { data } = await api.get('/assets');
      setEvents(data.data || []);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/assets/organizer/stats');
      setStats(data.data);
    } catch {
      toast.error('Failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchEventOrders = async (assetId: string) => {
    setOrdersLoading(assetId);
    try {
      const { data } = await api.get(`/assets/organizer/orders?assetId=${assetId}`);
      setEventOrders(data.data);
    } catch {
      toast.error('Failed to load attendee details');
    } finally {
      setOrdersLoading(null);
    }
  };

  const toggleEvent = (assetId: string) => {
    if (expandedEvent === assetId) {
      setExpandedEvent(null);
      setEventOrders(null);
    } else {
      setExpandedEvent(assetId);
      fetchEventOrders(assetId);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await api.delete(`/assets/${eventId}`);
      toast.success('Event deleted');
      fetchMyEvents();
      fetchStats();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const getEventStats = (assetId: string) => {
    return stats?.events.find(e => e.assetId === assetId);
  };

  if (!isOrganizer) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-12 shadow-soft">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-3xl font-bold gradient-text mb-3">Access Denied</h1>
            <p className="text-dark-500 text-lg">Only organizers can view their events</p>
            <p className="text-dark-400 mt-2 mb-6">Sign up as an organizer to create and manage events</p>
            <button onClick={() => router.push('/signup')} className="btn-primary">
              Become an Organizer
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-dark-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold gradient-text">My Events</h1>
              <p className="text-dark-500 mt-1">Manage your created events</p>
            </div>
          </div>
          <Link href="/upload" className="btn-primary">
            Create New Event
          </Link>
        </div>

        {isOrganizer && (stats || !statsLoading) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 opacity-80" />
                <span className="text-sm opacity-80">Total Events</span>
              </div>
              <p className="text-3xl font-bold">{stats?.totalEvents || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Ticket className="w-5 h-5 opacity-80" />
                <span className="text-sm opacity-80">Tickets Sold</span>
              </div>
              <p className="text-3xl font-bold">{stats?.totalTicketsSold || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 opacity-80" />
                <span className="text-sm opacity-80">Total Revenue</span>
              </div>
              <p className="text-3xl font-bold">₹{stats?.totalRevenue.toLocaleString('en-IN') || 0}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-2xl font-bold text-dark-900 mb-2">No Events Yet</h2>
            <p className="text-dark-500 mb-6">You haven't created any events yet</p>
            <Link href="/upload" className="btn-primary inline-flex items-center gap-2">
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const eventStat = getEventStats(event._id);
              const isExpanded = expandedEvent === event._id;
              return (
                <div key={event._id} className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-soft border border-white/50 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="relative w-full md:w-48 h-48 flex-shrink-0">
                      <Image
                        src={event.media?.imageUrl || '/placeholder.jpg'}
                        alt={event.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-xl text-dark-900">{event.name}</h3>
                            <span className={`badge ${event.status === 'active' ? 'badge-success' : 'badge-primary'}`}>
                              {event.status}
                            </span>
                          </div>
                          <p className="text-dark-500 text-sm line-clamp-1">{event.description}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Link
                            href={`/marketplace`}
                            className="btn-secondary py-2 px-3 text-sm flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Link>
                          <button
                            onClick={() => handleDelete(event._id)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-dark-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(event.createdAt).toLocaleDateString('en-IN')}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ₹{event.priceInINR.toLocaleString('en-IN')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Ticket className="w-4 h-4" />
                          {eventStat?.ticketsSold || 0} / {eventStat?.totalTickets || 0} sold
                        </span>
                        {eventStat && eventStat.revenue > 0 && (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <DollarSign className="w-4 h-4" />
                            ₹{eventStat.revenue.toLocaleString('en-IN')} earned
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleEvent(event._id)}
                        className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                      >
                        <Users className="w-4 h-4" />
                        {isExpanded ? 'Hide' : 'Show'} Attendees & NFT Details
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 p-5 bg-gray-50/50">
                      {ordersLoading === event._id ? (
                        <div className="text-center py-4 text-dark-500">Loading...</div>
                      ) : eventOrders ? (
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-dark-900 mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Attendees ({eventOrders.orders.length})
                            </h4>
                            {eventOrders.orders.length === 0 ? (
                              <p className="text-dark-500 text-sm">No attendees yet</p>
                            ) : (
                              <div className="space-y-2">
                                {eventOrders.orders.map((attendee) => (
                                  <div key={attendee.orderId} className="bg-white rounded-lg p-3 border border-gray-100">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-medium text-dark-900 text-sm">{attendee.name}</p>
                                        <p className="text-dark-500 text-xs">{attendee.email}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs text-dark-400">
                                          {attendee.paidAt ? new Date(attendee.paidAt).toLocaleDateString('en-IN') : ''}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-dark-900 mb-3 flex items-center gap-2">
                              <Hash className="w-4 h-4" />
                              Minted NFTs ({eventOrders.nfts.length})
                            </h4>
                            {eventOrders.nfts.length === 0 ? (
                              <p className="text-dark-500 text-sm">No NFTs minted yet</p>
                            ) : (
                              <div className="space-y-2">
                                {eventOrders.nfts.map((nft) => (
                                  <div key={nft.tokenId} className="bg-white rounded-lg p-3 border border-gray-100">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-medium text-dark-900 text-sm flex items-center gap-1">
                                          <Hash className="w-3 h-3" />
                                          #{nft.tokenId}
                                        </p>
                                        <p className="text-dark-500 text-xs">{nft.ownerName}</p>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <a
                                          href={`https://mumbai.polygonscan.com/tx/${nft.transactionHash}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary-600 hover:text-primary-700"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}