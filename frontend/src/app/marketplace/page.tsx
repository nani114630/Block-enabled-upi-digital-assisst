'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { Calendar, MapPin, Loader2, Ticket, ArrowLeft, Sparkles, Flame, Music, Crown } from 'lucide-react';

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
  };
  ticketTypes: Array<{
    name: string;
    priceInINR: number;
    quantity: number;
    sold: number;
  }>;
  image: string;
  status: string;
}

export default function MarketplacePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';
  
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/events');
      setEvents(data.events || []);
    } catch (err) {
      toast.error('Failed to load events');
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

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8 bg-dark-900 min-h-screen">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        
        <div className="text-center mb-12">
          <span className="text-accent-400 font-medium mb-3 block">MARKETPLACE</span>
          <h1 className="text-5xl font-bold text-white mb-4">Event Marketplace</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Book your tickets for unforgettable experiences</p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Ticket className="h-12 w-12 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">No Events Available</h2>
            <p className="text-gray-400">Check back later for new events</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <div
                key={event._id}
                onClick={() => router.push(`/events/${event._id}`)}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-primary-500/50 hover:shadow-glow transition-all"
              >
                <div className="relative h-48">
                  <Image
                    src={event.image}
                    alt={event.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent"></div>
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${
                    event.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                    {event.status}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-bold text-xl text-white mb-2 line-clamp-1">{event.name}</h3>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-gray-400">
                      <Calendar className="h-5 w-5 text-primary-400" />
                      <span className="text-sm">{formatDate(event.dateTime.start)} • {formatTime(event.dateTime.start)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-400">
                      <MapPin className="h-5 w-5 text-accent-400" />
                      <span className="text-sm">{event.venue.name}, {event.venue.city}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <div>
                      <span className="text-sm text-gray-500">From</span>
                      <span className="ml-2 font-bold text-xl text-white">₹{Math.min(...event.ticketTypes.map(t => t.priceInINR))}</span>
                    </div>
                    {!isOrganizer && (
                      <button className="px-5 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium text-sm hover:shadow-glow transition-all">
                        Book Now →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}