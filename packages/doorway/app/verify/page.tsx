'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTurnkey } from '@turnkey/sdk-react';

export default function V2AuthVerify() {
  const searchParams = useSearchParams();
  const { authIframeClient } = useTurnkey();

  useEffect(() => {
    async function tryLoginWithBundle() {
      if (authIframeClient) {
        await authIframeClient.loginWithBundle({
          bundle: searchParams.get('bundle'),
        });

        // Set completion flag for the test interface
        localStorage.setItem('v2_auth_completed', 'true');
        
        // Redirect back to test interface
        location.href = '/';
      }
    }

    tryLoginWithBundle();
  }, [authIframeClient, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Magic Link</h2>
        <p className="text-gray-600">Processing your authentication...</p>
      </div>
    </div>
  );
}