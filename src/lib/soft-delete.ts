// Soft Delete Utilities
// Provides consistent soft delete functionality across all models

import { db } from '@/lib/db';
import { auditDelete, auditRestore } from './audit';

// Models that support soft delete
type SoftDeletableModel = 
  | 'business'
  | 'subscription'
  | 'user'
  | 'branch'
  | 'partyCategory'
  | 'party'
  | 'partyLedger'
  | 'category'
  | 'unit'
  | 'item'
  | 'itemVariant'
  | 'batch'
  | 'stockLedger'
  | 'sale'
  | 'saleItem'
  | 'saleReturn'
  | 'saleReturnItem'
  | 'purchaseOrder'
  | 'purchaseOrderItem'
  | 'purchase'
  | 'purchaseItem'
  | 'purchaseReturn'
  | 'purchaseReturnItem'
  | 'payment'
  | 'paymentPlan'
  | 'installment'
  | 'account'
  | 'accountTransfer'
  | 'cashDrawerSession'
  | 'creditNote'
  | 'debitNote'
  | 'expenseCategory'
  | 'expense'
  | 'quotation'
  | 'periodLock'
  | 'supportTicket'
  | 'supportMessage';

/**
 * Soft delete a record by setting deletedAt timestamp
 */
export async function softDelete(
  model: SoftDeletableModel,
  id: string,
  options?: {
    businessId: string;
    userId?: string;
    userName?: string;
    branchId?: string;
    notes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const modelDelegate = (db as Record<string, { update: (args: { where: { id: string }; data: { deletedAt: Date } }) => Promise<Record<string, unknown>> }>)[model];
    
    if (!modelDelegate) {
      return { success: false, error: `Invalid model: ${model}` };
    }

    // Get the record before soft delete for audit
    const record = await (db as Record<string, { findUnique: (args: { where: { id: string } }) => Promise<Record<string, unknown> | null> }>)[model].findUnique({
      where: { id },
    });

    if (!record) {
      return { success: false, error: 'Record not found' };
    }

    // Check if already deleted
    if (record.deletedAt) {
      return { success: false, error: 'Record is already deleted' };
    }

    // Perform soft delete
    await modelDelegate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Create audit log
    if (options?.businessId) {
      await auditDelete(
        options.businessId,
        model as never, // Type cast for audit entity
        id,
        record,
        {
          branchId: options.branchId,
          userId: options.userId,
          userName: options.userName,
          entityName: record.name as string || record.invoiceNo as string,
          notes: options.notes,
        }
      );
    }

    return { success: true };
  } catch (error) {
    console.error(`Soft delete failed for ${model}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Restore a soft-deleted record
 */
export async function restoreDeleted(
  model: SoftDeletableModel,
  id: string,
  options?: {
    businessId: string;
    userId?: string;
    userName?: string;
    branchId?: string;
    notes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const modelDelegate = (db as Record<string, { update: (args: { where: { id: string }; data: { deletedAt: null } }) => Promise<Record<string, unknown>> }>)[model];
    
    if (!modelDelegate) {
      return { success: false, error: `Invalid model: ${model}` };
    }

    // Get the record before restore for audit
    const record = await (db as Record<string, { findUnique: (args: { where: { id: string } }) => Promise<Record<string, unknown> | null> }>)[model].findUnique({
      where: { id },
    });

    if (!record) {
      return { success: false, error: 'Record not found' };
    }

    // Check if not deleted
    if (!record.deletedAt) {
      return { success: false, error: 'Record is not deleted' };
    }

    // Perform restore
    await modelDelegate.update({
      where: { id },
      data: { deletedAt: null },
    });

    // Create audit log
    if (options?.businessId) {
      await auditRestore(
        options.businessId,
        model as never,
        id,
        record,
        {
          branchId: options.branchId,
          userId: options.userId,
          userName: options.userName,
          entityName: record.name as string || record.invoiceNo as string,
          notes: options.notes,
        }
      );
    }

    return { success: true };
  } catch (error) {
    console.error(`Restore failed for ${model}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Permanently delete a soft-deleted record
 * Only works on records that have been soft-deleted
 */
export async function permanentDelete(
  model: SoftDeletableModel,
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const modelDelegate = (db as Record<string, { delete: (args: { where: { id: string } }) => Promise<unknown> }>)[model];
    
    if (!modelDelegate) {
      return { success: false, error: `Invalid model: ${model}` };
    }

    // Get the record to verify it's soft-deleted
    const record = await (db as Record<string, { findUnique: (args: { where: { id: string } }) => Promise<Record<string, unknown> | null> }>)[model].findUnique({
      where: { id },
    });

    if (!record) {
      return { success: false, error: 'Record not found' };
    }

    // Safety check: Only allow permanent delete of soft-deleted records
    if (!record.deletedAt) {
      return { success: false, error: 'Can only permanently delete soft-deleted records' };
    }

    // Perform permanent delete
    await modelDelegate.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error(`Permanent delete failed for ${model}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if a record is soft-deleted
 */
export async function isSoftDeleted(
  model: SoftDeletableModel,
  id: string
): Promise<boolean> {
  try {
    const record = await (db as Record<string, { findUnique: (args: { where: { id: string } }) => Promise<{ deletedAt: Date | null } | null> }>)[model].findUnique({
      where: { id },
      select: { deletedAt: true },
    });

    return record?.deletedAt !== null && record?.deletedAt !== undefined;
  } catch {
    return false;
  }
}

/**
 * Get all soft-deleted records for a model
 */
export async function getDeletedRecords(
  model: SoftDeletableModel,
  businessId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<Record<string, unknown>[]> {
  try {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const records = await (db as Record<string, { findMany: (args: { where: { businessId: string; deletedAt: { not: null } }; take: number; skip: number; orderBy: { deletedAt: 'desc' } }) => Promise<Record<string, unknown>[]> }>)[model].findMany({
      where: {
        businessId,
        deletedAt: { not: null },
      },
      take: limit,
      skip: offset,
      orderBy: { deletedAt: 'desc' },
    });

    return records;
  } catch (error) {
    console.error(`Failed to get deleted records for ${model}:`, error);
    return [];
  }
}

/**
 * Count soft-deleted records for a model
 */
export async function countDeletedRecords(
  model: SoftDeletableModel,
  businessId: string
): Promise<number> {
  try {
    const count = await (db as Record<string, { count: (args: { where: { businessId: string; deletedAt: { not: null } } }) => Promise<number> }>)[model].count({
      where: {
        businessId,
        deletedAt: { not: null },
      },
    });

    return count;
  } catch {
    return 0;
  }
}

/**
 * Exclude soft-deleted records from where clause
 */
export function excludeDeleted<T extends { deletedAt?: Date | null }>(
  records: T[]
): T[] {
  return records.filter(record => !record.deletedAt);
}

/**
 * Include only soft-deleted records from where clause
 */
export function onlyDeleted<T extends { deletedAt?: Date | null }>(
  records: T[]
): T[] {
  return records.filter(record => record.deletedAt !== null && record.deletedAt !== undefined);
}

/**
 * Batch soft delete multiple records
 */
export async function batchSoftDelete(
  model: SoftDeletableModel,
  ids: string[],
  options?: {
    businessId: string;
    userId?: string;
    userName?: string;
    notes?: string;
  }
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const id of ids) {
    const result = await softDelete(model, id, options);
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push(`${id}: ${result.error}`);
    }
  }

  return results;
}

/**
 * Batch restore multiple soft-deleted records
 */
export async function batchRestore(
  model: SoftDeletableModel,
  ids: string[],
  options?: {
    businessId: string;
    userId?: string;
    userName?: string;
    notes?: string;
  }
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const id of ids) {
    const result = await restoreDeleted(model, id, options);
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push(`${id}: ${result.error}`);
    }
  }

  return results;
}
