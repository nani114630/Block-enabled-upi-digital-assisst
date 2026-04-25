# UPI Digital Asset System

A blockchain-based digital asset transparency platform with INR payment integration. Users can purchase digital assets using traditional payment methods (UPI, card, net banking) and receive NFT ownership on the Polygon blockchain — no cryptocurrency wallet required.

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-blue.svg)
![React](https://img.shields.io/badge/React-18+-blue.svg)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue.svg)

---

## Overview

This project implements a complete digital asset marketplace where:

- **Users pay in INR** using Razorpay (test mode) — familiar payment methods
- **NFTs are minted on Polygon** — immutable ownership proof
- **Ownership is transparent** — anyone can verify on PolygonScan

The system bridges traditional payments with blockchain technology, creating a seamless experience for non-crypto users while maintaining blockchain transparency.

---

## Features

### Core Features

| Feature | Description |
|---------|-------------|
| User Authentication | JWT-based auth with role management |
| Asset Marketplace | Browse, search, and filter digital assets |
| INR Payments | Test mode with Razorpay (card, UPI, net banking) |
| NFT Minting | Automatic minting after successful payment |
| Ownership Tracking | MongoDB + Polygon blockchain dual verification |
| Asset Upload (Admin) | Upload new digital assets to marketplace |
| Ownership History | Full history stored in smart contract |

### Technical Features

- RESTful API with Express.js
- React/Next.js frontend with Tailwind CSS
- MongoDB database with Mongoose ODM
- Polygon Mumbai testnet integration
- IPFS storage for metadata (Pinata)
- WebSocket support for real-time updates

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|----------|
| Next.js 14 | React framework |
| Tailwind CSS | Styling |
| Zustand | State management |
| Axios | API client |
| react-hot-toast | Notifications |

### Backend

| Technology | Purpose |
|------------|----------|
| Node.js | Runtime |
| Express.js | API framework |
| MongoDB | Database |
| Mongoose | ODM |
| JWT | Authentication |
| Razorpay SDK | Payment gateway |

### Blockchain

| Technology | Purpose |
|------------|----------|
| Solidity 0.8.20 | Smart contract |
| Hardhat | Development environment |
| Ethers.js | Blockchain interaction |
| Polygon Mumbai | Test network |
| IPFS (Pinata) | Decentralized storage |

### Infrastructure

| Service | Purpose |
|--------|----------|
| MongoDB Atlas | Database hosting |
| Vercel | Frontend deployment |
| Render | Backend deployment |
| Polygon | Blockchain |

---

## Project Structure

```
upi/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── config/       # Database & env config
│   │   ├── models/       # MongoDB schemas
│   │   ├── services/     # Business logic
│   │   ├── controllers/ # Request handlers
│   │   ├── routes/      # API routes
│   │   └── middleware/  # Auth & validation
│   └── package.json
│
├── frontend/              # Next.js application
│   ├── src/
│   │   ├── app/         # Pages & routing
│   │   ├── components/  # UI components
│   │   ├── lib/        # API client
│   │   └── store/      # State management
│   └── package.json
│
├── contracts/            # Solidity smart contracts
│   ├── contracts/
│   │   └── AssetNFT.sol
│   ├── scripts/
│   │   └── deploy-mumbai.ts
│   └── package.json
│
├── docker-compose.yml    # MongoDB container
├── README.md
└── DEPLOYMENT.md
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (optional, for local MongoDB)
- Git

### Local Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd upi

# 2. Start MongoDB
docker-compose up -d

# 3. Install and run backend
cd backend
npm install
cp .env.example .env
# Configure .env with your values
npm run dev

# 4. Install and run frontend (new terminal)
cd ../frontend
npm install
cp .env.example .env.local
npm run dev

# 5. Deploy smart contract (optional, for testing)
cd ../contracts
npm install
cp .env.example .env
npm run deploy:mumbai
```

### Access Points

| Service | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| Health Check | http://localhost:5000/api/health |

---

## Payment Flow (Test Mode)

This is the core innovation — users pay with familiar methods, receive blockchain ownership.

```
┌─────────────────────────────────────────────────────────────────┐
│                 USER PURCHASE FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                          │
│  1. USER                                                │
│     Browse marketplace                                   │
│     └─► Select asset                                    │
│                                                          │
│  2. BACKEND                                            │
│     Create order (INR amount)                           │
│     Generate Razorpay order                           │
│                                                          │
│  3. FRONTEND                                           │
│     Open Razorpay payment popup                        │
│     └─► User enters test card                         │
│                                                          │
│  4. RAZORPAY (Test Mode)                              │
│     Accepts: 4111 1111 1111 1111                      │
│     Expiry: Any future date                          │
│     CVV: Any 3 digits                               │
│                                                          │
│  5. BACKEND                                           │
│     Receive webhook: payment.captured                 │
│     Verify payment                                   │
│     └─► Mint NFT on Polygon                           │
│                                                          │
│  6. FRONTEND                                          │
│     Display "My NFTs" with ownership                 │
│     └─► Link to PolygonScan                           │
│                                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Test Payment Details

| Field | Test Value |
|-------|------------|
| Card Number | 4111 1111 1111 1111 |
| Expiry | Any future (MM/YY) |
| CVV | Any 3 digits |
| OTP | Any 6 digits |

No real money is charged in test mode.

---

## Blockchain Integration

### Smart Contract (AssetNFT.sol)

The smart contract is deployed on Polygon Mumbai testnet:

```solidity
contract AssetNFT is ERC721, ERC721URIStorage, Ownable {
    function mintAsset(address to, string metadataURI) public onlyOwner returns (uint256)
    function ownerOf(uint256 tokenId) public view returns (address)
    function tokenURI(uint256 tokenId) public view returns (string)
}
```

### Why Polygon?

| Benefit | Description |
|---------|-------------|
| Low Fees | ~$0.001 per transaction |
| Fast | ~2 second confirmations |
| EVM Compatible | Works with Ethereum tools |
| Secure | Proof of Stake consensus |

### Verifying Ownership

Users can verify ownership on PolygonScan:

```
https://mumbai.polygonscan.com/token/<CONTRACT_ADDRESS>?a=<TOKEN_ID>
```

This provides complete transparency — ownership is publicly verifiable.

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login, get JWT |
| GET | /api/auth/profile | Get current user |

### Assets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/assets | List assets |
| GET | /api/assets/:id | Get asset details |
| POST | /api/assets | Create asset (admin) |
| PUT | /api/assets/:id | Update asset (admin) |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/orders | Create order |
| POST | /api/orders/initiate-payment | Get payment link |
| GET | /api/orders/user | Get user's orders |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/payments/verify-mint | Verify & mint NFT |
| POST | /api/webhooks/razorpay | Payment webhook |

### NFTs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/nfts/user | Get user's NFTs |
| GET | /api/nfts/:tokenId | Get NFT details |
| GET | /api/nfts/:tokenId/verify | Verify ownership |

---

## Database Schema

### Collections

| Collection | Purpose |
|------------|----------|
| users | User accounts |
| assets | Digital assets in marketplace |
| nfts | Minted NFT records |
| orders | Purchase orders |
| transactions | Transaction history |

### Relationships

```
User ← Order ← NFT
       ↓
     Asset
```

---

## Environment Variables

### Backend

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/upi
JWT_SECRET=<32-character-secret>
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
CONTRACT_ADDRESS=0x...
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
FRONTEND_URL=http://localhost:3000
```

### Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

### Contracts

```env
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=0x...
POLYGONSCAN_API_KEY=xxx
```

---

## Deployment

### Production Stack

| Service | Platform | Free Tier |
|--------|----------|----------|
| Frontend | Vercel | ✓ |
| Backend | Render | ✓ |
| Database | MongoDB Atlas | ✓ (M0 cluster) |
| Blockchain | Polygon Mumbai | ✓ |

### See Also

- [DEPLOYMENT.md](DEPLOYMENT.md) - Full deployment guide
- [docs/database-schema.md](docs/database-schema.md) - Database schema

---

## How It Works — End to End

```
1. ADMIN uploads asset to marketplace
       ↓
2. USER registers and gets JWT token
       ↓
3. USER browses marketplace, selects asset
       → Backend creates order with INR price
       ↓
4. USER clicks "Buy Now"
       → Backend initiates Razorpay order
       → Frontend opens payment popup
       ↓
5. USER enters test card (4111 1111 1111 1111)
       → Razorpay processes payment
       → Webhook notifies backend
       ↓
6. BACKEND verifies payment
       → If successful: Calls contract.mintAsset()
       ��� NFT minted on Polygon
       → Stores ownership in MongoDB
       ↓
7. USER views purchased NFT in "My NFTs"
       → Can verify on PolygonScan
```

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Contributing

Contributions welcome! Please open an issue or submit a PR.

---

## Support

- Open an issue for bugs
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help
- Review API endpoints in source code

---

Built with ❤️ using open source technologies