"use client";

import { useState } from "react";
import { EmailAuthTest } from "../components/EmailAuthTest";
import { OAuthTest } from "../components/OAuthTest";
import { OTPAuthTest } from "../components/OTPAuthTest";
import PasskeyAuthTest from "../components/PasskeyAuthTest";
import { SigningTest } from "../components/SigningTest";
import { SendTransactionTest } from "../components/SendTransactionTest";
import { SessionManagement } from "../components/SessionManagement";

type ActiveTab = "email" | "oauth" | "otp" | "passkey" | "signing" | "send transaction" | "session management";

export default function TestV2Page() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("email");

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Doorway SDK Dashboard</h1>
              <p className="text-blue-100 mt-2">
                Test authentication and signing with Doorway SDK
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/setup'}
              className="bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-md text-sm"
            >
              ⚙️ App Setup
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide">
            <nav className="-mb-px flex space-x-2 px-4 min-w-max">
              {([
                { id: "email", name: "Email Auth", shortName: "Email", icon: "📧" },
                { id: "oauth", name: "OAuth Auth", shortName: "OAuth", icon: "🔐" },
                { id: "otp", name: "OTP Auth", shortName: "OTP", icon: "🔢" },
                { id: "passkey", name: "Passkey Auth", shortName: "Passkey", icon: "🔑" },
                { id: "signing", name: "Payload Signing", shortName: "Signing", icon: "✍️" },
                {
                  id: "send transaction",
                  name: "Send Transaction",
                  shortName: "Transaction",
                  icon: "💰",
                },
                {
                  id: "session management",
                  name: "Session Management",
                  shortName: "Sessions",
                  icon: "🔄",
                },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm flex items-center space-x-1.5 flex-shrink-0`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden md:inline">{tab.name}</span>
                  <span className="md:hidden">{tab.shortName}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "email" && <EmailAuthTest />}
            {activeTab === "oauth" && <OAuthTest />}
            {activeTab === "otp" && <OTPAuthTest />}
            {activeTab === "passkey" && <PasskeyAuthTest />}
            {activeTab === "signing" && <SigningTest />}
            {activeTab === "send transaction" && <SendTransactionTest/>}
            {activeTab === "session management" && <SessionManagement />}
          </div>
        </div>
      </div>
    </div>
  )
}
