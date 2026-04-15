import { useState, useRef, useEffect } from 'react';
import { useEmailStore, getFilteredEmails } from '../store/emailStore';
import { NAV_ITEMS } from '../types';
import type { Email, Account } from '../types';
import './EmailList.css';

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
    accounts,
    switchAccount,
    removeAccount,
    logout,
  } = useEmailStore();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentEmails = emails[activeCategory] || [];
  const filteredEmails = getFilteredEmails(currentEmails, searchQuery);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
              
              <div className="dropdown-accounts-scroll">
                <div className="dropdown-accounts-track">
                  <span className="dropdown-label">All Nodes</span>
                  {accounts.map(acc => (
                    <div
                      key={acc.id}
                      className={`dropdown-account-row ${activeAccount?.id === acc.id ? 'active' : ''}`}
                    >
                      <button
                        className="dropdown-account"
                        onClick={() => handleSwitchAccount(acc)}
                        role="menuitem"
                      >
                        <span className="dropdown-avatar" style={{ background: acc.color }}>
                          {acc.email[0].toUpperCase()}
                        </span>
                        <div className="dropdown-account-info">
                          <span className="dropdown-email">{acc.email}</span>
                          <span className="dropdown-name">{acc.displayName}</span>
                        </div>
                        {activeAccount?.id === acc.id && (
                          <span className="active-badge">Active</span>
                        )}
                      </button>
                      {accounts.length > 1 && (
                        <button
                          className="account-remove-btn"
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
                  ))}
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
                  onClick={() => { setShowDropdown(false); }}
                  role="menuitem"
                >
                  <span className="action-icon">◎</span>
                  <span>Preferences</span>
                </button>
                <button
                  className="dropdown-action security"
                  onClick={() => { setShowDropdown(false); }}
                  role="menuitem"
                >
                  <span className="action-icon">◉</span>
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
              <div className="etime" title={e.time}>{e.time}</div>
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
