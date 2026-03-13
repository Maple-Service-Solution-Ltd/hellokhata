// Hello Khata - Session Store
// হ্যালো খাতা - সেশন স্টোর

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Business, PlanType, FeatureFlags, Session } from '@/types';

interface SessionState {
  // State
  user: User | null;
  token: string | null;
  business: Business | null;
  plan: PlanType;
  features: FeatureFlags;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setSession: (session: Session) => void;
  updateUser: (user: Partial<User>) => void;
  updateBusiness: (business: Partial<Business>) => void;
  setPlan: (plan: PlanType) => void;
  setFeatures: (features: FeatureFlags) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  refreshSession: () => Promise<void>;
}

// Default features based on plan
// 🟢 FREE – ৳0: Hook tier. Limit AI to 3/day. No export. No health score. No analytics.
// 🔵 STARTER – ৳199/month: Micro shop. AI 15/day, Export CSV, Dead stock alert
// 🟣 GROWTH – ৳499/month: Growing SME. AI 50/day, forecasting, priority support
// 🔴 INTELLIGENCE – ৳999/month: Serious business. Unlimited, API access, dedicated support
const getDefaultFeatures = (plan: PlanType): FeatureFlags => {
  switch (plan) {
    case 'intelligence':
      return {
        aiAssistant: true,
        multiStaff: true,
        advancedReports: true,
        dataExport: true,
        unlimitedItems: true,
        unlimitedParties: true,
        multiBranch: true,
        creditControl: true,
        auditTrail: true,
        advancedPricing: true,
        healthScore: true,
        reconciliation: true,
        staffPerformance: true,
        deadStockAnalysis: true,
        globalSearch: true,
      };
    case 'growth':
      return {
        aiAssistant: true,
        multiStaff: true,
        advancedReports: true,
        dataExport: true,
        unlimitedItems: true,
        unlimitedParties: true,
        multiBranch: true,
        creditControl: true,
        auditTrail: false,
        advancedPricing: false,
        healthScore: true,
        reconciliation: true,
        staffPerformance: true,
        deadStockAnalysis: true,
        globalSearch: true,
      };
    case 'starter':
      return {
        aiAssistant: true,
        multiStaff: false,
        advancedReports: false,
        dataExport: true, // CSV only
        unlimitedItems: true,
        unlimitedParties: false,
        multiBranch: false,
        creditControl: true,
        auditTrail: false,
        advancedPricing: false,
        healthScore: false,
        reconciliation: false,
        staffPerformance: false,
        deadStockAnalysis: true,
        globalSearch: true,
      };
    case 'free':
    default:
      return {
        aiAssistant: true, // Limited to 3/day
        multiStaff: false,
        advancedReports: false,
        dataExport: false,
        unlimitedItems: false,
        unlimitedParties: false,
        multiBranch: false,
        creditControl: false,
        auditTrail: false,
        advancedPricing: false,
        healthScore: false,
        reconciliation: false,
        staffPerformance: false,
        deadStockAnalysis: false,
        globalSearch: true,
      };
  }
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      business: null,
      plan: 'free',
      features: getDefaultFeatures('free'),
      isAuthenticated: false,
      isLoading: true,

      // Actions
      setSession: (session: Session) => {
        set({
          user: session.user,
          token: session.token,
          business: session.business,
          plan: session.plan,
          features: session.features || getDefaultFeatures(session.plan),
          isAuthenticated: true,
          isLoading: false,
        });
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      updateBusiness: (businessData: Partial<Business>) => {
        const currentBusiness = get().business;
        if (currentBusiness) {
          set({
            business: { ...currentBusiness, ...businessData },
          });
        }
      },

      setPlan: (plan: PlanType) => {
        set({
          plan,
          features: getDefaultFeatures(plan),
        });
      },

      setFeatures: (features: FeatureFlags) => {
        set({ features });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          business: null,
          plan: 'free',
          features: getDefaultFeatures('free'),
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      refreshSession: async () => {
        const state = get();
        if (!state.business?.id) return;
        
        try {
          const response = await fetch('/api/auth/refresh-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-business-id': state.business.id,
              'x-user-id': state.user?.id || '',
            },
          });
          
          const data = await response.json();
          
          if (data.success && data.data) {
            set({
              plan: data.data.plan,
              features: data.data.features,
              business: data.data.business,
              user: data.data.user || state.user,
            });
          }
        } catch (error) {
          console.error('Failed to refresh session:', error);
        }
      },
    }),
    {
      name: 'hello-khata-session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        business: state.business,
        plan: state.plan,
        features: state.features,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Always set isLoading to false after rehydration completes
        if (state) {
          state.isLoading = false;
        }
      },
    }
  )
);

// Helper hooks
export const useUser = () => useSessionStore((state) => state.user);
export const useBusiness = () => useSessionStore((state) => state.business);
export const usePlan = () => useSessionStore((state) => state.plan);
export const useFeatures = () => useSessionStore((state) => state.features);
export const useIsAuthenticated = () => useSessionStore((state) => state.isAuthenticated);
export const useIsOwner = () => useSessionStore((state) => state.user?.role === 'owner');
export const useIsManager = () => useSessionStore((state) => 
  state.user?.role === 'owner' || state.user?.role === 'manager'
);
