'use client';

/**
 * Offline Status Indicator Component
 * Shows online/offline status and pending sync items
 */

import { useOnlineStatus, usePendingSync } from '@/lib/hooks/use-offline';
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useState, useEffect } from 'react';

export function OfflineIndicator() {
    const isOnline = useOnlineStatus();
    const { pendingCount, isSyncing, syncNow } = usePendingSync();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Don't show if online and no pending items or not mounted
    if (!mounted || (isOnline && pendingCount === 0)) {
        return null;
    }

    return (
        <div
            className={cn(
                'fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-2 shadow-lg transition-all',
                isOnline
                    ? 'bg-blue-500 text-white'
                    : 'bg-orange-500 text-white'
            )}
        >
            {/* Status Icon */}
            <div className="flex items-center gap-2">
                {isOnline ? (
                    <Cloud className="h-5 w-5" />
                ) : (
                    <CloudOff className="h-5 w-5" />
                )}
                <span className="text-sm font-medium">
                    {isOnline ? 'Online' : 'Offline'}
                </span>
            </div>

            {/* Pending Count */}
            {pendingCount > 0 && (
                <>
                    <div className="h-4 w-px bg-white/30" />
                    <span className="text-sm">
                        {pendingCount} pending
                    </span>
                </>
            )}

            {/* Sync Button */}
            {isOnline && pendingCount > 0 && (
                <>
                    <div className="h-4 w-px bg-white/30" />
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-white hover:bg-white/20 hover:text-white"
                        onClick={syncNow}
                        disabled={isSyncing}
                    >
                        <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
                        <span className="ml-1 text-xs">
                            {isSyncing ? 'Syncing...' : 'Sync'}
                        </span>
                    </Button>
                </>
            )}
        </div>
    );
}

/**
 * Simple online/offline badge for header
 */
export function OnlineStatusBadge() {
    const isOnline = useOnlineStatus();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="h-6 w-20" />; // Placeholder with same height
    }

    return (
        <div
            className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                isOnline
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
            )}
        >
            {isOnline ? (
                <Wifi className="h-3.5 w-3.5" />
            ) : (
                <WifiOff className="h-3.5 w-3.5" />
            )}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
    );
}
