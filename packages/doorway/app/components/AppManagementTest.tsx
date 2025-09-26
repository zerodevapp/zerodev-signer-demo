'use client';

import { useState, useEffect } from 'react';


interface Project {
  id: string;
  name: string;
  chain_id: number;
  team_id?: string;
  user_id?: string;
  created_at: string;
  updated_at?: string;
  deleted?: boolean;
}

interface CreateProjectFormData {
  name: string;
  chain_id: number;
  team_id: string;
  user_id: string;
}

const kmsServerUrl = process.env.NEXT_PUBLIC_KMS_SERVER_URL

export function AppManagementTest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<CreateProjectFormData>({
    name: '',
    chain_id: 1,
    team_id: '',
    user_id: '',
  });
  const [createdProject, setCreatedProject] = useState<Project | null>(null);


  const [manualProject, setManualProject] = useState({
    projectId: '',
  });
  const [showManualInput, setShowManualInput] = useState(false);

  const handleCreateProject = async () => {
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError('');
    setCreatedProject(null);

    try {
      const response = await fetch(`${kmsServerUrl}/api/v1/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          chain_id: formData.chain_id,
          team_id: formData.team_id.trim() || undefined,
          user_id: formData.user_id.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }


      setCreatedProject(data);


      setFormData({ name: '', chain_id: 1, team_id: '', user_id: '' });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (projectId: string) => {

    localStorage.setItem('v2_current_project_id', projectId);
    // Clean up old keys
    localStorage.removeItem('v2_current_app_id');
    localStorage.removeItem('v2_current_api_key');


    alert(`Selected project: ${projectId}\n\nRedirecting to dashboard...`);
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1000);
  };

  const handleManualProjectSelect = () => {
    if (!manualProject.projectId.trim()) {
      setError('Project ID is required');
      return;
    }


    localStorage.setItem('v2_current_project_id', manualProject.projectId.trim());
    // Clean up old keys
    localStorage.removeItem('v2_current_app_id');
    localStorage.removeItem('v2_current_api_key');


    alert(`Selected manual project: ${manualProject.projectId.trim()}\n\nRedirecting to dashboard...`);
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1000);
  };

  const getCurrentProjectId = () => {
    if (typeof window === 'undefined') {
      return 'No project selected';
    }
    // Check new key first, fall back to old for compatibility
    return localStorage.getItem('v2_current_project_id') ||
           localStorage.getItem('v2_current_app_id') ||
           'No project selected';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Management</h2>
        <p className="text-gray-600 mb-6">
          Create and manage projects for multi-tenant wallet isolation. Each project has its own user namespace,
          meaning the same email can have different wallets for different projects.
        </p>
      </div>

      {/* Current Project Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-blue-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800">Current Project</h3>
            <p className="text-sm text-blue-700 font-mono">{getCurrentProjectId()}</p>
          </div>
        </div>
      </div>

      {/* Create Project Form */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Project</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              id="projectName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="My DeFi Project"
            />
          </div>

          <div>
            <label htmlFor="chainId" className="block text-sm font-medium text-gray-700 mb-2">
              Chain ID
            </label>
            <input
              type="number"
              id="chainId"
              value={formData.chain_id}
              onChange={(e) => setFormData({ ...formData, chain_id: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ethereum Mainnet: 1, Polygon: 137, Arbitrum: 42161
            </p>
          </div>

          <div>
            <label htmlFor="teamId" className="block text-sm font-medium text-gray-700 mb-2">
              Team ID (Optional)
            </label>
            <input
              type="text"
              id="teamId"
              value={formData.team_id}
              onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="team_123"
            />
          </div>

          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
              User ID (Optional)
            </label>
            <input
              type="text"
              id="userId"
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="user_456"
            />
          </div>

          <button
            onClick={handleCreateProject}
            disabled={loading || !formData.name.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating Project...</span>
              </div>
            ) : (
              '🚀 Create Project'
            )}
          </button>
        </div>
      </div>

      {/* Manual Project Input */}
      <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Use Existing Project</h3>
          <button
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
          >
            {showManualInput ? 'Cancel' : 'Enter Project ID'}
          </button>
        </div>

        {showManualInput && (
          <div className="space-y-4">
            <div>
              <label htmlFor="manualProjectId" className="block text-sm font-medium text-gray-700 mb-2">
                Project ID *
              </label>
              <input
                type="text"
                id="manualProjectId"
                value={manualProject.projectId}
                onChange={(e) => setManualProject({ projectId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                placeholder="proj_dk3j4h5k6j7h8"
              />
            </div>

            <button
              onClick={handleManualProjectSelect}
              disabled={!manualProject.projectId.trim()}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              🔗 Use This Project
            </button>
          </div>
        )}

        {!showManualInput && (
          <p className="text-gray-600 text-sm">
            If you already have a Project ID from another source, you can enter it manually here.
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

      {/* Created Project Success */}
      {createdProject && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-green-800">Project Created Successfully!</h3>
              <div className="mt-3 space-y-2">
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1">Project ID</label>
                  <div className="font-mono text-xs text-green-600 bg-white p-2 rounded border break-all">
                    {createdProject.id}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1">Project Name</label>
                  <div className="text-xs text-green-600 bg-white p-2 rounded border">
                    {createdProject.name}
                  </div>
                </div>
                <button
                  onClick={() => handleSelectProject(createdProject.id)}
                  className="mt-2 text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Use This Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note about project management */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Project Management</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>After creating a project, you'll get a Project ID that you can use for authentication. Save this ID as you'll need it to configure your application.</p>
            </div>
          </div>
        </div>
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
            <h3 className="text-sm font-medium text-blue-800">How Project-Scoped Wallets Work</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Each project has its own isolated user namespace</li>
                <li>The same email can have different wallets in different projects</li>
                <li>Users are identified by the combination of (email/OAuth + projectId)</li>
                <li>Sub-organizations in Turnkey are named as: project_id-auth_type-timestamp</li>
                <li>No API keys required - authentication is handled internally</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}