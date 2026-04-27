import fs from 'node:fs';
import path from 'node:path';

let configPath = null;
let cached = null;

const ALLOWED_KEYS = [
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'DEFAULT_PROVIDER',
  'DEFAULT_MODEL',
  'WHISPER_MODEL'
];

export function initConfigStore(dir) {
  if (!dir) return;
  fs.mkdirSync(dir, { recursive: true });
  configPath = path.join(dir, 'config.json');
  cached = readFromDisk();
}

function readFromDisk() {
  if (!configPath) return {};
  try {
    if (!fs.existsSync(configPath)) return {};
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getStoredConfig() {
  if (cached === null) cached = readFromDisk();
  return { ...cached };
}

export function setStoredConfig(patch) {
  const next = { ...getStoredConfig() };
  for (const [k, v] of Object.entries(patch || {})) {
    if (!ALLOWED_KEYS.includes(k)) continue;
    if (v == null || v === '') delete next[k];
    else next[k] = String(v);
  }
  cached = next;
  if (configPath) {
    fs.writeFileSync(configPath, JSON.stringify(next, null, 2), 'utf-8');
  }
  return next;
}

/** Settings UI never sees raw secrets — return a redacted view. */
export function getRedactedConfig() {
  const c = getStoredConfig();
  const redact = (v) => (v ? `${v.slice(0, 4)}…${v.slice(-4)}` : '');
  return {
    ANTHROPIC_API_KEY: redact(c.ANTHROPIC_API_KEY),
    OPENAI_API_KEY: redact(c.OPENAI_API_KEY),
    DEFAULT_PROVIDER: c.DEFAULT_PROVIDER || '',
    DEFAULT_MODEL: c.DEFAULT_MODEL || '',
    WHISPER_MODEL: c.WHISPER_MODEL || '',
    hasAnthropic: !!c.ANTHROPIC_API_KEY,
    hasOpenAI: !!c.OPENAI_API_KEY,
    configPath
  };
}
