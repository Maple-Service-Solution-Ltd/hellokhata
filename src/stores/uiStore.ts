// Hello Khata OS - UI Store
// হ্যালো খাতা - ইউআই স্টোর

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

type Language = 'bn' | 'en';
type Theme = 'light' | 'dark' | 'system';

// Page routes for client-side navigation
export type PageRoute = 
  | 'dashboard' 
  | 'sales' 
  | 'sales-quotations' 
  | 'sales-returns'
  | 'purchases' 
  | 'purchases-new'
  | 'purchases-returns'
  | 'parties' 
  | 'inventory' 
  | 'inventory-new'
  | 'inventory-adjustment'
  | 'inventory-transfer'
  | 'inventory-batches'
  | 'expenses' 
  | 'reports' 
  | 'ai' 
  | 'settings'
  | 'settings-inventory'
  | 'settings-branches'
  | 'settings-approvals'
  | 'settings-recycle-bin'
  | 'settings-period-lock';

interface UiState {
  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
  
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // Navigation (Client-side routing)
  currentPage: PageRoute;
  pageParams: Record<string, string>;
  navigateTo: (page: PageRoute, params?: Record<string, string>) => void;
  
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // AI Drawer
  aiDrawerCollapsed: boolean;
  setAiDrawerCollapsed: (collapsed: boolean) => void;
  toggleAiDrawer: () => void;
  
  // Mobile menu
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  
  // Modals
  activeModal: string | null;
  modalData: Record<string, unknown> | null;
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  
  // Notifications
  unreadNotifications: number;
  setUnreadNotifications: (count: number) => void;
  
  // Loading states
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  
  // Toast queue
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      // Language
      language: 'bn',
      setLanguage: (lang) => set({ language: lang }),

      // Theme
      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      // Navigation
      currentPage: 'dashboard',
      pageParams: {},
      navigateTo: (page, params = {}) => set({ currentPage: page, pageParams: params }),

      // Sidebar
      sidebarOpen: true,
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // AI Drawer - Collapsed by default
      aiDrawerCollapsed: true,
      setAiDrawerCollapsed: (collapsed) => set({ aiDrawerCollapsed: collapsed }),
      toggleAiDrawer: () => set((state) => ({ aiDrawerCollapsed: !state.aiDrawerCollapsed })),

      // Mobile menu
      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

      // Modals
      activeModal: null,
      modalData: null,
      openModal: (modalId, data) => set({ activeModal: modalId, modalData: data || null }),
      closeModal: () => set({ activeModal: null, modalData: null }),

      // Notifications
      unreadNotifications: 0,
      setUnreadNotifications: (count) => set({ unreadNotifications: count }),

      // Loading states
      globalLoading: false,
      setGlobalLoading: (loading) => set({ globalLoading: loading }),

      // Toast queue
      toasts: [],
      addToast: (toast) => {
        const id = generateId();
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }],
        }));
        
        // Auto-remove after duration (default 5 seconds)
        const duration = toast.duration || 5000;
        setTimeout(() => {
          get().removeToast(id);
        }, duration);
      },
      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },
      clearToasts: () => set({ toasts: [] }),
    }),
    {
      name: 'smartstore-ui-v3', // Changed key to reset localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        aiDrawerCollapsed: state.aiDrawerCollapsed,
        currentPage: state.currentPage,
      }),
      // Migrate old state to ensure aiDrawerCollapsed is true by default
      migrate: (persistedState: any, version: number) => {
        if (persistedState?.aiDrawerCollapsed === undefined) {
          return { ...persistedState, aiDrawerCollapsed: true };
        }
        if (persistedState?.currentPage === undefined) {
          return { ...persistedState, currentPage: 'dashboard' };
        }
        return persistedState;
      },
      version: 3, // Bump version to trigger migration
    }
  )
);

// Convenience hooks - Use individual selectors to avoid infinite loops
export const useLanguage = () => useUiStore((state) => state.language);
export const useTheme = () => useUiStore((state) => state.theme);

// Navigation hooks - split to avoid object reference issues
export const useCurrentPage = () => useUiStore((state) => state.currentPage);
export const usePageParams = () => useUiStore((state) => state.pageParams);
export const useNavigateTo = () => useUiStore((state) => state.navigateTo);

// Combined navigation hook using useShallow for stable references
export function useNavigation() {
  return useUiStore(useShallow((state) => ({
    currentPage: state.currentPage,
    pageParams: state.pageParams,
    navigateTo: state.navigateTo,
  })));
}

export const useSidebar = () => useUiStore(useShallow((state) => ({
  open: state.sidebarOpen,
  collapsed: state.sidebarCollapsed,
  toggle: state.toggleSidebar,
  setOpen: state.setSidebarOpen,
  setCollapsed: state.setSidebarCollapsed,
})));
export const useMobileMenu = () => useUiStore(useShallow((state) => ({
  open: state.mobileMenuOpen,
  setOpen: state.setMobileMenuOpen,
  toggle: state.toggleMobileMenu,
})));
export const useModal = () => useUiStore(useShallow((state) => ({
  activeModal: state.activeModal,
  data: state.modalData,
  open: state.openModal,
  close: state.closeModal,
})));
export const useToasts = () => useUiStore(useShallow((state) => ({
  toasts: state.toasts,
  add: state.addToast,
  remove: state.removeToast,
  clear: state.clearToasts,
})));
export const useAiDrawer = () => useUiStore(useShallow((state) => ({
  collapsed: state.aiDrawerCollapsed,
  setCollapsed: state.setAiDrawerCollapsed,
  toggle: state.toggleAiDrawer,
})));
