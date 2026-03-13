// Hello Khata OS - Extended Mock API
// হ্যালো খাতা - এক্সটেন্ডেড মক এপিআই

import type {
  Branch,
  BranchStats,
  Account,
  AccountTransaction,
  AccountTransfer,
  AuditLog,
  BusinessHealthScore,
  HealthScoreComponents,
  HealthSuggestion,
  CreditAgingReport,
  DeadStockItem,
  StaffPerformance,
  SearchResult,
  GlobalSearchResponse,
  DashboardStats,
  AgingBuckets,
} from '@/types';

// Helper to generate random ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Simulate network delay
const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// Mock Branches
// ============================================

const mockBranches: Branch[] = [
  {
    id: 'branch-1',
    businessId: 'business-1',
    name: 'Main Branch',
    nameBn: 'প্রধান শাখা',
    type: 'main',
    address: 'ঢাকা, মিরপুর-১০',
    phone: '01712345678',
    managerId: 'user-1',
    isActive: true,
    isMain: true,
    openingCash: 50000,
    currentCash: 75500,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'branch-2',
    businessId: 'business-1',
    name: 'Dhanmondi Branch',
    nameBn: 'ধানমন্ডি শাখা',
    type: 'retail',
    address: 'ঢাকা, ধানমন্ডি',
    phone: '01712345679',
    managerId: 'user-2',
    isActive: true,
    isMain: false,
    openingCash: 30000,
    currentCash: 42500,
    createdAt: new Date('2024-06-15'),
    updatedAt: new Date(),
  },
  {
    id: 'branch-3',
    businessId: 'business-1',
    name: 'Warehouse',
    nameBn: 'গোডাউন',
    type: 'warehouse',
    address: 'ঢাকা, কারওয়ান বাজার',
    phone: '01712345680',
    isActive: true,
    isMain: false,
    openingCash: 10000,
    currentCash: 15000,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date(),
  },
];

const mockBranchStats: Record<string, BranchStats> = {
  'branch-1': {
    branchId: 'branch-1',
    todaySales: 45680,
    todayExpenses: 8500,
    todayProfit: 12130,
    totalStock: 850,
    stockValue: 325000,
    activeParties: 32,
    pendingPayments: 5,
  },
  'branch-2': {
    branchId: 'branch-2',
    todaySales: 28500,
    todayExpenses: 4000,
    todayProfit: 7100,
    totalStock: 400,
    stockValue: 160000,
    activeParties: 13,
    pendingPayments: 3,
  },
  'branch-3': {
    branchId: 'branch-3',
    todaySales: 0,
    todayExpenses: 0,
    todayProfit: 0,
    totalStock: 2500,
    stockValue: 850000,
    activeParties: 0,
    pendingPayments: 0,
  },
};

// ============================================
// Mock Accounts
// ============================================

