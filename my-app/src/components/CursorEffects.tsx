import { useEffect, useRef, useState, useCallback } from 'react';
import './CursorEffects.css';

interface TrailPoint {
  x: number;
  y: number;
  opacity: number;
}

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const trailPoints = useRef<TrailPoint[]>([]);
  const lastPos = useRef({ x: 0, y: 0 });
  const rafId = useRef<number>(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (cursorRef.current) {
      cursorRef.current.style.left = `${e.clientX}px`;
      cursorRef.current.style.top = `${e.clientY}px`;
    }

    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    const speed = Math.sqrt(dx * dx + dy * dy);

    if (speed > 3) {
      trailPoints.current.push({
        x: e.clientX,
        y: e.clientY,
        opacity: 0.6,
      });

      if (trailPoints.current.length > 15) {
        trailPoints.current.shift();
      }
    }

    lastPos.current = { x: e.clientX, y: e.clientY };
    setIsVisible(true);
  }, []);

  const animateTrail = useCallback(() => {
    if (trailRef.current) {
      const trailContainer = trailRef.current;
      const currentPoints = trailPoints.current;

      const existingDots = trailContainer.querySelectorAll('.trail-dot');
      existingDots.forEach((dot) => dot.remove());

      currentPoints.forEach((point) => {
        point.opacity -= 0.04;
        if (point.opacity > 0) {
          const dot = document.createElement('div');
          dot.className = 'trail-dot';
          dot.style.left = `${point.x}px`;
          dot.style.top = `${point.y}px`;
          dot.style.opacity = point.opacity.toString();
          dot.style.transform = `translate(-50%, -50%) scale(${0.5 + point.opacity * 0.8})`;
          trailContainer.appendChild(dot);
        }
      });

      trailPoints.current = currentPoints.filter((p) => p.opacity > 0);
    }

    rafId.current = requestAnimationFrame(animateTrail);
  }, []);

  useEffect(() => {
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = !!(
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.classList.contains('nav-btn') ||
        target.classList.contains('compose-btn') ||
        target.classList.contains('erow') ||
        target.classList.contains('avatar') ||
        target.classList.contains('sb-brand') ||
        target.classList.contains('init-btn') ||
        target.closest('[role="button"]') ||
        target.closest('[role="search"]')
      );

      setIsHovering(interactive);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseover', handleMouseOver);

    rafId.current = requestAnimationFrame(animateTrail);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseover', handleMouseOver);
      cancelAnimationFrame(rafId.current);
    };
  }, [handleMouseMove, animateTrail]);

  if (typeof window !== 'undefined' && 'ontouchstart' in window) {
    return null;
  }

  return (
    <>
      <div ref={trailRef} className="cursor-trail" aria-hidden="true" />
      <div
        ref={cursorRef}
        className={`cursor ${isHovering ? 'hover' : ''} ${isVisible ? 'visible' : ''}`}
        aria-hidden="true"
      />
    </>
  );
}
