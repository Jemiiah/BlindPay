# BlindPay

**Confidential payment protocol powered by Fully Homomorphic Encryption (FHE) on EVM**

BlindPay is a decentralized invoice and payment system that leverages Zama's fhEVM to enable confidential, verifiable transactions. Merchants can create invoices without revealing sensitive information on-chain, and payers can settle invoices while keeping amounts encrypted end-to-end.

## Features

- **Confidential Invoices** — Invoice amounts stored as FHE-encrypted values (euint64) on-chain
- **Encrypted Payments** — Transfers use TFHE ciphertexts; no plaintext amounts ever appear on-chain
- **Dual-Receipt System** — Atomic PayerReceipt + MerchantReceipt events for verifiable proof
- **Multi-Token Support** — ETH and USDC with full privacy guarantees
- **Three Invoice Types** — Standard (single-pay), Multi Pay (campaigns), Donation (open-ended)
- **Blind Database** — Off-chain metadata encrypted with AES-256; amounts/memos never stored
- **Mobile Lite** — Responsive mobile interface with QR scanning

## Tech Stack

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS + Framer Motion
- wagmi + viem (EVM wallet integration)
- WalletConnect / MetaMask

### Backend
- Node.js + Express
- Supabase (PostgreSQL)
- AES-256 encryption for merchant addresses

### Smart Contract (fhEVM)
- Solidity + Zama TFHE library
- Deployed on fhEVM-enabled testnet

## Getting Started

### Prerequisites
- Node.js 18+
- MetaMask or any EVM-compatible wallet
- Supabase project (for backend)

### Frontend Setup

```bash
cd frontend
cp .env.example .env    # Configure your environment variables
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
cp .env.example .env    # Configure Supabase + encryption key
npm install
npm run dev
```

### Environment Variables

**Frontend** (`.env`):
```
VITE_API_URL=http://localhost:3000
VITE_CONTRACT_ADDRESS=0x...
VITE_WALLETCONNECT_PROJECT_ID=your-project-id
VITE_EXPLORER_URL=https://sepolia.etherscan.io
```

**Backend** (`.env`):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
ENCRYPTION_KEY=your-64-char-hex-key
PORT=3000
```

## Architecture

```
BlindPay/
├── frontend/          # React + TypeScript + Vite
│   └── src/
│       ├── components/    # Shared UI components
│       ├── desktop/       # Desktop-specific pages & components
│       ├── mobile/        # Mobile-optimized pages & components
│       ├── hooks/         # useWallet, usePayment, useCreateInvoice
│       ├── utils/         # evm-utils (hashing, encoding)
│       └── pages/         # Profile page
├── backend/           # Node.js + Express API
│   ├── index.js           # API routes
│   └── encryption.js      # AES-256 encrypt/decrypt
└── contracts/         # Solidity fhEVM contracts (TBD)
```

## How It Works

1. **Merchant creates invoice** → Client computes `keccak256(merchant, amount, salt)` and stores encrypted amount on-chain via fhEVM
2. **Payer receives link** → Verifies hash, encrypts payment amount using fhEVM encryption scheme
3. **Payment executed** → Contract transfers FHE-encrypted amounts atomically, emitting dual receipt events
4. **Both parties get proof** → PayerReceipt and MerchantReceipt contain encrypted amounts only they can decrypt

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | List all invoices |
| GET | `/api/invoice/:hash` | Get single invoice |
| GET | `/api/invoices/merchant/:address` | Get merchant's invoices |
| POST | `/api/invoices` | Create invoice |
| PATCH | `/api/invoices/:hash` | Update invoice status |

## Built With

- [Zama fhEVM](https://docs.zama.ai/fhevm) — Fully Homomorphic Encryption on EVM
- [wagmi](https://wagmi.sh) — React hooks for EVM
- [viem](https://viem.sh) — TypeScript interface for EVM
- [Supabase](https://supabase.com) — Backend database
