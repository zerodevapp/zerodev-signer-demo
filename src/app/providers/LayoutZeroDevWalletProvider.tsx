"use client";

import { useEffect, useState, ReactNode } from 'react';
import { ZeroDevWalletProvider } from './ZeroDevWalletProvider';
import { ZeroDevWalletConfig } from '@zerodev/wallet-core';

interface LayoutZeroDevWalletProviderProps {
  children: ReactNode;
}

const organizationId = process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID

export function LayoutZeroDevWalletProvider({ children }: LayoutZeroDevWalletProviderProps) {
  const [config, setConfig] = useState<ZeroDevWalletConfig | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const projectId = process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID;

    if (projectId) {
      setConfig({
        projectId,
        // iframeElementId: "turnkey-auth-iframe-element-id",
        // iframeUrl: "https://auth.turnkey.com",
        organizationId,
        proxyBaseUrl: process.env.NEXT_PUBLIC_KMS_PROXY_BASE_URL || "http://localhost:7082",
      });
    }
  }, []);

  // If we have config, wrap with ZeroDevWalletProvider
  if (config) {
    return (
      <ZeroDevWalletProvider config={config}>
        {children}
      </ZeroDevWalletProvider>
    );
  }

  // Otherwise just render children (setup page will work)
  return <>{children}</>;
}