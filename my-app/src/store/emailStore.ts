import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Email, Account, Page } from '../types';
import { generateMockEmails } from '../data/mockEmails';

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
  accounts: Account[];
  activeAccount: Account | null;
  composeData: { to: string; subject: string; body: string };
  searchQuery: string;
  
  setPage: (page: Page) => void;
  setActiveCategory: (category: string) => void;
  setSelectedEmail: (email: Email | null) => void;
  markAsRead: (emailId: number) => void;
  deleteEmail: (emailId: number) => void;
  setComposing: (composing: boolean) => void;
  setShowAccounts: (show: boolean) => void;
  setShowAccountSwitcher: (show: boolean) => void;
  setShowShortcuts: (show: boolean) => void;
  setShowCommandPalette: (show: boolean) => void;
  setShowEmailDetail: (show: boolean) => void;
  setShowAboutQP: (show: boolean) => void;
  addAccount: (account: Account) => void;
  removeAccount: (accountId: string) => void;
  switchAccount: (account: Account) => void;
  setActiveAccount: (account: Account | null) => void;
  setComposeData: (data: Partial<{ to: string; subject: string; body: string }>) => void;
  clearCompose: () => void;
  addSentEmail: (email: Email) => void;
  setSearchQuery: (query: string) => void;
  logout: () => void;
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
      emails: generateMockEmails(),
      composing: false,
      showAccounts: false,
      showAccountSwitcher: false,
      showShortcuts: false,
      showCommandPalette: false,
      showEmailDetail: false,
      showAboutQP: false,
      accounts: [],
      activeAccount: null,
      composeData: { to: '', subject: '', body: '' },
      searchQuery: '',

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

      addAccount: (account) => {
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
            sent: [email, ...state.emails.sent],
          },
        })),

      setSearchQuery: (query) => set({ searchQuery: query }),

      logout: () =>
        set({
          page: 'landing',
          activeCategory: 'inbox',
          selectedEmail: null,
          composing: false,
          showAccounts: false,
          showAccountSwitcher: false,
          composeData: { to: '', subject: '', body: '' },
          searchQuery: '',
        }),
    }),
    {
      name: 'qmail-storage',
      partialize: (state) => ({
        accounts: state.accounts,
        activeAccount: state.activeAccount,
        emails: state.emails,
      }),
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
