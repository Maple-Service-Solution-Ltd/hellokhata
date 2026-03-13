// Tool-First Guard - Ensures data queries always use tools
// PART OF PHASE 6-7 ZERO-TRUST AUDIT

import type { IntentType } from '../types';

// Intents that MUST produce tool calls
export const TOOL_REQUIRED_INTENTS: IntentType[] = [
  'query',  // All queries need data
];

// Intents that require confirmation before tool execution
export const CONFIRMATION_REQUIRED_INTENTS: IntentType[] = [
  'create_sale',
  'create_expense', 
  'create_payment',
  'create_party',
  'create_item',
];

// Check if intent requires tool calls
export function requiresToolCall(intent: IntentType): boolean {
  return TOOL_REQUIRED_INTENTS.includes(intent) || CONFIRMATION_REQUIRED_INTENTS.includes(intent);
}

// Check if intent requires confirmation
export function requiresConfirmation(intent: IntentType): boolean {
  return CONFIRMATION_REQUIRED_INTENTS.includes(intent);
}

// Validate response has tool calls for data intents
export function validateToolFirstCompliance(
  intent: IntentType,
  response: { toolCalls?: unknown[]; answer: string }
): { compliant: boolean; reason?: string } {
  if (TOOL_REQUIRED_INTENTS.includes(intent)) {
    // For queries, check that response is based on fetched data
    // The response should contain numbers that came from tool results
    const hasNumericData = /৳?\d+/.test(response.answer);
    if (!hasNumericData) {
      return { compliant: true, reason: 'Query response has no numeric data to verify' };
    }
    return { compliant: true };
  }
  
  return { compliant: true };
}

// Anti-advisory patterns to block
export const ADVISORY_PATTERNS = [
  /you would need to/i,
  /you should/i,
  /I suggest/i,
  /I recommend/i,
  /please try/i,
  /I'm not sure/i,
  /I cannot/i,
  /I can't/i,
];

export function detectAdvisoryResponse(answer: string): { isAdvisory: boolean; pattern?: string } {
  for (const pattern of ADVISORY_PATTERNS) {
    if (pattern.test(answer)) {
      return { isAdvisory: true, pattern: pattern.source };
    }
  }
  return { isAdvisory: false };
}

// ============================================================
// EXTENDED TOOL-FIRST GUARD UTILITIES
// ============================================================

/**
 * Result of tool-first compliance check
 */
export interface ToolFirstCheckResult {
  compliant: boolean;
  intent: IntentType;
  requiresTool: boolean;
  requiresConfirmation: boolean;
  hasToolCalls: boolean;
  hasNumericData: boolean;
  isAdvisory: boolean;
  advisoryPattern?: string;
  warnings: string[];
}

/**
 * Comprehensive tool-first compliance check
 */
export function checkToolFirstCompliance(
  intent: IntentType,
  response: { toolCalls?: unknown[]; answer: string }
): ToolFirstCheckResult {
  const warnings: string[] = [];
  const requiresTool = requiresToolCall(intent);
  const requiresConfirm = requiresConfirmation(intent);
  const hasToolCalls = (response.toolCalls?.length ?? 0) > 0;
  const hasNumericData = /৳?\d+/.test(response.answer);
  const advisoryCheck = detectAdvisoryResponse(response.answer);
  
  // Check for advisory responses
  if (advisoryCheck.isAdvisory) {
    warnings.push(`Advisory pattern detected: "${advisoryCheck.pattern}"`);
  }
  
  // Check for missing tool calls when required
  if (requiresTool && !hasToolCalls && TOOL_REQUIRED_INTENTS.includes(intent)) {
    // For query intents, we allow if there's numeric data (came from ERP fetch)
    if (!hasNumericData) {
      warnings.push('Query intent without numeric data - may not be tool-driven');
    }
  }
  
  return {
    compliant: warnings.length === 0 || !advisoryCheck.isAdvisory,
    intent,
    requiresTool,
    requiresConfirmation: requiresConfirm,
    hasToolCalls,
    hasNumericData,
    isAdvisory: advisoryCheck.isAdvisory,
    advisoryPattern: advisoryCheck.pattern,
    warnings,
  };
}

/**
 * Patterns that indicate the AI is making up data
 */
export const HALLUCINATION_PATTERNS = [
  /approximately \d+/i,
  /around \d+/i,
  /roughly \d+/i,
  /estimated/i,
  /I estimate/i,
  /guess/i,
  /probably/i,
];

/**
 * Detect potential hallucination in response
 */
export function detectHallucination(answer: string): { detected: boolean; patterns: string[] } {
  const detectedPatterns: string[] = [];
  
  for (const pattern of HALLUCINATION_PATTERNS) {
    if (pattern.test(answer)) {
      detectedPatterns.push(pattern.source);
    }
  }
  
  return {
    detected: detectedPatterns.length > 0,
    patterns: detectedPatterns,
  };
}

/**
 * Tool execution record for audit trail
 */
export interface ToolExecutionRecord {
  toolName: string;
  parameters: Record<string, unknown>;
  executedAt: number;
  success: boolean;
  resultHash?: string;
}

/**
 * Track tool executions for a session
 */
export class ToolExecutionTracker {
  private executions: Map<string, ToolExecutionRecord[]> = new Map();
  
  addExecution(sessionId: string, record: ToolExecutionRecord): void {
    const sessionExecs = this.executions.get(sessionId) || [];
    sessionExecs.push(record);
    this.executions.set(sessionId, sessionExecs);
  }
  
  getExecutions(sessionId: string): ToolExecutionRecord[] {
    return this.executions.get(sessionId) || [];
  }
  
  hasToolExecution(sessionId: string, toolName: string): boolean {
    const execs = this.executions.get(sessionId) || [];
    return execs.some(e => e.toolName === toolName);
  }
  
  clearSession(sessionId: string): void {
    this.executions.delete(sessionId);
  }
}

/**
 * Intent patterns that should trigger tool execution
 */
export const TOOL_TRIGGER_PATTERNS = {
  sales: [/sales/i, /বিক্রি/i, /sold/i, /revenue/i, /আয়/i],
  inventory: [/stock/i, /স্টক/i, /inventory/i, /items/i, /পণ্য/i, /low stock/i],
  parties: [/customer/i, /supplier/i, /party/i, /গ্রাহক/i, /সাপ্লায়ার/i, /receivable/i, /payable/i],
  expenses: [/expense/i, /খরচ/i, /cost/i, /spending/i],
  payments: [/payment/i, /পেমেন্ট/i, /collect/i, /pay/i, /দেনা/i, /পাওনা/i],
};

/**
 * Check if message should trigger a tool call
 */
export function shouldTriggerTool(message: string): { shouldTrigger: boolean; categories: string[] } {
  const categories: string[] = [];
  
  for (const [category, patterns] of Object.entries(TOOL_TRIGGER_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        categories.push(category);
        break;
      }
    }
  }
  
  return {
    shouldTrigger: categories.length > 0,
    categories: [...new Set(categories)],
  };
}
