"use client";

import { useEffect, useState, ReactNode } from 'react';
import { DoorwayProvider } from './DoorwayProvider';
import { DoorwayConfig } from '@doorway/core';

interface LayoutDoorwayProviderProps {
  children: ReactNode;
}

const organizationId = process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID

export function LayoutDoorwayProvider({ children }: LayoutDoorwayProviderProps) {
  const [config, setConfig] = useState<DoorwayConfig | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for new projectId first, fall back to appId for compatibility
    const projectId = localStorage.getItem("v2_current_project_id") ||
                     localStorage.getItem("v2_current_app_id");

    if (projectId) {
      setConfig({
        projectId,
        iframeElementId: "turnkey-auth-iframe-element-id",
        iframeUrl: "https://auth.turnkey.com",
        organizationId,
        proxyBaseUrl: process.env.NEXT_PUBLIC_TURNKEY_PROXY_BASE_URL || "http://localhost:7082",
      });
    }
  }, []);

  // If we have config, wrap with DoorwayProvider
  if (config) {
    return (
      <DoorwayProvider config={config}>
        {children}
      </DoorwayProvider>
    );
  }

  // Otherwise just render children (setup page will work)
  return <>{children}</>;
}