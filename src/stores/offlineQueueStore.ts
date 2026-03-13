// Hello Khata OS - Offline Queue Store
// হ্যালো খাতা - অফলাইন কিউ স্টোর

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { QueuedMutation } from '@/types';

interface OfflineQueueState {
  // Queue state
  queue: QueuedMutation[];
  isOnline: boolean;
  isSyncing: boolean;
  syncProgress: number;
  lastSyncTime: Date | null;
  pendingCount: number;
  
  // Actions
  addToQueue: (mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retries' | 'status'>) => string;
  updateMutation: (id: string, updates: Partial<QueuedMutation>) => void;
  removeMutation: (id: string) => void;
  clearQueue: () => void;
  
  // Sync actions
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setSyncProgress: (progress: number) => void;
  setLastSyncTime: (time: Date) => void;
  
  // Retry actions
  incrementRetries: (id: string) => void;
  getPendingMutations: () => QueuedMutation[];
  getFailedMutations: () => QueuedMutation[];
}

// Generate unique ID
const generateId = () => `mutation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      // Initial state
      queue: [],
      isOnline: true,
      isSyncing: false,
      syncProgress: 0,
      lastSyncTime: null,
      pendingCount: 0,

      // Actions
      addToQueue: (mutation) => {
        const id = generateId();
        const newMutation: QueuedMutation = {
          ...mutation,
          id,
          timestamp: new Date(),
          retries: 0,
          status: 'pending',
        };
        
        set((state) => ({
          queue: [...state.queue, newMutation],
          pendingCount: state.pendingCount + 1,
        }));
        
        return id;
      },

      updateMutation: (id, updates) => {
        set((state) => ({
          queue: state.queue.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        }));
      },

      removeMutation: (id) => {
        set((state) => {
          const mutation = state.queue.find((m) => m.id === id);
          return {
            queue: state.queue.filter((m) => m.id !== id),
            pendingCount: mutation?.status === 'pending' 
              ? state.pendingCount - 1 
              : state.pendingCount,
          };
        });
      },

      clearQueue: () => {
        set({
          queue: [],
          pendingCount: 0,
          syncProgress: 0,
        });
      },

      // Sync actions
      setOnline: (online) => set({ isOnline: online }),

      setSyncing: (syncing) => set({ isSyncing: syncing }),

      setSyncProgress: (progress) => set({ syncProgress: progress }),

      setLastSyncTime: (time) => set({ lastSyncTime: time }),

      // Retry actions
      incrementRetries: (id) => {
        set((state) => ({
          queue: state.queue.map((m) =>
            m.id === id ? { ...m, retries: m.retries + 1 } : m
          ),
        }));
      },

      getPendingMutations: () => {
        return get().queue.filter((m) => m.status === 'pending');
      },

      getFailedMutations: () => {
        return get().queue.filter((m) => m.status === 'failed');
      },
    }),
    {
      name: 'smartstore-offline-queue',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        queue: state.queue,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);

// Hook for checking if offline mutations exist
export const useHasPendingMutations = () => 
  useOfflineQueueStore((state) => state.pendingCount > 0);

// Hook for getting pending count
export const usePendingCount = () => 
  useOfflineQueueStore((state) => state.pendingCount);

// Hook for online status
export const useIsOnline = () => 
  useOfflineQueueStore((state) => state.isOnline);

// Hook for sync status
export const useSyncStatus = () => 
  useOfflineQueueStore((state) => ({
    isSyncing: state.isSyncing,
    progress: state.syncProgress,
    lastSync: state.lastSyncTime,
  }));
