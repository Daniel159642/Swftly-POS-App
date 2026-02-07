import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { drainPendingWrites } from '../services/offlineSync'
import { countPendingWrites } from '../services/localDb'

const OfflineContext = createContext(null)

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const queryClient = useQueryClient()

  const refreshPendingCount = useCallback(async () => {
    const n = await countPendingWrites()
    setPendingCount(n)
  }, [])

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      setIsSyncing(true)
      try {
        const result = await drainPendingWrites({
          onSuccess: () => refreshPendingCount()
        })
        if (result.sent > 0) {
          queryClient.invalidateQueries({ queryKey: ['inventory'] })
          queryClient.invalidateQueries({ queryKey: ['orders'] })
        }
      } finally {
        await refreshPendingCount()
        setIsSyncing(false)
      }
    }

    const handleOffline = () => setIsOnline(false)

    const handlePendingAdded = () => refreshPendingCount()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('pending-write-added', handlePendingAdded)
    refreshPendingCount()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('pending-write-added', handlePendingAdded)
    }
  }, [queryClient, refreshPendingCount])

  const value = {
    isOnline,
    isSyncing,
    pendingCount,
    refreshPendingCount
  }

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
}

export function useOffline() {
  const ctx = useContext(OfflineContext)
  return ctx || { isOnline: true, isSyncing: false, pendingCount: 0, refreshPendingCount: () => {} }
}
