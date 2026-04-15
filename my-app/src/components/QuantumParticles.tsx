interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  type: 'quantum' | 'data' | 'energy';
  driftX: number;
  driftY: number;
}

const particles: Particle[] = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 3 + Math.random() * 5,
  duration: 15 + Math.random() * 12,
  delay: Math.random() * 10,
  type: ['quantum', 'data', 'energy'][Math.floor(Math.random() * 3)] as Particle['type'],
  driftX: -80 + Math.random() * 160,
  driftY: -80 + Math.random() * 160,
}));

export function QuantumParticles() {
  return (
    <div className="quantum-particles" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`q-particle q-${p.type}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `-${p.delay}s`,
            ['--drift-x' as string]: `${p.driftX}px`,
            ['--drift-y' as string]: `${p.driftY}px`,
          }}
        >
          {p.type === 'quantum' && <span className="q-orbit" />}
          {p.type === 'data' && <span className="q-core" />}
        </div>
      ))}
    </div>
  );
}
