"use client";

/**
 * Tiny trend chart. The line/area stretch to the container (preserveAspectRatio none),
 * while the dots are positioned as HTML so they stay perfectly round.
 */
export function Sparkline({ points, height = 56, className }: { points: (number | null)[]; height?: number; className?: string }) {
  const n = points.length;
  if (n === 0) return null;
  const w = 100;
  const pad = 5;
  const step = n > 1 ? w / (n - 1) : 0;
  const coords = points.map((p, i) => ({
    x: n > 1 ? i * step : w / 2,
    y: p === null ? null : height - pad - (p / 100) * (height - pad * 2),
    v: p,
  }));
  const segs: string[] = [];
  let d = "";
  coords.forEach((c) => {
    if (c.y === null) {
      if (d) segs.push(d);
      d = "";
      return;
    }
    d += d ? ` L ${c.x} ${c.y}` : `M ${c.x} ${c.y}`;
  });
  if (d) segs.push(d);
  const defined = coords.filter((c) => c.y !== null);
  const first = defined[0];
  const last = defined[defined.length - 1];
  const area = first && last && segs.length === 1 && defined.length > 1 ? `${segs[0]} L ${last.x} ${height} L ${first.x} ${height} Z` : null;
  return (
    <div className={`relative ${className ?? ""}`} style={{ height }} aria-hidden>
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
        <defs>
          <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {area && <path d={area} fill="url(#spark-fill)" />}
        {segs.map((s, i) => (
          <path key={i} d={s} fill="none" stroke="var(--accent)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        ))}
      </svg>
      {coords.map(
        (c, i) =>
          c.y !== null && (
            <span
              key={i}
              title={`${c.v}%`}
              className="absolute h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-accent bg-surface"
              style={{ left: `${(c.x / w) * 100}%`, top: c.y }}
            />
          ),
      )}
    </div>
  );
}
