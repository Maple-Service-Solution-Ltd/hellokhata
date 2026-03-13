// AI Evaluation Runner
// Executes all test cases and generates compliance metrics

import { parseIntent } from '../intent-parser';
import { 
  requiresConfirmation, 
  requiresToolCall,
  detectAdvisoryResponse,
  detectHallucination,
} from '../guards/toolFirstGuard';
import {
  detectConfirmationWord,
  generateDraftHash,
} from '../guards/confirmationGuard';
import {
  detectFallbackPatterns,
} from '../guards/antiFallbackGuard';
import { getAIVersionInfo } from '../version';
import type { IntentType } from '../types';

// ============================================================
// TYPES
// ============================================================

interface TestCase {
  id: number;
  query: string;
  expectedIntent: IntentType;
  expectedEntities?: Record<string, unknown>;
  requiresTool: boolean;
  requiresConfirmation: boolean;
  language?: 'en' | 'bn';
}

interface EvalResult {
  testCase: TestCase;
  passed: boolean;
  actualIntent: IntentType;
  intentMatch: boolean;
  confirmationRequired: boolean;
  confirmationEnforced: boolean;
  toolRequired: boolean;
  toolCompliant: boolean;
  errors: string[];
}

interface EvalMetrics {
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  confirmationEnforcement: number;
  toolFirstCompliance: number;
  intentAccuracy: number;
  advisoryGuardTriggers: number;
  hallucinationDetections: number;
  duplicateExecutions: number;
}

// ============================================================
// TEST SUITE
// ============================================================

const TEST_CASES: TestCase[] = [
  // Query intents - should NOT require confirmation, SHOULD require tools
  { id: 1, query: "what are today's sales?", expectedIntent: 'query', requiresTool: true, requiresConfirmation: false },
  { id: 2, query: "আজকের বিক্রি কত?", expectedIntent: 'query', requiresTool: true, requiresConfirmation: false, language: 'bn' },
  { id: 3, query: "show me my profit", expectedIntent: 'query', requiresTool: true, requiresConfirmation: false },
  { id: 4, query: "গত মাসের মুনাফা কত?", expectedIntent: 'query', requiresTool: true, requiresConfirmation: false, language: 'bn' },
  { id: 5, query: "how much stock do I have?", expectedIntent: 'query', requiresTool: true, requiresConfirmation: false },
  { id: 6, query: "what is my receivable?", expectedIntent: 'query', requiresTool: true, requiresConfirmation: false },
  { id: 7, query: "পাওনা কত?", expectedIntent: 'query', requiresTool: true, requiresConfirmation: false, language: 'bn' },
  { id: 8, query: "show low stock items", expectedIntent: 'query', requiresTool: true, requiresConfirmation: false },
  { id: 9, query: "কম স্টকের পণ্য দেখাও", expectedIntent: 'query', requiresTool: true, requiresConfirmation: false, language: 'bn' },
  { id: 10, query: "top selling items", expectedIntent: 'query', requiresTool: true, requiresConfirmation: false },

  // Write intents - SHOULD require confirmation
  { id: 11, query: "sold 2 cokes to Rahim", expectedIntent: 'create_sale', requiresTool: true, requiresConfirmation: true },
  { id: 12, query: "রহিমকে ২টা কোক বিক্রি করলাম", expectedIntent: 'create_sale', requiresTool: true, requiresConfirmation: true, language: 'bn' },
  { id: 13, query: "create a sale of 5 pens", expectedIntent: 'create_sale', requiresTool: true, requiresConfirmation: true },
  { id: 14, query: "spent 500 taka on rent", expectedIntent: 'create_expense', requiresTool: true, requiresConfirmation: true },
  { id: 15, query: "ভাড়ায় ৫০০ টাকা খরচ হয়েছে", expectedIntent: 'create_expense', requiresTool: true, requiresConfirmation: true, language: 'bn' },
  { id: 16, query: "record expense 1000 for electricity", expectedIntent: 'create_expense', requiresTool: true, requiresConfirmation: true },
  { id: 17, query: "received 2000 from Karim", expectedIntent: 'create_payment', requiresTool: true, requiresConfirmation: true },
  { id: 18, query: "করিম থেকে ২০০০ টাকা পেয়েছি", expectedIntent: 'create_payment', requiresTool: true, requiresConfirmation: true, language: 'bn' },
  { id: 19, query: "payment received 5000 from supplier", expectedIntent: 'create_payment', requiresTool: true, requiresConfirmation: true },
  { id: 20, query: "collected 3000 from customer", expectedIntent: 'create_payment', requiresTool: true, requiresConfirmation: true },

  // Confirmation word detection tests
  { id: 21, query: "yes", expectedIntent: 'informative', requiresTool: false, requiresConfirmation: false },
  { id: 22, query: "হ্যাঁ", expectedIntent: 'informative', requiresTool: false, requiresConfirmation: false, language: 'bn' },
  { id: 23, query: "ok", expectedIntent: 'informative', requiresTool: false, requiresConfirmation: false },
  { id: 24, query: "ঠিক আছে", expectedIntent: 'informative', requiresTool: false, requiresConfirmation: false, language: 'bn' },
  { id: 25, query: "no", expectedIntent: 'informative', requiresTool: false, requiresConfirmation: false },
  { id: 26, query: "না", expectedIntent: 'informative', requiresTool: false, requiresConfirmation: false, language: 'bn' },
  { id: 27, query: "cancel", expectedIntent: 'informative', requiresTool: false, requiresConfirmation: false },
  { id: 28, query: "বাতিল", expectedIntent: 'informative', requiresTool: false, requiresConfirmation: false, language: 'bn' },

  // Edge cases
  { id: 29, query: "due?", expectedIntent: 'query', requiresTool: true, requiresConfirmation: false },
  { id: 30, query: "profit?", expectedIntent: 'query', requiresTool: true, requiresConfirmation: false },
  { id: 31, query: "sales today", expectedIntent: 'query', requiresTool: true, requiresConfirmation: false },
  { id: 32, query: "বিক্রি", expectedIntent: 'query', requiresTool: true, requiresConfirmation: false, language: 'bn' },

  // Credit sales
  { id: 33, query: "sold 3 rices to Karim on credit", expectedIntent: 'create_sale', requiresTool: true, requiresConfirmation: true },
  { id: 34, query: "করিমকে ৩ কেজি চাল বাকিতে বিক্রি", expectedIntent: 'create_sale', requiresTool: true, requiresConfirmation: true, language: 'bn' },
  { id: 35, query: "sold 10 pens due", expectedIntent: 'create_sale', requiresTool: true, requiresConfirmation: true },

  // Mixed Bangla-English
  { id: 36, query: "ajker sales koto?", expectedIntent: 'query', requiresTool: true, requiresConfirmation: false },
  { id: 37, query: "amar profit dekhao", expectedIntent: 'query', requiresTool: true, requiresConfirmation: false },

  // Additional Bengali queries
  { id: 38, query: "দেনা কত?", expectedIntent: 'query', requiresTool: true, requiresConfirmation: false, language: 'bn' },
  { id: 39, query: "গ্রাহক কত জন?", expectedIntent: 'query', requiresTool: true, requiresConfirmation: false, language: 'bn' },
  { id: 40, query: "স্টকে কত পণ্য আছে?", expectedIntent: 'query', requiresTool: true, requiresConfirmation: false, language: 'bn' },
];

