export default function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center animate-fade-in">
      {Icon && (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
          <Icon size={22} className="text-accent-soft" />
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      {body && <p className="mt-2 max-w-sm text-sm text-ink-400">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
