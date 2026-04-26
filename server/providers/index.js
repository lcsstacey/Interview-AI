import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { env, hasAnthropic, hasOpenAI } from '../env.js';

export const openai = hasOpenAI ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;
export const anthropic = hasAnthropic ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

export function pickProvider({ provider, model } = {}) {
  const p = provider || env.DEFAULT_PROVIDER;
  const m = model || env.DEFAULT_MODEL;
  if (p === 'anthropic') {
    if (!anthropic) throw new Error('Anthropic key missing. Add ANTHROPIC_API_KEY to .env.');
    return { provider: 'anthropic', model: m };
  }
  if (p === 'openai') {
    if (!openai) throw new Error('OpenAI key missing. Add OPENAI_API_KEY to .env.');
    return { provider: 'openai', model: m };
  }
  throw new Error(`Unknown provider: ${p}`);
}

/**
 * Stream model output as Server-Sent Events with `delta`, `done`, `error` events.
 */
export async function streamLLM(res, target, { system, user, imageBase64 }) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

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
