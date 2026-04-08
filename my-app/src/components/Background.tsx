const particles = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: 1 + Math.random() * 2,
  duration: 20 + Math.random() * 30,
  delay: Math.random() * 10,
  opacity: 0.05 + Math.random() * 0.05,
}));

export function Background() {
  return (
    <div className="bg" aria-hidden="true">
      <div className="orb o1" />
      <div className="orb o2" />
      <div className="orb o3" />
      <div className="scanline" />
      {particles.map((p) => (
        <div
          key={p.id}
          className="micro-particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}
