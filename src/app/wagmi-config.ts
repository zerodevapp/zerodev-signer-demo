'use client'

import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { zeroDevWallet } from '@zerodev/wallet-react'

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    zeroDevWallet({
      projectId: process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID!,
      aaUrl: process.env.NEXT_PUBLIC_ZERODEV_RPC_URL!,
      chains: [sepolia],
      oauthConfig: {
        googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')}`,
      },
    })
  ],
  ssr: true,
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
  },
})
