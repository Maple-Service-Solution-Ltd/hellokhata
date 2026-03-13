// ERP API Client Adapter
// Calls existing ERP APIs - does NOT access database directly

import type { ERPApiResponse, DashboardStats, DailySales, Item, Party, Sale, Expense, Account, ExpenseCategory, TopSellingItem, LowStockItem } from './types';

const API_BASE = process.env.ERP_API_BASE || 'http://localhost:3000/api';

export class ERPApiClient {
  private businessId: string;
  private userId: string;
  private baseUrl: string;

  constructor(businessId: string, userId: string, baseUrl?: string) {
    this.businessId = businessId;
    this.userId = userId;
    this.baseUrl = baseUrl || API_BASE;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-business-id': this.businessId,
      'x-user-id': this.userId,
    };
  }

  private async request<T>(
    path: string, 
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    body?: Record<string, unknown>
  ): Promise<ERPApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${path}`;
      const options: RequestInit = {
        method,
        headers: this.getHeaders(),
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const data = await response.json();

      return data as ERPApiResponse<T>;
    } catch (error) {
      console.error(`ERP API Error [${method} ${path}]:`, error);
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: 'Failed to call ERP API',
        },
      };
    }
  }

  // ===== DASHBOARD & STATS =====
  
  async getDashboardStats(): Promise<ERPApiResponse<DashboardStats>> {
    return this.request<DashboardStats>('/dashboard/stats');
  }

  async getDailySales(startDate?: string, endDate?: string): Promise<ERPApiResponse<DailySales[]>> {
    let path = '/dashboard/daily-sales';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) path += `?${params.toString()}`;
    return this.request<DailySales[]>(path);
  }

  // ===== ITEMS =====

  async getItems(search?: string, limit?: number): Promise<ERPApiResponse<Item[]>> {
    let path = '/items';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (limit) params.append('limit', String(limit));
    if (params.toString()) path += `?${params.toString()}`;
    return this.request<Item[]>(path);
  }

  async getItem(itemId: string): Promise<ERPApiResponse<Item>> {
    return this.request<Item>(`/items/${itemId}`);
  }

  async createItem(data: Partial<Item>): Promise<ERPApiResponse<Item>> {
    return this.request<Item>('/items', 'POST', data);
  }

  async getLowStockItems(): Promise<ERPApiResponse<LowStockItem[]>> {
    return this.request<LowStockItem[]>('/items?lowStock=true');
  }

  async getDeadStock(): Promise<ERPApiResponse<LowStockItem[]>> {
    return this.request<LowStockItem[]>('/inventory/dead-stock');
  }

  async getTopSellingItems(period?: string): Promise<ERPApiResponse<TopSellingItem[]>> {
    // Get from sales API and aggregate
    const salesResult = await this.getSales({ period: period as 'today' | 'this_month' | 'last_7_days' | 'last_30_days' });
    if (!salesResult.success || !salesResult.data) {
      return { success: false, error: salesResult.error };
    }
    
    // Aggregate items from sales
    const itemMap = new Map<string, { itemId: string; itemName: string; quantity: number; total: number }>();
    for (const sale of salesResult.data) {
      if (sale.items) {
        for (const item of sale.items) {
          const existing = itemMap.get(item.itemName);
          if (existing) {
            existing.quantity += item.quantity;
            existing.total += item.total;
          } else {
            itemMap.set(item.itemName, {
              itemId: item.itemName, // Use itemName as key
              itemName: item.itemName,
              quantity: item.quantity,
              total: item.total,
            });
          }
        }
      }
    }

    return {
      success: true,
      data: Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 10),
    };
  }

  // ===== PARTIES =====

  async getParties(type?: 'customer' | 'supplier', search?: string): Promise<ERPApiResponse<Party[]>> {
    let path = '/parties';
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (search) params.append('search', search);
    if (params.toString()) path += `?${params.toString()}`;
    return this.request<Party[]>(path);
  }

  async getParty(partyId: string): Promise<ERPApiResponse<Party>> {
    return this.request<Party>(`/parties/${partyId}`);
  }

  async createParty(data: Partial<Party>): Promise<ERPApiResponse<Party>> {
    return this.request<Party>('/parties', 'POST', data);
  }

  async getReceivables(): Promise<ERPApiResponse<Party[]>> {
    const result = await this.getParties('customer');
    if (result.success && result.data) {
      result.data = result.data.filter(p => p.currentBalance > 0);
    }
    return result;
  }

  async getPayables(): Promise<ERPApiResponse<Party[]>> {
    const result = await this.getParties('supplier');
    if (result.success && result.data) {
      result.data = result.data.filter(p => p.currentBalance < 0);
    }
    return result;
  }

  // ===== SALES =====

  async getSales(filters?: { 
    period?: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_7_days' | 'last_30_days';
    partyId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ERPApiResponse<Sale[]>> {
    let path = '/sales';
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    if (filters?.partyId) params.append('partyId', filters.partyId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (params.toString()) path += `?${params.toString()}`;
    return this.request<Sale[]>(path);
  }

  async getSale(saleId: string): Promise<ERPApiResponse<Sale>> {
    return this.request<Sale>(`/sales/${saleId}`);
  }

  async createSale(data: {
    partyId?: string;
    items: Array<{ itemId: string; quantity: number; unitPrice?: number; discount?: number }>;
    discount?: number;
    paymentMethod?: 'cash' | 'credit' | 'card' | 'mobile_banking';
    paidAmount?: number;
    notes?: string;
  }): Promise<ERPApiResponse<Sale>> {
    return this.request<Sale>('/sales', 'POST', data);
  }

  // ===== EXPENSES =====

  async getExpenses(filters?: {
    period?: 'today' | 'this_month' | 'last_30_days';
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ERPApiResponse<Expense[]>> {
    let path = '/expenses';
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (params.toString()) path += `?${params.toString()}`;
    return this.request<Expense[]>(path);
  }

  async getExpenseCategories(): Promise<ERPApiResponse<ExpenseCategory[]>> {
    return this.request<ExpenseCategory[]>('/expenses/categories');
  }

  async createExpense(data: {
    categoryId: string;
    amount: number;
    description: string;
    date?: string;
    accountId?: string;
  }): Promise<ERPApiResponse<Expense>> {
    return this.request<Expense>('/expenses', 'POST', data);
  }

  // ===== PAYMENTS =====

  async getPayments(filters?: {
    partyId?: string;
    type?: 'received' | 'paid';
  }): Promise<ERPApiResponse<unknown[]>> {
    let path = '/payments';
    const params = new URLSearchParams();
    if (filters?.partyId) params.append('partyId', filters.partyId);
    if (filters?.type) params.append('type', filters.type);
    if (params.toString()) path += `?${params.toString()}`;
    return this.request(path);
  }

  async createPayment(data: {
    partyId: string;
    type: 'received' | 'paid';
    amount: number;
    mode?: 'cash' | 'card' | 'mobile_banking' | 'bank_transfer';
    accountId?: string;
    reference?: string;
    notes?: string;
  }): Promise<ERPApiResponse<{ id: string; amount: number; partyId: string }>> {
    return this.request('/payments', 'POST', data);
  }

  // ===== ACCOUNTS =====

  async getAccounts(): Promise<ERPApiResponse<Account[]>> {
    return this.request<Account[]>('/accounts');
  }

  // ===== HEALTH SCORE =====

  async getHealthScore(): Promise<ERPApiResponse<{
    overallScore: number;
    grade: string;
    components: Record<string, { score: number; value: number; trend: string }>;
  }>> {
    return this.request('/health-score');
  }
}

// Factory function
export function createERPClient(businessId: string, userId: string): ERPApiClient {
  return new ERPApiClient(businessId, userId);
}
