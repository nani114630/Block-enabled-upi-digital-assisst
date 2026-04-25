'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Header } from '@/components/Header';
import { Upload, Image, DollarSign, Tag, User, FileText, X, ArrowLeft } from 'lucide-react';

const CATEGORIES = [
  { value: 'concert', label: '🎤 Concert', emoji: '🎤' },
  { value: 'festival', label: '🎪 Festival', emoji: '🎪' },
  { value: 'workshop', label: '🎓 Workshop', emoji: '🎓' },
  { value: 'sports', label: '⚽ Sports', emoji: '⚽' },
  { value: 'theater', label: '🎭 Theater', emoji: '🎭' },
  { value: 'comedy', label: '😂 Comedy Show', emoji: '😂' },
  { value: 'digital-art', label: '🎨 Digital Art', emoji: '🎨' },
  { value: 'photography', label: '📷 Photography', emoji: '📷' },
  { value: 'music', label: '🎵 Music', emoji: '🎵' },
];

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    priceInINR: 0,
    category: 'concert',
    creatorName: '',
  });

  const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';

  if (!isOrganizer) {
    return (
      <>
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-12 shadow-soft">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-3xl font-bold gradient-text mb-3">Access Denied</h1>
            <p className="text-dark-500 text-lg">Only organizers can create events</p>
            <p className="text-dark-400 mt-2 mb-6">Sign up as an organizer to create and manage events</p>
            <button onClick={() => router.push('/signup')} className="btn-primary">
              Become an Organizer
            </button>
          </div>
        </main>
      </>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imagePreview) {
      toast.error('Please upload an event image');
      return;
    }

    if (!form.name.trim()) {
      toast.error('Please enter event name');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Please enter description');
      return;
    }
    if (!form.priceInINR || form.priceInINR <= 0) {
      toast.error('Please enter valid price');
      return;
    }
    if (!form.creatorName.trim()) {
      toast.error('Please enter organizer name');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('priceInINR', String(form.priceInINR));
      formData.append('category', form.category);
      formData.append('creatorName', form.creatorName);
      
      const fileInput = fileInputRef.current;
      if (fileInput?.files?.[0]) {
        formData.append('image', fileInput.files[0]);
      }

      console.log('Sending form data:', {
        name: form.name,
        description: form.description,
        priceInINR: form.priceInINR,
        category: form.category,
        creatorName: form.creatorName,
        hasFile: fileInput?.files?.[0] ? true : false
      });

      const response = await api.post('/assets/upload', formData);

      toast.success('Event created successfully!');
      router.push('/marketplace');
    } catch (error: unknown) {
      console.error('Upload error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-dark-600" />
          </button>
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold gradient-text">Create New Event</h1>
            <p className="text-dark-500 mt-2">Fill in the details to list your event on the marketplace</p>
          </div>
          <div className="w-10" />
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-soft border border-white/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="eventName" className="input-label flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Event Name
              </label>
              <input
                id="eventName"
                name="eventName"
                type="text"
                required
                placeholder="Enter your event name"
                className="input-field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="category" className="input-label flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Event Category
              </label>
              <select
                id="category"
                name="category"
                className="input-field"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="priceInINR" className="input-label flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Ticket Price (INR)
              </label>
              <input
                id="priceInINR"
                name="priceInINR"
                type="number"
                required
                min={1}
                placeholder="0.00"
                className="input-field"
                value={form.priceInINR}
                onChange={(e) => setForm({ ...form, priceInINR: Number(e.target.value) })}
              />
            </div>

            <div>
              <label htmlFor="creatorName" className="input-label flex items-center gap-2">
                <User className="w-4 h-4" />
                Organizer Name
              </label>
              <input
                id="creatorName"
                name="creatorName"
                type="text"
                required
                placeholder="Your name or organization"
                className="input-field"
                value={form.creatorName}
                onChange={(e) => setForm({ ...form, creatorName: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="eventImage" className="input-label flex items-center gap-2">
                <Image className="w-4 h-4" />
                Event Image
              </label>
              
              {!imagePreview ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50/50 transition-all duration-200"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-dark-700 font-medium mb-1">Click to upload event image</p>
                  <p className="text-dark-400 text-sm">Supports: JPG, PNG, GIF (Max 10MB)</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative h-64 rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                id="eventImage"
                name="eventImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <div>
              <label htmlFor="description" className="input-label flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Description
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                placeholder="Describe your event..."
                className="input-field resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary py-4"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Event...
                  </span>
                ) : (
                  'Create Event'
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push('/marketplace')}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}