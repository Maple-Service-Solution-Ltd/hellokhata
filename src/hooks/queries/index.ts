// Hello Khata OS - React Query Hooks
// হ্যালো খাতা - রিয়্যাক্ট কোয়েরি হুকস

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFunctions, queryKeys } from '@/lib/api';
import type { Party, Item, Sale, Purchase, Expense, AccountTransfer } from '@/types';
import type { QuotationFormData, QuotationStatus } from '@/types/quotation';

// ============================================
// Dashboard hooks
// ============================================

export function useDashboardStats(branchId?: string) {
  return useQuery({
    queryKey: queryKeys.dashboardStats(branchId),
    queryFn: () => apiFunctions.getDashboardStats(branchId),
    select: (data) => data.data,
    staleTime: 30000, // 30 seconds
  });
}

export function useDailySales() {
  return useQuery({
    queryKey: queryKeys.dailySales(),
    queryFn: () => apiFunctions.getDailySales(),
    select: (data) => data.data,
    staleTime: 60000, // 1 minute
  });
}

export function useAiInsights() {
  return useQuery({
    queryKey: queryKeys.aiInsights,
    queryFn: () => apiFunctions.getAiInsights(),
    // Return the full health score object which contains suggestions
    staleTime: 120000, // 2 minutes
  });
}

// ============================================
// Branch hooks
// ============================================

export function useBranches() {
  return useQuery({
    queryKey: queryKeys.branches,
    queryFn: () => apiFunctions.getBranches(),
    select: (data) => data.data,
    staleTime: 60000,
  });
}

export function useBranchStats(branchId: string) {
  return useQuery({
    queryKey: queryKeys.branchStats(branchId),
    queryFn: () => apiFunctions.getBranchStats(branchId),
    select: (data) => data.data,
    enabled: !!branchId,
    staleTime: 30000,
  });
}

// ============================================
// Account hooks
// ============================================

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts(),
    queryFn: () => apiFunctions.getAccounts(),
    select: (data) => data.data,
    staleTime: 30000,
  });
}

export function useAccountTransactions(accountId: string) {
  return useQuery({
    queryKey: queryKeys.accountTransactions(accountId),
    queryFn: () => apiFunctions.getAccountTransactions(accountId),
    select: (data) => data.data,
    enabled: !!accountId,
    staleTime: 30000,
  });
}

export function useCreateAccountTransfer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<AccountTransfer>) => apiFunctions.createAccountTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts() });
    },
  });
}

// ============================================
// Audit Log hooks
// ============================================

export function useAuditLogs(params?: { 
  userId?: string; 
  entity?: string; 
  entityId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: queryKeys.auditLogs(params),
    queryFn: () => apiFunctions.getAuditLogs(params),
    select: (data) => data.data,
    staleTime: 60000,
  });
}

export function useEntityAuditLogs(entity: string, entityId: string) {
  return useQuery({
    queryKey: queryKeys.entityAuditLogs(entity, entityId),
    queryFn: () => apiFunctions.getEntityAuditLogs(entity, entityId),
    select: (data) => data.data,
    enabled: !!entity && !!entityId,
    staleTime: 60000,
  });
}

// ============================================
// Health Score hooks
// ============================================

export function useHealthScore() {
  return useQuery({
    queryKey: queryKeys.healthScore(),
    queryFn: () => apiFunctions.getHealthScore(),
    select: (data) => data.data,
    staleTime: 300000, // 5 minutes
  });
}

export function useRecalculateHealthScore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiFunctions.recalculateHealthScore(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.healthScore() });
    },
  });
}

// ============================================
// Credit Control hooks
// ============================================

export function useCreditAgingReport() {
  return useQuery({
    queryKey: queryKeys.creditAging(),
    queryFn: () => apiFunctions.getCreditAgingReport(),
    select: (data) => data.data,
    staleTime: 120000, // 2 minutes
  });
}

export function useCreditLimitCheck(partyId: string, amount: number) {
  return useQuery({
    queryKey: queryKeys.creditLimit(partyId),
    queryFn: () => apiFunctions.checkCreditLimit(partyId, amount),
    select: (data) => data.data,
    enabled: !!partyId && amount > 0,
    staleTime: 60000,
  });
}

// ============================================
// Dead Stock hooks
// ============================================

export function useDeadStockReport() {
  return useQuery({
    queryKey: queryKeys.deadStock(),
    queryFn: () => apiFunctions.getDeadStockReport(),
    select: (data) => data.data,
    staleTime: 300000, // 5 minutes
  });
}

// ============================================
// Staff Performance hooks
// ============================================

export function useStaffPerformance(period?: string) {
  return useQuery({
    queryKey: queryKeys.staffPerformance(period),
    queryFn: () => apiFunctions.getStaffPerformance(period),
    select: (data) => data.data,
    staleTime: 300000, // 5 minutes
  });
}

// ============================================
// Global Search hook
// ============================================

