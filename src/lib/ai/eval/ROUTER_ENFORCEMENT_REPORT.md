# Router Decision Tree Enforcement Report

**Task ID**: 1-3  
**Date**: 2025-01-XX  
**Auditor**: Zero-Trust Audit Agent  

---

## 1. Execution Flow Analysis

**Source File**: `/src/app/api/ai/chat/route.ts` (754 lines)

### Decision Tree Documentation

| Step | Operation | Status | Implementation |
|------|-----------|--------|----------------|
| 1 | Load session | ✅ PASS | `pendingActions.get(sessionId)` - Line 513 |
| 2 | Check pendingDraftAction + confirm → EXECUTE | ⚠️ PARTIAL | `if (confirm)` - Line 515 |
| 3 | Run planner (intent-parser) | ✅ PASS | `parseIntent(message, context)` - Line 603 |
| 4 | Validate JSON schema | ✅ PASS | `repairAIResponse()` - Line 709 |
| 5 | Write intent → confirm | ✅ PASS | `buildConfirmationResponse()` - Line 680 |
| 6 | Money/stock/report → tools | ✅ PASS | Handled via `executeAction()` |
| 7 | Execute tools | ✅ PASS | `executeAction(erpClient, ...)` - Line 541 |
| 8 | Respond | ✅ PASS | `NextResponse.json(...)` - Multiple returns |

---

## 2. Confirmation Flow Analysis

### Current Implementation (Lines 513-563)

```typescript
const pendingAction = pendingActions.get(sessionId);

if (confirm) {
  // User is trying to confirm an action
  if (!pendingAction) {
    return NextResponse.json(buildSafeErrorResponse('no_pending_action', language));
  }
  
  // Security: Verify action belongs to this business
  if (pendingAction.businessId !== businessId) {
    logSafeError('Cross-business action attempt', { sessionId, businessId });
    pendingActions.delete(sessionId);
    return NextResponse.json(buildSafeErrorResponse('cross_business_denied', language));
  }
  
  // Check if action expired
  if (pendingAction.expiresAt < Date.now()) {
    pendingActions.delete(sessionId);
    return NextResponse.json(buildSafeErrorResponse('action_expired', language));
  }
  
  // Execute the action
  const result = await executeAction(erpClient, pendingAction.type, pendingAction.parameters, language);
  pendingActions.delete(sessionId);
  
  return NextResponse.json(buildResponse(...));
}
```

### Gap Analysis

#### Gap 1: No Explicit "yes/হ্যাঁ" Word Detection

**Status**: ❌ FAIL

**Issue**: The confirmation flow only checks for `confirm: boolean` flag. Natural language confirmations like "yes", "হ্যাঁ", "ok", "confirm", etc. are NOT detected.

**Current Code** (Line 515):
```typescript
if (confirm) {  // Only checks boolean flag from request
```

**Missing Logic**:
```typescript
// NOT IMPLEMENTED - Should detect natural language confirmation
const confirmWords = ['yes', 'হ্যাঁ', 'ok', 'okay', 'confirm', 'নিশ্চিত', 'হ্যাঁ', 'হু'];
const isNaturalConfirm = confirmWords.some(word => 
  message.toLowerCase().includes(word)
);
```

**Recommendation**: Add natural language confirmation detection for better UX.

---

#### Gap 2: No Bypass Protection

**Status**: ⚠️ PARTIAL

**Current Protections**:
1. ✅ Business ID validation (Line 524)
2. ✅ Action expiration check (Line 533)
3. ✅ Session-scoped pending actions (Map with sessionId key)

**Missing Protections**:
1. ❌ No CSRF protection for confirm action
2. ❌ No rate limiting specific to confirmations
3. ❌ No audit logging of action executions
4. ❌ No replay attack prevention (same action could be re-executed with new confirmation)

**Recommendation**: Add the following protections:
```typescript
// Recommended additions
interface PendingAction {
  // ... existing fields
  nonce: string;           // Prevent replay attacks
  confirmedAt?: number;    // Audit timestamp
  ipAddress?: string;      // For security logging
}
```

---

#### Gap 3: No Tool-First Enforcement

**Status**: ❌ FAIL

**Issue**: The system does not enforce tool-first behavior for data-sensitive operations. The LLM can generate responses without tool verification.

**Current Flow**:
```
User Message → Intent Parser → LLM Generation → Response
```

**Recommended Flow**:
```
User Message → Intent Parser → Tool Execution (for data queries) → LLM Enhancement → Response
```

**Evidence** (Lines 688-718):
```typescript
if (intentResult.intent === 'query') {
  const contextString = formatContextForLLM(...);
  const systemPrompt = buildSystemPrompt(contextString, language, 'json');
  
  // LLM generates response based on context - NO TOOL ENFORCEMENT
  llmResponse = await generateWithFallback(systemPrompt, message, language);
  
  // Tables are added AFTER LLM response
  const tables = buildTablesForQuery(message, items, parties, sales, lowStock, language);
}
```

