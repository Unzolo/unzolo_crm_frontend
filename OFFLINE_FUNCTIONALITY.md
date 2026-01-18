# Offline Functionality Documentation

## Overview

This PWA now includes comprehensive offline functionality that allows users to:
- ✅ Continue using the app when offline
- ✅ Queue API requests when offline and sync them when back online
- ✅ View cached data from IndexedDB
- ✅ Automatic background synchronization
- ✅ Visual indicators for online/offline status

## Architecture

### Core Components

1. **IndexedDB (`src/lib/db.ts`)**
   - Local database for storing data offline
   - Stores: bookings, trips, pending_requests, sync_queue

2. **Offline Queue Manager (`src/lib/offline-queue.ts`)**
   - Manages pending API requests when offline
   - Automatically syncs when connection is restored
   - Retry logic with max 5 attempts

3. **Sync Service (`src/lib/sync-service.ts`)**
   - Handles bidirectional data synchronization
   - Auto-sync every 5 minutes
   - Fetches data from API and stores locally

4. **Enhanced API (`src/lib/api.ts`)**
   - Automatically queues requests when offline
   - Serves cached data when offline
   - Transparent offline/online switching

5. **React Hooks (`src/lib/hooks/use-offline.ts`)**
   - `useOnlineStatus()` - Track online/offline status
   - `usePendingSync()` - Track pending sync items
   - `useOfflineInit()` - Initialize offline functionality

6. **UI Components**
   - `OfflineProvider` - Context provider for offline state
   - `OfflineIndicator` - Visual indicator showing status and pending items

## How It Works

### When Online
1. API requests work normally
2. Data is automatically cached to IndexedDB after successful requests
3. Background sync runs every 5 minutes to keep data fresh

### When Offline
1. GET requests return cached data from IndexedDB
2. POST/PUT/DELETE requests are queued for later
3. User sees "Offline" indicator with pending count
4. Data is served from local cache

### When Back Online
1. Automatic sync starts immediately
2. All pending requests are processed in order
3. Failed requests retry up to 5 times
4. User can manually trigger sync via the indicator

## Usage Examples

### Using the Enhanced API

```typescript
import { apiWithOffline } from '@/lib/api';

// GET request (works offline with cached data)
const trips = await apiWithOffline.get('/trips');

// POST request (queued when offline)
const newBooking = await apiWithOffline.post('/bookings', bookingData);

// PUT request (queued when offline)
await apiWithOffline.put(`/bookings/${id}`, updatedData);

// DELETE request (queued when offline)
await apiWithOffline.delete(`/bookings/${id}`);
```

### Using Sync Service Directly

```typescript
import { syncService } from '@/lib/sync-service';

// Manual sync all data
await syncService.syncAll();

// Sync specific data
await syncService.syncTrips();
await syncService.syncBookings();
await syncService.syncBooking(bookingId);

// Get data (with offline fallback)
const trips = await syncService.getTrips();
const bookings = await syncService.getBookings(tripId);
const booking = await syncService.getBooking(bookingId);

// Start/stop auto-sync
syncService.startAutoSync(5 * 60 * 1000); // 5 minutes
syncService.stopAutoSync();
```

### Using React Hooks

```typescript
import { useOnlineStatus, usePendingSync, useOffline } from '@/lib/hooks/use-offline';

function MyComponent() {
  // Track online status
  const isOnline = useOnlineStatus();
  
  // Track pending sync
  const { pendingCount, isSyncing, syncNow } = usePendingSync();
  
  // Access full offline context
  const { isOnline, pendingCount, syncNow, initialized } = useOffline();
  
  return (
    <div>
      {isOnline ? 'Online' : 'Offline'}
      {pendingCount > 0 && (
        <button onClick={syncNow}>
          Sync {pendingCount} items
        </button>
      )}
    </div>
  );
}
```

## Data Flow

### Creating a Booking (Online)
```
User submits form
  → POST /bookings
  → API responds with booking
  → Booking saved to IndexedDB
  → UI updates
```

### Creating a Booking (Offline)
```
User submits form
  → POST request queued
  → Temporary ID generated
  → UI updates with temp data
  → "Queued" toast shown
  
When online:
  → Queue processes request
  → Real booking created
  → IndexedDB updated
  → "Synced" toast shown
```

### Viewing Bookings (Offline)
```
User opens bookings page
  → Check IndexedDB first
  → Display cached bookings
  → If online, sync in background
  → Update UI with fresh data
```

## Configuration

### Auto-Sync Interval
Default: 5 minutes

To change, edit `src/lib/hooks/use-offline.ts`:
```typescript
syncService.startAutoSync(10 * 60 * 1000); // 10 minutes
```

### Retry Attempts
Default: 5 attempts

To change, edit `src/lib/offline-queue.ts`:
```typescript
if (request.retryCount >= 10) { // Change to 10
  // Remove after max retries
}
```

### PWA Service Worker
The service worker is configured in `next.config.ts`:
```typescript
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});
```

## Testing Offline Functionality

### Chrome DevTools
1. Open DevTools (F12)
2. Go to Network tab
3. Change "Online" dropdown to "Offline"
4. Test the app functionality

### Manual Testing
1. Turn off WiFi/disconnect internet
2. Try creating/editing bookings
3. Check offline indicator appears
4. Reconnect internet
5. Verify data syncs automatically

## Troubleshooting

### Data Not Syncing
1. Check browser console for errors
2. Verify IndexedDB is enabled (check Application tab in DevTools)
3. Check pending count in offline indicator
4. Try manual sync button

### Cached Data Not Showing
1. Ensure you've loaded data while online at least once
2. Check IndexedDB in DevTools → Application → IndexedDB
3. Verify stores contain data

### Service Worker Issues
1. Unregister old service workers (Application → Service Workers)
2. Clear site data
3. Rebuild the app: `npm run build`

## Browser Support

- ✅ Chrome/Edge (full support)
- ✅ Firefox (full support)
- ✅ Safari (full support)
- ✅ Mobile browsers (full support)

## Performance Considerations

- IndexedDB operations are asynchronous and non-blocking
- Auto-sync runs in background without affecting UI
- Cached data loads instantly
- Network requests happen in parallel when possible

## Security

- All API requests include authentication tokens
- IndexedDB data is stored locally per origin
- No sensitive data is logged to console in production
- Service worker respects HTTPS requirements

## Future Enhancements

- [ ] Conflict resolution for simultaneous edits
- [ ] Differential sync (only changed data)
- [ ] Background sync API for better mobile support
- [ ] Compression for cached data
- [ ] Selective sync (user chooses what to cache)
