// Hello Khata OS - Account Store
// হ্যালো খাতা - অ্যাকাউন্ট স্টোর

import { create } from 'zustand';
import type { Account, AccountTransaction, AccountTransfer, ReconciliationRecord } from '@/types';

interface AccountState {
  // State
  accounts: Account[];
  transactions: AccountTransaction[];
  transfers: AccountTransfer[];
  selectedAccount: Account | null;
  isLoading: boolean;

  // Computed
  totalCashBalance: number;
  totalBankBalance: number;
  totalBalance: number;

  // Actions
  setAccounts: (accounts: Account[]) => void;
  addAccount: (account: Account) => void;
  updateAccount: (id: string, data: Partial<Account>) => void;
  removeAccount: (id: string) => void;
  setSelectedAccount: (account: Account | null) => void;
  setTransactions: (transactions: AccountTransaction[]) => void;
  addTransaction: (transaction: AccountTransaction) => void;
  setTransfers: (transfers: AccountTransfer[]) => void;
  addTransfer: (transfer: AccountTransfer) => void;
  setLoading: (loading: boolean) => void;
  recalculateBalances: () => void;
}

export const useAccountStore = create<AccountState>()((set, get) => ({
  // Initial state
  accounts: [],
  transactions: [],
  transfers: [],
  selectedAccount: null,
  isLoading: false,
  totalCashBalance: 0,
  totalBankBalance: 0,
  totalBalance: 0,

  // Actions
  setAccounts: (accounts) => {
    set({ accounts });
    get().recalculateBalances();
  },

  addAccount: (account) => {
    set((state) => ({
      accounts: [...state.accounts, account],
    }));
    get().recalculateBalances();
  },

  updateAccount: (id, data) => {
    set((state) => {
      const updatedAccounts = state.accounts.map((a) =>
        a.id === id ? { ...a, ...data, updatedAt: new Date() } : a
      );
      const selectedAccount = state.selectedAccount?.id === id
        ? updatedAccounts.find(a => a.id === id) || state.selectedAccount
        : state.selectedAccount;
      return {
        accounts: updatedAccounts,
        selectedAccount,
      };
    });
    get().recalculateBalances();
  },

  removeAccount: (id) => {
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
      selectedAccount: state.selectedAccount?.id === id ? null : state.selectedAccount,
    }));
    get().recalculateBalances();
  },

  setSelectedAccount: (account) => {
    set({ selectedAccount: account });
  },

  setTransactions: (transactions) => {
    set({ transactions });
  },

  addTransaction: (transaction) => {
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    }));
    // Update account balance
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === transaction.accountId
          ? { ...a, currentBalance: transaction.balance }
          : a
      ),
    }));
    get().recalculateBalances();
  },

  setTransfers: (transfers) => {
    set({ transfers });
  },

  addTransfer: (transfer) => {
    set((state) => ({
      transfers: [transfer, ...state.transfers],
    }));
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  recalculateBalances: () => {
    const { accounts } = get();
    const cashAccounts = accounts.filter(a => a.type === 'cash');
    const bankAccounts = accounts.filter(a => a.type === 'bank' || a.type === 'mobile_wallet');

    const totalCashBalance = cashAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
    const totalBankBalance = bankAccounts.reduce((sum, a) => sum + a.currentBalance, 0);

    set({
      totalCashBalance,
      totalBankBalance,
      totalBalance: totalCashBalance + totalBankBalance,
    });
  },
}));

// Helper hooks
export const useAccounts = () => useAccountStore((state) => state.accounts);
export const useCashAccounts = () => useAccountStore((state) => 
  state.accounts.filter(a => a.type === 'cash')
);
export const useBankAccounts = () => useAccountStore((state) => 
  state.accounts.filter(a => a.type === 'bank' || a.type === 'mobile_wallet')
);
export const useTotalBalance = () => useAccountStore((state) => state.totalBalance);
