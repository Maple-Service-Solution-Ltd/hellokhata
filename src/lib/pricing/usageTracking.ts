// Subscription Usage Tracking Service
// Tracks usage against plan limits

import { db } from '@/lib/db';
import type { PlanId, PlanLimits } from './plans';
import { getPlanLimits, getPlanById } from './plans';

// ============================================================
// TYPES
// ============================================================

export type UsageType = 'ai_chat' | 'ai_summary' | 'export_csv' | 'export_excel' | 'export_pdf' | 'api_call';

export interface UsageResult {
  allowed: boolean;
  currentUsage: number;
  limit: number | 'unlimited';
  remaining: number | 'unlimited';
  resetAt: Date | null;
  message?: string;
  messageBn?: string;
}

export interface UsageStats {
  aiChats: { used: number; limit: number | 'unlimited' };
  exports: { used: number; limit: number | 'unlimited' };
  staff: { current: number; limit: number | 'unlimited' };
  branches: { current: number; limit: number | 'unlimited' };
  items: { current: number; limit: number | 'unlimited' };
}

// ============================================================
// USAGE TRACKING
// ============================================================

/**
 * Check if a usage action is allowed under the current plan
 */
export async function checkUsageLimit(
  businessId: string,
  planId: PlanId,
  usageType: UsageType
): Promise<UsageResult> {
  const limits = getPlanLimits(planId);
  const plan = getPlanById(planId);
  
  // Get today's date for daily limits
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get current month for monthly limits
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // Determine reset time based on usage type
  const resetAt = new Date(today);
  resetAt.setDate(resetAt.getDate() + 1);
  resetAt.setHours(0, 0, 0, 0);
  
  // Get or create usage record
  const existingRecord = await db.usageRecord.findUnique({
    where: {
      businessId_type_date: {
        businessId,
        type: usageType,
        date: today,
      },
    },
  });
  
  const currentUsage = existingRecord?.count ?? 0;
  
  // Determine limit based on usage type
  let limit: number | 'unlimited';
  let allowed = true;
  let message: string | undefined;
  let messageBn: string | undefined;
  
  switch (usageType) {
    case 'ai_chat':
      limit = limits.aiChatsPerDay;
      if (limit !== 'unlimited' && currentUsage >= limit) {
        allowed = false;
        message = `Daily AI chat limit (${limit}) reached. Upgrade for more.`;
        messageBn = `দৈনিক AI চ্যাট সীমা (${limit}) পূর্ণ। আপগ্রেড করুন।`;
      }
      break;
      
    case 'ai_summary':
      limit = limits.aiDailySummary ? 'unlimited' : 0;
      if (!limits.aiDailySummary) {
        allowed = false;
        message = 'AI daily summary requires Growth plan or higher.';
        messageBn = 'AI দৈনিক সারাংশের জন্য গ্রোথ প্ল্যান বা উচ্চতর প্রয়োজন।';
      }
      break;
      
    case 'export_csv':
      limit = limits.exportCSV ? 'unlimited' : 0;
      if (!limits.exportCSV) {
        allowed = false;
        message = 'CSV export requires Starter plan or higher.';
        messageBn = 'CSV এক্সপোর্টের জন্য স্টার্টার প্ল্যান বা উচ্চতর প্রয়োজন।';
      }
      break;
      
    case 'export_excel':
      limit = limits.exportExcel ? 'unlimited' : 0;
      if (!limits.exportExcel) {
        allowed = false;
        message = 'Excel export requires Growth plan or higher.';
        messageBn = 'এক্সেল এক্সপোর্টের জন্য গ্রোথ প্ল্যান বা উচ্চতর প্রয়োজন।';
      }
      break;
      
    case 'export_pdf':
      limit = limits.exportPDF ? 'unlimited' : 0;
      if (!limits.exportPDF) {
        allowed = false;
        message = 'PDF export requires Growth plan or higher.';
        messageBn = 'PDF এক্সপোর্টের জন্য গ্রোথ প্ল্যান বা উচ্চতর প্রয়োজন।';
      }
      break;
      
    case 'api_call':
      limit = limits.apiAccess ? 'unlimited' : 0;
      if (!limits.apiAccess) {
        allowed = false;
        message = 'API access requires Intelligence plan.';
        messageBn = 'API অ্যাক্সেসের জন্য ইন্টেলিজেন্স প্ল্যান প্রয়োজন।';
      }
      break;
      
    default:
      limit = 0;
      allowed = false;
  }
  
  const remaining = limit === 'unlimited' ? 'unlimited' : Math.max(0, (limit as number) - currentUsage);
  
  return {
    allowed,
    currentUsage,
    limit,
    remaining,
    resetAt: limit !== 'unlimited' ? resetAt : null,
    message,
    messageBn,
  };
}

