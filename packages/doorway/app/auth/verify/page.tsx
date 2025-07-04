'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTurnkey } from '@turnkey/sdk-react';

export default function AuthVerify() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authIframeClient } = useTurnkey();

  useEffect(() => {
    async function tryLoginWithBundle() {
      if (authIframeClient) {
        await authIframeClient.loginWithBundle({
          bundle: searchParams.get('bundle'),
        });

        router.push('/dashboard');
      }
    }

    tryLoginWithBundle();
  }, [authIframeClient]);

  return <div>Loading...</div>;
}
