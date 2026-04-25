'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { Wallet, LogOut, Plus, Store, User, Calendar, QrCode, Ticket, Trash2 } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';

  const getNavigation = () => {
    if (isOrganizer) return [{ name: 'Marketplace', href: '/marketplace', icon: Store }];
    return [
      { name: 'Marketplace', href: '/marketplace', icon: Store },
      { name: 'My Tickets', href: '/my-tickets', icon: Ticket },
    ];
  };

  const organizerNav = [
    { name: 'Dashboard', href: '/organizer', icon: QrCode },
    { name: 'Create Event', href: '/create-event', icon: Plus },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      if (confirm('This will permanently delete your account and all your data. Continue?')) {
        try {
          await api.delete('/auth/account');
          logout();
          router.push('/');
        } catch {
          logout();
          router.push('/');
        }
      }
    }
  };

  return (
    <header className="bg-dark-800/80 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:shadow-glow transition-shadow">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold gradient-text">UPI NFT</span>
            </Link>
            
            {isAuthenticated && (
              <div className="hidden md:flex items-center space-x-2">
                {getNavigation().map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        pathname === item.href
                          ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                          : 'text-gray-400 hover:bg-white/10 hover:text-white border border-transparent'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
                {isOrganizer && (
                  <>
                    <div className="w-px h-6 bg-white/20 mx-2"></div>
                    {organizerNav.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                            pathname === item.href
                              ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                              : 'text-gray-400 hover:bg-white/10 hover:text-white border border-transparent'
                          }`}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full cursor-pointer border border-white/10 transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-white">{user?.name}</p>
                    {isOrganizer && <p className="text-xs text-accent-400">Organizer</p>}
                  </div>
                </button>

                {showProfile && (
                  <div className="absolute right-0 mt-2 w-56 bg-dark-800/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 py-2">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="font-medium text-white">{user?.name}</p>
                      <p className="text-sm text-gray-400">{user?.email}</p>
                    </div>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-white/5 transition-all"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-3">
                <Link href="/login" className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium border border-white/10 transition-all">
                  Login
                </Link>
                <Link href="/signup" className="px-5 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium hover:shadow-glow transition-all">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}