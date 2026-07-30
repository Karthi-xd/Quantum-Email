import { useState, useEffect } from 'react';
import { useEmailStore } from '../store/emailStore';
import { toast } from '../store/toastStore';
import type { Account } from '../types';
import './AccountsModal.css';
import './Compose.css';
import './Buttons.css';

export function AccountsModal() {
  const {
    showAccounts,
    setShowAccounts,
    accounts,
    activeAccount,
    switchAccount,
    removeAccount,
    logout,
    addAccount,
    updateAccount,
  } = useEmailStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [addFormData, setAddFormData] = useState({
    email: '',
    displayName: '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    imapHost: 'imap.gmail.com',
    imapPort: '993',
    password: '',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAccounts(false);
        setShowAddForm(false);
        setEditingAccount(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setShowAccounts]);

  if (!showAccounts) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowAccounts(false);
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAddAccount = () => {
    setFormError('');
    
    if (!addFormData.email || !addFormData.password) {
      setFormError('Email and password are required');
      return;
    }
    
    if (!validateEmail(addFormData.email)) {
      setFormError('Please enter a valid email address');
      return;
    }

    if (addFormData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    const newAccount: Account = {
      id: crypto.randomUUID(),
      email: addFormData.email,
      displayName: addFormData.displayName || addFormData.email.split('@')[0],
      password: addFormData.password,
      smtpPassword: addFormData.password,
      smtpHost: addFormData.smtpHost || 'smtp.gmail.com',
      smtpPort: parseInt(addFormData.smtpPort) || 587,
      imapHost: addFormData.imapHost || 'imap.gmail.com',
      imapPort: parseInt(addFormData.imapPort) || 993,
    };

    addAccount(newAccount);
    toast.success(`Node "${newAccount.displayName}" connected successfully`);
    setShowAddForm(false);
    setAddFormData({
      email: '',
      displayName: '',
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      imapHost: 'imap.gmail.com',
      imapPort: '993',
      password: '',
    });
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setAddFormData({
      email: account.email,
      displayName: account.displayName,
      smtpHost: account.smtpHost,
      smtpPort: String(account.smtpPort),
      imapHost: account.imapHost,
      imapPort: String(account.imapPort),
      password: account.password || '',
    });
  };

  const handleSaveEdit = () => {
    if (!editingAccount) return;
    
    setFormError('');
    
    if (!addFormData.email || !validateEmail(addFormData.email)) {
      setFormError('Please enter a valid email address');
      return;
    }

    const updatedAccount: Account = {
      ...editingAccount,
      email: addFormData.email,
      displayName: addFormData.displayName || addFormData.email.split('@')[0],
      password: addFormData.password || editingAccount.password,
      smtpPassword: addFormData.password || editingAccount.smtpPassword || editingAccount.password || '',
      smtpHost: addFormData.smtpHost,
      smtpPort: parseInt(addFormData.smtpPort) || 587,
      imapHost: addFormData.imapHost,
      imapPort: parseInt(addFormData.imapPort) || 993,
    };

    updateAccount(updatedAccount);
    toast.success('Node configuration updated');
    setEditingAccount(null);
    setAddFormData({
      email: '',
      displayName: '',
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      imapHost: 'imap.gmail.com',
      imapPort: '993',
      password: '',
    });
  };

  const handleRemoveAccount = (accountId: string, accountEmail: string) => {
    removeAccount(accountId);
    toast.info(`Node "${accountEmail}" disconnected`);
  };

  const handleSignOut = () => {
    logout();
    setShowAccounts(false);
    toast.info('All nodes disconnected');
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingAccount(null);
    setFormError('');
    setAddFormData({
      email: '',
      displayName: '',
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      imapHost: 'imap.gmail.com',
      imapPort: '993',
      password: '',
    });
  };

  const renderForm = () => (
    <div className="add-account-form">
      <div className="form-field-row">
        <div className="form-field">
          <label>Display Name</label>
          <input
            type="text"
            placeholder="Quantum User"
            value={addFormData.displayName}
            onChange={(e) =>
              setAddFormData((prev) => ({ ...prev, displayName: e.target.value }))
            }
            className="compose-input"
          />
        </div>
      </div>
      
      <div className="form-field">
        <label>Email Address *</label>
        <input
          type="email"
          placeholder="user@quantum.node"
          value={addFormData.email}
          onChange={(e) =>
            setAddFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          className="compose-input"
          aria-required="true"
        />
      </div>

      <div className="form-field">
        <label>{editingAccount ? 'New Password' : 'Password / App Password'} *</label>
        <input
          type="password"
          placeholder={editingAccount ? 'Leave blank to keep current' : 'Enter password or app password'}
          value={addFormData.password}
          onChange={(e) =>
            setAddFormData((prev) => ({ ...prev, password: e.target.value }))
          }
          className="compose-input"
          aria-required={!editingAccount}
        />
      </div>

      <div className="form-field-row">
        <div className="form-field">
          <label>SMTP Host</label>
          <input
            type="text"
            placeholder="smtp.gmail.com"
            value={addFormData.smtpHost}
            onChange={(e) =>
              setAddFormData((prev) => ({ ...prev, smtpHost: e.target.value }))
            }
            className="compose-input sm"
          />
        </div>
        <div className="form-field">
          <label>SMTP Port</label>
          <input
            type="number"
            placeholder="587"
            value={addFormData.smtpPort}
            onChange={(e) =>
              setAddFormData((prev) => ({ ...prev, smtpPort: e.target.value }))
            }
            className="compose-input sm"
          />
        </div>
      </div>

      <div className="form-field-row">
        <div className="form-field">
          <label>IMAP Host</label>
          <input
            type="text"
            placeholder="imap.gmail.com"
            value={addFormData.imapHost}
            onChange={(e) =>
              setAddFormData((prev) => ({ ...prev, imapHost: e.target.value }))
            }
            className="compose-input sm"
          />
        </div>
        <div className="form-field">
          <label>IMAP Port</label>
          <input
            type="number"
            placeholder="993"
            value={addFormData.imapPort}
            onChange={(e) =>
              setAddFormData((prev) => ({ ...prev, imapPort: e.target.value }))
            }
            className="compose-input sm"
          />
        </div>
      </div>

      {formError && <div className="form-error">{formError}</div>}

      <div className="add-account-actions">
        <button className="btn-prime" onClick={editingAccount ? handleSaveEdit : handleAddAccount}>
          {editingAccount ? 'Save Changes' : 'Connect Node'}
        </button>
        <button className="btn-ghost" onClick={handleCancelForm}>
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="accounts-modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="accounts-title">
      <div className="accounts-modal glass">
        <div className="accounts-modal-header">
          <div className="accounts-title-row">
            <span className="accounts-icon">⚙</span>
            <h2 id="accounts-title">Node Management</h2>
          </div>
          <button className="close-btn" onClick={() => setShowAccounts(false)} aria-label="Close">
            ×
          </button>
        </div>

        <div className="accounts-modal-content">
          {showAddForm || editingAccount ? (
            renderForm()
          ) : (
            <>
              <div className="accounts-list-header">
                <span className="accounts-section-title">Connected Nodes</span>
                <span className="accounts-count">{accounts.length}</span>
              </div>

              <div className="accounts-list" role="list">
                {accounts.length > 0 ? (
                  accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className={`account-item ${activeAccount?.id === acc.id ? 'active' : ''}`}
                      role="listitem"
                    >
                      <div 
                        className="account-info" 
                        onClick={() => switchAccount(acc)} 
                        role="button" 
                        tabIndex={0} 
                        onKeyDown={(e) => e.key === 'Enter' && switchAccount(acc)}
                      >
                        <span className="account-avatar" style={{ background: acc.color }}>
                          {acc.email[0].toUpperCase()}
                        </span>
                        <div className="account-details">
                          <span className="account-email">{acc.email}</span>
                          <span className="account-name">{acc.displayName}</span>
                          <span className="account-host">{acc.smtpHost}:{acc.smtpPort}</span>
                        </div>
                        {activeAccount?.id === acc.id && (
                          <span className="active-badge">Active</span>
                        )}
                      </div>
                      <div className="account-actions">
                        <button
                          className="account-action-btn"
                          onClick={() => handleEditAccount(acc)}
                          title="Edit node configuration"
                        >
                          ✎
                        </button>
                        {accounts.length > 1 && (
                          <button
                            className="account-action-btn danger"
                            onClick={() => handleRemoveAccount(acc.id, acc.email)}
                            aria-label={`Remove account ${acc.email}`}
                            title="Disconnect node"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-accounts">
                    <span className="no-accounts-icon">◈</span>
                    <span>No nodes connected</span>
                  </div>
                )}
              </div>

              <button
                className="add-account-btn full-width"
                onClick={() => setShowAddForm(true)}
              >
                <span className="btn-icon">+</span>
                Connect New Node
              </button>
            </>
          )}
        </div>

        <div className="accounts-modal-footer">
          <button 
            className="btn-danger sm" 
            onClick={handleSignOut}
            disabled={accounts.length === 0}
          >
            Disconnect All
          </button>
          <button className="btn-ghost" onClick={() => setShowAccounts(false)}>
            Done
          </button>
        </div>
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
    setShowAccounts,
    logout,
  } = useEmailStore();

  if (!showAccountSwitcher) return null;

  const handleSwitchAccount = (acc: Account) => {
    switchAccount(acc);
    setShowAccountSwitcher(false);
    toast.success(`Switched to ${acc.displayName}`);
  };

  const handleSignOut = () => {
    logout();
    setShowAccountSwitcher(false);
  };

  return (
    <div className="account-switcher-overlay" onClick={() => setShowAccountSwitcher(false)} role="dialog" aria-modal="true" aria-label="Account switcher">
      <div className="account-switcher glass" onClick={(e) => e.stopPropagation()}>
        <div className="switcher-header">
          <span className="switcher-title">Switch Node</span>
          <button
            className="close-btn"
            onClick={() => setShowAccountSwitcher(false)}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="switcher-accounts" role="listbox" aria-label="Select account">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className={`switcher-account ${activeAccount?.id === acc.id ? 'active' : ''}`}
              onClick={() => handleSwitchAccount(acc)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSwitchAccount(acc);
                }
              }}
              role="option"
              tabIndex={0}
              aria-selected={activeAccount?.id === acc.id}
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
                <span className="active-check" aria-hidden="true">◉</span>
              )}
            </div>
          ))}
        </div>

        <div className="switcher-actions">
          <button
            className="switcher-btn manage"
            onClick={() => {
              setShowAccountSwitcher(false);
              setShowAccounts(true);
            }}
          >
            ⚙ Manage Nodes
          </button>
          <button
            className="switcher-btn signout"
            onClick={handleSignOut}
          >
            ⏻ Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}
