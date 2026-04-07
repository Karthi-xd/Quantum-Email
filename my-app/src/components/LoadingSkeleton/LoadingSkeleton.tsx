export function EmailListSkeleton() {
  return (
    <div className="email-list-skeleton">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 0.1}s` }}>
          <div className="skeleton-dot" />
          <div className="skeleton-avatar" />
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