/**
 * Record a usage action (increment counter)
 */
export async function recordUsage(
  businessId: string,
  usageType: UsageType
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const resetAt = new Date(today);
  resetAt.setDate(resetAt.getDate() + 1);
  
  // Upsert usage record
  await db.usageRecord.upsert({
    where: {
      businessId_type_date: {
        businessId,
        type: usageType,
        date: today,
      },
    },
    create: {
      businessId,
      type: usageType,
      count: 1,
      date: today,
      resetAt,
    },
    update: {
      count: { increment: 1 },
    },
  });
}

/**
 * Get usage statistics for a business
 */
export async function getUsageStats(businessId: string, planId: PlanId): Promise<UsageStats> {
  const limits = getPlanLimits(planId);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get today's AI chat usage
  const aiChatUsage = await db.usageRecord.findUnique({
    where: {
      businessId_type_date: {
        businessId,
        type: 'ai_chat',
        date: today,
      },
    },
  });
  
  // Get current counts
  const [staffCount, branchCount, itemCount] = await Promise.all([
    db.user.count({ where: { businessId, isActive: true } }),
    db.branch.count({ where: { businessId, isActive: true } }),
    db.item.count({ where: { businessId, isActive: true } }),
  ]);
  
  return {
    aiChats: {
      used: aiChatUsage?.count ?? 0,
      limit: limits.aiChatsPerDay,
    },
    exports: {
      used: 0, // Not tracked daily
      limit: limits.exportCSV || limits.exportExcel || limits.exportPDF ? 'unlimited' : 0,
    },
    staff: {
      current: staffCount,
      limit: limits.staffLimit,
    },
    branches: {
      current: branchCount,
      limit: limits.branchLimit,
    },
    items: {
      current: itemCount,
      limit: limits.itemsLimit,
    },
  };
}

/**
 * Check if business can add more staff/branches/items
 */
export async function canAddEntity(
  businessId: string,
  planId: PlanId,
  entityType: 'staff' | 'branch' | 'item'
): Promise<{ allowed: boolean; current: number; limit: number | 'unlimited'; message?: string }> {
  const limits = getPlanLimits(planId);
  
  let current: number;
  let limit: number | 'unlimited';
  let entityName: string;
  
  switch (entityType) {
    case 'staff':
      current = await db.user.count({ where: { businessId, isActive: true } });
      limit = limits.staffLimit;
      entityName = 'staff';
      break;
    case 'branch':
      current = await db.branch.count({ where: { businessId, isActive: true } });
      limit = limits.branchLimit;
      entityName = 'branch';
      break;
    case 'item':
      current = await db.item.count({ where: { businessId, isActive: true } });
      limit = limits.itemsLimit;
      entityName = 'item';
      break;
  }
  
  const allowed = limit === 'unlimited' || current < limit;
  
  return {
    allowed,
    current,
    limit,
    message: !allowed
      ? `${entityName} limit (${limit}) reached. Upgrade to add more.`
      : undefined,
  };
}

/**
 * Check feature access
 */
export function checkFeatureAccess(planId: PlanId, feature: keyof PlanLimits): {
  hasAccess: boolean;
  planRequired?: string;
} {
  const limits = getPlanLimits(planId);
  const value = limits[feature];
  
  const hasAccess = typeof value === 'boolean' 
    ? value 
    : typeof value === 'number' 
      ? value > 0 
      : value === 'unlimited';
  
  if (hasAccess) {
    return { hasAccess: true };
  }
  
  // Find minimum plan required for this feature
  const planOrder: PlanId[] = ['free', 'starter', 'growth', 'intelligence'];
  
  for (const pid of planOrder) {
    const planLimits = getPlanLimits(pid);
    const planValue = planLimits[feature];
    const planHasAccess = typeof planValue === 'boolean'
      ? planValue
      : typeof planValue === 'number'
        ? planValue > 0
        : planValue === 'unlimited';
    
    if (planHasAccess) {
      return {
        hasAccess: false,
        planRequired: pid.charAt(0).toUpperCase() + pid.slice(1),
      };
    }
  }
  
  return { hasAccess: false };
}
