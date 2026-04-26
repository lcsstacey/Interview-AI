import { useEffect, useRef, useState } from 'react';
import { useStore } from '../lib/store.js';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition.js';
import { useAnswerStream } from '../hooks/useAnswerStream.js';
import Markdown from '../components/Markdown.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatDuration } from '../lib/format.js';
import {
  Mic,
  MicOff,
  Square,
  Sparkles,
  Send,
  Wand2,
  Star,
  Scissors,
  GraduationCap,
  Save,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MODES = [
  { value: 'general', label: 'General' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'system-design', label: 'System Design' }
];

export default function MockSession() {
  const navigate = useNavigate();
  const { provider, model, resume, notes, saveSession, setLastSummary } = useStore();

  const [mode, setMode] = useState('behavioral');
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [question, setQuestion] = useState('');
  const [draft, setDraft] = useState('');
  const [questionsCovered, setQuestionsCovered] = useState([]);

  const transcriptRef = useRef(null);
  const startedAt = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  // session timer
  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - startedAt.current), 1000);
    return () => clearInterval(t);
  }, []);

  const speech = useSpeechRecognition({
    onFinal: (text) => {
      setTranscript((prev) => `${prev}${prev ? '\n' : ''}${text}`);
      setInterim('');
      const lower = text.toLowerCase();
      const looksQuestion =
        text.endsWith('?') ||
        /^(what|why|how|when|where|who|which|tell me|describe|walk me|explain|can you|could you|do you|have you|would you)\b/.test(lower);
      if (looksQuestion) {
        setQuestion(text);
        setQuestionsCovered((q) => (q.includes(text) ? q : [...q, text]));
      }
    },
    onInterim: (text) => setInterim(text)
  });

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
  }, [transcript, interim]);

  const stream = useAnswerStream();

  const ask = async (overrides = {}) => {
    await stream.ask('/api/chat/answer', {
      mode,
      question,
      draft,
      transcript,
      resumeText: resume.text,
      notesText: notes.text,
      provider,
      model,
      ...overrides
    });
  };

  const coach = async (kind) => {
    if (!draft && !stream.text) {
      stream.setText('_Add a draft answer first (in the composer below) so I can coach you on it._');
      return;
    }
    await stream.ask('/api/chat/coach', {
      kind,
      draft: draft || stream.text,
      question,
      resumeText: resume.text,
      notesText: notes.text,
      provider,
      model
    });
  };

  const endAndSave = async () => {
    if (!transcript.trim() && questionsCovered.length === 0) {
      navigate('/');
      return;
    }
    // Generate summary
    let summary = '';
    await stream.ask('/api/chat/summary', {
      transcript: `Mode: ${mode}\nDuration: ${formatDuration(elapsed)}\nQuestions covered:\n- ${questionsCovered.join('\n- ')}\n\nTranscript:\n${transcript}`,
      provider,
      model
    });
    summary = stream.text;
    setLastSummary(summary);
    saveSession({
      kind: 'mock',
      mode,
      title: questionsCovered[0] || `Mock interview (${mode})`,
      startedAt: new Date(startedAt.current).toISOString(),
      endedAt: new Date().toISOString(),
      transcript,
      summary,
      questionCount: questionsCovered.length
    });
    navigate('/summary');
  };

  return (
    <div className="grid h-full grid-cols-1 grid-rows-[auto,1fr,auto] gap-4 px-6 py-5 lg:grid-cols-[1.1fr_1fr] lg:px-8">
      {/* Status bar */}
      <div className="lg:col-span-2 flex flex-wrap items-center gap-3">
        <ModeTabs mode={mode} setMode={setMode} />
        <div className="ml-auto flex items-center gap-2">
          <SessionPill listening={speech.listening} elapsed={elapsed} />
          {speech.supported ? (
            <button
              onClick={speech.toggle}
              className={speech.listening ? 'btn-primary' : 'btn'}
              aria-pressed={speech.listening}
            >
              {speech.listening ? <MicOff size={15} /> : <Mic size={15} />}
              {speech.listening ? 'Pause Mic' : 'Start Mic'}
            </button>
          ) : (
            <span className="chip text-amber-200">
              <AlertCircle size={11} /> Use Chrome for mic
            </span>
          )}
          <button onClick={endAndSave} className="btn">
            <Save size={15} /> End & Save
          </button>
        </div>
      </div>

      {/* Left: transcript */}
      <div className="glass flex min-h-0 flex-col overflow-hidden animate-fade-in">
        <Header
          title="Live Transcript"
          right={
            transcript.trim() ? (
              <button
                onClick={() => {
                  setTranscript('');
                  setInterim('');
                  setQuestionsCovered([]);
                }}
                className="btn-ghost text-xs"
              >
                <Trash2 size={13} /> Clear
              </button>
            ) : null
          }
        />
        <div ref={transcriptRef} className="flex-1 overflow-y-auto px-6 py-4">
          {transcript || interim ? (
            <div className="space-y-3 text-[14.5px] leading-relaxed">
              {transcript.split('\n').filter(Boolean).map((line, i) => (
                <div key={i} className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3.5 py-2.5">
                  {line}
                </div>
              ))}
              {interim && (
                <div className="rounded-lg border border-dashed border-accent/30 bg-accent/[0.03] px-3.5 py-2.5 text-ink-300">
                  <span className="shimmer-text">{interim}</span>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={Mic}
              title="Speak your practice answer"
              body="Click Start Mic and answer out loud. I'll detect questions and coach your response."
            />
          )}
        </div>

        {questionsCovered.length > 0 && (
          <div className="border-t border-white/[0.05] px-5 py-3">
            <div className="label">Questions covered ({questionsCovered.length})</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {questionsCovered.slice(-4).map((q, i) => (
                <button
                  key={i}
                  onClick={() => setQuestion(q)}
                  className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[12px] text-ink-300 hover:bg-white/[0.07]"
                  title={q}
                >
                  {q.length > 60 ? q.slice(0, 60) + '…' : q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: coaching */}
      <div className="glass flex min-h-0 flex-col overflow-hidden animate-fade-in">
        <Header
          title="AI Coaching"
          right={
            stream.streaming ? (
              <button onClick={stream.stop} className="btn-ghost text-xs">
                <Square size={12} /> Stop
              </button>
            ) : (
              <span className={`chip ${stream.streaming ? 'border-accent/40 text-accent-soft' : ''}`}>
                <Sparkles size={11} /> {stream.streaming ? 'streaming' : 'idle'}
              </span>
            )
          }
        />
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {stream.error && (
            <div className="mb-3 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200">
              {stream.error}
            </div>
          )}
          {stream.text ? (
            <Markdown>{stream.text}</Markdown>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="Detect a question, get a polished answer"
              body="Or type a question below and hit Generate. Use the coaching buttons to refine your draft."
            />
          )}
        </div>
      </div>

      {/* Bottom composer */}
      <div className="lg:col-span-2 animate-slide-up">
        <div className="glass-strong rounded-2xl p-3.5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div>
              <div className="label">Detected / typed question</div>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={2}
                placeholder="Tell me about a time you led a difficult project…"
                className="input mt-1.5 resize-none"
              />
            </div>
            <div>
              <div className="label">Your draft answer (optional)</div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                placeholder="Write your first attempt — I'll improve it."
                className="input mt-1.5 resize-none"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => ask()} disabled={stream.streaming} className="btn-primary disabled:opacity-50">
              <Send size={14} /> Generate answer
            </button>
            <button onClick={() => coach('improve')} disabled={stream.streaming} className="btn">
              <Wand2 size={14} /> Improve my answer
            </button>
            <button onClick={() => coach('star')} disabled={stream.streaming} className="btn">
              <Star size={14} /> STAR version
            </button>
            <button onClick={() => coach('concise')} disabled={stream.streaming} className="btn">
              <Scissors size={14} /> More concise
            </button>
            <button onClick={() => coach('explain')} disabled={stream.streaming} className="btn">
              <GraduationCap size={14} /> Explain the topic
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ title, right }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
      <h2 className="label">{title}</h2>
      {right}
    </div>
  );
}

function ModeTabs({ mode, setMode }) {
  return (
    <div className="inline-flex rounded-xl border border-white/[0.06] bg-white/[0.03] p-1">
      {MODES.map((m) => (
        <button
          key={m.value}
          onClick={() => setMode(m.value)}
          className={[
            'rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium transition',
            mode === m.value ? 'bg-white/[0.08] text-white shadow-sm' : 'text-ink-300 hover:text-ink-100'
          ].join(' ')}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

function SessionPill({ listening, elapsed }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[12px] font-mono text-ink-300">
      <span
        className={[
          'h-2 w-2 rounded-full',
          listening ? 'bg-red-400 animate-pulse-soft shadow-[0_0_10px_2px_rgba(248,113,113,0.6)]' : 'bg-ink-500'
        ].join(' ')}
      />
      <span>{listening ? 'live' : 'idle'}</span>
      <span className="text-ink-600">·</span>
      <span>{formatDuration(elapsed)}</span>
    </div>
  );
}
