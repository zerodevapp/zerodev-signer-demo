"use client";

import { useState } from "react";
import { FileSignature, Check, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";
import { useZeroDevWalletProvider } from "../hooks/useZeroDevWalletProvider";
import {
  type Hex,
  verifyMessage,
  recoverMessageAddress,
  recoverTypedDataAddress,
  parseSignature,
  serializeSignature,
  http,
  createWalletClient,
  verifyTypedData,
} from "viem";
import { sepolia } from "viem/chains";

type SigningMode = "message" | "typedData";

type VerificationResult = {
  recoveredAddress: Hex;
  expectedAddress: Hex;
  isValid: boolean;
};

const typedData = {
  domain: {
    name: "Ether Mail",
    version: "1",
    chainId: 1,
    verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
  },
  types: {
    Person: [
      { name: "name", type: "string" },
      { name: "wallet", type: "address" },
    ],
    Mail: [
      { name: "from", type: "Person" },
      { name: "to", type: "Person" },
      { name: "contents", type: "string" },
    ],
  },
  primaryType: "Mail",
  message: {
    from: { name: "Cow", wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826" },
    to: { name: "Bob", wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB" },
    contents: "Hello, Bob!",
  },
};

const message = "Hello World";

export function SigningTest() {
  const [mode, setMode] = useState<SigningMode>("message");
  const [payload, setPayload] = useState(message);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Hex | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string>("");

  const { isReady, toAccount } = useZeroDevWalletProvider();

  const handleSign = async () => {
    if (!isReady) {
      setError("Please authenticate first");
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
        const recoveredAddress = await recoverMessageAddress({ message: payload, signature });
        const isValid = await verifyMessage({ address: expectedAddress, message: payload, signature });

        setVerificationResult({ recoveredAddress, expectedAddress, isValid });
      } else {
        const typedData = JSON.parse(payload);
        const walletClient = createWalletClient({
          transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
          chain: sepolia,
          account: viemAccount,
        });
        signature = await walletClient.signTypedData(typedData);
        signature = serializeSignature(parseSignature(signature));
        const isValid = await verifyTypedData({ ...typedData, signature, address: expectedAddress });
        const recoveredAddress = await recoverTypedDataAddress({ ...typedData, signature });

        setVerificationResult({ recoveredAddress, expectedAddress, isValid });
      }

      setResult(signature);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signing failed");
    } finally {
      setLoading(false);
    }
  };

  const loadSample = () => {
    if (mode === "message") {
      setPayload(message);
    } else {
      // const typedData = {
      //   domain: {
      //     name: "Ether Mail",
      //     version: "1",
      //     chainId: 1,
      //     verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
      //   },
      //   types: {
      //     Person: [
      //       { name: "name", type: "string" },
      //       { name: "wallet", type: "address" },
      //     ],
      //     Mail: [
      //       { name: "from", type: "Person" },
      //       { name: "to", type: "Person" },
      //       { name: "contents", type: "string" },
      //     ],
      //   },
      //   primaryType: "Mail",
      //   message: {
      //     from: { name: "Cow", wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826" },
      //     to: { name: "Bob", wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB" },
      //     contents: "Hello, Bob!",
      //   },
      // };
      setPayload(JSON.stringify(typedData, null, 2));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Sign Message</h2>
        <p className="text-sm text-gray-500 mt-1">
          Sign messages and typed data with your wallet
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => { setMode("message"); setPayload("Hello World"); setResult(null); setVerificationResult(null); }}
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
            mode === "message" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
          )}
        >
          Message
        </button>
        <button
          onClick={() => { setMode("typedData"); setPayload(JSON.stringify(typedData, null, 2)); setResult(null); setVerificationResult(null); }}
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
            mode === "typedData" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
          )}
        >
          Typed Data (EIP-712)
        </button>
      </div>

      {/* Payload Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            {mode === "message" ? "Message" : "Typed Data JSON"}
          </label>
          <button
            onClick={loadSample}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Load Sample
          </button>
        </div>
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          rows={mode === "message" ? 3 : 10}
          placeholder={mode === "message" ? "Enter message to sign..." : "Enter EIP-712 typed data JSON..."}
          className={cn(
            "w-full px-4 py-3 rounded-lg border border-gray-200 font-mono text-sm",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "text-gray-900 placeholder:text-gray-400"
          )}
        />
      </div>

      {/* Sign Button */}
      <button
        onClick={handleSign}
        disabled={loading || !payload.trim() || !isReady}
        className={cn(
          "w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all",
          "bg-gray-900 text-white hover:bg-gray-800",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "flex items-center justify-center gap-2"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing...
          </>
        ) : (
          <>
            <FileSignature className="h-4 w-4" />
            Sign {mode === "message" ? "Message" : "Typed Data"}
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Signing Failed</p>
            <p className="text-sm text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs font-medium text-gray-500 mb-2">Signature</p>
            <p className="text-xs text-gray-700 font-mono break-all">{result}</p>
          </div>

          {verificationResult && (
            <div className={cn(
              "p-4 border rounded-lg",
              verificationResult.isValid ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            )}>
              <div className="flex items-center gap-2 mb-3">
                <Check className={cn(
                  "h-4 w-4",
                  verificationResult.isValid ? "text-green-600" : "text-red-600"
                )} />
                <p className={cn(
                  "text-sm font-semibold",
                  verificationResult.isValid ? "text-green-900" : "text-red-900"
                )}>
                  {verificationResult.isValid ? "Valid Signature" : "Invalid Signature"}
                </p>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-gray-600">Expected Address</p>
                  <p className="text-xs font-mono text-gray-900">{verificationResult.expectedAddress}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Recovered Address</p>
                  <p className="text-xs font-mono text-gray-900">{verificationResult.recoveredAddress}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
