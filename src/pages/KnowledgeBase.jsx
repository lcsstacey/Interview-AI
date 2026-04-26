import { useRef, useState } from 'react';
import { useStore } from '../lib/store.js';
import { uploadFile } from '../lib/api.js';
import {
  FileText,
  FolderOpen,
  Upload,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';

export default function KnowledgeBase() {
  const { resume, setResume, notes, setNotes, stories, addStory, removeStory } = useStore();

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-6 py-8 lg:grid-cols-[1.1fr_1fr] lg:px-10">
      <div className="space-y-5">
        <DocumentCard
          title="Resume"
          icon={FileText}
          doc={resume}
          setDoc={setResume}
          accept=".pdf,.txt,.md,.json,.csv"
          placeholder="Or paste your resume content here…"
        />
        <DocumentCard
          title="Notes & References"
          icon={FolderOpen}
          doc={notes}
          setDoc={setNotes}
          accept=".pdf,.txt,.md,.json,.csv"
          placeholder="Company info, project details, relevant articles…"
        />
      </div>

      <StoryBank stories={stories} addStory={addStory} removeStory={removeStory} />
    </div>
  );
}

function DocumentCard({ title, icon: Icon, doc, setDoc, accept, placeholder }) {
  const fileRef = useRef(null);
  const [status, setStatus] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setStatus({ kind: 'uploading', message: `Parsing ${file.name}…` });
    try {
      const data = await uploadFile('/api/upload/document', file);
      setDoc({ name: data.name, text: data.text });
      setStatus({ kind: 'ok', message: `Loaded ${data.name}` });
    } catch (err) {
      setStatus({ kind: 'err', message: err.message });
    }
  };

  return (
    <div className="glass overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-accent-soft" />
          <h3 className="font-display text-[15px] font-semibold text-white">{title}</h3>
          {doc.name && <span className="chip">{doc.name}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => fileRef.current?.click()} className="btn-ghost text-xs">
            <Upload size={13} /> Upload
          </button>
          {doc.text && (
            <button
              onClick={() => {
                setDoc({ name: '', text: '' });
                setStatus(null);
              }}
              className="btn-ghost text-xs text-red-300 hover:text-red-200"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      <div className="p-4">
        <textarea
          value={doc.text}
          onChange={(e) => setDoc({ ...doc, text: e.target.value })}
          rows={8}
          className="input min-h-[180px] resize-none font-mono text-[12.5px]"
          placeholder={placeholder}
        />
        {status && (
          <div
            className={[
              'mt-3 flex items-center gap-2 text-xs',
              status.kind === 'ok' ? 'text-emerald-300' : status.kind === 'err' ? 'text-red-300' : 'text-ink-400'
            ].join(' ')}
          >
            {status.kind === 'ok' ? (
              <CheckCircle2 size={13} />
            ) : status.kind === 'err' ? (
              <AlertCircle size={13} />
            ) : (
              <span className="h-2 w-2 animate-pulse-soft rounded-full bg-accent" />
            )}
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}

function StoryBank({ stories, addStory, removeStory }) {
  const [draft, setDraft] = useState({ title: '', situation: '', task: '', action: '', result: '' });
  const valid = draft.title.trim() && draft.situation.trim() && draft.action.trim() && draft.result.trim();
  return (
    <div className="glass flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3.5">
        <div className="flex items-center gap-2">
          <BookOpen size={15} className="text-accent-soft" />
          <h3 className="font-display text-[15px] font-semibold text-white">Story Bank</h3>
          <span className="chip">{stories.length}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 p-4">
        {stories.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No stories yet"
            body="Add your strongest STAR-shaped stories here. The AI will weave them into behavioral answers."
          />
        ) : (
          stories.map((s) => (
            <div key={s.id} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-display font-semibold text-white">{s.title}</h4>
                <button
                  onClick={() => removeStory(s.id)}
                  className="rounded p-1 text-ink-500 hover:bg-white/[0.06] hover:text-red-300"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <dl className="mt-2 space-y-1 text-[12.5px] text-ink-300">
                <Field k="Situation" v={s.situation} />
                <Field k="Task" v={s.task} />
                <Field k="Action" v={s.action} />
                <Field k="Result" v={s.result} />
              </dl>
            </div>
          ))
        )}

        <div className="rounded-xl border border-dashed border-white/[0.08] p-3.5">
          <div className="label">New story</div>
          <input
            className="input mt-2"
            placeholder="Title (e.g. Migrating us off legacy auth)"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <textarea
              className="input min-h-[64px] resize-none text-[12.5px]"
              placeholder="Situation"
              value={draft.situation}
              onChange={(e) => setDraft({ ...draft, situation: e.target.value })}
            />
            <textarea
              className="input min-h-[64px] resize-none text-[12.5px]"
              placeholder="Task"
              value={draft.task}
              onChange={(e) => setDraft({ ...draft, task: e.target.value })}
            />
            <textarea
              className="input min-h-[64px] resize-none text-[12.5px]"
              placeholder="Action"
              value={draft.action}
              onChange={(e) => setDraft({ ...draft, action: e.target.value })}
            />
            <textarea
              className="input min-h-[64px] resize-none text-[12.5px]"
              placeholder="Result"
              value={draft.result}
              onChange={(e) => setDraft({ ...draft, result: e.target.value })}
            />
          </div>
          <button
            disabled={!valid}
            onClick={() => {
              addStory(draft);
              setDraft({ title: '', situation: '', task: '', action: '', result: '' });
            }}
            className="btn-primary mt-3 w-full disabled:opacity-40"
          >
            <Plus size={14} /> Add story
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ k, v }) {
  if (!v) return null;
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-[11px] uppercase tracking-wider text-ink-500">{k}</dt>
      <dd className="flex-1">{v}</dd>
    </div>
  );
}
