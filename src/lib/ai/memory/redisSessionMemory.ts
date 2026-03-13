// Redis-based Session Memory for Distributed Systems
// Replaces in-memory Map with Redis for multi-instance support
// PHASE 2 - Distributed Session Safety

import { sessionMemory, SessionState } from './sessionMemory';

// Redis client interface (adapts to any Redis client)
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<unknown>;
  del(key: string): Promise<number>;
  setnx(key: string, value: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  sadd(key: string, ...members: string[]): Promise<number>;
  sismember(key: string, member: string): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
  incr(key: string): Promise<number>;
  eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown>;
  connect?(): Promise<void>;
  disconnect?(): Promise<void>;
  isOpen?: boolean;
}

// Configuration
export interface RedisSessionConfig {
  keyPrefix: string;
  sessionTTL: number; // seconds
  lockTimeout: number; // milliseconds
  maxRetries: number;
}

const DEFAULT_CONFIG: RedisSessionConfig = {
  keyPrefix: 'ai:session:',
  sessionTTL: 1800, // 30 minutes
  lockTimeout: 30000, // 30 seconds
  maxRetries: 3,
};

// Lock acquisition Lua script (atomic)
const ACQUIRE_LOCK_SCRIPT = `
local lockKey = KEYS[1]
local lockValue = ARGV[1]
local ttl = tonumber(ARGV[2])
if redis.call('setnx', lockKey, lockValue) == 1 then
  redis.call('expire', lockKey, ttl)
  return 1
end
return 0
`;

// Release lock Lua script (only by owner)
const RELEASE_LOCK_SCRIPT = `
local lockKey = KEYS[1]
local lockValue = ARGV[1]
if redis.call('get', lockKey) == lockValue then
  return redis.call('del', lockKey)
end
return 0
`;

// Session data structure for Redis storage
interface RedisSessionData {
  pendingDraftHash: string | null;
  lastActivity: number;
  businessId: string | null;
  lockVersion: number;
}

export class RedisSessionMemory {
  private redis: RedisClient | null = null;
  private config: RedisSessionConfig;
  private fallbackToLocal = true;
  private localMemory = sessionMemory; // Fallback to in-memory
  private connectionPromise: Promise<void> | null = null;

  constructor(config?: Partial<RedisSessionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.connectionPromise = this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    // Try to connect to Redis
    try {
      // Dynamic import to avoid errors if Redis not available
      const { createClient } = await import('redis');
      this.redis = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      }) as unknown as RedisClient;
      
