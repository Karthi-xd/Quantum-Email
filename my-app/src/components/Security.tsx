import { useState, useEffect } from 'react';
import { useEmailStore } from '../store/emailStore';
import './Security.css';

export function Security() {
  const { showSecurity, setShowSecurity } = useEmailStore();
  const [quantumEncryption, setQuantumEncryption] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [autoLock, setAutoLock] = useState(true);
  const [autoLockTime, setAutoLockTime] = useState(5);
  const [clearData, setClearData] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSecurity(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setShowSecurity]);

  if (!showSecurity) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setShowSecurity(false);
  };

  const handleClearData = () => {
    if (clearData) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="sec-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="sec-title">
      <div className="sec-modal glass">
        <div className="sec-header">
          <div className="sec-title-row">
            <span className="sec-icon">◉</span>
            <h2 id="sec-title">Quantum Security</h2>
          </div>
          <button className="sec-close" onClick={() => setShowSecurity(false)} aria-label="Close">×</button>
        </div>

        <div className="sec-content">
          <section className="sec-section">
            <div className="sec-section-header">
              <span className="section-icon">🔐</span>
              <h3>Encryption Status</h3>
            </div>
            
            <div className="encryption-card">
              <div className="enc-status">
                <div className="enc-badge active">
                  <span className="enc-icon">◈</span>
                  <span>256-Qubit Encrypted</span>
                </div>
                <span className="enc-timestamp">Last verified: Just now</span>
              </div>
              <div className="enc-meter">
                <div className="enc-meter-fill" style={{ width: '100%' }} />
              </div>
              <div className="enc-details">
                <span className="enc-detail-item">
                  <span className="det-icon">◉</span>
                  Quantum Key Distribution: Active
                </span>
                <span className="enc-detail-item">
                  <span className="det-icon">◉</span>
                  End-to-End Encryption: Enabled
                </span>
                <span className="enc-detail-item">
                  <span className="det-icon">◉</span>
                  Perfect Forward Secrecy: Active
                </span>
              </div>
            </div>
          </section>

          <section className="sec-section">
            <div className="sec-section-header">
              <span className="section-icon">⚡</span>
              <h3>Security Settings</h3>
            </div>
            
            <div className="sec-group">
              <div className="sec-item">
                <div className="sec-item-info">
                  <span className="sec-item-label">Quantum Encryption</span>
                  <span className="sec-item-desc">Use quantum key distribution</span>
                </div>
                <button
                  className={`sec-switch ${quantumEncryption ? 'on' : ''}`}
                  onClick={() => setQuantumEncryption(!quantumEncryption)}
                  role="switch"
                  aria-checked={quantumEncryption}
                >
                  <span className="switch-thumb" />
                </button>
              </div>

              <div className="sec-item">
                <div className="sec-item-info">
                  <span className="sec-item-label">Two-Factor Auth</span>
                  <span className="sec-item-desc">Require quantum token verification</span>
                </div>
                <button
                  className={`sec-switch ${twoFactor ? 'on' : ''}`}
                  onClick={() => setTwoFactor(!twoFactor)}
                  role="switch"
                  aria-checked={twoFactor}
                >
                  <span className="switch-thumb" />
                </button>
              </div>

              <div className="sec-item">
                <div className="sec-item-info">
                  <span className="sec-item-label">Auto-Lock</span>
                  <span className="sec-item-desc">Lock after inactivity</span>
                </div>
                <button
                  className={`sec-switch ${autoLock ? 'on' : ''}`}
                  onClick={() => setAutoLock(!autoLock)}
                  role="switch"
                  aria-checked={autoLock}
                >
                  <span className="switch-thumb" />
                </button>
              </div>

              {autoLock && (
                <div className="sec-item indent">
                  <div className="sec-item-info">
                    <span className="sec-item-label">Lock After</span>
                  </div>
                  <div className="sec-time-select">
                    {[1, 5, 15, 30].map(m => (
                      <button
                        key={m}
                        className={`time-btn ${autoLockTime === m ? 'active' : ''}`}
                        onClick={() => setAutoLockTime(m)}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="sec-section">
            <div className="sec-section-header">
              <span className="section-icon">🔑</span>
              <h3>Authentication</h3>
            </div>
            
            <div className="sec-item">
              <div className="sec-item-info">
                <span className="sec-item-label">Change Decoherence Key</span>
                <span className="sec-item-desc">Update your access token</span>
              </div>
              <button
                className="sec-action-btn"
                onClick={() => setShowChangePassword(!showChangePassword)}
              >
                {showChangePassword ? 'Cancel' : 'Change'}
              </button>
            </div>

            {showChangePassword && (
              <div className="password-change-form">
                <div className="form-field">
                  <label>Current Key</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current decoherence key"
                  />
                </div>
                <div className="form-field">
                  <label>New Key</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new decoherence key"
                  />
                </div>
                <div className="form-field">
                  <label>Confirm New Key</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new decoherence key"
                  />
                </div>
                <button className="sec-btn primary">Update Key</button>
              </div>
            )}
          </section>

          <section className="sec-section danger-zone">
            <div className="sec-section-header">
              <span className="section-icon">⚠</span>
              <h3>Danger Zone</h3>
            </div>
            
            <div className="sec-item danger">
              <div className="sec-item-info">
                <span className="sec-item-label">Clear Local Data</span>
                <span className="sec-item-desc">Remove all cached quantum states</span>
              </div>
              <button
                className="sec-action-btn danger"
                onClick={handleClearData}
                disabled={!clearData}
              >
                {clearData ? 'Confirm Clear' : 'Clear Data'}
              </button>
            </div>

            <label className="danger-confirm">
              <input
                type="checkbox"
                checked={clearData}
                onChange={(e) => setClearData(e.target.checked)}
              />
              <span>I understand this will remove all local encrypted data</span>
            </label>
          </section>

          <section className="sec-section info">
            <div className="security-info-card">
              <span className="info-icon">ℹ</span>
              <div className="info-content">
                <span className="info-title">Quantum Secure</span>
                <span className="info-text">
                  Your communications are protected by 256-qubit quantum encryption. 
                  Keys are generated using true quantum randomness and cannot be 
                  intercepted by classical computers.
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="sec-footer">
          <button className="sec-btn secondary" onClick={() => setShowSecurity(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
