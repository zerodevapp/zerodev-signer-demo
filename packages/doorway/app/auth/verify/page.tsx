'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTurnkey } from '@turnkey/sdk-react';

export default function AuthVerify() {
  const searchParams = useSearchParams();
  const { authIframeClient } = useTurnkey();

  useEffect(() => {
    async function tryLoginWithBundle() {
      if (authIframeClient) {
        await authIframeClient.loginWithBundle({
          bundle: searchParams.get('bundle'),
        });

        // Turnkey doesn't play well with client-side routing, so we gotta refresh
        location.href = '/dashboard';
      }
    }

    tryLoginWithBundle();
  }, [authIframeClient]);

  return <span>...</span>;
}