const mockAccounts: Account[] = [
  {
    id: 'acc-1',
    businessId: 'business-1',
    name: 'Main Cash',
    nameBn: 'প্রধান ক্যাশ',
    type: 'cash',
    currentBalance: 75500,
    openingBalance: 50000,
    currency: 'BDT',
    status: 'active',
    isDefault: true,
    lastReconciledAt: new Date('2024-12-18'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'acc-2',
    businessId: 'business-1',
    name: 'bKash',
    nameBn: 'বিকাশ',
    type: 'mobile_wallet',
    mobileNumber: '01712345678',
    currentBalance: 28500,
    openingBalance: 10000,
    currency: 'BDT',
    status: 'active',
    isDefault: false,
    lastReconciledAt: new Date('2024-12-17'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: 'acc-3',
    businessId: 'business-1',
    name: 'Nagad',
    nameBn: 'নগদ',
    type: 'mobile_wallet',
    mobileNumber: '01812345678',
    currentBalance: 12000,
    openingBalance: 5000,
    currency: 'BDT',
    status: 'active',
    isDefault: false,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date(),
  },
  {
    id: 'acc-4',
    businessId: 'business-1',
    name: 'Dutch Bangla Bank',
    nameBn: 'ডাচ বাংলা ব্যাংক',
    type: 'bank',
    accountNumber: '1234567890',
    bankName: 'Dutch Bangla Bank',
    currentBalance: 125000,
    openingBalance: 100000,
    currency: 'BDT',
    status: 'active',
    isDefault: false,
    lastReconciledAt: new Date('2024-12-15'),
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
  },
];

const mockAccountTransactions: AccountTransaction[] = [
  {
    id: 'txn-1',
    businessId: 'business-1',
    accountId: 'acc-1',
    type: 'credit',
    amount: 4500,
    balance: 75500,
    reference: 'INV-001',
    referenceType: 'sale',
    description: 'বিক্রি থেকে আয়',
    date: new Date('2024-12-19'),
    reconciled: true,
    reconciledAt: new Date('2024-12-19'),
    createdAt: new Date(),
  },
  {
    id: 'txn-2',
    businessId: 'business-1',
    accountId: 'acc-2',
    type: 'credit',
    amount: 2500,
    balance: 28500,
    reference: 'INV-003',
    referenceType: 'sale',
    description: 'বিকাশ পেমেন্ট',
    date: new Date('2024-12-19'),
    reconciled: true,
    createdAt: new Date(),
  },
  {
    id: 'txn-3',
    businessId: 'business-1',
    accountId: 'acc-1',
    type: 'debit',
    amount: 15000,
    balance: 71000,
    reference: 'EXP-001',
    referenceType: 'purchase',
    description: 'মালামাল ক্রয়',
    date: new Date('2024-12-18'),
    reconciled: false,
    createdAt: new Date(),
  },
];

// ============================================
// Mock Audit Logs
// ============================================

const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit-1',
    businessId: 'business-1',
    branchId: 'branch-1',
    userId: 'user-1',
    userName: 'আব্দুর রহমান',
    action: 'create',
    entity: 'sale',
    entityId: 'sale-1',
    entityName: 'INV-001',
    newValue: { total: 1475, partyId: 'party-1' },
    createdAt: new Date('2024-12-19T10:30:00'),
  },
  {
    id: 'audit-2',
    businessId: 'business-1',
    branchId: 'branch-1',
    userId: 'user-1',
    userName: 'আব্দুর রহমান',
    action: 'create',
    entity: 'sale',
    entityId: 'sale-2',
    entityName: 'INV-002',
    newValue: { total: 1100, partyId: 'party-2' },
    createdAt: new Date('2024-12-19T14:15:00'),
  },
  {
    id: 'audit-3',
    businessId: 'business-1',
    branchId: 'branch-1',
    userId: 'user-1',
    userName: 'আব্দুর রহমান',
    action: 'update',
    entity: 'party',
    entityId: 'party-1',
    entityName: 'করিম হোসেন',
    oldValue: { creditLimit: 25000 },
    newValue: { creditLimit: 30000 },
    changes: [
      { field: 'creditLimit', fieldLabel: 'ক্রেডিট লিমিট', oldValue: 25000, newValue: 30000 },
    ],
    createdAt: new Date('2024-12-18T16:00:00'),
  },
  {
    id: 'audit-4',
    businessId: 'business-1',
    branchId: 'branch-1',
    userId: 'user-1',
    userName: 'আব্দুর রহমান',
    action: 'create',
    entity: 'item',
    entityId: 'item-13',
    entityName: 'মসলা (গোলমরিচ)',
    newValue: { name: 'মসলা (গোলমরিচ)', sellingPrice: 180 },
    createdAt: new Date('2024-12-17T11:30:00'),
  },
  {
    id: 'audit-5',
    businessId: 'business-1',
    branchId: 'branch-1',
    userId: 'user-1',
    userName: 'আব্দুর রহমান',
    action: 'delete',
    entity: 'expense',
    entityId: 'exp-old',
    entityName: 'অপ্রয়োজনীয় খরচ',
    oldValue: { amount: 500, description: 'টেস্ট এন্ট্রি' },
    createdAt: new Date('2024-12-16T09:00:00'),
  },
];

// ============================================
// Mock Health Score
// ============================================

