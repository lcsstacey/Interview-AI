import { useStore } from '../lib/store.js';
import { ChevronDown, KeySquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TopBar() {
  const { config, provider, model, setProvider, setModel } = useStore();
  const providers = config
    ? Object.entries(config.providers)
        .filter(([, on]) => on)
        .map(([k]) => k)
    : [];

  const noKeys = config && providers.length === 0;

  return (
    <header className="flex items-center gap-3 border-b border-white/[0.06] bg-ink-950/40 px-6 py-3 backdrop-blur-xl">
      <div className="hidden md:block">
        <div className="text-[13px] text-ink-400">
          <span className="text-ink-200 font-medium">Practice smarter.</span> Interview sharper.
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {noKeys ? (
          <Link
            to="/settings"
            className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/[0.06] px-3 py-1.5 text-xs text-amber-200 transition hover:bg-amber-400/[0.1]"
          >
            <KeySquare size={14} />
            No API keys yet — open Settings to add one
          </Link>
        ) : (
          <>
            <Select
              value={provider}
              onChange={setProvider}
              options={providers.map((p) => ({ value: p, label: p }))}
            />
            <Select
              value={model}
              onChange={setModel}
              options={(config?.models?.[provider] || []).map((m) => ({ value: m, label: m }))}
            />
          </>
        )}
      </div>
    </header>
  );
}

function Select({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-xl border border-white/[0.06] bg-white/[0.04] py-1.5 pl-3 pr-8 text-xs font-medium text-ink-100 outline-none transition hover:bg-white/[0.07] focus:border-accent/50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-ink-900 text-ink-100">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-400" />
    </div>
  );
}
