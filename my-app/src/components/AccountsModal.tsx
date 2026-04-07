import { useState } from 'react';
import { useEmailStore } from '../store/emailStore';
import type { Account } from '../types';

export function AccountsModal() {
  const {
    showAccounts,
    setShowAccounts,
    accounts,
    activeAccount,
    switchAccount,
    removeAccount,
    logout,
  } = useEmailStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState({
    email: '',
    displayName: '',
    password: '',
  });

  if (!showAccounts) return null;

  const handleAddAccount = () => {
    if (!addFormData.email || !addFormData.password) return;

    const newAccount: Account = {
      id: crypto.randomUUID(),
      email: addFormData.email,
      displayName: addFormData.displayName || addFormData.email.split('@')[0],
      password: addFormData.password,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      imapHost: 'imap.gmail.com',
      imapPort: 993,
    };

    const { addAccount } = useEmailStore.getState();
    addAccount(newAccount);
    setShowAddForm(false);
    setAddFormData({ email: '', displayName: '', password: '' });
  };

  const handleRemoveAccount = (accountId: string) => {
    removeAccount(accountId);
  };

  return (
    <div className="compose-modal glass">
      <div className="compose-head">
        <h3>Accounts</h3>
        <button className="close-btn" onClick={() => setShowAccounts(false)}>
          ×
        </button>
      </div>

      <div className="accounts-list">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className={`account-item ${activeAccount?.id === acc.id ? 'active' : ''}`}
          >
            <div className="account-info" onClick={() => switchAccount(acc)}>
              <span className="account-avatar" style={{ background: acc.color }}>
                {acc.email[0].toUpperCase()}
              </span>
              <div className="account-details">
                <span className="account-email">{acc.email}</span>
                {acc.displayName && (
                  <span className="account-name">{acc.displayName}</span>
                )}
              </div>
              {activeAccount?.id === acc.id && (
                <span className="active-indicator">●</span>
              )}
            </div>
            {accounts.length > 1 && (
              <button
                className="account-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveAccount(acc.id);
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}

        {showAddForm ? (
          <div className="add-account-form">
            <input
              type="text"
              placeholder="Display Name (optional)"
              value={addFormData.displayName}
              onChange={(e) =>
                setAddFormData((prev) => ({ ...prev, displayName: e.target.value }))
              }
              className="compose-input"
            />
            <input
              type="email"
              placeholder="Email address"
              value={addFormData.email}
              onChange={(e) =>
                setAddFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              className="compose-input"
            />
            <input
              type="password"
              placeholder="Password / App Password"
              value={addFormData.password}
              onChange={(e) =>
                setAddFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              className="compose-input"
            />
            <div className="add-account-actions">
              <button className="btn-prime" onClick={handleAddAccount}>
                Add Account
              </button>
              <button
                className="btn-ghost"
                onClick={() => {
                  setShowAddForm(false);
                  setAddFormData({ email: '', displayName: '', password: '' });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="add-account-btn"
            onClick={() => setShowAddForm(true)}
          >
            + Add Another Account
          </button>
        )}
      </div>

      <div className="compose-actions">
        <button className="btn-danger sm" onClick={logout}>
          Sign Out
        </button>
        <button className="btn-ghost" onClick={() => setShowAccounts(false)}>
          Close
        </button>
      </div>
    </div>
  );
}

export function AccountSwitcher() {
  const {
    showAccountSwitcher,
    setShowAccountSwitcher,
    accounts,
    activeAccount,
    switchAccount,
  } = useEmailStore();

  if (!showAccountSwitcher) return null;

  return (
    <div className="account-switcher-overlay" onClick={() => setShowAccountSwitcher(false)}>
      <div className="account-switcher glass" onClick={(e) => e.stopPropagation()}>
        <div className="switcher-header">
          <span className="switcher-title">Switch Account</span>
          <button
            className="close-btn"
            onClick={() => setShowAccountSwitcher(false)}
          >
            ×
          </button>
        </div>
        <div className="switcher-accounts">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className={`switcher-account ${activeAccount?.id === acc.id ? 'active' : ''}`}
              onClick={() => {
                switchAccount(acc);
                setShowAccountSwitcher(false);
              }}
            >
              <span className="account-avatar" style={{ background: acc.color }}>
                {acc.email[0].toUpperCase()}
              </span>
              <div className="account-info">
                <span className="account-email">{acc.email}</span>
                {acc.displayName && (
                  <span className="account-name">{acc.displayName}</span>
                )}
              </div>
              {activeAccount?.id === acc.id && (
                <span className="active-check">✓</span>
              )}
            </div>
          ))}
        </div>
        <button
          className="manage-accounts-btn"
          onClick={() => {
            setShowAccountSwitcher(false);
            useEmailStore.getState().setShowAccounts(true);
          }}
        >
          Manage Accounts
        </button>
      </div>
    </div>
  );
}
