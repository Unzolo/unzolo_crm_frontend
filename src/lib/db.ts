/**
 * IndexedDB wrapper for offline data storage
 */

const DB_NAME = 'unzolo_crm_db';
const DB_VERSION = 4;

// Store names
export const STORES = {
  BOOKINGS: 'bookings',
  TRIPS: 'trips',
  PENDING_REQUESTS: 'pending_requests',
  SYNC_QUEUE: 'sync_queue',
  STATS: 'stats',
  PROFILE: 'profile',
  ENQUIRIES: 'enquiries',
} as const;

export interface PendingRequest {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  entity: 'booking' | 'trip' | 'payment' | 'enquiry';
  data: any;
  timestamp: number;
  synced: boolean;
}

class Database {
  private db: IDBDatabase | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create bookings store
        if (!db.objectStoreNames.contains(STORES.BOOKINGS)) {
          const bookingsStore = db.createObjectStore(STORES.BOOKINGS, { keyPath: '_id' });
          bookingsStore.createIndex('tripId', 'tripId', { unique: false });
          bookingsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create trips store
        if (!db.objectStoreNames.contains(STORES.TRIPS)) {
          const tripsStore = db.createObjectStore(STORES.TRIPS, { keyPath: '_id' });
          tripsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create pending requests store
        if (!db.objectStoreNames.contains(STORES.PENDING_REQUESTS)) {
          const pendingStore = db.createObjectStore(STORES.PENDING_REQUESTS, { keyPath: 'id' });
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
          syncStore.createIndex('synced', 'synced', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create stats store
        if (!db.objectStoreNames.contains(STORES.STATS)) {
          db.createObjectStore(STORES.STATS, { keyPath: 'id' });
        }

        // Create profile store
        if (!db.objectStoreNames.contains(STORES.PROFILE)) {
          db.createObjectStore(STORES.PROFILE, { keyPath: 'id' });
        }

        // Create enquiries store
        if (!db.objectStoreNames.contains(STORES.ENQUIRIES)) {
          const enquiriesStore = db.createObjectStore(STORES.ENQUIRIES, { keyPath: '_id' });
          enquiriesStore.createIndex('timestamp', 'timestamp', { unique: false });
          enquiriesStore.createIndex('status', 'status', { unique: false });
        }
      };
    });
  }

  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put<T>(storeName: string, value: T): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async putMany<T>(storeName: string, values: T[]): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      values.forEach(value => store.put(value));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new Database();
