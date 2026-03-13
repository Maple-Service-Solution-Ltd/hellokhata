// Hello Khata OS - Branch Context Hook
// Automatically invalidates queries when branch changes

'use client';

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useBranchStore } from '@/stores/branchStore';
import { useSessionStore } from '@/stores/sessionStore';
import { queryKeys } from '@/lib/api';

/**
 * Hook that provides branch context and automatic query invalidation
 * when the active branch changes.
 */
export function useBranchContext() {
  const queryClient = useQueryClient();
  const currentBranchId = useBranchStore((state) => state.currentBranchId);
  const viewAllBranches = useBranchStore((state) => state.viewAllBranches);
  const setCurrentBranch = useBranchStore((state) => state.setCurrentBranch);
  const setViewAllBranches = useBranchStore((state) => state.setViewAllBranches);
  const businessId = useSessionStore((state) => state.business?.id);

  // Invalidate all branch-scoped queries when branch changes
  const invalidateBranchQueries = useCallback(() => {
    // Invalidate dashboard stats
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats() });
    
    // Invalidate sales
    queryClient.invalidateQueries({ queryKey: queryKeys.sales() });
    
    // Invalidate expenses
    queryClient.invalidateQueries({ queryKey: queryKeys.expenses() });
    
    // Invalidate items
    queryClient.invalidateQueries({ queryKey: queryKeys.items() });
    
    // Invalidate parties
    queryClient.invalidateQueries({ queryKey: queryKeys.parties() });
    
    // Invalidate health score
    queryClient.invalidateQueries({ queryKey: queryKeys.healthScore() });
    
    // Invalidate credit aging
    queryClient.invalidateQueries({ queryKey: queryKeys.creditAging() });
    
    // Invalidate dead stock
    queryClient.invalidateQueries({ queryKey: queryKeys.deadStock() });
    
    // Invalidate staff performance
    queryClient.invalidateQueries({ queryKey: queryKeys.staffPerformance() });
    
    // Invalidate accounts
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts() });
    
    // Invalidate branches
    queryClient.invalidateQueries({ queryKey: queryKeys.branches });
  }, [queryClient]);

  // Listen for branch changes
  useEffect(() => {
    // Invalidate queries when branch changes
    invalidateBranchQueries();
  }, [currentBranchId, viewAllBranches, invalidateBranchQueries]);

  // Switch to a specific branch
  const switchBranch = useCallback((branchId: string) => {
    setCurrentBranch(branchId);
    setViewAllBranches(false);
  }, [setCurrentBranch, setViewAllBranches]);

  // Switch to "All Branches" mode
  const switchToAllBranches = useCallback(() => {
    setViewAllBranches(true);
  }, [setViewAllBranches]);

  return {
    currentBranchId,
    viewAllBranches,
    switchBranch,
    switchToAllBranches,
    invalidateBranchQueries,
    // Derived state
    isAllBranchesMode: viewAllBranches || !currentBranchId,
    branchScope: currentBranchId || null,
  };
}

/**
 * Hook to check if a specific branch is selected
 * Useful for conditional rendering in forms
 */
export function useIsBranchSelected() {
  const currentBranchId = useBranchStore((state) => state.currentBranchId);
  return !!currentBranchId;
}

/**
 * Hook to get the current branch for write operations
 * Returns error state if no branch is selected
 */
export function useBranchForWrite() {
  const currentBranchId = useBranchStore((state) => state.currentBranchId);
  const viewAllBranches = useBranchStore((state) => state.viewAllBranches);
  
  // Cannot write in "All Branches" mode
  const canWrite = !viewAllBranches && !!currentBranchId;
  
  return {
    branchId: currentBranchId,
    canWrite,
    error: !canWrite 
      ? 'A specific branch must be selected for this operation. Please select a branch from the header.'
      : null,
  };
}
