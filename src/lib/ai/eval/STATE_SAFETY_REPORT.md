# State Safety Report - Phase 9

## Concurrency & Race Condition Analysis

**Generated:** Task ID 9 - Zero-Trust Audit
**Target:** `/src/app/api/ai/chat/route.ts`

---

## Executive Summary

This report identifies critical race conditions and state safety issues in the AI chat endpoint. The analysis covers pending actions, session state, rate limiting, and draft storage mechanisms.

### Risk Level: HIGH

Multiple race conditions exist that could lead to:
- Double execution of actions (financial impact)
- Inconsistent session state
- Rate limit bypassing
- Data corruption

---

## Current Implementation Analysis

### 1. Pending Actions Map (`route.ts` lines 39-58)

```typescript
const pendingActions = new Map<string, PendingAction>();
```

**Issues Identified:**
- ❌ No locking mechanism
- ❌ No atomic operations
- ❌ Race condition between `get()` and `set()`
- ❌ No idempotency protection

**Race Condition Scenario:**
```
Request 1: pendingActions.get(sessionId) → returns action A
Request 2: pendingActions.get(sessionId) → returns action A
Request 1: executes action A
Request 2: executes action A (DUPLICATE!)
Request 1: pendingActions.delete(sessionId)
Request 2: pendingActions.delete(sessionId)
```

### 2. Session State Management (`route.ts` lines 513-563)

```typescript
const pendingAction = pendingActions.get(sessionId);

if (confirm) {
  if (!pendingAction) { ... }
  if (pendingAction.businessId !== businessId) { ... }
  if (pendingAction.expiresAt < Date.now()) { ... }
  // Execute action
  const result = await executeAction(...);
  pendingActions.delete(sessionId);
}
```

**Issues Identified:**
- ❌ No session-level locking
- ❌ Validation and execution not atomic
- ❌ Multiple confirmations can pass validation simultaneously
- ❌ No draft hash to prevent double execution

### 3. Rate Limiting (`safe-response.ts` lines 138-172)

```typescript
const requestTimestamps = new Map<string, number[]>();

export function checkRateLimit(identifier: string): boolean {
  const timestamps = requestTimestamps.get(identifier) || [];
  const recentTimestamps = timestamps.filter(...);
  // Not atomic!
  recentTimestamps.push(now);
  requestTimestamps.set(identifier, recentTimestamps);
  return true;
}
```

**Issues Identified:**
- ⚠️ No atomic increment operation
- ⚠️ Race condition in timestamp array update
- ⚠️ Could allow rate limit bypass under high concurrency

### 4. Draft Storage

**Issues Identified:**
- ❌ No draft hash mechanism in route.ts
- ❌ Uses sessionId as key (one draft per session only)
- ❌ No tracking of executed hashes
- ❌ Same action can be executed multiple times

---

## Race Condition Scenarios

### Scenario 1: Two Parallel Confirm Requests for Same Session

**Attack Vector:**
```
User clicks "Confirm" button twice rapidly
or
Network retry sends duplicate request

Timeline:
T0: Request 1 arrives → validates → passes
T1: Request 2 arrives → validates → passes (same pending action!)
T2: Request 1 executes action → sale created
T3: Request 2 executes action → DUPLICATE SALE CREATED
T4: Both delete from map
```

**Impact:** Double charge, duplicate records, financial loss

**Mitigation:** Session locking + executed hash tracking

### Scenario 2: Two Simultaneous Writes

**Attack Vector:**
```
Two different action requests arrive simultaneously

Timeline:
T0: Request 1: create_sale detected → stores pending action A
T1: Request 2: create_expense detected → stores pending action B
T2: Both stored with same sessionId → action A overwritten!
T3: User confirms → action B executes
T4: Action A lost, but user expected A
```

**Impact:** Lost actions, user confusion, unexpected behavior

**Mitigation:** Only one pending draft per session + draft hash

### Scenario 3: Rapid Repeated Messages

**Attack Vector:**
```
User spams messages rapidly

Timeline:
T0: Message 1 creates pending action
T1: Message 2 creates new pending action (overwrites!)
T2: Message 3 creates new pending action (overwrites!)
T3: User confirms thinking it's for message 1
T4: Wrong action executes
```

**Impact:** Wrong action execution, user trust issues

**Mitigation:** Reject new drafts while one pending

### Scenario 4: Session Reset Mid-Confirm