// ============================================================
// EVALUATION FUNCTIONS
// ============================================================

function runTestCase(testCase: TestCase): EvalResult {
  const errors: string[] = [];
  
  // Parse intent
  const result = parseIntent(testCase.query, {
    items: [],
    parties: [],
    expenseCategories: [],
  });
  
  const actualIntent = result.intent;
  const intentMatch = actualIntent === testCase.expectedIntent;
  
  if (!intentMatch) {
    errors.push(`Intent mismatch: expected "${testCase.expectedIntent}", got "${actualIntent}"`);
  }
  
  // Check confirmation enforcement
  const confirmationRequired = requiresConfirmation(actualIntent);
  const confirmationEnforced = confirmationRequired === testCase.requiresConfirmation;
  
  if (!confirmationEnforced) {
    errors.push(`Confirmation mismatch: expected ${testCase.requiresConfirmation}, got ${confirmationRequired}`);
  }
  
  // Check tool-first compliance
  const toolRequired = requiresToolCall(actualIntent);
  const toolCompliant = toolRequired === testCase.requiresTool;
  
  if (!toolCompliant) {
    errors.push(`Tool requirement mismatch: expected ${testCase.requiresTool}, got ${toolRequired}`);
  }
  
  return {
    testCase,
    passed: errors.length === 0,
    actualIntent,
    intentMatch,
    confirmationRequired,
    confirmationEnforced,
    toolRequired,
    toolCompliant,
    errors,
  };
}

export function runEvaluation(): {
  results: EvalResult[];
  metrics: EvalMetrics;
  version: ReturnType<typeof getAIVersionInfo>;
} {
  const results: EvalResult[] = [];
  
  for (const testCase of TEST_CASES) {
    results.push(runTestCase(testCase));
  }
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  
  // Calculate metrics
  const confirmationTests = results.filter(r => r.testCase.requiresConfirmation);
  const confirmationPassed = confirmationTests.filter(r => r.confirmationEnforced).length;
  
  const toolTests = results.filter(r => r.testCase.requiresTool);
  const toolPassed = toolTests.filter(r => r.toolCompliant).length;
  
  const metrics: EvalMetrics = {
    totalTests: results.length,
    passed,
    failed,
    passRate: (passed / results.length) * 100,
    confirmationEnforcement: confirmationTests.length > 0 
      ? (confirmationPassed / confirmationTests.length) * 100 
      : 100,
    toolFirstCompliance: toolTests.length > 0 
      ? (toolPassed / toolTests.length) * 100 
      : 100,
    intentAccuracy: (results.filter(r => r.intentMatch).length / results.length) * 100,
    advisoryGuardTriggers: 0, // Would be tracked during runtime
    hallucinationDetections: 0, // Would be tracked during runtime
    duplicateExecutions: 0, // Would be tracked during runtime
  };
  
  return {
    results,
    metrics,
    version: getAIVersionInfo(),
  };
}

// ============================================================
// EXPORT FOR CLI USAGE
// ============================================================

export { TEST_CASES };
export type { TestCase, EvalResult, EvalMetrics };
