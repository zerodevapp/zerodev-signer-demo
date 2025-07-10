'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTurnkey } from '@turnkey/sdk-react';
import { useForm } from 'react-hook-form';

import { useAuthMiddleware } from '../../hooks/useAuthMiddleware';

type Status = 'idle' | 'in_progress' | 'success' | 'error';
type FormData = { email: string };

export default function Login() {
  const { authIframeClient, indexedDbClient, passkeyClient, turnkey } =
    useTurnkey();
  const { isLoading } = useAuthMiddleware(false);
  const { register: registerFormField, handleSubmit } = useForm<FormData>();
  const [status, setStatus] = useState<Status>('idle');

  // Clear IndexedDB on visiting the login page, so there are no conflicting keys
  useEffect(() => {
    async function clearIndexedDb() {
      if (indexedDbClient) {
        await indexedDbClient.clear();
        console.log('IndexedDB cleared');
      }
    }

    clearIndexedDb();
  }, [indexedDbClient]);

  async function loginViaEmail(data: { email: string }) {
    try {
      setStatus('in_progress');

      const response = await fetch('/api/auth/email', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          targetPublicKey: await authIframeClient.getEmbeddedPublicKey(),
        }),
      });

      console.log(response);

      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  }

  async function loginViaPasskey() {
    try {
      await indexedDbClient.init();
      const publicKey = await indexedDbClient.getPublicKey();

      await passkeyClient.loginWithPasskey({
        sessionType: 'SESSION_TYPE_READ_WRITE',
        publicKey,
      });

      const session = await turnkey.getSession();

      if (typeof session === 'undefined') {
        return alert('Session is undefined after login with passkey.');
      }

      // Turnkey doesn't play well with client-side routing, so we gotta refresh
      location.href = '/dashboard';
    } catch (error) {
      alert(error);
    }
  }

  if (isLoading) {
    return null;
  }

  if (status === 'error') {
    return <span>Error.</span>;
  }

  if (status === 'success') {
    return (
      <span>
        We've sent a magic link to your email. Feel free to close this page.
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-md max-w-md w-full">
      <div className="flex flex-col gap-8">
        <h2 className="text-xl font-bold">Login</h2>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(loginViaEmail)}
        >
          <div className="flex flex-col gap-1">
            <label className="text-gray-700">Email</label>
            <input
              {...registerFormField('email')}
              placeholder="Enter your email"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Continue with Email
          </button>
          <button
            type="button"
            onClick={loginViaPasskey}
            className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            Continue with Passkey
          </button>
        </form>
        <span className="text-sm">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-blue-600 underline">
            Register here.
          </Link>
        </span>
      </div>
    </div>
  );
}
