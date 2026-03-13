// AI Health Metrics Collector
// Tracks real-time performance and compliance metrics

export interface MetricPoint {
  timestamp: number;
  value: number;
  tags?: Record<string, string>;
}

export interface MetricSummary {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

export class MetricsCollector {
  private metrics = new Map<string, MetricPoint[]>();
  private counters = new Map<string, number>();
  private readonly maxPoints = 10000;
  private readonly retentionMs = 3600000; // 1 hour
  
  // Record a metric value
  record(name: string, value: number, tags?: Record<string, string>): void {
    const points = this.metrics.get(name) || [];
    points.push({ timestamp: Date.now(), value, tags });
    
    // Trim old points
    const cutoff = Date.now() - this.retentionMs;
    const trimmed = points.filter(p => p.timestamp > cutoff);
    
    // Limit size
    if (trimmed.length > this.maxPoints) {
      trimmed.splice(0, trimmed.length - this.maxPoints);
    }
    
    this.metrics.set(name, trimmed);
  }
  
  // Increment counter
  increment(name: string, delta: number = 1): void {
    this.counters.set(name, (this.counters.get(name) || 0) + delta);
  }
  
  // Decrement counter
  decrement(name: string, delta: number = 1): void {
    this.counters.set(name, (this.counters.get(name) || 0) - delta);
  }
  
  // Get metric summary
  getSummary(name: string, windowMs?: number): MetricSummary | null {
    const points = this.metrics.get(name);
    if (!points || points.length === 0) return null;
    
    const cutoff = windowMs ? Date.now() - windowMs : 0;
    const values = points
      .filter(p => p.timestamp > cutoff)
      .map(p => p.value)
      .sort((a, b) => a - b);
    
    if (values.length === 0) return null;
    
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      count: values.length,
      sum,
      min: values[0],
      max: values[values.length - 1],
      avg: sum / values.length,
      p50: values[Math.floor(values.length * 0.5)],
      p95: values[Math.floor(values.length * 0.95)],
      p99: values[Math.floor(values.length * 0.99)],
    };
  }
  
  // Get counter value
  getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }
  
  // Get all metrics summary
  getHealthMetrics(): {
    confirmationRate: number;
    toolFirstCompliance: number;
    clarificationRate: number;
    plannerFailureRate: number;
    toolFailureRate: number;
    avgLatency: number;
    p95Latency: number;
    concurrentConflicts: number;
  } {
    const totalRequests = this.getCounter('requests_total') || 1;
    const confirmed = this.getCounter('confirmations_executed');
    const toolCalls = this.getCounter('tool_calls_successful');
    const toolFailures = this.getCounter('tool_calls_failed');
    const clarifications = this.getCounter('clarifications_requested');
    const plannerFailures = this.getCounter('planner_failures');
    const conflicts = this.getCounter('concurrent_conflicts');
    
    const latencySummary = this.getSummary('response_latency', 300000); // 5 min window
    
    return {
      confirmationRate: (confirmed || 0) / totalRequests * 100,
      toolFirstCompliance: (toolCalls || 0) / totalRequests * 100,
      clarificationRate: (clarifications || 0) / totalRequests * 100,
      plannerFailureRate: (plannerFailures || 0) / totalRequests * 100,
      toolFailureRate: (toolFailures || 0) / ((toolCalls || 0) + (toolFailures || 0) || 1) * 100,
      avgLatency: latencySummary?.avg || 0,
      p95Latency: latencySummary?.p95 || 0,
      concurrentConflicts: conflicts || 0,
    };
  }
  
  // Anomaly detection thresholds
  checkAnomalies(): Array<{ metric: string; value: number; threshold: number; severity: 'warning' | 'critical' }> {
    const health = this.getHealthMetrics();
    const anomalies: Array<{ metric: string; value: number; threshold: number; severity: 'warning' | 'critical' }> = [];
    
    if (health.confirmationRate < 99) {
      anomalies.push({
        metric: 'confirmationRate',
        value: health.confirmationRate,
        threshold: 99,
        severity: health.confirmationRate < 95 ? 'critical' : 'warning',
      });
    }
    
    if (health.toolFirstCompliance < 99) {
      anomalies.push({
        metric: 'toolFirstCompliance',
        value: health.toolFirstCompliance,
        threshold: 99,
        severity: health.toolFirstCompliance < 95 ? 'critical' : 'warning',
      });
    }
    
    if (health.toolFailureRate > 5) {
      anomalies.push({
        metric: 'toolFailureRate',
        value: health.toolFailureRate,
        threshold: 5,
        severity: health.toolFailureRate > 10 ? 'critical' : 'warning',
      });
    }
    
    if (health.p95Latency > 5000) {
      anomalies.push({
        metric: 'p95Latency',
        value: health.p95Latency,
        threshold: 5000,
        severity: health.p95Latency > 10000 ? 'critical' : 'warning',
      });
    }
    
    return anomalies;
  }
  
  // Reset all metrics
  reset(): void {
    this.metrics.clear();
    this.counters.clear();
  }
  
  // Get all metric names
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }
  
  // Get all counter names
  getCounterNames(): string[] {
    return Array.from(this.counters.keys());
  }
  
  // Get metrics by tag
  getMetricsByTag(tag: string, windowMs?: number): Map<string, MetricPoint[]> {
    const result = new Map<string, MetricPoint[]>();
    const cutoff = windowMs ? Date.now() - windowMs : 0;
    
    for (const [name, points] of this.metrics.entries()) {
      const filtered = points.filter(p => 
        p.timestamp > cutoff && p.tags && p.tags[tag]
      );
      if (filtered.length > 0) {
        result.set(name, filtered);
      }
    }
    
    return result;
  }
  
  // Export metrics for monitoring systems
  export(): {
    metrics: Record<string, MetricPoint[]>;
    counters: Record<string, number>;
    health: ReturnType<MetricsCollector['getHealthMetrics']>;
    anomalies: ReturnType<MetricsCollector['checkAnomalies']>;
  } {
    const metricsObj: Record<string, MetricPoint[]> = {};
    for (const [name, points] of this.metrics.entries()) {
      metricsObj[name] = points;
    }
    
    const countersObj: Record<string, number> = {};
    for (const [name, value] of this.counters.entries()) {
      countersObj[name] = value;
    }
    
    return {
      metrics: metricsObj,
      counters: countersObj,
      health: this.getHealthMetrics(),
      anomalies: this.checkAnomalies(),
    };
  }
  
  // Get time series data for a metric
  getTimeSeries(name: string, windowMs?: number): Array<{ timestamp: number; value: number }> {
    const points = this.metrics.get(name);
    if (!points) return [];
    
    const cutoff = windowMs ? Date.now() - windowMs : 0;
    return points
      .filter(p => p.timestamp > cutoff)
      .map(p => ({ timestamp: p.timestamp, value: p.value }));
  }
}

