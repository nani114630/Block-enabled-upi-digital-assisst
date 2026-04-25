'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Calendar, QrCode, Users, Ticket, Store, Plus, Scan, Wallet, DollarSign } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!mounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isOrganizer = user.role === 'organizer' || user.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-primary-500/20 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-accent-500/20 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="text-center mb-12">
            <div className="w-32 h-32 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary-500/30">
              {isOrganizer ? (
                <Plus className="h-16 w-16 text-white" />
              ) : (
                <Ticket className="h-16 w-16 text-white" />
              )}
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Welcome, <span className="gradient-text">{user.name?.split(' ')[0]}</span>!
            </h1>
            
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
              <div className={`w-3 h-3 rounded-full ${isOrganizer ? 'bg-green-400' : 'bg-primary-400'} animate-pulse`}></div>
              <span className="text-lg font-medium">{isOrganizer ? 'Organizer' : 'Attendee'}</span>
            </div>
          </div>

          <div className="w-full max-w-lg">
            {isOrganizer ? (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => router.push('/create-event')}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">Create Event</h3>
                  <p className="text-sm text-gray-400">List new events</p>
                </button>
                
                <button
                  onClick={() => router.push('/organizer')}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Scan className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">Scan Tickets</h3>
                  <p className="text-sm text-gray-400">Verify attendees</p>
                </button>

                <button
                  onClick={() => router.push('/organizer')}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <DollarSign className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">Revenue</h3>
                  <p className="text-sm text-gray-400">Track earnings</p>
                </button>

                <button
                  onClick={() => router.push('/organizer')}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">Attendees</h3>
                  <p className="text-sm text-gray-400">View guests</p>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => router.push('/marketplace')}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Store className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">Marketplace</h3>
                  <p className="text-sm text-gray-400">Browse events</p>
                </button>
                
                <button
                  onClick={() => router.push('/my-tickets')}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Ticket className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">My Tickets</h3>
                  <p className="text-sm text-gray-400">View NFT tickets</p>
                </button>

                <button
                  onClick={() => router.push('/marketplace')}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Calendar className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">Events</h3>
                  <p className="text-sm text-gray-400">Find activities</p>
                </button>

                <button
                  onClick={() => router.push('/my-tickets')}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <QrCode className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">NFTs</h3>
                  <p className="text-sm text-gray-400">Your collection</p>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-white/10">
          <button
            onClick={() => router.back()}
            className="block w-full text-center text-gray-400 hover:text-white py-3 transition-colors"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
}