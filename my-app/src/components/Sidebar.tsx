import { useEmailStore, getUnreadCount } from '../store/emailStore';
import { NAV_ITEMS } from '../types';
import './Sidebar.css';

export function Sidebar() {
  const { activeCategory, setActiveCategory, setComposing, emails, setShowAboutQP } = useEmailStore();

  return (
    <aside className="sidebar glass" role="navigation" aria-label="Email navigation">
      <div className="sb-brand" onClick={() => setShowAboutQP(true)} style={{ cursor: 'pointer' }} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setShowAboutQP(true)} aria-label="About Quantum Privacy">
        <span className="brand-q">Q</span>P
      </div>
      <button className="compose-btn" onClick={() => setComposing(true)} aria-label="Compose new email">
        + <span>Compose</span>
      </button>
      <nav className="sb-nav">
        {NAV_ITEMS.map((n) => (
          <button
            key={n.key}
            className={`nav-btn ${activeCategory === n.key ? 'nav-active' : ''}`}
            onClick={() => setActiveCategory(n.key)}
            aria-current={activeCategory === n.key ? 'page' : undefined}
          >
            <span className="ni" aria-hidden="true">{n.icon}</span>
            <span>{n.label}</span>
            {getUnreadCount(emails, n.key) > 0 && (
              <span className="badge" aria-label={`${getUnreadCount(emails, n.key)} unread`}>{getUnreadCount(emails, n.key)}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="sb-foot" aria-hidden="true">
        <span className="pulse-dot sm" />
        <span>Entangled</span>
      </div>
    </aside>
  );
}
