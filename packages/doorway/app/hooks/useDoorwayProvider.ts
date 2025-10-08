import { useDoorwayContext } from '../providers/DoorwayProvider'
import type { AuthParams } from '@doorway/core'

export function useDoorwayProvider() {
  const { doorway, isLoading, error, sessionExpiring, timeRemaining, scheduleSessionExpiration, clearAllTimers } = useDoorwayContext()

  // Helper functions that wrap the SDK methods with error handling
  const auth = async (params: AuthParams) => {
    if (!doorway) {
      throw new Error('Doorway SDK not initialized')
    }
    const result = await doorway.auth(params)

    // After successful auth, schedule session expiration
    try {
      const session = await doorway.getSession()
      if (session && scheduleSessionExpiration) {
        console.log('Auth successful, scheduling session expiration')
        await scheduleSessionExpiration(session)
      }
    } catch (err) {
      console.error('Failed to schedule session expiration:', err)
    }

    return result
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

  const refreshSession = async (sessionId?: string) => {
    if (!doorway) {
      throw new Error('Doorway SDK not initialized')
    }
    const newSession = await doorway.refreshSession(sessionId)

    // Re-schedule after manual refresh
    if (newSession && scheduleSessionExpiration) {
      console.log('Manual refresh successful, re-scheduling')
      await scheduleSessionExpiration(newSession)
    }

    return newSession
  }

  const logout = async () => {
    if (!doorway) {
      throw new Error('Doorway SDK not initialized')
    }
    // Clear all timers before logout
    if (clearAllTimers) {
      clearAllTimers()
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
    sessionExpiring,
    timeRemaining,

    // Methods
    auth,
    getPublicKeys,
    getSession,
    refreshSession,
    logout,
    toAccount
  }
}

export type UseDoorwayProviderReturn = ReturnType<typeof useDoorwayProvider>