**Recommendation**: For queries about financial data, enforce tool execution first:
```typescript
// Recommended enforcement
if (intentResult.intent === 'query' && requiresToolExecution(intentResult)) {
  // MUST execute tools first
  const toolData = await executeQueryTools(intentResult);
  // Then enhance with LLM
  llmResponse = await enhanceWithLLM(toolData, message);
}
```

---

## 3. Intent Detection Security

### Intent Parser Analysis (`intent-parser.ts`)

**Supported Intents**:
- `query` - Data retrieval
- `create_sale` - Sales transaction
- `create_expense` - Expense recording
- `create_payment` - Payment collection
- `create_party` - Party creation
- `create_item` - Item creation
- `update_sale` - Sale modification
- `update_party` - Party modification
- `informative` - General information

### Security Considerations

| Intent | Validation | Confirmation | Tool Execution |
|--------|------------|--------------|----------------|
| create_sale | Item ID, Party ID, Quantity | ✅ Required | ✅ Via ERP Client |
| create_expense | Amount, Category | ✅ Required | ✅ Via ERP Client |
| create_payment | Party ID, Amount | ✅ Required | ✅ Via ERP Client |
| query | None required | ❌ N/A | ⚠️ Post-LLM only |
| informative | None required | ❌ N/A | ❌ No tools |

---

## 4. Rate Limiting

**Implementation** (`safe-response.ts`, Lines 139-172):

```typescript
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30;

export function checkRateLimit(identifier: string): boolean {
  // In-memory rate limiting
  // Key: `${businessId}:${userId}`
}
```

**Assessment**: ✅ PASS - Basic rate limiting implemented

**Improvement Needed**: Use Redis for distributed deployments

---

## 5. Input Validation

**Implementation** (`safe-response.ts`, Lines 82-136):

| Field | Required | Validation |
|-------|----------|------------|
| businessId | ✅ Yes | Non-empty string |
| message | ✅ Yes | Non-empty string after trim |
| userId | ❌ No | Defaults to 'system' |
| sessionId | ❌ No | Defaults to businessId |
| confirm | ❌ No | Boolean check |
| language | ❌ No | Defaults to 'en' |

**Assessment**: ✅ PASS - Core inputs validated

---

## 6. Error Handling

**Safe Error Messages** (`safe-response.ts`):

All error messages are sanitized and contain no internal paths:
- `missing_business_id` → "Session expired. Please log in again."
- `missing_message` → "Please enter a message."
- `no_pending_action` → "No pending action to confirm."
- `action_expired` → "Action expired. Please try again."
- `erp_unavailable` → "Service temporarily unavailable."
- `cross_business_denied` → "Access denied."

**Assessment**: ✅ PASS - No information leakage

---

## 7. Recommendations

### High Priority

1. **Add Natural Language Confirmation Detection**
   ```typescript
   const CONFIRM_WORDS = ['yes', 'হ্যাঁ', 'ok', 'okay', 'confirm', 'নিশ্চিত', 'সঠিক'];
   const DECLINE_WORDS = ['no', 'না', 'cancel', 'বাতিল'];
   
   function detectConfirmation(message: string): boolean | null {
     const lower = message.toLowerCase().trim();
     if (CONFIRM_WORDS.some(w => lower === w || lower.startsWith(w + ' '))) return true;
     if (DECLINE_WORDS.some(w => lower === w || lower.startsWith(w + ' '))) return false;
     return null;
   }
   ```

2. **Add Replay Attack Prevention**
   ```typescript
   interface PendingAction {
     nonce: string;
     confirmedAt?: number;
   }
   
   // Use crypto.randomUUID() for nonce
   ```

3. **Add Tool-First Enforcement for Data Queries**
   - Define a list of intents that MUST use tools
   - Execute tools before LLM for data integrity

### Medium Priority

4. **Add Audit Logging**
   ```typescript
   logAudit('ACTION_EXECUTED', { type, parameters, userId, businessId, timestamp });
   ```

5. **Add Confirmation Rate Limiting**
   - Limit confirmation attempts per action
   - Block after 3 failed confirmations

### Low Priority

6. **Add Intent Confidence Threshold**
   - Require manual confirmation for low-confidence intents
   - Current implementation doesn't check confidence scores

---

## 8. Summary

| Category | Status | Notes |
|----------|--------|-------|
| Execution Flow | ✅ PASS | All steps implemented |
| Confirmation Flow | ⚠️ PARTIAL | Missing natural language detection |
| Bypass Protection | ⚠️ PARTIAL | Basic protections in place |
| Tool-First Enforcement | ❌ FAIL | Not implemented |
| Rate Limiting | ✅ PASS | In-memory, needs Redis for production |
| Input Validation | ✅ PASS | Core fields validated |
| Error Handling | ✅ PASS | Safe messages only |

**Overall Assessment**: The router implements core decision tree logic but has gaps in natural language confirmation detection and tool-first enforcement that should be addressed for production security.

---

## 9. Action Items

- [ ] Implement natural language confirmation word detection
- [ ] Add nonce-based replay attack prevention
- [ ] Enforce tool-first execution for financial queries
- [ ] Add comprehensive audit logging
- [ ] Migrate rate limiting to Redis for production
- [ ] Add confidence threshold checking for intents
