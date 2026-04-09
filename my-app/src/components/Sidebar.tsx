import { useEmailStore, getUnreadCount } from '../store/emailStore';
import { NAV_ITEMS } from '../types';

export function Sidebar() {
  const { activeCategory, setActiveCategory, setComposing, emails, setShowAboutQP } = useEmailStore();

  return (
    <aside className="sidebar glass">
      <div className="sb-brand" onClick={() => setShowAboutQP(true)} style={{ cursor: 'pointer' }}>
        <span className="brand-q">Q</span>P
      </div>
      <button className="compose-btn" onClick={() => setComposing(true)}>
        + Compose
      </button>
      <nav className="sb-nav">
        {NAV_ITEMS.map((n) => (
          <button
            key={n.key}
            className={`nav-btn ${activeCategory === n.key ? 'nav-active' : ''}`}
            onClick={() => setActiveCategory(n.key)}
          >
            <span className="ni">{n.icon}</span>
            <span>{n.label}</span>
            {getUnreadCount(emails, n.key) > 0 && (
              <span className="badge">{getUnreadCount(emails, n.key)}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="sb-foot">
        <span className="pulse-dot sm" />
        <span>Entangled</span>
      </div>
    </aside>
  );
}
