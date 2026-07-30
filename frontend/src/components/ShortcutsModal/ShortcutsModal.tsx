import { useEmailStore } from '../../store/emailStore';
import './ShortcutsModal.css';

const shortcuts = [
  { key: 'j / ↓', description: 'Next email', category: 'Navigation' },
  { key: 'k / ↑', description: 'Previous email', category: 'Navigation' },
  { key: 'Enter', description: 'Open email', category: 'Navigation' },
  { key: 'Escape', description: 'Close modal', category: 'Navigation' },
  { key: 'c', description: 'Compose', category: 'Actions' },
  { key: 'r', description: 'Reply', category: 'Actions' },
  { key: 'a', description: 'Reply All', category: 'Actions' },
  { key: 'f', description: 'Forward', category: 'Actions' },
  { key: 'd', description: 'Delete', category: 'Actions' },
  { key: '/', description: 'Search', category: 'Search' },
  { key: 'g i', description: 'Go to Inbox', category: 'Navigation' },
  { key: 'g s', description: 'Go to Sent', category: 'Navigation' },
  { key: 'g a', description: 'Go to All Mail', category: 'Navigation' },
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
    <div className="shortcuts-overlay" onClick={() => setShowShortcuts(false)} role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">
      <div className="shortcuts-modal glass" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-header">
          <div className="shortcuts-title">
            <span className="shortcuts-icon" aria-hidden="true">⌘</span>
            <h2 id="shortcuts-title">Quantum Commands</h2>
          </div>
          <button className="close-btn" onClick={() => setShowShortcuts(false)} aria-label="Close shortcuts">
            ×
          </button>
        </div>

        <div className="shortcuts-content">
          {Object.entries(categories).map(([category, items]) => (
            <div key={category} className="shortcuts-category">
              <h3 className="category-title">{category}</h3>
              <div className="shortcuts-list" role="list">
                {items.map((shortcut, i) => (
                  <div key={i} className="shortcut-item" role="listitem">
                    <div className="shortcut-keys" aria-label={`Press ${shortcut.key}`}>
                      {shortcut.key.split(' ').map((k, j) => (
                        <span key={j}>
                          <kbd aria-label={k}>{k}</kbd>
                          {j < shortcut.key.split(' ').length - 1 && (
                            <span className="key-separator" aria-hidden="true">then</span>
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

        <div className="shortcuts-footer" aria-hidden="true">
          <span className="pulse-dot sm" />
          <span>Press</span>
          <kbd>?</kbd>
          <span>anytime to show shortcuts</span>
        </div>
      </div>
    </div>
  );
}
