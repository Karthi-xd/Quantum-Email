import { useState } from 'react';
import { MatrixRain } from './MatrixRain';
import './Login.css';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onGoToRegister: () => void;
}

export function Login({ onLogin, onGoToRegister }: LoginProps) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Entangled address and decoherence key are required');
      return;
    }

    setAuthenticating(true);
    setError('');

    try {
      const result = await onLogin(formData.email, formData.password);
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setAuthenticating(false);
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
          <h1 className="login-title">NODE ACCESS</h1>
          <p className="login-subtitle">Initialize your entangled state</p>
        </div>

        <form className="login-form glass" onSubmit={handleSubmit} aria-label="Login form">
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
                placeholder="Access token"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
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
            className={`login-btn ${authenticating ? 'authenticating' : ''}`}
            disabled={authenticating}
            aria-busy={authenticating}
          >
            {authenticating ? (
              <>
                <span className="sync-spinner" aria-hidden="true" />
                Synchronizing...
              </>
            ) : (
              <>Establish Secure Channel</>
            )}
          </button>

          <div className="login-footer" aria-hidden="false" style={{ cursor: 'pointer' }} onClick={onGoToRegister}>
            <span>No quantum node yet?</span>
            <span style={{ color: 'var(--accent)', marginLeft: '0.25rem', textDecoration: 'underline' }}>Forge Identity</span>
          </div>
        </form>
      </div>
    </div>
  );
}
