// Continuous Prompt Drift Monitoring
// Samples live traffic and compares against expected behavior

import { parseIntent } from '../intent-parser';
import { getAIVersionInfo } from '../version';

export interface DriftSample {
  timestamp: number;
  sessionId: string;
  message: string;
  actualIntent: string;
  shadowIntent: string;
  match: boolean;
  driftType?: 'intent' | 'entity' | 'tool';
}

export interface DriftReport {
  period: { start: number; end: number };
  samplesAnalyzed: number;
  driftRate: number;
  intentDriftRate: number;
  entityDriftRate: number;
  toolDriftRate: number;
  criticalDrifts: DriftSample[];
  version: string;
}

// Sample rate: 1% of traffic
const SAMPLE_RATE = 0.01;

// In-memory storage for samples (use Redis in production)
const samples: DriftSample[] = [];
const MAX_SAMPLES = 10000;

// Determine if this request should be sampled
export function shouldSample(): boolean {
  return Math.random() < SAMPLE_RATE;
}

// Record a sample for drift analysis
export function recordSample(
  sessionId: string,
  message: string,
  actualIntent: string,
  actualEntities: Record<string, unknown>,
  context: { items: any[]; parties: any[]; expenseCategories: any[] }
): void {
  // Run shadow mode analysis
  const shadowResult = parseIntent(message, context);
  
  const sample: DriftSample = {
    timestamp: Date.now(),
    sessionId,
    message,
    actualIntent,
    shadowIntent: shadowResult.intent,
    match: actualIntent === shadowResult.intent,
  };
  
  if (!sample.match) {
    sample.driftType = 'intent';
  }
  
  samples.push(sample);
  
  // Trim old samples
  if (samples.length > MAX_SAMPLES) {
    samples.splice(0, samples.length - MAX_SAMPLES);
  }
}

// Generate drift report
export function generateDriftReport(windowMs: number = 3600000): DriftReport {
  const now = Date.now();
  const cutoff = now - windowMs;
  
  const recentSamples = samples.filter(s => s.timestamp > cutoff);
  const drifts = recentSamples.filter(s => !s.match);
  
  const intentDrifts = drifts.filter(s => s.driftType === 'intent');
  
  return {
    period: { start: cutoff, end: now },
    samplesAnalyzed: recentSamples.length,
    driftRate: recentSamples.length > 0 ? drifts.length / recentSamples.length : 0,
    intentDriftRate: recentSamples.length > 0 ? intentDrifts.length / recentSamples.length : 0,
    entityDriftRate: 0, // TODO: implement entity drift
    toolDriftRate: 0, // TODO: implement tool drift
    criticalDrifts: drifts.slice(0, 10),
    version: getAIVersionInfo().version,
  };
}

// Alert thresholds
const DRIFT_ALERT_THRESHOLD = 0.01; // 1% drift rate

export function checkDriftAlert(report: DriftReport): {
  shouldAlert: boolean;
  severity: 'critical' | 'warning' | 'none';
  message: string;
} {
  if (report.driftRate > DRIFT_ALERT_THRESHOLD * 2) {
    return {
      shouldAlert: true,
      severity: 'critical',
      message: `CRITICAL: Drift rate ${report.driftRate} exceeds ${(DRIFT_ALERT_THRESHOLD * 2 * 100).toFixed(1)}%`,
    };
  }
  
  if (report.driftRate > DRIFT_ALERT_THRESHOLD) {
    return {
      shouldAlert: true,
      severity: 'warning',
      message: `WARNING: Drift rate ${report.driftRate} exceeds ${(DRIFT_ALERT_THRESHOLD * 100).toFixed(1)}%`,
    };
  }
  
  return {
    shouldAlert: false,
    severity: 'none',
    message: 'Drift rate within acceptable bounds',
  };
}
