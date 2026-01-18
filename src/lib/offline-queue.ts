/**
 * Offline Queue Manager
 * Manages pending API requests when offline and syncs them when online
 */

import { db, STORES, PendingRequest, SyncQueueItem } from './db';

class OfflineQueueManager {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      this.setupEventListeners();
    }
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 Back online - starting sync...');
      this.isOnline = true;
      this.processPendingRequests();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Gone offline - queueing requests...');
      this.isOnline = false;
    });
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Add a request to the pending queue
   */
  async addPendingRequest(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    data?: any,
    headers?: Record<string, string>
  ): Promise<string> {
    const id = this.generateId();
    const request: PendingRequest = {
      id,
      url,
      method,
      data,
      headers,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await db.put(STORES.PENDING_REQUESTS, request);
    console.log('📥 Request queued:', { method, url });
    return id;
  }

  /**
   * Add an item to the sync queue
   */
  async addToSyncQueue(
    action: 'create' | 'update' | 'delete',
    entity: 'booking' | 'trip' | 'payment',
    data: any
  ): Promise<string> {
    const id = this.generateId();
    const item: SyncQueueItem = {
      id,
      action,
      entity,
      data,
      timestamp: Date.now(),
      synced: false,
    };

    await db.put(STORES.SYNC_QUEUE, item);
    console.log('📝 Added to sync queue:', { action, entity });
    
    // Try to sync immediately if online
    if (this.isOnline) {
      this.processPendingRequests();
    }
    
    return id;
  }

  /**
   * Process all pending requests
   */
  async processPendingRequests(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;

    try {
      // Process pending API requests
      const pendingRequests = await db.getAll<PendingRequest>(STORES.PENDING_REQUESTS);
      console.log(`🔄 Processing ${pendingRequests.length} pending requests...`);

      for (const request of pendingRequests) {
        try {
          await this.executeRequest(request);
          await db.delete(STORES.PENDING_REQUESTS, request.id);
          console.log('✅ Request synced:', request.url);
        } catch (error) {
          console.error('❌ Failed to sync request:', request.url, error);
          
          // Increment retry count
          request.retryCount++;
          
          // Remove if too many retries (max 5)
          if (request.retryCount >= 5) {
            await db.delete(STORES.PENDING_REQUESTS, request.id);
            console.log('🗑️ Request removed after max retries:', request.url);
          } else {
            await db.put(STORES.PENDING_REQUESTS, request);
          }
        }
      }

      // Process sync queue
      const allSyncItems = await db.getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
      const syncQueue = allSyncItems.filter(item => !item.synced);
      console.log(`🔄 Processing ${syncQueue.length} sync queue items...`);

      for (const item of syncQueue) {
        try {
          await this.processSyncItem(item);
          item.synced = true;
          await db.put(STORES.SYNC_QUEUE, item);
          console.log('✅ Sync item processed:', item.action, item.entity);
        } catch (error) {
          console.error('❌ Failed to process sync item:', error);
        }
      }

      console.log('✨ Sync completed successfully!');
    } catch (error) {
      console.error('❌ Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Execute a pending request
   */
  private async executeRequest(request: PendingRequest): Promise<any> {
    const { default: api } = await import('./api');
    
    const config: any = {
      method: request.method,
      url: request.url,
      headers: request.headers,
    };

    if (request.data) {
      config.data = request.data;
    }

    const response = await api.request(config);
    return response.data;
  }

  /**
   * Process a sync queue item
   */
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    const { default: api } = await import('./api');
    
    switch (item.entity) {
      case 'booking':
        if (item.action === 'create') {
          await api.post('/bookings', item.data);
        } else if (item.action === 'update') {
          await api.patch(`/bookings/${item.data._id}`, item.data);
        } else if (item.action === 'delete') {
          await api.delete(`/bookings/${item.data._id}`);
        }
        break;
        
      case 'trip':
        if (item.action === 'create') {
          await api.post('/trips', item.data);
        } else if (item.action === 'update') {
          await api.patch(`/trips/${item.data._id}`, item.data);
        } else if (item.action === 'delete') {
          await api.delete(`/trips/${item.data._id}`);
        }
        break;
        
      case 'payment':
        if (item.action === 'create') {
          await api.post(`/bookings/${item.data.bookingId}/payments`, item.data);
        }
        break;
    }
  }

  /**
   * Get pending requests count
   */
  async getPendingCount(): Promise<number> {
    try {
      const requests = await db.getAll<PendingRequest>(STORES.PENDING_REQUESTS);
      const allSyncItems = await db.getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
      const unsyncedItems = allSyncItems.filter(item => !item.synced);
      return requests.length + unsyncedItems.length;
    } catch (error) {
      console.error('Error getting pending count:', error);
      return 0;
    }
  }

  /**
   * Clear all pending requests (use with caution)
   */
  async clearPendingRequests(): Promise<void> {
    await db.clear(STORES.PENDING_REQUESTS);
    await db.clear(STORES.SYNC_QUEUE);
    console.log('🗑️ All pending requests cleared');
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const offlineQueue = new OfflineQueueManager();
