import { useEffect } from 'react';
import { useEmailStore } from '../store/emailStore';
import './Preferences.css';

export function Preferences() {
  const {
    showPreferences,
    setShowPreferences,
    preferences,
    setPreference,
    activeAccount,
  } = useEmailStore();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPreferences(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setShowPreferences]);

  if (!showPreferences) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setShowPreferences(false);
  };

  return (
    <div className="pref-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="pref-title">
      <div className="pref-modal glass">
        <div className="pref-header">
          <div className="pref-title-row">
            <span className="pref-icon">◎</span>
            <h2 id="pref-title">Node Preferences</h2>
          </div>
          <button className="pref-close" onClick={() => setShowPreferences(false)} aria-label="Close">×</button>
        </div>

        <div className="pref-content">
          <section className="pref-section">
            <div className="pref-section-header">
              <span className="section-icon">◈</span>
              <h3>Display Settings</h3>
            </div>
            
            <div className="pref-group">
              <div className="pref-item">
                <div className="pref-item-info">
                  <span className="pref-item-label">Theme</span>
                  <span className="pref-item-desc">Choose your visual experience</span>
                </div>
                <div className="pref-toggle-group">
                  {(['quantum', 'classic', 'minimal'] as const).map(t => (
                    <button
                      key={t}
                      className={`pref-theme-btn ${preferences.theme === t ? 'active' : ''}`}
                      onClick={() => setPreference('theme', t)}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pref-item">
                <div className="pref-item-info">
                  <span className="pref-item-label">Font Size</span>
                  <span className="pref-item-desc">Adjust text readability</span>
                </div>
                <div className="pref-toggle-group">
                  {(['small', 'medium', 'large'] as const).map(s => (
                    <button
                      key={s}
                      className={`pref-size-btn ${preferences.fontSize === s ? 'active' : ''}`}
                      onClick={() => setPreference('fontSize', s)}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pref-item">
                <div className="pref-item-info">
                  <span className="pref-item-label">Compact Mode</span>
                  <span className="pref-item-desc">Reduce spacing for more content</span>
                </div>
                <button
                  className={`pref-switch ${preferences.compactMode ? 'on' : ''}`}
                  onClick={() => setPreference('compactMode', !preferences.compactMode)}
                  role="switch"
                  aria-checked={preferences.compactMode}
                >
                  <span className="switch-thumb" />
                </button>
              </div>

              <div className="pref-item">
                <div className="pref-item-info">
                  <span className="pref-item-label">Preview Pane</span>
                  <span className="pref-item-desc">Show email content alongside list</span>
                </div>
                <button
                  className={`pref-switch ${preferences.previewPane ? 'on' : ''}`}
                  onClick={() => setPreference('previewPane', !preferences.previewPane)}
                  role="switch"
                  aria-checked={preferences.previewPane}
                >
                  <span className="switch-thumb" />
                </button>
              </div>
            </div>
          </section>

          <section className="pref-section">
            <div className="pref-section-header">
              <span className="section-icon">◉</span>
              <h3>Quantum Effects</h3>
            </div>
            
            <div className="pref-group">
              <div className="pref-item">
                <div className="pref-item-info">
                  <span className="pref-item-label">Quantum Animations</span>
                  <span className="pref-item-desc">Particle effects and transitions</span>
                </div>
                <button
                  className={`pref-switch ${preferences.quantumAnimations ? 'on' : ''}`}
                  onClick={() => setPreference('quantumAnimations', !preferences.quantumAnimations)}
                  role="switch"
                  aria-checked={preferences.quantumAnimations}
                >
                  <span className="switch-thumb" />
                </button>
              </div>

              <div className="pref-item">
                <div className="pref-item-info">
                  <span className="pref-item-label">Sound Effects</span>
                  <span className="pref-item-desc">Audio feedback on actions</span>
                </div>
                <button
                  className={`pref-switch ${preferences.soundEffects ? 'on' : ''}`}
                  onClick={() => setPreference('soundEffects', !preferences.soundEffects)}
                  role="switch"
                  aria-checked={preferences.soundEffects}
                >
                  <span className="switch-thumb" />
                </button>
              </div>
            </div>
          </section>

          <section className="pref-section">
            <div className="pref-section-header">
              <span className="section-icon">⚙</span>
              <h3>Behavior</h3>
            </div>
            
            <div className="pref-group">
              <div className="pref-item">
                <div className="pref-item-info">
                  <span className="pref-item-label">Notifications</span>
                  <span className="pref-item-desc">Alert for new transmissions</span>
                </div>
                <button
                  className={`pref-switch ${preferences.notifications ? 'on' : ''}`}
                  onClick={() => setPreference('notifications', !preferences.notifications)}
                  role="switch"
                  aria-checked={preferences.notifications}
                >
                  <span className="switch-thumb" />
                </button>
              </div>

              <div className="pref-item">
                <div className="pref-item-info">
                  <span className="pref-item-label">Auto-save Drafts</span>
                  <span className="pref-item-desc">Save compositions automatically</span>
                </div>
                <button
                  className={`pref-switch ${preferences.autoSave ? 'on' : ''}`}
                  onClick={() => setPreference('autoSave', !preferences.autoSave)}
                  role="switch"
                  aria-checked={preferences.autoSave}
                >
                  <span className="switch-thumb" />
                </button>
              </div>

              <div className="pref-item">
                <div className="pref-item-info">
                  <span className="pref-item-label">Confirm Delete</span>
                  <span className="pref-item-desc">Ask before deleting messages</span>
                </div>
                <button
                  className={`pref-switch ${preferences.confirmDelete ? 'on' : ''}`}
                  onClick={() => setPreference('confirmDelete', !preferences.confirmDelete)}
                  role="switch"
                  aria-checked={preferences.confirmDelete}
                >
                  <span className="switch-thumb" />
                </button>
              </div>
            </div>
          </section>

          <section className="pref-section info">
            <div className="pref-section-header">
              <span className="section-icon">ℹ</span>
              <h3>Active Node</h3>
            </div>
            <div className="pref-node-info">
              <span className="node-avatar" style={{ background: activeAccount?.color }}>
                {activeAccount?.email[0].toUpperCase()}
              </span>
              <div className="node-details">
                <span className="node-email">{activeAccount?.email}</span>
                <span className="node-name">{activeAccount?.displayName}</span>
              </div>
            </div>
          </section>
        </div>

        <div className="pref-footer">
          <button className="pref-btn secondary" onClick={() => setShowPreferences(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
