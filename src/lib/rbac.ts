// Role-Based Access Control (RBAC) Utilities
// Provides permission checking and enforcement

import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Permission definitions
export type PermissionModule = 
  | 'sales'
  | 'purchases'
  | 'inventory'
  | 'parties'
  | 'expenses'
  | 'accounts'
  | 'reports'
  | 'settings'
  | 'branches'
  | 'staff'
  | 'support';

export type PermissionAction = 
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'export'
  | 'manage';

export interface Permission {
  module: PermissionModule;
  actions: PermissionAction[];
}

// Default role permissions
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: [
    { module: 'sales', actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
    { module: 'purchases', actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
    { module: 'inventory', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { module: 'parties', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { module: 'expenses', actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] },
    { module: 'accounts', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { module: 'reports', actions: ['view', 'export'] },
    { module: 'settings', actions: ['view', 'edit', 'manage'] },
    { module: 'branches', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { module: 'staff', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
    { module: 'support', actions: ['view', 'create'] },
  ],
  manager: [
    { module: 'sales', actions: ['view', 'create', 'edit', 'delete', 'export'] },
    { module: 'purchases', actions: ['view', 'create', 'edit', 'export'] },
    { module: 'inventory', actions: ['view', 'create', 'edit', 'export'] },
    { module: 'parties', actions: ['view', 'create', 'edit', 'export'] },
    { module: 'expenses', actions: ['view', 'create', 'edit', 'export'] },
    { module: 'accounts', actions: ['view', 'create', 'edit'] },
    { module: 'reports', actions: ['view', 'export'] },
    { module: 'settings', actions: ['view'] },
    { module: 'branches', actions: ['view'] },
    { module: 'staff', actions: ['view'] },
    { module: 'support', actions: ['view', 'create'] },
  ],
  staff: [
    { module: 'sales', actions: ['view', 'create', 'edit'] },
    { module: 'purchases', actions: ['view', 'create'] },
    { module: 'inventory', actions: ['view', 'create'] },
    { module: 'parties', actions: ['view', 'create'] },
    { module: 'expenses', actions: ['view', 'create'] },
    { module: 'accounts', actions: ['view'] },
    { module: 'reports', actions: ['view'] },
    { module: 'support', actions: ['view', 'create'] },
  ],
};

/**
 * Get permissions for a user
 */
export async function getUserPermissions(
  userId: string,
  businessId: string
): Promise<Permission[]> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, permissions: true },
    });

    if (!user) {
      return [];
    }

    // If user has custom permissions, use those
    if (user.permissions) {
      try {
        return JSON.parse(user.permissions) as Permission[];
      } catch {
        // Fall through to role-based permissions
      }
    }

    // Use role-based default permissions
    return ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.staff;
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  permissions: Permission[],
  module: PermissionModule,
  action: PermissionAction
): boolean {
  const modulePermission = permissions.find(p => p.module === module);
  if (!modulePermission) {
    return false;
  }
  return modulePermission.actions.includes(action);
}

/**
 * Check if user can access a specific feature
 */
export async function checkPermission(
  userId: string,
  businessId: string,
  module: PermissionModule,
  action: PermissionAction
): Promise<boolean> {
  const permissions = await getUserPermissions(userId, businessId);
  return hasPermission(permissions, module, action);
}

/**
 * Middleware to check permission for API routes
 */
export async function requirePermission(
  request: NextRequest,
  module: PermissionModule,
  action: PermissionAction,
  session: { userId: string; businessId: string }
): Promise<NextResponse | null> {
  const hasAccess = await checkPermission(session.userId, session.businessId, module, action);
  
  if (!hasAccess) {
    return NextResponse.json(
      { 
        error: 'Access denied', 
        message: `You don't have permission to ${action} ${module}` 
      },
      { status: 403 }
    );
  }
  
  return null; // null means permission granted
}

/**
 * Check if user is owner
 */
export async function isOwner(userId: string, businessId: string): Promise<boolean> {
  try {
    const user = await db.user.findFirst({
      where: {
        id: userId,
        businessId,
        role: 'owner',
      },
    });
    return !!user;
  } catch {
    return false;
  }
}

/**
 * Check if user is manager or owner
 */
export async function isManagerOrOwner(userId: string, businessId: string): Promise<boolean> {
  try {
    const user = await db.user.findFirst({
      where: {
        id: userId,
        businessId,
        role: { in: ['owner', 'manager'] },
      },
    });
    return !!user;
  } catch {
    return false;
  }
}

/**
 * Check if user can modify a specific branch
 */
export async function canManageBranch(
  userId: string,
  businessId: string,
  branchId: string | null
): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, branchId: true },
    });

    if (!user) return false;

    // Owners can manage all branches
    if (user.role === 'owner') return true;

    // Managers can manage their assigned branch
    if (user.role === 'manager' && user.branchId === branchId) return true;

    return false;
  } catch {
    return false;
  }
}

/**
 * Get allowed branches for a user
 */
export async function getAllowedBranches(
  userId: string,
  businessId: string
): Promise<string[] | null> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, branchId: true },
    });

    if (!user) return null;

    // Owners can access all branches
    if (user.role === 'owner') {
      const branches = await db.branch.findMany({
        where: { businessId, deletedAt: null },
        select: { id: true },
      });
      return branches.map(b => b.id);
    }

    // Others can only access their assigned branch
    return user.branchId ? [user.branchId] : [];
  } catch {
    return null;
  }
}

/**
 * Validate that user can perform action on entity
 */
export async function validateEntityAccess(
  userId: string,
  businessId: string,
  entityType: string,
  entityId: string,
  action: PermissionAction
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Get user's role and branch
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, branchId: true },
    });

    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }

    // Owners have full access
    if (user.role === 'owner') {
      return { allowed: true };
    }

    // For branch-scoped entities, check branch access
    const branchScopedEntities = ['sale', 'purchase', 'expense', 'item'];
    
    if (branchScopedEntities.includes(entityType)) {
      // Get entity's branch
      const entity = await (db as Record<string, { findUnique: (args: { where: { id: string }; select: { branchId: string | null } }) => Promise<{ branchId: string | null } | null> }>)[entityType]?.findUnique({
        where: { id: entityId },
        select: { branchId: true },
      });

      if (!entity) {
        return { allowed: false, reason: 'Entity not found' };
      }

      // Check if user's branch matches entity's branch
      if (entity.branchId && user.branchId !== entity.branchId) {
        return { allowed: false, reason: 'Cannot access this branch\'s data' };
      }
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error validating entity access:', error);
    return { allowed: false, reason: 'Error checking access' };
  }
}

/**
 * Filter query results based on user's branch access
 */
export function buildBranchFilter(userId: string, userRole: string, userBranchId: string | null) {
  if (userRole === 'owner') {
    return {}; // No filter for owners
  }
  
  if (userBranchId) {
    return { branchId: userBranchId };
  }
  
  return { branchId: null }; // Users without branch can only see unassigned
}

/**
 * Create permission check middleware for API routes
 */
export function withPermission(module: PermissionModule, action: PermissionAction) {
  return async (
    request: NextRequest,
    session: { userId: string; businessId: string }
  ): Promise<NextResponse | null> => {
    return requirePermission(request, module, action, session);
  };
}