export const metricsCollector = new MetricsCollector();

// Metric names for consistency
export const METRICS = {
  // Counters
  REQUESTS_TOTAL: 'requests_total',
  CONFIRMATIONS_EXECUTED: 'confirmations_executed',
  CONFIRMATIONS_BLOCKED: 'confirmations_blocked',
  TOOL_CALLS_SUCCESSFUL: 'tool_calls_successful',
  TOOL_CALLS_FAILED: 'tool_calls_failed',
  CLARIFICATIONS_REQUESTED: 'clarifications_requested',
  PLANNER_FAILURES: 'planner_failures',
  INJECTION_ATTEMPTS: 'injection_attempts',
  CONCURRENT_CONFLICTS: 'concurrent_conflicts',
  HALLUCINATIONS_DETECTED: 'hallucinations_detected',
  DUPLICATE_EXECUTIONS: 'duplicate_executions',
  CACHE_HITS: 'cache_hits',
  CACHE_MISSES: 'cache_misses',
  RATE_LIMITS_HIT: 'rate_limits_hit',
  
  // Histograms
  RESPONSE_LATENCY: 'response_latency',
  TOOL_EXECUTION_TIME: 'tool_execution_time',
  LLM_GENERATION_TIME: 'llm_generation_time',
  INTENT_PARSING_TIME: 'intent_parsing_time',
  ENTITY_EXTRACTION_TIME: 'entity_extraction_time',
} as const;

// Helper function to record latency
export function recordLatency(metricName: string, startTime: number): void {
  const latency = Date.now() - startTime;
  metricsCollector.record(metricName, latency);
}

// Helper function to time async operations
export async function timeOperation<T>(
  metricName: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await operation();
    recordLatency(metricName, startTime);
    return result;
  } catch (error) {
    recordLatency(metricName, startTime);
    throw error;
  }
}

// Decorator for timing methods
export function timed(metricName: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: unknown[]) {
      const startTime = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        recordLatency(metricName, startTime);
        return result;
      } catch (error) {
        recordLatency(metricName, startTime);
        throw error;
      }
    };
    
    return descriptor;
  };
}
