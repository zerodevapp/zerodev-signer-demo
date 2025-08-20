"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  createDoorway,
  type DoorwaySDK,
  type DoorwayConfig,
} from "@doorway/core";


interface DoorwayContextType {
  doorway: DoorwaySDK | null;
  isLoading: boolean;
  error: string | null;
}

const DoorwayContext = createContext<DoorwayContextType>({
  doorway: null,
  isLoading: false,
  error: null,
});

interface DoorwayProviderProps {
  children: ReactNode;
  config: Omit<DoorwayConfig, "iframeContainer">; // We'll handle iframe container internally
}

export function DoorwayProvider({ children, config }: DoorwayProviderProps) {
  const initRef = useRef<boolean>(false);
  const [doorway, setDoorway] = useState<DoorwaySDK | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fixed iframe container and element IDs
  const iframeContainerId = "turnkey-auth-iframe-container-id";
  const iframeElementId = "turnkey-auth-iframe-element-id";

  useEffect(() => {
    // Don't initialize if already started
    if (initRef.current) return;
    initRef.current = true;

    async function initializeDoorway() {
      try {
        setIsLoading(true);
        setError(null);

        await new Promise((resolve) => setTimeout(resolve, 100));

        const iframeContainer = document.getElementById(iframeContainerId);
        if (!iframeContainer) {
          throw new Error(`Iframe container not found`);
        }

        console.log("Creating new Doorway SDK instance");
        const sdk = await createDoorway({
          ...config,
          iframeContainer,
          iframeElementId,
        });

        setDoorway(sdk);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize");
      } finally {
        setIsLoading(false);
      }
    }

    initializeDoorway();
  }, []);

  return (
    <DoorwayContext.Provider value={{ doorway, isLoading, error }}>
      {/* Pre-create the iframe container - this prevents the re-initialization error */}
      <div
        id={iframeContainerId}
        style={{
          display: "none",
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          width: "1px",
          height: "1px",
          pointerEvents: "none",
        }}
      />
      {children}
    </DoorwayContext.Provider>
  );
}

export const useDoorwayContext = () => {
  const context = useContext(DoorwayContext);

  if (context === undefined) {
    throw new Error("useDoorwayContext must be used within a DoorwayProvider");
  }

  return context;
};
