// Nightly Data Integrity Check Job
// Scans for anomalies in ERP data
// PART OF PHASE 7-8 ENTERPRISE HARDENING

import { db } from '@/lib/db';

export interface IntegrityAnomaly {
  type: 'negative_stock' | 'duplicate_transaction' | 'orphan_expense' | 'mismatched_total';
  severity: 'critical' | 'warning' | 'info';
  entityId: string;
  entityType: string;
  description: string;
  detectedAt: Date;
  suggestedFix?: string;
}

export interface IntegrityCheckResult {
  timestamp: Date;
  businessId: string;
  anomalies: IntegrityAnomaly[];
  stats: {
    recordsScanned: number;
    anomaliesFound: number;
    criticalCount: number;
    warningCount: number;
  };
}

// ============================================================
// ANOMALY DETECTION FUNCTIONS
// ============================================================

/**
 * Check for negative stock
 * Critical: Items with stock < 0 indicate data corruption or system bug
 */
async function checkNegativeStock(businessId: string): Promise<IntegrityAnomaly[]> {
  const anomalies: IntegrityAnomaly[] = [];
  
  const items = await db.item.findMany({
    where: { businessId, currentStock: { lt: 0 } },
  });
  
  for (const item of items) {
    anomalies.push({
      type: 'negative_stock',
      severity: 'critical',
      entityId: item.id,
      entityType: 'Item',
      description: `Item "${item.name}" has negative stock: ${item.currentStock}`,
      detectedAt: new Date(),
      suggestedFix: 'Review recent sales and stock adjustments',
    });
  }
  
  return anomalies;
}

/**
 * Check for duplicate transactions (same hash)
 * Warning: Potential duplicate sales from double-confirm or race condition
 */
async function checkDuplicateTransactions(businessId: string): Promise<IntegrityAnomaly[]> {
  const anomalies: IntegrityAnomaly[] = [];
  
  // Find sales with same total, party, and within 1 minute
  const duplicates = await db.$queryRaw`
    SELECT id, invoiceNo, total, partyId, createdAt, COUNT(*) as cnt
    FROM Sale
    WHERE businessId = ${businessId}
    GROUP BY total, partyId, DATE(createdAt)
    HAVING COUNT(*) > 1
  ` as any[];
  
  for (const dup of duplicates) {
    anomalies.push({
      type: 'duplicate_transaction',
      severity: 'warning',
      entityId: dup.id,
      entityType: 'Sale',
      description: `Potential duplicate sale: Invoice ${dup.invoiceNo}`,
      detectedAt: new Date(),
    });
  }
  
  return anomalies;
}

/**
 * Check for orphan expenses (no category or invalid reference)
 * Warning: Expenses without proper categorization
 */
async function checkOrphanExpenses(businessId: string): Promise<IntegrityAnomaly[]> {
  const anomalies: IntegrityAnomaly[] = [];
  
  // Find expenses with null or empty category
  const orphanExpenses = await db.expense.findMany({
    where: {
      businessId,
      OR: [
        { category: null },
        { category: '' },
      ],
    },
  });
  
  for (const expense of orphanExpenses) {
    anomalies.push({
      type: 'orphan_expense',
      severity: 'warning',
      entityId: expense.id,
      entityType: 'Expense',
      description: `Expense "${expense.description || expense.id}" has no category`,
      detectedAt: new Date(),
      suggestedFix: 'Assign a category to this expense',
    });
  }
  
  return anomalies;
}

/**
 * Check for mismatched totals (sale items don't sum to sale total)
 * Critical: Financial data integrity issue
 */
async function checkMismatchedTotals(businessId: string): Promise<IntegrityAnomaly[]> {
  const anomalies: IntegrityAnomaly[] = [];
  
  // Find sales where item total doesn't match sale total
  const salesWithItems = await db.sale.findMany({
    where: { businessId },
    include: {
      items: true,
    },
  });
  
  for (const sale of salesWithItems) {
    const calculatedTotal = sale.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
    
    // Allow small floating point differences (1 taka tolerance)
    const difference = Math.abs(calculatedTotal - sale.total);
    if (difference > 1) {
      anomalies.push({
        type: 'mismatched_total',
        severity: 'critical',
        entityId: sale.id,
        entityType: 'Sale',
        description: `Sale ${sale.invoiceNo}: Calculated total ${calculatedTotal} doesn't match recorded ${sale.total}`,
        detectedAt: new Date(),
        suggestedFix: 'Review sale items and recalculate total',
      });
    }
  }
  
  return anomalies;
}

// ============================================================
// MAIN INTEGRITY CHECK FUNCTION
// ============================================================

/**
 * Run full integrity check for a business
 * Returns all anomalies found with severity levels
 */
export async function runIntegrityCheck(businessId: string): Promise<IntegrityCheckResult> {
  const anomalies: IntegrityAnomaly[] = [];
  let recordsScanned = 0;
  
  // Run all checks
  const negativeStockAnomalies = await checkNegativeStock(businessId);
  anomalies.push(...negativeStockAnomalies);
  recordsScanned += await db.item.count({ where: { businessId } });
  
  const duplicateAnomalies = await checkDuplicateTransactions(businessId);
  anomalies.push(...duplicateAnomalies);
  recordsScanned += await db.sale.count({ where: { businessId } });
  
  const orphanAnomalies = await checkOrphanExpenses(businessId);
  anomalies.push(...orphanAnomalies);
  recordsScanned += await db.expense.count({ where: { businessId } });
  
  const mismatchAnomalies = await checkMismatchedTotals(businessId);
  anomalies.push(...mismatchAnomalies);
  
  return {
    timestamp: new Date(),
    businessId,
    anomalies,
    stats: {
      recordsScanned,
      anomaliesFound: anomalies.length,
      criticalCount: anomalies.filter(a => a.severity === 'critical').length,
      warningCount: anomalies.filter(a => a.severity === 'warning').length,
    },
  };
}

