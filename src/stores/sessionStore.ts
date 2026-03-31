// Hello Khata - Session Store
// হ্যালো খাতা - সেশন স্টোর

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── Domain Types ─────────────────────────────────────────────────────────────

export type UserRole = 'owner' | 'manager' | 'staff';

export type PlanType = 'free' | 'starter' | 'growth' | 'intelligence';

export interface User {
  id: string;
  branchId: string;
  name: string;
  phone: string;
  role: UserRole;
}

export interface Business {
  id: string;
  name: string;
  logo: string | null;
  currency: string; // e.g. "BDT"
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

// ─── Server Response Types ────────────────────────────────────────────────────
// Matches the exact shape returned by /api/auth/verify-phone (and similar endpoints)

export interface AuthResponse {
  success: boolean;
  message: string;
  accessToken: string;
  user: {
    id: string;
    branchId: string;
    name: string;
    phone: string;
    role: UserRole;
  };
  business: {
    id: string;
    name: string;
    logo: string | null;
    currency: string;
  };
}

// Shape returned by /api/auth/refresh-session
export interface RefreshSessionResponse {
  success: boolean;
  data: {
    plan: PlanType;
    features?: FeatureFlags;
    business?: Business;
    user?: User;
  };
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface SessionState {
  // State
  user: User | null;
  token: string | null;        // mapped from server's accessToken
  business: Business | null;
  plan: PlanType;              // not returned by server — derived or fetched separately
  features: FeatureFlags;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setSessionFromAuthResponse: (response: AuthResponse) => void;
  updateUser: (user: Partial<User>) => void;
  updateBusiness: (business: Partial<Business>) => void;
  setPlan: (plan: PlanType) => void;
  setFeatures: (features: FeatureFlags) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  refreshSession: () => Promise<void>;
}

// ─── Plan → Feature Flags ─────────────────────────────────────────────────────
// 🟢 FREE        – ৳0:   Hook tier. AI 3/day, no export, no health score, no analytics.
// 🔵 STARTER     – ৳199: Micro shop. AI 15/day, CSV export, dead stock alert.
// 🟣 GROWTH      – ৳499: Growing SME. AI 50/day, forecasting, priority support.
// 🔴 INTELLIGENCE– ৳999: Serious business. Unlimited AI, API access, dedicated support.

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

// ─── Store ────────────────────────────────────────────────────────────────────

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

      // ✅ Primary action — call this right after a successful login/verify response
      setSessionFromAuthResponse: (response: AuthResponse) => {
        // Server doesn't return plan — keep existing plan or default to 'free'.
        // Call refreshSession() afterward if you need the real plan from the server.
        const currentPlan = get().plan ?? 'free';

        set({
          token: response.accessToken,
          user: {
            id: response.user.id,
            branchId: response.user.branchId,
            name: response.user.name,
            phone: response.user.phone,
            role: response.user.role,
          },
          business: {
            id: response.business.id,
            name: response.business.name,
            logo: response.business.logo,
            currency: response.business.currency,
          },
          plan: currentPlan,
          features: getDefaultFeatures(currentPlan),
          isAuthenticated: true,
          isLoading: false,
        });
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) set({ user: { ...currentUser, ...userData } });
      },

      updateBusiness: (businessData: Partial<Business>) => {
        const currentBusiness = get().business;
        if (currentBusiness) set({ business: { ...currentBusiness, ...businessData } });
      },

      setPlan: (plan: PlanType) => {
        set({ plan, features: getDefaultFeatures(plan) });
      },

      setFeatures: (features: FeatureFlags) => set({ features }),

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

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      // Call this after setSessionFromAuthResponse to sync real plan & features from server
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

          const data: RefreshSessionResponse = await response.json();

          if (data.success && data.data) {
            set({
              plan: data.data.plan,
              features: data.data.features ?? getDefaultFeatures(data.data.plan),
              business: data.data.business ?? state.business,
              user: data.data.user ?? state.user,
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
        if (state) state.isLoading = false;
      },
    }
  )
);

// ─── Helper Hooks ─────────────────────────────────────────────────────────────

export const useUser            = () => useSessionStore((s) => s.user);
export const useBusiness        = () => useSessionStore((s) => s.business);
export const usePlan            = () => useSessionStore((s) => s.plan);
export const useFeatures        = () => useSessionStore((s) => s.features);
export const useIsAuthenticated = () => useSessionStore((s) => s.isAuthenticated);
export const useIsOwner         = () => useSessionStore((s) => s.user?.role === 'owner');
export const useIsManager       = () => useSessionStore((s) =>
  s.user?.role === 'owner' || s.user?.role === 'manager'
);