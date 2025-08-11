'use client';

import { useState } from 'react';
import { useTurnkey } from '@turnkey/sdk-react';
import {
  Address,
  createPublicClient,
  Hex,
  http,
  parseEther,
  parseGwei,
  serializeTransaction,
  TransactionSerializable} from 'viem';
import { sepolia } from 'viem/chains';
import { useWalletInfo } from '../hooks/useWalletInfo';
import { sendGaslessTransaction } from '../services/gaslessTransaction';


type SendTransactionFormData = {
  to: string;
  data: string;
  value: string;
};

const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
});

export function SendTransactionTest() {
  const [formData, setFormData] = useState<SendTransactionFormData>({
    to: '',
    data: '',
    value: '0',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>(''); 
  const [isGasless, setIsGasless] = useState(false);
  
  const { client } = useTurnkey();
  const { walletAddress, subOrganizationId } = useWalletInfo();
  const isAuthenticated = localStorage.getItem('v2_auth_completed') === 'true';

  const handleSendTransaction = async () => {
    if (!isAuthenticated || !client) {
      setError('No active Turnkey session. Please authenticate first.');
      return;
    }

    if (!formData.to) {
      setError('Please provide a recipient address');
      return;
    }

    if (!walletAddress) {
      setError('No wallet address found. Please authenticate first.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const address = walletAddress as Address;
      
      if (isGasless) {
        // Use gasless transaction via EIP-7702
        const result = await sendGaslessTransaction({
          turnkeyClient: client,
          organizationId: subOrganizationId!,
          fromAddress: address,
          to: formData.to as Address,
          data: (formData.data as Hex) || '0x',
          value: parseEther(formData.value || '0'),
        });

        setResult({
          hash: result.transactionHash,
          explorerUrl: `https://sepolia.etherscan.io/tx/${result.transactionHash}`,
          gasless: true,
        });
      } else {
        // Regular transaction flow via V2 API
        // Build transaction
        const transaction: TransactionSerializable = {
          chainId: 11155111, // Sepolia
          maxFeePerGas: parseGwei('0.1'),
          maxPriorityFeePerGas: parseGwei('0.1'),
          to: formData.to as Address,
          data: (formData.data as Hex) || '0x',
          value: parseEther(formData.value || '0'),
          nonce: await sepoliaClient.getTransactionCount({ address }),
        };

        // Estimate gas
        transaction.gas = await sepoliaClient.estimateGas(transaction);

        const unsignedTransaction = serializeTransaction(transaction);

        // Get stamped request for signing
        const stampResponse = await client.stampSignTransaction({
        // @ts-expect-error: we need parameters in this format
          type: 'ACTIVITY_TYPE_SIGN_TRANSACTION_V2',
          organizationId: subOrganizationId!,
          timestampMs: Date.now().toString(),
          parameters: {
            signWith: walletAddress,
            type: 'TRANSACTION_TYPE_ETHEREUM',
            unsignedTransaction,
          },
        });

        console.log('Transaction stamp response:', stampResponse);

        // Send to our V2 API for signing
        const response = await fetch('http://localhost:3001/api/v1/sign/transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            body: stampResponse?.body,
            stamp: stampResponse?.stamp,
            apiUrl: stampResponse?.url,
            operationType: 'transaction', // Specify that this is transaction signing
          }),
        });

        const data = await response.json();
        console.log('Sign response:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Transaction signing failed');
        }

        // Broadcast the signed transaction
        const hash = await sepoliaClient.sendRawTransaction({
          serializedTransaction: `0x${data.signature}`,
        });

        setResult({
          hash,
          explorerUrl: `https://sepolia.etherscan.io/tx/${hash}`,
          transaction,
        });
      }

    } catch (err) {
      console.error('Transaction error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SendTransactionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Authentication Required</h3>
            <div className="mt-2 text-sm text-yellow-700">
              Please complete authentication (Email or OAuth) to get a session token before testing transactions.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Transaction Test</h2>
        <p className="text-gray-600 mb-6">
          Test sending Ethereum transactions using your authenticated wallet. Transactions are signed client-side 
          using Turnkey and then sent to the Sepolia testnet.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Wallet Info */}
        {walletAddress && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Wallet Information</h3>
            <p className="text-sm text-gray-600 font-mono break-all">
              Address: {walletAddress}
            </p>
            <p className="text-xs text-gray-500 mt-1">Network: Sepolia Testnet</p>
          </div>
        )}

        {/* Gasless Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="gasless"
            checked={isGasless}
            onChange={(e) => setIsGasless(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="gasless" className="text-sm font-medium text-gray-700">
            Send gasless transaction via EIP-7702
          </label>
        </div>

        {/* Transaction Form */}
        <div className="space-y-4">
          <div>
            <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              id="to"
              value={formData.to}
              onChange={(e) => handleInputChange('to', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              placeholder="0x..."
            />
          </div>

          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
              Value (ETH)
            </label>
            <input
              type="text"
              id="value"
              value={formData.value}
              onChange={(e) => handleInputChange('value', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.001"
            />
          </div>

          <div>
            <label htmlFor="data" className="block text-sm font-medium text-gray-700 mb-2">
              Data (Optional)
            </label>
            <textarea
              id="data"
              value={formData.data}
              onChange={(e) => handleInputChange('data', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="0x (leave empty for simple transfer)"
            />
          </div>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendTransaction}
          disabled={loading || !formData.to}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Sending Transaction...</span>
            </div>
          ) : (
            `${isGasless ? '⚡' : '📤'} Send ${isGasless ? 'Gasless ' : ''}Transaction`
          )}
        </button>
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
              <h3 className="text-sm font-medium text-red-800">Transaction Error</h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Result Display */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                {result.gasless ? 'Gasless Transaction Sent!' : 'Transaction Sent!'}
              </h3>
              <div className="mt-3 space-y-2">
                {result.gasless && (
                  <div className="bg-yellow-100 border border-yellow-300 rounded p-2 mb-2">
                    <span className="text-xs font-medium text-yellow-800">
                      ⚡ This was sent as a gasless transaction using EIP-7702
                    </span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-green-700 mb-1">Transaction Hash</label>
                  <div className="font-mono text-xs text-green-600 bg-white p-2 rounded border break-all">
                    {result.hash}
                  </div>
                </div>
                <div>
                  <a
                    href={result.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    View on Etherscan
                    <svg className="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Transaction Process</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Regular transactions are built and estimated using Sepolia testnet</li>
                <li>Signing happens client-side using your Turnkey wallet</li>
                <li>Gas fees are estimated automatically for regular transactions</li>
                <li>Gasless transactions use EIP-7702 delegation for zero gas fees</li>
                <li>All transactions are broadcasted to Sepolia testnet</li>
                <li>You can view transaction details on Etherscan</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}