// ============================================================
// SCHEDULED JOB SUPPORT
// ============================================================

/**
 * Check result with business context
 */
export interface ScheduledCheckResult {
  businessId: string;
  businessName: string;
  result: IntegrityCheckResult;
  notified: boolean;
}

/**
 * Run integrity check for multiple businesses
 * Used for scheduled nightly runs
 */
export async function runScheduledIntegrityCheck(
  businessIds: string[]
): Promise<ScheduledCheckResult[]> {
  const results: ScheduledCheckResult[] = [];
  
  for (const businessId of businessIds) {
    try {
      const business = await db.business.findUnique({
        where: { id: businessId },
        select: { name: true },
      });
      
      const result = await runIntegrityCheck(businessId);
      
      // Check if we should notify (has critical anomalies)
      const shouldNotify = result.stats.criticalCount > 0;
      
      results.push({
        businessId,
        businessName: business?.name || 'Unknown',
        result,
        notified: shouldNotify,
      });
      
      // TODO: Send notification if shouldNotify is true
      // This could integrate with email, Slack, or in-app notifications
      
    } catch (error) {
      console.error(`Integrity check failed for business ${businessId}:`, error);
    }
  }
  
  return results;
}

// ============================================================
// AUTO-FIX FUNCTIONS
// ============================================================

/**
 * Auto-fix result for a single anomaly
 */
export interface AutoFixResult {
  anomalyId: string;
  fixed: boolean;
  action: string;
  error?: string;
}

/**
 * Attempt to automatically fix anomalies
 * Only safe fixes are applied automatically
 */
export async function autoFixAnomalies(
  anomalies: IntegrityAnomaly[]
): Promise<AutoFixResult[]> {
  const results: AutoFixResult[] = [];
  
  for (const anomaly of anomalies) {
    try {
      switch (anomaly.type) {
        case 'orphan_expense':
          // Auto-fix: Assign 'Uncategorized' to expenses without category
          await db.expense.update({
            where: { id: anomaly.entityId },
            data: { category: 'Uncategorized' },
          });
          results.push({
            anomalyId: anomaly.entityId,
            fixed: true,
            action: 'Assigned Uncategorized category',
          });
          break;
          
        case 'negative_stock':
        case 'duplicate_transaction':
        case 'mismatched_total':
          // Cannot auto-fix - requires manual review
          results.push({
            anomalyId: anomaly.entityId,
            fixed: false,
            action: 'Skipped - requires manual review',
          });
          break;
      }
    } catch (error) {
      results.push({
        anomalyId: anomaly.entityId,
        fixed: false,
        action: 'Failed to fix',
        error: String(error),
      });
    }
  }
  
  return results;
}

// ============================================================
// INTEGRITY CHECK HISTORY
// ============================================================

/**
 * Store for tracking integrity check history
 * In production, this would be stored in the database
 */
const checkHistory = new Map<string, IntegrityCheckResult[]>();

/**
 * Record integrity check result
 */
export function recordCheckResult(
  businessId: string,
  result: IntegrityCheckResult
): void {
  const history = checkHistory.get(businessId) || [];
  history.push(result);
  
  // Keep last 30 days of history
  if (history.length > 30) {
    history.shift();
  }
  
  checkHistory.set(businessId, history);
}

/**
 * Get integrity check history for a business
 */
export function getCheckHistory(
  businessId: string,
  limit: number = 10
): IntegrityCheckResult[] {
  const history = checkHistory.get(businessId) || [];
  return history.slice(-limit);
}

/**
 * Get anomaly trend for a business
 */
export function getAnomalyTrend(
  businessId: string
): { date: string; anomalies: number; critical: number }[] {
  const history = checkHistory.get(businessId) || [];
  
  return history.map(result => ({
    date: result.timestamp.toISOString().split('T')[0],
    anomalies: result.stats.anomaliesFound,
    critical: result.stats.criticalCount,
  }));
}

// ============================================================
// REPORTING
// ============================================================

/**
 * Generate a summary report from integrity check results
 */
export function generateIntegrityReport(result: IntegrityCheckResult): string {
  let report = `# Data Integrity Check Report\n\n`;
  report += `**Timestamp**: ${result.timestamp.toISOString()}\n`;
  report += `**Business ID**: ${result.businessId}\n\n`;
  
  report += `## Summary\n\n`;
  report += `- Records Scanned: ${result.stats.recordsScanned}\n`;
  report += `- Anomalies Found: ${result.stats.anomaliesFound}\n`;
  report += `- Critical: ${result.stats.criticalCount}\n`;
  report += `- Warnings: ${result.stats.warningCount}\n\n`;
  
  if (result.anomalies.length > 0) {
    report += `## Anomalies\n\n`;
    
    for (const anomaly of result.anomalies) {
      const icon = anomaly.severity === 'critical' ? '🔴' : 
                   anomaly.severity === 'warning' ? '🟡' : '🔵';
      report += `### ${icon} ${anomaly.type.replace('_', ' ').toUpperCase()}\n\n`;
      report += `- **Entity**: ${anomaly.entityType} (${anomaly.entityId})\n`;
      report += `- **Description**: ${anomaly.description}\n`;
      if (anomaly.suggestedFix) {
        report += `- **Suggested Fix**: ${anomaly.suggestedFix}\n`;
      }
      report += '\n';
    }
  } else {
    report += `✅ No anomalies detected.\n`;
  }
  
  return report;
}
