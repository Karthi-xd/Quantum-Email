import { useState, useRef, useEffect, useCallback } from 'react';
import { useEmailStore, getFilteredEmails } from '../store/emailStore';
import { NAV_ITEMS } from '../types';
import { emailService } from '../services/emailService';
import type { Email, Account } from '../types';
import './EmailList.css';

function fmtTime(ts: string): string {
  if (!ts) return '';
  const d = new Date(ts.replace(' ', 'T') + 'Z');
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function EmailList() {
  const {
    activeCategory,
    emails,
    selectedEmail,
    setSelectedEmail,
    searchQuery,
    setSearchQuery,
    activeAccount,
    setShowAccounts,
    setShowSecurity,
    accounts,
    switchAccount,
    removeAccount,
    logout,
    setEmails,
  } = useEmailStore();

  const [showDropdown, setShowDropdown] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const [syncing, setSyncing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentEmails = emails[activeCategory] || [];
  const filteredEmails = getFilteredEmails(currentEmails, searchQuery);
  const filteredAccounts = accounts.filter(acc => 
    acc.email.toLowerCase().includes(accountSearch.toLowerCase()) ||
    acc.displayName.toLowerCase().includes(accountSearch.toLowerCase())
  );

  const handleSync = useCallback(async () => {
    if (!activeAccount || syncing) return;
    setSyncing(true);

    const [inboxResult, sentResult, imapResult] = await Promise.all([
      emailService.fetchEmails(activeAccount),
      emailService.fetchSentEmails(activeAccount),
      emailService.fetchImapEmails(activeAccount),
    ]);

    const inboxEmails = [...(inboxResult.emails || [])];
    if (imapResult.success && imapResult.emails) {
      for (const imap of imapResult.emails) {
        if (!inboxEmails.some((e: Email) => e.id === imap.id)) {
          inboxEmails.push(imap);
        }
      }
    }

    setEmails({
      inbox: inboxEmails,
      all: inboxEmails,
      sent: [...(sentResult.emails || []), ...(emails.sent || [])],
      spam: emails.spam || [],
    });
    setSyncing(false);
  }, [activeAccount, syncing, setEmails, emails.sent, emails.spam]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!activeAccount) return;
    handleSync();
    const interval = setInterval(handleSync, 30000);
    return () => clearInterval(interval);
  }, [activeAccount, handleSync]);

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
  };

  const handleSwitchAccount = (acc: Account) => {
    switchAccount(acc);
    setShowDropdown(false);
  };

  const handleSignOut = () => {
    logout();
    setShowDropdown(false);
  };

  return (
    <main className="email-panel glass" role="main">
      <header className="ep-head">
        <span className="ep-title" role="heading" aria-level={1}>
          {NAV_ITEMS.find((n) => n.key === activeCategory)?.label}
        </span>
        <div className="search glass-sm" role="search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Search transmissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search emails"
          />
        </div>
        <button className={`sync-btn ${syncing ? 'syncing' : ''}`} onClick={handleSync} aria-label="Sync emails" title="Sync emails">
          <span className="sync-icon">⟳</span>
        </button>
        <div className="account-dropdown-wrap" ref={dropdownRef}>
          <button
            className="account-trigger"
            onClick={() => setShowDropdown(!showDropdown)}
            aria-expanded={showDropdown}
            aria-haspopup="menu"
          >
            <span className="trigger-avatar" style={{ background: activeAccount?.color }}>
              {activeAccount?.email[0].toUpperCase() || 'Q'}
            </span>
            <span className="trigger-info">
              <span className="trigger-name">{activeAccount?.displayName || activeAccount?.email.split('@')[0]}</span>
              <span className="trigger-status">
                <span className="status-dot" />
                {accounts.length} account{accounts.length !== 1 ? 's' : ''}
              </span>
            </span>
            <span className={`trigger-arrow ${showDropdown ? 'open' : ''}`}>▾</span>
          </button>

          {showDropdown && (
            <div className="account-dropdown glass" role="menu">
              <div className="dropdown-current">
                <span className="current-label">Active Node</span>
                <div className="current-account">
                  <span className="current-avatar" style={{ background: activeAccount?.color }}>
                    {activeAccount?.email[0].toUpperCase()}
                  </span>
                  <div className="current-info">
                    <span className="current-email">{activeAccount?.email}</span>
                    <span className="current-name">{activeAccount?.displayName}</span>
                  </div>
                </div>
              </div>
              
              <div className="dropdown-divider" />
              
              <div className="dropdown-accounts-section">
                <div className="dropdown-header-row">
                  <span className="dropdown-label">All Nodes</span>
                  <span className="accounts-count">{accounts.length}</span>
                </div>
                
                <div className="dropdown-search">
                  <span className="search-icon">⌕</span>
                  <input
                    type="text"
                    placeholder="Search nodes..."
                    className="dropdown-search-input"
                    aria-label="Search accounts"
                    value={accountSearch}
                    onChange={(e) => setAccountSearch(e.target.value)}
                  />
                </div>

                <div className="dropdown-accounts-scroll">
                  <div className="dropdown-accounts-track">
                    {filteredAccounts.length > 0 ? filteredAccounts.map(acc => {
                      const isActive = activeAccount?.id === acc.id;
                      const unreadCount = (emails.inbox || []).filter(e => !e.read).length;
                      const totalMsgs = Object.values(emails).flat().filter(e => e).length;
                      
                      return (
                        <div
                          key={acc.id}
                          className={`dropdown-account-card ${isActive ? 'active' : ''}`}
                          onClick={() => handleSwitchAccount(acc)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleSwitchAccount(acc)}
                        >
                          <div className="card-avatar-wrap">
                            <span className="card-avatar" style={{ background: acc.color }}>
                              {acc.email[0].toUpperCase()}
                            </span>
                            <span className={`card-status ${isActive ? 'online' : 'offline'}`} />
                          </div>
                          
                          <div className="card-content">
                            <div className="card-header-row">
                              <span className="card-email">{acc.email}</span>
                              {isActive && <span className="active-indicator">◉</span>}
                            </div>
                            <span className="card-name">{acc.displayName}</span>
                            <div className="card-stats">
                              <span className="stat-item">
                                <span className="stat-icon">◈</span>
                                {totalMsgs} msgs
                              </span>
                              <span className="stat-item unread">
                                <span className="stat-icon">●</span>
                                {unreadCount} unread
                              </span>
                            </div>
                          </div>

                          <div className="card-actions">
                            <button
                              className="card-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSwitchAccount(acc);
                              }}
                              title="Switch to this account"
                            >
                              ↗
                            </button>
                            {accounts.length > 1 && (
                              <button
                                className="card-action-btn danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeAccount(acc.id);
                                }}
                                aria-label={`Remove ${acc.email}`}
                                title="Remove node"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="no-accounts-found">
                        <span>No nodes found</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="dropdown-actions">
                <button
                  className="dropdown-action"
                  onClick={() => { setShowAccounts(true); setShowDropdown(false); }}
                  role="menuitem"
                >
                  <span className="action-icon">⚙</span>
                  <span>Manage Accounts</span>
                </button>
                <button
                  className="dropdown-action settings"
                  onClick={() => { setShowSecurity(true); setShowDropdown(false); }}
                  role="menuitem"
                >
                  <span className="action-icon">◎</span>
                  <span>Security</span>
                </button>
              </div>

              <div className="dropdown-divider" />
              
              <button
                className="dropdown-action danger"
                onClick={handleSignOut}
                role="menuitem"
              >
                <span className="action-icon">⏻</span>
                <span>Disconnect Node</span>
              </button>

              <div className="dropdown-footer">
                <span className="footer-status">
                  <span className="pulse-dot sm" />
                  256-qubit encrypted
                </span>
              </div>
            </div>
          )}
        </div>
      </header>
      <div className="email-list" role="listbox" aria-label="Email list">
        {filteredEmails.length > 0 ? (
          filteredEmails.map((e, i) => (
            <div
              key={e.id}
              className={`erow ${!e.read ? 'unread' : ''} ${selectedEmail?.id === e.id ? 'sel' : ''}`}
              style={{ animationDelay: `${Math.min(i * 0.06, 0.5)}s` }}
              onClick={() => handleSelectEmail(e)}
              onKeyDown={(ev) => ev.key === 'Enter' && handleSelectEmail(e)}
              role="option"
              tabIndex={0}
              aria-selected={selectedEmail?.id === e.id}
              aria-label={`${e.from}, ${e.subject}, ${e.time}${!e.read ? ', unread' : ''}${e.attachment ? ', has attachment' : ''}`}
            >
              <div className="edot-col">{!e.read && <span className="edot" aria-label="Unread"></span>}</div>
              <div className="efrom">{e.from}</div>
              <div className="emid">
                <span className="esubj">{e.subject}</span>
                <span className="eprev"> — {e.preview}</span>
              </div>
              <div className="etime" title={e.time}>{fmtTime(e.time)}</div>
              {e.attachment && <span className="attachment-indicator" aria-label="Has attachment">📎</span>}
            </div>
          ))
        ) : (
          <div className="empty" role="status">No transmissions found.</div>
        )}
      </div>
    </main>
  );
}
