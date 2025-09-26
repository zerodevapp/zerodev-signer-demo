"use client";

import { useState } from "react";
import { useDoorwayProvider } from "../hooks/useDoorwayProvider";
import {
  Hex,
  verifyMessage,
  recoverAddress,
  recoverMessageAddress,
  recoverTypedDataAddress,
  parseSignature,
  serializeSignature,
  http,
  createWalletClient,
  verifyTypedData,
} from "viem";
import { sepolia } from "viem/chains";
import { createPublicClient } from "viem";

type SigningMode = "message" | "typedData";

type VerificationResult = {
  recoveredAddress: Hex;
  expectedAddress: Hex;
  isValid: boolean;
};

export function SigningTest() {
  const [mode, setMode] = useState<SigningMode>("message");
  const [payload, setPayload] = useState("Hello World");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Hex | null>(null);
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
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
    setVerificationResult(null);

    try {
      const viemAccount = await toAccount();
      const expectedAddress = viemAccount.address;
      let signature: Hex;

      if (mode === "message") {
        signature = await viemAccount.signMessage({ message: payload });

        // Verify and recover address for message
        const recoveredAddress = await recoverMessageAddress({
          message: payload,
          signature,
        });

        const isValid = await verifyMessage({
          address: expectedAddress,
          message: payload,
          signature,
        });

        setVerificationResult({
          recoveredAddress,
          expectedAddress,
          isValid,
        });
      } else {
        // Parse the typed data JSON
        const typedData = JSON.parse(payload);
        console.log("typedData", typedData);
        const walletClient = createWalletClient({
          transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
          chain: sepolia,
          account: viemAccount,
        });
        signature = await walletClient.signTypedData(typedData);
        signature = serializeSignature(parseSignature(signature));
        const isValid = await verifyTypedData({
          ...typedData,
          signature,
          address: expectedAddress,
        });

        // Verify and recover address for typed data
        const recoveredAddress = await recoverTypedDataAddress({
          ...typedData,
          signature,
        });

        setVerificationResult({
          recoveredAddress,
          expectedAddress,
          isValid,
        });
      }

      setResult(signature);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const loadSamplePayload = () => {
    if (mode === "message") {
      setPayload("Hello World");
    } else {
      // Test typed data signing (EIP-712)
      // All properties on a domain are optional
      const domain = {
        name: "Ether Mail",
        version: "1",
        chainId: 1,
        verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
      } as const;

      // The named list of all type definitions
      const types = {
        Person: [
          { name: "name", type: "string" },
          { name: "wallet", type: "address" },
        ],
        Mail: [
          { name: "from", type: "Person" },
          { name: "to", type: "Person" },
          { name: "contents", type: "string" },
        ],
      } as const;

      const typedData = {
        domain,
        types,
        primaryType: "Mail",
        message: {
          from: {
            name: "Cow",
            wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
          },
          to: {
            name: "Bob",
            wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
          },
          contents: "Hello, Bob!",
        },
      } as const;

      setPayload(JSON.stringify(typedData, null, 2));
    }
  };

  const handleModeChange = (newMode: SigningMode) => {
    setMode(newMode);
    setPayload("");
    setResult(null);
    setVerificationResult(null);
    setError("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Payload Signing Test
        </h2>
        <p className="text-gray-600 mb-6">
          Test message and typed data signing with automatic verification. The
          payload will be signed using the wallet associated with your
          authenticated session, and the signature will be verified by
          recovering the address to ensure it matches your wallet address.
        </p>

        {/* Mode Selector */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => handleModeChange("message")}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              mode === "message"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Sign Message
          </button>
          <button
            onClick={() => handleModeChange("typedData")}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              mode === "typedData"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Sign Typed Data (EIP-712)
          </button>
        </div>
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
              {mode === "message"
                ? "Message to Sign"
                : "Typed Data (EIP-712) JSON"}
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
            rows={mode === "message" ? 4 : 12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder={
              mode === "message"
                ? "Enter message to sign..."
                : "Enter EIP-712 typed data JSON..."
            }
          />
          {mode === "typedData" && (
            <p className="mt-1 text-xs text-gray-500">
              Enter valid EIP-712 typed data JSON with domain, types,
              primaryType, and message fields.
            </p>
          )}
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
          ) : mode === "message" ? (
            "✍️ Sign Message"
          ) : (
            "✍️ Sign Typed Data"
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
                {mode === "message"
                  ? "Message Signature Generated"
                  : "Typed Data Signature Generated"}
              </h3>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1">
                    {mode === "message"
                      ? "MESSAGE SIGNATURE"
                      : "EIP-712 SIGNATURE"}
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

      {/* Verification Results Display */}
      {verificationResult && (
        <div
          className={`border rounded-md p-4 ${
            verificationResult.isValid
              ? "bg-blue-50 border-blue-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className={`h-5 w-5 ${
                  verificationResult.isValid ? "text-blue-400" : "text-red-400"
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                {verificationResult.isValid ? (
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
            </div>
            <div className="ml-3">
              <h3
                className={`text-sm font-medium ${
                  verificationResult.isValid ? "text-blue-800" : "text-red-800"
                }`}
              >
                Signature Verification & Address Recovery
              </h3>
              <div className="mt-3 space-y-3">
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 ${
                      verificationResult.isValid
                        ? "text-blue-700"
                        : "text-red-700"
                    }`}
                  >
                    EXPECTED ADDRESS (Your Wallet)
                  </label>
                  <div
                    className={`font-mono text-xs p-2 rounded border break-all ${
                      verificationResult.isValid
                        ? "text-blue-600 bg-white"
                        : "text-red-600 bg-white"
                    }`}
                  >
                    {verificationResult.expectedAddress}
                  </div>
                </div>
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 ${
                      verificationResult.isValid
                        ? "text-blue-700"
                        : "text-red-700"
                    }`}
                  >
                    RECOVERED ADDRESS (From Signature)
                  </label>
                  <div
                    className={`font-mono text-xs p-2 rounded border break-all ${
                      verificationResult.isValid
                        ? "text-blue-600 bg-white"
                        : "text-red-600 bg-white"
                    }`}
                  >
                    {verificationResult.recoveredAddress}
                  </div>
                </div>
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 ${
                      verificationResult.isValid
                        ? "text-blue-700"
                        : "text-red-700"
                    }`}
                  >
                    VERIFICATION STATUS
                  </label>
                  <div
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      verificationResult.isValid
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {verificationResult.isValid ? (
                      <>
                        <svg
                          className="w-3 h-3 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        VALID - Addresses Match
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-3 h-3 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        INVALID - Addresses Don't Match
                      </>
                    )}
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
