import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Mic,
  Code2,
  FolderOpen,
  Sparkles,
  ScrollText
} from 'lucide-react';

const items = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/session', label: 'Mock Session', icon: Mic },
  { to: '/coding', label: 'Coding Practice', icon: Code2 },
  { to: '/knowledge', label: 'Knowledge', icon: FolderOpen },
  { to: '/summary', label: 'Last Summary', icon: ScrollText }
];

export default function Sidebar() {
  return (
    <aside className="hidden h-full w-[244px] shrink-0 flex-col border-r border-white/[0.06] bg-ink-950/60 backdrop-blur-xl md:flex">
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-7">
        <Logo />
        <div className="leading-tight">
          <div className="font-display text-[15px] font-semibold tracking-tight">Interview Studio</div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-ink-400">AI Coach</div>
        </div>
      </div>

      <nav className="flex-1 px-3">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'group relative my-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-white/[0.06] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]'
                  : 'text-ink-300 hover:bg-white/[0.04] hover:text-ink-100'
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={isActive ? 'text-accent-soft' : 'text-ink-400'} />
                <span>{label}</span>
                {isActive && (
                  <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_2px_rgba(124,92,255,0.7)]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <div className="glass mt-4 px-4 py-3.5">
          <div className="flex items-center gap-2 text-accent-soft">
            <Sparkles size={14} />
            <span className="label !text-accent-soft">Practice mode</span>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-300">
            For mock interview prep & coaching. Use during permitted, recorded practice — not as a hidden assist
            during real interviews.
          </p>
        </div>
      </div>
    </aside>
  );
}

function Logo() {
  return (
    <div className="relative flex h-9 w-9 items-center justify-center rounded-xl">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent to-cyan2" />
      <div className="absolute inset-[1.5px] rounded-[10px] bg-ink-950" />
      <div className="relative h-1.5 w-1.5 rounded-full bg-gradient-to-br from-accent to-cyan2 shadow-[0_0_10px_2px_rgba(124,92,255,0.7)]" />
      <div className="absolute h-3 w-3 animate-pulse-soft rounded-full border border-accent/40" />
    </div>
  );
}
