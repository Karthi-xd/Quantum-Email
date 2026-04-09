import { useEffect, useRef } from 'react';
import { useEmailStore } from '../store/emailStore';

export function AboutQP() {
  const { showAboutQP, setShowAboutQP } = useEmailStore();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAboutQP) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showAboutQP]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAboutQP) {
        setShowAboutQP(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAboutQP, setShowAboutQP]);

  if (!showAboutQP) return null;

  return (
    <div className="about-qp-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) setShowAboutQP(false);
    }}>
      <div className="about-qp-modal" ref={modalRef}>
        <div className="about-qp-particles">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="about-particle" style={{
              '--delay': `${i * 0.15}s`,
              '--x': `${Math.random() * 100}%`,
              '--y': `${Math.random() * 100}%`,
              '--size': `${3 + Math.random() * 4}px`,
            } as React.CSSProperties} />
          ))}
        </div>
        
        <div className="about-qp-header">
          <div className="about-qp-logo">
            <span className="about-logo-q">Q</span>
            <span className="about-logo-p">P</span>
            <div className="about-logo-ring" />
            <div className="about-logo-ring ring-2" />
          </div>
          <button className="about-qp-close" onClick={() => setShowAboutQP(false)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="about-qp-content">
          <h1 className="about-title">
            <span className="title-letter" style={{'--i': 0} as React.CSSProperties}>Q</span>
            <span className="title-letter" style={{'--i': 1} as React.CSSProperties}>U</span>
            <span className="title-letter" style={{'--i': 2} as React.CSSProperties}>A</span>
            <span className="title-letter" style={{'--i': 3} as React.CSSProperties}>N</span>
            <span className="title-letter" style={{'--i': 4} as React.CSSProperties}>T</span>
            <span className="title-letter" style={{'--i': 5} as React.CSSProperties}>U</span>
            <span className="title-letter" style={{'--i': 6} as React.CSSProperties}>M</span>
          </h1>
          <p className="about-subtitle">QUANTUM PROTOCOL</p>

          <div className="about-divider">
            <span className="divider-line" />
            <span className="divider-icon">◈</span>
            <span className="divider-line" />
          </div>

          <div className="about-description">
            <p>
              <span className="desc-highlight">QP</span> is a next-generation email client 
              inspired by the mysterious world of <span className="desc-accent">quantum mechanics</span>. 
              Just as particles can exist in multiple states simultaneously, 
              QP reimagines communication through the lens of quantum entanglement.
            </p>
          </div>

          <div className="about-features">
            <div className="feature-card">
              <div className="feature-icon">⚛</div>
              <h3>Quantum Encryption</h3>
              <p>Military-grade encryption powered by quantum key distribution principles</p>
              <span className="feature-status">Implemented</span>
            </div>
            <div className="feature-card">
              <div className="feature-icon">∞</div>
              <h3>Entangled Streams</h3>
              <p>Real-time synchronization across all your devices instantly</p>
              <span className="feature-status">Conceptual</span>
            </div>
            <div className="feature-card">
              <div className="feature-icon">◉</div>
              <h3>Superposition UI</h3>
              <p>Intelligent interface that adapts to your workflow patterns</p>
              <span className="feature-status">Conceptual</span>
            </div>
          </div>

          <div className="about-tech-stack">
            <span className="tech-label">Built with</span>
            <div className="tech-badges">
              <span className="tech-badge">React</span>
              <span className="tech-badge">TypeScript</span>
              <span className="tech-badge">Zustand</span>
              <span className="tech-badge">Vite</span>
            </div>
          </div>

          <div className="about-version">
            <span className="version-label">VERSION</span>
            <span className="version-number">1.0.0</span>
            <span className="version-status">BETA</span>
          </div>
        </div>

        <div className="about-qp-footer">
          <p>"The future of communication is quantum."</p>
        </div>
      </div>
    </div>
  );
}
