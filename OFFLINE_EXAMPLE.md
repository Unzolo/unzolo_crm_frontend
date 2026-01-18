# Example: Updating Manage Bookings Page for Offline Support

This example shows how to update the `manage-bookings/[id]/page.tsx` to use offline functionality.

## Before (Current Implementation)

```typescript
import api from "@/lib/api";

const { data: bookingsResponse, isLoading } = useQuery({
    queryKey: ["bookings", tripId],
    queryFn: async () => {
        const response = await api.get(`/bookings?tripId=${tripId}`);
        return response.data;
    },
    enabled: !!tripId,
});
```

## After (With Offline Support)

### Option 1: Using apiWithOffline (Recommended)

```typescript
import { apiWithOffline } from "@/lib/api";

const { data: bookingsResponse, isLoading } = useQuery({
    queryKey: ["bookings", tripId],
    queryFn: async () => {
        const response = await apiWithOffline.get(`/bookings?tripId=${tripId}`);
        return response.data;
    },
    enabled: !!tripId,
    // Keep data fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Cache data for 30 minutes
    gcTime: 30 * 60 * 1000,
});
```

### Option 2: Using Sync Service Directly

```typescript
import { syncService } from "@/lib/sync-service";

const { data: bookingsResponse, isLoading } = useQuery({
    queryKey: ["bookings", tripId],
    queryFn: async () => {
        const bookings = await syncService.getBookings(tripId);
        return { data: { bookings } };
    },
    enabled: !!tripId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
});
```

## Complete Updated File

Here's the complete updated version with offline support:

\`\`\`typescript
"use client";

import {
    ArrowLeft,
    Plus,
    MapPin,
    Calendar,
    Users,
    IndianRupee,
    Search,
    SlidersHorizontal,
    ClipboardCheck,
    Package,
    Loader2,
    ChevronDown,
    ChevronUp,
    Clock,
    WifiOff  // Add this for offline indicator
} from "lucide-react";
// ... other imports
import { apiWithOffline } from "@/lib/api";  // Changed from api
import { useOffline } from "@/components/offline-provider";  // Add this

function ManageBookingPage() {
    const router = useRouter();
    const params = useParams();
    const tripId = params.id as string;
    const { isOnline } = useOffline();  // Add this
    
    // ... existing state

    const { data: bookingsResponse, isLoading } = useQuery({
        queryKey: ["bookings", tripId],
        queryFn: async () => {
            const response = await apiWithOffline.get(`/bookings?tripId=${tripId}`);
            return response.data;
        },
        enabled: !!tripId,
        staleTime: 5 * 60 * 1000,  // 5 minutes
        gcTime: 30 * 60 * 1000,    // 30 minutes
    });

    const { data: tripResponse } = useQuery({
        queryKey: ["trip", tripId],
        queryFn: async () => {
            const response = await apiWithOffline.get(`/trips/${tripId}`);
            return response.data;
        },
        enabled: !!tripId,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });

    // ... rest of the component

    return (
        <div className="min-h-screen bg-[#E2F1E8] flex flex-col">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="text-black hover:bg-transparent px-0"
                >
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <div className="flex-1 flex items-center justify-center gap-2">
                    <h1 className="text-xl font-bold text-black">Manage Bookings</h1>
                    {/* Add offline indicator in header */}
                    {!isOnline && (
                        <WifiOff className="w-4 h-4 text-orange-500" />
                    )}
                </div>
                <Button
                    onClick={() => router.push(`/create-booking?tripId=${tripId}`)}
                    className="bg-[#219653] hover:bg-[#1A7B44] text-white rounded-full px-4 h-9 gap-1 font-semibold"
                >
                    <Plus className="w-4 h-4" /> Add
                </Button>
            </div>
            
            {/* Rest of the component remains the same */}
            {/* ... */}
        </div>
    );
}

export default withAuth(ManageBookingPage);
\`\`\`

## Key Changes

1. **Import Change**: Changed from `api` to `apiWithOffline`
2. **Added Offline Hook**: Use `useOffline()` to access offline state
3. **Query Configuration**: Added `staleTime` and `gcTime` for better caching
4. **UI Indicator**: Added offline icon in header when offline

## Benefits

✅ **Automatic Offline Support**: Data is automatically cached and served when offline
✅ **Background Sync**: Data syncs in background when online
✅ **No Loading States**: Cached data shows instantly
✅ **Queue Management**: Create/update operations queue when offline
✅ **User Feedback**: Clear indication of offline status

## Testing

1. Load the page while online
2. Turn off internet (Chrome DevTools → Network → Offline)
3. Refresh the page - data should still appear
4. Try to create a booking - it will queue
5. Turn internet back on - queued items sync automatically
