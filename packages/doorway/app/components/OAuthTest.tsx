"use client";

import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useTargetPublicKey } from "../hooks/useTargetPublicKey";
import { useTurnkey } from "@turnkey/sdk-react";


export function OAuthTest() {
  const { indexedDbClient } = useTurnkey();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const {
    compressedPublicKey,
    nonce,
    isGenerating,
    generateNewKey,
    error: keyError,
  } = useTargetPublicKey();


  const handleOAuthSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      setError("No credential received from Google");
      return;
    }

    if (!compressedPublicKey) {
      setError("Target public key not generated. Please generate a key first.");
      return;
    }

    if (keyError) {
      setError(`Key generation error: ${keyError}`);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const appId = localStorage.getItem('v2_current_app_id');
      if (!appId) {
        setError('Please select an app first from the App Management tab');
        setLoading(false);
        return;
      }

      const apiKey = localStorage.getItem('v2_current_api_key');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Include API key if available
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      const response = await fetch("http://localhost:3001/api/v1/auth/oauth", {
        method: "POST",
        headers,
        body: JSON.stringify({
          oidcToken: credentialResponse.credential,
          provider: "google",
          targetPublicKey: compressedPublicKey,
          appId,
        }),
      });

      const data = await response.json();
      console.log(data)

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      setResult(data);
      console.log("data.turnkeySession",data.turnkeySession)

      // Login with Turnkey session to establish browser session
      if (data.turnkeySession) {
        await indexedDbClient?.loginWithSession(data.turnkeySession);
      }
      localStorage.setItem("v2_auth_completed", "true");

      // Redirect back to test interface with success
      window.location.href = "/?success=auth_complete";
    } catch (err) {
      console.log(err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthError = () => {
    setError("Google OAuth authentication failed");
  };

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Configuration Required
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable is not set.
              OAuth testing requires a Google Client ID.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentAppId = typeof window !== 'undefined' ? localStorage.getItem('v2_current_app_id') : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          OAuth Authentication Test
        </h2>
        <p className="text-gray-600 mb-6">
          Test the OAuth-based authentication flow with Google. This will create
          a user in Turnkey if they dont exist, and immediately return a
          session token for authenticated users.
        </p>
      </div>

      {/* App Context Display */}
      {currentAppId && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center text-sm">
            <svg className="h-4 w-4 text-blue-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-blue-700">
              Using app: <span className="font-mono font-medium">{currentAppId}</span>
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Target Public Key Generation */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Target Public Key (Generated by Turnkey)
            </label>
            <button
              type="button"
              onClick={generateNewKey}
              disabled={isGenerating}
              className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? "Generating..." : "🔄 Generate New Key"}
            </button>
          </div>

          {compressedPublicKey ? (
            <div className="space-y-3">
              <div>
                <div className="font-mono text-xs text-gray-600 bg-gray-50 p-3 rounded border break-all">
                  {compressedPublicKey}
                </div>
              </div>
              {nonce && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nonce (SHA256 of public key)
                  </label>
                  <div className="font-mono text-xs text-gray-600 bg-gray-50 p-2 rounded border break-all">
                    {nonce}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                {isGenerating
                  ? "Generating new target public key..."
                  : 'Click "Generate New Key" to create a target public key'}
              </p>
            </div>
          )}

          {keyError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2">
              <p className="text-sm text-red-800">{keyError}</p>
            </div>
          )}

          <p className="text-sm text-gray-500 mt-2">
            This public key is generated using Turnkeys client-side SDK and
            will be used to authenticate your session.
          </p>
        </div>

        {/* Google Login Button */}
        <div className="flex flex-col items-center space-y-3">
          {!compressedPublicKey && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 w-full">
              <p className="text-sm text-yellow-800 text-center">
                Generate a target public key first to enable OAuth
                authentication
              </p>
            </div>
          )}

          <div className="flex justify-center">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Authenticating...</span>
              </div>
            ) : isGenerating ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-gray-600">Generating key...</span>
              </div>
            ) : compressedPublicKey ? (
              <GoogleLogin
                onSuccess={handleOAuthSuccess}
                onError={handleOAuthError}
                nonce={nonce}
                text="signin_with"
                shape="rectangular"
                theme="outline"
                size="large"
              />
            ) : (
              <div className="text-gray-500 text-sm">
                Generate a target public key to continue
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Success Result Display */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
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
              <h3 className="text-sm font-medium text-green-800">
                Authentication Success
              </h3>
              <div className="mt-2">
                <pre className="text-sm text-green-700 whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">How it works</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ol className="list-decimal list-inside space-y-1">
                <li>Configure the target public key (or use the default)</li>
                <li>Click &quot;Sign in with Google&quot; to start OAuth flow</li>
                <li>Complete Google authentication in the popup</li>
                <li>
                  If successful, youll receive a session token and wallet
                  address immediately
                </li>
                <li>The session will be available for signing operations</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
