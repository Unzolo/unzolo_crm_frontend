'use client';

/**
 * Offline Provider
 * Initializes offline functionality and provides context
 */

import { createContext, useContext, ReactNode } from 'react';
import { useOfflineInit, useOnlineStatus, usePendingSync } from '@/lib/hooks/use-offline';

interface OfflineContextType {
    isOnline: boolean;
    pendingCount: number;
    isSyncing: boolean;
    syncNow: () => Promise<void>;
    initialized: boolean;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: ReactNode }) {
    const initialized = useOfflineInit();
    const isOnline = useOnlineStatus();
    const { pendingCount, isSyncing, syncNow } = usePendingSync();

    return (
        <OfflineContext.Provider
            value={{
                isOnline,
                pendingCount,
                isSyncing,
                syncNow,
                initialized,
            }}
        >
            {children}
        </OfflineContext.Provider>
    );
}

export function useOffline() {
    const context = useContext(OfflineContext);
    if (context === undefined) {
        throw new Error('useOffline must be used within OfflineProvider');
    }
    return context;
}
