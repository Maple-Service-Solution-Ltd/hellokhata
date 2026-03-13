// Tool Executor with Circuit Breaker and Timeout Support
// PHASE 3 - Tool Failure Resilience
// Provides resilient tool execution with timeout, circuit breaker, and retry logic

import type { ActionType } from '../types';

// ============================================================
// TYPES
// ============================================================

export interface ToolExecutorConfig {
  defaultTimeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
  circuitBreakerThreshold: number;
  circuitBreakerResetTimeMs: number;
}

const DEFAULT_CONFIG: ToolExecutorConfig = {
  defaultTimeoutMs: 5000, // 5 seconds
  maxRetries: 1, // Retry once on transient failure
  retryDelayMs: 100,
  circuitBreakerThreshold: 5, // Open after 5 consecutive failures
  circuitBreakerResetTimeMs: 30000, // 30 seconds before trying again
};

export type ToolResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  duration: number;
  retries: number;
};

export interface ToolDefinition<TInput, TOutput> {
  name: string;
  description: string;
  actionType: ActionType;
  timeoutMs?: number;
  validate?: (input: TInput) => boolean | string;
  execute: (input: TInput, signal?: AbortSignal) => Promise<TOutput>;
}

export interface WriteGroupOperation {
  toolName: string;
  input: unknown;
}

export interface WriteGroupResult {
  success: boolean;
  results: Array<{
    toolName: string;
    success: boolean;
    data?: unknown;
    error?: string;
  }>;
  rolledBack: boolean;
}

// ============================================================
// CIRCUIT BREAKER
// ============================================================

interface CircuitState {
  status: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime: number;
  lastSuccessTime: number;
}

class CircuitBreaker {
  private circuits = new Map<string, CircuitState>();
  private config: ToolExecutorConfig;

  constructor(config: ToolExecutorConfig) {
    this.config = config;
  }

  private getCircuit(toolName: string): CircuitState {
    if (!this.circuits.has(toolName)) {
      this.circuits.set(toolName, {
        status: 'closed',
        failureCount: 0,
        lastFailureTime: 0,
        lastSuccessTime: Date.now(),
      });
    }
    return this.circuits.get(toolName)!;
  }

  canExecute(toolName: string): boolean {
    const circuit = this.getCircuit(toolName);
    
    if (circuit.status === 'closed') {
      return true;
    }
    
    if (circuit.status === 'open') {
      // Check if reset time has passed
      const elapsed = Date.now() - circuit.lastFailureTime;
      if (elapsed >= this.config.circuitBreakerResetTimeMs) {
        // Transition to half-open
        circuit.status = 'half-open';
        return true;
      }
      return false;
    }
    
    // Half-open: allow one request to test
    return true;
  }

  recordSuccess(toolName: string): void {
    const circuit = this.getCircuit(toolName);
    circuit.failureCount = 0;
    circuit.lastSuccessTime = Date.now();
    circuit.status = 'closed';
  }

  recordFailure(toolName: string): void {
    const circuit = this.getCircuit(toolName);
    circuit.failureCount++;
    circuit.lastFailureTime = Date.now();
    
    if (circuit.failureCount >= this.config.circuitBreakerThreshold) {
      circuit.status = 'open';
    }
  }

  getStatus(toolName: string): CircuitState {
    return this.getCircuit(toolName);
  }

  reset(toolName: string): void {
    this.circuits.delete(toolName);
  }

  resetAll(): void {
    this.circuits.clear();
  }
}

// ============================================================
// TOOL EXECUTOR
// ============================================================

export class ToolExecutor {
  private config: ToolExecutorConfig;
  private tools = new Map<string, ToolDefinition<unknown, unknown>>();
  private circuitBreaker: CircuitBreaker;
  private activeTransactions = new Map<string, WriteGroupOperation[]>();

  constructor(config?: Partial<ToolExecutorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.circuitBreaker = new CircuitBreaker(this.config);
  }

  // ============================================================
  // TOOL REGISTRATION
  // ============================================================

  register<TInput, TOutput>(tool: ToolDefinition<TInput, TOutput>): void {
    this.tools.set(tool.name, tool as ToolDefinition<unknown, unknown>);
  }

  registerMany(tools: ToolDefinition<unknown, unknown>[]): void {
    for (const tool of tools) {
      this.tools.set(tool.name, tool);
    }
  }

  getTool(name: string): ToolDefinition<unknown, unknown> | undefined {
    return this.tools.get(name);
  }

  // ============================================================
  // EXECUTION WITH TIMEOUT AND RETRY
  // ============================================================

