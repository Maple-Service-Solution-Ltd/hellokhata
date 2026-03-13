// Hello Khata OS - API Index
// Real API integration (no mock mode)

import { api } from '../api-client';
import type {
  Session,
  DashboardStats,
  DailySales,
  Party,
  Item,
  Sale,
  Purchase,
  Expense,
  ExpenseCategory,
  Category,
  AiInsight,
  User,
  ApiResponse,
  PaginatedResponse,
  Branch,
  BranchStats,
  Account,
  AccountTransaction,
  AccountTransfer,
  AuditLog,
  BusinessHealthScore,
  CreditAgingReport,
  DeadStockItem,
  StaffPerformance,
  GlobalSearchResponse,
} from '@/types';
import type { Quotation, QuotationFormData, QuotationStatus } from '@/types/quotation';

// Query Keys for React Query
export const queryKeys = {
  // Auth
  currentUser: ['currentUser'] as const,
  
  // Dashboard
  dashboardStats: (branchId?: string) => ['dashboard', 'stats', branchId] as const,
  dailySales: (days?: number, branchId?: string) => ['dashboard', 'dailySales', days, branchId] as const,
  aiInsights: ['dashboard', 'aiInsights'] as const,
  
  // Branches
  branches: ['branches'] as const,
  branchStats: (branchId: string) => ['branch', 'stats', branchId] as const,
  allBranchesStats: ['branches', 'stats', 'all'] as const,
  
  // Accounts
  accounts: (branchId?: string) => ['accounts', branchId] as const,
  accountTransactions: (accountId: string) => ['accounts', 'transactions', accountId] as const,
  
  // Audit
  auditLogs: (filters?: { userId?: string; entity?: string; entityId?: string }) => ['audit', 'logs', filters] as const,
  entityAuditLogs: (entity: string, entityId: string) => ['audit', entity, entityId] as const,
  
  // Health Score
  healthScore: (branchId?: string) => ['healthScore', branchId] as const,
  
  // Credit Control
  creditAging: (branchId?: string) => ['credit', 'aging', branchId] as const,
  creditLimit: (partyId: string) => ['credit', 'limit', partyId] as const,
  
  // Dead Stock
  deadStock: (branchId?: string) => ['inventory', 'deadStock', branchId] as const,
  
  // Staff Performance
  staffPerformance: (period?: string) => ['staff', 'performance', period] as const,
  
  // Search
  globalSearch: (query: string) => ['search', 'global', query] as const,
  
  // Parties
  parties: (filters?: { type?: string; search?: string; branchId?: string }) => ['parties', filters] as const,
  party: (id: string) => ['party', id] as const,
  
  // Items
  items: (filters?: { categoryId?: string; lowStock?: boolean; search?: string; branchId?: string }) => ['items', filters] as const,
  item: (id: string) => ['item', id] as const,
  categories: ['categories'] as const,
  
  // Sales
  sales: (filters?: { partyId?: string; startDate?: string; endDate?: string; branchId?: string }) => ['sales', filters] as const,
  sale: (id: string) => ['sale', id] as const,
  
  // Purchases
  purchases: (filters?: { supplierId?: string; startDate?: string; endDate?: string; branchId?: string }) => ['purchases', filters] as const,
  purchase: (id: string) => ['purchase', id] as const,
  
  // Expenses
  expenses: (filters?: { categoryId?: string; startDate?: string; endDate?: string; branchId?: string }) => ['expenses', filters] as const,
  expenseCategories: ['expenseCategories'] as const,
  
  // Quotations
  quotations: (filters?: { status?: QuotationStatus; search?: string }) => ['quotations', filters] as const,
  quotation: (id: string) => ['quotation', id] as const,
};

