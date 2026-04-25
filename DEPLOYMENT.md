# Deployment Guide - UPI Digital Asset System

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────┐      ┌──────────────┐      ┌─────────────────────────┐ │
│   │   VERCEL    │ ───► │   RENDER     │ ──► │    POLYGON             │ │
│   │  (Frontend) │      │  (Backend)   │      │   (Blockchain)         │ │
│   │   port 80   │      │    port 80   │      │   Mumbai Testnet        │ │
│   └─────────────┘      └──────────────┘      └─────────────────────────┘ │
│        │                    │                          │                 │
│        │                    │                          │                 │
│        ▼                    ▼                          ▼                 │
│   ┌─────────────┐      ┌──────────────┐      ┌─────────────────────────┐ │
│   │   Users     │      │  MongoDB    │      │   Smart Contract       │ │
│   │  Browser    │      │   Atlas     │      │   (AssetNFT.sol)       │ │
│   └─────────────┘      └──────────────┘      └─────────────────────────┘ │
│                              │                                        │
│                              ▼                                        │
│                    ┌──────────────┐                                  │
│                    │   IPFS       │                                  │
│                    │  (Pinata)    │                                  │
│                    └──────────────┘                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Prerequisites

### Required Accounts

1. **Vercel** - https://vercel.com (Free tier)
2. **Render** - https://render.com (Free tier)
3. **MongoDB Atlas** - https://mongodb.com/atlas (Free tier)
4. **Polygon** - MetaMask wallet with MATIC
5. **Pinata** - https://app.pinata.cloud (Free tier)
6. **Razorpay** - https://dashboard.razorpay.com (Test mode)

### Order of Deployment

```
1. MongoDB Atlas (Database)
2. Smart Contract (Polygon Mumbai)
3. Backend (Render)
4. Frontend (Vercel)
```

---

## Phase 2: Database (MongoDB Atlas)

### Step 2.1: Create Account

1. Go to https://mongodb.com/atlas
2. Sign up with GitHub/Google
3. Select "Free" tier (M0)

### Step 2.2: Create Database

```
Cluster Name: upi-cluster
Create Cluster → Wait 2-3 minutes
```

### Step 2.3: Network Access

```
1. Network Access → Add IP Address
2. Select: "Allow Access from Anywhere" (0.0.0.0/0)
3. Save
```

### Step 2.4: Get Connection String

```
1. Database → Connect → Drivers
2. Copy connection string:
   mongodb+srv://<username>:<password>@upi-cluster.xxxx.mongodb.net/upi
```

### Step 2.5: Create Database User

```
Database Access → Add New User
Username: upi_user
Password: <strong-password>
```

---

## Phase 3: Smart Contract (Polygon Mumbai)

### Step 3.1: Get Test MATIC

```
1. Go to https://faucet.polygon.technology
2. Enter wallet address
3. Get 0.5 MATIC (testnet)
```

### Step 3.2: Export Private Key

```
MetaMask → Account Details → Export Private Key
WARNING: Never share this!
```

### Step 3.3: Update Contract Environment

Create `contracts/.env`:

```bash
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=0x<your-private-key>
POLYGONSCAN_API_KEY=<from-polygonscan>

# Optional - Get free API key:
# 1. Go to https://polygonscan.com
# 2. Sign in → API Keys → New API Key
```

### Step 3.4: Deploy Contract

```bash
cd contracts
npm install
npm run deploy:mumbai
```

### Step 3.5: Copy Deployment Output

```
Contract Address: 0xABCD... (COPY THIS!)
Save to: backend/.env CONTRACT_ADDRESS
```

---

## Phase 4: Backend (Render)

### Step 4.1: Create Account

1. Go to https://render.com
2. Sign up with GitHub

### Step 4.2: Create Web Service

```
1. Dashboard → New → Web Service
2. Connect GitHub repository
3. Select repository
4. Settings:
   Name: upi-backend
   Root Directory: backend
   Build Command: npm install && npm run build
   Start Command: node dist/index.js
   Environment: Node
   Runtime: Node 18
```

### Step 4.3: Configure Environment Variables

