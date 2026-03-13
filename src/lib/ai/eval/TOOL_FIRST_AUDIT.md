# Tool-First Compliance Audit Report

**Task ID**: 6-7  
**Phase**: 7 - Tool-First Compliance Deep Audit  
**Date**: $(date +%Y-%m-%d)  
**Agent**: general-purpose

---

## Executive Summary

This report documents the audit of the tool-first compliance in the AI Orchestrator (`/src/app/api/ai/chat/route.ts`), ensuring that data queries always use actual tool calls to ERP APIs rather than generating advisory responses or hallucinated data.

---

## Tool-First Principle

**Definition**: When a user asks for business data (sales, inventory, parties, etc.), the AI MUST:
1. Call the appropriate ERP API to fetch real data
2. Use ONLY the fetched data in the response
3. NEVER invent, estimate, or guess numbers
4. NEVER provide advisory responses like "I suggest you check..."

---

## Current Implementation Analysis

### ERP Data Fetching (Lines 576-597)
```typescript
const [statsResult, itemsResult, partiesResult, salesResult, expenseCatsResult, lowStockResult] 
  = await Promise.all([
    erpClient.getDashboardStats(),
    erpClient.getItems(undefined, 50),
    erpClient.getParties(),
    erpClient.getSales({ period: 'last_30_days' }),
    erpClient.getExpenseCategories(),
    erpClient.getLowStockItems(),
  ]);
```

#### Strengths
1. **Proactive Data Fetching**: Fetches context data before processing intent
2. **Parallel Fetching**: Uses `Promise.all` for efficiency
3. **Comprehensive Coverage**: Fetches stats, items, parties, sales, expenses, low stock

### Context Injection (Lines 117-226)
The `formatContextForLLM()` function builds a context string with actual data that's injected into the system prompt.

#### Strengths
1. **Data Injection**: Real numbers are provided to LLM
2. **Bilingual Support**: Both English and Bengali context
3. **Structured Sections**: Stats, items, parties, sales organized clearly

### System Prompt Rules (Lines 64-111)
```
STRICT RULES:
1. Use ONLY numbers from the provided data - NEVER invent, estimate, or guess any numbers
2. Be concise but helpful (2-4 sentences for simple queries)
3. Provide business insights when relevant
4. Respond in English
5. Use ৳ symbol for currency (Bangladeshi Taka)
6. If the answer is not in the provided data, clearly state that
```

#### Strengths
1. **Explicit Prohibition**: "NEVER invent, estimate, or guess"
2. **Currency Standard**: Uses ৳ symbol
3. **Honesty Requirement**: "If not in data, clearly state that"

---

## Compliance Gaps Identified

| Gap | Severity | Description |
|-----|----------|-------------|
| **No Tool Call Verification** | MEDIUM | No explicit check that response came from fetched data |
| **No Hallucination Detection** | MEDIUM | No pattern matching for estimated/approximate numbers |
| **No Advisory Response Detection** | MEDIUM | No blocking of "I suggest..." patterns |
| **Context Injection Quality** | LOW | Large context may overwhelm LLM |

---

## Intent-to-Tool Mapping

### Query Intent (Lines 688-718)
```typescript
if (intentResult.intent === 'query') {
  const contextString = formatContextForLLM(...);
  const systemPrompt = buildSystemPrompt(contextString, language, 'json');
  llmResponse = await generateWithFallback(systemPrompt, message, language);
  // Response uses injected context
}
```

**Compliance**: ✅ Query intent fetches data BEFORE LLM call

### Action Intents (Lines 609-682)
```typescript
if (intentResult.intent === 'create_sale' || ...) {
  // Parse entities
  // Validate with ERP data (e.g., find item by name)
  // Return confirmation request
}
```

**Compliance**: ✅ Action intents validate against ERP data

---

## Created Guard Module

### `/src/lib/ai/guards/toolFirstGuard.ts`

This module provides:

