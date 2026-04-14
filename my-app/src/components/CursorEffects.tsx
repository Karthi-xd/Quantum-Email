import { useEffect, useState, useRef, useCallback } from 'react';
import './CursorEffects.css';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const particleIdRef = useRef(0);
  const lastParticleTime = useRef(0);
  const posRef = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    posRef.current = { x, y };
    
    if (cursorRef.current && dotRef.current) {
      cursorRef.current.style.left = `${x}px`;
      cursorRef.current.style.top = `${y}px`;
      dotRef.current.style.left = `${x}px`;
      dotRef.current.style.top = `${y}px`;
    }
    
    setIsVisible(true);

    const now = Date.now();
    if (now - lastParticleTime.current > 80 && particles.length < 12) {
      lastParticleTime.current = now;
      const newParticle: Particle = {
        id: particleIdRef.current++,
        x,
        y,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        life: 1,
        size: 2 + Math.random() * 2,
      };
      setParticles(prev => [...prev, newParticle]);
    }
  }, [particles.length]);

  useEffect(() => {
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = !!(target.tagName === 'BUTTON' || 
          target.tagName === 'A' || 
          target.closest('button') || 
          target.closest('a') ||
          target.classList.contains('nav-btn') || 
          target.classList.contains('compose-btn') ||
          target.classList.contains('erow') || 
          target.classList.contains('avatar') ||
          target.classList.contains('sb-brand') || 
          target.classList.contains('init-btn') ||
          target.closest('[role="button"]'));
      
      setIsHovering(interactive);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [handleMouseMove]);

  useEffect(() => {
    let frameId: number;
    const animate = () => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 0.015,
            size: p.size * 0.99,
          }))
          .filter(p => p.life > 0)
      );
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  if (typeof window !== 'undefined' && 'ontouchstart' in window) {
    return null;
  }

  return (
    <>
      <div 
        ref={cursorRef}
        className={`custom-cursor ${isHovering ? 'hover' : ''} ${isVisible ? 'visible' : ''}`}
        aria-hidden="true"
      />
      <div 
        ref={dotRef}
        className={`cursor-dot ${isHovering ? 'hover' : ''} ${isVisible ? 'visible' : ''}`}
        aria-hidden="true"
      />
      <div className="cursor-particles" aria-hidden="true">
        {particles.map(p => (
          <div
            key={p.id}
            className="cursor-particle"
            style={{
              left: p.x,
              top: p.y,
              opacity: p.life,
              width: p.size,
              height: p.size,
            }}
          />
        ))}
      </div>
    </>
  );
}
