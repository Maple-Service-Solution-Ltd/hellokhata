// Hello Khata OS - Audit Trail Store
// হ্যালো খাতা - অডিট ট্রেইল স্টোর

import { create } from 'zustand';
import type { AuditLog, AuditAction, AuditEntity, AuditLogFilter } from '@/types';

interface AuditState {
  // State
  logs: AuditLog[];
  selectedLog: AuditLog | null;
  isLoading: boolean;
  filter: AuditLogFilter;
  totalCount: number;

  // Actions
  setLogs: (logs: AuditLog[]) => void;
  addLog: (log: AuditLog) => void;
  setSelectedLog: (log: AuditLog | null) => void;
  setLoading: (loading: boolean) => void;
  setFilter: (filter: Partial<AuditLogFilter>) => void;
  clearFilter: () => void;
  setTotalCount: (count: number) => void;
  
  // Helpers
  getLogsByEntity: (entity: AuditEntity, entityId: string) => AuditLog[];
  getLogsByUser: (userId: string) => AuditLog[];
}

const defaultFilter: AuditLogFilter = {
  startDate: '',
  endDate: '',
};

export const useAuditStore = create<AuditState>()((set, get) => ({
  // Initial state
  logs: [],
  selectedLog: null,
  isLoading: false,
  filter: defaultFilter,
  totalCount: 0,

  // Actions
  setLogs: (logs) => {
    set({ logs });
  },

  addLog: (log) => {
    set((state) => ({
      logs: [log, ...state.logs],
      totalCount: state.totalCount + 1,
    }));
  },

  setSelectedLog: (log) => {
    set({ selectedLog: log });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setFilter: (filter) => {
    set((state) => ({
      filter: { ...state.filter, ...filter },
    }));
  },

  clearFilter: () => {
    set({ filter: defaultFilter });
  },

  setTotalCount: (count) => {
    set({ totalCount: count });
  },

  // Helpers
  getLogsByEntity: (entity, entityId) => {
    return get().logs.filter(
      (log) => log.entity === entity && log.entityId === entityId
    );
  },

  getLogsByUser: (userId) => {
    return get().logs.filter((log) => log.userId === userId);
  },
}));

// Helper hooks
export const useAuditLogs = () => useAuditStore((state) => state.logs);
export const useAuditFilter = () => useAuditStore((state) => state.filter);

// Audit logging helper function
export function createAuditLog(
  userId: string,
  userName: string,
  businessId: string,
  action: AuditAction,
  entity: AuditEntity,
  entityId: string,
  entityName?: string,
  oldValue?: Record<string, unknown>,
  newValue?: Record<string, unknown>,
  branchId?: string
): AuditLog {
  const changes: { field: string; fieldLabel: string; oldValue: unknown; newValue: unknown }[] = [];
  
  if (oldValue && newValue) {
    const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
    allKeys.forEach((key) => {
      if (oldValue[key] !== newValue[key]) {
        changes.push({
          field: key,
          fieldLabel: key, // Should be translated
          oldValue: oldValue[key],
          newValue: newValue[key],
        });
      }
    });
  }

  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    businessId,
    branchId,
    userId,
    userName,
    action,
    entity,
    entityId,
    entityName,
    oldValue,
    newValue,
    changes,
    createdAt: new Date(),
  };
}
