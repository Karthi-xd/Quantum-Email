import { useEmailStore } from '../../store/emailStore';

const shortcuts = [
  { key: 'j / ↓', description: 'Next email', category: 'Navigation' },
  { key: 'k / ↑', description: 'Previous email', category: 'Navigation' },
  { key: 'Enter', description: 'Open email', category: 'Navigation' },
  { key: 'Escape', description: 'Close modal', category: 'Navigation' },
  { key: 'c', description: 'Compose', category: 'Actions' },
  { key: 'r', description: 'Reply', category: 'Actions' },
  { key: 'f', description: 'Forward', category: 'Actions' },
  { key: 'd', description: 'Delete', category: 'Actions' },
  { key: '/', description: 'Search', category: 'Search' },
  { key: 'g then i', description: 'Go to Inbox', category: 'Navigation' },
  { key: 'g then s', description: 'Go to Sent', category: 'Navigation' },
  { key: '?', description: 'Show this help', category: 'Help' },
];

export function ShortcutsModal() {
  const { showShortcuts, setShowShortcuts } = useEmailStore();

  if (!showShortcuts) return null;

  const categories = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, typeof shortcuts>);

  return (
    <div className="shortcuts-overlay" onClick={() => setShowShortcuts(false)}>
      <div className="shortcuts-modal glass" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-header">
          <div className="shortcuts-title">
            <span className="shortcuts-icon">⌘</span>
            <h2>Quantum Commands</h2>
          </div>
          <button className="close-btn" onClick={() => setShowShortcuts(false)}>
            ×
          </button>
        </div>

        <div className="shortcuts-content">
          {Object.entries(categories).map(([category, items]) => (
            <div key={category} className="shortcuts-category">
              <h3 className="category-title">{category}</h3>
              <div className="shortcuts-list">
                {items.map((shortcut, i) => (
                  <div key={i} className="shortcut-item">
                    <div className="shortcut-keys">
                      {shortcut.key.split(' ').map((k, j) => (
                        <span key={j}>
                          <kbd>{k}</kbd>
                          {j < shortcut.key.split(' ').length - 1 && (
                            <span className="key-separator">then</span>
                          )}
                        </span>
                      ))}
                    </div>
                    <span className="shortcut-desc">{shortcut.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shortcuts-footer">
          <span className="pulse-dot sm" />
          <span>Press</span>
          <kbd>?</kbd>
          <span>anytime to show shortcuts</span>
        </div>
      </div>
    </div>
  );
}
