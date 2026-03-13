// Load Test Simulator for AI System
// Tests race conditions, concurrent confirmations, rapid fire scenarios
// PART OF PHASE 7-8 ENTERPRISE HARDENING

import { sessionMemory, withLock, generateRequestId } from '../memory/sessionMemory';
import { generateDraftHash } from '../guards/confirmationGuard';

export interface LoadTestResult {
  testName: string;
  passed: boolean;
  duration: number;
  operations: number;
  failures: number;
  raceConditions: number;
  duplicateExecutions: number;
  deadlocks: number;
  errors: string[];
}

export interface LoadTestConfig {
  concurrentUsers: number;
  operationsPerUser: number;
  mixRatio: { reads: number; writes: number; confirms: number };
  rapidFireDelay: number;
}

// Simulate concurrent user session
async function simulateUserSession(
  userId: string,
  config: LoadTestConfig,
  results: LoadTestResult
): Promise<void> {
  const sessionId = `test-session-${userId}`;
  const requestId = generateRequestId();
  
  for (let i = 0; i < config.operationsPerUser; i++) {
    const opType = Math.random();
    
    try {
      if (opType < config.mixRatio.reads) {
        // Read operation
        const pending = sessionMemory.getPendingDraftHash(sessionId);
        // Should not fail
      } else if (opType < config.mixRatio.reads + config.mixRatio.writes) {
        // Write operation - needs lock
        const hash = generateDraftHash('create_sale', { itemId: `item-${i}`, quantity: 1 });
        
        const lockResult = await withLock(sessionId, requestId, async () => {
          const alreadyExecuted = sessionMemory.isExecuted(sessionId, hash);
          if (alreadyExecuted) {
            results.duplicateExecutions++;
          } else {
            sessionMemory.setPendingDraft(sessionId, hash);
            // Simulate DB write
            await new Promise(r => setTimeout(r, 10));
            sessionMemory.markExecuted(sessionId, hash);
          }
        });
        
        if (!lockResult.success) {
          results.deadlocks++;
        }
      } else {
        // Confirm operation
        const confirmWord = Math.random() > 0.5 ? 'yes' : 'হ্যাঁ';
        // Simulate confirmation detection
      }
    } catch (error) {
      results.failures++;
      results.errors.push(`User ${userId} op ${i}: ${error}`);
    }
    
    // Rapid fire delay
    if (config.rapidFireDelay > 0) {
      await new Promise(r => setTimeout(r, config.rapidFireDelay));
    }
  }
}

// Run full load test
export async function runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
  const result: LoadTestResult = {
    testName: `Load Test: ${config.concurrentUsers} users`,
    passed: true,
    duration: 0,
    operations: config.concurrentUsers * config.operationsPerUser,
    failures: 0,
    raceConditions: 0,
    duplicateExecutions: 0,
    deadlocks: 0,
    errors: [],
  };
  
  const startTime = Date.now();
  
  // Run concurrent sessions
  const promises: Promise<void>[] = [];
  for (let i = 0; i < config.concurrentUsers; i++) {
    promises.push(simulateUserSession(`user-${i}`, config, result));
  }
  
  await Promise.all(promises);
  
  result.duration = Date.now() - startTime;
  result.passed = result.failures === 0 && result.duplicateExecutions === 0;
  
  return result;
}

// Test scenarios
export const LOAD_TEST_SCENARIOS: LoadTestConfig[] = [
  {
    concurrentUsers: 100,
    operationsPerUser: 10,
    mixRatio: { reads: 0.7, writes: 0.2, confirms: 0.1 },
    rapidFireDelay: 50,
  },
  {
    concurrentUsers: 500,
    operationsPerUser: 5,
    mixRatio: { reads: 0.6, writes: 0.3, confirms: 0.1 },
    rapidFireDelay: 20,
  },
  {
    concurrentUsers: 1000,
    operationsPerUser: 3,
    mixRatio: { reads: 0.5, writes: 0.3, confirms: 0.2 },
    rapidFireDelay: 10,
  },
];

// Run all scenarios
export async function runAllLoadTests(): Promise<LoadTestResult[]> {
  const results: LoadTestResult[] = [];
  
  for (const config of LOAD_TEST_SCENARIOS) {
    sessionMemory.clearAll(); // Reset between tests
    const result = await runLoadTest(config);
    results.push(result);
  }
  
  return results;
}

// ============================================================
// STRESS TEST UTILITIES
// ============================================================

/**
 * Run a rapid-fire test for a single session
 * Tests the locking mechanism under rapid successive operations
 */
