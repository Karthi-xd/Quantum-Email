import { useEffect, useRef, useState, useCallback } from 'react';
import './CursorEffects.css';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (cursorRef.current) {
      cursorRef.current.style.left = `${e.clientX}px`;
      cursorRef.current.style.top = `${e.clientY}px`;
    }
    setIsVisible(true);
  }, []);

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

  if (typeof window !== 'undefined' && 'ontouchstart' in window) {
    return null;
  }

  return (
    <div 
      ref={cursorRef}
      className={`custom-cursor ${isHovering ? 'hover' : ''} ${isVisible ? 'visible' : ''}`}
      aria-hidden="true"
    >
      <div className="cursor-ring" />
      <div className="cursor-dot" />
    </div>
  );
}
