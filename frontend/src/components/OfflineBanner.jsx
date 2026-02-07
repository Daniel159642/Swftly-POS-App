import { useOffline } from '../contexts/OfflineContext'

export default function OfflineBanner() {
  const { isOnline, isSyncing, pendingCount } = useOffline()

  if (isOnline && !isSyncing && pendingCount === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 52,
        left: 0,
        right: 0,
        zIndex: 999,
        padding: '8px 16px',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        backgroundColor: isOnline ? '#2563eb' : '#b91c1c',
        color: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}
    >
      {!isOnline && <span>You're offline. Changes will sync when you reconnect.</span>}
      {isOnline && isSyncing && <span>Syncing...</span>}
      {isOnline && !isSyncing && pendingCount > 0 && (
        <span>{pendingCount} change(s) waiting to sync.</span>
      )}
    </div>
  )
}
