'use client';

import { useRouter } from 'next/navigation';
import { useTurnkey } from '@turnkey/sdk-react';

import { useAuthMiddleware } from '../hooks/useAuthMiddleware';

export default function Dashboard() {
  const router = useRouter();
  const { isLoading } = useAuthMiddleware(true);
  const { turnkey } = useTurnkey();

  async function logout() {
    await turnkey.logout();
    router.push('/auth');
  }

  if (isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Doorway Dashboard
      </h1>
      <div className="min-w-[512px]">
        <button
          onClick={logout}
          className="bg-red-500 text-white rounded-md py-1 px-2 cursor-pointer hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
