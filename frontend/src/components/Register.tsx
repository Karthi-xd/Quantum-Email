import { useState } from 'react';
import { MatrixRain } from './MatrixRain';
import type { Account } from '../types';
import './Login.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

interface RegisterProps {
  onRegisterSuccess: (account: Account) => void;
  onGoToLogin: () => void;
}

export function Register({ onRegisterSuccess, onGoToLogin }: RegisterProps) {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.email || !formData.password) {
      setError('All quantum fields are required');
      return;
    }

    setRegistering(true);

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      const newAccount: Account = {
        id: '',
        email: formData.email,
        displayName: formData.username,
        password: formData.password,
        token: data.token || '',
        kyberPub: data.kyber_pub || '',
        diliPub: data.dili_pub || '',
        x25519Pub: data.x25519_pub || '',
        ed25519Pub: data.ed25519_pub || '',
        fingerprint: data.fingerprint || '',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        imapHost: 'imap.gmail.com',
        imapPort: 993,
      };

      onRegisterSuccess(newAccount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quantum handshake failed');
      setRegistering(false);
    }
  };

  return (
    <div className="login-page">
      <MatrixRain />

      <div className="login-container">
        <div className="login-header">
          <p className="brand-name">
            <span className="brand-q">Quantum</span> Protocol
          </p>
          <h1 className="login-title">NODE CREATION</h1>
          <p className="login-subtitle">Generate your quantum identity</p>
        </div>

        <form className="login-form glass" onSubmit={handleSubmit} aria-label="Register form">
          <div className="form-group">
            <label className="form-label" htmlFor="username">Quantum Alias</label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-input"
              placeholder="Agent_Zero"
              value={formData.username}
              onChange={handleChange}
              autoComplete="username"
              aria-required="true"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Entangled Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="your@quantum.node"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              aria-required="true"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Decoherence Key</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className="form-input"
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                aria-required="true"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '◉' : '◎'}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message" role="alert">
              <span className="error-icon">⚠</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`login-btn ${registering ? 'authenticating' : ''}`}
            disabled={registering}
            aria-busy={registering}
          >
            {registering ? (
              <>
                <span className="sync-spinner" aria-hidden="true" />
                Generating Quantum Identity...
              </>
            ) : (
              <>Forge Quantum Identity</>
            )}
          </button>

          <div className="login-footer" onClick={onGoToLogin} aria-hidden="false">
            <span>Already have a node?</span>
            <span style={{ color: 'var(--accent)', marginLeft: '0.25rem', textDecoration: 'underline' }}>Access Terminal</span>
          </div>
        </form>
      </div>
    </div>
  );
}