'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Header } from '@/components/Header';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { ExternalLink, Wallet, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NFT {
  _id: string;
  tokenId: number;
  tokenUri: string;
  assetId: {
    name: string;
    media: { imageUrl: string };
  };
  ownerUserId: {
    name: string;
  };
  mintedAt: string;
  blockchain: {
    transactionHash: string;
  };
}

export default function MyNFTsPage() {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user?.id) {
      fetchMyNFTs();
    }
  }, [user]);

  const fetchMyNFTs = async () => {
    try {
      const { data } = await api.get('/nfts/user');
      setNfts(data.data || []);
    } catch {
      toast.error('Failed to load NFTs');
    } finally {
      setLoading(false);
    }
  };

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
              <h1 className="text-3xl font-bold gradient-text">My Tickets</h1>
              <p className="text-dark-500 mt-1">View your owned NFT event tickets</p>
            </div>
          </div>
          {nfts.length > 0 && (
            <div className="badge-primary flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              {nfts.length} NFT{nfts.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

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
        ) : nfts.length === 0 ? (
          <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl">
            <div className="text-6xl mb-4">🎫</div>
            <h2 className="text-2xl font-bold text-dark-900 mb-2">No Tickets Yet</h2>
            <p className="text-dark-500 mb-6">You haven't purchased any event tickets yet</p>
            <Link href="/marketplace" className="btn-primary inline-flex items-center gap-2">
              Browse Marketplace
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {nfts.map((nft) => (
              <NFTCard key={nft._id} nft={nft} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function NFTCard({ nft }: { nft: NFT }) {
  const polygonScanUrl = `https://mumbai.polygonscan.com/token/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}?a=${nft.tokenId}`;

  return (
    <div className="card-elevated group">
      <div className="relative h-48 overflow-hidden">
        <Image
          src={nft.assetId?.media?.imageUrl || '/placeholder.jpg'}
          alt={nft.assetId?.name || 'NFT'}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3">
          <span className="badge-success">
            <Wallet className="w-3 h-3 mr-1" />
            Owned
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-lg mb-2 text-dark-900">
          {nft.assetId?.name || `NFT #${nft.tokenId}`}
        </h3>
        <div className="flex items-center gap-2 text-sm text-dark-500 mb-4">
          <Calendar className="w-4 h-4" />
          <span>Minted {new Date(nft.mintedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        <a
          href={polygonScanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View on PolygonScan
        </a>
      </div>
    </div>
  );
}