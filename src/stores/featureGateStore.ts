// Hello Khata OS - Feature Gate Store
// হ্যালো খাতা - ফিচার গেট স্টোর
// Updated for 4-tier pricing: FREE, STARTER, GROWTH, INTELLIGENCE

import { create } from 'zustand';
import { useSessionStore } from '@/stores/sessionStore';
import type { FeatureName, PlanType, FeatureGateConfig } from '@/types';

// ============================================================
// PLAN HIERARCHY
// ============================================================

export type PricingPlanId = 'free' | 'starter' | 'growth' | 'intelligence';

const PLAN_HIERARCHY: Record<PricingPlanId, number> = {
  free: 0,
  starter: 1,
  growth: 2,
  intelligence: 3,
};

// Note: The LEGACY_PLAN_MAP is kept for backward compatibility with any stored session data
// Current PlanType values are already the correct pricing tier IDs
const LEGACY_PLAN_MAP: Record<string, PricingPlanId> = {
  // Current plan types (direct mapping)
  free: 'free',
  starter: 'starter',
  growth: 'growth',
  intelligence: 'intelligence',
  // Legacy plan types (for backward compatibility with stored sessions)
  business: 'growth',
  pro: 'growth',
  ai: 'intelligence',
};

// ============================================================
// FEATURE CONFIGURATIONS
// ============================================================

const FEATURE_CONFIGS: Record<FeatureName, {
  minPlan: PricingPlanId;
  upgradeMessage: string;
  upgradeMessageBn: string;
}> = {
  // Available on FREE
  globalSearch: {
    minPlan: 'free',
    upgradeMessage: 'Available on all plans',
    upgradeMessageBn: 'সব প্ল্যানে উপলব্ধ',
  },
  
  // Available on STARTER
  dataExport: {
    minPlan: 'starter',
    upgradeMessage: 'Upgrade to Starter plan for CSV export',
    upgradeMessageBn: 'CSV এক্সপোর্টের জন্য স্টার্টার প্ল্যানে আপগ্রেড করুন',
  },
  deadStockAnalysis: {
    minPlan: 'starter',
    upgradeMessage: 'Upgrade to Starter plan for dead stock alerts',
    upgradeMessageBn: 'ডেড স্টক এলার্টের জন্য স্টার্টার প্ল্যানে আপগ্রেড করুন',
  },
  creditControl: {
    minPlan: 'starter',
    upgradeMessage: 'Credit tracking available on Starter plan',
    upgradeMessageBn: 'ক্রেডিট ট্র্যাকিং স্টার্টার প্ল্যানে উপলব্ধ',
  },
  
  // Available on GROWTH
  multiBranch: {
    minPlan: 'growth',
    upgradeMessage: 'Upgrade to Growth plan for multi-branch support',
    upgradeMessageBn: 'মাল্টি-ব্রাঞ্চ সাপোর্টের জন্য গ্রোথ প্ল্যানে আপগ্রেড করুন',
  },
  staffPerformance: {
    minPlan: 'growth',
    upgradeMessage: 'Upgrade to Growth plan for staff performance tracking',
    upgradeMessageBn: 'স্টাফ পারফরম্যান্স ট্র্যাকিংয়ের জন্য গ্রোথ প্ল্যানে আপগ্রেড করুন',
  },
  healthScore: {
    minPlan: 'growth',
    upgradeMessage: 'Upgrade to Growth plan for business health score',
    upgradeMessageBn: 'বিজনেস হেলথ স্কোরের জন্য গ্রোথ প্ল্যানে আপগ্রেড করুন',
  },
  advancedReports: {
    minPlan: 'growth',
    upgradeMessage: 'Upgrade to Growth plan for advanced reports and Excel/PDF export',
    upgradeMessageBn: 'অ্যাডভান্সড রিপোর্ট ও Excel/PDF এক্সপোর্টের জন্য গ্রোথ প্ল্যানে আপগ্রেড করুন',
  },
  aiAssistant: {
    minPlan: 'growth',
    upgradeMessage: 'Upgrade to Growth plan for AI assistant (50 chats/day)',
    upgradeMessageBn: 'AI সহকারীর (৫০ চ্যাট/দিন) জন্য গ্রোথ প্ল্যানে আপগ্রেড করুন',
  },
  reconciliation: {
    minPlan: 'growth',
    upgradeMessage: 'Upgrade to Growth plan for account reconciliation',
    upgradeMessageBn: 'অ্যাকাউন্ট রিকনসিলিয়েশনের জন্য গ্রোথ প্ল্যানে আপগ্রেড করুন',
  },
  
  // Available on INTELLIGENCE
  auditTrail: {
    minPlan: 'intelligence',
    upgradeMessage: 'Upgrade to Intelligence plan for audit trail',
    upgradeMessageBn: 'অডিট ট্রেইলের জন্য ইন্টেলিজেন্স প্ল্যানে আপগ্রেড করুন',
  },
  advancedPricing: {
    minPlan: 'intelligence',
    upgradeMessage: 'Upgrade to Intelligence plan for smart reorder and advanced forecasting',
    upgradeMessageBn: 'স্মার্ট রিঅর্ডার ও অ্যাডভান্সড ফোরকাস্টিংয়ের জন্য ইন্টেলিজেন্স প্ল্যানে আপগ্রেড করুন',
  },
};

