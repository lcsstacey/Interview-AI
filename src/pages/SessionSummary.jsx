import { useStore } from '../lib/store.js';
import Markdown from '../components/Markdown.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { ScrollText, ArrowRight, Mic } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SessionSummary() {
  const { lastSummary, sessions } = useStore();
  const latest = sessions[0];
  const text = lastSummary || latest?.summary;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 lg:px-8">
      {!text ? (
        <div className="glass p-10">
          <EmptyState
            icon={ScrollText}
            title="No session summary yet"
            body="Finish a mock session and click End & Save to generate a beautiful coaching summary."
            action={
              <Link to="/session" className="btn-primary">
                <Mic size={15} /> Start a mock session <ArrowRight size={14} />
              </Link>
            }
          />
        </div>
      ) : (
        <article className="glass relative overflow-hidden p-8 lg:p-10 animate-slide-up">
          <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-accent/15 blur-[100px]" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-cyan2/10 blur-[110px]" />
          <div className="relative">
            <div className="chip">
              <ScrollText size={11} /> Session Summary
            </div>
            <Markdown className="mt-5">{text}</Markdown>
          </div>
        </article>
      )}
    </div>
  );
}
