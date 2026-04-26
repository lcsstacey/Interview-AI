export default function StatCard({ label, value, sub, accent = false }) {
  return (
    <div className={`glass relative overflow-hidden p-5 ${accent ? 'shadow-glow' : ''}`}>
      {accent && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/30 blur-3xl" />
      )}
      <div className="label">{label}</div>
      <div className="mt-2 font-display text-3xl font-semibold tracking-tight text-white">{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-400">{sub}</div>}
    </div>
  );
}
