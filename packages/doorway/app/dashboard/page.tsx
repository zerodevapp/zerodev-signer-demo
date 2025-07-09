'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTurnkey } from '@turnkey/sdk-react';
import { Session as TurnkeySession } from '@turnkey/sdk-browser';
import { useForm } from 'react-hook-form';
import { TGetAuthenticatorsResponse } from '@turnkey/sdk-browser/dist/__generated__/sdk_api_types';
import {
  Address,
  createPublicClient,
  formatEther,
  Hex,
  http,
  parseEther,
  parseGwei,
  serializeTransaction,
  TransactionSerializable,
} from 'viem';
import { sepolia } from 'viem/chains';

import { useAuthMiddleware } from '../hooks/useAuthMiddleware';
import { useTransactionDialog } from '../contexts/TransactionDialogContext';

type AddPasskeyFormData = {
  authenticatorName: string;
};

type SendTransactionFormData = {
  to: string;
  data: string;
  value: string;
};

type Status = 'idle' | 'in_progress' | 'success' | 'error';

const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
});

function useEthBalance(address: Address | undefined) {
  const [balance, setBalance] = useState<bigint>(BigInt(0));

  useEffect(() => {
    async function fetchBalance() {
      if (!address) {
        return;
      }

      try {
        const fetchedBalance = await sepoliaClient.getBalance({ address });
        setBalance(fetchedBalance);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance(BigInt(0));
      }
    }

    fetchBalance();
  }, [address]);

  return balance;
}

export default function Dashboard() {
  const { isLoading } = useAuthMiddleware(true);
  const { turnkey, passkeyClient, authIframeClient, indexedDbClient, client } =
    useTurnkey();
  const { register: registerFormField, handleSubmit } =
    useForm<AddPasskeyFormData>();
  const {
    register: registerSendTransactionFormField,
    handleSubmit: handleSendTransactionSubmit,
  } = useForm<SendTransactionFormData>();

  const { openDialog } = useTransactionDialog();

  const [status, setStatus] = useState<Status>('idle');
  const [session, setSession] = useState<TurnkeySession | undefined>(undefined);

  const [whoami, setWhoami] = useState<
    { userId: string; username: string; organizationId: string } | undefined
  >(undefined);
  const [authenticators, setAuthenticators] = useState<
    TGetAuthenticatorsResponse | undefined
  >(undefined);
  const [wallets, setWallets] = useState<any>(undefined);
  const [walletAccounts, setWalletAccounts] = useState<any>(undefined);

  // assuming just using the first wallet and account for simplicity
  const address: Address | undefined = useMemo(
    () => walletAccounts?.[0].accounts?.[0].address,
    [walletAccounts]
  );

  const balance = useEthBalance(address);

  const logout = useCallback(async () => {
    await turnkey?.logout();
    await indexedDbClient?.clear();

    location.href = '/auth';
  }, [turnkey, indexedDbClient]);

  useEffect(() => {
    async function updateSession() {
      if (turnkey) {
        const _session = await turnkey.getSession();

        if (Date.now() >= _session.expiry) {
          await logout();
        } else {
          setSession(await turnkey.getSession());
        }
      }
    }

    updateSession();
  }, [turnkey, logout]);

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

  async function sendTransaction({ to, data, value }: SendTransactionFormData) {
    const transaction: TransactionSerializable = {
      chainId: 11155111,
      maxFeePerGas: parseGwei('0.1'),
      maxPriorityFeePerGas: parseGwei('0.1'),
      to: to as Address,
      data: (data as Hex) || '0x',
      value: parseEther(value),
      nonce: await sepoliaClient.getTransactionCount({ address }),
    };
    transaction.gas = await sepoliaClient.estimateGas(transaction);

    if (!(await openDialog(transaction))) {
      return;
    }

    const unsignedTransaction = serializeTransaction(transaction);

    const { signedTransaction } = await client.signTransaction({
      type: 'TRANSACTION_TYPE_ETHEREUM',
      unsignedTransaction,
      signWith: address,
    });

    const hash = await sepoliaClient.sendRawTransaction({
      serializedTransaction: `0x${signedTransaction}`,
    });

    window.open(`https://sepolia.etherscan.io/tx/${hash}`, '_blank');
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
        <span>-</span>
        <span>Session: {client?.authClient?.toUpperCase()}</span>
        <span>Session Type: {session.sessionType}</span>
        <span>Session Expiry: {new Date(session.expiry).toLocaleString()}</span>

        <div className="flex flex-row justify-end mt-2">
          <button
            onClick={logout}
            className="bg-white text-blue-600 hover:text-white min-w-32 hover:border-blue-700 rounded-md py-1 px-2 border-2 border-blue-600 cursor-pointer hover:bg-blue-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="flex flex-col items-start">
        <h3 className="text-lg font-bold">Passkeys</h3>
        {authenticators?.authenticators.length === 0 ? (
          <div className="flex flex-col gap-2 w-full">
            <div>You haven't added a Passkey yet.</div>
            <form
              className="flex flex-col w-full gap-2"
              onSubmit={handleSubmit(addPasskey)}
            >
              <input
                {...registerFormField('authenticatorName')}
                placeholder="Enter passkey name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex flex-row justify-end">
                <button
                  disabled={status === 'in_progress'}
                  type="submit"
                  className="bg-blue-600 hover:border-blue-700 min-w-32 text-white rounded-md py-1 px-2 border-2 border-blue-600 cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  Add Passkey
                </button>
              </div>
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
          <div className="flex flex-col">
            <span>
              {' '}
              * {wallets[0].walletName} ({wallets[0].walletId})
            </span>
            <div className="pl-4">
              <span>
                * Default Wallet Account (
                {walletAccounts[0].accounts[0].walletAccountId})
              </span>
              <div className="pl-4 flex flex-col">
                <span>* Address: {walletAccounts[0].accounts[0].address}</span>
                <span>
                  * Balance: {`${formatEther(balance)} ETH (on Sepolia)`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-start">
        <h3 className="text-lg font-bold">Send Transaction</h3>

        <form
          className="flex flex-col w-full gap-2"
          onSubmit={handleSendTransactionSubmit(sendTransaction)}
        >
          <input
            {...registerSendTransactionFormField('to')}
            placeholder="Enter to address"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            {...registerSendTransactionFormField('data')}
            placeholder="Enter calldata (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            {...registerSendTransactionFormField('value')}
            placeholder="Enter callvalue in ETH"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex flex-row justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:border-blue-700 min-w-32 text-white rounded-md py-1 px-2 border-2 border-blue-600 cursor-pointer hover:bg-blue-700 transition-colors"
            >
              Send Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
