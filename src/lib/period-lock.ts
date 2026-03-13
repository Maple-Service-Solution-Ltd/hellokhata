// Period Locking Utilities
// Prevents edits to transactions in locked accounting periods

import { db } from '@/lib/db';

export interface PeriodLockResult {
  isLocked: boolean;
  lockId?: string;
  lockedBy?: string;
  lockedAt?: Date;
  message?: string;
}

/**
 * Check if a date falls within a locked period
 */
export async function isPeriodLocked(
  businessId: string,
  date: Date,
  branchId?: string
): Promise<PeriodLockResult> {
  try {
    // Check business-wide accounting lock
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { accountingLockedUntil: true },
    });

    if (business?.accountingLockedUntil) {
      if (date <= business.accountingLockedUntil) {
        return {
          isLocked: true,
          message: `Period is locked until ${business.accountingLockedUntil.toLocaleDateString()}`,
        };
      }
    }

    // Check specific period locks
    const periodLock = await db.periodLock.findFirst({
      where: {
        businessId,
        ...(branchId && { branchId }),
        periodStart: { lte: date },
        periodEnd: { gte: date },
        deletedAt: null,
      },
    });

    if (periodLock) {
      return {
        isLocked: true,
        lockId: periodLock.id,
        lockedBy: periodLock.lockedBy || undefined,
        lockedAt: periodLock.lockedAt,
        message: `Period ${periodLock.periodStart.toLocaleDateString()} - ${periodLock.periodEnd.toLocaleDateString()} is locked`,
      };
    }

    return { isLocked: false };
  } catch (error) {
    console.error('Error checking period lock:', error);
    // On error, allow the operation to proceed
    return { isLocked: false };
  }
}

/**
 * Lock a specific period
 */
export async function lockPeriod(
  businessId: string,
  periodStart: Date,
  periodEnd: Date,
  options?: {
    branchId?: string;
    lockedBy?: string;
    notes?: string;
  }
): Promise<{ success: boolean; lockId?: string; error?: string }> {
  try {
    // Validate dates
    if (periodStart >= periodEnd) {
      return { success: false, error: 'Period start must be before period end' };
    }

    // Check for overlapping locks
    const existingLock = await db.periodLock.findFirst({
      where: {
        businessId,
        ...(options?.branchId && { branchId: options.branchId }),
        OR: [
          {
            periodStart: { lte: periodStart },
            periodEnd: { gte: periodStart },
          },
          {
            periodStart: { lte: periodEnd },
            periodEnd: { gte: periodEnd },
          },
          {
            periodStart: { gte: periodStart },
            periodEnd: { lte: periodEnd },
          },
        ],
        deletedAt: null,
      },
    });

    if (existingLock) {
      return { 
        success: false, 
        error: `Overlaps with existing lock: ${existingLock.periodStart.toLocaleDateString()} - ${existingLock.periodEnd.toLocaleDateString()}` 
      };
    }

    // Create the lock
    const lock = await db.periodLock.create({
      data: {
        businessId,
        branchId: options?.branchId,
        periodStart,
        periodEnd,
        lockedBy: options?.lockedBy,
        notes: options?.notes,
      },
    });

    return { success: true, lockId: lock.id };
  } catch (error) {
    console.error('Error locking period:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Unlock a period
 */
export async function unlockPeriod(
  lockId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Soft delete the lock
    await db.periodLock.update({
      where: { id: lockId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    console.error('Error unlocking period:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Set global accounting lock for a business
 */
export async function setAccountingLock(
  businessId: string,
  lockedUntil: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.business.update({
      where: { id: businessId },
      data: { accountingLockedUntil: lockedUntil },
    });

    return { success: true };
  } catch (error) {
    console.error('Error setting accounting lock:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Remove global accounting lock
 */
export async function removeAccountingLock(
  businessId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.business.update({
      where: { id: businessId },
      data: { accountingLockedUntil: null },
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing accounting lock:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get all period locks for a business
 */
export async function getPeriodLocks(
  businessId: string,
  options?: {
    branchId?: string;
    includeDeleted?: boolean;
  }
) {
  try {
    return db.periodLock.findMany({
      where: {
        businessId,
        ...(options?.branchId && { branchId: options.branchId }),
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
      },
      orderBy: { periodStart: 'desc' },
    });
  } catch (error) {
    console.error('Error getting period locks:', error);
    return [];
  }
}

/**
 * Check if editing is allowed based on period and age
 */
export async function canEditTransaction(
  businessId: string,
  transactionDate: Date,
  options?: {
    branchId?: string;
    transactionId?: string;
    userId?: string;
    userRole?: string;
  }
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Check period lock
    const periodLock = await isPeriodLocked(businessId, transactionDate, options?.branchId);
    if (periodLock.isLocked) {
      return { 
        allowed: false, 
        reason: periodLock.message || 'Transaction is in a locked period' 
      };
    }

    // Owners can always edit
    if (options?.userRole === 'owner') {
      return { allowed: true };
    }

    // Check if transaction is older than allowed edit window (e.g., 7 days for non-owners)
    const editWindowDays = 7;
    const now = new Date();
    const daysSinceTransaction = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceTransaction > editWindowDays && options?.userRole !== 'manager') {
      return { 
        allowed: false, 
        reason: `Cannot edit transactions older than ${editWindowDays} days` 
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking edit permission:', error);
    // On error, allow the operation
    return { allowed: true };
  }
}

/**
 * Create an adjustment entry instead of direct edit
 * This is for the edit policy where old entries create adjustments
 */
export async function createAdjustmentInsteadOfEdit(
  entityType: 'sale' | 'purchase' | 'payment' | 'expense',
  entityId: string,
  adjustments: Record<string, unknown>,
  options: {
    businessId: string;
    branchId?: string;
    userId?: string;
    reason: string;
  }
): Promise<{ success: boolean; adjustmentId?: string; error?: string }> {
  try {
    // This would create an adjustment record based on entity type
    // Implementation depends on business rules
    
    // For now, log the adjustment request
    console.log(`Adjustment requested for ${entityType} ${entityId}:`, {
      adjustments,
      reason: options.reason,
      userId: options.userId,
    });

    // In a full implementation, this would:
    // 1. Create a reversal entry for the original values
    // 2. Create a new entry with the corrected values
    // 3. Link both to the original transaction
    // 4. Update running balances accordingly

    return { 
      success: true, 
      adjustmentId: `ADJ-${Date.now()}` 
    };
  } catch (error) {
    console.error('Error creating adjustment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get edit history for a transaction
 * Shows the original value and all adjustments made
 */
export async function getTransactionEditHistory(
  businessId: string,
  entityType: 'sale' | 'purchase' | 'payment' | 'expense',
  entityId: string
) {
  try {
    const auditLogs = await db.auditLog.findMany({
      where: {
        businessId,
        entity: entityType,
        entityId,
        action: { in: ['create', 'update', 'adjust', 'void'] },
      },
      orderBy: { createdAt: 'asc' },
    });

    return auditLogs.map(log => ({
      action: log.action,
      oldValue: log.oldValue ? JSON.parse(log.oldValue) : null,
      newValue: log.newValue ? JSON.parse(log.newValue) : null,
      changedBy: log.userName,
      changedAt: log.createdAt,
      notes: log.notes,
    }));
  } catch (error) {
    console.error('Error getting edit history:', error);
    return [];
  }
}
