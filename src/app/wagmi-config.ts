'use client'

import { createConfig, http } from 'wagmi'
import { sepolia, baseSepolia } from 'wagmi/chains'
import { zeroDevWallet } from '@zerodev/wallet-react'

// RPC URLs per chain
const rpcUrls: Record<number, string | undefined> = {
  [sepolia.id]: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
  [baseSepolia.id]: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
}

export const config = createConfig({
  chains: [sepolia, baseSepolia],
  connectors: [
    zeroDevWallet({
      projectId: process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID!,
      proxyBaseUrl: process.env.NEXT_PUBLIC_KMS_PROXY_BASE_URL!,
      chains: [sepolia, baseSepolia],
    })
  ],
  ssr: true,
  transports: {
    [sepolia.id]: http(rpcUrls[sepolia.id]),
    [baseSepolia.id]: http(rpcUrls[baseSepolia.id]),
  },
})
