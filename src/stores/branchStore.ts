// Hello Khata OS - Branch Store
// হ্যালো খাতা - ব্রাঞ্চ স্টোর

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Branch, BranchStats } from '@/types';

interface BranchState {
  // State
  branches: Branch[];
  currentBranchId: string | null;
  currentBranch: Branch | null;
  isLoading: boolean;
  viewAllBranches: boolean; // For consolidated reports

  // Actions
  setBranches: (branches: Branch[]) => void;
  addBranch: (branch: Branch) => void;
  updateBranch: (id: string, data: Partial<Branch>) => void;
  removeBranch: (id: string) => void;
  setCurrentBranch: (branchId: string | null) => void;
  setViewAllBranches: (viewAll: boolean) => void;
  setLoading: (loading: boolean) => void;
  getBranchById: (id: string) => Branch | undefined;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      // Initial state
      branches: [],
      currentBranchId: null,
      currentBranch: null,
      isLoading: false,
      viewAllBranches: false,

      // Actions
      setBranches: (branches) => {
        const currentId = get().currentBranchId;
        const currentBranch = branches.find(b => b.id === currentId) || branches.find(b => b.isMain) || branches[0] || null;
        set({
          branches,
          currentBranch,
          currentBranchId: currentBranch?.id || null,
        });
      },

      addBranch: (branch) => {
        set((state) => ({
          branches: [...state.branches, branch],
        }));
      },

      updateBranch: (id, data) => {
        set((state) => {
          const updatedBranches = state.branches.map((b) =>
            b.id === id ? { ...b, ...data, updatedAt: new Date() } : b
          );
          const currentBranch = state.currentBranchId === id
            ? updatedBranches.find(b => b.id === id) || state.currentBranch
            : state.currentBranch;
          return {
            branches: updatedBranches,
            currentBranch,
          };
        });
      },

      removeBranch: (id) => {
        set((state) => {
          const newBranches = state.branches.filter((b) => b.id !== id);
          const currentBranch = state.currentBranchId === id
            ? newBranches.find(b => b.isMain) || newBranches[0] || null
            : state.currentBranch;
          return {
            branches: newBranches,
            currentBranch,
            currentBranchId: currentBranch?.id || null,
          };
        });
      },

      setCurrentBranch: (branchId) => {
        const branch = branchId ? get().branches.find(b => b.id === branchId) : null;
        set({
          currentBranchId: branchId,
          currentBranch: branch || null,
          viewAllBranches: branchId === null,
        });
      },

      setViewAllBranches: (viewAll) => {
        set({ viewAllBranches: viewAll });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      getBranchById: (id) => {
        return get().branches.find(b => b.id === id);
      },
    }),
    {
      name: 'smartstore-branch',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentBranchId: state.currentBranchId,
        viewAllBranches: state.viewAllBranches,
      }),
    }
  )
);

// Helper hooks
export const useCurrentBranch = () => useBranchStore((state) => state.currentBranch);
export const useBranches = () => useBranchStore((state) => state.branches);
export const useViewAllBranches = () => useBranchStore((state) => state.viewAllBranches);
