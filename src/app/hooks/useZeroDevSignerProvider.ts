import { useZeroDevSignerContext } from '../providers/ZeroDevSignerProvider'
import type { AuthParams } from '@zerodev/signer-core'
import { exportWallet as exportWalletSdk, createIframeStamper } from '@zerodev/signer-core'

export function useZeroDevSignerProvider() {
  const { zeroDevSigner, isLoading, error, sessionExpiring, timeRemaining, scheduleSessionExpiration, clearAllTimers } = useZeroDevSignerContext()

  // Helper functions that wrap the SDK methods with error handling
  const auth = async (params: AuthParams) => {
    if (!zeroDevSigner) {
      throw new Error('ZeroDevSigner SDK not initialized')
    }
    const result = await zeroDevSigner.auth(params)

    // After successful auth, schedule session expiration
    try {
      const session = await zeroDevSigner.getSession()
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
    if (!zeroDevSigner) {
      throw new Error('ZeroDevSigner SDK not initialized')
    }
    return await zeroDevSigner.getPublicKey()
  }

  const getSession = async () => {
    if (!zeroDevSigner) {
      throw new Error('ZeroDevSigner SDK not initialized')
    }
    return await zeroDevSigner.getSession()
  }

  const refreshSession = async (sessionId?: string) => {
    if (!zeroDevSigner) {
      throw new Error('ZeroDevSigner SDK not initialized')
    }
    const newSession = await zeroDevSigner.refreshSession(sessionId)

    // Re-schedule after manual refresh
    if (newSession && scheduleSessionExpiration) {
      console.log('Manual refresh successful, re-scheduling')
      await scheduleSessionExpiration(newSession)
    }

    return newSession
  }

  const logout = async () => {
    if (!zeroDevSigner) {
      throw new Error('ZeroDevSigner SDK not initialized')
    }
    // Clear all timers before logout
    if (clearAllTimers) {
      clearAllTimers()
    }
    return await zeroDevSigner.logout()
  }

  const exportWallet = async (iframeContainerId: string) => {
    if (!zeroDevSigner) {
      throw new Error('ZeroDevSigner SDK not initialized')
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
    const { exportBundle, organizationId } = await exportWalletSdk({ signer: zeroDevSigner, targetPublicKey: publicKey })

    // Inject export bundle into iframe
    const success = await iframeStamper.injectWalletExportBundle(exportBundle, organizationId);
    if (success !== true) {
      throw new Error("unexpected error while injecting export bundle");
    }
  }

  const toAccount = async () => {
    if (!zeroDevSigner) {
      throw new Error('ZeroDevSigner SDK not initialized')
    }
    return await zeroDevSigner.toAccount()
  }

  return {
    // Raw SDK instance (for advanced usage)
    zeroDevSigner,
    exportWallet,

    // State
    isLoading,
    error,
    isReady: !isLoading && !error && !!zeroDevSigner,
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

export type UseZeroDevSignerProviderReturn = ReturnType<typeof useZeroDevSignerProvider>