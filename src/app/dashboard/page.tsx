"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPublicClient, http, formatEther, Address, isAddress } from "viem";
import { sepolia } from "viem/chains";
import {
  FileSignature,
  Send,
  Wallet,
  Copy,
  LogOut,
  Loader2,
  Check,
  Upload
} from "lucide-react";
import { cn } from "../lib/utils";
import { SigningTest } from "../components/SigningTest";
import { SendTransactionTest } from "../components/SendTransactionTest";
import { SessionExpiryWarning } from "../components/SessionExpiryWarning";
import { ExportWalletModal } from "../components/ExportWalletModal";
import { useZeroDevWalletProvider } from "../hooks/useZeroDevWalletProvider";

type ActiveTab = "signing" | "transaction";

const tabs = [
  { id: "signing" as const, name: "Sign Message", icon: FileSignature },
  { id: "transaction" as const, name: "Send Transaction", icon: Send },
];

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("signing");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [balance, setBalance] = useState<string>("0");
  const [copied, setCopied] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const { getSession, toAccount, logout, isReady } = useZeroDevWalletProvider();

  useEffect(() => {
    const loadSession = async () => {
      // Wait for SDK to be ready first
      if (!isReady) {
        console.log("Dashboard: SDK not ready yet, waiting...");
        return;
      }

      try {
        console.log("Dashboard: SDK ready, loading session...");
        const session = await getSession();
        console.log("Dashboard: Session result:", session);

        if (!session) {
          console.log("Dashboard: No session found, redirecting to login");
          setTimeout(() => router.push("/"), 100);
          return;
        }

        console.log("Dashboard: Session found, loading account...");

        // Get wallet address from account
        const account = await toAccount();
        console.log("Dashboard: Account loaded:", account.address);
        setWalletAddress(account.address);
      } catch (err) {
        console.error("Dashboard: Failed to load session/account:", err);
        setTimeout(() => router.push("/"), 100);
      }
    };
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, getSession, toAccount, router]);

  useEffect(() => {
    const loadBalance = async () => {
      if (walletAddress && isAddress(walletAddress)) {
        try {
          const publicClient = createPublicClient({
            chain: sepolia,
            transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
          });
          const balanceWei = await publicClient.getBalance({ address: walletAddress as Address });
          setBalance(formatEther(balanceWei));
        } catch (err) {
          console.error("Dashboard: Failed to load balance:", err);
          setBalance("0");
        }
      }
    };
    loadBalance();
  }, [walletAddress]);

  const handleCopy = async () => {
    if (!walletAddress) return;
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isReady || !walletAddress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="text-sm text-gray-600">
            {!isReady ? "Initializing SDK..." : "Loading wallet..."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <SessionExpiryWarning />
      <ExportWalletModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <svg
                  className="w-7 h-7 text-gray-900"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 22V12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 7L12 12L2 7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-lg font-semibold text-gray-900">ZeroDev Wallet</span>
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                  Demo
                </span>
              </div>

              {/* Wallet Address & Actions */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 group cursor-pointer">
                  <Wallet className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-mono text-gray-700">{formatAddress(walletAddress)}</span>
                  <button
                    onClick={handleCopy}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Wallet Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-gray-700" />
                <h1 className="text-lg font-semibold text-gray-900">Default Wallet</h1>
              </div>
              <button
                onClick={() => setShowExportModal(true)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  "border border-gray-200 text-gray-700 hover:bg-gray-50",
                  "flex items-center gap-2"
                )}
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <span className="font-mono text-xs sm:text-sm break-all">{walletAddress}</span>
              <button
                onClick={handleCopy}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                title="Copy address"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{parseFloat(balance).toFixed(4)}</span>
              <span className="text-lg text-gray-500 font-medium">ETH</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Sepolia Testnet</p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 border-b-2",
                        isActive
                          ? "border-gray-900 text-gray-900 bg-gray-50"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
              {activeTab === "signing" && <SigningTest />}
              {activeTab === "transaction" && <SendTransactionTest />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
