import { useEffect, useState } from 'react';
import './App.css';
import { useEmailStore } from './store/emailStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import {
  Background,
  Landing,
  Login,
  Register,
  Sidebar,
  EmailList,
  EmailDetail,
  Compose,
  AccountsModal,
  AccountSwitcher,
  ToastContainer,
  ShortcutsModal,
  CommandPalette,
  AboutQP,
  CustomCursor,
  Security,
} from './components';
import type { Account } from './types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

function EmailApp() {
  useKeyboardShortcuts();
  const refreshing = useEmailStore((s) => s.refreshing);
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    document.documentElement.className = 'theme-quantum font-medium';
  }, []);

  useEffect(() => {
    if (refreshing) {
      const t = setTimeout(() => setShowBar(true), 200);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShowBar(false), 0);
    return () => clearTimeout(t);
  }, [refreshing]);

  return (
    <div className="app-wrap">
      <div className={`refresh-bar ${showBar ? 'visible' : ''}`} />
      <div className="app">
        <Sidebar />
        <EmailList />
      </div>

      <EmailDetail />
      <Compose />
      <AccountsModal />
      <AccountSwitcher />
      <ToastContainer />
      <ShortcutsModal />
      <CommandPalette />
      <AboutQP />
      <Security />
    </div>
  );
}

export default function Root() {
  const { page, setPage, addAccount } = useEmailStore();

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.detail || 'Invalid credentials' };
      }

      const displayName = email.split('@')[0];
      const newAccount: Account = {
        id: '',
        email,
        displayName,
        password,
        token: data.token || '',
        kyberPub: data.kyber_pub || '',
        diliPub: data.dili_pub || '',
        x25519Pub: data.x25519_pub || '',
        ed25519Pub: data.ed25519_pub || '',
        fingerprint: data.fingerprint || '',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        imapHost: 'imap.gmail.com',
        imapPort: 993,
      };
      addAccount(newAccount);
      setPage('app');
      return { success: true };
    } catch {
      return { success: false, error: 'Login failed. Check your credentials or ensure the backend is running.' };
    }
  };

  const handleRegisterSuccess = (account: Account) => {
    addAccount(account);
    setPage('app');
  };

  useEffect(() => {
    const unsub = useEmailStore.persist.onFinishHydration(() => {
      const state = useEmailStore.getState();
      if (state.page === 'landing' && state.accounts.length > 0) {
        setPage('app');
      }
    });
    const state = useEmailStore.getState();
    if (state.accounts.length > 0 && state.page === 'landing') {
      setPage('app');
    }
    return unsub;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useEmailStore.getState().setSelectedEmail(null);
        useEmailStore.getState().clearCompose();
        useEmailStore.getState().setShowAccountSwitcher(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <CustomCursor />
      {page === 'landing' && <Landing onEnter={() => setPage('login')} />}
      {page === 'login' && <Login onLogin={handleLogin} onGoToRegister={() => setPage('register')} />}
      {page === 'register' && <Register onRegisterSuccess={handleRegisterSuccess} onGoToLogin={() => setPage('login')} />}
      {page === 'app' && (
        <>
          <Background />
          <EmailApp />
        </>
      )}
    </>
  );
}