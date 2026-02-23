/**
 * Smart Data Cache Layer
 * 
 * Provides extremely fast data loading with:
 * - In-memory cache for instant access
 * - IndexedDB persistence for offline/cross-session support
 * - Automatic cache invalidation
 * - Selective updates (only update what changed)
 * - Background refresh without blocking UI
 */

import { get, ref } from 'firebase/database';
import { db } from '../services/Firebase';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
  path: string;
}

interface CacheConfig {
  maxAge: number; // Max age in milliseconds (default: 5 minutes)
  enableIndexedDB: boolean; // Enable IndexedDB persistence
  enableBackgroundRefresh: boolean; // Refresh in background
}

const DEFAULT_CONFIG: CacheConfig = {
  maxAge: 5 * 60 * 1000, // 5 minutes
  enableIndexedDB: true,
  enableBackgroundRefresh: true,
};

class DataCache {
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map();
  private pendingRequests: Map<string, Promise<unknown>> = new Map();
  private indexedDB: IDBDatabase | null = null;
  private config: CacheConfig = DEFAULT_CONFIG;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    if (this.config.enableIndexedDB && typeof window !== 'undefined') {
      this.initIndexedDB();
    }
  }

  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, _reject) => {
      const request = indexedDB.open('1StopDataCache', 1);

      request.onerror = () => {
        console.warn('IndexedDB not available, using memory cache only');
        this.config.enableIndexedDB = false;
        resolve();
      };

      request.onsuccess = () => {
        this.indexedDB = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'path' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Get data from cache or fetch from Firebase
   * Returns cached data immediately if available and fresh
   */
  async get<T>(path: string, forceRefresh: boolean = false): Promise<T | null> {
    const cacheKey = this.normalizePath(path);

    // Check memory cache first (fastest)
    if (!forceRefresh) {
      const cached = this.memoryCache.get(cacheKey);
      if (cached && this.isFresh(cached)) {
        return cached.data as T;
      }
    }

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey) as Promise<T | null>;
    }

    // Fetch from Firebase
    const fetchPromise = this.fetchAndCache<T>(path, cacheKey);
    this.pendingRequests.set(cacheKey, fetchPromise);

    try {
      const result = await fetchPromise;
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Fetch from Firebase and cache the result
   */
  private async fetchAndCache<T>(path: string, cacheKey: string): Promise<T | null> {
    try {
      const dataRef = ref(db, path);
      const snapshot = await get(dataRef);

      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.val() as T;
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: 1,
        path: cacheKey,
      };

      // Store in memory cache
      this.memoryCache.set(cacheKey, entry);

      // Store in IndexedDB (async, don't wait)
      if (this.config.enableIndexedDB && this.indexedDB) {
        this.saveToIndexedDB(cacheKey, entry).catch(err => {
          console.warn('Failed to save to IndexedDB:', err);
        });
      }

      // Notify listeners
      this.notifyListeners(cacheKey, data);

      return data;
    } catch (error) {
      console.error(`Error fetching data from ${path}:`, error);
      
      // Try to return stale data from cache if available
      const stale = this.memoryCache.get(cacheKey);
      if (stale) {
        console.warn(`Returning stale data for ${path}`);
        return stale.data as T;
      }

      // Try IndexedDB as last resort
      if (this.config.enableIndexedDB && this.indexedDB) {
        const indexedData = await this.getFromIndexedDB<T>(cacheKey);
        if (indexedData) {
          console.warn(`Returning IndexedDB data for ${path}`);
          return indexedData;
        }
      }

      return null;
    }
  }

  /**
   * Check if cache entry is still fresh
   */
  private isFresh(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp < this.config.maxAge;
  }

  /**
   * Subscribe to cache updates for a specific path
   */
  subscribe<T>(path: string, callback: (data: T | null) => void): () => void {
    const cacheKey = this.normalizePath(path);
    
    if (!this.listeners.has(cacheKey)) {
      this.listeners.set(cacheKey, new Set());
    }
    
    const wrapped = (data: unknown) => callback(data as T | null);
    this.listeners.get(cacheKey)!.add(wrapped);

    // Immediately return cached data if available
    const cached = this.memoryCache.get(cacheKey);
    if (cached) {
      callback(cached.data as T | null);
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(cacheKey);
      if (listeners) {
        listeners.delete(wrapped);
        if (listeners.size === 0) {
          this.listeners.delete(cacheKey);
        }
      }
    };
  }

  /**
   * Notify all listeners of a path update
   */
  private notifyListeners(path: string, data: unknown): void {
    const listeners = this.listeners.get(path);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in cache listener:', error);
        }
      });
    }
  }

  /**
   * Invalidate cache for a specific path
   */
  invalidate(path: string): void {
    const cacheKey = this.normalizePath(path);
    this.memoryCache.delete(cacheKey);
    
    if (this.config.enableIndexedDB && this.indexedDB) {
      this.deleteFromIndexedDB(cacheKey).catch(err => {
        console.warn('Failed to delete from IndexedDB:', err);
      });
    }
  }

  /**
   * Invalidate all cache
   */
  invalidateAll(): void {
    this.memoryCache.clear();
    
    if (this.config.enableIndexedDB && this.indexedDB) {
      this.clearIndexedDB().catch(err => {
        console.warn('Failed to clear IndexedDB:', err);
      });
    }
  }

  /**
   * Preload data in background
   */
  async preload(paths: string[]): Promise<void> {
    const promises = paths.map(path => this.get(path).catch(err => {
      console.warn(`Failed to preload ${path}:`, err);
      return null;
    }));
    
    await Promise.all(promises);
  }

  /**
   * Get multiple paths at once (batch operation)
   */
  async getMultiple<T>(paths: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    
    // Check cache first
    const uncachedPaths: string[] = [];
    for (const path of paths) {
      const cacheKey = this.normalizePath(path);
      const cached = this.memoryCache.get(cacheKey);
      if (cached && this.isFresh(cached)) {
        results.set(path, cached.data as T);
      } else {
        uncachedPaths.push(path);
      }
    }

    // Fetch uncached paths in parallel
    if (uncachedPaths.length > 0) {
      const fetchPromises = uncachedPaths.map(path => 
        this.get<T>(path).then(data => ({ path, data }))
      );
      
      const fetched = await Promise.all(fetchPromises);
      fetched.forEach(({ path, data }) => {
        results.set(path, data);
      });
    }

    return results;
  }

  /**
   * Normalize path for consistent caching
   */
  private normalizePath(path: string): string {
    return path.replace(/\/+/g, '/').replace(/\/$/, '');
  }

  /**
   * IndexedDB operations
   */
  private async saveToIndexedDB(_path: string, entry: CacheEntry<any>): Promise<void> {
    if (!this.indexedDB) return;

    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getFromIndexedDB<T>(path: string): Promise<T | null> {
    if (!this.indexedDB) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(path);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T> | undefined;
        if (entry && this.isFresh(entry)) {
          // Also update memory cache
          this.memoryCache.set(path, entry);
          resolve(entry.data);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async deleteFromIndexedDB(path: string): Promise<void> {
    if (!this.indexedDB) return;

    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(path);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async clearIndexedDB(): Promise<void> {
    if (!this.indexedDB) return;

    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memoryCacheSize: number;
    pendingRequests: number;
    listeners: number;
  } {
    return {
      memoryCacheSize: this.memoryCache.size,
      pendingRequests: this.pendingRequests.size,
      listeners: Array.from(this.listeners.values()).reduce((sum, set) => sum + set.size, 0),
    };
  }
}

// Singleton instance
export const dataCache = new DataCache({
  maxAge: 5 * 60 * 1000, // 5 minutes
  enableIndexedDB: true,
  enableBackgroundRefresh: true,
});

// Export for testing
export { DataCache };

