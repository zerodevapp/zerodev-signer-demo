"use client";

import { useEffect, useState, ReactNode } from 'react';
import { ZeroDevSignerProvider } from './ZeroDevSignerProvider';
import { ZeroDevSignerConfig } from '@zerodev/signer-core';

interface LayoutZeroDevSignerProviderProps {
  children: ReactNode;
}

const organizationId = process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID

export function LayoutZeroDevSignerProvider({ children }: LayoutZeroDevSignerProviderProps) {
  const [config, setConfig] = useState<ZeroDevSignerConfig | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const projectId = process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID;

    if (projectId) {
      setConfig({
        projectId,
        iframeElementId: "turnkey-auth-iframe-element-id",
        iframeUrl: "https://auth.turnkey.com",
        organizationId,
        proxyBaseUrl: process.env.NEXT_PUBLIC_KMS_PROXY_BASE_URL || "http://localhost:7082",
      });
    }
  }, []);

  // If we have config, wrap with ZeroDevSignerProvider
  if (config) {
    return (
      <ZeroDevSignerProvider config={config}>
        {children}
      </ZeroDevSignerProvider>
    );
  }

  // Otherwise just render children (setup page will work)
  return <>{children}</>;
}