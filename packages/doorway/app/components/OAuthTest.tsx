"use client";

import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useDoorwayProvider } from "../hooks/useDoorwayProvider";
import { Hex, sha256 } from "viem";

export function OAuthTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState<string>("");
  const [nonce, setNonce] = useState<string>("");

  const { isReady, auth, getPublicKeys } = useDoorwayProvider();

  useEffect(() => {
    (async () => {
      if (isReady) {
        try {
          const { compressedPublicKey } = await getPublicKeys();
          console.log("compressedPublicKey", compressedPublicKey);
          const nonce = sha256(compressedPublicKey as Hex);
          setNonce(nonce.replace(/^0x/, ""));
        } catch (err) {
          console.error("Failed to get public keys:", err);
        }
      }
    })();
  }, [isReady, getPublicKeys]);

  const handleOAuthSuccess = async (credentialResponse) => {
    console.log("credentialResponse", credentialResponse);
    if (!credentialResponse.credential) {
      setError("No credential received from Google");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      if (!isReady) {
        setError(
          "Doorway SDK not ready. Please ensure you have selected an app first."
        );
        setLoading(false);
        return;
      }

      try {
        const data = await auth({
          type: "oauth",
          credential: credentialResponse.credential,
          provider: "google",
        });

        setResult(data);
      } catch (error) {
        console.log("error", error);
        setError(
          error instanceof Error ? error.message : "OAuth authentication failed"
        );
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          OAuth Authentication Test
        </h2>
        <p className="text-gray-600 mb-6">
          Test the OAuth-based authentication flow with Google. This will create
          a user in Turnkey if they dont exist, and immediately return a session
          token for authenticated users.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Google Login Button */}
        <div className="flex flex-col items-center space-y-3">
          <div className="flex justify-center">
            {!nonce ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Nonce generating...</span>
              </div>
            ) : loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Authenticating...</span>
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleOAuthSuccess}
                onError={handleOAuthError}
                nonce={nonce}
                text="signin_with"
                shape="rectangular"
                theme="outline"
                size="large"
              />
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
    </div>
  );
}