  private async executeWithTimeout<T>(
    tool: ToolDefinition<unknown, unknown>,
    input: unknown,
    timeoutMs: number
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await tool.execute(input, controller.signal);
      return result as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async executeWithRetry<T>(
    tool: ToolDefinition<unknown, unknown>,
    input: unknown,
    timeoutMs: number,
    retriesLeft: number
  ): Promise<{ result?: T; error?: { code: string; message: string; retryable: boolean }; attempts: number }> {
    let lastError: { code: string; message: string; retryable: boolean } | undefined;
    let attempts = 0;

    for (let attempt = 0; attempt <= retriesLeft; attempt++) {
      attempts = attempt + 1;
      
      try {
        const result = await this.executeWithTimeout<T>(tool, input, timeoutMs);
        return { result, attempts };
      } catch (error) {
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        const isNetworkError = error instanceof Error && (
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('ENOTFOUND') ||
          error.message.includes('network')
        );

        lastError = {
          code: isTimeout ? 'TIMEOUT' : 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: isNetworkError || isTimeout,
        };

        // Don't retry if not retryable or no retries left
        if (!lastError.retryable || attempt >= retriesLeft) {
          break;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelayMs * (attempt + 1)));
      }
    }

    return { error: lastError, attempts };
  }

  /**
   * Execute a tool with circuit breaker, timeout, and retry support
   */
  async execute<TInput, TOutput>(
    toolName: string,
    input: TInput,
    options?: { timeoutMs?: number; skipCircuitBreaker?: boolean }
  ): Promise<ToolResult<TOutput>> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        success: false,
        error: {
          code: 'TOOL_NOT_FOUND',
          message: `Tool '${toolName}' is not registered`,
          retryable: false,
        },
        duration: 0,
        retries: 0,
      };
    }

    // Validate input if validator exists
    if (tool.validate) {
      const validationResult = tool.validate(input);
      if (validationResult !== true) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: typeof validationResult === 'string' ? validationResult : 'Input validation failed',
            retryable: false,
          },
          duration: 0,
          retries: 0,
        };
      }
    }

    // Check circuit breaker
    if (!options?.skipCircuitBreaker && !this.circuitBreaker.canExecute(toolName)) {
      return {
        success: false,
        error: {
          code: 'CIRCUIT_OPEN',
          message: `Circuit breaker is open for tool '${toolName}'`,
          retryable: true,
        },
        duration: 0,
        retries: 0,
      };
    }

    const timeoutMs = options?.timeoutMs ?? tool.timeoutMs ?? this.config.defaultTimeoutMs;
    const startTime = Date.now();

    const { result, error, attempts } = await this.executeWithRetry<TOutput>(
      tool,
      input,
      timeoutMs,
      this.config.maxRetries
    );

    const duration = Date.now() - startTime;

    if (error) {
      this.circuitBreaker.recordFailure(toolName);
      return {
        success: false,
        error,
        duration,
        retries: attempts - 1,
      };
    }

    this.circuitBreaker.recordSuccess(toolName);
    return {
      success: true,
      data: result,
      duration,
      retries: attempts - 1,
    };
  }

  // ============================================================
  // ATOMIC WRITE GROUPS (TRANSACTION SUPPORT)
  // ============================================================

  /**
   * Execute a group of write operations atomically
   * If any operation fails, all previous operations are rolled back
   */
  async executeWriteGroup(
    transactionId: string,
    operations: WriteGroupOperation[],
    rollbackFn?: (operation: WriteGroupOperation) => Promise<void>
  ): Promise<WriteGroupResult> {
    const results: WriteGroupResult['results'] = [];
    const executedOperations: WriteGroupOperation[] = [];

    try {
      // Execute operations sequentially
      for (const op of operations) {
        const tool = this.tools.get(op.toolName);
        if (!tool) {
          throw new Error(`Tool '${op.toolName}' not found`);
        }

        const result = await this.execute(op.toolName, op.input);
        
        results.push({
          toolName: op.toolName,
          success: result.success,
          data: result.data,
          error: result.error?.message,
        });

        if (!result.success) {
          // Operation failed, rollback all previous operations
          if (rollbackFn) {
            await this.rollbackOperations(executedOperations, rollbackFn);
          }
          return {
            success: false,
            results,
            rolledBack: true,
          };
        }

        executedOperations.push(op);
      }

      return {
        success: true,
        results,
        rolledBack: false,
      };
    } catch (error) {
      // Unexpected error, attempt rollback
      if (rollbackFn) {
        await this.rollbackOperations(executedOperations, rollbackFn);
      }
      return {
        success: false,
        results,
        rolledBack: true,
      };
    }
  }

  private async rollbackOperations(
    operations: WriteGroupOperation[],
    rollbackFn: (operation: WriteGroupOperation) => Promise<void>
  ): Promise<void> {
    // Rollback in reverse order
    for (let i = operations.length - 1; i >= 0; i--) {
      try {
        await rollbackFn(operations[i]);
      } catch (error) {
        console.error(`[ToolExecutor] Rollback failed for operation ${operations[i].toolName}:`, error);
      }
    }
  }

  /**
   * Begin a transaction for multi-step operations
   */
  beginTransaction(transactionId: string): void {
    this.activeTransactions.set(transactionId, []);
  }

  /**
   * Add operation to active transaction
   */
  addToTransaction(transactionId: string, operation: WriteGroupOperation): void {
    const tx = this.activeTransactions.get(transactionId);
    if (tx) {
      tx.push(operation);
    }
  }

  /**
   * Commit a transaction
   */
  async commitTransaction(
    transactionId: string,
    rollbackFn?: (operation: WriteGroupOperation) => Promise<void>
  ): Promise<WriteGroupResult> {
    const operations = this.activeTransactions.get(transactionId);
    if (!operations) {
      return {
        success: false,
        results: [],
        rolledBack: false,
      };
    }

    try {
      return await this.executeWriteGroup(transactionId, operations, rollbackFn);
    } finally {
      this.activeTransactions.delete(transactionId);
    }
  }

  /**
   * Abort a transaction
   */
  abortTransaction(transactionId: string): void {
    this.activeTransactions.delete(transactionId);
  }

  // ============================================================
  // MONITORING & DEBUGGING
  // ============================================================

  /**
   * Get circuit breaker status for all tools
   */
  getCircuitBreakerStatus(): Record<string, CircuitState> {
    const status: Record<string, CircuitState> = {};
    for (const [name] of this.tools) {
      status[name] = this.circuitBreaker.getStatus(name);
    }
    return status;
  }

  /**
   * Reset circuit breaker for a specific tool
   */
  resetCircuitBreaker(toolName: string): void {
    this.circuitBreaker.reset(toolName);
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers(): void {
    this.circuitBreaker.resetAll();
  }

  /**
   * Get list of registered tools
   */
  getRegisteredTools(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Health check for all tools
   */
  async healthCheck(): Promise<{
    healthy: string[];
    degraded: string[];
    unhealthy: string[];
  }> {
    const healthy: string[] = [];
    const degraded: string[] = [];
    const unhealthy: string[] = [];

    for (const [name] of this.tools) {
      const circuitStatus = this.circuitBreaker.getStatus(name);
      
      if (circuitStatus.status === 'closed') {
        healthy.push(name);
      } else if (circuitStatus.status === 'half-open') {
        degraded.push(name);
      } else {
        unhealthy.push(name);
      }
    }

    return { healthy, degraded, unhealthy };
  }
}

// ============================================================
// PRE-BUILT TOOLS FOR ERP INTEGRATION
// ============================================================

/**
 * Create a sale tool definition
 */
export function createSaleTool(erpClient: {
  createSale: (data: unknown) => Promise<unknown>;
}): ToolDefinition<unknown, unknown> {
  return {
    name: 'create_sale',
    description: 'Create a new sale transaction',
    actionType: 'create_sale',
    timeoutMs: 10000, // 10 seconds for write operations
    validate: (input) => {
      const data = input as { items?: unknown[] };
      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        return 'Sale must have at least one item';
      }
      return true;
    },
    execute: async (input) => {
      return erpClient.createSale(input);
    },
  };
}

