// Audit Logging Utilities
// Provides comprehensive audit trail for all write operations

import { db } from '@/lib/db';
import { headers } from 'next/headers';

export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'restore' 
  | 'void' 
  | 'approve'
  | 'reject'
  | 'transfer'
  | 'adjust'
  | 'return'
  | 'refund';

export type AuditEntity = 
  | 'sale' 
  | 'sale_item'
  | 'sale_return'
  | 'sale_return_item'
  | 'purchase' 
  | 'purchase_item'
  | 'purchase_return'
  | 'purchase_return_item'
  | 'purchase_order'
  | 'purchase_order_item'
  | 'item' 
  | 'party' 
  | 'party_ledger'
  | 'stock_ledger'
  | 'payment' 
  | 'expense' 
  | 'account'
  | 'account_transfer'
  | 'cash_drawer_session'
  | 'credit_note'
  | 'debit_note'
  | 'quotation'
  | 'branch'
  | 'user'
  | 'category'
  | 'expense_category'
  | 'payment_plan'
  | 'installment'
  | 'support_ticket';

export interface AuditLogData {
  businessId: string;
  branchId?: string;
  userId?: string;
  userName?: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  entityName?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  notes?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    // Get IP address and user agent from headers
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || 
                      headersList.get('x-real-ip') || 
                      'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    await db.auditLog.create({
      data: {
        businessId: data.businessId,
        branchId: data.branchId,
        userId: data.userId,
        userName: data.userName,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        entityName: data.entityName,
        oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
        newValue: data.newValue ? JSON.stringify(data.newValue) : null,
        ipAddress: ipAddress,
        userAgent: userAgent,
        notes: data.notes,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logs should not break the main operation
  }
}

/**
 * Create audit log for entity creation
 */
export async function auditCreate(
  businessId: string,
  entity: AuditEntity,
  entityId: string,
  newValue: Record<string, unknown>,
  options?: {
    branchId?: string;
    userId?: string;
    userName?: string;
    entityName?: string;
    notes?: string;
  }
): Promise<void> {
  await createAuditLog({
    businessId,
    branchId: options?.branchId,
    userId: options?.userId,
    userName: options?.userName,
    action: 'create',
    entity,
    entityId,
    entityName: options?.entityName || newValue.name as string || newValue.invoiceNo as string,
    newValue,
    notes: options?.notes,
  });
}

/**
 * Create audit log for entity update
 */
export async function auditUpdate(
  businessId: string,
  entity: AuditEntity,
  entityId: string,
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>,
  options?: {
    branchId?: string;
    userId?: string;
    userName?: string;
    entityName?: string;
    notes?: string;
  }
): Promise<void> {
  // Only log changed fields
  const changedFields: Record<string, unknown> = {};
  const oldValues: Record<string, unknown> = {};
  
  for (const key of Object.keys(newValue)) {
    if (JSON.stringify(oldValue[key]) !== JSON.stringify(newValue[key])) {
      changedFields[key] = newValue[key];
      oldValues[key] = oldValue[key];
    }
  }
  
  if (Object.keys(changedFields).length === 0) {
    return; // No changes to log
  }

  await createAuditLog({
    businessId,
    branchId: options?.branchId,
    userId: options?.userId,
    userName: options?.userName,
    action: 'update',
    entity,
    entityId,
    entityName: options?.entityName || oldValue.name as string || oldValue.invoiceNo as string,
    oldValue: oldValues,
    newValue: changedFields,
    notes: options?.notes,
  });
}

/**
 * Create audit log for soft delete
 */
export async function auditDelete(
  businessId: string,
  entity: AuditEntity,
  entityId: string,
  oldValue: Record<string, unknown>,
  options?: {
    branchId?: string;
    userId?: string;
    userName?: string;
    entityName?: string;
    notes?: string;
  }
): Promise<void> {
  await createAuditLog({
    businessId,
    branchId: options?.branchId,
    userId: options?.userId,
    userName: options?.userName,
    action: 'delete',
    entity,
    entityId,
    entityName: options?.entityName || oldValue.name as string || oldValue.invoiceNo as string,
    oldValue,
    notes: options?.notes || 'Soft deleted',
  });
}

/**
 * Create audit log for restore (undo delete)
 */
export async function auditRestore(
  businessId: string,
  entity: AuditEntity,
  entityId: string,
  newValue: Record<string, unknown>,
  options?: {
    branchId?: string;
    userId?: string;
    userName?: string;
    entityName?: string;
    notes?: string;
  }
): Promise<void> {
  await createAuditLog({
    businessId,
    branchId: options?.branchId,
    userId: options?.userId,
    userName: options?.userName,
    action: 'restore',
    entity,
    entityId,
    entityName: options?.entityName || newValue.name as string || newValue.invoiceNo as string,
    newValue,
    notes: options?.notes || 'Restored from deletion',
  });
}

/**
 * Create audit log for voiding a transaction
 */
export async function auditVoid(
  businessId: string,
  entity: AuditEntity,
  entityId: string,
  oldValue: Record<string, unknown>,
  options?: {
    branchId?: string;
    userId?: string;
    userName?: string;
    entityName?: string;
    notes?: string;
  }
): Promise<void> {
  await createAuditLog({
    businessId,
    branchId: options?.branchId,
    userId: options?.userId,
    userName: options?.userName,
    action: 'void',
    entity,
    entityId,
    entityName: options?.entityName || oldValue.name as string || oldValue.invoiceNo as string,
    oldValue,
    notes: options?.notes || 'Transaction voided',
  });
}

/**
 * Create audit log for transfer between accounts/branches
 */
export async function auditTransfer(
  businessId: string,
  entity: AuditEntity,
  entityId: string,
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>,
  options?: {
    branchId?: string;
    userId?: string;
    userName?: string;
    entityName?: string;
    notes?: string;
  }
): Promise<void> {
  await createAuditLog({
    businessId,
    branchId: options?.branchId,
    userId: options?.userId,
    userName: options?.userName,
    action: 'transfer',
    entity,
    entityId,
    entityName: options?.entityName,
    oldValue,
    newValue,
    notes: options?.notes,
  });
}

/**
 * Create audit log for return transactions
 */
export async function auditReturn(
  businessId: string,
  entity: AuditEntity,
  entityId: string,
  newValue: Record<string, unknown>,
  options?: {
    branchId?: string;
    userId?: string;
    userName?: string;
    entityName?: string;
    notes?: string;
  }
): Promise<void> {
  await createAuditLog({
    businessId,
    branchId: options?.branchId,
    userId: options?.userId,
    userName: options?.userName,
    action: 'return',
    entity,
    entityId,
    entityName: options?.entityName || newValue.returnNo as string,
    newValue,
    notes: options?.notes,
  });
}

/**
 * Get audit history for an entity
 */
export async function getAuditHistory(
  businessId: string,
  entity: AuditEntity,
  entityId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
) {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  return db.auditLog.findMany({
    where: {
      businessId,
      entity,
      entityId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  });
}

/**
 * Get audit logs for a business with filtering
 */
export async function getAuditLogs(
  businessId: string,
  options?: {
    entity?: AuditEntity;
    userId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
) {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  return db.auditLog.findMany({
    where: {
      businessId,
      ...(options?.entity && { entity: options.entity }),
      ...(options?.userId && { userId: options.userId }),
      ...(options?.action && { action: options.action }),
      ...(options?.startDate && { createdAt: { gte: options.startDate } }),
      ...(options?.endDate && { createdAt: { lte: options.endDate } }),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  });
}
