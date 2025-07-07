'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTurnkey } from '@turnkey/sdk-react';

export function useAuthMiddleware(requireAuth: boolean = true) {
  const router = useRouter();
  const { turnkey } = useTurnkey();
  const [isLoading, setIsLoading] = useState(true);

  const isTurnkeyReady = useMemo(
    () => typeof turnkey !== 'undefined',
    [turnkey]
  );

  useEffect(() => {
    async function check() {
      try {
        if (!isTurnkeyReady) {
          return;
        }

        const session = await turnkey.getSession();
        const hasSession = typeof session !== 'undefined';

        console.log({ session });

        if (requireAuth && !hasSession) {
          router.push('/auth');
          return;
        }

        if (!requireAuth && hasSession) {
          router.push('/dashboard');
          return;
        }

        // only set loading to false if we're not redirecting
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);

        if (requireAuth) {
          router.push('/auth');
        }
      }
    }

    check();
  }, [isTurnkeyReady, turnkey, router, requireAuth]);

  if (!isTurnkeyReady) {
    return { isLoading: true };
  }

  return { isLoading };
}
