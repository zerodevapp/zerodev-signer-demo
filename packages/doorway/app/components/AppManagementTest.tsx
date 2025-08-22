'use client';

import { useState, useEffect } from 'react';


interface App {
  appId: string;
  appName: string;
  appDescription?: string;
  createdAt: string;
}

interface CreateAppFormData {
  appName: string;
  appDescription: string;
}

const kmsServerUrl = process.env.NEXT_PUBLIC_KMS_SERVER_URL

export function AppManagementTest() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<CreateAppFormData>({
    appName: '',
    appDescription: '',
  });
  const [createdApp, setCreatedApp] = useState<{
    appId: string;
    apiKey: string;
    appName: string;
  } | null>(null);
  
  
  const [manualApp, setManualApp] = useState({
    appId: '',
    apiKey: '',
  });
  const [showManualInput, setShowManualInput] = useState(false);
  
  
  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      const response = await fetch(`${kmsServerUrl}/api/v1/apps`);
      const data = await response.json();
      
      if (data.success) {
        setApps(data.apps);
      }
    } catch (err) {
      console.error('Failed to load apps:', err);
    }
  };

  const handleCreateApp = async () => {
    if (!formData.appName.trim()) {
      setError('App name is required');
      return;
    }

    setLoading(true);
    setError('');
    setCreatedApp(null);

    try {
      const response = await fetch(`${kmsServerUrl}/api/v1/apps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appName: formData.appName.trim(),
          appDescription: formData.appDescription.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create app');
      }

      
      setCreatedApp({
        appId: data.appId,
        apiKey: data.apiKey,
        appName: data.appName,
      });

      
      setFormData({ appName: '', appDescription: '' });

      
      await loadApps();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectApp = (appId: string, apiKey?: string) => {
    
    localStorage.setItem('v2_current_app_id', appId);
    if (apiKey) {
      localStorage.setItem('v2_current_api_key', apiKey);
    }
    
    
    const app = apps.find(a => a.appId === appId);
    alert(`Selected app: ${app?.appName || 'Manual Entry'} (${appId})\n\nRedirecting to dashboard...`);
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1000);
  };

  const handleManualAppSelect = () => {
    if (!manualApp.appId.trim()) {
      setError('App ID is required');
      return;
    }

    
    localStorage.setItem('v2_current_app_id', manualApp.appId.trim());
    if (manualApp.apiKey.trim()) {
      localStorage.setItem('v2_current_api_key', manualApp.apiKey.trim());
    } else {
      localStorage.removeItem('v2_current_api_key');
    }

    
    alert(`Selected manual app: ${manualApp.appId.trim()}\n\nRedirecting to dashboard...`);
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1000);
  };

  const getCurrentAppId = () => {
    if (typeof window === 'undefined') {
      return 'No app selected';
    }
    return localStorage.getItem('v2_current_app_id') || 'No app selected';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">App Management</h2>
        <p className="text-gray-600 mb-6">
          Create and manage apps for multi-tenant wallet isolation. Each app has its own user namespace,
          meaning the same email can have different wallets for different apps.
        </p>
      </div>

      {/* Current App Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-blue-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800">Current App</h3>
            <p className="text-sm text-blue-700 font-mono">{getCurrentAppId()}</p>
          </div>
        </div>
      </div>

      {/* Create App Form */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create New App</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="appName" className="block text-sm font-medium text-gray-700 mb-2">
              App Name *
            </label>
            <input
              type="text"
              id="appName"
              value={formData.appName}
              onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="My DeFi App"
            />
          </div>

          <div>
            <label htmlFor="appDescription" className="block text-sm font-medium text-gray-700 mb-2">
              App Description (Optional)
            </label>
            <textarea
              id="appDescription"
              value={formData.appDescription}
              onChange={(e) => setFormData({ ...formData, appDescription: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="A decentralized finance application..."
            />
          </div>

          <button
            onClick={handleCreateApp}
            disabled={loading || !formData.appName.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating App...</span>
              </div>
            ) : (
              '🚀 Create App'
            )}
          </button>
        </div>
      </div>

      {/* Manual App Input */}
      <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Use Existing App</h3>
          <button
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
          >
            {showManualInput ? 'Cancel' : 'Enter App Details'}
          </button>
        </div>
        
        {showManualInput && (
          <div className="space-y-4">
            <div>
              <label htmlFor="manualAppId" className="block text-sm font-medium text-gray-700 mb-2">
                App ID *
              </label>
              <input
                type="text"
                id="manualAppId"
                value={manualApp.appId}
                onChange={(e) => setManualApp({ ...manualApp, appId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                placeholder="app_dk3j4h5k6j7h8"
              />
            </div>

            <div>
              <label htmlFor="manualApiKey" className="block text-sm font-medium text-gray-700 mb-2">
                API Key (Optional)
              </label>
              <input
                type="password"
                id="manualApiKey"
                value={manualApp.apiKey}
                onChange={(e) => setManualApp({ ...manualApp, apiKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                placeholder="ak_9f8d7s6a5f4d3s2a1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty if no API key authentication is required
              </p>
            </div>

            <button
              onClick={handleManualAppSelect}
              disabled={!manualApp.appId.trim()}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              🔗 Use This App
            </button>
          </div>
        )}
        
        {!showManualInput && (
          <p className="text-gray-600 text-sm">
            If you already have an App ID and API Key from another source, you can enter them manually here.
          </p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Created App Success */}
      {createdApp && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-green-800">App Created Successfully!</h3>
              <div className="mt-3 space-y-2">
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1">App ID</label>
                  <div className="font-mono text-xs text-green-600 bg-white p-2 rounded border break-all">
                    {createdApp.appId}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1">API Key (Save this - it won&apos;t be shown again!)</label>
                  <div className="font-mono text-xs text-green-600 bg-white p-2 rounded border break-all">
                    {createdApp.apiKey}
                  </div>
                </div>
                <button
                  onClick={() => handleSelectApp(createdApp.appId, createdApp.apiKey)}
                  className="mt-2 text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Use This App
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apps List */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Existing Apps</h3>
        
        {apps.length === 0 ? (
          <p className="text-gray-500 text-sm">No apps created yet. Create your first app above!</p>
        ) : (
          <div className="space-y-2">
            {apps.map((app) => (
              <div
                key={app.appId}
                className="bg-white border border-gray-200 rounded-md p-4 hover:border-blue-300 cursor-pointer transition-colors"
                onClick={() => handleSelectApp(app.appId)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{app.appName}</h4>
                    {app.appDescription && (
                      <p className="text-sm text-gray-600 mt-1">{app.appDescription}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2 font-mono">{app.appId}</p>
                  </div>
                  <div className="ml-4">
                    <span className="text-xs text-gray-500">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">How App-Scoped Wallets Work</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Each app has its own isolated user namespace</li>
                <li>The same email can have different wallets in different apps</li>
                <li>Users are identified by the combination of (email/OAuth + appId)</li>
                <li>Sub-organizations in Turnkey are named as: app_id-auth_type-timestamp</li>
                <li>API keys can be used to authenticate app requests</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}