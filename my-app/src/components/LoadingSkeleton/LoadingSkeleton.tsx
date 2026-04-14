const quantums = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: 10 + Math.random() * 80,
  top: 10 + Math.random() * 80,
  size: 2 + Math.random() * 4,
  duration: 2 + Math.random() * 3,
  delay: Math.random() * 2,
}));

export function EmailListSkeleton() {
  return (
    <div className="email-list-skeleton">
      <div className="skeleton-aurora" aria-hidden="true">
        {quantums.map((q) => (
          <div
            key={q.id}
            className="quantum-pulse"
            style={{
              left: `${q.left}%`,
              top: `${q.top}%`,
              width: q.size,
              height: q.size,
              animationDuration: `${q.duration}s`,
              animationDelay: `${q.delay}s`,
            }}
          />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 0.1}s` }}>
          <div className="skeleton-dot" />
          <div className="skeleton-avatar">
            <div className="avatar-ring" />
          </div>
          <div className="skeleton-content">
            <div className="skeleton-line short" />
            <div className="skeleton-line long" />
          </div>
          <div className="skeleton-time" />
        </div>
      ))}
    </div>
  );
}

export function EmailDetailSkeleton() {
  return (
    <div className="email-detail-skeleton">
      <div className="skeleton-aurora detail-aurora" aria-hidden="true">
        {quantums.slice(0, 6).map((q) => (
          <div
            key={q.id}
            className="quantum-pulse"
            style={{
              left: `${q.left}%`,
              top: `${q.top}%`,
              width: q.size,
              height: q.size,
              animationDuration: `${q.duration}s`,
              animationDelay: `${q.delay}s`,
            }}
          />
        ))}
      </div>
      <div className="skeleton-header">
        <div className="skeleton-line title" />
        <div className="skeleton-line subtitle" />
      </div>
      <div className="skeleton-body">
        <div className="skeleton-line full" />
        <div className="skeleton-line full" />
        <div className="skeleton-line long" />
        <div className="skeleton-line medium" />
      </div>
    </div>
  );
}
