import { useEffect, useState } from 'react';
import { KeyRound, Save, Eye, EyeOff, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useStore } from '../lib/store.js';

export default function Settings() {
  const loadConfig = useStore((s) => s.loadConfig);

  const [data, setData] = useState(null);
  const [form, setForm] = useState({
    ANTHROPIC_API_KEY: '',
    OPENAI_API_KEY: '',
    DEFAULT_PROVIDER: 'anthropic',
    DEFAULT_MODEL: 'claude-sonnet-4-6',
    WHISPER_MODEL: 'whisper-1'
  });
  const [show, setShow] = useState({ anthropic: false, openai: false });
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setForm((f) => ({
          ...f,
          DEFAULT_PROVIDER: d.defaultProvider || f.DEFAULT_PROVIDER,
          DEFAULT_MODEL: d.defaultModel || f.DEFAULT_MODEL,
          WHISPER_MODEL: d.redacted?.WHISPER_MODEL || f.WHISPER_MODEL
        }));
      })
      .catch((e) => setStatus({ kind: 'err', message: e.message }));
  }, []);

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      // only send keys the user changed (non-empty strings)
      const payload = {};
      for (const k of [
        'ANTHROPIC_API_KEY',
        'OPENAI_API_KEY',
        'DEFAULT_PROVIDER',
        'DEFAULT_MODEL',
        'WHISPER_MODEL'
      ]) {
        if (form[k]) payload[k] = form[k];
      }
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setData((d) => ({ ...(d || {}), redacted: data.redacted, providers: data.providers }));
      setForm((f) => ({ ...f, ANTHROPIC_API_KEY: '', OPENAI_API_KEY: '' }));
      setStatus({ kind: 'ok', message: 'Saved. Providers reloaded.' });
      // refresh top-bar config
      await loadConfig();
    } catch (err) {
      setStatus({ kind: 'err', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const providers = data?.providers || { anthropic: false, openai: false };
  const modelsFor = (p) => data?.models?.[p] || [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10 lg:px-10">
      <header className="animate-slide-up">
        <div className="chip">
          <Sparkles size={11} className="text-accent-soft" />
          <span className="text-accent-soft">Settings</span>
        </div>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">API keys & defaults</h1>
        <p className="mt-1.5 text-[14px] text-ink-300">
          Keys are stored locally in your user data folder, never sent anywhere except to the model provider.
        </p>
      </header>

      <section className="glass overflow-hidden animate-fade-in">
        <div className="flex items-center gap-2 border-b border-white/[0.05] px-5 py-3.5">
          <KeyRound size={15} className="text-accent-soft" />
          <h3 className="font-display text-[15px] font-semibold text-white">Providers</h3>
        </div>

        <div className="space-y-5 p-5">
          <KeyField
            label="Anthropic API Key"
            placeholder={providers.anthropic ? `Saved: ${data.redacted.ANTHROPIC_API_KEY}` : 'sk-ant-…'}
            value={form.ANTHROPIC_API_KEY}
            onChange={(v) => setForm({ ...form, ANTHROPIC_API_KEY: v })}
            visible={show.anthropic}
            toggleVisible={() => setShow({ ...show, anthropic: !show.anthropic })}
            ok={providers.anthropic}
            help="Recommended. Powers Claude Sonnet/Opus 4.x."
          />
          <KeyField
            label="OpenAI API Key"
            placeholder={providers.openai ? `Saved: ${data.redacted.OPENAI_API_KEY}` : 'sk-…'}
            value={form.OPENAI_API_KEY}
            onChange={(v) => setForm({ ...form, OPENAI_API_KEY: v })}
            visible={show.openai}
            toggleVisible={() => setShow({ ...show, openai: !show.openai })}
            ok={providers.openai}
            help="Optional. Enables GPT-4.1 / 4o and Whisper transcription."
          />
        </div>
      </section>

      <section className="glass overflow-hidden animate-fade-in">
        <div className="flex items-center gap-2 border-b border-white/[0.05] px-5 py-3.5">
          <h3 className="font-display text-[15px] font-semibold text-white">Defaults</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div>
            <div className="label">Default provider</div>
            <select
              value={form.DEFAULT_PROVIDER}
              onChange={(e) => {
                const v = e.target.value;
                const list = modelsFor(v);
                setForm({ ...form, DEFAULT_PROVIDER: v, DEFAULT_MODEL: list[0] || form.DEFAULT_MODEL });
              }}
              className="input mt-1.5"
            >
              <option value="anthropic" className="bg-ink-900">anthropic</option>
              <option value="openai" className="bg-ink-900">openai</option>
            </select>
          </div>
          <div>
            <div className="label">Default model</div>
            <select
              value={form.DEFAULT_MODEL}
              onChange={(e) => setForm({ ...form, DEFAULT_MODEL: e.target.value })}
              className="input mt-1.5"
            >
              {modelsFor(form.DEFAULT_PROVIDER).map((m) => (
                <option key={m} value={m} className="bg-ink-900">
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">
          <Save size={14} /> {saving ? 'Saving…' : 'Save settings'}
        </button>
        {status && (
          <div
            className={[
              'flex items-center gap-2 text-xs',
              status.kind === 'ok' ? 'text-emerald-300' : 'text-red-300'
            ].join(' ')}
          >
            {status.kind === 'ok' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            {status.message}
          </div>
        )}
      </div>

      {data?.redacted?.configPath && (
        <p className="text-[11px] text-ink-500">
          Config file: <code className="rounded bg-white/[0.04] px-1.5 py-0.5">{data.redacted.configPath}</code>
        </p>
      )}
    </div>
  );
}

function KeyField({ label, placeholder, value, onChange, visible, toggleVisible, ok, help }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <label className="label">{label}</label>
        {ok && (
          <span className="chip border-emerald-300/30 text-emerald-300">
            <CheckCircle2 size={11} /> active
          </span>
        )}
      </div>
      <div className="mt-1.5 flex gap-2">
        <input
          type={visible ? 'text' : 'password'}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input flex-1 font-mono text-[13px]"
        />
        <button onClick={toggleVisible} className="btn px-3" type="button">
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {help && <p className="mt-1.5 text-[12px] text-ink-400">{help}</p>}
    </div>
  );
}
