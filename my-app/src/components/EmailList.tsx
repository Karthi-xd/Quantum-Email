import { useEmailStore, getFilteredEmails } from '../store/emailStore';
import { NAV_ITEMS } from '../types';
import type { Email } from '../types';
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
    setShowAccountSwitcher,
  } = useEmailStore();

  const currentEmails = emails[activeCategory] || [];
  const filteredEmails = getFilteredEmails(currentEmails, searchQuery);

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
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
        <div
          className="avatar"
          onClick={() => setShowAccountSwitcher(true)}
          title={activeAccount?.email || 'Switch account'}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setShowAccountSwitcher(true)}
          aria-label={`Switch account${activeAccount?.email ? `, current: ${activeAccount.email}` : ''}`}
        >
          {activeAccount?.email[0].toUpperCase() || 'QP'}
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
