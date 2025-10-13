"use client";

import { useState, useEffect } from "react";
import { Send, Sparkles, AlertCircle, Loader2, Check, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "../lib/utils";
import { useZeroDevSignerProvider } from "../hooks/useZeroDevSignerProvider";
import {
  type Address,
  createWalletClient,
  createPublicClient,
  type Hex,
  http,
  parseEther,
  parseAbi,
  encodeFunctionData,
  zeroAddress,
  isAddress,
} from "viem";
import { sepolia } from "viem/chains";
import { sendGaslessTransaction } from "../services/gaslessTransaction";

type TransactionMode = "send-eth" | "mint-nft";

const NFT_CONTRACT_ADDRESS = "0x34bE7f35132E97915633BC1fc020364EA5134863";
const NFT_CONTRACT_ABI = parseAbi([
  "function mint(address _to) public",
  "function balanceOf(address owner) external view returns (uint256 balance)",
]);

export function SendTransactionTest() {
  const [mode, setMode] = useState<TransactionMode>("mint-nft");
  const [recipient, setRecipient] = useState<string>(zeroAddress);
  const [amount, setAmount] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [nftBalance, setNftBalance] = useState<string>("0");
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [isGasless, setIsGasless] = useState(false);

  const { isReady, toAccount } = useZeroDevSignerProvider();

  // Fetch NFT balance
  const fetchNftBalance = async () => {
    if (!isReady) return;

    setLoadingBalance(true);
    try {
      const account = await toAccount();
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
      });

      const balance = await publicClient.readContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: NFT_CONTRACT_ABI,
        functionName: "balanceOf",
        args: [account.address],
      });

      setNftBalance(balance.toString());
    } catch (err) {
      console.error("Failed to fetch NFT balance:", err);
    } finally {
      setLoadingBalance(false);
    }
  };

  // Fetch balance when switching to NFT mode
  useEffect(() => {
    if (mode === "mint-nft" && isReady) {
      fetchNftBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isReady]);

  const handleSendEth = async () => {
    if (!isReady || !recipient) {
      setError("Please authenticate and enter recipient address");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    if (!isAddress(recipient)) {
      setError("Invalid recipient address");
      setLoading(false);
      return;
    }
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Invalid amount");
      setLoading(false);
      return;
    }

    try {
      if (isGasless) {
        const result = await sendGaslessTransaction({
          localAccount: await toAccount(),
          to: recipient as Address,
          data: "0x" as Hex,
          value: parseEther(amount || "0"),
        });
        setResult(`https://sepolia.etherscan.io/tx/${result.transactionHash}`);
      } else {
        const walletClient = createWalletClient({
          transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
          chain: sepolia,
          account: await toAccount(),
        });
        const hash = await walletClient.sendTransaction({
          to: recipient as Address,
          value: parseEther(amount || "0"),
        });
        setResult(`https://sepolia.etherscan.io/tx/${hash}`);
      }
    } catch (err) {
      console.error("Transaction error:", err);
      setError("Transaction failed");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleMintNft = async () => {
    if (!isReady) {
      setError("Please authenticate first");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const account = await toAccount();

      // Encode mint function data - mint to self
      const data = encodeFunctionData({
        abi: NFT_CONTRACT_ABI,
        functionName: "mint",
        args: [account.address],
      });

      if (isGasless) {
        // Use gasless for NFT mint
        const result = await sendGaslessTransaction({
          localAccount: account,
          to: NFT_CONTRACT_ADDRESS as Address,
          data: data,
          value: parseEther("0"),
        });
        setResult(`https://sepolia.etherscan.io/tx/${result.transactionHash}`);
      } else {
        // Regular transaction
        const walletClient = createWalletClient({
          transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
          chain: sepolia,
          account: account,
        });

        const hash = await walletClient.writeContract({
          address: NFT_CONTRACT_ADDRESS,
          abi: NFT_CONTRACT_ABI,
          functionName: "mint",
          args: [account.address],
        });

        setResult(`https://sepolia.etherscan.io/tx/${hash}`);
      }

      // Refresh NFT balance after successful mint
      setTimeout(() => fetchNftBalance(), 3000);
    } catch (err) {
      console.error("Mint error:", err);
      setError("Mint failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Send Transaction</h2>
        <p className="text-sm text-gray-500 mt-1">
          Send ETH or mint NFTs on Sepolia testnet
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => { setMode("mint-nft"); setResult(null); setError(""); }}
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
            mode === "mint-nft" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
          )}
        >
          Mint NFT
        </button>
        <button
          onClick={() => { setMode("send-eth"); setResult(null); setError(""); }}
          className={cn(
            "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
            mode === "send-eth" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
          )}
        >
          Send ETH
        </button>
      </div>

      {/* NFT Balance (only show in mint mode) */}
      {mode === "mint-nft" && (
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div>
            <p className="text-xs font-medium text-blue-600 mb-1">Your NFT Balance</p>
            <p className="text-2xl font-bold text-blue-900">{nftBalance}</p>
          </div>
          <button
            onClick={fetchNftBalance}
            disabled={loadingBalance}
            className="p-2 text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
            title="Refresh balance"
          >
            <RefreshCw className={cn("h-4 w-4", loadingBalance && "animate-spin")} />
          </button>
        </div>
      )}

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
          <Sparkles className="h-4 w-4 text-yellow-500" />
          Use EIP-7702 (Gasless)
        </label>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {mode === "send-eth" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
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
                Amount (ETH)
              </label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.001"
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  "text-gray-900 placeholder:text-gray-400"
                )}
              />
            </div>
          </>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={() => mode === "send-eth" ? handleSendEth() : handleMintNft()}
        disabled={loading || (mode === "send-eth" && !recipient)}
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
            {mode === "send-eth" ? "Sending..." : "Minting..."}
          </>
        ) : (
          <>
            {mode === "send-eth" ? (
              <>
                <Send className="h-4 w-4" />
                Send {isGasless ? "Gasless " : ""}ETH
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Mint {isGasless ? "Gasless " : ""}NFT
              </>
            )}
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
            <span className="text-sm text-green-700 font-medium">
              {mode === "send-eth" ? "ETH sent successfully" : "NFT minted successfully!"}
            </span>
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
          {mode === "mint-nft" && (
            <div className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-700">
                NFT minted to your wallet!
              </p>
              <p className="text-xs text-blue-600 mt-1">Balance will update in a few seconds...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
