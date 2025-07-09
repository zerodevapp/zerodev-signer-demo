'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTurnkey } from '@turnkey/sdk-react';
import { useForm } from 'react-hook-form';
import { TGetAuthenticatorsResponse } from '@turnkey/sdk-browser/dist/__generated__/sdk_api_types';

import { useAuthMiddleware } from '../hooks/useAuthMiddleware';

type AddPasskeyFormData = {
  authenticatorName: string;
};

type Status = 'idle' | 'in_progress' | 'success' | 'error';

export default function Dashboard() {
  const router = useRouter();
  const { isLoading } = useAuthMiddleware(true);
  const { turnkey, passkeyClient, authIframeClient, indexedDbClient, client } =
    useTurnkey();
  const { register: registerFormField, handleSubmit } =
    useForm<AddPasskeyFormData>();

  const [status, setStatus] = useState<Status>('idle');

  const [whoami, setWhoami] = useState<
    { userId: string; username: string; organizationId: string } | undefined
  >(undefined);
  const [authenticators, setAuthenticators] = useState<
    TGetAuthenticatorsResponse | undefined
  >(undefined);
  const [wallets, setWallets] = useState<any>(undefined);
  const [walletAccounts, setWalletAccounts] = useState<any>(undefined);

  useEffect(() => {
    async function init() {
      if (!client) {
        return;
      }

      try {
        const _whoami = await client.getWhoami();
        const _wallets = await client.getWallets();
        const _walletsAccs = await Promise.all(
          _wallets.wallets.map((wallet) =>
            client.getWalletAccounts({ walletId: wallet.walletId })
          )
        );
        const _au = await client.getAuthenticators({ userId: _whoami.userId });

        setWhoami(_whoami);
        setWallets(_wallets.wallets);
        setWalletAccounts(_walletsAccs);
        setAuthenticators(_au);
      } catch (error) {
        // expired key
        if (error.code === 7 || error.code === 16) {
          await logout();
        } else {
          alert(error);
        }
      }
    }

    init();
  }, [client]);

  function createPasskey(name: string) {
    return passkeyClient.createUserPasskey({
      publicKey: {
        rp: {
          name,
        },
        user: {
          name: whoami.username,
          displayName: whoami.username,
        },
      },
    });
  }

  async function addPasskey({ authenticatorName }: AddPasskeyFormData) {
    setStatus('in_progress');

    const session = await turnkey.getSession();
    const credential = await createPasskey(authenticatorName);

    try {
      await authIframeClient.createAuthenticators({
        authenticators: [
          {
            authenticatorName,
            challenge: credential.encodedChallenge,
            attestation: credential.attestation,
          },
        ],
        userId: session.userId,
        organizationId: session.organizationId,
      });

      setStatus('success');
      setAuthenticators(
        await authIframeClient.getAuthenticators({
          userId: session.userId,
        })
      );
    } catch (err) {
      setStatus('error');
      alert(err);
    }
  }

  async function logout() {
    await turnkey.logout();
    router.push('/auth/login');
  }

  if (isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-50 p-4 gap-4 min-w-[640px]">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Doorway Dashboard
      </h1>
      <div className="flex flex-col">
        <h3 className="text-lg font-bold">Information</h3>
        <span>Turnkey Email: {whoami?.username}</span>
        <span>Turnkey User Id: {whoami?.userId}</span>
        <span>Turnkey Sub-organization Id: {whoami?.organizationId}</span>
        <span>Authenticated via: {client?.authClient?.toUpperCase()}</span>
      </div>
      <div className="flex flex-col items-start">
        <h3 className="text-lg font-bold">Passkeys</h3>
        {authenticators?.authenticators.length === 0 ? (
          <div className="flex flex-col gap-2">
            <div>You haven't added a Passkey yet.</div>
            <form
              className="flex flex-row gap-2"
              onSubmit={handleSubmit(addPasskey)}
            >
              <input
                {...registerFormField('authenticatorName')}
                placeholder="Enter passkey name"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                disabled={status === 'in_progress'}
                type="submit"
                className="bg-blue-600 hover:border-blue-700 min-w-32 text-white rounded-md py-1 px-2 border-2 border-blue-600 cursor-pointer hover:bg-blue-700 transition-colors"
              >
                Add Passkey
              </button>
            </form>
          </div>
        ) : (
          <ul>
            {authenticators?.authenticators.map((authenticator) => (
              <li key={authenticator.authenticatorId}>
                <span>* {authenticator.authenticatorName}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-col items-start">
        <h3 className="text-lg font-bold">Wallets</h3>
        {wallets && (
          <ul>
            {wallets.map((wallet, index) => (
              <li key={wallet.walletId}>
                * {wallet.walletName} ({wallet.walletId})
                <ul className="pl-4">
                  <li>* Imported: {wallet.imported ? 'Yes' : 'No'}</li>
                  <li>* Exported: {wallet.exported ? 'Yes' : 'No'}</li>
                  <li>
                    * Accounts:{' '}
                    {walletAccounts[index].accounts
                      .map((account) => account.address)
                      .join(', ')}
                  </li>
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-col items-start">
        <h3 className="text-lg font-bold">Other</h3>
        <button
          onClick={logout}
          className="bg-white text-blue-600 hover:text-white min-w-32 hover:border-blue-700 rounded-md py-1 px-2 border-2 border-blue-600 cursor-pointer hover:bg-blue-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