      if (this.redis.connect) {
        await this.redis.connect();
      }
      this.fallbackToLocal = false;
      console.log('[RedisSessionMemory] Connected to Redis successfully');
    } catch (error) {
      console.warn('[RedisSessionMemory] Redis not available, using in-memory fallback:', error instanceof Error ? error.message : 'Unknown error');
      this.fallbackToLocal = true;
      this.redis = null;
    }
  }

  /**
   * Wait for Redis connection to complete
   */
  async waitForConnection(): Promise<boolean> {
    if (this.connectionPromise) {
      await this.connectionPromise;
    }
    return !this.fallbackToLocal;
  }

  /**
   * Check if using Redis or local memory
   */
  isUsingRedis(): boolean {
    return !this.fallbackToLocal && this.redis !== null;
  }

  private sessionKey(sessionId: string): string {
    return `${this.config.keyPrefix}${sessionId}`;
  }

  private lockKey(sessionId: string): string {
    return `${this.config.keyPrefix}${sessionId}:lock`;
  }

  private executedSetKey(sessionId: string): string {
    return `${this.config.keyPrefix}${sessionId}:executed`;
  }

  // Acquire lock atomically
  async acquireLock(sessionId: string, requestId: string): Promise<boolean> {
    if (this.fallbackToLocal || !this.redis) {
      return this.localMemory.acquireLock(sessionId, requestId);
    }

    try {
      const result = await this.redis!.eval(
        ACQUIRE_LOCK_SCRIPT,
        [this.lockKey(sessionId)],
        [requestId, Math.ceil(this.config.lockTimeout / 1000)]
      );
      return result === 1;
    } catch (error) {
      console.error('[RedisSessionMemory] Lock acquisition failed, falling back to local:', error);
      return this.localMemory.acquireLock(sessionId, requestId);
    }
  }

  // Release lock (only by owner)
  async releaseLock(sessionId: string, requestId: string): Promise<void> {
    if (this.fallbackToLocal || !this.redis) {
      return this.localMemory.releaseLock(sessionId, requestId);
    }

    try {
      await this.redis!.eval(
        RELEASE_LOCK_SCRIPT,
        [this.lockKey(sessionId)],
        [requestId]
      );
    } catch (error) {
      console.error('[RedisSessionMemory] Lock release failed:', error);
      this.localMemory.releaseLock(sessionId, requestId);
    }
  }

  // Check if draft was already executed (idempotency)
  async isExecuted(sessionId: string, hash: string): Promise<boolean> {
    if (this.fallbackToLocal || !this.redis) {
      return this.localMemory.isExecuted(sessionId, hash);
    }

    try {
      const result = await this.redis!.sismember(
        this.executedSetKey(sessionId),
        hash
      );
      return result === 1;
    } catch (error) {
      console.error('[RedisSessionMemory] isExecuted check failed, falling back to local:', error);
      return this.localMemory.isExecuted(sessionId, hash);
    }
  }

  // Mark draft as executed
  async markExecuted(sessionId: string, hash: string): Promise<void> {
    if (this.fallbackToLocal || !this.redis) {
      return this.localMemory.markExecuted(sessionId, hash);
    }

    try {
      const key = this.executedSetKey(sessionId);
      await this.redis!.sadd(key, hash);
      await this.redis!.expire(key, this.config.sessionTTL);
    } catch (error) {
      console.error('[RedisSessionMemory] markExecuted failed, falling back to local:', error);
      return this.localMemory.markExecuted(sessionId, hash);
    }
  }

  // Get pending draft hash
  async getPendingDraft(sessionId: string): Promise<string | null> {
    if (this.fallbackToLocal || !this.redis) {
      return this.localMemory.getPendingDraftHash(sessionId);
    }

    try {
      const data = await this.redis!.get(this.sessionKey(sessionId));
      if (!data) return null;
      
      try {
        const parsed: RedisSessionData = JSON.parse(data);
        return parsed.pendingDraftHash || null;
      } catch {
        return null;
      }
    } catch (error) {
      console.error('[RedisSessionMemory] getPendingDraft failed, falling back to local:', error);
      return this.localMemory.getPendingDraftHash(sessionId);
    }
  }

  // Set pending draft
  async setPendingDraft(sessionId: string, hash: string): Promise<boolean> {
    if (this.fallbackToLocal || !this.redis) {
      return this.localMemory.setPendingDraft(sessionId, hash);
    }

    try {
      const key = this.sessionKey(sessionId);
      const existing = await this.redis!.get(key);
      
      if (existing) {
        const parsed: RedisSessionData = JSON.parse(existing);
        if (parsed.pendingDraftHash) {
          return false; // Already has pending draft
        }
      }

      const data: RedisSessionData = existing ? JSON.parse(existing) : {
        pendingDraftHash: null,
        lastActivity: Date.now(),
        businessId: null,
        lockVersion: 0,
      };
      data.pendingDraftHash = hash;
      data.lastActivity = Date.now();
      
      await this.redis!.set(
        key,
        JSON.stringify(data),
        'EX',
        this.config.sessionTTL
      );
      return true;
    } catch (error) {
      console.error('[RedisSessionMemory] setPendingDraft failed, falling back to local:', error);
      return this.localMemory.setPendingDraft(sessionId, hash);
    }
  }

  // Clear pending draft
  async clearPendingDraft(sessionId: string): Promise<void> {
    if (this.fallbackToLocal || !this.redis) {
      return this.localMemory.clearPendingDraft(sessionId);
    }

    try {
      const key = this.sessionKey(sessionId);
      const data = await this.redis!.get(key);
      
      if (data) {
        const parsed: RedisSessionData = JSON.parse(data);
        parsed.pendingDraftHash = null;
        parsed.lastActivity = Date.now();
        await this.redis!.set(key, JSON.stringify(parsed), 'EX', this.config.sessionTTL);
      }
    } catch (error) {
      console.error('[RedisSessionMemory] clearPendingDraft failed, falling back to local:', error);
      return this.localMemory.clearPendingDraft(sessionId);
    }
  }

  // Set business ID for session (security)
  async setBusinessId(sessionId: string, businessId: string): Promise<boolean> {
    if (this.fallbackToLocal || !this.redis) {
      return this.localMemory.setBusinessId(sessionId, businessId);
    }

    try {
      const key = this.sessionKey(sessionId);
      const existing = await this.redis!.get(key);
      
      if (existing) {
        const parsed: RedisSessionData = JSON.parse(existing);
        // Security: Prevent session hijacking
        if (parsed.businessId && parsed.businessId !== businessId) {
          return false; // Already bound to different business
        }
      }

      const data: RedisSessionData = existing ? JSON.parse(existing) : {
        pendingDraftHash: null,
        lastActivity: Date.now(),
        businessId: null,
        lockVersion: 0,
      };
      data.businessId = businessId;
      data.lastActivity = Date.now();
      
      await this.redis!.set(key, JSON.stringify(data), 'EX', this.config.sessionTTL);
      return true;
    } catch (error) {
      console.error('[RedisSessionMemory] setBusinessId failed, falling back to local:', error);
      return this.localMemory.setBusinessId(sessionId, businessId);
    }
  }

  // Validate business ID matches session
  async validateBusinessId(sessionId: string, businessId: string): Promise<boolean> {
    if (this.fallbackToLocal || !this.redis) {
      return this.localMemory.validateBusinessId(sessionId, businessId);
    }

    try {
      const key = this.sessionKey(sessionId);
      const data = await this.redis!.get(key);
      
      if (!data) return true; // No session yet, allow
      
      const parsed: RedisSessionData = JSON.parse(data);
      return parsed.businessId === null || parsed.businessId === businessId;
    } catch (error) {
      console.error('[RedisSessionMemory] validateBusinessId failed, falling back to local:', error);
      return this.localMemory.validateBusinessId(sessionId, businessId);
    }
  }

  // Execute with lock protection (atomic operation)
  async withLock<T>(
    sessionId: string,
    requestId: string,
    action: () => Promise<T>
  ): Promise<{ success: boolean; result?: T; error?: 'LOCK_FAILED' }> {
    const acquired = await this.acquireLock(sessionId, requestId);
    if (!acquired) {
      return { success: false, error: 'LOCK_FAILED' };
    }

    try {
      const result = await action();
      return { success: true, result };
    } finally {
      await this.releaseLock(sessionId, requestId);
    }
  }

  // Get session statistics
  async getSessionStats(sessionId: string): Promise<{
    pendingDraft: string | null;
    lastActivity: number | null;
    businessId: string | null;
  }> {
    if (this.fallbackToLocal || !this.redis) {
      const session = this.localMemory.getSession(sessionId);
      return {
        pendingDraft: session.pendingDraftHash,
        lastActivity: session.lastActivity,
        businessId: session.businessId,
      };
    }

    try {
      const key = this.sessionKey(sessionId);
      const data = await this.redis!.get(key);
      
      if (!data) {
        return { pendingDraft: null, lastActivity: null, businessId: null };
      }
      
      const parsed: RedisSessionData = JSON.parse(data);
      return {
        pendingDraft: parsed.pendingDraftHash,
        lastActivity: parsed.lastActivity,
        businessId: parsed.businessId,
      };
    } catch (error) {
      console.error('[RedisSessionMemory] getSessionStats failed:', error);
      return { pendingDraft: null, lastActivity: null, businessId: null };
    }
  }

  // Cleanup expired sessions (for Redis, this is automatic via TTL)
  async cleanup(): Promise<number> {
    // Redis handles TTL automatically, but clean up local memory
    return this.localMemory.cleanup();
  }

  // Get statistics
  getStats(): { mode: 'redis' | 'memory'; localStats?: ReturnType<typeof sessionMemory.getStats> } {
    return {
      mode: this.fallbackToLocal ? 'memory' : 'redis',
      localStats: this.localMemory.getStats(),
    };
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    mode: 'redis' | 'memory';
    latency?: number;
    error?: string;
  }> {
    if (this.fallbackToLocal || !this.redis) {
      return {
        status: 'degraded',
        mode: 'memory',
        error: 'Redis not available, using in-memory fallback',
      };
    }

    try {
      const start = Date.now();
      // Simple ping using get on a non-existent key
      await this.redis!.get('__health_check__');
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        mode: 'redis',
        latency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        mode: 'redis',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Disconnect from Redis
  async disconnect(): Promise<void> {
    if (this.redis && this.redis.disconnect) {
      await this.redis.disconnect();
    }
  }
}

// Singleton instance
export const redisSessionMemory = new RedisSessionMemory();
