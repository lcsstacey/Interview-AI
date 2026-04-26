const express = require('express');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const pdfParse = require('pdf-parse');

dotenv.config();

const PORT = process.env.PORT || 3000;
const DEFAULT_PROVIDER = process.env.DEFAULT_PROVIDER || 'anthropic';
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'claude-sonnet-4-6';
const WHISPER_MODEL = process.env.WHISPER_MODEL || 'whisper-1';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const MODES = {
  general: `You are a calm, sharp interview copilot. Give the user a great, honest answer they can deliver out loud.
- 30-60 seconds when spoken.
- Plain language, first person, conversational.
- Pull from the user's resume and notes when relevant.
- No filler, no caveats, no "as an AI".`,
  behavioral: `You are a behavioral interview copilot. Use the STAR method (Situation, Task, Action, Result).
- Anchor every answer in a real story from the resume/notes when possible.
- 45-75 seconds when spoken.
- End with the measurable result.`,
  coding: `You are a coding interview copilot. The user is being asked a coding question, possibly LeetCode-style.
Output, in this exact order, using markdown:
1. **Clarifying questions** (1-2 short bullets the user should ask out loud).
2. **Approach** (3-5 bullets, plain English).
3. **Complexity** (time + space).
4. **Solution** in a fenced code block. Default to Python unless the question implies another language. Clean, idiomatic, runnable.
5. **Walkthrough** (2-3 bullets explaining the trickiest part).`,
  'system-design': `You are a system design interview copilot.
Give a structured answer:
1. **Clarify scope** (1-2 bullets).
2. **Functional + non-functional requirements**.
3. **High-level architecture** (components + data flow).
4. **Data model** (tables / key entities).
5. **Scale + bottlenecks** (caching, sharding, queues).
6. **Trade-offs** to mention out loud.`
};

function buildPrompt({ question, transcript, resumeText, notesText, mode }) {
  const system = MODES[mode] || MODES.general;
  const user = `# Mode
${mode || 'general'}

# Detected interviewer question
${question || '(no explicit question yet — answer the most recent thing in the transcript)'}

# Live transcript (most recent at bottom)
${transcript ? transcript.slice(-4000) : '(empty)'}

# Candidate resume
${resumeText ? resumeText.slice(0, 8000) : '(none)'}

# Candidate notes / knowledge base
${notesText ? notesText.slice(0, 8000) : '(none)'}

Answer now.`;
  return { system, user };
}

function pickProvider(provider, model) {
  const p = provider || DEFAULT_PROVIDER;
  const m = model || DEFAULT_MODEL;
  if (p === 'openai') {
    if (!openai) throw new Error('OPENAI_API_KEY not set');
    return { provider: 'openai', model: m };
  }
  if (p === 'anthropic') {
    if (!anthropic) throw new Error('ANTHROPIC_API_KEY not set');
    return { provider: 'anthropic', model: m };
  }
  throw new Error(`Unknown provider: ${p}`);
}

async function streamAnswer(res, { provider, model }, { system, user, imageBase64 }) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    if (provider === 'anthropic') {
      const userContent = imageBase64
        ? [
            { type: 'image', source: { type: 'base64', media_type: 'image/png', data: imageBase64 } },
            { type: 'text', text: user }
          ]
        : user;

      const stream = anthropic.messages.stream({
        model,
        max_tokens: 1500,
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
        model,
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

app.post('/api/answer', async (req, res) => {
  try {
    const { question, transcript, resumeText, notesText, mode, provider, model, imageBase64 } = req.body;
    if (!question && !transcript && !imageBase64) {
      return res.status(400).json({ error: 'Provide a question, transcript, or screenshot.' });
    }
    const target = pickProvider(provider, model);
    const { system, user } = buildPrompt({ question, transcript, resumeText, notesText, mode });
    await streamAnswer(res, target, { system, user, imageBase64 });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else res.end();
  }
});

app.post('/api/summarize', async (req, res) => {
  try {
    const { transcript, provider, model } = req.body;
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: 'Transcript is required.' });
    }
    const target = pickProvider(provider, model);
    const system = `You are a post-interview note taker.`;
    const user = `Summarize this interview into:
1. **Key points** discussed
2. **Action items** for the candidate
3. **Strengths shown**
4. **Weak spots / topics to study**
5. **5-line study plan**

Transcript:
${transcript}`;
    await streamAnswer(res, target, { system, user });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else res.end();
  }
});

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!openai) return res.status(400).json({ error: 'OPENAI_API_KEY not set (needed for Whisper).' });
    if (!req.file) return res.status(400).json({ error: 'No audio uploaded.' });

    const file = await OpenAI.toFile(req.file.buffer, req.file.originalname || 'audio.webm', {
      type: req.file.mimetype || 'audio/webm'
    });
    const result = await openai.audio.transcriptions.create({
      file,
      model: WHISPER_MODEL,
      response_format: 'json'
    });
    res.json({ text: result.text || '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const name = (req.file.originalname || '').toLowerCase();
    let text = '';
    if (name.endsWith('.pdf')) {
      const parsed = await pdfParse(req.file.buffer);
      text = parsed.text || '';
    } else {
      text = req.file.buffer.toString('utf-8');
    }
    res.json({ text: text.slice(0, 200000) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/config', (_, res) => {
  res.json({
    providers: {
      openai: !!openai,
      anthropic: !!anthropic
    },
    defaultProvider: DEFAULT_PROVIDER,
    defaultModel: DEFAULT_MODEL,
    models: {
      anthropic: ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
      openai: ['gpt-5', 'gpt-4.1', 'gpt-4o', 'gpt-4o-mini']
    }
  });
});

app.get('/health', (_, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`\n  Interview Copilot → http://localhost:${PORT}`);
  console.log(`  Provider: ${DEFAULT_PROVIDER}  Model: ${DEFAULT_MODEL}`);
  console.log(`  OpenAI: ${openai ? 'on' : 'off'}   Anthropic: ${anthropic ? 'on' : 'off'}\n`);
});
