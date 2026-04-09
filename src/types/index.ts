// Hello Khata OS - Type Definitions
// হ্যালো খাতা - টাইপ ডেফিনিশন

// ============================================
// User & Authentication Types
// ============================================

export type UserRole = 'owner' | 'manager' | 'staff';
export type PlanType = 'free' | 'starter' | 'growth' | 'intelligence';

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: UserRole;
  businessId: string;
  branchId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: User;
  token: string;
  business: Business;
  branch?: Branch;
  plan: PlanType;
  features: FeatureFlags;
}

export interface FeatureFlags {
  aiAssistant: boolean;
  multiStaff: boolean;
  advancedReports: boolean;
  dataExport: boolean;
  unlimitedItems: boolean;
  unlimitedParties: boolean;
  multiBranch: boolean;
  creditControl: boolean;
  auditTrail: boolean;
  advancedPricing: boolean;
  healthScore: boolean;
  reconciliation: boolean;
  staffPerformance: boolean;
  deadStockAnalysis: boolean;
  globalSearch: boolean;
}

// ============================================
// Business Types
// ============================================

export type BusinessType =
  | 'retail'
  | 'wholesale'
  | 'restaurant'
  | 'grocery'
  | 'pharmacy'
  | 'electronics'
  | 'clothing'
  | 'hardware'
  | 'services'
  | 'other';

