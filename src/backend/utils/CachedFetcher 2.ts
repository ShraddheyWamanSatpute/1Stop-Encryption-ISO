/**
 * Cached Fetcher Utility
 * 
 * Provides request deduplication and caching for context data fetching
 */

import { dataCache } from './DataCache';

/**
 * Request deduplication map - prevents duplicate simultaneous requests
 */
const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Create a cached fetcher with request deduplication
 * 
 * @param fetchFn - The original fetch function
 * @param entityName - Name of the entity (for cache key)
 * @returns Cached fetch function
 */
export function createCachedFetcher<T>(
  fetchFn: (basePath: string) => Promise<T[]>,
  entityName: string
) {
  return async (basePath: string, forceRefresh: boolean = false): Promise<T[]> => {
    const cacheKey = `${basePath}/${entityName}`;
    
    // Check if request is already pending (deduplication)
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey) as Promise<T[]>;
    }
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = await dataCache.get<T[]>(cacheKey, false);
      if (cached !== null && Array.isArray(cached) && cached.length >= 0) {
        return cached;
      }
    }
    
    // Create fetch promise
    const fetchPromise = (async () => {
      try {
        // Fetch from Firebase
        const data = await fetchFn(basePath);
        
        // Cache result (async, don't wait)
        if (data && Array.isArray(data)) {
          dataCache.get(cacheKey, true).then(() => {
            // Cache will be updated by the fetch above
          }).catch(() => {
            // Ignore cache errors
          });
        }
        
        return data || [];
      } catch (error) {
        console.error(`Error fetching ${entityName} from ${basePath}:`, error);
        
        // Try to return stale cache on error
        const staleCache = await dataCache.get<T[]>(cacheKey, false);
        if (staleCache !== null) {
          console.warn(`Returning stale cache for ${entityName}`);
          return staleCache;
        }
        
        throw error;
      } finally {
        // Remove from pending requests
        pendingRequests.delete(cacheKey);
      }
    })();
    
    // Store pending request
    pendingRequests.set(cacheKey, fetchPromise);
    
    return fetchPromise;
  };
}

/**
 * Batch fetch multiple entities with caching and deduplication
 */
export async function batchFetchCached<T>(
  fetchers: Array<{ fetchFn: (basePath: string) => Promise<T[]>; entityName: string }>,
  basePath: string,
  forceRefresh: boolean = false
): Promise<T[][]> {
  const cachedFetchers = fetchers.map(({ fetchFn, entityName }) =>
    createCachedFetcher(fetchFn, entityName)
  );
  
  return Promise.all(
    cachedFetchers.map(fetcher => fetcher(basePath, forceRefresh))
  );
}

/**
 * Clear pending requests (useful for cleanup)
 */
export function clearPendingRequests(): void {
  pendingRequests.clear();
}

/**
 * Get pending request count (for debugging)
 */
export function getPendingRequestCount(): number {
  return pendingRequests.size;
}



