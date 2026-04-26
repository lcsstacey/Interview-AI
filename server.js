const express = require('express');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenAI } = require('@google/genai');

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function getOpenAIClient(apiKey) {
  return new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
}

function getAnthropicClient(apiKey) {
  return new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });
}

function getGeminiClient(apiKey) {
  return new GoogleGenAI({ apiKey: apiKey || process.env.GEMINI_API_KEY });
}

async function generateWithProvider({ provider, model, apiKey, systemPrompt, userPrompt }) {
  if (provider === 'openai') {
    const client = getOpenAIClient(apiKey);
    const response = await client.responses.create({
      model: model || process.env.OPENAI_MODEL || 'gpt-5',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });
    return response.output_text || '';
  }

  if (provider === 'anthropic') {
    const client = getAnthropicClient(apiKey);
    const message = await client.messages.create({
      model: model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-0',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });
    const text = message.content.find((c) => c.type === 'text');
    return text?.text || '';
  }

  if (provider === 'gemini') {
    const client = getGeminiClient(apiKey);
    const response = await client.models.generateContent({
      model: model || process.env.GEMINI_MODEL || 'gemini-2.5-pro',
      contents: `${systemPrompt}\n\n${userPrompt}`
    });
    return response.text || '';
  }

  if (provider === 'ollama') {
    const ollamaModel = model || process.env.OLLAMA_MODEL || 'llama3.1:8b';
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
    const response = await fetch(`${ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama call failed: ${response.status}`);
    }

    const data = await response.json();
    return data.response || '';
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

app.post('/api/answer', async (req, res) => {
  try {
    const {
      question,
      transcript,
      resumeText,
      notesText,
      mode,
      provider = 'openai',
      model,
      apiKey
    } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const systemPrompt = `You are a real-time interview coach.
- Keep responses concise, practical, and speakable.
- Prioritize truthful answers and strong communication.
- For coding mode: include algorithm, edge cases, complexity, and final code.
- Never provide advice to deceive interviewers.`;

    const userPrompt = `Mode: ${mode || 'general'}
Question: ${question}

Live transcript context:
${transcript || 'N/A'}

Candidate resume context:
${resumeText || 'N/A'}

Supporting notes:
${notesText || 'N/A'}

Output format:
1) Best direct answer (30-60 seconds)
2) Optional follow-up points
3) If coding, a concise solution with complexity and test cases`;

    const answer = await generateWithProvider({ provider, model, apiKey, systemPrompt, userPrompt });

    res.json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Failed to generate answer: ${error.message}` });
  }
});

app.post('/api/summarize', async (req, res) => {
  try {
    const { transcript, provider = 'openai', model, apiKey } = req.body;
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: 'Transcript is required.' });
    }

    const summary = await generateWithProvider({
      provider,
      model,
      apiKey,
      systemPrompt: 'You produce concise interview debriefs.',
      userPrompt: `Summarize this interview transcript with sections:
- Key points
- Action items
- Weak spots
- 1-week improvement plan

${transcript}`
    });

    res.json({ summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Failed to summarize transcript: ${error.message}` });
  }
});

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const provider = req.body.provider || 'openai';
    const apiKey = req.body.apiKey;

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded.' });
    }

    if (provider !== 'openai') {
      return res.status(400).json({ error: 'Audio transcription currently supports OpenAI provider only.' });
    }

    const client = getOpenAIClient(apiKey);
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype || 'audio/webm' });
    const file = new File([blob], 'chunk.webm', { type: blob.type });

    const response = await client.audio.transcriptions.create({
      file,
      model: process.env.TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe'
    });

    res.json({ text: response.text || '' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Transcription failed: ${error.message}` });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const text = req.file.buffer.toString('utf-8');
    res.json({ text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to parse uploaded file.' });
  }
});

app.get('/health', (_, res) => {
  res.json({
    ok: true,
    providers: ['openai', 'anthropic', 'gemini', 'ollama'],
    transcribeProvider: 'openai'
  });
});

app.listen(PORT, () => {
  console.log(`Interview AI app running at http://localhost:${PORT}`);
});
