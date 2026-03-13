# Confirmation Integrity Report

**Task ID**: 6-7  
**Phase**: 6 - Confirmation Enforcement Deep Audit  
**Date**: $(date +%Y-%m-%d)  
**Agent**: general-purpose

---

## Executive Summary

This report documents the audit of the confirmation flow in the AI Orchestrator (`/src/app/api/ai/chat/route.ts`) and identifies gaps in idempotency protection, double confirmation prevention, and draft hash mechanisms.

---

## Current Implementation Analysis

### Existing Confirmation Flow (Lines 39-58, 509-563)

#### Strengths
1. **TTL Mechanism**: Pending actions expire after 5 minutes (`PENDING_ACTION_TTL_MS`)
2. **Business ID Validation**: Cross-business action attempts are blocked (line 524-530)
3. **Expiration Check**: Expired actions are rejected (line 533-538)
4. **Session-based Storage**: Uses `sessionId` to track pending actions
5. **Cleanup Interval**: Periodic cleanup of expired actions every 60 seconds

#### Critical Gaps Identified

| Gap | Severity | Description |
|-----|----------|-------------|
| **No Draft Hash** | HIGH | No deterministic hash to identify duplicate actions |
| **No Executed Draft Tracking** | HIGH | Once executed, there's no record to prevent replay |
| **No Idempotency Protection** | HIGH | Same action can be submitted multiple times |
| **No Double Confirmation Prevention** | MEDIUM | User can confirm the same action multiple times |
| **In-Memory Storage** | MEDIUM | State lost on server restart; not scalable |

---

## Code Flow Analysis

### Pending Action Storage
```typescript
interface PendingAction {
  type: ActionType;
  parameters: Record<string, unknown>;
  timestamp: number;
  businessId: string;  // Security context
  expiresAt: number;   // Expiration
}
const pendingActions = new Map<string, PendingAction>();
```

**Issue**: Keyed by `sessionId`, not by action hash. This means:
- Same action from different sessions = different keys (not deduplicated)
- Same action confirmed twice from same session = second confirmation would fail (no pending action)

### Confirmation Flow (confirm=true)
```typescript
if (confirm) {
  if (!pendingAction) {
    return error('no_pending_action');
  }
  if (pendingAction.businessId !== businessId) {
    return error('cross_business_denied');
  }
  if (pendingAction.expiresAt < Date.now()) {
    return error('action_expired');
  }
  // Execute and delete
  await executeAction(...);
  pendingActions.delete(sessionId);
}
```

**Issue**: After execution, there's no record that this action was executed. A malicious user could:
1. Submit the same sale again
2. Get a new pending action
3. Confirm it again
4. Create duplicate records

---

## Recommendations

### 1. Implement Draft Hash Mechanism
```typescript
function generateDraftHash(actionType: string, parameters: Record<string, unknown>): string {
  const sorted = JSON.stringify(Object.entries(parameters).sort());
  return `${actionType}:${Buffer.from(sorted).toString('base64')}`;
}
```

### 2. Track Executed Draft Hashes
```typescript
const executedDraftHashes = new Set<string>();

function isDraftExecuted(hash: string): boolean {
  return executedDraftHashes.has(hash);
}

function markDraftExecuted(hash: string): void {
  executedDraftHashes.add(hash);
  // Optional: Persist to Redis with TTL
}
```

### 3. Add Idempotency Check Before Execution
```typescript
const hash = generateDraftHash(pendingAction.type, pendingAction.parameters);
if (isDraftExecuted(hash)) {
  return error('already_executed');
}
await executeAction(...);
markDraftExecuted(hash);
```

### 4. Use Redis for Production
- Store pending actions in Redis with TTL
- Store executed hashes in Redis with longer TTL (24 hours)
- Enable distributed locking for multi-instance deployments

---

## Created Guard Module

### `/src/lib/ai/guards/confirmationGuard.ts`

This module provides:
- `PendingDraft` interface with hash field
- `ConfirmationState` with `executedDraftHashes` tracking
- `generateDraftHash()` for deterministic action identification
- `isDraftExecuted()` for idempotency checking
- `markDraftExecuted()` for recording executed actions
- `detectConfirmationWord()` for natural language confirmation detection
- Extended utilities: `validateConfirmation()`, `cleanupExpiredDrafts()`, etc.

---

## Test Scenarios

### Scenario 1: Double Confirmation Prevention
1. User submits: "Sell 5 rice"
2. System creates pending action with hash `create_sale:eyIuLi4ifQ==`
3. User confirms: "yes"
4. System executes, marks hash as executed
5. User tries to confirm again: System rejects with "already executed"

### Scenario 2: Cross-Business Attack
1. User from Business A has pending action
2. Attacker tries to confirm with Business B's credentials
3. System rejects with "cross business denied"

### Scenario 3: Expired Action
1. User submits action
2. Waits 6 minutes (TTL is 5 min)
3. Tries to confirm
4. System rejects with "action expired"

---

## Compliance Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| Draft hash mechanism | CREATED | In confirmationGuard.ts |
| Executed draft tracking | CREATED | Set-based tracking |
| Idempotency protection | CREATED | Hash-based deduplication |
| Double confirmation prevention | CREATED | Via executed hash set |
| Bengali confirmation words | CREATED | CONFIRM_WORDS_BN array |
| Bengali cancel words | CREATED | CANCEL_WORDS_BN array |

---

## Next Steps

1. **Integrate** `confirmationGuard.ts` into `route.ts`
2. **Add Redis** for production persistence
3. **Add unit tests** for guard functions
4. **Add monitoring** for duplicate execution attempts

---

**Audit Completed**: Phase 6 Confirmation Enforcement Deep Audit
