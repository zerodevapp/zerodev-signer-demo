'use client'

import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { zeroDevWallet } from '@zerodev/wallet-react'

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    zeroDevWallet({
      projectId: process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID!,
      organizationId: process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID,
      proxyBaseUrl: process.env.NEXT_PUBLIC_KMS_PROXY_BASE_URL,
      aaUrl: process.env.NEXT_PUBLIC_ZERODEV_RPC_URL!,
      chains: [sepolia],
      sessionWarningThreshold: 60 * 1000, // 890 seconds
      oauthConfig: {
        googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`,
        openInPage: false, // Use popup by default
      },
    })
  ],
  ssr: true,
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
  },
})
