/**
 * Enhanced API wrapper with offline support
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { offlineQueue } from './offline-queue';
import { syncService } from './sync-service';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://crm.unzolo.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle network errors (offline)
    if (!error.response && error.message === 'Network Error') {
      console.log('📴 Network error detected - request will be queued');
      
      const config = error.config;
      
      // Queue the request for later
      if (config && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase() || '')) {
        await offlineQueue.addPendingRequest(
          config.url || '',
          config.method?.toUpperCase() as any,
          config.data,
          config.headers as Record<string, string>
        );
        
        // Throw a custom error indicating the request was queued
        const offlineError = new Error('Action queued for sync when online') as any;
        offlineError.isOffline = true;
        offlineError.queued = true;
        offlineError.config = config;
        
        return Promise.reject(offlineError);
      }
    }

    // Handle unauthorized
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        console.log('🔓 Unauthorized - clearing token and redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Enhanced API methods with offline support
 */
export const apiWithOffline = {
  /**
   * GET request with offline fallback
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      return await api.get<T>(url, config);
    } catch (error: any) {
      // If offline, try to get from local storage
      if (!navigator.onLine || error.message === 'Network Error') {
        console.log('📴 Offline - attempting to load from local storage');
        
        // Handle specific endpoints
        if (url.includes('/trips')) {
          const trips = await syncService.getTrips();
          return {
            data: { data: trips } as T,
            status: 200,
            statusText: 'OK (from cache)',
            headers: {},
            config: config || {},
          } as AxiosResponse<T>;
        }
        
        if (url.includes('/bookings')) {
          const match = url.match(/\/bookings\/([^/?]+)/);
          if (match) {
            // Single booking
            const booking = await syncService.getBooking(match[1]);
            return {
              data: { data: booking } as T,
              status: 200,
              statusText: 'OK (from cache)',
              headers: {},
              config: config || {},
            } as AxiosResponse<T>;
          } else {
            // All bookings or filtered by tripId
            const tripIdMatch = url.match(/tripId=([^&]+)/);
            const tripId = tripIdMatch ? tripIdMatch[1] : undefined;
            const bookings = await syncService.getBookings(tripId);
            return {
              data: { data: bookings } as T,
              status: 200,
              statusText: 'OK (from cache)',
              headers: {},
              config: config || {},
            } as AxiosResponse<T>;
          }
        }

        if (url.includes('/dashboard/stats')) {
          const stats = await syncService.getStats();
          return {
            data: { data: stats } as T,
            status: 200,
            statusText: 'OK (from cache)',
            headers: {},
            config: config || {},
          } as AxiosResponse<T>;
        }

        if (url.includes('/auth/profile')) {
          const profile = await syncService.getProfile();
          return {
            data: { data: profile } as T,
            status: 200,
            statusText: 'OK (from cache)',
            headers: {},
            config: config || {},
          } as AxiosResponse<T>;
        }
      }
      
      throw error;
    }
  },

  /**
   * POST request with offline queue
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await api.post<T>(url, data, config);
      
      // Sync to local storage after successful post
      if (url.includes('/bookings') && response.data) {
        await syncService.syncBookings();
      } else if (url.includes('/trips') && response.data) {
        await syncService.syncTrips();
      }
      
      return response;
    } catch (error: any) {
      // If offline, queue the request
      if (!navigator.onLine || error.message === 'Network Error') {
        console.log('📴 Offline - queueing POST request');
        
        const isCreation = (url === '/bookings' || url === '/trips' || url.includes('/payments')) && !url.includes('/cancel');
        
        if (isCreation) {
          let entity: 'booking' | 'trip' | 'payment' = 'booking';
          if (url.includes('/trips')) entity = 'trip';
          if (url.includes('/payments')) entity = 'payment';
          
          await offlineQueue.addToSyncQueue('create', entity, data);
        } else {
          await offlineQueue.addPendingRequest(
            url,
            'POST',
            data,
            config?.headers as Record<string, string>
          );
        }
        
        const offlineError = new Error('Action queued for sync when online') as any;
        offlineError.isOffline = true;
        offlineError.queued = true;
        throw offlineError;
      }
      
      throw error;
    }
  },

  /**
   * PUT request with offline queue
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await api.put<T>(url, data, config);
      
      // Sync to local storage after successful put
      if (url.includes('/bookings') && response.data) {
        await syncService.syncBookings();
      } else if (url.includes('/trips') && response.data) {
        await syncService.syncTrips();
      }
      
      return response;
    } catch (error: any) {
      // If offline, queue the request
      if (!navigator.onLine || error.message === 'Network Error') {
        console.log('📴 Offline - queueing PUT request');
        
        let entity: 'booking' | 'trip' | 'payment' = 'booking';
        if (url.includes('/trips')) entity = 'trip';
        
        await offlineQueue.addToSyncQueue('update', entity, data);
        
        const offlineError = new Error('Action queued for sync when online') as any;
        offlineError.isOffline = true;
        offlineError.queued = true;
        throw offlineError;
      }
      
      throw error;
    }
  },

  /**
   * DELETE request with offline queue
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await api.delete<T>(url, config);
      
      // Sync to local storage after successful delete
      if (url.includes('/bookings') && response.data) {
        await syncService.syncBookings();
      } else if (url.includes('/trips') && response.data) {
        await syncService.syncTrips();
      }
      
      return response;
    } catch (error: any) {
      // If offline, queue the request
      if (!navigator.onLine || error.message === 'Network Error') {
        console.log('📴 Offline - queueing DELETE request');
        
        const match = url.match(/\/(bookings|trips)\/([^/?]+)/);
        if (match) {
          const entity = match[1] === 'trips' ? 'trip' : 'booking';
          const id = match[2];
          
          await offlineQueue.addToSyncQueue('delete', entity, { _id: id });
        }
        
        const offlineError = new Error('Action queued for sync when online') as any;
        offlineError.isOffline = true;
        offlineError.queued = true;
        throw offlineError;
      }
      
      throw error;
    }
  },

  /**
   * PATCH request with offline queue
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await api.patch<T>(url, data, config);
      
      // Sync to local storage after successful patch
      if (url.includes('/bookings') && response.data) {
        await syncService.syncBookings();
      } else if (url.includes('/trips') && response.data) {
        await syncService.syncTrips();
      }
      
      return response;
    } catch (error: any) {
      // If offline, queue the request
      if (!navigator.onLine || error.message === 'Network Error') {
        console.log('📴 Offline - queueing PATCH request');
        
        let entity: 'booking' | 'trip' | 'payment' = 'booking';
        if (url.includes('/trips')) entity = 'trip';
        
        await offlineQueue.addToSyncQueue('update', entity, data);
        
        const offlineError = new Error('Action queued for sync when online') as any;
        offlineError.isOffline = true;
        offlineError.queued = true;
        throw offlineError;
      }
      
      throw error;
    }
  },
};

export default api;
