/**
 * Custom hooks for offline functionality
 */

import { useState, useEffect } from 'react';
import { offlineQueue } from '@/lib/offline-queue';
import { syncService } from '@/lib/sync-service';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to track online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook to track pending sync items
 */
export function usePendingSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const updatePendingCount = async () => {
      const count = await offlineQueue.getPendingCount();
      setPendingCount(count);
    };

    // Update immediately
    updatePendingCount();

    // Update every 5 seconds
    const interval = setInterval(updatePendingCount, 5000);

    return () => clearInterval(interval);
  }, []);

  const syncNow = async () => {
    setIsSyncing(true);
    try {
      await offlineQueue.processPendingRequests();
      await syncService.syncAll();
      queryClient.invalidateQueries();
      const count = await offlineQueue.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return { pendingCount, isSyncing, syncNow };
}

/**
 * Hook to initialize offline functionality
 */
export function useOfflineInit() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize database
        const { db } = await import('@/lib/db');
        await db.init();

        // Start auto-sync (every 5 minutes)
        syncService.startAutoSync(5 * 60 * 1000);

        // Do initial sync if online
        if (navigator.onLine) {
          await syncService.syncAll();
        }

        setInitialized(true);
        console.log('✅ Offline functionality initialized');
      } catch (error) {
        console.error('❌ Failed to initialize offline functionality:', error);
      }
    };

    init();

    return () => {
      syncService.stopAutoSync();
    };
  }, []);

  return initialized;
}
