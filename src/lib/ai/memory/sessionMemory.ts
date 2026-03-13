// Session Memory with Concurrency Protection
// PART OF PHASE 9 ZERO-TRUST AUDIT
// Prevents race conditions in AI chat confirmation flow

// ============================================================
// TYPES
// ============================================================

export interface SessionState {
  sessionId: string;
  pendingDraftHash: string | null;
  executedHashes: Set<string>;
  lastActivity: number;
  lockVersion: number; // Optimistic locking
  businessId: string | null;
}

export interface LockState {
  locked: boolean;
  owner: string;
  acquiredAt: number;
}

// ============================================================
// SESSION MEMORY CLASS
// ============================================================

export class SessionMemory {
  private sessions = new Map<string, SessionState>();
  private locks = new Map<string, LockState>();
  
  // Configuration
  private readonly LOCK_TIMEOUT_MS = 30 * 1000; // 30 seconds
  private readonly DEFAULT_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes
  
  // ============================================================
  // LOCK MANAGEMENT (PREVENTS RACE CONDITIONS)
  // ============================================================
  
  /**
   * Acquire lock for session (prevents race conditions)
   * Uses request ID as owner to prevent lock stealing
   */
  acquireLock(sessionId: string, requestId: string): boolean {
    const now = Date.now();
    const lock = this.locks.get(sessionId);
    
    // Check if lock exists and is still valid
    if (lock && lock.locked) {
      // Check if lock has timed out
      if (now - lock.acquiredAt > this.LOCK_TIMEOUT_MS) {
        // Lock expired, allow acquisition
        this.locks.set(sessionId, { 
          locked: true, 
          owner: requestId, 
          acquiredAt: now 
        });
        return true;
      }
      
      // Same owner can re-acquire
      if (lock.owner === requestId) {
        return true;
      }
      
      // Lock held by another request
      return false;
    }
    
    // No existing lock, acquire it
    this.locks.set(sessionId, { 
      locked: true, 
      owner: requestId, 
      acquiredAt: now 
    });
    return true;
  }
  
  /**
   * Release lock for session
   * Only the lock owner can release it
   */
  releaseLock(sessionId: string, requestId: string): void {
    const lock = this.locks.get(sessionId);
    if (lock && lock.owner === requestId) {
      this.locks.set(sessionId, { locked: false, owner: '', acquiredAt: 0 });
    }
  }
  
  /**
   * Force release lock (admin use only)
   */
  forceReleaseLock(sessionId: string): void {
    this.locks.delete(sessionId);
  }
  
  /**
   * Check if session is locked
   */
  isLocked(sessionId: string): boolean {
    const lock = this.locks.get(sessionId);
    if (!lock || !lock.locked) return false;
    
    // Check timeout
    if (Date.now() - lock.acquiredAt > this.LOCK_TIMEOUT_MS) {
      return false;
    }
    return true;
  }
  
  // ============================================================
  // SESSION STATE MANAGEMENT
  // ============================================================
  
  /**
   * Get or create session state
   */
  getSession(sessionId: string): SessionState {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        pendingDraftHash: null,
        executedHashes: new Set(),
        lastActivity: Date.now(),
        lockVersion: 0,
        businessId: null,
      };
      this.sessions.set(sessionId, session);
    }
    return session;
  }
  
  /**
   * Update session with optimistic locking
   * Returns false if version mismatch (concurrent modification)
   */
  updateSession(
    sessionId: string, 
    updates: Partial<SessionState>,
    expectedVersion?: number
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    // Optimistic locking check
    if (expectedVersion !== undefined && session.lockVersion !== expectedVersion) {
      return false; // Version mismatch - concurrent modification
    }
    
    // Apply updates
    Object.assign(session, updates, {
      lastActivity: Date.now(),
      lockVersion: session.lockVersion + 1,
    });
    
    return true;
  }
  
  /**
   * Set business ID for session (security)
   */
  setBusinessId(sessionId: string, businessId: string): boolean {
    const session = this.getSession(sessionId);
    
    // Security: Prevent session hijacking
    if (session.businessId && session.businessId !== businessId) {
      return false; // Already bound to different business
    }
    
    session.businessId = businessId;
    session.lastActivity = Date.now();
    return true;
  }
  
  /**
   * Validate business ID matches session
   */
  validateBusinessId(sessionId: string, businessId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return true; // No session yet, allow
    return session.businessId === null || session.businessId === businessId;
  }
  
  // ============================================================
  // DRAFT EXECUTION TRACKING (IDEMPOTENCY)
  // ============================================================
  
  /**
   * Check for duplicate execution (idempotency)
   */
  isExecuted(sessionId: string, hash: string): boolean {
    const session = this.sessions.get(sessionId);
    return session ? session.executedHashes.has(hash) : false;
  }
  
  /**
   * Mark draft as executed
   */
  markExecuted(sessionId: string, hash: string): void {
    const session = this.getSession(sessionId);
    session.executedHashes.add(hash);
    session.pendingDraftHash = null;
    session.lastActivity = Date.now();
    session.lockVersion++;
  }
  
  /**
   * Set pending draft hash
   * Returns false if already has pending draft
   */
  setPendingDraft(sessionId: string, hash: string): boolean {
    const session = this.getSession(sessionId);
    if (session.pendingDraftHash) {
      return false; // Already has pending draft
    }
    session.pendingDraftHash = hash;
    session.lastActivity = Date.now();
    return true;
  }
  
  /**
   * Clear pending draft
   */
  clearPendingDraft(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.pendingDraftHash = null;
      session.lastActivity = Date.now();
    }
  }
  
  /**
   * Get pending draft hash
   */
  getPendingDraftHash(sessionId: string): string | null {
    const session = this.sessions.get(sessionId);
    return session?.pendingDraftHash || null;
  }
  
  // ============================================================
  // CLEANUP
  // ============================================================
  
  /**
   * Cleanup expired sessions
   */
  cleanup(maxAgeMs: number = this.DEFAULT_MAX_AGE_MS): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastActivity > maxAgeMs) {
        this.sessions.delete(id);
        this.locks.delete(id);
        cleaned++;
      }
    }
    
    return cleaned;
  }
  
  /**
   * Clear all sessions (testing only)
   */
  clearAll(): void {
    this.sessions.clear();
    this.locks.clear();
  }
  
  // ============================================================
  // STATISTICS
  // ============================================================
  
  /**
   * Get memory statistics
   */
  getStats(): {
    sessionCount: number;
    lockedCount: number;
    pendingCount: number;
    executedCount: number;
  } {
    let pendingCount = 0;
    let executedCount = 0;
    
    for (const session of this.sessions.values()) {
      if (session.pendingDraftHash) pendingCount++;
      executedCount += session.executedHashes.size;
    }
    
    return {
      sessionCount: this.sessions.size,
      lockedCount: Array.from(this.locks.values()).filter(l => l.locked).length,
      pendingCount,
      executedCount,
    };
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const sessionMemory = new SessionMemory();

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Execute action with lock protection
 * Automatically acquires and releases lock
 */
export async function withLock<T>(
  sessionId: string,
  requestId: string,
  action: () => Promise<T>
): Promise<{ success: boolean; result?: T; error?: 'LOCK_FAILED' }> {
  if (!sessionMemory.acquireLock(sessionId, requestId)) {
    return { success: false, error: 'LOCK_FAILED' };
  }
  
  try {
    const result = await action();
    return { success: true, result };
  } finally {
    sessionMemory.releaseLock(sessionId, requestId);
  }
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
