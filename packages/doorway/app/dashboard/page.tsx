"use client";

import { useState, useEffect, useCallback } from "react";
import { useTurnkey } from "@turnkey/sdk-react";
import { Session as TurnkeySession } from "@turnkey/sdk-browser";
import { EmailAuthTest } from "../components/EmailAuthTest";
import { OAuthTest } from "../components/OAuthTest";
import { SigningTest } from "../components/SigningTest";
import { SendTransactionTest } from "../components/SendTransactionTest";
import { AppManagementTest } from "../components/AppManagementTest";
import { useWalletInfo } from "../hooks/useWalletInfo";

type ActiveTab = "apps" | "email" | "oauth" | "signing" | "send transaction";

export default function TestV2Page() {
  const { turnkey, indexedDbClient } = useTurnkey();
  const [activeTab, setActiveTab] = useState<ActiveTab>("apps");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState<TurnkeySession | undefined | 'loading'>('loading');
  const { walletAddress } = useWalletInfo();

  const logout = useCallback(async () => {
    await turnkey?.logout();
    await indexedDbClient?.clear();
    
    // Clear localStorage auth data
    localStorage.removeItem("v2_auth_completed");
    localStorage.removeItem("v2_current_app_id")
    localStorage.removeItem("v2_current_api_key")
    
    setIsAuthenticated(false);
    setActiveTab("apps");
    
    // Redirect to auth page or reload
    location.href = '/';
  }, [turnkey, indexedDbClient]);

  useEffect(() => {
    async function updateSession() {
      if (turnkey) {
        const _session = await turnkey.getSession();

        if (_session && Date.now() < _session.expiry) {
          // session is there and not expired
          setSession(_session);
          setIsAuthenticated(true);
        } else {
          // session is not there or expired
          setSession(undefined);
          setIsAuthenticated(false);
          // Don't auto logout here, let user manually logout or re-authenticate
        }
      } else {
        setSession(undefined);
      }
    }

    updateSession();
  }, [turnkey]);

  // Load auth data from localStorage on mount
  useEffect(() => {
    const authCompleted = localStorage.getItem("v2_auth_completed") === "true";

    if (authCompleted) {
      setIsAuthenticated(true);
      // Switch to signing tab to show the authenticated state
      setActiveTab("signing");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-3xl font-bold">V2 API Testing Interface</h1>
            <p className="text-blue-100 mt-2">
              Test the new abstracted Turnkey API endpoints
            </p>
          </div>

          {/* Session Info */}
          {isAuthenticated && session && session !== 'loading' && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex justify-between items-center">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      <strong>Turnkey Session Active</strong>
                      <span className="ml-4">
                        <strong>Type:</strong> {session.sessionType}
                      </span>
                      <span className="ml-4">
                        <strong>Expires:</strong> {new Date(session.expiry).toLocaleString()}
                      </span>
                      {walletAddress && (
                        <span className="ml-4">
                          <strong>Wallet:</strong> {walletAddress}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="bg-white text-red-600 hover:text-white min-w-24 hover:border-red-700 rounded-md py-1 px-3 border-2 border-red-600 cursor-pointer hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: "apps", name: "App Management", icon: "🏢" },
                { id: "email", name: "Email Auth", icon: "📧" },
                { id: "oauth", name: "OAuth Auth", icon: "🔐" },
                { id: "signing", name: "Payload Signing", icon: "✍️" },
                {
                  id: "send transaction",
                  name: "Send Transaction",
                  icon: "💰",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "apps" && <AppManagementTest />}
            {activeTab === "email" && <EmailAuthTest />}
            {activeTab === "oauth" && <OAuthTest />}
            {activeTab === "signing" && <SigningTest />}
            {activeTab === "send transaction" && <SendTransactionTest />}
          </div>
        </div>
      </div>
    </div>
  );
}
