'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Calendar, MapPin, Users, DollarSign, QrCode, Search, CheckCircle, XCircle, AlertTriangle, Loader2, BarChart3, Camera, Ticket, ArrowLeft, TrendingUp, Wallet, Activity, Clock } from 'lucide-react';

interface Event {
  _id: string;
  name: string;
  venue: { name: string; city: string };
  dateTime: { start: string; end: string };
  ticketTypes: Array<{ name: string; priceInINR: number; quantity: number; sold: number }>;
  totalTicketsSold: number;
  totalRevenue: number;
  status: string;
  image: string;
}

interface Ticket {
  _id: string;
  uniqueId: string;
  attendeeName: string;
  attendeeEmail?: string;
  ticketType: string;
  status: 'issued' | 'used' | 'cancelled' | 'refunded';
  checkedInAt?: string;
}

export default function OrganizerDashboard() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [scanResult, setScanResult] = useState<{ status: string; message: string; ticket?: Ticket } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'running' | 'completed' | 'details' | 'scanner'>('events');

  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents('upcoming');
    } else {
      router.push('/login');
    }
  }, [isAuthenticated]);

  const fetchEvents = async (statusFilter?: string) => {
    try {
      setLoading(true);
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const { data } = await api.get(`/events/organizer/my-events${params}`);
      setEvents(data.events || []);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async (eventId: string) => {
    try {
      const { data } = await api.get(`/events/organizer/tickets/${eventId}`);
      setTickets(data.tickets || []);
    } catch {
      toast.error('Failed to load tickets');
    }
  };

  const handleVerifyTicket = async (qrData: string) => {
    if (!selectedEvent) {
      toast.error('Please select an event first');
      return;
    }

    try {
      setScanning(true);
      const { data } = await api.post('/events/verify-ticket', {
        qrData,
        eventId: selectedEvent._id,
      });

      setScanResult({
        status: data.status,
        message: data.message,
        ticket: data.ticket || undefined,
      });

      if (data.valid) {
        toast.success('Ticket verified successfully!');
      } else if (data.status === 'already_used') {
        toast.error('Ticket already used');
      } else {
        toast.error('Invalid ticket');
      }

      fetchTickets(selectedEvent._id);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setScanResult({
        status: 'invalid',
        message: err.response?.data?.message || 'Verification failed',
      });
      toast.error('Verification failed');
    } finally {
      setScanning(false);
    }
  };

  const handleManualVerify = () => {
    if (!manualCode.trim()) {
      toast.error('Please enter a ticket code');
      return;
    }
    
    const qrData = btoa(JSON.stringify({
      uniqueId: manualCode.trim(),
      eventId: selectedEvent?._id,
      ticketType: '',
    }));
    
    handleVerifyTicket(qrData);
  };

  const startCamera = () => {
    if (cameraOn) return;
    setCameraOn(true);
    
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    
    scanner.render(
      (decodedText: string) => {
        handleVerifyTicket(decodedText);
        scanner.clear();
        setCameraOn(false);
      },
      (error: string) => {}
    );
    scannerRef.current = scanner;
  };

  const selectEvent = (event: Event) => {
    setSelectedEvent(event);
    fetchTickets(event._id);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
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
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Organizer Dashboard</h1>
            <p className="text-gray-400">Manage your events and verify tickets</p>
          </div>
          <button
            onClick={() => router.push('/create-event')}
            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-2xl font-semibold hover:shadow-glow transition-all"
          >
            + Create Event
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {[
            { icon: Calendar, label: 'Total Events', value: events.length, color: 'from-primary-500 to-primary-700' },
            { icon: Ticket, label: 'Tickets Sold', value: events.reduce((sum, e) => sum + e.totalTicketsSold, 0), color: 'from-green-500 to-green-700' },
            { icon: Wallet, label: 'Total Revenue', value: `₹${events.reduce((sum, e) => sum + e.totalRevenue, 0).toLocaleString()}`, color: 'from-yellow-500 to-yellow-700' },
            { icon: Activity, label: 'Checked In', value: tickets.filter(t => t.status === 'used').length, color: 'from-purple-500 to-purple-700' },
          ].map((stat, i) => (
            <div key={i} className="relative group">
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity`}></div>
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-8 flex-wrap">
          {[
            { key: 'events', label: 'Upcoming' },
            { key: 'running', label: 'Running' },
            { key: 'completed', label: 'Completed' },
            { key: 'details', label: 'Event Details' },
            { key: 'scanner', label: 'QR Scanner' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as typeof activeTab);
                if (tab.key === 'events') fetchEvents('upcoming');
                else if (tab.key === 'running') fetchEvents('running');
                else if (tab.key === 'completed') fetchEvents('completed');
                else if (tab.key === 'scanner') fetchEvents('all');
              }}
              className={`px-5 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {(activeTab === 'events' || activeTab === 'running' || activeTab === 'completed') && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-10 w-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No {activeTab === 'events' ? 'Upcoming' : activeTab === 'running' ? 'Running' : 'Completed'} Events</h3>
                <p className="text-gray-400 mb-6">Create your first event to get started</p>
                <button
                  onClick={() => router.push('/create-event')}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-semibold hover:shadow-glow transition-all"
                >
                  Create Event
                </button>
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event._id}
                  className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-primary-500/50 transition-all"
                >
                  <div className="relative h-40">
                    <img
                      src={event.image}
                      alt={event.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 to-transparent"></div>
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${
                      event.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {event.status}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-bold text-lg text-white mb-1 truncate">{event.name}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2 text-sm text-gray-400 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(event.dateTime.start)} • {formatTime(event.dateTime.start)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.venue.name}, {event.venue.city}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-white/10">
                      <div>
                        <span className="text-sm text-gray-500">Sold</span>
                        <span className="ml-2 font-bold text-white">{event.totalTicketsSold}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedEvent(event);
                          fetchTickets(event._id);
                          setActiveTab('details');
                        }}
                        className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div>
            <div className="mb-8">
              <label className="text-gray-400 text-sm font-medium mb-3 block">Select Event to View Details</label>
              <select
                value={selectedEvent?._id || ''}
                onChange={(e) => {
                  const event = events.find(ev => ev._id === e.target.value);
                  if (event) selectEvent(event);
                }}
                className="w-full md:w-1/2 px-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-primary-500 focus:outline-none transition-all"
              >
                <option value="" className="bg-dark-800">Select an event...</option>
                {events.map((event) => (
                  <option key={event._id} value={event._id} className="bg-dark-800">
                    {event.name} - {formatDate(event.dateTime.start)}
                  </option>
                ))}
              </select>
            </div>

            {!selectedEvent ? (
              <div className="text-center py-16 text-gray-400">
                <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-10 w-10 text-gray-500" />
                </div>
                <p>Select an event to view details</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid md:grid-cols-4 gap-6">
                  {[
                    { icon: Ticket, label: 'Tickets Sold', value: selectedEvent.totalTicketsSold, color: 'from-blue-500 to-blue-700' },
                    { icon: Users, label: 'Attendees', value: selectedEvent.totalTicketsSold, color: 'from-green-500 to-green-700' },
                    { icon: DollarSign, label: 'Revenue', value: `₹${selectedEvent.totalRevenue.toLocaleString()}`, color: 'from-yellow-500 to-yellow-700' },
                    { icon: CheckCircle, label: 'Checked In', value: tickets.filter(t => t.status === 'used').length, color: 'from-purple-500 to-purple-700' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                      <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Event Information</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Event Name</p>
                        <p className="font-medium text-white">{selectedEvent.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date & Time</p>
                        <p className="font-medium text-white">{formatDate(selectedEvent.dateTime.start)} • {formatTime(selectedEvent.dateTime.start)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Venue</p>
                        <p className="font-medium text-white">{selectedEvent.venue.name}, {selectedEvent.venue.city}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedEvent.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {selectedEvent.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Ticket Sales by Type</h3>
                    <div className="space-y-4">
                      {selectedEvent.ticketTypes.map((type) => (
                        <div key={type.name} className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
                          <div>
                            <p className="font-medium text-white">{type.name}</p>
                            <p className="text-sm text-gray-400">₹{type.priceInINR} each</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">{type.sold} sold</p>
                            <p className="text-sm text-green-400">₹{(type.sold * type.priceInINR).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6">Booked Attendees ({tickets.length})</h3>
                  {tickets.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No tickets booked yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">#</th>
                            <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Attendee</th>
                            <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Ticket Type</th>
                            <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Ticket ID</th>
                            <th className="text-left py-4 px-4 text-sm font-medium text-gray-400">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tickets.map((ticket, index) => (
                            <tr key={ticket._id} className="border-b border-white/5">
                              <td className="py-4 px-4 text-gray-400">{index + 1}</td>
                              <td className="py-4 px-4">
                                <p className="font-medium text-white">{ticket.attendeeName}</p>
                                {ticket.attendeeEmail && <p className="text-xs text-gray-500">{ticket.attendeeEmail}</p>}
                              </td>
                              <td className="py-4 px-4 text-gray-300">{ticket.ticketType}</td>
                              <td className="py-4 px-4 font-mono text-xs text-gray-400">{ticket.uniqueId.substring(0, 12)}</td>
                              <td className="py-4 px-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  ticket.status === 'used' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                  ticket.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                  'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}>
                                  {ticket.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scanner' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <QrCode className="h-6 w-6 text-primary-400" />
                QR Ticket Scanner
              </h2>
              
              {!selectedEvent ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-6">Select an event from the Upcoming Events tab first to scan tickets</p>
                  <button
                    onClick={() => setActiveTab('events')}
                    className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all"
                  >
                    Select Event
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="text-gray-400 text-sm font-medium mb-3 block">Select Event</label>
                    <select
                      value={selectedEvent?._id || ''}
                      onChange={(e) => {
                        const event = events.find(ev => ev._id === e.target.value);
                        if (event) selectEvent(event);
                      }}
                      className="w-full px-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-primary-500 focus:outline-none transition-all"
                    >
                      <option value="" className="bg-dark-800">Select an event...</option>
                      {events.map((event) => (
                        <option key={event._id} value={event._id} className="bg-dark-800">
                          {event.name} - {formatDate(event.dateTime.start)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-6 p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl">
                    <p className="text-primary-400">
                      <strong>Active Event:</strong> {selectedEvent.name}
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="text-gray-400 text-sm font-medium mb-3 block">Enter Ticket Code Manually</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="e.g., TKT-ABC123XYZ"
                        className="flex-1 px-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none transition-all"
                      />
                      <button
                        onClick={handleManualVerify}
                        disabled={scanning}
                        className="px-6 py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-2xl font-medium hover:shadow-glow transition-all disabled:opacity-50"
                      >
                        {scanning ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify'}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={startCamera}
                    disabled={cameraOn}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    <Camera className="h-5 w-5" />
                    {cameraOn ? 'Camera On...' : 'Open Camera Scanner'}
                  </button>

                  <div id="qr-reader" className="mt-6"></div>
                </>
              )}
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">Scan Result</h2>
              
              {scanResult ? (
                <div className={`p-6 rounded-2xl ${
                  scanResult.status === 'valid'
                    ? 'bg-green-500/10 border border-green-500/30'
                    : scanResult.status === 'already_used'
                    ? 'bg-yellow-500/10 border border-yellow-500/30'
                    : 'bg-red-500/10 border border-red-500/30'
                }`}>
                  <div className="flex items-center gap-4 mb-6">
                    {scanResult.status === 'valid' ? (
                      <CheckCircle className="h-10 w-10 text-green-400" />
                    ) : scanResult.status === 'already_used' ? (
                      <AlertTriangle className="h-10 w-10 text-yellow-400" />
                    ) : (
                      <XCircle className="h-10 w-10 text-red-400" />
                    )}
                    <div>
                      <p className={`font-bold text-xl ${
                        scanResult.status === 'valid'
                          ? 'text-green-400'
                          : scanResult.status === 'already_used'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}>
                        {scanResult.status === 'valid'
                          ? 'Valid Ticket'
                          : scanResult.status === 'already_used'
                          ? 'Already Used'
                          : 'Invalid'}
                      </p>
                      <p className="text-gray-400">{scanResult.message}</p>
                    </div>
                  </div>
                  
                  {scanResult.ticket && (
                    <div className="pt-6 border-t border-white/10">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Attendee</p>
                          <p className="font-medium text-white">{scanResult.ticket.attendeeName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Ticket Type</p>
                          <p className="font-medium text-white">{scanResult.ticket.ticketType}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">Ticket ID</p>
                          <p className="font-mono text-sm text-white">{scanResult.ticket.uniqueId}</p>
                        </div>
                        {scanResult.ticket.checkedInAt && (
                          <div>
                            <p className="text-sm text-gray-500">Checked In At</p>
                            <p className="font-medium text-green-400">
                              {new Date(scanResult.ticket.checkedInAt).toLocaleTimeString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="h-10 w-10 text-gray-500" />
                  </div>
                  <p>Scan a ticket to see the result</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}