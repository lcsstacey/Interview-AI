const express = require('express');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const OpenAI = require('openai');

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 3000;
const MODEL = process.env.MODEL || 'gpt-5';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/answer', async (req, res) => {
  try {
    const { question, transcript, resumeText, notesText, mode } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const systemPrompt = `You are an interview practice assistant. Help the user answer clearly and honestly.
- Keep responses concise and spoken-word friendly.
- If mode is coding, provide steps + clean solution.
- Avoid advising deception or policy evasion.`;

    const userPrompt = `Mode: ${mode || 'general'}
Question: ${question}

Recent Transcript:\n${transcript || 'N/A'}

Resume Context:\n${resumeText || 'N/A'}

Supporting Notes:\n${notesText || 'N/A'}

Provide:
1) Best answer (sayable in 30-60s)
2) Bullet backup points
3) If coding: short pseudocode + complexity`;

    const response = await client.responses.create({
      model: MODEL,
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    res.json({
      answer: response.output_text || 'No response generated.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate answer.' });
  }
});

app.post('/api/summarize', async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: 'Transcript is required.' });
    }

    const response = await client.responses.create({
      model: MODEL,
      input: [
        {
          role: 'user',
          content: `Summarize this interview transcript. Return: key points, action items, and a 5-line study plan.\n\n${transcript}`
        }
      ]
    });

    res.json({ summary: response.output_text || 'No summary generated.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to summarize transcript.' });
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
  res.json({ ok: true, model: MODEL });
});

app.listen(PORT, () => {
  console.log(`Interview AI app running at http://localhost:${PORT}`);
});
