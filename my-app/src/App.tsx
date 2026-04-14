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
  AboutQP,
  CustomCursor,
} from './components';
import type { Account } from './types';

function EmailApp() {
  useKeyboardShortcuts();

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

  return (
    <>
      <CustomCursor />
      {page === 'landing' && <Landing onEnter={() => setPage('login')} />}
      {page === 'login' && <Login onLogin={handleLogin} />}
      {page === 'app' && (
        <>
          <Background />
          <QuantumParticles />
          <EmailApp />
        </>
      )}
    </>
  );
}
