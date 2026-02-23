// API Batching Service for optimizing multiple API calls
interface BatchedRequest {
  id: string;
  url: string;
  options: RequestInit;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number;
  baseUrl: string;
}

class APIBatchingService {
  private batches: Map<string, BatchedRequest[]> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private config: BatchConfig;

  constructor(config: BatchConfig) {
    this.config = config;
  }

  // Add request to batch
  async addRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    batchKey?: string
  ): Promise<T> {
    const requestId = this.generateRequestId();
    const url = `${this.config.baseUrl}${endpoint}`;
    const key = batchKey || this.getBatchKey(endpoint, options.method || 'GET');

    return new Promise<T>((resolve, reject) => {
      const request: BatchedRequest = {
        id: requestId,
        url,
        options,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      this.addToBatch(key, request);
    });
  }

  // Add request to specific batch
  private addToBatch(key: string, request: BatchedRequest) {
    if (!this.batches.has(key)) {
      this.batches.set(key, []);
    }

    const batch = this.batches.get(key)!;
    batch.push(request);

    // Process batch if it's full
    if (batch.length >= this.config.maxBatchSize) {
      this.processBatch(key);
    } else {
      // Set timer for batch processing
      this.scheduleBatchProcessing(key);
    }
  }

  // Schedule batch processing
  private scheduleBatchProcessing(key: string) {
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.processBatch(key);
    }, this.config.maxWaitTime);

    this.timers.set(key, timer);
  }

  // Process a batch of requests
  private async processBatch(key: string) {
    const batch = this.batches.get(key);
    if (!batch || batch.length === 0) return;

    // Clear timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }

    // Remove batch from map
    this.batches.delete(key);

    try {
      // Create batch request
      const batchRequest = this.createBatchRequest(batch);
      
      // Send batch request
      const response = await fetch(batchRequest.url, batchRequest.options);
      
      if (!response.ok) {
        throw new Error(`Batch request failed: ${response.status}`);
      }

      const results = await response.json();
      
      // Resolve individual requests
      this.resolveBatchRequests(batch, results);
    } catch (error) {
      // Reject all requests in batch
      this.rejectBatchRequests(batch, error);
    }
  }

  // Create batch request
  private createBatchRequest(requests: BatchedRequest[]) {
    const batchData = {
      requests: requests.map(req => ({
        id: req.id,
        url: req.url.replace(this.config.baseUrl, ''),
        method: req.options.method || 'GET',
        headers: req.options.headers,
        body: req.options.body,
      })),
    };

    return {
      url: `${this.config.baseUrl}/api/batch`,
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchData),
      },
    };
  }

  // Resolve batch requests
  private resolveBatchRequests(requests: BatchedRequest[], results: any[]) {
    requests.forEach((request, index) => {
      const result = results[index];
      if (result && result.success) {
        request.resolve(result.data);
      } else {
        request.reject(new Error(result?.error || 'Request failed'));
      }
    });
  }

  // Reject batch requests
  private rejectBatchRequests(requests: BatchedRequest[], error: any) {
    requests.forEach(request => {
      request.reject(error);
    });
  }

  // Get batch key for grouping requests
  private getBatchKey(endpoint: string, method: string): string {
    return `${method}:${endpoint.split('?')[0]}`;
  }

  // Generate unique request ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Process all pending batches
  async flushAll() {
    const keys = Array.from(this.batches.keys());
    await Promise.all(keys.map(key => this.processBatch(key)));
  }

  // Get batch statistics
  getStats() {
    const totalPending = Array.from(this.batches.values())
      .reduce((sum, batch) => sum + batch.length, 0);
    
    return {
      activeBatches: this.batches.size,
      totalPendingRequests: totalPending,
      pendingTimers: this.timers.size,
    };
  }
}

// Create singleton instance
export const apiBatchingService = new APIBatchingService({
  maxBatchSize: 10,
  maxWaitTime: 100, // 100ms
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '',
});

// Hook for using API batching
export function useAPIBatching() {
  const addRequest = useCallback(
    <T>(endpoint: string, options?: RequestInit, batchKey?: string) =>
      apiBatchingService.addRequest<T>(endpoint, options, batchKey),
    []
  );

  const flushAll = useCallback(
    () => apiBatchingService.flushAll(),
    []
  );

  const getStats = useCallback(
    () => apiBatchingService.getStats(),
    []
  );

  return {
    addRequest,
    flushAll,
    getStats,
  };
}

// Request deduplication service
class RequestDeduplicationService {
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  async deduplicateRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    useCache: boolean = true
  ): Promise<T> {
    // Check cache first
    if (useCache && this.cache.has(key)) {
      const cached = this.cache.get(key)!;
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      } else {
        this.cache.delete(key);
      }
    }

    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Create new request
    const requestPromise = requestFn().then(
      (data) => {
        // Cache successful response
        if (useCache) {
          this.cache.set(key, { data, timestamp: Date.now() });
        }
        
        // Remove from pending
        this.pendingRequests.delete(key);
        
        return data;
      },
      (error) => {
        // Remove from pending on error
        this.pendingRequests.delete(key);
        throw error;
      }
    );

    // Store pending request
    this.pendingRequests.set(key, requestPromise);

    return requestPromise;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Clear specific cache entry
  clearCacheEntry(key: string) {
    this.cache.delete(key);
  }

  // Get cache stats
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
    };
  }
}

export const requestDeduplicationService = new RequestDeduplicationService();

// Hook for request deduplication
export function useRequestDeduplication() {
  const deduplicateRequest = useCallback(
    <T>(key: string, requestFn: () => Promise<T>, useCache: boolean = true) =>
      requestDeduplicationService.deduplicateRequest(key, requestFn, useCache),
    []
  );

  const clearCache = useCallback(
    () => requestDeduplicationService.clearCache(),
    []
  );

  const clearCacheEntry = useCallback(
    (key: string) => requestDeduplicationService.clearCacheEntry(key),
    []
  );

  const getCacheStats = useCallback(
    () => requestDeduplicationService.getCacheStats(),
    []
  );

  return {
    deduplicateRequest,
    clearCache,
    clearCacheEntry,
    getCacheStats,
  };
}

// Request queue with priority
class PriorityRequestQueue {
  private queue: Array<{
    request: () => Promise<any>;
    priority: number;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private processing = false;
  private maxConcurrent = 3;
  private activeRequests = 0;

  async addRequest<T>(
    requestFn: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        request: requestFn,
        priority,
        resolve,
        reject,
      });

      // Sort by priority (higher number = higher priority)
      this.queue.sort((a, b) => b.priority - a.priority);

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.activeRequests >= this.maxConcurrent) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const { request, resolve, reject } = this.queue.shift()!;
      this.activeRequests++;

      request()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.activeRequests--;
          this.processQueue();
        });
    }

    this.processing = false;
  }

  // Get queue stats
  getStats() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      maxConcurrent: this.maxConcurrent,
    };
  }
}

export const priorityRequestQueue = new PriorityRequestQueue();

// Hook for priority request queue
export function usePriorityRequestQueue() {
  const addRequest = useCallback(
    <T>(requestFn: () => Promise<T>, priority: number = 0) =>
      priorityRequestQueue.addRequest(requestFn, priority),
    []
  );

  const getStats = useCallback(
    () => priorityRequestQueue.getStats(),
    []
  );

  return {
    addRequest,
    getStats,
  };
}

// Import useCallback
import { useCallback } from 'react';
