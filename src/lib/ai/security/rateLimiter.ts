// Rate Limiter for AI Operations
// Prevents abuse and ensures fair resource allocation

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (identifier: string) => string;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockedUntil?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;
  private cleanupInterval: ReturnType<typeof setInterval>;
  
  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }
  
  // Check if request is allowed
  check(identifier: string): RateLimitResult {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(identifier) 
      : identifier;
    
    const now = Date.now();
    const entry = this.limits.get(key);
    
    // Check if currently blocked
    if (entry?.blocked && entry.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.blockedUntil,
        retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
      };
    }
    
    // Check if window has expired
    if (!entry || now > entry.resetTime) {
      // Start new window
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
        blocked: false,
      });
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      };
    }
    
    // Check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      // Block for extended time on repeated violations
      const blockedUntil = now + Math.min(this.config.windowMs * 2, 300000); // Max 5 min
      
      this.limits.set(key, {
        ...entry,
        blocked: true,
        blockedUntil,
      });
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((blockedUntil - now) / 1000),
      };
    }
    
    // Increment count
    entry.count++;
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }
  
  // Consume a request (throws if limit exceeded)
  consume(identifier: string): RateLimitResult {
    const result = this.check(identifier);
    if (!result.allowed) {
      const error = new Error('Rate limit exceeded');
      (error as unknown as Record<string, unknown>).rateLimitResult = result;
      throw error;
    }
    return result;
  }
  
  // Reset limit for an identifier
  reset(identifier: string): void {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(identifier) 
      : identifier;
    this.limits.delete(key);
  }
  
  // Get current status for an identifier
  getStatus(identifier: string): RateLimitResult {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(identifier) 
      : identifier;
    
    const entry = this.limits.get(key);
    const now = Date.now();
    
    if (!entry || now > entry.resetTime) {
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
      };
    }
    
    return {
      allowed: entry.count < this.config.maxRequests && !entry.blocked,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime,
      retryAfter: entry.blockedUntil 
        ? Math.ceil((entry.blockedUntil - now) / 1000) 
        : undefined,
    };
  }
  
  // Cleanup expired entries
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime && (!entry.blockedUntil || now > entry.blockedUntil)) {
        this.limits.delete(key);
      }
    }
  }
  
  // Destroy the rate limiter
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.limits.clear();
  }
  
  // Get stats
  getStats(): { totalEntries: number; blockedCount: number } {
    let blockedCount = 0;
    const now = Date.now();
    
    for (const entry of this.limits.values()) {
      if (entry.blocked && entry.blockedUntil && now < entry.blockedUntil) {
        blockedCount++;
      }
    }
    
    return {
      totalEntries: this.limits.size,
      blockedCount,
    };
  }
}

// Pre-configured rate limiters for different use cases

// General AI chat rate limiter - 20 requests per minute per session
export const aiChatRateLimiter = new RateLimiter({
  maxRequests: 20,
  windowMs: 60000,
  keyGenerator: (sessionId) => `chat:${sessionId}`,
});

// Write operation rate limiter - 10 writes per minute per session
export const writeRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60000,
  keyGenerator: (sessionId) => `write:${sessionId}`,
});

// IP-based rate limiter - 100 requests per minute per IP
export const ipRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000,
  keyGenerator: (ip) => `ip:${ip}`,
});

// LLM generation rate limiter - 30 generations per minute per business
export const llmRateLimiter = new RateLimiter({
  maxRequests: 30,
  windowMs: 60000,
  keyGenerator: (businessId) => `llm:${businessId}`,
});

// Batch operation rate limiter - 5 batches per 5 minutes per session
export const batchRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 300000, // 5 minutes
  keyGenerator: (sessionId) => `batch:${sessionId}`,
});

// Token bucket for burst control
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per ms
  
  constructor(maxTokens: number, refillIntervalMs: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
    this.refillRate = maxTokens / refillIntervalMs;
  }
  
  consume(tokens: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }
  
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const refill = elapsed * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + refill);
    this.lastRefill = now;
  }
  
  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
  
  getTimeUntilAvailable(tokens: number = 1): number {
    this.refill();
    
    if (this.tokens >= tokens) return 0;
    
    const needed = tokens - this.tokens;
    return Math.ceil(needed / this.refillRate);
  }
}

// Token bucket instances for burst control
export const llmTokenBucket = new TokenBucket(10, 60000); // 10 tokens, refills in 1 min
export const writeTokenBucket = new TokenBucket(5, 60000); // 5 tokens for writes
