'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useZeroDevSignerProvider } from '../hooks/useZeroDevSignerProvider';

export default function V2AuthVerify() {
  const searchParams = useSearchParams();
  const { isLoading, error: sdkError, isReady, auth } = useZeroDevSignerProvider();
  const [verificationState, setVerificationState] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    async function tryLoginWithBundle() {
      if (isReady) {
        const bundle = searchParams.get('bundle')
        if (!bundle) {
          setVerificationState('error');
          setErrorMessage('No authentication bundle found in URL');
          return;
        }
        
        // Small delay to ensure SDK is fully ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          await auth({
            type: "email",
            bundle,
          });

          setVerificationState('success');
          
          setTimeout(() => {
            location.href = '/dashboard';
          }, 2000);
        } catch(error) {
          console.log(error);
          setVerificationState('error');
          setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
        }
      }
    }

    if (isReady) {
      tryLoginWithBundle();
    }
  }, [isReady]);

  // SDK is still loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Initializing SDK</h2>
          <p className="text-gray-600">Setting up authentication...</p>
        </div>
      </div>
    );
  }

  // SDK error
  if (sdkError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">SDK Error</h2>
          <p className="text-gray-600 mb-4">{sdkError}</p>
          <button 
            onClick={() => location.href = '/dashboard'}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {verificationState === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Magic Link</h2>
            <p className="text-gray-600">Processing your authentication...</p>
          </>
        )}

        {verificationState === 'success' && (
          <>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Successful!</h2>
            <p className="text-gray-600 mb-4">Redirecting you to the dashboard...</p>
            <div className="text-sm text-gray-500">You will be redirected automatically in 2 seconds</div>
          </>
        )}

        {verificationState === 'error' && (
          <>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <button 
              onClick={() => location.href = '/dashboard'}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Return to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}