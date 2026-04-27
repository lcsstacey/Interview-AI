import { Link } from 'react-router-dom';
import { useStore } from '../lib/store.js';
import StatCard from '../components/StatCard.jsx';
import {
  Mic,
  Code2,
  FileText,
  Sparkles,
  ArrowRight,
  Clock,
  Trash2,
  Activity,
  Trophy,
  TrendingUp,
  Target
} from 'lucide-react';
import { formatRelative } from '../lib/format.js';

export default function Dashboard() {
  const { sessions, removeSession, resume } = useStore();

  const totalQuestions = sessions.reduce((n, s) => n + (s.questionCount || 0), 0);
  const lastReadiness =
    sessions.find((s) => typeof s.readiness === 'number')?.readiness ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8 lg:px-10 lg:py-10">
      <Hero />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sessions"
          value={sessions.length}
          sub={sessions.length ? 'practice sessions completed' : 'No sessions yet — start one'}
        />
        <StatCard
          label="Questions practiced"
          value={totalQuestions}
          sub={totalQuestions ? 'across all sessions' : 'Mock & coding combined'}
        />
        <StatCard
          label="Readiness"
          value={lastReadiness != null ? `${lastReadiness}` : '—'}
          sub={lastReadiness != null ? 'from your last summary' : 'Generate a summary to see it'}
          accent={lastReadiness != null && lastReadiness >= 70}
        />
        <StatCard
          label="Resume loaded"
          value={resume.text ? '✓' : '—'}
          sub={resume.text ? resume.name || 'pasted resume' : 'Upload to personalise answers'}
        />
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ActionCard
          to="/session"
          icon={Mic}
          title="Start a Mock Interview"
          body="Behavioral, system design, or general — practice out loud with AI coaching."
          accent
        />
        <ActionCard
          to="/coding"
          icon={Code2}
          title="Coding Practice"
          body="Paste a problem or write your own. Get approach, complexity, solution and walkthrough."
        />
        <ActionCard
          to="/knowledge"
          icon={FileText}
          title="Resume & Stories"
          body="Upload a resume, add story bullets — AI tailors answers to you."
        />
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="glass p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-white">Recent sessions</h3>
            <span className="chip">{sessions.length}</span>
          </div>
          <div className="mt-4 divide-y divide-white/[0.05]">
            {sessions.length === 0 && (
              <div className="py-8 text-sm text-ink-400">
                No sessions yet. Try a{' '}
                <Link to="/session" className="text-accent-soft underline-offset-4 hover:underline">
                  mock interview
                </Link>{' '}
                or{' '}
                <Link to="/coding" className="text-accent-soft underline-offset-4 hover:underline">
                  coding round
                </Link>
                .
              </div>
            )}
            {sessions.map((s) => (
              <Link
                key={s.id}
                to="/summary"
                className="flex items-center gap-3 py-3 text-sm transition hover:bg-white/[0.03] -mx-3 px-3 rounded-lg"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.04]">
                  {s.kind === 'coding' ? (
                    <Code2 size={15} className="text-cyan2" />
                  ) : (
                    <Mic size={15} className="text-accent-soft" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-ink-100">
                    {s.title || (s.kind === 'coding' ? 'Coding practice' : 'Mock interview')}
                  </div>
                  <div className="text-[12px] text-ink-400">
                    <span className="capitalize">{s.mode || s.kind}</span>
                    <span className="mx-1.5 text-ink-600">·</span>
                    <Clock size={11} className="-mt-0.5 mr-1 inline" />
                    {formatRelative(s.endedAt || s.startedAt)}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    removeSession(s.id);
                  }}
                  className="rounded-md p-1.5 text-ink-500 transition hover:bg-white/[0.06] hover:text-red-300"
                  aria-label="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </Link>
            ))}
          </div>
        </div>

        <div className="glass relative overflow-hidden p-5">
          <div className="pointer-events-none absolute -bottom-16 -right-12 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
          <h3 className="font-display text-base font-semibold text-white">Why Interview Studio?</h3>
          <ul className="mt-4 space-y-2.5 text-[13.5px] text-ink-300">
            <Feature icon={Activity} text="Live mock sessions with structured coaching." />
            <Feature icon={TrendingUp} text="Tracks readiness over time, spots weak topics." />
            <Feature icon={Target} text="Tailors answers to your resume and story bank." />
            <Feature icon={Trophy} text="Generates beautiful post-session notes." />
          </ul>
        </div>
      </section>
    </div>
  );
}

function Hero() {
  return (
    <section className="glass relative overflow-hidden p-8 lg:p-10 animate-slide-up">
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-accent/20 blur-[100px]" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-cyan2/10 blur-[110px]" />
      <div className="relative z-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
        <div className="max-w-2xl">
          <span className="chip">
            <Sparkles size={11} className="text-accent-soft" />
            <span className="text-accent-soft">Practice studio</span>
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-[1.1] tracking-tight lg:text-[40px]">
            <span className="gradient-text">Practice smarter.</span>
            <br />
            Interview sharper.
          </h1>
          <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-ink-300">
            Run mock interviews out loud, sharpen coding answers, and get structured AI coaching grounded in your
            resume. Built for preparation, not deception.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/session" className="btn-primary">
            <Mic size={15} />
            Start mock session
            <ArrowRight size={15} />
          </Link>
          <Link to="/coding" className="btn">
            <Code2 size={15} />
            Coding practice
          </Link>
        </div>
      </div>
    </section>
  );
}

function ActionCard({ to, icon: Icon, title, body, accent }) {
  return (
    <Link
      to={to}
      className={`glass group relative flex h-full flex-col justify-between overflow-hidden p-5 transition hover:bg-white/[0.05] ${
        accent ? 'shadow-glow' : ''
      }`}
    >
      {accent && (
        <div className="pointer-events-none absolute -top-12 -right-10 h-32 w-32 rounded-full bg-accent/30 blur-3xl" />
      )}
      <div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04]">
          <Icon size={18} className={accent ? 'text-accent-soft' : 'text-ink-200'} />
        </div>
        <h3 className="mt-4 font-display text-base font-semibold text-white">{title}</h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-300">{body}</p>
      </div>
      <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-accent-soft transition group-hover:gap-2.5">
        Open <ArrowRight size={13} />
      </div>
    </Link>
  );
}

function Feature({ icon: Icon, text }) {
  return (
    <li className="flex items-start gap-2.5">
      <Icon size={14} className="mt-1 text-accent-soft" />
      <span>{text}</span>
    </li>
  );
}
