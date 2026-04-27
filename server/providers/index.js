import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getEffectiveConfig } from '../env.js';

let _openai = null;
let _anthropic = null;
let _signature = '';

function configure() {
  const c = getEffectiveConfig();
  const sig = `${c.ANTHROPIC_API_KEY}|${c.OPENAI_API_KEY}`;
  if (sig === _signature) return;
  _signature = sig;
  _openai = c.OPENAI_API_KEY ? new OpenAI({ apiKey: c.OPENAI_API_KEY }) : null;
  _anthropic = c.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: c.ANTHROPIC_API_KEY }) : null;
}

/** Force re-read of config (e.g. after Settings UI saves new keys). */
export function reloadProviders() {
  _signature = '';
  configure();
}

export function getProviders() {
  configure();
  return { openai: _openai, anthropic: _anthropic };
}

export function getProviderStatus() {
  const { openai, anthropic } = getProviders();
  return { openai: !!openai, anthropic: !!anthropic };
}

export function pickProvider({ provider, model } = {}) {
  const { openai, anthropic } = getProviders();
  const cfg = getEffectiveConfig();
  const p = provider || cfg.DEFAULT_PROVIDER;
  const m = model || cfg.DEFAULT_MODEL;
  if (p === 'anthropic') {
    if (!anthropic) throw new Error('Anthropic key missing. Add it in Settings.');
    return { provider: 'anthropic', model: m };
  }
  if (p === 'openai') {
    if (!openai) throw new Error('OpenAI key missing. Add it in Settings.');
    return { provider: 'openai', model: m };
  }
  throw new Error(`Unknown provider: ${p}`);
}

/** Stream model output as SSE: `delta`, `done`, `error` events. */
export async function streamLLM(res, target, { system, user, imageBase64 }) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const { openai, anthropic } = getProviders();

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    if (target.provider === 'anthropic') {
      const userContent = imageBase64
        ? [
            { type: 'image', source: { type: 'base64', media_type: 'image/png', data: imageBase64 } },
            { type: 'text', text: user }
          ]
        : user;

      const stream = anthropic.messages.stream({
        model: target.model,
        max_tokens: 2000,
        system,
        messages: [{ role: 'user', content: userContent }]
      });
      stream.on('text', (chunk) => send('delta', { text: chunk }));
      stream.on('error', (err) => send('error', { error: err.message }));
      await stream.finalMessage();
      send('done', {});
    } else {
      const userContent = imageBase64
        ? [
            { type: 'input_text', text: user },
            { type: 'input_image', image_url: `data:image/png;base64,${imageBase64}` }
          ]
        : user;

      const stream = await openai.responses.stream({
        model: target.model,
        input: [
          { role: 'system', content: system },
          { role: 'user', content: userContent }
        ]
      });
      stream.on('event', (event) => {
        if (event.type === 'response.output_text.delta') {
          send('delta', { text: event.delta });
        }
      });
      stream.on('error', (err) => send('error', { error: err.message }));
      await stream.finalResponse();
      send('done', {});
    }
  } catch (err) {
    send('error', { error: err.message });
  } finally {
    res.end();
  }
}
