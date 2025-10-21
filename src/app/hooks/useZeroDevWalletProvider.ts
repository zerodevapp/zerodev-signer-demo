import { useZeroDevWalletContext } from '../providers/ZeroDevWalletProvider'
import type { AuthParams } from '@zerodev/wallet-core'
import { exportWallet as exportWalletSdk, createIframeStamper } from '@zerodev/wallet-core'

export function useZeroDevWalletProvider() {
  const { zeroDevWallet, isLoading, error, sessionExpiring, timeRemaining, scheduleSessionExpiration, clearAllTimers } = useZeroDevWalletContext()

  // Helper functions that wrap the SDK methods with error handling
  const auth = async (params: AuthParams) => {
    if (!zeroDevWallet) {
      throw new Error('ZeroDevWallet SDK not initialized')
    }
    const result = await zeroDevWallet.auth(params)

    // After successful auth, schedule session expiration
    try {
      const session = await zeroDevWallet.getSession()
      if (session && scheduleSessionExpiration) {
        console.log('Auth successful, scheduling session expiration')
        await scheduleSessionExpiration(session)
      }
    } catch (err) {
      console.error('Failed to schedule session expiration:', err)
    }

    return result
  }

  const getPublicKey = async () => {
    if (!zeroDevWallet) {
      throw new Error('ZeroDevWallet SDK not initialized')
    }
    return await zeroDevWallet.getPublicKey()
  }

  const getSession = async () => {
    if (!zeroDevWallet) {
      throw new Error('ZeroDevWallet SDK not initialized')
    }
    return await zeroDevWallet.getSession()
  }

  const refreshSession = async (sessionId?: string) => {
    if (!zeroDevWallet) {
      throw new Error('ZeroDevWallet SDK not initialized')
    }
    const newSession = await zeroDevWallet.refreshSession(sessionId)

    // Re-schedule after manual refresh
    if (newSession && scheduleSessionExpiration) {
      console.log('Manual refresh successful, re-scheduling')
      await scheduleSessionExpiration(newSession)
    }

    return newSession
  }

  const logout = async () => {
    if (!zeroDevWallet) {
      throw new Error('ZeroDevWallet SDK not initialized')
    }
    // Clear all timers before logout
    if (clearAllTimers) {
      clearAllTimers()
    }
    return await zeroDevWallet.logout()
  }

  const exportWallet = async (iframeContainerId: string) => {
    if (!zeroDevWallet) {
      throw new Error('ZeroDevWallet SDK not initialized')
    }
    const iframeContainer = document.getElementById(iframeContainerId)
    if (!iframeContainer) {
      throw new Error('Iframe container not found')
    }
    const iframeStamper = await createIframeStamper({
      iframeUrl: "https://export.turnkey.com",
      iframeContainer,
      iframeElementId: "export-wallet-iframe",
    })
    const publicKey = await iframeStamper.init()
    console.log('publicKey', publicKey)
    const { exportBundle, organizationId } = await exportWalletSdk({ wallet: zeroDevWallet, targetPublicKey: publicKey })
    console.log('exportBundle', exportBundle)
    console.log('organizationId', organizationId)

    // Inject export bundle into iframe
    const success = await iframeStamper.injectWalletExportBundle(exportBundle, organizationId);
    if (success !== true) {
      throw new Error("unexpected error while injecting export bundle");
    }
  }

  const toAccount = async () => {
    if (!zeroDevWallet) {
      throw new Error('ZeroDevWallet SDK not initialized')
    }
    return await zeroDevWallet.toAccount()
  }

  return {
    // Raw SDK instance (for advanced usage)
    zeroDevWallet,
    exportWallet,

    // State
    isLoading,
    error,
    isReady: !isLoading && !error && !!zeroDevWallet,
    sessionExpiring,
    timeRemaining,

    // Methods
    auth,
    getPublicKey,
    getSession,
    refreshSession,
    logout,
    toAccount
  }
}

export type UseZeroDevWalletProviderReturn = ReturnType<typeof useZeroDevWalletProvider>