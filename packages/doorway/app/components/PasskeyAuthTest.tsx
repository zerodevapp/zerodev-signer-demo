"use client";

import React, { useState } from "react";
import { useDoorwayProvider } from "../hooks/useDoorwayProvider";

export default function PasskeyAuthTest() {
  const [email, setEmail] = useState("");
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const { auth, logout } = useDoorwayProvider();

  const handlePasskeyRegister = async () => {
    if (!email) {
      setError("Please enter an email address");
      return;
    }

    setIsRegisterLoading(true);
    setError(null);
    setResult(null);

    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn is not supported in this browser");
      }

      console.log("Starting passkey authentication for:", email);

      const authResult = await auth({
        type: "passkey",
        email: email,
        mode: "register",
      });

      console.log("Passkey register result:", authResult);
      setResult(authResult);

      // Get the wallet address after successful auth
      if (authResult?.walletAddress) {
        console.log("Wallet address:", authResult.walletAddress);
      }
    } catch (err: any) {
      console.error("Passkey auth error:", err);
      setError(err.message || "Failed to authenticate with passkey");
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setIsLoginLoading(true);
    setError(null);
    setResult(null);

    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn is not supported in this browser");
      }

      console.log("Starting passkey authentication for:", email);

      const authResult = await auth({
        type: "passkey",
        email: email,
        mode: "login",
      });

      console.log("Passkey login result:", authResult);
      setResult(authResult);

      // Get the wallet address after successful auth
      if (authResult?.walletAddress) {
        console.log("Wallet address:", authResult.walletAddress);
      }
    } catch (err: any) {
      console.error("Passkey auth error:", err);
      setError(err.message || "Failed to authenticate with passkey");
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setResult(null);
      setEmail("");
      console.log("Logged out successfully");
    } catch (err: any) {
      console.error("Logout error:", err);
      setError(err.message || "Failed to logout");
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900">
          Passkey Authentication Test
        </h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Test passkey (WebAuthn) authentication with Doorway SDK</p>
        </div>

        {/* Browser Support Check */}
        {typeof window !== "undefined" && !window.PublicKeyCredential && (
          <div className="mt-4 rounded-md bg-yellow-50 p-4">
            <div className="text-sm text-yellow-800">
              ⚠️ WebAuthn is not supported in this browser. Please use a modern
              browser like Chrome, Firefox, Safari, or Edge.
            </div>
          </div>
        )}

        <div className="mt-5">
          <div className="grid gap-4">
            <div>
              <label
                htmlFor="passkey-email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                type="email"
                id="passkey-email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isRegisterLoading || isLoginLoading || !!result}
              />
            </div>

            <div className="flex gap-2">
              {!result && (
                <button
                  type="button"
                  onClick={handlePasskeyRegister}
                  disabled={isRegisterLoading || !email}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-300"
                >
                  {isRegisterLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating Passkey...
                    </>
                  ) : (
                    <>
                      <svg
                        className="mr-2 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                        />
                      </svg>
                      Register with Passkey
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {!result && (
                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={isLoginLoading}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-300"
                >
                  {isLoginLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Logging in with Passkey...
                    </>
                  ) : (
                    <>
                      <svg
                        className="mr-2 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                        />
                      </svg>
                      Login with Passkey
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {result && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                >
                  Logout
                </button>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">Error: {error}</div>
              </div>
            )}

            {/* Success Result */}
            {result && (
              <div className="rounded-md bg-green-50 p-4">
                <h4 className="text-sm font-medium text-green-800">
                  ✅ Passkey Registration Successful!
                </h4>
                <div className="mt-2 text-sm text-green-700 space-y-1">
                  {result.userId && (
                    <p>
                      <span className="font-medium">User ID:</span>{" "}
                      <span className="font-mono">{result.userId}</span>
                    </p>
                  )}
                  {result.walletAddress && (
                    <p>
                      <span className="font-medium">Wallet Address:</span>{" "}
                      <span className="font-mono">{result.walletAddress}</span>
                    </p>
                  )}
                  {result.subOrganizationId && (
                    <p>
                      <span className="font-medium">Sub-Org ID:</span>{" "}
                      <span className="font-mono">
                        {result.subOrganizationId}
                      </span>
                    </p>
                  )}
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-green-600 hover:text-green-700">
                    View Full Response
                  </summary>
                  <pre className="mt-2 text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-4 text-xs text-gray-500 space-y-1">
              <p>💡 Tips:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  This creates a new passkey (WebAuthn credential) for
                  authentication
                </li>
                <li>Your browser will prompt you to create or use a passkey</li>
                <li>
                  Passkeys are stored securely on your device or password
                  manager
                </li>
                <li>Each email creates a new wallet address</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