// API Functions - Real API calls
export const apiFunctions = {
  // Auth
  login: async (phone: string, otp: string): Promise<ApiResponse<Session>> => {
    return api.post<Session>('/auth/verify-otp', { phone, otp });
  },

  sendOtp: async (phone: string): Promise<ApiResponse<{ success: boolean; message: string; otp?: string }>> => {
    return api.post<{ success: boolean; message: string; otp?: string }>('/auth/send-otp', { phone });
  },

  logout: async (): Promise<ApiResponse<{ success: boolean }>> => {
    return api.post<{ success: boolean }>('/auth/logout');
  },

  // Dashboard
  getDashboardStats: async (branchId?: string): Promise<ApiResponse<DashboardStats>> => {
    return api.get<DashboardStats>('/dashboard/stats', { branchId });
  },

  getDailySales: async (): Promise<ApiResponse<DailySales[]>> => {
    return api.get<DailySales[]>('/dashboard/daily-sales');
  },

  getAiInsights: async (): Promise<{ success: boolean; data: BusinessHealthScore }> => {
    // AI insights are generated from health score for now
    return api.get<BusinessHealthScore>('/health-score');
  },

  // Branches
  getBranches: async (): Promise<{ success: boolean; data: Branch[] }> => {
    return api.get<Branch[]>('/branches');
  },

  getBranchStats: async (branchId: string): Promise<{ success: boolean; data: BranchStats | null }> => {
    return api.get<BranchStats | null>(`/branches/${branchId}/stats`);
  },

  // Accounts
  getAccounts: async (): Promise<{ success: boolean; data: Account[] }> => {
    return api.get<Account[]>('/accounts');
  },

  getAccountTransactions: async (accountId: string): Promise<{ success: boolean; data: AccountTransaction[] }> => {
    return api.get<AccountTransaction[]>(`/accounts/${accountId}/transactions`);
  },

  createAccountTransfer: async (data: Partial<AccountTransfer>): Promise<{ success: boolean; data: AccountTransfer }> => {
    return api.post<AccountTransfer>('/accounts/transfer', data);
  },

  // Audit Logs
  getAuditLogs: async (params?: { 
    userId?: string; 
    entity?: string; 
    entityId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ success: boolean; data: AuditLog[]; meta: { total: number } }> => {
    return api.get<AuditLog[]>('/audit-logs', params);
  },

  getEntityAuditLogs: async (entity: string, entityId: string): Promise<{ success: boolean; data: AuditLog[] }> => {
    return api.get<AuditLog[]>(`/audit-logs/${entity}/${entityId}`);
  },

  // Health Score
  getHealthScore: async (): Promise<{ success: boolean; data: BusinessHealthScore }> => {
    return api.get<BusinessHealthScore>('/health-score');
  },

  recalculateHealthScore: async (): Promise<{ success: boolean; data: BusinessHealthScore }> => {
    return api.post<BusinessHealthScore>('/health-score/recalculate');
  },

  // Credit Control
  getCreditAgingReport: async (): Promise<{ success: boolean; data: CreditAgingReport[] }> => {
    return api.get<CreditAgingReport[]>('/credit/aging');
  },

  checkCreditLimit: async (partyId: string, amount: number): Promise<{ 
    success: boolean; 
    data: { 
      withinLimit: boolean; 
      currentBalance: number; 
      creditLimit: number; 
      utilization: number;
      warning?: string;
    } 
  }> => {
    return api.post('/credit/check-limit', { partyId, amount });
  },

  // Dead Stock
  getDeadStockReport: async (): Promise<{ success: boolean; data: DeadStockItem[] }> => {
    return api.get<DeadStockItem[]>('/inventory/dead-stock');
  },

  // Staff Performance
  getStaffPerformance: async (period?: string): Promise<{ success: boolean; data: StaffPerformance[] }> => {
    return api.get<StaffPerformance[]>('/staff/performance', { period });
  },

  // Global Search
  globalSearch: async (query: string): Promise<{ success: boolean; data: GlobalSearchResponse }> => {
    return api.get<GlobalSearchResponse>('/search', { q: query });
  },

  // Parties
  getParties: async (params?: { type?: string; search?: string }): Promise<ApiResponse<PaginatedResponse<Party>>> => {
    return api.get<PaginatedResponse<Party>>('/parties', params);
  },

  getParty: async (id: string): Promise<ApiResponse<Party>> => {
    return api.get<Party>(`/parties/${id}`);
  },

  createParty: async (data: Partial<Party>): Promise<ApiResponse<Party>> => {
    return api.post<Party>('/parties', data);
  },

  updateParty: async (id: string, data: Partial<Party>): Promise<ApiResponse<Party>> => {
    return api.patch<Party>(`/parties/${id}`, data);
  },

  deleteParty: async (id: string): Promise<ApiResponse<{ id: string }>> => {
    return api.delete<{ id: string }>(`/parties/${id}`);
  },

  // Items
  getItems: async (params?: { categoryId?: string; lowStock?: boolean; search?: string }): Promise<ApiResponse<Item[]>> => {
    const response = await api.get<Item[]>('/items', params);
    // API returns { success: true, data: [...], meta: {...} } where data is the items array
    return response;
  },

  getItem: async (id: string): Promise<ApiResponse<Item>> => {
    return api.get<Item>(`/items/${id}`);
  },

  createItem: async (data: Partial<Item>): Promise<ApiResponse<Item>> => {
    return api.post<Item>('/items', data);
  },

  updateItem: async (id: string, data: Partial<Item>): Promise<ApiResponse<Item>> => {
    return api.patch<Item>(`/items/${id}`, data);
  },

  deleteItem: async (id: string): Promise<ApiResponse<{ id: string }>> => {
    return api.delete<{ id: string }>(`/items/${id}`);
  },

  // Categories
  getCategories: async (): Promise<ApiResponse<Category[]>> => {
    return api.get<Category[]>('/categories');
  },

  createCategory: async (data: Partial<Category>): Promise<ApiResponse<Category>> => {
    return api.post<Category>('/categories', data);
  },

  updateCategory: async (id: string, data: Partial<Category>): Promise<ApiResponse<Category>> => {
    return api.patch<Category>(`/categories/${id}`, data);
  },

  deleteCategory: async (id: string): Promise<ApiResponse<{ id: string }>> => {
    return api.delete<{ id: string }>(`/categories/${id}`);
  },

  // Sales
  getSales: async (params?: { partyId?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<PaginatedResponse<Sale>>> => {
    return api.get<PaginatedResponse<Sale>>('/sales', params);
  },

  getSale: async (id: string): Promise<ApiResponse<Sale>> => {
    return api.get<Sale>(`/sales/${id}`);
  },

  createSale: async (data: Partial<Sale>): Promise<ApiResponse<Sale>> => {
    return api.post<Sale>('/sales', data);
  },

  updateSaleStatus: async (id: string, status: string): Promise<ApiResponse<Sale>> => {
    return api.patch<Sale>(`/sales/${id}`, { status });
  },

  // Purchases
  getPurchases: async (params?: { supplierId?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<PaginatedResponse<Purchase>>> => {
    return api.get<PaginatedResponse<Purchase>>('/purchases', params);
  },

  getPurchase: async (id: string): Promise<ApiResponse<Purchase>> => {
    return api.get<Purchase>(`/purchases/${id}`);
  },

  createPurchase: async (data: Partial<Purchase>): Promise<ApiResponse<Purchase>> => {
    return api.post<Purchase>('/purchases', data);
  },

  updatePurchaseStatus: async (id: string, status: string): Promise<ApiResponse<Purchase>> => {
    return api.patch<Purchase>(`/purchases/${id}`, { status });
  },

  // Expenses
  getExpenseCategories: async (): Promise<ApiResponse<ExpenseCategory[]>> => {
    return api.get<ExpenseCategory[]>('/expenses/categories');
  },

  getExpenses: async (params?: { categoryId?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<PaginatedResponse<Expense>>> => {
    return api.get<PaginatedResponse<Expense>>('/expenses', params);
  },

  getExpense: async (id: string): Promise<ApiResponse<Expense>> => {
    return api.get<Expense>(`/expenses/${id}`);
  },

  createExpense: async (data: Partial<Expense>): Promise<ApiResponse<Expense>> => {
    return api.post<Expense>('/expenses', data);
  },

  updateExpense: async (id: string, data: Partial<Expense>): Promise<ApiResponse<Expense>> => {
    return api.patch<Expense>(`/expenses/${id}`, data);
  },

  deleteExpense: async (id: string): Promise<ApiResponse<{ id: string }>> => {
    return api.delete<{ id: string }>(`/expenses/${id}`);
  },

  // User
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return api.get<User>('/user/me');
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    return api.patch<User>('/user/me', data);
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<{ success: boolean }>> => {
    return api.patch<{ success: boolean }>('/user/password', { currentPassword, newPassword });
  },

  // Quotations
  getQuotations: async (params?: { status?: QuotationStatus; search?: string }): Promise<{ success: boolean; data: Quotation[] }> => {
    return api.get<Quotation[]>('/quotations', params);
  },

  getQuotation: async (id: string): Promise<{ success: boolean; data: Quotation }> => {
    return api.get<Quotation>(`/quotations/${id}`);
  },

  createQuotation: async (data: QuotationFormData): Promise<{ success: boolean; data: Quotation }> => {
    return api.post<Quotation>('/quotations', data);
  },

  updateQuotationStatus: async (id: string, status: QuotationStatus, convertedToSaleId?: string): Promise<{ success: boolean; data: Quotation }> => {
    return api.patch<Quotation>(`/quotations/${id}`, { status, convertedToSaleId });
  },

  deleteQuotation: async (id: string): Promise<{ success: boolean; data: { id: string } }> => {
    return api.delete<{ id: string }>(`/quotations/${id}`);
  },
};
