"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X, RefreshCw } from "lucide-react";
import { cn } from "../lib/utils";
import { useScheduleSessionExpiration } from "../providers/DoorwayProvider";
import { useDoorwayProvider } from "../hooks/useDoorwayProvider";

export function SessionExpiryWarning() {
  const { sessionExpiring, timeRemaining } = useScheduleSessionExpiration();
  const { refreshSession } = useDoorwayProvider();
  const [dismissed, setDismissed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const seconds = Math.floor(timeRemaining / 1000);

  useEffect(() => {
    // Reset dismissed state when warning appears
    if (sessionExpiring) {
      setDismissed(false);
    }
  }, [sessionExpiring]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSession();
      // Auto-refresh will handle the rest
    } catch (err) {
      console.error('Manual refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (!sessionExpiring || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 bg-white border border-yellow-200 rounded-lg shadow-2xl p-4 max-w-sm z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-semibold text-gray-900">
              Session Refreshing
            </p>
            <button
              onClick={() => setDismissed(true)}
              className="text-gray-400 hover:text-gray-600 -mt-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Auto-refreshing your session in {seconds} second{seconds !== 1 ? 's' : ''}
          </p>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className={cn(
              "mt-3 w-full py-2 px-3 rounded-md text-sm font-medium transition-all",
              "bg-gray-900 text-white hover:bg-gray-800",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2"
            )}
          >
            {refreshing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Refresh Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
