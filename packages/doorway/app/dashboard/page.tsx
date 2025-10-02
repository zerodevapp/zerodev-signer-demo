"use client";

import { useState } from "react";
import { EmailAuthTest } from "../components/EmailAuthTest";
import { OAuthTest } from "../components/OAuthTest";
import PasskeyAuthTest from "../components/PasskeyAuthTest";
import { SigningTest } from "../components/SigningTest";
import { SendTransactionTest } from "../components/SendTransactionTest";

type ActiveTab = "email" | "oauth" | "passkey" | "signing" | "send transaction";

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
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: "email", name: "Email Auth", icon: "📧" },
                { id: "oauth", name: "OAuth Auth", icon: "🔐" },
                { id: "passkey", name: "Passkey Auth", icon: "🔑" },
                { id: "signing", name: "Payload Signing", icon: "✍️" },
                {
                  id: "send transaction",
                  name: "Send Transaction",
                  icon: "💰",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "email" && <EmailAuthTest />}
            {activeTab === "oauth" && <OAuthTest />}
            {activeTab === "passkey" && <PasskeyAuthTest />}
            {activeTab === "signing" && <SigningTest />}
            {activeTab === "send transaction" && <SendTransactionTest/>}
          </div>
        </div>
      </div>
    </div>
  )
}
