// Query Result Cache for Read Operations
// Reduces LLM calls and improves response time

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
}

export class QueryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private tagIndex = new Map<string, Set<string>>();
  
  private defaultTTL = 30000; // 30 seconds
  
  // Get cached result
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  // Set cache with tags for invalidation
  set<T>(key: string, data: T, options?: { ttl?: number; tags?: string[] }): void {
    const ttl = options?.ttl || this.defaultTTL;
    const tags = options?.tags || [];
    
    // Remove old tags if updating
    const existing = this.cache.get(key);
    if (existing) {
      for (const tag of existing.tags) {
        this.tagIndex.get(tag)?.delete(key);
      }
    }
    
    // Store entry
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      tags,
    });
    
    // Update tag index
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }
  
  // Delete a specific key
  delete(key: string): boolean {
    const existing = this.cache.get(key);
    if (existing) {
      for (const tag of existing.tags) {
        this.tagIndex.get(tag)?.delete(key);
      }
    }
    return this.cache.delete(key);
  }
  
  // Invalidate by tag (e.g., on write)
  invalidateTag(tag: string): number {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;
    
    let count = 0;
    for (const key of keys) {
      this.cache.delete(key);
      count++;
    }
    this.tagIndex.delete(tag);
    return count;
  }
  
  // Invalidate by multiple tags
  invalidateTags(tags: string[]): number {
    let total = 0;
    for (const tag of tags) {
      total += this.invalidateTag(tag);
    }
    return total;
  }
  
  // Check if key exists and is valid
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.delete(key);
      return false;
    }
    
    return true;
  }
  
  // Get remaining TTL for a key
  getRemainingTTL(key: string): number {
    const entry = this.cache.get(key);
    if (!entry) return 0;
    
    const remaining = entry.timestamp + entry.ttl - Date.now();
    return Math.max(0, remaining);
  }
  
  // Invalidate all
  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
  }
  
  // Cleanup expired entries
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }
  
  // Get stats
  getStats(): { entries: number; tags: number; hitRate?: number } {
    return {
      entries: this.cache.size,
      tags: this.tagIndex.size,
    };
  }
  
  // Get all keys
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  // Get all tags
  getTags(): string[] {
    return Array.from(this.tagIndex.keys());
  }
}

export const queryCache = new QueryCache();

// Cache keys for common queries
export const CACHE_KEYS = {
  dashboardStats: (businessId: string) => `dashboard:${businessId}`,
  salesSummary: (businessId: string, period: string) => `sales:${businessId}:${period}`,
  profitSummary: (businessId: string, period: string) => `profit:${businessId}:${period}`,
  receivableSummary: (businessId: string) => `receivable:${businessId}`,
  payableSummary: (businessId: string) => `payable:${businessId}`,
  lowStockItems: (businessId: string) => `lowstock:${businessId}`,
  topSellingItems: (businessId: string, period: string) => `topselling:${businessId}:${period}`,
  inventoryList: (businessId: string) => `inventory:${businessId}`,
  partyList: (businessId: string) => `parties:${businessId}`,
  expenseSummary: (businessId: string, period: string) => `expenses:${businessId}:${period}`,
};

// Cache tags for invalidation
export const CACHE_TAGS = {
  dashboard: 'dashboard',
  sales: 'sales',
  inventory: 'inventory',
  parties: 'parties',
  expenses: 'expenses',
  payments: 'payments',
};

// TTL presets
export const CACHE_TTL = {
  SHORT: 10000,     // 10 seconds - for rapidly changing data
  DEFAULT: 30000,   // 30 seconds - standard cache
  MEDIUM: 60000,    // 1 minute - for semi-static data
  LONG: 300000,     // 5 minutes - for rarely changing data
};
