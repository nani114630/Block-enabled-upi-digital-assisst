'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { useAuthStore } from '@/store/auth';
import { ArrowRight, Sparkles, Shield, Zap, Ticket, Globe, Users, Bitcoin, Layers, Code, Lock } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore();
  
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-dark-900">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary-500/30 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-500/25 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[150px]"></div>
          </div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
          
          <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full mb-8 animate-fade-in-up">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-sm text-gray-300 font-medium">Powered by Polygon Blockchain</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Discover{' '}
              <span className="gradient-text bg-gradient-to-r from-primary-400 via-accent-400 to-purple-400">Exclusive Events</span>
              <br />
              <span className="text-white">as NFTs</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Buy and own verified event tickets as digital collectibles • Secure UPI payments • Stored forever on blockchain
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              {!isAuthenticated && (
                <>
                  <Link href="/signup" className="group relative px-8 py-4 bg-white text-dark-900 rounded-full font-semibold text-lg overflow-hidden">
                    <span className="relative z-10 flex items-center gap-2">
                      Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-accent-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </Link>
                  <Link href="/login" className="px-8 py-4 border border-white/20 rounded-full font-semibold text-lg text-white hover:bg-white/10 transition-all">
                    Login
                  </Link>
                </>
              )}
              <Link href="/marketplace" className="px-8 py-4 border border-white/20 rounded-full font-semibold text-lg text-white hover:bg-white/10 transition-all">
                Browse Marketplace
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-20 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="text-center">
                <p className="text-4xl font-bold text-white">10K+</p>
                <p className="text-gray-500 text-sm mt-1">NFT Tickets</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-white">500+</p>
                <p className="text-gray-500 text-sm mt-1">Events</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-white">50K+</p>
                <p className="text-gray-500 text-sm mt-1">Users</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-32 bg-dark-900 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <span className="text-accent-400 font-medium mb-4 block">HOW IT WORKS</span>
              <h2 className="text-5xl font-bold text-white">Three Simple Steps</h2>
              <p className="text-gray-400 text-lg mt-4">Own your favorite event tickets as digital assets</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Ticket, title: 'Browse Events', desc: 'Explore curated events and find unique experiences', color: 'from-primary-500 to-primary-700' },
                { icon: Zap, title: 'Pay with UPI', desc: 'Secure checkout using UPI, cards, or net banking', color: 'from-accent-500 to-accent-700' },
                { icon: Shield, title: 'Own Your NFT', desc: 'Receive verified NFT ownership on Polygon blockchain', color: 'from-green-500 to-green-700' }
              ].map((step, i) => (
                <div key={i} className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary-500/50 transition-all duration-300">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg`}>
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute top-4 right-4 text-6xl font-bold text-white/5">{i + 1}</div>
                  <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features for Organizers */}
        <section className="py-32 bg-dark-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-accent-400 font-medium mb-4 block">FOR ORGANIZERS</span>
                <h2 className="text-5xl font-bold text-white mb-6">
                  Create & Sell <span className="gradient-text">NFT Tickets</span>
                </h2>
                <p className="text-gray-400 text-lg mb-8">
                  Reach more attendees, prevent counterfeits, and unlock new revenue streams with blockchainverified tickets.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    { icon: Globe, text: 'Instant global reach' },
                    { icon: Lock, text: 'Secure ticket verification' },
                    { icon: Layers, text: 'Automated royalties on resale' },
                    { icon: Bitcoin, text: 'Instant INR payments via UPI' }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-primary-400" />
                      </div>
                      <span className="text-white">{item.text}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full font-semibold hover:shadow-glow transition-shadow">
                  Start Creating Events <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              
              <div className="relative">
                <div className="absolute -inset-8 bg-gradient-to-r from-primary-500/20 via-accent-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
                <div className="relative bg-dark-700/50 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                  <div className="space-y-6">
                    {[
                      { title: 'Global Audience', desc: 'Reach attendees worldwide', icon: Globe },
                      { title: 'Blockchain Verified', desc: '100% authentic tickets', icon: Shield },
                      { title: 'Instant Payments', desc: 'Get paid via UPI', icon: Zap },
                      { title: 'Real-time Analytics', desc: 'Track sales live', icon: Code }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                        <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                          <item.icon className="w-6 h-6 text-primary-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{item.title}</p>
                          <p className="text-sm text-gray-400">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 bg-dark-900 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/20 rounded-full blur-[100px]"></div>
          </div>
          
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-gray-400 text-xl mb-10">
              Join thousands of users buying and selling event tickets as NFTs
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/signup" className="px-8 py-4 bg-white text-dark-900 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors">
                Create Account
              </Link>
              <Link href="/marketplace" className="px-8 py-4 border border-white/20 text-white rounded-full font-semibold text-lg hover:bg-white/10 transition-colors">
                Explore Marketplace
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 bg-dark-800 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-gray-500">© 2025 Event NFT. Powered by Polygon Blockchain.</p>
          </div>
        </footer>
      </main>
    </>
  );
}