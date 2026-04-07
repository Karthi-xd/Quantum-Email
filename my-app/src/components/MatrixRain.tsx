export function MatrixRain() {
  const cols = Array.from({ length: 20 });
  const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ';

  return (
    <div className="matrix-rain" aria-hidden="true">
      {cols.map((_, i) => (
        <div
          key={i}
          className="rain-col"
          style={{
            left: `${(i / 20) * 100}%`,
            animationDelay: `${(i * 0.41) % 4}s`,
            animationDuration: `${4 + (i * 0.33) % 4}s`,
          }}
        >
          {Array.from({ length: 24 }).map((_, j) => (
            <span key={j}>{chars[Math.floor(Math.random() * chars.length)]}</span>
          ))}
        </div>
      ))}
    </div>
  );
}
