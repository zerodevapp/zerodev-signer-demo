"use client";

import { AppManagementTest } from "../components/AppManagementTest";

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-3xl font-bold">Doorway SDK Setup</h1>
            <p className="text-blue-100 mt-2">
              Create or select an app to get started with Doorway authentication
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            <AppManagementTest />
          </div>
        </div>
      </div>
    </div>
  );
}