const mockHealthScore: BusinessHealthScore = {
  businessId: 'business-1',
  overallScore: 78,
  grade: 'B',
  trend: 'improving',
  lastCalculated: new Date(),
  components: {
    profitTrend: {
      score: 85,
      value: 12.5,
      trend: 'up',
      weight: 0.25,
    },
    creditRisk: {
      score: 68,
      value: 18.5,
      trend: 'down',
      weight: 0.20,
    },
    deadStock: {
      score: 72,
      value: 8.2,
      trend: 'stable',
      weight: 0.15,
    },
    cashStability: {
      score: 82,
      value: 1.4,
      trend: 'up',
      weight: 0.20,
    },
    salesConsistency: {
      score: 80,
      value: 0.15,
      trend: 'stable',
      weight: 0.20,
    },
  },
  suggestions: [
    {
      id: 'sug-1',
      component: 'creditRisk',
      priority: 'high',
      title: 'Reduce Credit Overdue',
      titleBn: 'বকেয়া কমান',
      description: 'Follow up with 3 customers who have overdue payments totaling ৳35,000',
      descriptionBn: '৩ জন গ্রাহকের ৳৩৫,০০০ বকেয়া রয়েছে। তাদের সাথে যোগাযোগ করুন।',
      action: 'Send payment reminders',
      actionUrl: '/parties?filter=overdue',
      potentialImpact: 8,
    },
    {
      id: 'sug-2',
      component: 'deadStock',
      priority: 'medium',
      title: 'Clear Dead Stock',
      titleBn: 'ডেড স্টক সাফ করুন',
      description: '5 items have not sold in 60+ days. Consider discounting or returning.',
      descriptionBn: '৫টি পণ্য ৬০ দিনের বেশি বিক্রি হয়নি। ডিসকাউন্ট বা ফেরতের কথা ভাবুন।',
      action: 'View dead stock report',
      actionUrl: '/reports/dead-stock',
      potentialImpact: 5,
    },
    {
      id: 'sug-3',
      component: 'profitTrend',
      priority: 'low',
      title: 'Optimize Margins',
      titleBn: 'মার্জিন বাড়ান',
      description: 'Your average margin is 22%. Consider reviewing pricing for low-margin items.',
      descriptionBn: 'আপনার গড় মার্জিন ২২%। কম মার্জিনের পণ্যের দাম পর্যালোচনা করুন।',
      action: 'View margin analysis',
      actionUrl: '/reports/margins',
      potentialImpact: 4,
    },
  ],
};

// ============================================
// Mock Credit Aging
// ============================================

const mockCreditAging: CreditAgingReport[] = [
  {
    partyId: 'party-1',
    partyName: 'করিম হোসেন',
    totalOutstanding: 12500,
    agingBuckets: {
      bucket0_30: 8500,
      bucket31_60: 4000,
      bucket61_90: 0,
      bucket90Plus: 0,
    },
    riskScore: 25,
    riskLevel: 'low',
    creditLimit: 30000,
    creditUtilization: 41.67,
    lastPaymentDate: new Date('2024-12-10'),
    suggestedAction: 'Send friendly reminder',
  },
  {
    partyId: 'party-2',
    partyName: 'ফাতেমা বেগম',
    totalOutstanding: 8500,
    agingBuckets: {
      bucket0_30: 2000,
      bucket31_60: 3500,
      bucket61_90: 3000,
      bucket90Plus: 0,
    },
    riskScore: 55,
    riskLevel: 'medium',
    creditLimit: 20000,
    creditUtilization: 42.5,
    lastPaymentDate: new Date('2024-12-05'),
    suggestedAction: 'Call and discuss payment plan',
  },
  {
    partyId: 'party-4',
    partyName: 'সাইফুল ইসলাম',
    totalOutstanding: 35000,
    agingBuckets: {
      bucket0_30: 5000,
      bucket31_60: 10000,
      bucket61_90: 12000,
      bucket90Plus: 8000,
    },
    riskScore: 82,
    riskLevel: 'high',
    creditLimit: 50000,
    creditUtilization: 70,
    lastPaymentDate: new Date('2024-11-15'),
    suggestedAction: 'Stop credit sales, negotiate settlement',
  },
];

// ============================================
// Mock Dead Stock
// ============================================

const mockDeadStock: DeadStockItem[] = [
  {
    itemId: 'item-12',
    itemName: 'বাল্ব (১০ ওয়াট LED)',
    currentStock: 15,
    stockValue: 1800,
    daysWithoutSale: 75,
    lastSaleDate: new Date('2024-10-05'),
    turnoverRate: 0.3,
    suggestedAction: 'discount',
    priority: 'high',
  },
  {
    itemId: 'item-8',
    itemName: 'শ্যাম্পু (সানসিল্ক)',
    currentStock: 25,
    stockValue: 5500,
    daysWithoutSale: 62,
    lastSaleDate: new Date('2024-10-18'),
    turnoverRate: 0.5,
    suggestedAction: 'discount',
    priority: 'medium',
  },
  {
    itemId: 'item-11',
    itemName: 'টুথপেস্ট (কোলগেট)',
    currentStock: 40,
    stockValue: 3800,
    daysWithoutSale: 45,
    lastSaleDate: new Date('2024-11-04'),
    turnoverRate: 0.8,
    suggestedAction: 'return',
    priority: 'low',
  },
];

// ============================================
// Mock Staff Performance
// ============================================

