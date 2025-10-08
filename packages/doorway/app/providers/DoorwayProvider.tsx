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
  type DoorwaySession,
  normalizeTimestamp,
} from "@doorway/core";
import {
  type TimerMap,
  clearAll,
  setCappedTimeoutInMap,
  clearKey,
} from "../lib/timers";

// For testing: set threshold so high that refresh fires almost immediately
// Session expires in ~900s (15 min), threshold is 890s, so warning fires after 10s
// Production: should be 60000 (1 minute before expiry)
const SESSION_WARNING_THRESHOLD_MS = 60 * 1000; // Very high for testing - fires ~10s after auth
const AUTO_REFRESH_ENABLED = true; // Hardcoded for now, will be config later

interface DoorwayContextType {
  doorway: DoorwaySDK | null;
  isLoading: boolean;
  error: string | null;
  sessionExpiring: boolean;
  timeRemaining: number;
  scheduleSessionExpiration: ((session: DoorwaySession) => Promise<void>) | null;
  clearAllTimers: (() => void) | null;
}

const DoorwayContext = createContext<DoorwayContextType>({
  doorway: null,
  isLoading: false,
  error: null,
  sessionExpiring: false,
  timeRemaining: 0,
  scheduleSessionExpiration: null,
  clearAllTimers: null,
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
  const [sessionExpiring, setSessionExpiring] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Timer management
  const expiryTimersRef = useRef<TimerMap>({});

  // Fixed iframe container and element IDs
  const iframeContainerId = "turnkey-auth-iframe-container-id";
  const iframeElementId = "turnkey-auth-iframe-element-id";

  // Schedule session expiration timers
  const scheduleSessionExpirationRef = useRef<((session: DoorwaySession) => Promise<void>) | null>(null);

  // Internal function that takes sdk directly (avoids race condition)
  const scheduleSessionExpirationForSdk = async (sdk: DoorwaySDK, session: DoorwaySession) => {
    console.log("scheduleSessionExpiration", session);

    if (!sdk) {
      console.error("SDK not provided to scheduleSessionExpirationForSdk");
      return;
    }

    const expiryMs = normalizeTimestamp(session.expiry);
    const now = Date.now();
    const timeUntilExpiry = expiryMs - now;

    if (timeUntilExpiry <= 0) {
      console.log('Session already expired');
      return;
    }

    console.log(`Scheduling session expiration for ${session.id}:`, {
      expiryMs,
      timeUntilExpiry: `${Math.floor(timeUntilExpiry / 1000)}s`,
      warnAt: `${Math.floor((expiryMs - SESSION_WARNING_THRESHOLD_MS - now) / 1000)}s`
    });

    // Clear existing timers for this session
    clearKey(expiryTimersRef.current, session.id);
    clearKey(expiryTimersRef.current, `${session.id}-warning`);

    // Warning callback - fires 60s before expiry
    const beforeExpiry = async () => {
      console.log('Session expiring soon, auto-refresh starting...');
      setSessionExpiring(true);
      setTimeRemaining(SESSION_WARNING_THRESHOLD_MS);

      // Start countdown
      const countdownInterval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1000;
          if (newTime <= 0) {
            clearInterval(countdownInterval);
            return 0;
          }
          return newTime;
        });
      }, 1000);

      // AUTO-REFRESH if enabled
      if (AUTO_REFRESH_ENABLED) {
        try {
          const newSession = await sdk.refreshSession(session.id);
          console.log('Session auto-refreshed successfully:', newSession);
          clearInterval(countdownInterval);
          setSessionExpiring(false);
          setTimeRemaining(0);
          // Re-schedule for new session
          if (newSession) {
            scheduleSessionExpirationForSdk(sdk, newSession);
          }
        } catch (err) {
          console.error('Auto-refresh failed:', err);
          clearInterval(countdownInterval);
          // Warning will stay visible, session will expire
        }
      }
    };

    // Expiration callback
    const onExpire = async () => {
      console.log('Session expired:', session.id);
      setSessionExpiring(false);
      await sdk.clearSession(session.id);
    };

    // Schedule warning timer
    const warnAt = expiryMs - SESSION_WARNING_THRESHOLD_MS;
    if (warnAt > now) {
      setCappedTimeoutInMap(
        expiryTimersRef.current,
        `${session.id}-warning`,
        beforeExpiry,
        warnAt - now
      );
    } else {
      // Warning time already passed, fire immediately
      beforeExpiry();
    }

    // Schedule expiry timer
    setCappedTimeoutInMap(
      expiryTimersRef.current,
      session.id,
      onExpire,
      timeUntilExpiry
    );
  };

  // Wrapper that uses current doorway state
  const scheduleSessionExpiration = async (session: DoorwaySession) => {
    if (!doorway) {
      console.error("Cannot schedule - doorway not initialized");
      return;
    }
    return scheduleSessionExpirationForSdk(doorway, session);
  };

  // Clear all timers function
  const clearAllTimersFunc = () => {
    console.log('Clearing all session timers');
    clearAll(expiryTimersRef.current);
    setSessionExpiring(false);
    setTimeRemaining(0);
  };

  // Store ref so it can be accessed outside
  scheduleSessionExpirationRef.current = scheduleSessionExpiration;

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

        // Wait for next tick so doorway state is set
        await new Promise(resolve => setTimeout(resolve, 0));

        // Check for existing session and schedule expiration
        try {
          const existingSession = await sdk.getSession();
          if (existingSession) {
            console.log('Found existing session, scheduling expiration');
            // Call the function directly with sdk, not using doorway state
            scheduleSessionExpirationForSdk(sdk, existingSession);
          }
        } catch (err) {
          console.error('Failed to check existing session:', err);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize");
      } finally {
        setIsLoading(false);
      }
    }

    initializeDoorway();

    // Cleanup timers on unmount
    return () => {
      console.log('Cleaning up session timers');
      clearAll(expiryTimersRef.current);
    };
  }, []);

  return (
    <DoorwayContext.Provider value={{
      doorway,
      isLoading,
      error,
      sessionExpiring,
      timeRemaining,
      scheduleSessionExpiration: scheduleSessionExpirationRef.current,
      clearAllTimers: clearAllTimersFunc
    }}>
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

// Export helper to schedule session expiration (for use after auth)
export function useScheduleSessionExpiration() {
  const { doorway, sessionExpiring, timeRemaining } = useDoorwayContext();

  return {
    sessionExpiring,
    timeRemaining,
  };
}

export const useDoorwayContext = () => {
  const context = useContext(DoorwayContext);

  if (context === undefined) {
    throw new Error("useDoorwayContext must be used within a DoorwayProvider");
  }

  return context;
};
