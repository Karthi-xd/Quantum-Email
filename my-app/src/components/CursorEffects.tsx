import { useEffect, useRef, useCallback } from 'react';
import './CursorEffects.css';

const CHARS = '01アイウエオカキクケコ';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const charsRef = useRef<{ x: number; y: number; char: string; opacity: number; vy: number }[]>([]);
  const lastPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (cursorRef.current) {
      cursorRef.current.style.left = `${e.clientX}px`;
      cursorRef.current.style.top = `${e.clientY}px`;
    }

    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    const speed = Math.sqrt(dx * dx + dy * dy);

    if (speed > 3) {
      charsRef.current.push({
        x: e.clientX,
        y: e.clientY,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
        opacity: 1,
        vy: 1 + Math.random() * 2,
      });

      if (charsRef.current.length > 20) {
        charsRef.current.shift();
      }
    }

    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      const container = trailRef.current;
      if (container) {
        container.innerHTML = '';

        charsRef.current.forEach((c) => {
          c.y += c.vy;
          c.opacity -= 0.035;

          if (c.opacity > 0) {
            const el = document.createElement('div');
            el.className = 'matrix-char';
            el.style.cssText = `
              left: ${c.x}px;
              top: ${c.y}px;
              opacity: ${c.opacity};
              color: rgba(0, ${180 + c.opacity * 75}, 255, ${c.opacity});
              text-shadow: 0 0 ${3 + c.opacity * 6}px rgba(0, 255, 136, ${c.opacity * 0.3});
            `;
            el.textContent = c.char;
            container.appendChild(el);
          }
        });

        charsRef.current = charsRef.current.filter((c) => c.opacity > 0);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [handleMouseMove]);

  if (typeof window !== 'undefined' && 'ontouchstart' in window) {
    return null;
  }

  return (
    <>
      <div ref={cursorRef} className="cursor" />
      <div ref={trailRef} className="cursor-trail" />
    </>
  );
}