| Function | Purpose |
|----------|---------|
| `requiresToolCall()` | Check if intent requires tool calls |
| `requiresConfirmation()` | Check if intent needs confirmation |
| `validateToolFirstCompliance()` | Validate response has required data |
| `detectAdvisoryResponse()` | Detect "I suggest..." patterns |
| `checkToolFirstCompliance()` | Comprehensive compliance check |
| `detectHallucination()` | Detect "approximately/estimated" patterns |
| `ToolExecutionTracker` | Track tool executions per session |
| `shouldTriggerTool()` | Detect if message should trigger tools |

---

## Anti-Advisory Patterns

The guard blocks responses containing:

```typescript
const ADVISORY_PATTERNS = [
  /you would need to/i,
  /you should/i,
  /I suggest/i,
  /I recommend/i,
  /please try/i,
  /I'm not sure/i,
  /I cannot/i,
  /I can't/i,
];
```

**Rationale**: These patterns indicate the AI is not using tools and is instead providing advice.

---

## Hallucination Detection Patterns

```typescript
const HALLUCINATION_PATTERNS = [
  /approximately \d+/i,
  /around \d+/i,
  /roughly \d+/i,
  /estimated/i,
  /I estimate/i,
  /guess/i,
  /probably/i,
];
```

**Rationale**: These patterns indicate the AI is making up numbers instead of using real data.

---

## Tool Trigger Categories

| Category | Trigger Patterns |
|----------|------------------|
| Sales | sales, বিক্রি, sold, revenue, আয় |
| Inventory | stock, স্টক, inventory, items, পণ্য, low stock |
| Parties | customer, supplier, party, গ্রাহক, সাপ্লায়ার |
| Expenses | expense, খরচ, cost, spending |
| Payments | payment, পেমেন্ট, collect, pay, দেনা, পাওনা |

---

## Test Scenarios

### Scenario 1: Sales Query
- Input: "What were today's sales?"
- Expected: Fetch `getDashboardStats()`, return actual `todaySales` value
- Guard Check: Response contains `৳` and numeric data

### Scenario 2: Inventory Query
- Input: "Show me low stock items"
- Expected: Fetch `getLowStockItems()`, return actual items
- Guard Check: Response has table with real item names and quantities

### Scenario 3: Advisory Response Detection
- Input: "How do I add a new product?"
- Expected: Navigate to inventory page or provide instructions
- Guard Check: Advisory response is acceptable for informational queries

### Scenario 4: Hallucination Prevention
- Input: "What's my profit?"
- Expected: Use actual `todayProfit` from stats
- Guard Check: No "approximately" or "estimated" in response

---

## Compliance Status

| Requirement | Status | Notes |
|-------------|--------|-------|
| Tool call required for queries | VERIFIED | ERP fetch before LLM |
| Data injection before LLM | VERIFIED | formatContextForLLM |
| Advisory response detection | CREATED | ADVISORY_PATTERNS |
| Hallucination detection | CREATED | HALLUCINATION_PATTERNS |
| Tool execution tracking | CREATED | ToolExecutionTracker |
| Intent-to-tool mapping | CREATED | TOOL_TRIGGER_PATTERNS |

---

## Recommendations

### 1. Add Response Validation
```typescript
// After LLM response
const hallucination = detectHallucination(validatedResponse.answer);
if (hallucination.detected) {
  logSafeError('Hallucination detected', hallucination.patterns);
  // Fallback to direct data response
}
```

### 2. Add Advisory Response Blocking
```typescript
// For query intents
const advisory = detectAdvisoryResponse(validatedResponse.answer);
if (advisory.isAdvisory && intentResult.intent === 'query') {
  // Re-prompt LLM with stricter instructions
}
```

### 3. Add Tool Execution Logging
```typescript
// Track all ERP API calls
tracker.addExecution(sessionId, {
  toolName: 'getDashboardStats',
  parameters: {},
  executedAt: Date.now(),
  success: true,
});
```

---

## Next Steps

1. **Integrate** `toolFirstGuard.ts` into `route.ts`
2. **Add response validation** before returning to client
3. **Add monitoring** for hallucination and advisory patterns
4. **Add unit tests** for guard functions

---

**Audit Completed**: Phase 7 Tool-First Compliance Deep Audit