/**
 * Create an expense tool definition
 */
export function createExpenseTool(erpClient: {
  createExpense: (data: unknown) => Promise<unknown>;
}): ToolDefinition<unknown, unknown> {
  return {
    name: 'create_expense',
    description: 'Create a new expense record',
    actionType: 'create_expense',
    timeoutMs: 10000,
    validate: (input) => {
      const data = input as { amount?: number; categoryId?: string; description?: string };
      if (!data.amount || data.amount <= 0) {
        return 'Expense must have a valid amount';
      }
      if (!data.categoryId) {
        return 'Expense must have a category';
      }
      return true;
    },
    execute: async (input) => {
      return erpClient.createExpense(input);
    },
  };
}

/**
 * Create a payment tool definition
 */
export function createPaymentTool(erpClient: {
  createPayment: (data: unknown) => Promise<unknown>;
}): ToolDefinition<unknown, unknown> {
  return {
    name: 'create_payment',
    description: 'Record a payment (received or paid)',
    actionType: 'create_payment',
    timeoutMs: 10000,
    validate: (input) => {
      const data = input as { amount?: number; partyId?: string; type?: string };
      if (!data.amount || data.amount <= 0) {
        return 'Payment must have a valid amount';
      }
      if (!data.partyId) {
        return 'Payment must have a party';
      }
      if (!data.type || !['received', 'paid'].includes(data.type)) {
        return 'Payment type must be "received" or "paid"';
      }
      return true;
    },
    execute: async (input) => {
      return erpClient.createPayment(input);
    },
  };
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const toolExecutor = new ToolExecutor();
