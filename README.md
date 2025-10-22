# ZeroDev Wallet Demo

## Prerequisites

- [Node.js](https://nodejs.org) v18+
- [pnpm](https://pnpm.io/)

For gasless transactions (EIP-7702), you'll also need a [ZeroDev](https://dashboard.zerodev.app) account to get a bundler RPC URL.

## Installation

1. Clone the repository and install dependencies:

```bash
pnpm install
```

## Environment Configuration

1. Copy the environment example file:

```bash
cd packages/doorway
cp .env.example .env
```

2. Edit `.env` and fill in the required credentials:

```
NEXT_PUBLIC_SEPOLIA_RPC_URL=
NEXT_PUBLIC_ZERODEV_PROJECT_ID=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

## Running the Application

1. Start the development server:

```bash
cd packages/doorway
pnpm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser
