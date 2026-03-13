// Pricing Tiers Configuration for Hello Khata OS
// Complete feature matrix for all subscription plans

// ============================================================
// PLAN TYPES
// ============================================================

export type PlanId = 'free' | 'starter' | 'growth' | 'intelligence';

export interface PlanFeature {
  name: string;
  nameBn: string;
  included: boolean;
  limit?: number | 'unlimited';
  description?: string;
  descriptionBn?: string;
}

export interface PricingPlan {
  id: PlanId;
  name: string;
  nameBn: string;
  price: number;
  priceDisplay: string;
  priceDisplayBn: string;
  description: string;
  descriptionBn: string;
  highlight?: boolean;
  badge?: string;
  badgeBn?: string;
  features: PlanFeature[];
  limits: PlanLimits;
  targetAudience: string;
  targetAudienceBn: string;
}

export interface PlanLimits {
  // Staff & Branches
  staffLimit: number | 'unlimited';
  branchLimit: number | 'unlimited';
  
  // Inventory
  itemsLimit: number | 'unlimited';
  
  // AI Features
  aiChatsPerDay: number | 'unlimited';
  aiDailySummary: boolean;
  aiForecasting: boolean;
  aiSmartReorder: boolean;
  aiGrowthInsights: boolean;
  
  // Analytics
  healthScore: boolean;
  profitAnalytics: boolean;
  cashFlowForecast: boolean;
  staffPerformance: boolean;
  
  // Export
  exportCSV: boolean;
  exportExcel: boolean;
  exportPDF: boolean;
  
  // Alerts
  deadStockAlert: boolean;
  lowStockAlert: boolean;
  creditAlert: boolean;
  
  // Support
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
  apiAccess: boolean;
  
  // Advanced
  multiBranch: boolean;
  advancedInventory: boolean;
  customReports: boolean;
}

// ============================================================
// PLAN DEFINITIONS
// ============================================================

export const PRICING_PLANS: PricingPlan[] = [
  // 🟢 FREE TIER
  {
    id: 'free',
    name: 'FREE',
    nameBn: 'ফ্রি',
    price: 0,
    priceDisplay: '৳0',
    priceDisplayBn: '৳০',
    description: 'Hook tier for getting started',
    descriptionBn: 'শুরু করার জন্য হুক টিয়ার',
    targetAudience: 'Personal use or testing',
    targetAudienceBn: 'ব্যক্তিগত ব্যবহার বা পরীক্ষার জন্য',
    limits: {
      staffLimit: 1,
      branchLimit: 1,
      itemsLimit: 100,
      aiChatsPerDay: 3,
      aiDailySummary: false,
      aiForecasting: false,
      aiSmartReorder: false,
      aiGrowthInsights: false,
      healthScore: false,
      profitAnalytics: false,
      cashFlowForecast: false,
      staffPerformance: false,
      exportCSV: false,
      exportExcel: false,
      exportPDF: false,
      deadStockAlert: false,
      lowStockAlert: false,
      creditAlert: false,
      supportLevel: 'community',
      apiAccess: false,
      multiBranch: false,
      advancedInventory: false,
      customReports: false,
    },
    features: [
      { name: 'Up to 100 items', nameBn: '১০০ পণ্য পর্যন্ত', included: true, limit: 100 },
      { name: '1 staff member', nameBn: '১ জন স্টাফ', included: true, limit: 1 },
      { name: '1 branch', nameBn: '১টি শাখা', included: true, limit: 1 },
      { name: 'Basic sales tracking', nameBn: 'বেসিক সেলস ট্র্যাকিং', included: true },
      { name: 'Credit tracking', nameBn: 'ক্রেডিট ট্র্যাকিং', included: true },
      { name: 'AI assistant', nameBn: 'AI সহকারী', included: true, limit: 3, description: '3 chats/day', descriptionBn: '৩ চ্যাট/দিন' },
      { name: 'Export reports', nameBn: 'রিপোর্ট এক্সপোর্ট', included: false },
      { name: 'Health score', nameBn: 'হেলথ স্কোর', included: false },
      { name: 'Analytics dashboard', nameBn: 'অ্যানালিটিক্স ড্যাশবোর্ড', included: false },
    ],
  },

  // 🔵 STARTER TIER
  {
    id: 'starter',
    name: 'STARTER',
    nameBn: 'স্টার্টার',
    price: 199,
    priceDisplay: '৳199/month',
    priceDisplayBn: '৳১৯৯/মাস',
    description: 'Perfect for micro shops',
    descriptionBn: 'মাইক্রো শপের জন্য উপযুক্ত',
    badge: 'Popular',
    badgeBn: 'জনপ্রিয়',
    targetAudience: 'Micro shops & small traders',
    targetAudienceBn: 'মাইক্রো শপ ও ছোট ব্যবসায়ী',
    limits: {
      staffLimit: 2,
      branchLimit: 1,
      itemsLimit: 'unlimited',
      aiChatsPerDay: 15,
      aiDailySummary: false,
      aiForecasting: false,
      aiSmartReorder: false,
      aiGrowthInsights: false,
      healthScore: false,
      profitAnalytics: false,
      cashFlowForecast: false,
      staffPerformance: false,
      exportCSV: true,
      exportExcel: false,
      exportPDF: false,
      deadStockAlert: true,
      lowStockAlert: true,
      creditAlert: true,
      supportLevel: 'email',
      apiAccess: false,
      multiBranch: false,
      advancedInventory: false,
      customReports: false,
    },
    features: [
      { name: 'Unlimited items', nameBn: 'অসীমিত পণ্য', included: true, limit: 'unlimited' },
      { name: '2 staff members', nameBn: '২ জন স্টাফ', included: true, limit: 2 },
      { name: '1 branch', nameBn: '১টি শাখা', included: true, limit: 1 },
      { name: 'Credit tracking', nameBn: 'ক্রেডিট ট্র্যাকিং', included: true },
      { name: 'Basic reports', nameBn: 'বেসিক রিপোর্ট', included: true },
      { name: 'AI assistant', nameBn: 'AI সহকারী', included: true, limit: 15, description: '15 chats/day', descriptionBn: '১৫ চ্যাট/দিন' },
      { name: 'Export to CSV', nameBn: 'CSV এক্সপোর্ট', included: true },
      { name: 'Dead stock alert', nameBn: 'ডেড স্টক এলার্ট', included: true },
      { name: 'Low stock alert', nameBn: 'লো স্টক এলার্ট', included: true },
      { name: 'Email support', nameBn: 'ইমেইল সাপোর্ট', included: true },
      { name: 'Health score', nameBn: 'হেলথ স্কোর', included: false },
      { name: 'Excel export', nameBn: 'এক্সেল এক্সপোর্ট', included: false },
    ],
  },

  // 🟣 GROWTH TIER
  {
    id: 'growth',
    name: 'GROWTH',
    nameBn: 'গ্রোথ',
    price: 499,
    priceDisplay: '৳499/month',
    priceDisplayBn: '৳৪৯৯/মাস',
    description: 'Core revenue engine for growing SMEs',
    descriptionBn: 'গ্রোয়িং SME-এর জন্য মূল রেভিনিউ ইঞ্জিন',
    highlight: true,
    badge: 'Best Value',
    badgeBn: 'সেরা মূল্য',
    targetAudience: 'Growing small & medium enterprises',
    targetAudienceBn: 'গ্রোয়িং ছোট ও মাঝারি উদ্যোগ',
    limits: {
      staffLimit: 5,
      branchLimit: 3,
      itemsLimit: 'unlimited',
      aiChatsPerDay: 50,
      aiDailySummary: true,
      aiForecasting: true,
      aiSmartReorder: false,
      aiGrowthInsights: false,
      healthScore: true,
      profitAnalytics: true,
      cashFlowForecast: false,
      staffPerformance: true,
      exportCSV: true,
      exportExcel: true,
      exportPDF: true,
      deadStockAlert: true,
      lowStockAlert: true,
      creditAlert: true,
      supportLevel: 'priority',
      apiAccess: false,
      multiBranch: true,
      advancedInventory: true,
      customReports: false,
    },
    features: [
      { name: 'Unlimited items', nameBn: 'অসীমিত পণ্য', included: true, limit: 'unlimited' },
      { name: '5 staff members', nameBn: '৫ জন স্টাফ', included: true, limit: 5 },
      { name: '3 branches', nameBn: '৩টি শাখা', included: true, limit: 3 },
      { name: 'Multi-branch sync', nameBn: 'মাল্টি-ব্রাঞ্চ সিঙ্ক', included: true },
      { name: 'Advanced inventory', nameBn: 'অ্যাডভান্সড ইনভেন্টরি', included: true },
      { name: 'Staff performance tracking', nameBn: 'স্টাফ পারফরম্যান্স ট্র্যাকিং', included: true },
      { name: 'AI assistant', nameBn: 'AI সহকারী', included: true, limit: 50, description: '50 chats/day', descriptionBn: '৫০ চ্যাট/দিন' },
      { name: 'AI daily summary', nameBn: 'AI দৈনিক সারাংশ', included: true },
      { name: 'Basic forecasting', nameBn: 'বেসিক ফোরকাস্টিং', included: true },
      { name: 'Health score', nameBn: 'হেলথ স্কোর', included: true },
      { name: 'Profit analytics', nameBn: 'প্রফিট অ্যানালিটিক্স', included: true },
      { name: 'Export CSV/Excel/PDF', nameBn: 'CSV/Excel/PDF এক্সপোর্ট', included: true },
      { name: 'Priority support', nameBn: 'প্রায়োরিটি সাপোর্ট', included: true },
      { name: 'Smart reorder', nameBn: 'স্মার্ট রিঅর্ডার', included: false },
      { name: 'API access', nameBn: 'API অ্যাক্সেস', included: false },
    ],
  },

  // 🔴 INTELLIGENCE TIER
  {
    id: 'intelligence',
    name: 'INTELLIGENCE',
    nameBn: 'ইন্টেলিজেন্স',
    price: 999,
    priceDisplay: '৳999/month',
    priceDisplayBn: '৳৯৯৯/মাস',
    description: 'High-margin tier for serious businesses',
    descriptionBn: 'সিরিয়াস বিজনেসের জন্য হাই-মার্জিন টিয়ার',
    badge: 'Premium',
    badgeBn: 'প্রিমিয়াম',
    targetAudience: 'Serious businesses needing full power',
    targetAudienceBn: 'পূর্ণ শক্তি প্রয়োজন সিরিয়াস ব্যবসা',
    limits: {
      staffLimit: 'unlimited',
      branchLimit: 'unlimited',
      itemsLimit: 'unlimited',
      aiChatsPerDay: 'unlimited',
      aiDailySummary: true,
      aiForecasting: true,
      aiSmartReorder: true,
      aiGrowthInsights: true,
      healthScore: true,
      profitAnalytics: true,
      cashFlowForecast: true,
      staffPerformance: true,
      exportCSV: true,
      exportExcel: true,
      exportPDF: true,
      deadStockAlert: true,
      lowStockAlert: true,
      creditAlert: true,
      supportLevel: 'dedicated',
      apiAccess: true,
      multiBranch: true,
      advancedInventory: true,
      customReports: true,
    },
    features: [
      { name: 'Unlimited items', nameBn: 'অসীমিত পণ্য', included: true, limit: 'unlimited' },
      { name: 'Unlimited staff', nameBn: 'অসীমিত স্টাফ', included: true, limit: 'unlimited' },
      { name: 'Unlimited branches', nameBn: 'অসীমিত শাখা', included: true, limit: 'unlimited' },
      { name: 'Advanced AI forecasting', nameBn: 'অ্যাডভান্সড AI ফোরকাস্টিং', included: true },
      { name: 'Smart reorder', nameBn: 'স্মার্ট রিঅর্ডার', included: true },
      { name: 'Profit analytics', nameBn: 'প্রফিট অ্যানালিটিক্স', included: true },
      { name: 'Cash flow forecast', nameBn: 'ক্যাশ ফ্লো ফোরকাস্ট', included: true },
      { name: 'Growth insights', nameBn: 'গ্রোথ ইনসাইটস', included: true },
      { name: 'AI assistant', nameBn: 'AI সহকারী', included: true, limit: 'unlimited', description: 'Unlimited', descriptionBn: 'অসীমিত' },
      { name: 'API access', nameBn: 'API অ্যাক্সেস', included: true },
      { name: 'Custom reports', nameBn: 'কাস্টম রিপোর্ট', included: true },
      { name: 'Dedicated support', nameBn: 'ডেডিকেটেড সাপোর্ট', included: true },
      { name: 'Everything in Growth', nameBn: 'গ্রোথ-এর সব ফিচার', included: true },
    ],
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getPlanById(planId: PlanId): PricingPlan | undefined {
  return PRICING_PLANS.find(p => p.id === planId);
}

export function getPlanLimits(planId: PlanId): PlanLimits {
  const plan = getPlanById(planId);
  return plan?.limits ?? PRICING_PLANS[0].limits;
}

export function isFeatureAvailable(planId: PlanId, feature: keyof PlanLimits): boolean {
  const limits = getPlanLimits(planId);
  const value = limits[feature];
  
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (value === 'unlimited') return true;
  
  return false;
}

export function getFeatureLimit(planId: PlanId, feature: keyof PlanLimits): number | 'unlimited' | boolean {
  const limits = getPlanLimits(planId);
  return limits[feature];
}

export function canAddMore(
  planId: PlanId,
  feature: 'staffLimit' | 'branchLimit' | 'itemsLimit',
  currentCount: number
): boolean {
  const limit = getPlanLimits(planId)[feature];
  if (limit === 'unlimited') return true;
  return currentCount < limit;
}

export function isPlanUpgrade(currentPlan: PlanId, newPlan: PlanId): boolean {
  const planOrder: PlanId[] = ['free', 'starter', 'growth', 'intelligence'];
  return planOrder.indexOf(newPlan) > planOrder.indexOf(currentPlan);
}

// ============================================================
// PLAN COMPARISON DATA
// ============================================================

export const FEATURE_CATEGORIES = [
  {
    id: 'staff',
    name: 'Staff & Branches',
    nameBn: 'স্টাফ ও শাখা',
    features: ['staffLimit', 'branchLimit'] as const,
  },
  {
    id: 'inventory',
    name: 'Inventory',
    nameBn: 'ইনভেন্টরি',
    features: ['itemsLimit', 'advancedInventory'] as const,
  },
  {
    id: 'ai',
    name: 'AI Features',
    nameBn: 'AI ফিচার',
    features: ['aiChatsPerDay', 'aiDailySummary', 'aiForecasting', 'aiSmartReorder', 'aiGrowthInsights'] as const,
  },
  {
    id: 'analytics',
    name: 'Analytics',
    nameBn: 'অ্যানালিটিক্স',
    features: ['healthScore', 'profitAnalytics', 'cashFlowForecast', 'staffPerformance'] as const,
  },
  {
    id: 'export',
    name: 'Export',
    nameBn: 'এক্সপোর্ট',
    features: ['exportCSV', 'exportExcel', 'exportPDF'] as const,
  },
  {
    id: 'alerts',
    name: 'Alerts',
    nameBn: 'এলার্ট',
    features: ['deadStockAlert', 'lowStockAlert', 'creditAlert'] as const,
  },
  {
    id: 'support',
    name: 'Support & Access',
    nameBn: 'সাপোর্ট ও অ্যাক্সেস',
    features: ['supportLevel', 'apiAccess'] as const,
  },
];