// ============================================================
// STORE INTERFACE
// ============================================================

interface FeatureGateState {
  // Current plan (converted to pricing tier)
  currentPlan: PricingPlanId;
  
  // Actions
  setPlan: (plan: PlanType | PricingPlanId) => void;
  
  // Helpers
  isFeatureUnlocked: (feature: FeatureName) => boolean;
  getFeatureConfig: (feature: FeatureName) => FeatureGateConfig;
  getRequiredPlan: (feature: FeatureName) => PricingPlanId;
  getUpgradeUrl: (feature: FeatureName) => string;
  
  // Plan-specific helpers
  getPlanLimits: () => PlanLimits;
  canUseAI: () => { allowed: boolean; remaining: number | 'unlimited' };
}

// ============================================================
// PLAN LIMITS INTERFACE
// ============================================================

interface PlanLimits {
  staffLimit: number | 'unlimited';
  branchLimit: number | 'unlimited';
  itemsLimit: number | 'unlimited';
  aiChatsPerDay: number | 'unlimited';
  hasHealthScore: boolean;
  hasProfitAnalytics: boolean;
  hasCashFlowForecast: boolean;
  hasStaffPerformance: boolean;
  hasExportCSV: boolean;
  hasExportExcel: boolean;
  hasExportPDF: boolean;
  hasDeadStockAlert: boolean;
  hasLowStockAlert: boolean;
  hasCreditAlert: boolean;
  hasApiAccess: boolean;
  hasSmartReorder: boolean;
  hasGrowthInsights: boolean;
}

const PLAN_LIMITS: Record<PricingPlanId, PlanLimits> = {
  free: {
    staffLimit: 1,
    branchLimit: 1,
    itemsLimit: 100,
    aiChatsPerDay: 3,
    hasHealthScore: false,
    hasProfitAnalytics: false,
    hasCashFlowForecast: false,
    hasStaffPerformance: false,
    hasExportCSV: false,
    hasExportExcel: false,
    hasExportPDF: false,
    hasDeadStockAlert: false,
    hasLowStockAlert: false,
    hasCreditAlert: false,
    hasApiAccess: false,
    hasSmartReorder: false,
    hasGrowthInsights: false,
  },
  starter: {
    staffLimit: 2,
    branchLimit: 1,
    itemsLimit: 'unlimited',
    aiChatsPerDay: 15,
    hasHealthScore: false,
    hasProfitAnalytics: false,
    hasCashFlowForecast: false,
    hasStaffPerformance: false,
    hasExportCSV: true,
    hasExportExcel: false,
    hasExportPDF: false,
    hasDeadStockAlert: true,
    hasLowStockAlert: true,
    hasCreditAlert: true,
    hasApiAccess: false,
    hasSmartReorder: false,
    hasGrowthInsights: false,
  },
  growth: {
    staffLimit: 5,
    branchLimit: 3,
    itemsLimit: 'unlimited',
    aiChatsPerDay: 50,
    hasHealthScore: true,
    hasProfitAnalytics: true,
    hasCashFlowForecast: false,
    hasStaffPerformance: true,
    hasExportCSV: true,
    hasExportExcel: true,
    hasExportPDF: true,
    hasDeadStockAlert: true,
    hasLowStockAlert: true,
    hasCreditAlert: true,
    hasApiAccess: false,
    hasSmartReorder: false,
    hasGrowthInsights: false,
  },
  intelligence: {
    staffLimit: 'unlimited',
    branchLimit: 'unlimited',
    itemsLimit: 'unlimited',
    aiChatsPerDay: 'unlimited',
    hasHealthScore: true,
    hasProfitAnalytics: true,
    hasCashFlowForecast: true,
    hasStaffPerformance: true,
    hasExportCSV: true,
    hasExportExcel: true,
    hasExportPDF: true,
    hasDeadStockAlert: true,
    hasLowStockAlert: true,
    hasCreditAlert: true,
    hasApiAccess: true,
    hasSmartReorder: true,
    hasGrowthInsights: true,
  },
};

