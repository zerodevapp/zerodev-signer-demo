"use client";

import { useState, useEffect } from "react";
import { useDoorwayProvider } from "../hooks/useDoorwayProvider";
import { normalizeTimestamp, type DoorwaySession } from "@doorway/core";

export function SessionManagement() {
  const [activeSession, setActiveSession] = useState<DoorwaySession | null>(null);
  const [allSessions, setAllSessions] = useState<Record<string, DoorwaySession>>({});
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [switchLoading, setSwitchLoading] = useState<string | null>(null);
  const [clearLoading, setClearLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const {
    isLoading,
    error: sdkError,
    isReady,
    doorway,
    getSession,
    refreshSession
  } = useDoorwayProvider();

  const loadSessions = async () => {
    if (!doorway) return;

    try {
      const active = await doorway.getSession();
      console.log("active", active);
      const all = await doorway.getAllSessions();
      console.log("all", all);
      setActiveSession(active || null);
      setAllSessions(all);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    }
  };

  useEffect(() => {
    if (isReady) {
      loadSessions();
    }
  }, [isReady, doorway]);

  const handleRefreshSession = async () => {
    if (!isReady) {
      setError("Doorway SDK not ready.");
      return;
    }

    setRefreshLoading(true);
    setError("");
    setSuccess("");

    try {
      const refreshedSession = await refreshSession();
      if (refreshedSession) {
        setSuccess(`Session refreshed successfully. New expiry: ${new Date(refreshedSession.expiry).toLocaleString()}`);
        await loadSessions(); // Reload sessions to show updated data
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh session");
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleSwitchSession = async (sessionId: string) => {
    if (!doorway) return;

    setSwitchLoading(sessionId);
    setError("");
    setSuccess("");

    try {
      await doorway.switchSession(sessionId);
      setSuccess(`Switched to session: ${sessionId}`);
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to switch session");
    } finally {
      setSwitchLoading(null);
    }
  };

  const handleClearSession = async (sessionId: string) => {
    if (!doorway) return;

    setClearLoading(sessionId);
    setError("");
    setSuccess("");

    try {
      await doorway.clearSession(sessionId);
      setSuccess(`Cleared session: ${sessionId}`);
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear session");
    } finally {
      setClearLoading(null);
    }
  };

  const handleClearAllSessions = async () => {
    if (!doorway) return;

    setClearLoading("all");
    setError("");
    setSuccess("");

    try {
      await doorway.clearAllSessions();
      setSuccess("All sessions cleared successfully");
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear all sessions");
    } finally {
      setClearLoading(null);
    }
  };

  const formatTimeRemaining = (expiry_: number) => {
    const expiry = normalizeTimestamp(expiry_);
    const now = Date.now();
    const remaining = expiry - now;

    if (remaining <= 0) {
      return "Expired";
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Session Management
        </h2>
        <p className="text-gray-600 mb-6">
          Manage your active sessions, refresh expired sessions, and switch between multiple authenticated sessions.
        </p>
      </div>

      {/* SDK Status Display */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            <span className="text-blue-700">Initializing Doorway SDK...</span>
          </div>
        </div>
      )}

      {sdkError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center text-sm">
            <svg className="h-4 w-4 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700">SDK Error: {sdkError}</span>
          </div>
        </div>
      )}

      {!isLoading && !isReady && !sdkError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-center text-sm">
            <svg className="h-4 w-4 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-700">Please authenticate first to manage sessions</span>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">{success}</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {isReady && (
        <>
          {/* Active Session Card */}
          {activeSession ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <span className="inline-block w-3 h-3 bg-green-400 rounded-full mr-3"></span>
                  Active Session
                </h3>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Session ID</label>
                    <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border break-all">
                      {activeSession.id}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                    <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border break-all">
                      {activeSession.userId}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization ID</label>
                    <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border break-all">
                      {activeSession.organizationId}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stamper Type</label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activeSession.stamperType === 'iframe' ? 'bg-blue-100 text-blue-800' :
                        activeSession.stamperType === 'indexedDb' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activeSession.stamperType}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expires</label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                      {new Date(normalizeTimestamp(activeSession.expiry)).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Remaining</label>
                    <div className={`text-sm font-medium p-2 rounded border ${
                      activeSession.expiry <= Date.now()
                        ? 'text-red-700 bg-red-50'
                        : 'text-green-700 bg-green-50'
                    }`}>
                      {formatTimeRemaining(activeSession.expiry)}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleRefreshSession}
                    disabled={refreshLoading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {refreshLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Refreshing...</span>
                      </div>
                    ) : (
                      "🔄 Refresh Session"
                    )}
                  </button>

                  <button
                    onClick={() => handleClearSession(activeSession.id)}
                    disabled={clearLoading === activeSession.id}
                    className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {clearLoading === activeSession.id ? "Clearing..." : "🗑️ Clear Session"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
              <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h2m0 0V6a2 2 0 012-2h2.236a2 2 0 011.789 1.106l.447.894a2 2 0 001.789 1.106H18a2 2 0 012 2v1M4 13h2m0 0v-2a2 2 0 012-2h2m0 0V7a2 2 0 012-2h.236a2 2 0 011.789 1.106l.447.894a2 2 0 001.789 1.106H16a2 2 0 012 2v2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Session</h3>
              <p className="text-gray-600">Please authenticate first to create a session.</p>
            </div>
          )}

          {/* All Sessions */}
          {Object.keys(allSessions).length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  All Sessions ({Object.keys(allSessions).length})
                </h3>
                <button
                  onClick={handleClearAllSessions}
                  disabled={clearLoading === "all"}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {clearLoading === "all" ? "Clearing..." : "Clear All"}
                </button>
              </div>
              <div className="divide-y divide-gray-200">
                {Object.values(allSessions).map((session) => (
                  <div key={session.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-block w-3 h-3 rounded-full ${
                          session.id === activeSession?.id ? 'bg-green-400' : 'bg-gray-300'
                        }`}></span>
                        <span className="font-medium text-sm text-gray-900 font-mono">{session.id}</span>
                        {session.id === activeSession?.id && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {session.id !== activeSession?.id && (
                          <button
                            onClick={() => handleSwitchSession(session.id)}
                            disabled={switchLoading === session.id}
                            className="text-blue-600 hover:text-blue-500 text-sm font-medium disabled:opacity-50"
                          >
                            {switchLoading === session.id ? "Switching..." : "Switch"}
                          </button>
                        )}
                        <button
                          onClick={() => handleClearSession(session.id)}
                          disabled={clearLoading === session.id}
                          className="text-red-600 hover:text-red-500 text-sm font-medium disabled:opacity-50"
                        >
                          {clearLoading === session.id ? "Clearing..." : "Clear"}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Type:</span> {session.stamperType}
                      </div>
                      <div>
                        <span className="font-medium">User:</span> {session.userId.substring(0, 8)}...
                      </div>
                      <div>
                        <span className="font-medium">Expires:</span> {new Date(session.expiry).toLocaleDateString()}
                      </div>
                      <div className={session.expiry <= Date.now() ? 'text-red-600' : 'text-green-600'}>
                        <span className="font-medium">Status:</span> {formatTimeRemaining(session.expiry)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Session Management Features</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Refresh Session:</strong> Renew an active session to extend its expiry time</li>
                <li><strong>Switch Session:</strong> Change between multiple authenticated sessions</li>
                <li><strong>Clear Session:</strong> Remove a specific session from storage</li>
                <li><strong>Clear All Sessions:</strong> Remove all stored sessions and log out</li>
                <li><strong>Session Types:</strong> iframe (email auth) and indexedDb (OAuth/passkey auth)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}