export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.globalSearch(query),
    queryFn: () => apiFunctions.globalSearch(query),
    select: (data) => data.data,
    enabled: query.length >= 2,
    staleTime: 60000,
  });
}

// ============================================
// Parties hooks
// ============================================

export function useParties(params?: { type?: string; search?: string }) {
  return useQuery({
    queryKey: queryKeys.parties(params),
    queryFn: () => apiFunctions.getParties(params),
    select: (response) => response?.data || [],
    staleTime: 60000,
  });
}

export function useParty(id: string) {
  return useQuery({
    queryKey: queryKeys.party(id),
    queryFn: () => apiFunctions.getParty(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useCreateParty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Party>) => apiFunctions.createParty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parties() });
    },
  });
}

// ============================================
// Items hooks
// ============================================

export function useItems(params?: { categoryId?: string; lowStock?: boolean; search?: string }) {
  return useQuery({
    queryKey: queryKeys.items(params),
    queryFn: () => apiFunctions.getItems(params),
    select: (response) => response?.data || [],
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: queryKeys.item(id),
    queryFn: () => apiFunctions.getItem(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Item>) => apiFunctions.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items() });
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => apiFunctions.getCategories(),
    select: (data) => data.data,
    staleTime: 300000, // 5 minutes
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name: string; nameBn?: string; description?: string }) => 
      apiFunctions.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; nameBn?: string; description?: string }) => 
      apiFunctions.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiFunctions.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

// ============================================
// Sales hooks
// ============================================

export function useSales(params?: { partyId?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: queryKeys.sales(params),
    queryFn: () => apiFunctions.getSales(params),
    select: (response) => response?.data || [],
    staleTime: 30000,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Sale>) => apiFunctions.createSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.items() });
      queryClient.invalidateQueries({ queryKey: queryKeys.creditAging() });
    },
  });
}

// ============================================
// Purchases hooks
// ============================================

export function usePurchases(params?: { supplierId?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: queryKeys.purchases(params),
    queryFn: () => apiFunctions.getPurchases(params),
    select: (response) => response?.data || [],
    staleTime: 30000,
  });
}

export function usePurchase(id: string) {
  return useQuery({
    queryKey: queryKeys.purchase(id),
    queryFn: () => apiFunctions.getPurchase(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Purchase>) => apiFunctions.createPurchase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchases() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.items() });
    },
  });
}

// ============================================
// Expenses hooks
// ============================================

export function useExpenses(params?: { categoryId?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: queryKeys.expenses(params),
    queryFn: () => apiFunctions.getExpenses(params),
    select: (response) => response?.data || [],
    staleTime: 60000,
  });
}

export function useExpenseCategories() {
  return useQuery({
    queryKey: queryKeys.expenseCategories,
    queryFn: () => apiFunctions.getExpenseCategories(),
    select: (data) => data.data,
    staleTime: 300000,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Expense>) => apiFunctions.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
    },
  });
}

// ============================================
// Auth hooks
// ============================================

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => apiFunctions.getCurrentUser(),
    select: (data) => data.data,
    staleTime: 300000,
  });
}

// ============================================
// Quotations hooks
// ============================================

export function useQuotations(params?: { status?: QuotationStatus; search?: string }) {
  return useQuery({
    queryKey: queryKeys.quotations(params),
    queryFn: () => apiFunctions.getQuotations(params),
    select: (data) => data.data,
    staleTime: 30000,
  });
}

export function useQuotation(id: string) {
  return useQuery({
    queryKey: queryKeys.quotation(id),
    queryFn: () => apiFunctions.getQuotation(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: QuotationFormData) => apiFunctions.createQuotation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations() });
    },
  });
}

export function useUpdateQuotationStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status, convertedToSaleId }: { id: string; status: QuotationStatus; convertedToSaleId?: string }) =>
      apiFunctions.updateQuotationStatus(id, status, convertedToSaleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations() });
    },
  });
}

export function useDeleteQuotation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiFunctions.deleteQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations() });
    },
  });
}

// ============================================
// Suppliers hooks (Parties with type='supplier')
// ============================================

export function useSuppliers() {
  return useQuery({
    queryKey: queryKeys.parties({ type: 'supplier' }),
    queryFn: () => apiFunctions.getParties({ type: 'supplier' }),
    select: (response) => response?.data || [],
    staleTime: 60000,
  });
}

// ============================================
// Stock Ledger hooks
// ============================================

export function useStockLedger(params?: { itemId?: string; branchId?: string }) {
  return useQuery({
    queryKey: ['stockLedger', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.itemId) queryParams.set('itemId', params.itemId);
      if (params?.branchId) queryParams.set('branchId', params.branchId);
      
      const response = await fetch(`/api/stock-ledger?${queryParams.toString()}`, {
        headers: {
          'x-business-id': localStorage.getItem('hello-khata-session') 
            ? JSON.parse(localStorage.getItem('hello-khata-session') || '{}').state?.business?.id 
            : '',
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch stock ledger');
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 30000,
  });
}