In Render Dashboard → Environment:

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://<username>:<password>@upi-cluster.xxxx.mongodb.net/upi
JWT_SECRET=<generate-32-char-random-string>
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
POLYGON_CHAIN_ID=80001
CONTRACT_ADDRESS=0x<from-contract-deployment>
CONTRACT_OWNER_PRIVATE_KEY=0x<your-private-key>
IPFS_API_KEY=<from-pinata>
IPFS_API_SECRET=<from-pinata>
IPFS_GATEWAY_URL=https://gateway.pinata.cloud/ipfs/
FRONTEND_URL=https://your-app.vercel.app
```

### Step 4.4: Deploy

```
1. Click "Create Web Service"
2. Wait for build to complete
3. Note: Backend URL (e.g., https://upi-backend.onrender.com)
```

---

## Phase 5: Frontend (Vercel)

### Step 5.1: Create Account

1. Go to https://vercel.com
2. Sign up with GitHub

### Step 5.2: Import Project

```
1. Import GitHub Repository
2. Select repository
3. Framework Preset: Next.js
```

### Step 5.3: Configure Environment Variables

In Vercel Dashboard → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://upi-backend.onrender.com/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
NEXT_PUBLIC_CONTRACT_ADDRESS=0x<from-contract-deployment>
NEXT_PUBLIC_POLYGON_CHAIN_ID=80001
```

### Step 5.4: Deploy

```
1. Click "Deploy"
2. Wait for deployment
3. Note: Frontend URL (e.g., https://upi-frontend.vercel.app)
```

### Step 5.5: Update Backend Environment

Add to Render environment variables:

```
FRONTEND_URL=https://upi-frontend.vercel.app
```

---

## Phase 6: External Service Configuration

### Step 6.1: Razorpay Configuration

1. Go to https://dashboard.razorpay.com/app/settings
2. Enable Test Mode
3. Webhooks → Add webhook:

```
URL: https://upi-backend.onrender.com/api/webhooks/razorpay
Events:
- payment.captured
- payment.failed
- order.paid
- refund.created

Secret: <from-RAZORPAY_WEBHOOK_SECRET>
```

### Step 6.2: Pinata Configuration

1. Go to https://app.pinata.cloud/developers
2. Copy API Key and Secret
3. Add to Render environment variables

### Step 6.3: PolygonScan Verification

```
1. Go to https://mumbai.polygonscan.com
2. Verify Contract Address above
3. Contract → Code → Verify
```

---

## Phase 7: Testing & Validation

### Health Checks

| Service | URL | Expected |
|--------|-----|----------|
| Backend Health | `https://upi-backend.onrender.com/api/health` | `{"status":"success"}` |
| Frontend | `https://upi-frontend.vercel.app` | Login page loads |
| MongoDB | Atlas Dashboard | Database visible |

### Integration Test Flow

```
1. Open frontend URL
2. Register new user
3. (For admin): Update MongoDB user role to "admin"
4. Login as admin → Upload test asset
5. Logout → Login as normal user
6. Go to marketplace → Buy asset
7. Use test card: 4111 1111 1111 1111
8. Check My NFTs page
9. Verify on PolygonScan
```

---

## Environment Variables Summary

### Backend (.env on Render)

```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=<32-char-random>
JWT_EXPIRES_IN=7d

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx

# Polygon
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
POLYGON_CHAIN_ID=80001
CONTRACT_ADDRESS=0x...
CONTRACT_OWNER_PRIVATE_KEY=0x...

# IPFS
IPFS_API_KEY=xxx
IPFS_API_SECRET=xxx
IPFS_GATEWAY_URL=https://gateway.pinata.cloud/ipfs/

# Frontend URL
FRONTEND_URL=https://...vercel.app
```

### Frontend (.env on Vercel)

```env
NEXT_PUBLIC_API_URL=https://...onrender.com/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_POLYGON_CHAIN_ID=80001
```

### Contracts (.env)

```env
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=0x...
POLYGONSCAN_API_KEY=xxx
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|------|----------|
| 502 Bad Gateway | Check backend is running on Render |
| CORS errors | Verify FRONTEND_URL in backend env |
| MongoDB connection | Check connection string format |
| Payment fails | Verify Razorpay keys in test mode |
| NFT not minting | Check CONTRACT_ADDRESS is correct |
| IPFS upload fails | Verify Pinata API keys |

### Rollback Commands

```bash
# Backend redeploy
git push origin main  # Trigger redeploy

# Frontend redeploy
git push origin main  # Trigger redeploy
```

---

## Production Checklist

- [ ] MongoDB Atlas - Database created
- [ ] Polygon Mumbai - Contract deployed
- [ ] Render - Backend deployed
- [ ] Vercel - Frontend deployed
- [ ] Razorpay - Webhooks configured
- [ ] Test user registration
- [ ] Test payment flow
- [ ] Test NFT minting
- [ ] Test ownership display