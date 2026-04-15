import { useState, useEffect } from 'react';
import { useEmailStore } from '../store/emailStore';
import { toast } from '../store/toastStore';
import './Security.css';

export function Security() {
  const {
    showSecurity,
    setShowSecurity,
    security,
    setSecurity,
    updatePassword,
    clearAllData,
  } = useEmailStore();

  const [quantumEncryption, setQuantumEncryption] = useState(security.quantumEncryption);
  const [twoFactor, setTwoFactor] = useState(security.twoFactor);
  const [autoLock, setAutoLock] = useState(security.autoLock);
  const [autoLockTime, setAutoLockTime] = useState(security.autoLockTime);
  const [clearData, setClearData] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    setQuantumEncryption(security.quantumEncryption);
    setTwoFactor(security.twoFactor);
    setAutoLock(security.autoLock);
    setAutoLockTime(security.autoLockTime);
  }, [security]);

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

  const handleQuantumEncryptionToggle = () => {
    const newValue = !quantumEncryption;
    setQuantumEncryption(newValue);
    setSecurity('quantumEncryption', newValue);
    toast.success(newValue ? 'Quantum encryption enabled' : 'Quantum encryption disabled');
  };

  const handleTwoFactorToggle = () => {
    const newValue = !twoFactor;
    setTwoFactor(newValue);
    setSecurity('twoFactor', newValue);
    toast.success(newValue ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled');
  };

  const handleAutoLockToggle = () => {
    const newValue = !autoLock;
    setAutoLock(newValue);
    setSecurity('autoLock', newValue);
    toast.success(newValue ? `Auto-lock enabled (${autoLockTime} min)` : 'Auto-lock disabled');
  };

  const handleAutoLockTimeChange = (time: number) => {
    setAutoLockTime(time);
    setSecurity('autoLockTime', time);
    toast.success(`Auto-lock set to ${time} minutes`);
  };

  const handlePasswordChange = () => {
    setPasswordError('');
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New keys do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Key must be at least 6 characters');
      return;
    }
    
    const success = updatePassword(currentPassword, newPassword);
    
    if (success) {
      toast.success('Decoherence key updated successfully');
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError('Current key is incorrect');
    }
  };

  const handleClearData = () => {
    if (clearData) {
      clearAllData();
    }
  };

  return (
    <>
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
                  <div className={`enc-badge ${quantumEncryption ? 'active' : 'inactive'}`}>
                    <span className="enc-icon">◈</span>
                    <span>{quantumEncryption ? '256-Qubit Encrypted' : 'Standard Encryption'}</span>
                  </div>
                  <span className="enc-timestamp">Last verified: Just now</span>
                </div>
                <div className="enc-meter">
                  <div className="enc-meter-fill" style={{ width: quantumEncryption ? '100%' : '60%' }} />
                </div>
                <div className="enc-details">
                  <span className="enc-detail-item">
                    <span className="det-icon">◉</span>
                    Quantum Key Distribution: {quantumEncryption ? 'Active' : 'Disabled'}
                  </span>
                  <span className="enc-detail-item">
                    <span className="det-icon">◉</span>
                    End-to-End Encryption: Enabled
                  </span>
                  <span className="enc-detail-item">
                    <span className="det-icon">◉</span>
                    Perfect Forward Secrecy: {quantumEncryption ? 'Active' : 'Inactive'}
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
                    onClick={handleQuantumEncryptionToggle}
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
                    onClick={handleTwoFactorToggle}
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
                    onClick={handleAutoLockToggle}
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
                          onClick={() => handleAutoLockTimeChange(m)}
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
                  {passwordError && (
                    <div className="password-error">{passwordError}</div>
                  )}
                  <button className="sec-btn primary" onClick={handlePasswordChange}>
                    Update Key
                  </button>
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
                  className={`sec-action-btn danger ${clearData ? 'confirm' : ''}`}
                  onClick={handleClearData}
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
    </>
  );
}
