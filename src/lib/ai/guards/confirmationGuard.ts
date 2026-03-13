// Confirmation Guard - Prevents duplicate execution and ensures idempotency
// PART OF PHASE 6-7 ZERO-TRUST AUDIT

export interface PendingDraft {
  hash: string;
  actionType: string;
  parameters: Record<string, unknown>;
  createdAt: number;
  expiresAt: number;
  executed: boolean;
}

export interface ConfirmationState {
  pendingDrafts: Map<string, PendingDraft>;
  executedDraftHashes: Set<string>;
}

// Generate hash from action parameters
export function generateDraftHash(actionType: string, parameters: Record<string, unknown>): string {
  const sorted = JSON.stringify(Object.entries(parameters).sort());
  return `${actionType}:${Buffer.from(sorted).toString('base64')}`;
}

// Check if draft was already executed
export function isDraftExecuted(state: ConfirmationState, hash: string): boolean {
  return state.executedDraftHashes.has(hash);
}

// Mark draft as executed
export function markDraftExecuted(state: ConfirmationState, hash: string): void {
  state.executedDraftHashes.add(hash);
  const draft = state.pendingDrafts.get(hash);
  if (draft) {
    draft.executed = true;
  }
}

// Words that trigger confirmation
export const CONFIRM_WORDS_EN = ['yes', 'ok', 'confirm', 'sure', 'proceed', 'do it', 'go ahead', 'yeah', 'yep'];
export const CONFIRM_WORDS_BN = ['হ্যাঁ', 'ঠিক আছে', 'নিশ্চিত', 'করো', 'হু', 'হ', 'অবশ্যই'];

// Words that cancel
export const CANCEL_WORDS_EN = ['no', 'cancel', 'stop', "don't", 'never mind'];
export const CANCEL_WORDS_BN = ['না', 'বাতিল', 'থাক', 'দরকার নেই'];

export function detectConfirmationWord(message: string): 'confirm' | 'cancel' | 'unknown' {
  const lower = message.toLowerCase().trim();
  
  // Check confirm words
  for (const word of [...CONFIRM_WORDS_EN, ...CONFIRM_WORDS_BN]) {
    if (lower === word.toLowerCase() || lower.includes(word.toLowerCase())) {
      return 'confirm';
    }
  }
  
  // Check cancel words
  for (const word of [...CANCEL_WORDS_EN, ...CANCEL_WORDS_BN]) {
    if (lower === word.toLowerCase() || lower.includes(word.toLowerCase())) {
      return 'cancel';
    }
  }
  
  return 'unknown';
}

// ============================================================
// EXTENDED CONFIRMATION GUARD UTILITIES
// ============================================================

/**
 * Creates a new confirmation state instance
 */
export function createConfirmationState(): ConfirmationState {
  return {
    pendingDrafts: new Map(),
    executedDraftHashes: new Set(),
  };
}

/**
 * Adds a pending draft to the state
 */
export function addPendingDraft(
  state: ConfirmationState,
  actionType: string,
  parameters: Record<string, unknown>,
  ttlMs: number = 5 * 60 * 1000
): PendingDraft {
  const hash = generateDraftHash(actionType, parameters);
  const now = Date.now();
  
  const draft: PendingDraft = {
    hash,
    actionType,
    parameters,
    createdAt: now,
    expiresAt: now + ttlMs,
    executed: false,
  };
  
  state.pendingDrafts.set(hash, draft);
  return draft;
}

/**
 * Gets a pending draft by hash
 */
export function getPendingDraft(state: ConfirmationState, hash: string): PendingDraft | undefined {
  return state.pendingDrafts.get(hash);
}

/**
 * Removes a pending draft
 */
export function removePendingDraft(state: ConfirmationState, hash: string): boolean {
  return state.pendingDrafts.delete(hash);
}

/**
 * Checks if a draft is pending (not expired and not executed)
 */
export function isDraftPending(state: ConfirmationState, hash: string): boolean {
  const draft = state.pendingDrafts.get(hash);
  if (!draft) return false;
  if (draft.executed) return false;
  if (draft.expiresAt < Date.now()) return false;
  return true;
}

/**
 * Cleans up expired drafts from state
 */
export function cleanupExpiredDrafts(state: ConfirmationState): number {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [hash, draft] of state.pendingDrafts.entries()) {
    if (draft.expiresAt < now) {
      state.pendingDrafts.delete(hash);
      cleaned++;
    }
  }
  
  return cleaned;
}

/**
 * Validates that a confirmation is safe to execute
 */
export function validateConfirmation(
  state: ConfirmationState,
  hash: string,
  businessId: string,
  expectedBusinessId: string
): { valid: boolean; error?: string } {
  // Check business ID match (security)
  if (businessId !== expectedBusinessId) {
    return { valid: false, error: 'CROSS_BUSINESS_DENIED' };
  }
  
  // Check if already executed (idempotency)
  if (isDraftExecuted(state, hash)) {
    return { valid: false, error: 'ALREADY_EXECUTED' };
  }
  
  // Check if draft exists and is pending
  if (!isDraftPending(state, hash)) {
    return { valid: false, error: 'NO_PENDING_DRAFT' };
  }
  
  return { valid: true };
}

/**
 * Gets statistics about the confirmation state
 */
export function getConfirmationStats(state: ConfirmationState): {
  pendingCount: number;
  executedCount: number;
  expiredCount: number;
} {
  const now = Date.now();
  let expiredCount = 0;
  
  for (const draft of state.pendingDrafts.values()) {
    if (draft.expiresAt < now && !draft.executed) {
      expiredCount++;
    }
  }
  
  return {
    pendingCount: state.pendingDrafts.size,
    executedCount: state.executedDraftHashes.size,
    expiredCount,
  };
}