const mockStaffPerformance: StaffPerformance[] = [
  {
    staffId: 'user-1',
    staffName: 'আব্দুর রহমান',
    branchId: 'branch-1',
    period: 'December 2024',
    totalSales: 485000,
    totalTransactions: 156,
    totalProfit: 78500,
    averageSaleValue: 3109,
    commission: 7850,
    salesGrowth: 15.2,
    rank: 1,
  },
  {
    staffId: 'user-2',
    staffName: 'করিম উদ্দিন',
    branchId: 'branch-2',
    period: 'December 2024',
    totalSales: 285000,
    totalTransactions: 98,
    totalProfit: 42500,
    averageSaleValue: 2908,
    commission: 4250,
    salesGrowth: 8.5,
    rank: 2,
  },
  {
    staffId: 'user-3',
    staffName: 'নাজমুল ইসলাম',
    branchId: 'branch-1',
    period: 'December 2024',
    totalSales: 195000,
    totalTransactions: 72,
    totalProfit: 28500,
    averageSaleValue: 2708,
    commission: 2850,
    salesGrowth: -2.3,
    rank: 3,
  },
];

// ============================================
// Extended Mock API Functions
// ============================================

export const extendedMockApi = {
  // Branch APIs
  async getBranches(): Promise<{ success: boolean; data: Branch[] }> {
    await delay(200);
    return { success: true, data: mockBranches };
  },

  async getBranchStats(branchId: string): Promise<{ success: boolean; data: BranchStats | null }> {
    await delay(150);
    return { success: true, data: mockBranchStats[branchId] || null };
  },

  async getAllBranchesStats(): Promise<{ success: boolean; data: DashboardStats }> {
    await delay(200);
    // Aggregate stats from all branches
    const allStats = Object.values(mockBranchStats);
    return {
      success: true,
      data: {
        todaySales: allStats.reduce((sum, s) => sum + s.todaySales, 0),
        todayExpenses: allStats.reduce((sum, s) => sum + s.todayExpenses, 0),
        todayProfit: allStats.reduce((sum, s) => sum + s.todayProfit, 0),
        receivable: 78500,
        payable: 34500,
        totalStock: allStats.reduce((sum, s) => sum + s.totalStock, 0),
        stockValue: allStats.reduce((sum, s) => sum + s.stockValue, 0),
        lowStockItems: 12,
        activeParties: 45,
        pendingPayments: allStats.reduce((sum, s) => sum + s.pendingPayments, 0),
        salesGrowth: 12.5,
        expenseGrowth: -5.2,
        cashBalance: mockAccounts.filter(a => a.type === 'cash').reduce((sum, a) => sum + a.currentBalance, 0),
        bankBalance: mockAccounts.filter(a => a.type === 'bank' || a.type === 'mobile_wallet').reduce((sum, a) => sum + a.currentBalance, 0),
        creditOverdue: 35000,
        deadStockValue: mockDeadStock.reduce((sum, d) => sum + d.stockValue, 0),
      },
    };
  },

  // Account APIs
  async getAccounts(): Promise<{ success: boolean; data: Account[] }> {
    await delay(200);
    return { success: true, data: mockAccounts };
  },

  async getAccountTransactions(accountId: string): Promise<{ success: boolean; data: AccountTransaction[] }> {
    await delay(200);
    return { success: true, data: mockAccountTransactions.filter(t => t.accountId === accountId) };
  },

  async createAccountTransfer(data: Partial<AccountTransfer>): Promise<{ success: boolean; data: AccountTransfer }> {
    await delay(300);
    const transfer: AccountTransfer = {
      id: generateId(),
      businessId: 'business-1',
      fromAccountId: data.fromAccountId || '',
      toAccountId: data.toAccountId || '',
      amount: data.amount || 0,
      reference: data.reference,
      notes: data.notes,
      status: 'completed',
      createdBy: 'user-1',
      createdAt: new Date(),
    };
    return { success: true, data: transfer };
  },

  // Audit Log APIs
  async getAuditLogs(params?: { 
    userId?: string; 
    entity?: string; 
    entityId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ success: boolean; data: AuditLog[]; meta: { total: number } }> {
    await delay(200);
    let filtered = [...mockAuditLogs];
    
    if (params?.userId) {
      filtered = filtered.filter(l => l.userId === params.userId);
    }
    if (params?.entity) {
      filtered = filtered.filter(l => l.entity === params.entity);
    }
    if (params?.entityId) {
      filtered = filtered.filter(l => l.entityId === params.entityId);
    }
    
    return { success: true, data: filtered, meta: { total: filtered.length } };
  },

  async getEntityAuditLogs(entity: string, entityId: string): Promise<{ success: boolean; data: AuditLog[] }> {
    await delay(150);
    const logs = mockAuditLogs.filter(
      l => l.entity === entity && l.entityId === entityId
    );
    return { success: true, data: logs };
  },

  // Health Score APIs
  async getHealthScore(): Promise<{ success: boolean; data: BusinessHealthScore }> {
    await delay(300);
    return { success: true, data: mockHealthScore };
  },

  async recalculateHealthScore(): Promise<{ success: boolean; data: BusinessHealthScore }> {
    await delay(500);
    // Simulate recalculation with slight variation
    const updatedScore = {
      ...mockHealthScore,
      overallScore: Math.min(100, mockHealthScore.overallScore + Math.floor(Math.random() * 5)),
      lastCalculated: new Date(),
    };
    updatedScore.grade = updatedScore.overallScore >= 90 ? 'A' : 
                        updatedScore.overallScore >= 80 ? 'B' : 
                        updatedScore.overallScore >= 70 ? 'C' : 
                        updatedScore.overallScore >= 60 ? 'D' : 'F';
    return { success: true, data: updatedScore };
  },

  // Credit Control APIs
  async getCreditAgingReport(): Promise<{ success: boolean; data: CreditAgingReport[] }> {
    await delay(300);
    return { success: true, data: mockCreditAging };
  },

  async checkCreditLimit(partyId: string, amount: number): Promise<{ 
    success: boolean; 
    data: { 
      withinLimit: boolean; 
      currentBalance: number; 
      creditLimit: number; 
      utilization: number;
      warning?: string;
    } 
  }> {
    await delay(100);
    const report = mockCreditAging.find(r => r.partyId === partyId);
    if (!report) {
      return { 
        success: true, 
        data: { 
          withinLimit: true, 
          currentBalance: 0, 
          creditLimit: 0,
          utilization: 0,
        } 
      };
    }
    
    const newBalance = report.totalOutstanding + amount;
    const withinLimit = newBalance <= report.creditLimit;
    
    return {
      success: true,
      data: {
        withinLimit,
        currentBalance: report.totalOutstanding,
        creditLimit: report.creditLimit,
        utilization: report.creditUtilization,
        warning: !withinLimit ? `Credit limit exceeded! Current: ৳${report.totalOutstanding}, Limit: ৳${report.creditLimit}` : undefined,
      },
    };
  },

  // Dead Stock APIs
  async getDeadStockReport(): Promise<{ success: boolean; data: DeadStockItem[] }> {
    await delay(300);
    return { success: true, data: mockDeadStock };
  },

  // Staff Performance APIs
  async getStaffPerformance(period?: string): Promise<{ success: boolean; data: StaffPerformance[] }> {
    await delay(250);
    let data = [...mockStaffPerformance];
    if (period) {
      data = data.filter(s => s.period === period);
    }
    return { success: true, data };
  },

  // Global Search API
  async globalSearch(query: string): Promise<{ success: boolean; data: GlobalSearchResponse }> {
    await delay(150);
    
    const results: SearchResult[] = [];
    const searchLower = query.toLowerCase();
    
    // Search in mock data (this would be server-side in production)
    // For demo, we'll return mock results based on query
    
    if (query.length >= 2) {
      // Add some mock search results
      results.push({
        id: 'item-1',
        type: 'item',
        title: 'চাল (মিনিকেট)',
        subtitle: 'খাদ্য পণ্য',
        description: 'স্টক: ২৫০ কেজি | দাম: ৳৭৫/কেজি',
        url: '/inventory?item=item-1',
        icon: 'Package',
        score: 0.95,
      });
      
      results.push({
        id: 'party-1',
        type: 'party',
        title: 'করিম হোসেন',
        subtitle: 'গ্রাহক',
        description: 'বকেয়া: ৳১২,৫০০ | ফোন: ০১৮১২৩৪৫৬৭৮',
        url: '/parties?party=party-1',
        icon: 'User',
        score: 0.85,
      });
      
      if (query.includes('INV') || query.includes('inv')) {
        results.push({
          id: 'sale-1',
          type: 'sale',
          title: 'INV-001',
          subtitle: 'বিক্রি',
          description: '৳১,৪৭৫ | করিম হোসেন | ১৯ ডিসেম্বর',
          url: '/sales?sale=sale-1',
          icon: 'ShoppingCart',
          score: 0.90,
        });
      }
    }
    
    // Group results by type
    const groupedResults = results.reduce((acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    }, {} as Record<string, SearchResult[]>);
    
    return {
      success: true,
      data: {
        query,
        results,
        groupedResults: groupedResults as Record<string, SearchResult[]>,
        totalResults: results.length,
        searchTime: 45,
      },
    };
  },
};

export default extendedMockApi;
