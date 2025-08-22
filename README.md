# Doorway Prototype

## Prerequisites

- [Node.js](https://nodejs.org) v18+
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com) & [Docker Compose](https://docs.docker.com/compose)

You will also need to have a [Turnkey](https://www.turnkey.com) account (which comes with an Organization Id) and a Turnkey API key (which comes with a public and private key pair). You'll need to add these to your `.env` later.

For gasless transactions (EIP-7702), you'll also need a [ZeroDev](https://dashboard.zerodev.app) account to get a bundler RPC URL.

## Installation

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Additionally link `@doorway/core` SDK in this project once you have built it and linked it from the SDK
```bash
pnpm link @doorway/core
```

## Environment Configuration

1. Copy the environment example file:

```bash
cd packages/doorway
cp .env.example .env
```

2. Edit `.env` and fill in the required credentials:

```
# Turnkey credentials (required)
NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID=your_org_id

# ZeroDev RPC URL (required for gasless transactions)
NEXT_PUBLIC_ZERODEV_RPC_URL=your_zerodev_rpc_url

# KMS Server URL
NEXT_PUBLIC_KMS_SERVER_URL=doorway-kms-server-url
```

## Running the Application

1. Start the development server:

```bash
cd packages/doorway
pnpm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser
