import dotenv from 'dotenv';
dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '5000'),
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/upi',
    user: process.env.MONGODB_USER,
    password: process.env.MONGODB_PASSWORD,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },

  cashfree: {
    clientId: process.env.CASHFREE_CLIENT_ID || '',
    clientSecret: process.env.CASHFREE_CLIENT_SECRET || '',
    environment: process.env.CASHFREE_ENVIRONMENT || 'sandbox',
  },

  polygon: {
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
    chainId: parseInt(process.env.POLYGON_CHAIN_ID || '80001'),
    scanUrl: process.env.POLYGONSCAN_URL || 'https://mumbai.polygonscan.com',
    scanApiKey: process.env.POLYGONSCAN_API_KEY || '',
  },

  contract: {
    address: process.env.CONTRACT_ADDRESS || '',
    ownerPrivateKey: process.env.CONTRACT_OWNER_PRIVATE_KEY || '',
  },

  ipfs: {
    apiKey: process.env.IPFS_API_KEY || '',
    apiSecret: process.env.IPFS_API_SECRET || '',
    gatewayUrl: process.env.IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/',
  },

  cors: {
    allowedOrigins: (process.env.FRONTEND_URL || 'http://localhost:3000').split(','),
  },

  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@upi.com',
    password: process.env.ADMIN_PASSWORD || 'admin123456',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
};