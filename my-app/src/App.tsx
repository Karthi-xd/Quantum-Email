import { useEffect } from 'react';
import './App.css';
import { useEmailStore } from './store/emailStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import {
  Background,
  Landing,
  Login,
  Sidebar,
  EmailList,
  EmailDetail,
  Compose,
  AccountsModal,
  AccountSwitcher,
  ToastContainer,
  ShortcutsModal,
  CommandPalette,
  QuantumParticles,
} from './components';
import type { Account } from './types';

function EmailApp() {
  useKeyboardShortcuts();

  return (
    <div className="app-wrap">
      <Background />
      <QuantumParticles />

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
    </div>
  );
}

export default function Root() {
  const { page, setPage, addAccount } = useEmailStore();

  const handleLogin = (email: string, password: string) => {
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

  if (page === 'landing') {
    return <Landing onEnter={() => setPage('login')} />;
  }

  if (page === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  return <EmailApp />;
}
