// Hello Khata OS - Branch Context Validation & Access Control
// Multi-tenant branch isolation and security enforcement

import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// ============================================================
// TYPES
// ============================================================

export interface BranchContext {
  businessId: string;
  branchId: string | null; // null means "All Branches" mode
  userId?: string;
  userRole?: string;
}

export interface BranchValidationResult {
  valid: boolean;
  error?: {
    code: string;
    message: string;
  };
  branch?: {
    id: string;
    name: string;
    businessId: string;
    isMain: boolean;
    isActive: boolean;
  };
}

// ============================================================
// CORE VALIDATION FUNCTIONS
// ============================================================

/**
 * Validates that a branch belongs to the specified business
 * and is active.
 */
export async function validateBranchAccess(
  businessId: string,
  branchId: string | null | undefined,
  userId?: string
): Promise<BranchValidationResult> {
  // If branchId is null/undefined, check if user can use "All Branches" mode
  if (!branchId) {
    // "All Branches" mode is only valid for read operations
    // For write operations, a specific branch must be provided
    return {
      valid: true, // Valid for read operations
      branch: undefined,
    };
  }

  // Check if branch exists and belongs to the business
  const branch = await db.branch.findFirst({
    where: {
      id: branchId,
      businessId,
    },
    select: {
      id: true,
      name: true,
      businessId: true,
      isMain: true,
      isActive: true,
    },
  });

  if (!branch) {
    return {
      valid: false,
      error: {
        code: 'BRANCH_NOT_FOUND',
        message: 'Branch not found or does not belong to your business',
      },
    };
  }

  if (!branch.isActive) {
    return {
      valid: false,
      error: {
        code: 'BRANCH_INACTIVE',
        message: 'This branch is currently inactive',
      },
    };
  }

  // If userId provided, check if user has access to this branch
  if (userId) {
    const user = await db.user.findFirst({
      where: {
        id: userId,
        businessId,
      },
      select: {
        id: true,
        role: true,
        branchId: true,
      },
    });

    if (!user) {
      return {
        valid: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found in business',
        },
      };
    }

    // Owner can access all branches
    if (user.role === 'owner') {
      return { valid: true, branch };
    }

    // Manager can access all branches (configurable per business)
    if (user.role === 'manager') {
      return { valid: true, branch };
    }

    // Staff can only access their assigned branch
    if (user.role === 'staff') {
      if (user.branchId && user.branchId !== branchId) {
        return {
          valid: false,
          error: {
            code: 'BRANCH_ACCESS_DENIED',
            message: 'You do not have access to this branch',
          },
        };
      }
    }
  }

  return { valid: true, branch };
}

/**
 * Validates branch for write operations (CREATE/UPDATE/DELETE)
 * Requires a specific branchId - "All Branches" mode is not allowed
 */
export async function validateBranchForWrite(
  businessId: string,
  branchId: string | null | undefined,
  userId?: string
): Promise<BranchValidationResult> {
  // For write operations, branchId is REQUIRED
  if (!branchId) {
    return {
      valid: false,
      error: {
        code: 'BRANCH_REQUIRED',
        message: 'A specific branch must be selected for this operation. "All Branches" mode is not allowed for creating or modifying records.',
      },
    };
  }

  return validateBranchAccess(businessId, branchId, userId);
}

/**
 * Gets the default branch for a business (main branch or first active branch)
 */
export async function getDefaultBranch(businessId: string): Promise<string | null> {
  const branch = await db.branch.findFirst({
    where: {
      businessId,
      isActive: true,
    },
    orderBy: [
      { isMain: 'desc' },
      { createdAt: 'asc' },
    ],
    select: { id: true },
  });

  return branch?.id || null;
}

/**
 * Ensures branchId is set for write operations.
 * If branchId is not provided, returns the default branch.
 */
export async function ensureBranchForWrite(
  businessId: string,
  branchId: string | null | undefined,
  userId?: string
): Promise<{ branchId: string | null; error?: { code: string; message: string } }> {
  // If branchId provided, validate it
  if (branchId) {
    const validation = await validateBranchForWrite(businessId, branchId, userId);
    if (!validation.valid) {
      return { branchId: null, error: validation.error };
    }
    return { branchId };
  }

  // Get default branch
  const defaultBranchId = await getDefaultBranch(businessId);
  
  if (!defaultBranchId) {
    return {
      branchId: null,
      error: {
        code: 'NO_BRANCH_FOUND',
        message: 'No active branch found for your business. Please create a branch first.',
      },
    };
  }

  // Validate default branch access
  const validation = await validateBranchForWrite(businessId, defaultBranchId, userId);
  if (!validation.valid) {
    return { branchId: null, error: validation.error };
  }

  return { branchId: defaultBranchId };
}

// ============================================================
// API HELPER FUNCTIONS
// ============================================================

/**
 * Extracts branch context from request headers
 */
export function extractBranchContext(request: Request): BranchContext | null {
  const businessId = request.headers.get('x-business-id');
  const branchId = request.headers.get('x-branch-id');
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');

  if (!businessId) {
    return null;
  }

  return {
    businessId,
    branchId: branchId || null,
    userId: userId || undefined,
    userRole: userRole || undefined,
  };
}

/**
 * Creates a standardized error response for branch validation failures
 */
export function branchErrorResponse(error: { code: string; message: string }): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status: error.code === 'BRANCH_REQUIRED' ? 400 : 403 }
  );
}

// ============================================================
// QUERY HELPER FUNCTIONS
// ============================================================

/**
 * Builds a where clause for branch-scoped queries
 * Respects "All Branches" mode (null branchId)
 */
export function buildBranchWhereClause<T extends { businessId: string; branchId?: string | null }>(
  businessId: string,
  branchId: string | null | undefined
): { businessId: string; branchId?: string | null } {
  const clause: { businessId: string; branchId?: string | null } = { businessId };

  // If branchId is provided, filter by it
  // If branchId is null (All Branches mode), don't add branchId filter
  if (branchId) {
    clause.branchId = branchId;
  }

  return clause;
}

/**
 * Builds an OR condition for items that can be branch-specific or shared
 * (branchId matches OR branchId is null for shared items)
 */
export function buildBranchOrSharedWhereClause(
  businessId: string,
  branchId: string | null | undefined
): { businessId: string; OR: Array<{ branchId?: string | null }> } {
  if (branchId) {
    return {
      businessId,
      OR: [
        { branchId },
        { branchId: null }, // Include shared items (no branch assignment)
      ],
    };
  }

  // All branches mode - return all items for the business
  return { businessId, OR: [] };
}

// ============================================================
// PLAN LIMIT HELPER
// ============================================================

/**
 * Checks if business can add more branches based on their plan
 */
export async function canAddBranch(businessId: string): Promise<{ 
  canAdd: boolean; 
  current: number; 
  limit: number | 'unlimited';
  planId: string;
}> {
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { plan: true },
  });

  const planId = (business?.plan || 'free') as 'free' | 'starter' | 'growth' | 'intelligence';
  
  const planLimits: Record<string, number | 'unlimited'> = {
    free: 1,
    starter: 1,
    growth: 3,
    intelligence: 'unlimited',
  };

  const limit = planLimits[planId];
  const current = await db.branch.count({ where: { businessId } });

  const canAdd = limit === 'unlimited' || current < limit;

  return { canAdd, current, limit, planId };
}
