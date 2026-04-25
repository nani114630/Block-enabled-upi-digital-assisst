# MongoDB Database Schema - UPI Digital Asset System

## Overview

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE: upi                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌────────────┐  ┌────────┐  ┌─────────┐  ┌──────────┐  ┌────────────┐  │
│  │  users    │  │ assets │  │  nfts   │  │ orders  │  │transactions│ │
│  └────┬─────┘  └───┬────┘  └────┬───┘  └────┬─────┘  └─────┬──────┘  │
│       │            │           │        │          │             │          │
│       │            │           │        │          │             │          │
│       ▼            ▼           ▼        ▼          ▼             ▼          │
│  Relationships:                                                  │
│  • users → orders (one-to-many)                                    │
│  • users → nfts (one-to-many)                                  │
│  • assets → nfts (one-to-many)                                 │
│  • orders → assets (many-to-one)                               │
│  • orders → transactions (one-to-many)                        │
│  • nfts → assets (many-to-one)                              │
│  • nfts → users (many-to-one)                              │
│                                                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Users Collection

### Schema

```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  passwordHash: String,
  name: String,
  walletAddress: String (unique, sparse, indexed),
  role: Enum ["user", "admin"],
  profile: {
    avatar: String,
    phone: String,
    createdAt: Date
  },
  preferences: {
    notifications: Boolean,
    newsletter: Boolean
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```javascript
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ walletAddress: 1 }, { unique: true, sparse: true })
db.users.createIndex({ createdAt: -1 })
```

### Example Document

```javascript
{
  "_id": ObjectId("64f1234567890abcdef123456"),
  "email": "john@example.com",
  "passwordHash": "$2b$12$xyz...",
  "name": "John Doe",
  "walletAddress": "0x1234abcd...5678",
  "role": "user",
  "profile": {
    "avatar": "https://gateway.pinata.cloud/ipfs/QmAvatar",
    "phone": "+919999999999",
    "createdAt": ISODate("2024-01-15T10:30:00Z")
  },
  "preferences": {
    "notifications": true,
    "newsletter": false
  },
  "isActive": true,
  "createdAt": ISODate("2024-01-15T10:30:00Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00Z")
}
```

---

## 2. Assets Collection

### Schema

```javascript
{
  _id: ObjectId,
  name: String,
  slug: String (unique, indexed),
  description: String,
  priceInINR: Number,
  originalPriceInINR: Number,
  category: String (indexed),
  tags: [String],
  creator: {
    name: String,
    walletAddress: String,
    royaltyPercent: Number
  },
  media: {
    ipfsHash: String,
    imageUrl: String,
    previewUrl: String,
    mimeType: String,
    fileSize: Number
  },
  metadata: {
    ipfsHash: String,
    jsonUrl: String
  },
  status: Enum ["draft", "active", "sold", "hidden"] (indexed),
  maxSupply: Number,
  currentSupply: Number,
  viewCount: Number,
  likeCount: Number,
  isFeatured: Boolean,
  expiresAt: Date,
  createdBy: ObjectId (ref: users),
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```javascript
db.assets.createIndex({ slug: 1 }, { unique: true })
db.assets.createIndex({ name: "text", description: "text" })
db.assets.createIndex({ category: 1 })
db.assets.createIndex({ status: 1, createdAt: -1 })
db.assets.createIndex({ priceInINR: 1 })
db.assets.createIndex({ isFeatured: 1, status: 1 })
```

### Example Document

```javascript
{
  "_id": ObjectId("64f1234567890abcdef123457"),
  "name": "Abstract Dreams #1",
  "slug": "abstract-dreams-1",
  "description": "A beautiful abstract digital artwork",
  "priceInINR": 500,
  "originalPriceInINR": 750,
  "category": "digital-art",
  "tags": ["abstract", "colorful", "modern"],
  "creator": {
    "name": "Artist Name",
    "walletAddress": "0xabcd...1234",
    "royaltyPercent": 10
  },
  "media": {
    "ipfsHash": "QmArt123...",
    "imageUrl": "https://gateway.pinata.cloud/ipfs/QmArt123",
    "mimeType": "image/png",
    "fileSize": 2048576
  },
  "metadata": {
    "ipfsHash": "QmMeta123...",
    "jsonUrl": "https://gateway.pinata.cloud/ipfs/QmMeta123"
  },
  "status": "active",
  "maxSupply": 1,
  "currentSupply": 0,
  "viewCount": 150,
  "likeCount": 25,
  "isFeatured": true,
  "createdBy": ObjectId("64f1234567890abcdef123456"),
  "createdAt": ISODate("2024-01-15T10:30:00Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00Z")
}
```

---

## 3. NFTs Collection

### Schema

```javascript
{
  _id: ObjectId,
  tokenId: Number (unique, indexed),
  tokenUri: String,
  assetId: ObjectId (ref: assets, indexed),
  contractAddress: String (indexed),
  creatorUserId: ObjectId (ref: users),
  ownerUserId: ObjectId (ref: users, indexed),
  ownerWalletAddress: String (indexed),
  purchaseOrderId: ObjectId (ref: orders),
  paymentId: String,
  ipfsMetadataHash: String,
  blockchain: {
    transactionHash: String,
    blockNumber: Number,
    blockTimestamp: Date
  },
  ownershipHistory: [{
    userId: ObjectId,
    walletAddress: String,
    acquiredAt: Date,
    transactionHash: String
  }],
  mintedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```javascript
db.nfts.createIndex({ tokenId: 1 }, { unique: true })
db.nfts.createIndex({ ownerUserId: 1, createdAt: -1 })
db.nfts.createIndex({ assetId: 1 })
db.nfts.createIndex({ contractAddress: 1 })
db.nfts.createIndex({ ownerWalletAddress: 1 })
```

### Example Document

```javascript
{
  "_id": ObjectId("64f1234567890abcdef123458"),
  "tokenId": 1,
  "tokenUri": "https://gateway.pinata.cloud/ipfs/QmNft123",
  "assetId": ObjectId("64f1234567890abcdef123457"),
  "contractAddress": "0xContractABC...",
  "creatorUserId": ObjectId("64f1234567890abcdef123456"),
  "ownerUserId": ObjectId("64f1234567890abcdef123456"),
  "ownerWalletAddress": "0xOwner123...",
  "purchaseOrderId": ObjectId("64f1234567890abcdef123459"),
  "paymentId": "pay_ABC123",
  "ipfsMetadataHash": "QmNft123...",
  "blockchain": {
    "transactionHash": "0xTx123...",
    "blockNumber": 12345678,
    "blockTimestamp": ISODate("2024-01-15T10:35:00Z")
  },
  "ownershipHistory": [
    {
      "userId": ObjectId("64f1234567890abcdef123456"),
      "walletAddress": "0xOwner123...",
      "acquiredAt": ISODate("2024-01-15T10:35:00Z"),
      "transactionHash": "0xTx123..."
    }
  ],
  "mintedAt": ISODate("2024-01-15T10:35:00Z"),
  "createdAt": ISODate("2024-01-15T10:35:00Z"),
  "updatedAt": ISODate("2024-01-15T10:35:00Z")
}
```

---

## 4. Orders Collection

### Schema

```javascript
{
  _id: ObjectId,
  orderNumber: String (unique),
  userId: ObjectId (ref: users, indexed),
  assetId: ObjectId (ref: assets),
  amount: Number (in paise),
  currency: String,
  status: Enum ["created", "initiated", "failed", "completed", "refunded", "cancelled"],
  paymentGateway: Enum ["razorpay", "cashfree"],
  paymentOrderId: String,
  paymentId: String,
  paymentLink: String,
  redirectUrl: String,
  attemptCount: Number,
  expiresAt: Date,
  paidAt: Date,
  failedAt: Date,
  refundedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```javascript
db.orders.createIndex({ orderNumber: 1 }, { unique: true })
db.orders.createIndex({ userId: 1, createdAt: -1 })
db.orders.createIndex({ status: 1 })
db.orders.createIndex({ paymentOrderId: 1 })
db.orders.createIndex({ paidAt: -1 })
```

### Example Document

```javascript
{
  "_id": ObjectId("64f1234567890abcdef123459"),
  "orderNumber": "ORD-1705314600-a1b2c3d4",
  "userId": ObjectId("64f1234567890abcdef123456"),
  "assetId": ObjectId("64f1234567890abcdef123457"),
  "amount": 50000,
  "currency": "INR",
  "status": "completed",
  "paymentGateway": "razorpay",
  "paymentOrderId": "order_ABC123",
  "paymentId": "pay_ABC123",
  "paymentLink": "https://razorpay.com/pay/ABC123",
  "redirectUrl": "http://localhost:3000/purchase/success",
  "attemptCount": 1,
  "expiresAt": ISODate("2024-01-15T11:00:00Z"),
  "paidAt": ISODate("2024-01-15T10:32:00Z"),
  "failedAt": null,
  "refundedAt": null,
  "createdAt": ISODate("2024-01-15T10:30:00Z"),
  "updatedAt": ISODate("2024-01-15T10:32:00Z")
}
```

---

## 5. Transactions Collection

### Schema

```javascript
{
  _id: ObjectId,
  transactionId: String (unique),
  type: Enum ["payment", "refund", "mint", "transfer"],
  orderId: ObjectId (ref: orders, indexed),
  nftId: ObjectId (ref: nfts, indexed),
  userId: ObjectId (ref: users, indexed),
  amount: Number,
  currency: String,
  gateway: String,
  gatewayTransactionId: String,
  blockchainTransactionHash: String,
  status: Enum ["pending", "success", "failed"],
  metadata: Mixed,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

```javascript
db.transactions.createIndex({ transactionId: 1 }, { unique: true })
db.transactions.createIndex({ userId: 1, createdAt: -1 })
db.transactions.createIndex({ orderId: 1 })
db.transactions.createIndex({ nftId: 1 })
db.transactions.createIndex({ status: 1, createdAt: -1 })
```

### Example Document

```javascript
{
  "_id": ObjectId("64f1234567890abcdef123460"),
  "transactionId": "txn_ABC123",
  "type": "payment",
  "orderId": ObjectId("64f1234567890abcdef123459"),
  "nftId": ObjectId("64f1234567890abcdef123458"),
  "userId": ObjectId("64f1234567890abcdef123456"),
  "amount": 50000,
  "currency": "INR",
  "gateway": "razorpay",
  "gatewayTransactionId": "pay_ABC123",
  "blockchainTransactionHash": "0xTx123...",
  "status": "success",
  "metadata": {
    "assetId": "64f1234567890abcdef123457",
    "paymentMethod": "card"
  },
  "createdAt": ISODate("2024-01-15T10:32:00Z"),
  "updatedAt": ISODate("2024-01-15T10:35:00Z")
}
```

---

## Relationships Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RELATIONSHIPS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  USERS                                                               │
│  ├── has many ORDERS (buyer)                                          │
│  ├── has many NFTS (owner)                                           │
│  └── can create ASSETS (admin)                                       │
│                                                                      │
│  ASSETS                                                              │
│  ├── has many NFTS                                                   │
│  ├── created by USERS (admin)                                        │
│  └── referenced in ORDERS                                           │
│                                                                      │
│  ORDERS                                                             │
│  ├── belongs to USERS (buyer)                                        │
│  ├── belongs to ASSETS                                             │
│  └── has many TRANSACTIONS                                          │
│                                                                      │
│  NFTS                                                               │
│  ├── belongs to ASSETS (what was purchased)                           │
│  ├── belongs to USERS (owner)                                      │
│  └── has ownership history                                         │
│                                                                      │
│  TRANSACTIONS                                                       │
│  ├── belongs to ORDERS                                              │
│  ├── belongs to NFTS                                                │
│  └── belongs to USERS                                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Complete Data Flow with Collection References

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. REGISTER                                                         │
│     User.create() → users                                              │
│     Returns: user._id                                                 │
│                                                                      │
│  2. UPLOAD ASSET (Admin)                                             │
│     Asset.create() → assets                                            │
│     Returns: asset._id                                                │
│                                                                      │
│  3. CREATE ORDER                                                    │
│     Order.create({ userId, assetId }) → orders                          │
│     Returns: order._id                                                 │
│     Links: orders.userId → users._id                                   │
│            orders.assetId → assets._id                                │
│                                                                      │
│  4. INITIATE PAYMENT                                                │
│     Update order with Razorpay order ID                                │
│     Returns: paymentLink                                             │
│                                                                      │
│  5. COMPLETE PAYMENT                                                │
│     Update order status: "completed"                                    │
│     Update: paidAt timestamp                                         │
│     Links: orders.paymentId                                          │
│                                                                      │
│  6. MINT NFT                                                        │
│     NFT.create({                                                     │
│       assetId: asset._id,                                           │
│       ownerUserId: user._id,                                         │
│       purchaseOrderId: order._id                                   │
│     }) → nfts                                                        │
│     Links: nfts.assetId → assets._id                                  │
│            nfts.ownerUserId → users._id                              │
│            nfts.purchaseOrderId → orders._id                         │
│                                                                      │
│  7. CREATE TRANSACTION RECORD                                        │
│     Transaction.create({                                              │
│       type: "payment",                                              │
│       orderId: order._id,                                          │
│       nftId: nft._id,                                              │
│       userId: user._id                                              │
│     }) → transactions                                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Mongoose Model Exports

```javascript
// backend/src/models/index.ts
export { User, IUser } from './User.js';
export { Asset, IAsset } from './Asset.js';
export { NFT, INFT } from './NFT.js';
export { Order, IOrder } from './Order.js';
export { Transaction, ITransaction } from './Transaction.js';
```

---

## Query Examples

```javascript
// Get user's orders with assets
db.orders.aggregate([
  { $match: { userId: ObjectId("...") } },
  { $lookup: { from: "assets", localField: "assetId", foreignField: "_id", as: "asset" } },
  { $unwind: "$asset" },
  { $sort: { createdAt: -1 } }
])

// Get user's NFTs with asset info
db.nfts.aggregate([
  { $match: { ownerUserId: ObjectId("...") } },
  { $lookup: { from: "assets", localField: "assetId", foreignField: "_id", as: "asset" } },
  { $unwind: "$asset" },
  { $sort: { mintedAt: -1 } }
])

// Dashboard stats
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
])
```

---

## Database Connection

```javascript
// backend/src/config/index.ts
export const config = {
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/upi',
  },
};

// backend/src/config/database.ts
import mongoose from 'mongoose';

export const connectDatabase = async () => {
  const uri = config.database.uri;
  await mongoose.connect(uri);
  console.log('MongoDB connected');
};
```

---

## Index Summary

| Collection   | Index Name                  | Fields                      | Unique |
|-------------|----------------------------|-----------------------------|--------|
| users       | idx_email                  | email                       | Yes    |
| users       | idx_wallet                 | walletAddress               | Yes    |
| users       | idx_created                 | createdAt                   | No     |
| assets      | idx_slug                    | slug                        | Yes    |
| assets      | idx_category                | category                    | No     |
| assets      | idx_status_created          | status, createdAt           | No     |
| assets      | idx_price                  | priceInINR                  | No     |
| nfts        | idx_tokenId                 | tokenId                     | Yes    |
| nfts        | idx_owner                  | ownerUserId, createdAt      | No     |
| nfts        | idx_contract               | contractAddress             | No     |
| orders      | idx_orderNumber            | orderNumber                 | Yes    |
| orders      | idx_user                   | userId, createdAt           | No     |
| orders      | idx_status                 | status                     | No     |
| transactions | idx_txnId                | transactionId              | Yes    |
| transactions | idx_user_txn             | userId, createdAt           | No     |