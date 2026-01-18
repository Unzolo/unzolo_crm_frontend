/**
 * Sync Service
 * Handles data synchronization between local IndexedDB and remote API
 */

import { db, STORES } from './db';
import api from './api';

export interface Booking {
  _id: string;
  tripId: string;
  timestamp?: number;
  [key: string]: any;
}

export interface Trip {
  _id: string;
  timestamp?: number;
  [key: string]: any;
}

class SyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;

  /**
   * Start automatic sync every 5 minutes
   */
  startAutoSync(intervalMs: number = 5 * 60 * 1000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.syncAll();
    }, intervalMs);

    console.log('🔄 Auto-sync started (interval: ' + intervalMs / 1000 + 's)');
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Auto-sync stopped');
    }
  }

  /**
   * Sync all data from API to local storage
   */
  async syncAll(): Promise<void> {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress, skipping...');
      return;
    }

    if (!navigator.onLine) {
      console.log('📴 Offline - skipping sync');
      return;
    }

    this.isSyncing = true;
    console.log('🔄 Starting full sync...');

    try {
      await Promise.all([
        this.syncTrips(),
        this.syncBookings(),
      ]);
      console.log('✅ Full sync completed successfully!');
    } catch (error) {
      console.error('❌ Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync trips from API to local storage
   */
  async syncTrips(): Promise<void> {
    try {
      const response = await api.get('/trips');
      let trips: any[] = [];
      
      // Handle different response structures
      if (Array.isArray(response.data)) {
        trips = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        trips = response.data.data;
      } else if (response.data.trips && Array.isArray(response.data.trips)) {
        trips = response.data.trips;
      }

      if (trips.length === 0) {
        console.log('📭 No trips to sync');
        return;
      }

      // Normalize and add timestamp to each trip
      const tripsWithTimestamp = trips.map((trip: any) => ({
        ...trip,
        _id: trip._id || trip.id || `trip-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      }));

      await db.putMany(STORES.TRIPS, tripsWithTimestamp);
      console.log(`✅ Synced ${trips.length} trips to local storage`);
    } catch (error) {
      console.error('❌ Failed to sync trips:', error);
      // Don't throw - allow other syncs to continue
    }
  }

  /**
   * Sync bookings from API to local storage
   */
  async syncBookings(tripId?: string): Promise<void> {
    try {
      const url = tripId ? `/bookings?tripId=${tripId}` : '/bookings';
      const response = await api.get(url);
      let bookings: any[] = [];
      
      // Handle different response structures
      if (Array.isArray(response.data)) {
        bookings = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        bookings = response.data.data;
      } else if (response.data.data?.bookings && Array.isArray(response.data.data.bookings)) {
        bookings = response.data.data.bookings;
      } else if (response.data.bookings && Array.isArray(response.data.bookings)) {
        bookings = response.data.bookings;
      }

      if (bookings.length === 0) {
        console.log('📭 No bookings to sync');
        return;
      }

      // Normalize and add timestamp to each booking
      const bookingsWithTimestamp = bookings.map((booking: any) => ({
        ...booking,
        _id: booking._id || booking.id || `booking-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      }));

      await db.putMany(STORES.BOOKINGS, bookingsWithTimestamp);
      console.log(`✅ Synced ${bookings.length} bookings to local storage`);
    } catch (error) {
      console.error('❌ Failed to sync bookings:', error);
      // Don't throw - allow other syncs to continue
    }
  }

  /**
   * Sync a single booking by ID
   */
  async syncBooking(bookingId: string): Promise<void> {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      const booking: Booking = response.data.data || response.data;

      await db.put(STORES.BOOKINGS, {
        ...booking,
        _id: booking._id || booking.id || bookingId,
        timestamp: Date.now(),
      });

      console.log(`✅ Synced booking ${bookingId} to local storage`);
    } catch (error) {
      console.error(`❌ Failed to sync booking ${bookingId}:`, error);
      throw error;
    }
  }

  /**
   * Get trips from local storage (with fallback to API)
   */
  async getTrips(): Promise<Trip[]> {
    try {
      // Try to get from local storage first
      const localTrips = await db.getAll<Trip>(STORES.TRIPS);
      
      if (localTrips.length > 0) {
        console.log(`📦 Loaded ${localTrips.length} trips from local storage`);
        
        // Sync in background if online
        if (navigator.onLine) {
          this.syncTrips().catch(console.error);
        }
        
        return localTrips;
      }

      // If no local data and online, fetch from API
      if (navigator.onLine) {
        await this.syncTrips();
        return await db.getAll<Trip>(STORES.TRIPS);
      }

      return [];
    } catch (error) {
      console.error('❌ Failed to get trips:', error);
      return [];
    }
  }

  /**
   * Get bookings from local storage (with fallback to API)
   */
  async getBookings(tripId?: string): Promise<Booking[]> {
    try {
      // Try to get from local storage first
      let localBookings: Booking[];
      
      if (tripId) {
        localBookings = await db.getAllByIndex<Booking>(STORES.BOOKINGS, 'tripId', tripId);
      } else {
        localBookings = await db.getAll<Booking>(STORES.BOOKINGS);
      }
      
      if (localBookings.length > 0) {
        console.log(`📦 Loaded ${localBookings.length} bookings from local storage`);
        
        // Sync in background if online
        if (navigator.onLine) {
          this.syncBookings(tripId).catch(console.error);
        }
        
        return localBookings;
      }

      // If no local data and online, fetch from API
      if (navigator.onLine) {
        await this.syncBookings(tripId);
        
        if (tripId) {
          return await db.getAllByIndex<Booking>(STORES.BOOKINGS, 'tripId', tripId);
        } else {
          return await db.getAll<Booking>(STORES.BOOKINGS);
        }
      }

      return [];
    } catch (error) {
      console.error('❌ Failed to get bookings:', error);
      return [];
    }
  }

  /**
   * Get a single booking from local storage (with fallback to API)
   */
  async getBooking(bookingId: string): Promise<Booking | null> {
    try {
      // Try to get from local storage first
      const localBooking = await db.get<Booking>(STORES.BOOKINGS, bookingId);
      
      if (localBooking) {
        console.log(`📦 Loaded booking ${bookingId} from local storage`);
        
        // Sync in background if online
        if (navigator.onLine) {
          this.syncBooking(bookingId).catch(console.error);
        }
        
        return localBooking;
      }

      // If no local data and online, fetch from API
      if (navigator.onLine) {
        await this.syncBooking(bookingId);
        return await db.get<Booking>(STORES.BOOKINGS, bookingId) || null;
      }

      return null;
    } catch (error) {
      console.error(`❌ Failed to get booking ${bookingId}:`, error);
      return null;
    }
  }

  /**
   * Clear all local data
   */
  async clearLocalData(): Promise<void> {
    await Promise.all([
      db.clear(STORES.TRIPS),
      db.clear(STORES.BOOKINGS),
    ]);
    console.log('🗑️ All local data cleared');
  }
}

export const syncService = new SyncService();
