import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Email, Account, Page } from '../types';

interface EmailStore {
  page: Page;
  activeCategory: string;
  selectedEmail: Email | null;
  emails: Record<string, Email[]>;
  composing: boolean;
  showAccounts: boolean;
  showAccountSwitcher: boolean;
  showShortcuts: boolean;
  showCommandPalette: boolean;
  showEmailDetail: boolean;
  showAboutQP: boolean;
  showPreferences: boolean;
  showSecurity: boolean;
  accounts: Account[];
  activeAccount: Account | null;
  composeData: { to: string; subject: string; body: string };
  searchQuery: string;
  refreshing: boolean;
  preferences: {
    notifications: boolean;
    soundEffects: boolean;
    compactMode: boolean;
    quantumAnimations: boolean;
    autoSave: boolean;
    confirmDelete: boolean;
    previewPane: boolean;
    fontSize: 'small' | 'medium' | 'large';
    theme: 'quantum' | 'classic' | 'minimal';
  };
  security: {
    quantumEncryption: boolean;
    twoFactor: boolean;
    autoLock: boolean;
    autoLockTime: number;
  };
  
  setPage: (page: Page) => void;
  setActiveCategory: (category: string) => void;
  setSelectedEmail: (email: Email | null) => void;
  markAsRead: (emailId: string) => void;
  deleteEmail: (emailId: string) => void;
  setComposing: (composing: boolean) => void;
  setShowAccounts: (show: boolean) => void;
  setShowAccountSwitcher: (show: boolean) => void;
  setShowShortcuts: (show: boolean) => void;
  setShowCommandPalette: (show: boolean) => void;
  setShowEmailDetail: (show: boolean) => void;
  setShowAboutQP: (show: boolean) => void;
  setShowPreferences: (show: boolean) => void;
  setShowSecurity: (show: boolean) => void;
  setPreference: <K extends keyof EmailStore['preferences']>(key: K, value: EmailStore['preferences'][K]) => void;
  setSecurity: <K extends keyof EmailStore['security']>(key: K, value: EmailStore['security'][K]) => void;
  updatePassword: (currentPassword: string, newPassword: string) => boolean;
  updateAccount: (account: Account) => void;
  addAccount: (account: Account) => void;
  removeAccount: (accountId: string) => void;
  switchAccount: (account: Account) => void;
  setActiveAccount: (account: Account | null) => void;
  setComposeData: (data: Partial<{ to: string; subject: string; body: string }>) => void;
  clearCompose: () => void;
  addSentEmail: (email: Email) => void;
  setEmails: (emails: Record<string, Email[]>) => void;
  setSearchQuery: (query: string) => void;
  setRefreshing: (refreshing: boolean) => void;
  logout: () => void;
  clearAllData: () => void;
}

const AVATAR_COLORS = [
  'linear-gradient(135deg, #00aaff, #00e5ff)',
  'linear-gradient(135deg, #ff2d78, #ff6b9d)',
  'linear-gradient(135deg, #00ff88, #00cc66)',
  'linear-gradient(135deg, #aa00ff, #cc66ff)',
  'linear-gradient(135deg, #ffaa00, #ff8800)',
];

