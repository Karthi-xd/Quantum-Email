import { useEffect, useRef, useState, useCallback } from 'react';
import { useEmailStore } from '../store/emailStore';

export function AboutQP() {
  const { showAboutQP, setShowAboutQP } = useEmailStore();
  const modalRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setShowAboutQP(false);
      setIsClosing(false);
    }, 400);
  }, [setShowAboutQP]);

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
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAboutQP, handleClose]);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;

    const trackTop = 120;
    const trackBottom = 60;
    const trackHeight = modal.clientHeight - trackTop - trackBottom;
    const thumbHeight = Math.min(Math.max(40, trackHeight * 0.18), 70);
    const maxTop = trackHeight - thumbHeight;
    const scrollableHeight = modal.scrollHeight - modal.clientHeight;
    const isScrollable = scrollableHeight > 10;

    if (isScrollable) {
      modal.classList.add('scrollable');
    }

    const updateScrollbar = () => {
      if (scrollableHeight <= 0) return;
      const scrollPercent = modal.scrollTop / scrollableHeight;
      const thumbTop = scrollPercent * maxTop;
      modal.style.setProperty('--scroll-thumb-top-offset', `${thumbTop}px`);
      modal.style.setProperty('--scroll-thumb-height', `${thumbHeight}px`);
    };

    const handleThumbMouseDown = (e: MouseEvent) => {
      isDragging = true;
      startY = e.clientY;
      startScrollTop = modal.scrollTop;
      modal.style.cursor = 'grabbing';
      modal.style.userSelect = 'none';
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = e.clientY - startY;
      const deltaScroll = (deltaY / maxTop) * scrollableHeight;
      modal.scrollTop = Math.max(0, Math.min(scrollableHeight, startScrollTop + deltaScroll));
    };

    const handleMouseUp = () => {
      isDragging = false;
      modal.style.cursor = '';
      modal.style.userSelect = '';
    };

    const thumbEl = modal.querySelector('.scroll-thumb') as HTMLElement;
    if (thumbEl && isScrollable) {
      thumbEl.addEventListener('mousedown', handleThumbMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    modal.addEventListener('scroll', updateScrollbar);
    updateScrollbar();

    return () => {
      modal.removeEventListener('scroll', updateScrollbar);
      modal.classList.remove('scrollable');
      if (thumbEl) {
        thumbEl.removeEventListener('mousedown', handleThumbMouseDown);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [showAboutQP]);

  if (!showAboutQP) return null;

  return (
    <div className={`about-qp-overlay ${isClosing ? 'closing' : ''}`} onClick={(e) => {
      if (e.target === e.currentTarget) handleClose();
    }}>
      <div className="about-qp-modal" ref={modalRef}>
        <div className="scroll-track">
          <div className="scroll-thumb" />
        </div>

        <div className="about-qp-header">
          <div className="about-qp-logo">
            <span className="about-logo-q">Q</span>
            <span className="about-logo-p">P</span>
            <div className="about-logo-ring" />
            <div className="about-logo-ring ring-2" />
          </div>
          <button className="about-qp-close" onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

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

        <div className="about-qp-footer">
          <p>"The future of communication is quantum."</p>
        </div>
      </div>
    </div>
  );
}
