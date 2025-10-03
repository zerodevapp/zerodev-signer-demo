"use client";

import { useState } from "react";
import { useDoorwayProvider } from "../hooks/useDoorwayProvider";

export function EmailAuthTest() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState<string>("");

  const { isLoading, error: sdkError, isReady, auth } = useDoorwayProvider();

  const handleEmailAuth = async () => {
    if (!isReady) {
      setError(
        "Doorway SDK not ready. Please ensure you have selected an app first."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await auth({ 
        type: "email",
        email,
        emailCustomization: {
          magicLinkTemplate: process.env.NEXT_PUBLIC_APP_URL + '/verify?bundle=%s'
        },
      });

      console.log("data", data);

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Email Authentication Test
        </h2>
        <p className="text-gray-600 mb-6">
          Test the email-based authentication flow. This will create a user in
          Turnkey if they don&apos;t exist, and send a magic link for
          authentication.
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
              Doorway SDK ready for authentication
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
              Please select an app from the App Management tab first
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Email Input */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
            placeholder="user@example.com"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleEmailAuth}
          disabled={loading || !isReady || !email.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Authenticating..."
            : !isReady
            ? "SDK Not Ready"
            : "Send Magic Link"}
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
                Authentication Response
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
                clipRule="evenovenRule"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">How it works</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ol className="list-decimal list-inside space-y-1">
                <li>Enter an email address and target public key</li>
                <li>
                  Click &quot;Send Magic Link&quot; to initiate authentication
                </li>
                <li>
                  If successful, you&apos;ll see a response indicating a magic
                  link was sent
                </li>
                <li>
                  For email auth, you&apos;ll need to complete the flow via the
                  magic link to get a session token
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
