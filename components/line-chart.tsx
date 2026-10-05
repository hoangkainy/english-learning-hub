export function LineChart({ primary, secondary }: { primary: number[]; secondary?: number[] }) {
  const width = 600;
  const height = 180;
  const pad = 20;
  const toPoints = (values: number[]) => values.map((v, i) => {
    const x = pad + (i * (width - pad * 2)) / Math.max(values.length - 1, 1);
    const y = height - pad - (Math.max(0, Math.min(100, v)) / 100) * (height - pad * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="chart" role="img" aria-label="Progress line chart">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {[25,50,75].map(v => {
          const y = height - pad - (v / 100) * (height - pad * 2);
          return <line key={v} x1={pad} x2={width-pad} y1={y} y2={y} className="chart-grid" />;
        })}
        {secondary?.length ? <polyline points={toPoints(secondary)} className="chart-line secondary" /> : null}
        {primary.length ? <polyline points={toPoints(primary)} className="chart-line" /> : null}
        {primary.map((v,i) => {
          const x = pad + (i * (width - pad * 2)) / Math.max(primary.length - 1, 1);
          const y = height - pad - (Math.max(0, Math.min(100, v)) / 100) * (height - pad * 2);
          return <circle key={`${i}-${v}`} cx={x} cy={y} r="4" className="chart-dot" />;
        })}
      </svg>
    </div>
  );
}
