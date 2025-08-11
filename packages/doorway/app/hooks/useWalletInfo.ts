import { useState, useEffect } from 'react';
import { useTurnkey } from '@turnkey/sdk-react';

export function useWalletInfo() {
  const { client } = useTurnkey();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [subOrganizationId, setSubOrganizationId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWalletInfo() {
      if (!client) {
        setLoading(false);
        return;
      }

      try {
        // Get user information
        const whoAmI = await client.getWhoami();

        setSubOrganizationId(whoAmI.organizationId);
        console.log("subOrganizationId", whoAmI.organizationId)
        
        // Get wallets for the user
        const walletsResponse = await client.getWallets({organizationId: whoAmI.organizationId});
        
        if (walletsResponse.wallets.length > 0) {
          // Get accounts for the first wallet
          const firstWallet = walletsResponse.wallets[0];
          const accountsResponse = await client.getWalletAccounts({ 
            walletId: firstWallet.walletId 
          });
          
          if (accountsResponse.accounts.length > 0) {
            // Use the first account's address
            setWalletAddress(accountsResponse.accounts[0].address);
          } else {
            setError('No accounts found in wallet');
          }
        } else {
          setError('No wallets found for user');
        }
      } catch (err) {
        console.error('Error fetching wallet info:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch wallet info');
      } finally {
        setLoading(false);
      }
    }

    fetchWalletInfo();
  }, [client]);

  return { walletAddress, subOrganizationId, loading, error };
}