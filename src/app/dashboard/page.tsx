/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatEther, Address, isAddress } from "viem";
import { useAccount, useDisconnect, usePublicClient } from "wagmi";

export const dynamic = 'force-dynamic';
import {
  FileSignature,
  Send,
  Wallet,
  Copy,
  LogOut,
  Loader2,
  Check,
  Upload,
  Key
} from "lucide-react";
import { cn } from "../lib/utils";
import { SigningTest } from "../components/SigningTest";
import { SendTransactionTest } from "../components/SendTransactionTest";
import { ExportWalletModal } from "../components/ExportWalletModal";
import { ExportPrivateKeyModal } from "../components/ExportPrivateKeyModal";
import { ChainSelector } from "../components/ChainSelector";

type ActiveTab = "signing" | "transaction";

const tabs = [
  { id: "signing" as const, name: "Sign Message", icon: FileSignature },
  { id: "transaction" as const, name: "Send Transaction", icon: Send },
];

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("signing");
  const [balance, setBalance] = useState<string>("0");
  const [copied, setCopied] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showExportPrivateKeyModal, setShowExportPrivateKeyModal] = useState(false);

  // Wagmi hooks
  const { address, status, chain } = useAccount();
  const publicClient = usePublicClient({chainId: chain?.id});
  const {disconnectAsync: logout} = useDisconnect();


  useEffect(() => {
    const loadBalance = async () => {
      if (address && isAddress(address)) {
        try {
          if (!publicClient) return;
          const balanceWei = await publicClient.getBalance({ address: address as Address });
          setBalance(formatEther(balanceWei));
        } catch (err) {
          console.error("Dashboard: Failed to load balance:", err);
          setBalance("0");
        }
      }
    };
    loadBalance();
  }, [address, chain, publicClient]);

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
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

  // Show loading while connecting or reconnecting
  if (status === 'connecting' || status === 'reconnecting' || !address) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="text-sm text-gray-600">
            {status === 'reconnecting' ? 'Reconnecting...' : 'Loading wallet...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <ExportWalletModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
      <ExportPrivateKeyModal isOpen={showExportPrivateKeyModal} onClose={() => setShowExportPrivateKeyModal(false)} />
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <img
                  src="/images/zerodev-logo.png"
                  alt="ZeroDev Logo"
                  className="w-8 h-8"
                />
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-gray-900 leading-tight">ZeroDev</span>
                  <span className="text-[10px] text-gray-500">By Offchain Labs</span>
                </div>
                <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full font-medium border border-blue-100">
                  Wallet Demo
                </span>
              </div>

              {/* Wallet Address & Actions */}
              <div className="flex items-center gap-3">
                <ChainSelector />
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 group cursor-pointer">
                  <Wallet className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-mono text-gray-700">{formatAddress(address)}</span>
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowExportModal(true)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    "border border-gray-200 text-gray-700 hover:bg-gray-50",
                    "flex items-center gap-2"
                  )}
                  title="Export Seed Phrase"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Seed Phrase</span>
                </button>
                <button
                  onClick={() => setShowExportPrivateKeyModal(true)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    "border border-gray-200 text-gray-700 hover:bg-gray-50",
                    "flex items-center gap-2"
                  )}
                  title="Export Private Key"
                >
                  <Key className="h-4 w-4" />
                  <span className="hidden sm:inline">Private Key</span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <span className="font-mono text-xs sm:text-sm break-all">{address}</span>
              <button
                onClick={handleCopy}
                className="text-gray-400 hover:text-gray-600 shrink-0"
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
            <p className="text-sm text-gray-500 mt-1">{chain?.name} Testnet</p>
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
                        "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200",
                        isActive
                          ? "text-gray-900 underline decoration-2 decoration-blue-600 underline-offset-8"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
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
