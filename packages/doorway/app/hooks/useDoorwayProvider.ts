import { useDoorwayContext } from '../providers/DoorwayProvider'
import type { AuthParams } from '@doorway/core'

export function useDoorwayProvider() {
  const { doorway, isLoading, error } = useDoorwayContext()

  // Helper functions that wrap the SDK methods with error handling
  const auth = async (params: AuthParams) => {
    if (!doorway) {
      throw new Error('Doorway SDK not initialized')
    }
    return await doorway.auth(params)
  }

  const getPublicKeys = async () => {
    if (!doorway) {
      throw new Error('Doorway SDK not initialized')
    }
    return await doorway.getPublicKeys()
  }

  const getSession = async () => {
    if (!doorway) {
      throw new Error('Doorway SDK not initialized')
    }
    return await doorway.getSession()
  }

  const refreshSession = async () => {
    if (!doorway) {
      throw new Error('Doorway SDK not initialized')
    }
    return await doorway.refreshSession()
  }

  const logout = async () => {
    if (!doorway) {
      throw new Error('Doorway SDK not initialized')
    }
    return await doorway.logout()
  }

  const toAccount = async () => {
    if (!doorway) {
      throw new Error('Doorway SDK not initialized')
    }
    return await doorway.toAccount()
  }

  return {
    // Raw SDK instance (for advanced usage)
    doorway,
    
    // State
    isLoading,
    error,
    isReady: !isLoading && !error && !!doorway,
    
    auth,
    getPublicKeys,
    getSession,
    refreshSession,
    logout,
    toAccount
  }
}

export type UseDoorwayProviderReturn = ReturnType<typeof useDoorwayProvider>