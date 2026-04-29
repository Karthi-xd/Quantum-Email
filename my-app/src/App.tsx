import { useEffect } from 'react';
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
  Security,
} from './components';
import type { Account } from './types';

const API_BASE = 'http://localhost:8000';

function EmailApp() {
  useKeyboardShortcuts();

  useEffect(() => {
    document.documentElement.className = 'theme-quantum font-medium';
  }, []);

  return (
    <div className="app-wrap">
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

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      const displayName = email.split('@')[0];
      const newAccount: Account = {
        id: crypto.randomUUID(),
        email,
        displayName,
        password,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        imapHost: 'imap.gmail.com',
        imapPort: 993,
      };
      addAccount(newAccount);
      setPage('app');
    } catch {
      alert('Login failed. Check your credentials or ensure the backend is running.');
    }
  };

  const handleRegisterSuccess = () => {
    setPage('login');
  };

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