export const useEmailStore = create<EmailStore>()(
  persist(
    (set, get) => ({
      page: 'landing',
      activeCategory: 'inbox',
      selectedEmail: null,
      emails: {},
      composing: false,
      showAccounts: false,
      showAccountSwitcher: false,
      showShortcuts: false,
      showCommandPalette: false,
      showEmailDetail: false,
      showAboutQP: false,
      showPreferences: false,
      showSecurity: false,
      accounts: [],
      activeAccount: null,
      composeData: { to: '', subject: '', body: '' },
      searchQuery: '',
      refreshing: false,
      preferences: {
        notifications: true,
        soundEffects: false,
        compactMode: false,
        quantumAnimations: true,
        autoSave: true,
        confirmDelete: true,
        previewPane: true,
        fontSize: 'medium',
        theme: 'quantum',
      },
      security: {
        quantumEncryption: true,
        twoFactor: false,
        autoLock: true,
        autoLockTime: 5,
      },

      setPage: (page) => set({ page }),

      setActiveCategory: (category) => {
        set({ activeCategory: category, selectedEmail: null });
      },

      setSelectedEmail: (email) => {
        if (email) {
          get().markAsRead(email.id);
        }
        set({ selectedEmail: email });
      },

      markAsRead: (emailId) => {
        set((state) => {
          const next: Record<string, Email[]> = {};
          for (const k in state.emails) {
            next[k] = state.emails[k].map((e) =>
              e.id === emailId ? { ...e, read: true } : e
            );
          }
          return { emails: next };
        });
      },

      deleteEmail: (emailId) => {
        set((state) => {
          const next: Record<string, Email[]> = {};
          for (const k in state.emails) {
            next[k] = state.emails[k].filter((e) => e.id !== emailId);
          }
          return { emails: next, selectedEmail: null };
        });
      },

      setComposing: (composing) => set({ composing }),

      setShowAccounts: (show) => set({ showAccounts: show }),

      setShowAccountSwitcher: (show) => set({ showAccountSwitcher: show }),

      setShowShortcuts: (show) => set({ showShortcuts: show }),

      setShowCommandPalette: (show) => set({ showCommandPalette: show }),

      setShowEmailDetail: (show) => set({ showEmailDetail: show }),

      setShowAboutQP: (show) => set({ showAboutQP: show }),

      setShowPreferences: (show) => set({ showPreferences: show }),

      setShowSecurity: (show) => set({ showSecurity: show }),

      setPreference: (key, value) =>
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        })),

      setSecurity: (key, value) =>
        set((state) => ({
          security: { ...state.security, [key]: value },
        })),

      updatePassword: (currentPassword, newPassword) => {
        const state = get();
        if (!state.activeAccount) return false;
        if (currentPassword !== state.activeAccount.password) return false;
        const updatedAccount = { ...state.activeAccount, password: newPassword };
        const updatedAccounts = state.accounts.map(a =>
          a.id === updatedAccount.id ? updatedAccount : a
        );
        set({ activeAccount: updatedAccount, accounts: updatedAccounts });
        return true;
      },

      updateAccount: (updatedAccount) => {
        const state = get();
        const updatedAccounts = state.accounts.map(a =>
          a.id === updatedAccount.id ? updatedAccount : a
        );
        const updatedActive = state.activeAccount?.id === updatedAccount.id
          ? updatedAccount
          : state.activeAccount;
        set({ accounts: updatedAccounts, activeAccount: updatedActive });
      },

      addAccount: (account) => {
        const existing = get().accounts.find((a) => a.email === account.email);
        if (existing) {
          set({ activeAccount: existing });
          return;
        }
        const colorIndex = get().accounts.length % AVATAR_COLORS.length;
        const newAccount: Account = {
          ...account,
          id: crypto.randomUUID(),
          color: AVATAR_COLORS[colorIndex],
        };
        set((state) => ({
          accounts: [...state.accounts, newAccount],
          activeAccount: state.activeAccount || newAccount,
        }));
      },

      removeAccount: (accountId) => {
        const state = get();
        const remaining = state.accounts.filter((a) => a.id !== accountId);
        let newActive = state.activeAccount;
        if (state.activeAccount?.id === accountId) {
          newActive = remaining.length > 0 ? remaining[0] : null;
        }
        set({
          accounts: remaining,
          activeAccount: newActive,
        });
      },

      switchAccount: (account) => {
        set({ activeAccount: account });
      },

      setActiveAccount: (account) => set({ activeAccount: account }),

      setComposeData: (data) =>
        set((state) => ({
          composeData: { ...state.composeData, ...data },
        })),

      clearCompose: () =>
        set({ composeData: { to: '', subject: '', body: '' }, composing: false }),

      addSentEmail: (email) =>
        set((state) => ({
          emails: {
            ...state.emails,
            inbox: state.emails.inbox || [],
            sent: [email, ...(state.emails.sent || [])],
          },
        })),

      setEmails: (emails) => set({ emails }),

      setSearchQuery: (query) => set({ searchQuery: query }),
      setRefreshing: (refreshing) => set({ refreshing }),

      logout: () =>
        set({
          page: 'landing',
          activeCategory: 'inbox',
          selectedEmail: null,
          composing: false,
          showAccounts: false,
          showAccountSwitcher: false,
          showPreferences: false,
          showSecurity: false,
          composeData: { to: '', subject: '', body: '' },
          searchQuery: '',
        }),

      clearAllData: () => {
        localStorage.clear();
        window.location.reload();
      },
    }),
    {
      name: 'qmail-storage',
      partialize: (state) => {
        // Never write passwords to localStorage in plain text — strip them
        // before persisting. They're kept in memory only and have to be
        // re-entered after a page reload.
        const stripSecrets = (acc: typeof state.activeAccount) => {
          if (!acc) return acc;
          const { password: _password, smtpPassword: _smtpPassword, ...rest } = acc;
          return rest;
        };
        return {
          accounts: state.accounts.map(stripSecrets),
          activeAccount: stripSecrets(state.activeAccount),
          emails: state.emails,
          preferences: state.preferences,
          security: state.security,
        };
      },
    }
  )
);

export const getUnreadCount = (emails: Record<string, Email[]>, key: string) => {
  if (key === 'all') {
    return Object.values(emails).flat().filter((e) => !e.read).length;
  }
  return emails[key]?.filter((e) => !e.read).length || 0;
};

export const getFilteredEmails = (emails: Email[], query: string) => {
  if (!query.trim()) return emails;
  const q = query.toLowerCase();
  return emails.filter(
    (e) =>
      e.from.toLowerCase().includes(q) ||
      e.subject.toLowerCase().includes(q) ||
      e.preview.toLowerCase().includes(q)
  );
};