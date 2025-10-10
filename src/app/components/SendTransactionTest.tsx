"use client";

import { useState } from "react";
import { Send, Zap, AlertCircle, Loader2, Check, ExternalLink } from "lucide-react";
import { cn } from "../lib/utils";
import { useZeroDevSignerProvider } from "../hooks/useZeroDevSignerProvider";
import {
  type Address,
  createWalletClient,
  type Hex,
  http,
  parseEther,
  zeroAddress,
} from "viem";
import { sepolia } from "viem/chains";
import { sendGaslessTransaction } from "../services/gaslessTransaction";

type SendTransactionFormData = {
  to: string;
  data: string;
  value: string;
};

export function SendTransactionTest() {
  const [formData, setFormData] = useState<SendTransactionFormData>({
    to: zeroAddress,
    data: "",
    value: "0",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [isGasless, setIsGasless] = useState(false);

  const { isReady, toAccount } = useZeroDevSignerProvider();

  const handleSendTransaction = async () => {
    if (!isReady) {
      setError("Please authenticate first");
      return;
    }

    if (!formData.to) {
      setError("Recipient address is required");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      if (isGasless) {
        const result = await sendGaslessTransaction({
          localAccount: await toAccount(),
          to: formData.to as Address,
          data: (formData.data as Hex) || "0x",
          value: parseEther(formData.value || "0"),
        });
        setResult(`https://sepolia.etherscan.io/tx/${result.transactionHash}`);
      } else {
        const walletClient = createWalletClient({
          transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
          chain: sepolia,
          account: await toAccount(),
        });
        const hash = await walletClient.sendTransaction({
          to: formData.to as Address,
          data: (formData.data as Hex) || "0x",
          value: parseEther(formData.value || "0"),
        });
        setResult(`https://sepolia.etherscan.io/tx/${hash}`);
      }
    } catch (err) {
      console.error("Transaction error:", err);
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Send Transaction</h2>
        <p className="text-sm text-gray-500 mt-1">
          Send transactions on Sepolia testnet
        </p>
      </div>

      {/* Gasless Toggle */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <input
          type="checkbox"
          id="gasless"
          checked={isGasless}
          onChange={(e) => setIsGasless(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="gasless" className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          Use EIP-7702 (Gasless)
        </label>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Recipient Address
          </label>
          <input
            type="text"
            value={formData.to}
            onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
            placeholder="0x..."
            className={cn(
              "w-full px-4 py-2.5 rounded-lg border border-gray-200 font-mono text-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "text-gray-900 placeholder:text-gray-400"
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Value (ETH)
          </label>
          <input
            type="text"
            value={formData.value}
            onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
            placeholder="0.001"
            className={cn(
              "w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "text-gray-900 placeholder:text-gray-400"
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Data (Optional)
          </label>
          <textarea
            value={formData.data}
            onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
            rows={3}
            placeholder="0x (leave empty for simple transfer)"
            className={cn(
              "w-full px-4 py-3 rounded-lg border border-gray-200 font-mono text-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "text-gray-900 placeholder:text-gray-400"
            )}
          />
        </div>
      </div>

      {/* Send Button */}
      <button
        onClick={handleSendTransaction}
        disabled={loading || !formData.to}
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
            Sending...
          </>
        ) : (
          <>
            {isGasless ? <Zap className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            Send {isGasless ? "Gasless " : ""}Transaction
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Transaction Failed</p>
            <p className="text-sm text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-100 rounded-lg">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">Transaction sent successfully</span>
          </div>
          <a
            href={result}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg",
              "hover:bg-gray-100 transition-colors group"
            )}
          >
            <span className="text-sm text-gray-700 font-medium">View on Etherscan</span>
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
          </a>
        </div>
      )}
    </div>
  );
}
