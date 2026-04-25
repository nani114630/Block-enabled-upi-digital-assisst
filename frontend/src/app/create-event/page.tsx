'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Calendar, MapPin, Clock, Users, DollarSign, Loader2, Upload, X, ArrowLeft, Sparkles } from 'lucide-react';

const TICKET_TYPES = [
  { name: 'General Admission', priceInINR: 500, quantity: 100 },
  { name: 'VIP', priceInINR: 1500, quantity: 50 },
  { name: 'Premium', priceInINR: 2500, quantity: 25 },
];

interface CreateEventInput {
  name: string;
  description: string;
  venue: { name: string; address: string; city: string };
  dateTime: { start: string; end: string };
  ticketTypes: Array<{ name: string; priceInINR: number; quantity: number; description?: string }>;
  image: string;
  organizer: { name: string; contactEmail?: string; contactPhone?: string };
}

export default function CreateEventPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<CreateEventInput>({
    name: '',
    description: '',
    venue: { name: '', address: '', city: '' },
    dateTime: { start: '', end: '' },
    ticketTypes: [...TICKET_TYPES],
    image: '',
    organizer: { name: user?.name || '', contactEmail: user?.email || '', contactPhone: '' },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!formData.name || !formData.description || !formData.venue.name || !formData.image) {
      toast.error('Please fill all required fields and upload an image'); return;
    }
    try {
      setLoading(true);
      const { data } = await api.post('/events', formData);
      if (data.success) { toast.success('Event created!'); router.push('/organizer'); }
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } };
      toast.error(errObj.response?.data?.message || 'Failed to create event');
    } finally { setLoading(false); }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Select an image file'); return; }
    const reader = new FileReader();
    reader.onload = () => { setImagePreview(reader.result as string); setFormData({ ...formData, image: reader.result as string }); };
    reader.readAsDataURL(file);
  };

  const updateTicketType = (index: number, field: string, value: string | number) => {
    const updated = [...formData.ticketTypes];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, ticketTypes: updated });
  };
  
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-8 bg-dark-900 min-h-screen">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        
        <div className="text-center mb-8">
          <span className="text-accent-400 font-medium mb-3 block">CREATE EVENT</span>
          <h1 className="text-4xl font-bold text-white mb-3">Create New Event</h1>
          <p className="text-gray-400">Fill in the details to create your event</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary-400" />
              Event Details
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Name <span className="text-red-400">*</span></label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Summer Music Festival 2024" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description <span className="text-red-400">*</span></label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe your event..." rows={4} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 outline-none resize-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cover Image <span className="text-red-400">*</span></label>
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageChange} className="hidden" />
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                    <button type="button" onClick={() => { setImagePreview(''); setFormData({ ...formData, image: '' }); }} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-48 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-primary-500 hover:text-primary-400 transition-all">
                    <Upload className="h-8 w-8 mb-2" /><span className="text-sm">Click to upload image</span><span className="text-xs mt-1 text-gray-500">JPEG, PNG</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-accent-400" />
              Venue <span className="text-red-400">*</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Venue Name</label>
                <input type="text" value={formData.venue.name} onChange={(e) => setFormData({ ...formData, venue: { ...formData.venue, name: e.target.value } })} placeholder="City Convention Center" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 outline-none" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                <input type="text" value={formData.venue.address} onChange={(e) => setFormData({ ...formData, venue: { ...formData.venue, address: e.target.value } })} placeholder="123 Main Street" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                <input type="text" value={formData.venue.city} onChange={(e) => setFormData({ ...formData, venue: { ...formData.venue, city: e.target.value } })} placeholder="Mumbai" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 outline-none" required />
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <Clock className="h-5 w-5 text-green-400" />
              Date & Time <span className="text-red-400">*</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Start Date & Time</label>
                <input type="datetime-local" value={formData.dateTime.start} onChange={(e) => setFormData({ ...formData, dateTime: { ...formData.dateTime, start: e.target.value } })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-primary-500 outline-none [&::-webkit-calendar-picker-indicator]:invert" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Date & Time</label>
                <input type="datetime-local" value={formData.dateTime.end} onChange={(e) => setFormData({ ...formData, dateTime: { ...formData.dateTime, end: e.target.value } })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-primary-500 outline-none [&::-webkit-calendar-picker-indicator]:invert" required />
              </div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <Users className="h-5 w-5 text-purple-400" />
              Ticket Types
            </h2>
            <div className="space-y-5">
              {formData.ticketTypes.map((ticket, index) => (
                <div key={index} className="p-5 bg-white/5 rounded-xl">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Type Name</label>
                      <input type="text" value={ticket.name} onChange={(e) => updateTicketType(index, 'name', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Price (₹)</label>
                      <input type="number" value={ticket.priceInINR} onChange={(e) => updateTicketType(index, 'priceInINR', Number(e.target.value))} min="0" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                      <input type="number" value={ticket.quantity} onChange={(e) => updateTicketType(index, 'quantity', Number(e.target.value))} min="1" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                      <input type="text" value={ticket.description || ''} onChange={(e) => updateTicketType(index, 'description', e.target.value)} placeholder="Optional" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary-500 outline-none" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-semibold hover:shadow-glow transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" />Creating...</> : <><Calendar className="h-5 w-5" />Create Event</>}
          </button>
        </form>
      </main>
    </>
  );
}