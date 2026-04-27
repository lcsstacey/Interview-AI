import { useState } from 'react';
import { useStore } from '../lib/store.js';
import { useAnswerStream } from '../hooks/useAnswerStream.js';
import Markdown from '../components/Markdown.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { Code2, Sparkles, Send, Square, ImagePlus, ChevronRight, FlaskConical, X } from 'lucide-react';

const STARTERS = [
  'Given an integer array, return the longest strictly-increasing subsequence length. Constraints: 1 ≤ n ≤ 2500.',
  'Design a function that, given a list of meeting intervals, returns the minimum number of conference rooms required.',
  'Implement an LRU cache supporting O(1) get / put.'
];

export default function CodingPractice() {
  const { provider, model, saveSession } = useStore();
  const [problem, setProblem] = useState('');
  const [language, setLanguage] = useState('Python');
  const [imageB64, setImageB64] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const stream = useAnswerStream();

  const onPickImage = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setImagePreview(url);
      setImageB64(url.split(',')[1] || null);
    };
    reader.readAsDataURL(file);
  };

  const solve = async () => {
    if (!problem && !imageB64) return;
    await stream.ask('/api/chat/answer', {
      mode: 'coding',
      question: problem ? `${problem}\n\nPreferred language: ${language}.` : `Solve the problem in the screenshot. Use ${language}.`,
      provider,
      model,
      imageBase64: imageB64
    });
    saveSession({
      kind: 'coding',
      mode: 'coding',
      title: problem ? problem.split('\n')[0].slice(0, 80) : 'Coding practice (image)',
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      transcript: problem,
      questionCount: 1
    });
  };

  return (
    <div className="grid h-full grid-cols-1 gap-4 px-6 py-5 lg:grid-cols-[420px_1fr] lg:px-8">
      {/* Left: problem */}
      <div className="glass flex min-h-0 flex-col overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
          <h2 className="label">Problem</h2>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-lg border border-white/[0.06] bg-white/[0.04] px-2.5 py-1 text-xs text-ink-100 outline-none"
          >
            {['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go', 'Rust'].map((l) => (
              <option key={l} className="bg-ink-900">
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            rows={12}
            placeholder="Paste a LeetCode-style problem here, or write your own…"
            className="input min-h-[260px] resize-none font-mono text-[13px]"
          />

          <div className="mt-3 flex items-center gap-2">
            <label className="btn cursor-pointer">
              <ImagePlus size={14} />
              Attach screenshot
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => onPickImage(e.target.files?.[0])}
              />
            </label>
            {imagePreview && (
              <button
                onClick={() => {
                  setImageB64(null);
                  setImagePreview(null);
                }}
                className="btn-ghost text-xs"
              >
                <X size={12} /> remove
              </button>
            )}
          </div>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="problem"
              className="mt-3 max-h-64 w-full rounded-xl border border-white/[0.06] object-contain"
            />
          )}

          <div className="mt-5">
            <div className="label flex items-center gap-1.5">
              <FlaskConical size={11} /> Starter problems
            </div>
            <div className="mt-2 space-y-1.5">
              {STARTERS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setProblem(s)}
                  className="group flex w-full items-start gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2 text-left text-[12.5px] text-ink-300 transition hover:bg-white/[0.05] hover:text-ink-100"
                >
                  <ChevronRight size={13} className="mt-0.5 text-ink-500 transition group-hover:text-accent-soft" />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/[0.05] p-3.5">
          <button
            onClick={solve}
            disabled={stream.streaming || (!problem && !imageB64)}
            className="btn-primary w-full disabled:opacity-50"
          >
            <Send size={14} /> Solve problem
          </button>
        </div>
      </div>

      {/* Right: solution */}
      <div className="glass flex min-h-0 flex-col overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
          <h2 className="label">Solution</h2>
          {stream.streaming ? (
            <button onClick={stream.stop} className="btn-ghost text-xs">
              <Square size={12} /> Stop
            </button>
          ) : (
            <span className="chip">
              <Sparkles size={11} /> {stream.streaming ? 'streaming' : 'idle'}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {stream.error && (
            <div className="mb-3 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200">
              {stream.error}
            </div>
          )}
          {stream.text ? (
            <Markdown>{stream.text}</Markdown>
          ) : (
            <EmptyState
              icon={Code2}
              title="Paste a problem to begin"
              body="You'll get clarifying questions, an approach, complexity, a clean solution, a walkthrough, and edge cases."
            />
          )}
        </div>
      </div>
    </div>
  );
}
