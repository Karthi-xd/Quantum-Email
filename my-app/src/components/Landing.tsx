import { useState } from 'react';
import { Background } from './Background';
import { MatrixRain } from './MatrixRain';

interface LandingProps {
  onEnter: () => void;
}

export function Landing({ onEnter }: LandingProps) {
  const [syncing, setSyncing] = useState(false);

  const handleClick = () => {
    if (syncing) return;
    setSyncing(true);
    setTimeout(() => onEnter(), 2400);
  };

  return (
    <div className="landing">
      <Background />
      <MatrixRain />

      <div className="landing-center">
        <p className="brand-name">
          <span className="brand-q">Quantum</span> Protocol
        </p>

        <h1 className="main-line">MATRIX</h1>
        <p className="sub-line">Encrypted. Entangled. Beyond observation.</p>

        <button
          className={`init-btn ${syncing ? 'syncing' : ''}`}
          onClick={handleClick}
        >
          {syncing ? (
            <>
              <span className="sync-spinner" />
              syncing...
            </>
          ) : (
            'Initialize Interface'
          )}
        </button>

        <div className="node-status">
          <span className="pulse-dot" />
          node status: entangled
        </div>
      </div>
    </div>
  );
}
