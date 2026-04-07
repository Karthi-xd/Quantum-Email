import { useEmailStore, getFilteredEmails } from '../store/emailStore';
import { NAV_ITEMS } from '../types';
import type { Email } from '../types';

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
    <main className="email-panel glass">
      <header className="ep-head">
        <span className="ep-title">
          {NAV_ITEMS.find((n) => n.key === activeCategory)?.label}
        </span>
        <div className="search glass-sm">
          <span>⌕</span>
          <input
            placeholder="Search transmissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div
          className="avatar"
          onClick={() => setShowAccountSwitcher(true)}
          title={activeAccount?.email || 'Switch account'}
        >
          {activeAccount?.email[0].toUpperCase() || 'QP'}
        </div>
      </header>
      <div className="email-list">
        {filteredEmails.length > 0 ? (
          filteredEmails.map((e, i) => (
            <div
              key={e.id}
              className={`erow ${!e.read ? 'unread' : ''} ${selectedEmail?.id === e.id ? 'sel' : ''}`}
              style={{ animationDelay: `${i * 0.06}s` }}
              onClick={() => handleSelectEmail(e)}
            >
              <div className="edot-col">{!e.read && <span className="edot" />}</div>
              <div className="efrom">{e.from}</div>
              <div className="emid">
                <span className="esubj">{e.subject}</span>
                <span className="eprev"> — {e.preview}</span>
              </div>
              <div className="etime">{e.time}</div>
            </div>
          ))
        ) : (
          <div className="empty">No transmissions found.</div>
        )}
      </div>
    </main>
  );
}