export interface Business {
  id: string;
  name: string;
  nameBn?: string;
  type: BusinessType;
  phone: string;
  email?: string;
  address?: string;
  logo?: string;
  currency: string;
  timezone: string;
  language: 'bn' | 'en';
  openingCash?: number;
  openingReceivable?: number;
  openingPayable?: number;
  isActive: boolean;
  hasMultipleBranches: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Branch Types (NEW - Multi-Branch)
// ============================================

export type BranchType = 'main' | 'warehouse' | 'retail' | 'wholesale';

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  nameBn?: string;
  type: BranchType;
  address?: string;
  phone?: string;
  managerId?: string;
  isActive: boolean;
  isMain: boolean;
  openingCash?: number;
  currentCash?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BranchStats {
  branchId: string;
  todaySales: number;
  todayExpenses: number;
  todayProfit: number;
  totalStock: number;
  stockValue: number;
  activeParties: number;
  pendingPayments: number;
}

// ============================================
// Staff Types
// ============================================

export interface Staff {
  id: string;
  businessId: string;
  branchId?: string;
  userId: string;
  name: string;
  phone: string;
  role: UserRole;
  permissions: Permission[];
  salary?: number;
  commission?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  module: 'sales' | 'inventory' | 'parties' | 'expenses' | 'reports' | 'settings' | 'branches' | 'staff';
  actions: ('view' | 'create' | 'edit' | 'delete')[];
}

// Staff Performance (NEW)
export interface StaffPerformance {
  staffId: string;
  staffName: string;
  branchId?: string;
  period: string;
  totalSales: number;
  totalTransactions: number;
  totalProfit: number;
  averageSaleValue: number;
  commission: number;
  salesGrowth: number;
  rank: number;
}

// ============================================
// Party (Customer/Supplier) Types
// ============================================

export type PartyType = 'customer' | 'supplier' | 'both';
export type CustomerTier = 'regular' | 'wholesale' | 'vip' | 'premium';

export interface Party {
  id: string;
  businessId: string;
  branchId?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  type: PartyType;
  customerTier?: CustomerTier;
  openingBalance: number;
  currentBalance: number;
  creditLimit?: number;
  paymentTerms?: number; // days
  notes?: string;
  isActive: boolean;
  riskLevel?: 'low' | 'medium' | 'high';
  riskScore?: number; // 0-100
  // Credit Control (NEW)
  agingBuckets?: AgingBuckets;
  lastPaymentDate?: Date;
  lastTransactionDate?: Date;
  totalPurchases?: number;
  totalPayments?: number;
  averagePaymentDays?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Credit Aging Buckets (NEW)
export interface AgingBuckets {
  bucket0_30: number; // 0-30 days
  bucket31_60: number; // 31-60 days
  bucket61_90: number; // 61-90 days
  bucket90Plus: number; // 90+ days
}

export interface PartyLedgerEntry {
  id: string;
  businessId: string;
  branchId?: string;
  partyId: string;
  type: 'sale' | 'payment' | 'purchase' | 'adjustment' | 'opening';
  referenceId?: string;
  referenceType?: 'sale' | 'payment' | 'purchase';
  amount: number;
  balance: number;
  description: string;
  date: Date;
  createdAt: Date;
}

// ============================================
// Inventory Types
// ============================================

export interface Category {
  id: string;
  businessId: string;
  name: string;
  nameBn?: string;
  description?: string;
  parentId?: string;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Advanced Pricing (NEW)
export interface PriceTier {
  name: string;
  nameBn?: string;
  multiplier: number; // e.g., 1.0 for retail, 0.9 for wholesale
  minQuantity?: number;
}

export interface ItemPricing {
  costPrice: number;
  retailPrice: number;
  wholesalePrice?: number;
  vipPrice?: number;
  minimumPrice?: number;
  customerSpecificPrices?: CustomerSpecificPrice[];
}

export interface CustomerSpecificPrice {
  partyId: string;
  price: number;
  validFrom?: Date;
  validTo?: Date;
}

export interface Item {
  id: string;
  businessId: string;
  branchId?: string;
  categoryId?: string;
  name: string;
  nameBn?: string;
  sku?: string;
  barcode?: string;
  description?: string;
  unit: string;
  // Pricing
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  vipPrice?: number;
  minimumPrice?: number;
  pricing?: ItemPricing;
  // Stock
  currentStock: number;
  minStock: number;
  maxStock?: number;
  supplierId?: string;
  imageUrl?: string;
  margin: number;
  isActive: boolean;
  // Analytics (NEW)
  totalSold?: number;
  totalPurchased?: number;
  lastPurchaseDate?: Date;
  lastSaleDate?: Date;
  lastSoldDate?: Date;
  stockTurnoverRate?: number;
  daysWithoutSale?: number;
  deadStockAlert?: boolean;
  demandForecast?: DemandForecast;
  createdAt: Date;
  updatedAt: Date;
}

// Dead Stock & Forecast (NEW)
export interface DemandForecast {
  itemId: string;
  predictedDemand: number;
  confidence: number; // 0-1
  trend: 'increasing' | 'stable' | 'decreasing';
  suggestedOrderQuantity?: number;
  lastUpdated: Date;
}

export interface DeadStockItem {
  itemId: string;
  itemName: string;
  currentStock: number;
  stockValue: number;
  daysWithoutSale: number;
  lastSaleDate?: Date;
  turnoverRate: number;
  suggestedAction: 'discount' | 'return' | 'donate' | 'write_off';
  priority: 'low' | 'medium' | 'high';
}

export interface StockMovement {
  id: string;
  businessId: string;
  branchId?: string;
  itemId: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'damage' | 'transfer';
  quantity: number;
  previousStock: number;
  newStock: number;
  fromBranchId?: string;
  toBranchId?: string;
  referenceId?: string;
  referenceType?: 'sale' | 'purchase' | 'adjustment' | 'transfer';
  reason?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

// ============================================
// Sales Types
// ============================================

export type PaymentMethod = 'cash' | 'card' | 'mobile_banking' | 'credit';
export type SaleStatus = 'completed' | 'pending' | 'cancelled' | 'returned';
export type PricingTier = 'retail' | 'wholesale' | 'vip' | 'custom';

export interface Sale {
  id: string;
  businessId: string;
  branchId?: string;
  invoiceNo: string;
  partyId?: string;
  party?: {
    id: string;
    name: string;
    phone: string;
    type: string;
  };
  partyName?: string;
  partyPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  pricingTier?: PricingTier | null;
  status: SaleStatus;
  profit: number;
  notes?: string | null;
  createdBy: string;
  staffId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
export interface SaleItem {
  id: string;
  saleId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
  total: number;
  profit: number;
  createdAt: Date;
  item: {
    id: string;
    name: string;
    sku: string;
  };
}

// ============================================
// Purchase Types
// ============================================

export type PurchaseStatus = 'received' | 'pending' | 'partial' | 'cancelled';

export interface Purchase {
  id: string;
  businessId: string;
  branchId?: string;
  supplierId?: string;
  invoiceNo?: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  status: PurchaseStatus;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  total: number;
  createdAt: Date;
}

// ============================================
// Payment Types
// ============================================

export type PaymentType = 'received' | 'paid';
export type PaymentMode = 'cash' | 'card' | 'mobile_banking' | 'bank_transfer' | 'cheque';

export interface Payment {
  id: string;
  businessId: string;
  branchId?: string;
  partyId: string;
  type: PaymentType;
  mode: PaymentMode;
  accountId?: string; // NEW: link to account
  amount: number;
  reference?: string;
  saleId?: string;
  purchaseId?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

// ============================================
// Account & Reconciliation Types (NEW)
// ============================================

export type AccountType = 'cash' | 'bank' | 'mobile_wallet' | 'credit_card';
export type AccountStatus = 'active' | 'inactive' | 'frozen';

export interface Account {
  id: string;
  businessId: string;
  branchId?: string;
  name: string;
  nameBn?: string;
  type: AccountType;
  accountNumber?: string;
  bankName?: string;
  mobileNumber?: string;
  currentBalance: number;
  openingBalance: number;
  currency: string;
  status: AccountStatus;
  isDefault: boolean;
  lastReconciledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountTransaction {
  id: string;
  businessId: string;
  branchId?: string;
  accountId: string;
  type: 'credit' | 'debit';
  amount: number;
  balance: number;
  reference?: string;
  referenceType?: 'sale' | 'purchase' | 'payment' | 'transfer' | 'adjustment';
  referenceId?: string;
  description: string;
  date: Date;
  reconciled: boolean;
  reconciledAt?: Date;
  createdAt: Date;
}

export interface AccountTransfer {
  id: string;
  businessId: string;
  branchId?: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  reference?: string;
  notes?: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: Date;
}

export interface ReconciliationRecord {
  id: string;
  businessId: string;
  branchId?: string;
  accountId: string;
  statementBalance: number;
  systemBalance: number;
  difference: number;
  status: 'matched' | 'mismatch' | 'pending';
  notes?: string;
  reconciledBy: string;
  reconciledAt: Date;
  createdAt: Date;
}

// ============================================
// Expense Types
// ============================================

export interface ExpenseCategory {
  id: string;
  businessId: string;
  name: string;
  nameBn?: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  businessId: string;
  branchId?: string;
  categoryId: string;
  accountId?: string;
  amount: number;
  description: string;
  date: Date;
  receipt?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Audit Trail Types (NEW)
// ============================================

export type AuditAction = 'create' | 'update' | 'delete' | 'view' | 'export' | 'login' | 'logout';
export type AuditEntity = 'sale' | 'item' | 'party' | 'payment' | 'expense' | 'user' | 'branch' | 'account' | 'settings';

export interface AuditLog {
  id: string;
  businessId: string;
  branchId?: string;
  userId: string;
  userName: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  entityName?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  changes?: FieldChange[];
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
  createdAt: Date;
}

export interface FieldChange {
  field: string;
  fieldLabel: string;
  oldValue: unknown;
  newValue: unknown;
}

// ============================================
// Business Health Score Types (NEW)
// ============================================

export interface BusinessHealthScore {
  businessId: string;
  branchId?: string;
  overallScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  components: HealthScoreComponents;
  trend: 'improving' | 'stable' | 'declining';
  lastCalculated: Date;
  suggestions: HealthSuggestion[];
}

export interface HealthScoreComponents {
  profitTrend: {
    score: number;
    value: number;
    trend: 'up' | 'down' | 'stable';
    weight: number;
  };
  creditRisk: {
    score: number;
    value: number; // percentage of overdue
    trend: 'up' | 'down' | 'stable';
    weight: number;
  };
  deadStock: {
    score: number;
    value: number; // percentage of dead stock
    trend: 'up' | 'down' | 'stable';
    weight: number;
  };
  cashStability: {
    score: number;
    value: number; // cash flow stability ratio
    trend: 'up' | 'down' | 'stable';
    weight: number;
  };
  salesConsistency: {
    score: number;
    value: number; // sales variance
    trend: 'up' | 'down' | 'stable';
    weight: number;
  };
}

export interface HealthSuggestion {
  id: string;
  component: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  action: string;
  actionUrl?: string;
  potentialImpact: number; // estimated score improvement
}

// ============================================
// Report Types
// ============================================

export interface DashboardStats {
  todaySales: number;
  todayExpenses: number;
  todayProfit: number;
  receivable: number;
  payable: number;
  totalStock: number;
  stockValue: number;
  lowStockItems: number;
  activeParties: number;
  pendingPayments: number;
  salesGrowth: number;
  expenseGrowth: number;
  // NEW
  cashBalance?: number;
  bankBalance?: number;
  creditOverdue?: number;
  deadStockValue?: number;
}

export interface DailySales {
  date: string;
  sales: number;
  expenses: number;
  profit: number;
  transactions: number;
}

export interface PartySummary {
  totalCustomers: number;
  totalSuppliers: number;
  totalReceivable: number;
  totalPayable: number;
  overdueReceivable: number;
  overduePayable: number;
  highRiskParties: number;
  // NEW
  creditLimitUsage?: number;
  averageAging?: number;
}

export interface InventorySummary {
  totalItems: number;
  totalStock: number;
  stockValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  overStockItems: number;
  topSellingItems: Item[];
  slowMovingItems: Item[];
  // NEW
  deadStockItems?: number;
  deadStockValue?: number;
  averageTurnover?: number;
}

export interface ProfitLoss {
  period: string;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  margin: number;
}

// Credit Aging Report (NEW)
export interface CreditAgingReport {
  partyId: string;
  partyName: string;
  totalOutstanding: number;
  agingBuckets: AgingBuckets;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  creditLimit?: number;
  creditUtilization: number; // percentage
  lastPaymentDate?: Date;
  suggestedAction?: string;
}

// ============================================
// AI Types
// ============================================

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AiInsight {
  id: string;
  type: 'alert' | 'suggestion' | 'achievement';
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  icon: string;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionLabel?: string;
  createdAt: Date;
}

// ============================================
// Global Search Types (NEW)
// ============================================

export type SearchEntityType = 'item' | 'party' | 'sale' | 'expense' | 'account';

export interface SearchResult {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  icon: string;
  metadata?: Record<string, unknown>;
  score: number; // relevance score
}

export interface GlobalSearchResponse {
  query: string;
  results: SearchResult[];
  groupedResults: Record<SearchEntityType, SearchResult[]>;
  totalResults: number;
  searchTime: number;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  messageBn?: string;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================
// Offline Queue Types
// ============================================

export interface QueuedMutation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: Record<string, unknown>;
  timestamp: Date;
  retries: number;
  status: 'pending' | 'syncing' | 'failed';
}

// ============================================
// Form Types
// ============================================

export interface SaleFormData {
  partyId?: string;
  branchId?: string;
  items: {
    itemId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  }[];
  discount: number;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  pricingTier?: PricingTier;
  notes?: string;
}

export interface PartyFormData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  type: PartyType;
  customerTier?: CustomerTier;
  openingBalance: number;
  creditLimit?: number;
  paymentTerms?: number;
  notes?: string;
}

export interface ItemFormData {
  name: string;
  categoryId?: string;
  sku?: string;
  barcode?: string;
  description?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  vipPrice?: number;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  supplierId?: string;
}

export interface ExpenseFormData {
  categoryId: string;
  accountId?: string;
  amount: number;
  description: string;
  date: string;
  receipt?: string;
}

export interface BranchFormData {
  name: string;
  type: BranchType;
  address?: string;
  phone?: string;
  managerId?: string;
  openingCash?: number;
}

export interface AccountFormData {
  name: string;
  type: AccountType;
  accountNumber?: string;
  bankName?: string;
  mobileNumber?: string;
  openingBalance: number;
  currency?: string;
}

// ============================================
// Filter Types
// ============================================

export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

export interface BranchFilter {
  branchId?: string;
  includeAllBranches?: boolean;
}

export interface SalesFilter extends DateRangeFilter, BranchFilter {
  partyId?: string;
  status?: SaleStatus;
  paymentMethod?: PaymentMethod;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  staffId?: string;
}

export interface PartiesFilter {
  type?: PartyType;
  hasOutstanding?: boolean;
  riskLevel?: 'low' | 'medium' | 'high';
  customerTier?: CustomerTier;
  branchId?: string;
  search?: string;
}

export interface ItemsFilter extends BranchFilter {
  categoryId?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
  deadStock?: boolean;
  search?: string;
}

export interface AuditLogFilter extends DateRangeFilter, BranchFilter {
  userId?: string;
  action?: AuditAction;
  entity?: AuditEntity;
  entityId?: string;
}

export interface CreditAgingFilter extends BranchFilter {
  minOutstanding?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  customerTier?: CustomerTier;
  overdueOnly?: boolean;
}

// ============================================
// Feature Gate Types (NEW)
// ============================================

export type FeatureName =
  | 'multiBranch'
  | 'creditControl'
  | 'auditTrail'
  | 'advancedPricing'
  | 'healthScore'
  | 'reconciliation'
  | 'staffPerformance'
  | 'deadStockAnalysis'
  | 'globalSearch'
  | 'aiAssistant'
  | 'dataExport'
  | 'advancedReports';

export interface FeatureGateConfig {
  feature: FeatureName;
  requiredPlan: PlanType[];
  isUnlocked: boolean;
  upgradeMessage: string;
  upgradeMessageBn: string;
  showBlur?: boolean;
}

export const PLAN_FEATURES: Record<PlanType, FeatureName[]> = {
  free: ['globalSearch'],
  starter: ['globalSearch', 'dataExport'],
  growth: ['globalSearch', 'multiBranch', 'creditControl', 'reconciliation', 'staffPerformance', 'healthScore', 'deadStockAnalysis', 'dataExport', 'advancedReports', 'aiAssistant'],
  intelligence: ['globalSearch', 'multiBranch', 'creditControl', 'reconciliation', 'staffPerformance', 'auditTrail', 'advancedPricing', 'healthScore', 'deadStockAnalysis', 'dataExport', 'advancedReports', 'aiAssistant'],
};
