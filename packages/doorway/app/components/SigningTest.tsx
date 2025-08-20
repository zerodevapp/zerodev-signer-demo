"use client";

import { useState } from "react";
import { useDoorwayProvider } from "../hooks/useDoorwayProvider";
import { Hex } from "viem";

export function SigningTest() {
  const [payload, setPayload] = useState("Hello World");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Hex | null>(null);
  const [error, setError] = useState<string>("");
  const {
    isLoading,
    error: sdkError,
    isReady,
    toAccount,
  } = useDoorwayProvider();

  const handleSign = async () => {
    if (!isReady) {
      setError(
        "Doorway SDK not ready. Please ensure you have selected an app and completed authentication first."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const viemAccount = await toAccount();
      const data = await viemAccount.signMessage({ message: payload });

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const loadSamplePayload = () => {
    setPayload("Hello World");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Payload Signing Test
        </h2>
        <p className="text-gray-600 mb-6">
          Test raw payload signing with different encoding formats. The payload
          will be signed using the wallet associated with your authenticated
          session.
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
            <svg
              className="h-4 w-4 text-red-400 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-700">SDK Error: {sdkError}</span>
          </div>
        </div>
      )}

      {isReady && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-center text-sm">
            <svg
              className="h-4 w-4 text-green-400 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-green-700">
              Doorway SDK ready for signing
            </span>
          </div>
        </div>
      )}

      {!isLoading && !isReady && !sdkError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-center text-sm">
            <svg
              className="h-4 w-4 text-yellow-400 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-yellow-700">
              Please select an app from the App Management tab and complete
              authentication first
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Payload Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="payload"
              className="block text-sm font-medium text-gray-700"
            >
              Payload to Sign
            </label>
            <button
              type="button"
              onClick={loadSamplePayload}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Load Sample
            </button>
          </div>
          <textarea
            id="payload"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder={`Enter data...`}
          />
        </div>

        {/* Sign Button */}
        <button
          onClick={handleSign}
          disabled={loading || !payload || !isReady}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Signing...</span>
            </div>
          ) : !isReady ? (
            "SDK Not Ready"
          ) : (
            "✍️ Sign Payload"
          )}
        </button>
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
              <h3 className="text-sm font-medium text-red-800">
                Signing Error
              </h3>
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
                Signature Generated
              </h3>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1">
                    SIGNATURE
                  </label>
                  <div className="font-mono text-xs text-green-600 bg-white p-2 rounded border break-all">
                    {result}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