export async function runRapidFireTest(
  sessionId: string,
  operations: number,
  delayMs: number = 0
): Promise<LoadTestResult> {
  const result: LoadTestResult = {
    testName: `Rapid Fire Test: ${operations} ops`,
    passed: true,
    duration: 0,
    operations,
    failures: 0,
    raceConditions: 0,
    duplicateExecutions: 0,
    deadlocks: 0,
    errors: [],
  };
  
  const startTime = Date.now();
  
  for (let i = 0; i < operations; i++) {
    const requestId = generateRequestId();
    const hash = generateDraftHash('create_sale', { itemId: `item-${i}`, quantity: 1 });
    
    try {
      const lockResult = await withLock(sessionId, requestId, async () => {
        const alreadyExecuted = sessionMemory.isExecuted(sessionId, hash);
        if (alreadyExecuted) {
          result.duplicateExecutions++;
        } else {
          sessionMemory.setPendingDraft(sessionId, hash);
          await new Promise(r => setTimeout(r, 5));
          sessionMemory.markExecuted(sessionId, hash);
        }
      });
      
      if (!lockResult.success) {
        result.deadlocks++;
      }
    } catch (error) {
      result.failures++;
      result.errors.push(`Op ${i}: ${error}`);
    }
    
    if (delayMs > 0) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  
  result.duration = Date.now() - startTime;
  result.passed = result.failures === 0 && result.duplicateExecutions === 0;
  
  return result;
}

/**
 * Run a double-confirm test
 * Tests that duplicate confirmations are properly rejected
 */
export async function runDoubleConfirmTest(
  sessionId: string,
  attempts: number = 10
): Promise<LoadTestResult> {
  const result: LoadTestResult = {
    testName: `Double Confirm Test: ${attempts} attempts`,
    passed: true,
    duration: 0,
    operations: attempts * 2, // Each attempt has 2 confirm tries
    failures: 0,
    raceConditions: 0,
    duplicateExecutions: 0,
    deadlocks: 0,
    errors: [],
  };
  
  const startTime = Date.now();
  
  for (let i = 0; i < attempts; i++) {
    const hash = generateDraftHash('create_sale', { itemId: `item-${i}`, quantity: 1 });
    const requestId1 = generateRequestId();
    const requestId2 = generateRequestId();
    
    // First confirmation
    const firstConfirm = await withLock(sessionId, requestId1, async () => {
      const alreadyExecuted = sessionMemory.isExecuted(sessionId, hash);
      if (alreadyExecuted) {
        result.duplicateExecutions++;
        return false;
      }
      sessionMemory.setPendingDraft(sessionId, hash);
      await new Promise(r => setTimeout(r, 10));
      sessionMemory.markExecuted(sessionId, hash);
      return true;
    });
    
    // Second confirmation (should be blocked)
    const secondConfirm = await withLock(sessionId, requestId2, async () => {
      const alreadyExecuted = sessionMemory.isExecuted(sessionId, hash);
      if (alreadyExecuted) {
        // This is expected - duplicate detection working
        return false;
      }
      result.duplicateExecutions++; // This would be bad - duplicate execution!
      sessionMemory.markExecuted(sessionId, hash);
      return true;
    });
    
    // Check results
    if (!firstConfirm.success || firstConfirm.result === false) {
      result.failures++;
      result.errors.push(`Attempt ${i}: First confirm failed`);
    }
    
    // Second confirm should NOT have executed (alreadyExecuted check)
    if (secondConfirm.result === true) {
      result.duplicateExecutions++;
      result.errors.push(`Attempt ${i}: Second confirm executed (BUG!)`);
    }
  }
  
  result.duration = Date.now() - startTime;
  result.passed = result.duplicateExecutions === 0 && result.failures === 0;
  
  return result;
}

/**
 * Run a parallel confirm test
 * Tests race conditions when multiple requests try to confirm simultaneously
 */
export async function runParallelConfirmTest(
  sessionId: string,
  parallelRequests: number = 5
): Promise<LoadTestResult> {
  const result: LoadTestResult = {
    testName: `Parallel Confirm Test: ${parallelRequests} parallel`,
    passed: true,
    duration: 0,
    operations: parallelRequests,
    failures: 0,
    raceConditions: 0,
    duplicateExecutions: 0,
    deadlocks: 0,
    errors: [],
  };
  
  const startTime = Date.now();
  const hash = generateDraftHash('create_sale', { itemId: 'shared-item', quantity: 1 });
  
  // Set up the pending draft first
  sessionMemory.setPendingDraft(sessionId, hash);
  
  // Try to confirm from multiple "requests" simultaneously
  const confirmPromises = Array.from({ length: parallelRequests }, (_, i) => {
    const requestId = generateRequestId();
    return withLock(sessionId, requestId, async () => {
      const alreadyExecuted = sessionMemory.isExecuted(sessionId, hash);
      if (alreadyExecuted) {
        return 'already_executed';
      }
      sessionMemory.markExecuted(sessionId, hash);
      await new Promise(r => setTimeout(r, 50)); // Simulate work
      return 'executed';
    });
  });
  
  const results = await Promise.all(confirmPromises);
  
  // Analyze results
  let executions = 0;
  let blocked = 0;
  
  for (const r of results) {
    if (r.success && r.result === 'executed') {
      executions++;
    } else if (r.result === 'already_executed') {
      blocked++;
    } else if (!r.success) {
      result.deadlocks++;
    }
  }
  
  // Should only have ONE execution
  if (executions > 1) {
    result.duplicateExecutions = executions - 1;
    result.errors.push(`CRITICAL: ${executions} executions instead of 1`);
  }
  
  result.duration = Date.now() - startTime;
  result.passed = executions === 1 && result.duplicateExecutions === 0;
  
  return result;
}

/**
 * Generate a load test report
 */
export function generateLoadTestReport(results: LoadTestResult[]): string {
  let report = '# Load Test Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  for (const result of results) {
    report += `## ${result.testName}\n\n`;
    report += `- **Status**: ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `- **Duration**: ${result.duration}ms\n`;
    report += `- **Operations**: ${result.operations}\n`;
    report += `- **Failures**: ${result.failures}\n`;
    report += `- **Deadlocks**: ${result.deadlocks}\n`;
    report += `- **Duplicate Executions**: ${result.duplicateExecutions}\n`;
    report += `- **Race Conditions**: ${result.raceConditions}\n`;
    
    if (result.errors.length > 0) {
      report += `\n### Errors\n\`\`\`\n`;
      result.errors.slice(0, 10).forEach(e => report += `${e}\n`);
      if (result.errors.length > 10) {
        report += `... and ${result.errors.length - 10} more errors\n`;
      }
      report += `\`\`\`\n`;
    }
    
    report += '\n';
  }
  
  return report;
}
