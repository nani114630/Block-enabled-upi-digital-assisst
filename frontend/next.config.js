const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'gateway.pinata.cloud' },
      { hostname: 'localhost' },
      { hostname: 'ipfs.io' },
      { hostname: 'images.unsplash.com' },
      { hostname: 'plus.unsplash.com' },
      { hostname: '**' },
    ],
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:5000/api/:path*' },
    ];
  },
};

module.exports = nextConfig;