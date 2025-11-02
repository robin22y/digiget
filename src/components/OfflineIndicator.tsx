import { useState, useEffect } from 'react';
import { WifiOff, Wifi, AlertCircle } from 'lucide-react';
import { isOnline, getSyncStatus } from '../lib/offlineSync';

export function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      // Check sync status after coming online (give it time for DB to be ready)
      setTimeout(() => {
        getSyncStatus().then(status => {
          setPendingCount(status.pending);
        }).catch(() => {
          // Silently ignore errors - component will retry on next interval
        });
      }, 1000);
    };

    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check with delay to allow DB initialization
    setTimeout(() => {
      getSyncStatus().then(status => {
        setPendingCount(status.pending);
      }).catch(() => {
        // Silently ignore errors - component will retry on next interval
      });
    }, 500);

    // Check periodically (start after initial delay)
    const interval = setInterval(() => {
      getSyncStatus().then(status => {
        setPendingCount(status.pending);
      }).catch(() => {
        // Silently ignore errors and continue checking
      });
    }, 5000); // Every 5 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (online && pendingCount === 0) {
    return null; // Don't show if online and nothing pending
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 ${
        online ? 'bg-blue-600' : 'bg-orange-600'
      } text-white rounded-lg shadow-lg p-3 min-w-[200px] max-w-[300px]`}
      onClick={() => setShowDetails(!showDetails)}
      style={{ cursor: 'pointer' }}
    >
      <div className="flex items-center gap-2">
        {online ? (
          <>
            <Wifi className="w-5 h-5" />
            <div className="flex-1">
              <div className="text-sm font-semibold">Online</div>
              {pendingCount > 0 && (
                <div className="text-xs opacity-90">
                  {pendingCount} entry{pendingCount !== 1 ? 'ies' : 'y'} pending sync
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5" />
            <div className="flex-1">
              <div className="text-sm font-semibold">Offline Mode</div>
              <div className="text-xs opacity-90">
                Clock entries will sync when connection is restored
              </div>
            </div>
          </>
        )}
      </div>

      {showDetails && (
        <div className="mt-2 pt-2 border-t border-white/20 text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              {online ? (
                <p>Your clock entries are being synced to the server.</p>
              ) : (
                <p>
                  You're currently offline. Clock in/out will still work - your
                  entries will be saved locally and synced automatically when
                  you're back online.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