**Attack Vector:**
```
Session cleanup happens during confirmation

Timeline:
T0: User sends confirm request
T1: Validation passes (action exists)
T2: Session cleanup runs (TTL expired)
T3: Action deleted from map
T4: Execution attempts with deleted action
T5: Inconsistent state
```

**Impact:** Lost actions, inconsistent state

**Mitigation:** Lock during confirmation, extend TTL on access

---

## Concurrency Protection Status

| Component | Status | Protection |
|-----------|--------|------------|
| Pending Actions Map | ❌ UNSAFE | No locking |
| Session State | ❌ UNSAFE | No locking |
| Rate Limiting | ⚠️ WEAK | No atomic ops |
| Draft Storage | ❌ UNSAFE | No idempotency |
| Business ID Validation | ✅ SAFE | Checked |
| TTL Expiration | ✅ SAFE | Implemented |

---

## Recommendations

### Critical (Implement Immediately)

1. **Session Locking**
   ```typescript
   // Use sessionMemory.acquireLock() before any state modification
   if (!sessionMemory.acquireLock(sessionId, requestId)) {
     return NextResponse.json({ error: 'Request in progress' }, { status: 429 });
   }
   ```

2. **Idempotency Keys**
   ```typescript
   // Generate hash for each action
   const draftHash = generateDraftHash(actionType, parameters);
   if (sessionMemory.isExecuted(sessionId, draftHash)) {
     return NextResponse.json({ error: 'Already executed' });
   }
   ```

3. **Atomic Confirmation Flow**
   ```typescript
   // Use withLock helper for atomic operations
   const result = await withLock(sessionId, requestId, async () => {
     // Entire confirmation logic here
   });
   ```

### High Priority (Implement Soon)

4. **Rate Limit Atomic Operations**
   - Use Redis INCR for atomic rate limiting
   - Or use async-mutex for local atomic operations

5. **Pending Draft Validation**
   - Check for existing pending draft before creating new one
   - Return error if draft already pending

### Medium Priority (Future Improvements)

6. **Distributed Session Storage**
   - Move from in-memory to Redis
   - Enable multi-instance deployment

7. **Request Deduplication**
   - Add request ID header
   - Track processed request IDs

---

## Integration Guide

### Step 1: Import Session Memory

```typescript
import { 
  sessionMemory, 
  withLock, 
  generateRequestId 
} from '@/lib/ai/memory/sessionMemory';
import { generateDraftHash } from '@/lib/ai/guards/confirmationGuard';
```

### Step 2: Wrap Confirmation Flow

```typescript
// In route.ts POST handler
const requestId = generateRequestId();

// For confirmation
if (confirm) {
  const result = await withLock(sessionId, requestId, async () => {
    const draftHash = sessionMemory.getPendingDraftHash(sessionId);
    
    if (!draftHash) {
      return { error: 'NO_PENDING_DRAFT' };
    }
    
    if (sessionMemory.isExecuted(sessionId, draftHash)) {
      return { error: 'ALREADY_EXECUTED' };
    }
    
    // Execute action
    const execResult = await executeAction(erpClient, actionType, params, language);
    
    if (execResult.success) {
      sessionMemory.markExecuted(sessionId, draftHash);
    }
    
    return execResult;
  });
  
  // Handle result...
}
```

### Step 3: Store Draft with Hash

```typescript
// When creating pending action
const draftHash = generateDraftHash(actionType, params);

if (!sessionMemory.setPendingDraft(sessionId, draftHash)) {
  return NextResponse.json({ 
    error: 'Already have pending action. Confirm or cancel first.' 
  });
}
```

---

## Testing Checklist

- [ ] Parallel confirm requests → only one executes
- [ ] Rapid double-click → no duplicate action
- [ ] Session cleanup mid-confirm → graceful handling
- [ ] Rate limit under load → accurate limiting
- [ ] Concurrent different actions → proper queueing

---

## Files Created

1. `/src/lib/ai/memory/sessionMemory.ts` - Session memory with concurrency protection
   - Lock management (acquire/release)
   - Optimistic locking with version
   - Idempotency tracking
   - Session cleanup

---

## Conclusion

The current implementation has critical race conditions that could lead to financial loss through double execution. The `sessionMemory.ts` module provides the necessary concurrency protection through:

1. **Lock-based synchronization** - Prevents simultaneous access
2. **Optimistic locking** - Detects concurrent modifications
3. **Idempotency tracking** - Prevents double execution
4. **Atomic operations** - Ensures consistent state

**Recommended Action:** Integrate `sessionMemory.ts` into `route.ts` immediately to prevent potential financial losses from race conditions.
