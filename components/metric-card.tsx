export function MetricCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <section className="card flat">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {note ? <div className="delta">{note}</div> : null}
    </section>
  );
}