// ============================================================
// ZUSTAND STORE
// ============================================================

export const useFeatureGateStore = create<FeatureGateState>((set, get) => ({
  currentPlan: 'free',
  
  setPlan: (plan) => {
    // Convert legacy plan types
    const pricingPlan = (LEGACY_PLAN_MAP[plan as PlanType] || plan) as PricingPlanId;
    set({ currentPlan: pricingPlan });
  },
  
  isFeatureUnlocked: (feature) => {
    const { currentPlan } = get();
    const config = FEATURE_CONFIGS[feature];
    if (!config) return true; // Unknown features are unlocked
    return PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[config.minPlan];
  },
  
  getFeatureConfig: (feature) => {
    const { currentPlan } = get();
    const config = FEATURE_CONFIGS[feature];
    const isUnlocked = config 
      ? PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[config.minPlan]
      : true;
    
    return {
      feature,
      requiredPlan: config ? [config.minPlan] : ['free'],
      isUnlocked,
      upgradeMessage: config?.upgradeMessage || '',
      upgradeMessageBn: config?.upgradeMessageBn || '',
      showBlur: !isUnlocked,
    };
  },
  
  getRequiredPlan: (feature) => {
    return FEATURE_CONFIGS[feature]?.minPlan || 'free';
  },
  
  getUpgradeUrl: (feature) => {
    const requiredPlan = FEATURE_CONFIGS[feature]?.minPlan || 'growth';
    return `/settings/billing?plan=${requiredPlan}`;
  },
  
  getPlanLimits: () => {
    const { currentPlan } = get();
    return PLAN_LIMITS[currentPlan];
  },
  
  canUseAI: () => {
    const { currentPlan } = get();
    const limits = PLAN_LIMITS[currentPlan];
    
    // For unlimited plans, always allow
    if (limits.aiChatsPerDay === 'unlimited') {
      return { allowed: true, remaining: 'unlimited' };
    }
    
    // For limited plans, check usage (simplified - in production, check actual usage)
    // This would typically be checked against the API
    return { allowed: true, remaining: limits.aiChatsPerDay };
  },
}));

// ============================================================
// HELPER HOOK - Reads plan directly from session store for reliability
// ============================================================

export const useFeatureAccess = (feature: FeatureName) => {
  // Read plan directly from session store - this ensures we always have the correct plan
  const sessionPlan = useSessionStore((state) => state.plan);
  
  // Convert to pricing plan ID
  const pricingPlan = (LEGACY_PLAN_MAP[sessionPlan as PlanType] || sessionPlan) as PricingPlanId;
  
  const config = FEATURE_CONFIGS[feature];
  const isUnlocked = config 
    ? PLAN_HIERARCHY[pricingPlan] >= PLAN_HIERARCHY[config.minPlan]
    : true;
  
  return {
    isUnlocked,
    config: {
      feature,
      requiredPlan: config ? [config.minPlan] : ['free'],
      isUnlocked,
      upgradeMessage: config?.upgradeMessage || '',
      upgradeMessageBn: config?.upgradeMessageBn || '',
      showBlur: !isUnlocked,
    },
    requiredPlan: config?.minPlan || 'free',
    upgradeUrl: `/settings/billing?plan=${config?.minPlan || 'growth'}`,
    currentPlan: pricingPlan,
  };
};

// ============================================================
// PLAN FEATURES EXPORT
// ============================================================

export const PLAN_FEATURES_MAP: Record<PricingPlanId, FeatureName[]> = {
  free: ['globalSearch'],
  starter: ['globalSearch', 'dataExport', 'deadStockAnalysis', 'creditControl'],
  growth: ['globalSearch', 'dataExport', 'deadStockAnalysis', 'creditControl', 'multiBranch', 'staffPerformance', 'healthScore', 'advancedReports', 'aiAssistant', 'reconciliation'],
  intelligence: ['globalSearch', 'dataExport', 'deadStockAnalysis', 'creditControl', 'multiBranch', 'staffPerformance', 'healthScore', 'advancedReports', 'aiAssistant', 'reconciliation', 'auditTrail', 'advancedPricing'],
};

// ============================================================
// EXPORTS
// ============================================================

export { PLAN_HIERARCHY, PLAN_LIMITS };
export type { PlanLimits };
